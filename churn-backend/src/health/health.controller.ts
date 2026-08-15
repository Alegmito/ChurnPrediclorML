import { Controller, Get } from "@nestjs/common";
import { ChurnService } from "src/churn/churn.service";

@Controller('health')
export class HealthController {
    constructor(private readonly churnService: ChurnService) {}

    @Get()
    health() {
        return this.churnService.health();
    }
}
