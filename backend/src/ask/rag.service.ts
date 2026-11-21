import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';


export interface SourceChunk{
    source: string,
    chunkIndex: number,
    score: number
}

export interface AskResult{
    answer: string,
    sources: SourceChunk[]
}

@Injectable()
export class RagService {
    private readonly llm: OpenAI;
    private readonly qdrant: QdrantClient;
    private readonly embeddingModel: string;
    private readonly chatModel: string;
    private readonly collection: string;
    private readonly topK: number;
    
    constructor(config: ConfigService) {
        this.llm = new OpenAI({
            baseURL: config.get<string>('OMNIROUTE_BASE_URL', 'http://localhost:20128/v1'),
            apiKey: config.getOrThrow<string>('OMNIROUTE_API_KEY'),
        });

        this.qdrant = new QdrantClient({
            url: config.get<string>('QDRANT_URL', 'https://localhost:6333')
        });

        this.embeddingModel = config.getOrThrow<string>('EMBEDDING_MODEL');
        this.chatModel = config.getOrThrow<string>('CHAT_MODEL');
        this.collection = config.getOrThrow<string>('COLLECTION_NAME');
        this.topK = Number(config.getOrThrow<string>('TOP_K'));
    }

    private async embed(text: string): Promise<number[]> {
        const resp = await this.llm.embeddings.create({
            model: this.embeddingModel,
            input: text
        });
        return resp.data[0].embedding;
    }

    private buildPrompt(question: string, contexts: string[]): string{
        return (
            'Answer the question ONLY the context below.' +
            "If the context doesn't contain the answer, say you dont know. \n\n" +
            `Context:\n${contexts.join('\n\n---\n\n')}\n\n` +
            `Question: ${question}`
        );
    }
    async ask(question: string): Promise<AskResult> {
        const vector = await this.embed(question);

        const { points } = await this.qdrant.query(this.collection, {
            query: vector,
            limit: this.topK,
            with_payload: true,
        });
        
        if (!points.length) {
            return {
                answer: 'No Matching chunks found. Has the ingest script been run?',
                sources: []
            };
        }

        const contexts = points.map((p) => {
            const payload = (p.payload ?? {}) as Record<string, any>;
            return `[${payload.source} chunk ${payload.chunk_index}]\n${payload.text}`;
        });

        const completion = await this.llm.chat.completions.create({
            model: this.chatModel,
            messages: [{ role: 'user', content: this.buildPrompt(question, contexts) }],
        });

        return {
            answer: completion.choices[0].message.content ?? '',
            sources: points.map((p) => {
                const payload = (p.payload ?? {}) as Record<string, any>;
                return {
                    source: String(payload.source ?? 'unknown'),
                    chunkIndex: Number(payload.chunk_index ?? -1),
                    score: p.score
                };
            }),
        };
    }
}
