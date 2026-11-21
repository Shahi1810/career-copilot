import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { AskController } from './ask.controller';

@Module({
  providers: [RagService],
  controllers: [AskController]
})
export class AskModule {}
