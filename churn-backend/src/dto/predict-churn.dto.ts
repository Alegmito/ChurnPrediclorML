import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, Min } from "class-validator";

export class PredictChurnDto {
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    tenure!: number

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    MonthlyCharges!: number

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    TotalCharges?: number;

    @IsIn(['Month-to-month', 'One year', 'Two year'])
    Contract!: string

    @IsIn([
        'Electronic check',
        'Mailed check',
        'Bank transfer (automatic)',
        'Credit card (automatic)',
    ])
    PaymentMethod!: string;
}
