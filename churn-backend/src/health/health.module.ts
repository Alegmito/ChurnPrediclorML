import { Module } from "@nestjs/common";
import { ChurnModule } from "src/churn/churn.module";
import { HealthController } from "./health.controller";

@Module({
    imports: [ChurnModule],
    controllers: [HealthController],
})
export class HealthModule {}
