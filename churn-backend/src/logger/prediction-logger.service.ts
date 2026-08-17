import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "path";

@Injectable()
export class PredictionLoggerService implements OnModuleInit {
    private readonly logger = new Logger(PredictionLoggerService.name)
    private readonly logDir = join(process.cwd(), 'logs')
    private readonly logFile = join(this.logDir, 'predictions.jsonl')

    async onModuleInit() {
        mkdir(this.logDir, { recursive: true });
    }

    getLogFile() {
        return this.logFile;
    }

    async log(entry: Record<string, unknown>) {
        try {
            const line = JSON.stringify({
                timestamp: new Date().toISOString(),
                ...entry
            });
            
            await appendFile(this.logFile, line + '\n', 'utf-8');
        } catch (error) {
            this.logger.error('Failed to write prediction log', error as Error);
        }
    }
}
