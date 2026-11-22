export interface SourceChunk {
  source: string;
  chunkIndex: number;
  score: number;
}

export interface AskResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  timestamp: string;
  error?: boolean;
}

export type ActiveTab = "chat" | "applications" | "jobs" | "notes";
