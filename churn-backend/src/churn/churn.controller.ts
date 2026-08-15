import { Body, Controller, Post } from "@nestjs/common";
import { ChurnService } from "./churn.service";
import { PredictChurnDto } from "src/dto/predict-churn.dto";

@Controller('api/v1/churn')
export class ChurnController {
    constructor(private readonly churnService: ChurnService) {}

    @Post('predict')
    predict(@Body() dto: PredictChurnDto) {
        return this.churnService.predict(dto);
    }
}
