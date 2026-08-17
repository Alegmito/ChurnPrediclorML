import { Module } from '@nestjs/common';
import { ChurnService } from './churn.service';
import { PredictionLoggerService } from 'src/logger/prediction-logger.service';
import { ChurnController } from './churn.controller';

@Module({
  controllers: [ChurnController],
  providers: [ChurnService, PredictionLoggerService],
  exports: [ChurnService],
})
export class ChurnModule {}
