import { HttpException, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PredictChurnDto } from "src/dto/predict-churn.dto";
import { PredictionLoggerService } from "src/logger/prediction-logger.service";

@Injectable()
export class ChurnService {
    private readonly logger = new Logger(ChurnService.name)

    private readonly mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';

    constructor(
        private readonly predictionLogger: PredictionLoggerService
    ) {}

    async health() {
        try {
            const response = await fetch(`${this.mlApiUrl}/health`);

            const body = await response.json();

            return {
                status: 'ok',
                service: 'churn-backend',
                ml_service: response.ok ? 'up' : 'degraded',
                ml_response: body,
            };
        } catch (error) {
            return {
                status: 'ok',
                service: 'churn-backend',
                ml_service: 'down',
                ml_error: error instanceof Error ? error.message : 'Unknown ML API error',
            };
        }
    }

    async predict(dto: PredictChurnDto) {
        const requestId = randomUUID();

        await this.predictionLogger.log({
            requestId,
            event: 'prediction_requested',
            request: dto
        })

        try {
            const response = await fetch(`${this.mlApiUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dto),
            });
            const body = await response.json().catch(() => null);

            if (!response.ok) {
                await this.predictionLogger.log({
                    requestId,
                    event: 'ml_error',
                    status: response.status,
                    response: body,
                });

                const detail = body?.detail ?? `ML API returned status ${response.status}`;

                throw new HttpException(
                    {
                        success: false,
                        requestId,
                        message: 'ML service returned an error',
                        detail,
                    },
                    response.status,
                );
            }

            await this.predictionLogger.log({
                requestId,
                event: 'prediction_success',
                response: body,
            });

            return {
                success: true,
                requestId,
                data: body,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            await this.predictionLogger.log({
                requestId,
                event: 'prediction_failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            this.logger.error(
                `Prediction request failed: ${
                    error instanceof Error ? error.message : error
                }`,
            );

            throw new ServiceUnavailableException({
                success: false,
                requestId,
                message: 'ML service is unavailable',
            })
        }
    }
}
