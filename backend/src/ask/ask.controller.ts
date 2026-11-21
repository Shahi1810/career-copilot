import { BadGatewayException, BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('ask')
export class AskController {
    constructor(private readonly ragService: RagService) { }
    
    @Post() 
    async sendResponse(@Body() body: { question?: string }){
        const question = body?.question?.trim();

        if (!question) {
            throw new BadRequestException('"question" is required');
        }

        try {
            return await this.ragService.ask(question);
        }

        catch (err) {
            throw new BadGatewayException(
                `RAG pipeline failed: ${(err as Error).message}`
            );
        }
    }
}
