export type ChurnPayload = {
    tenure: number;
    MonthlyCharges: number;
    TotalCharges?: number;
    Contract: string;
    PaymentMethod: string;
};

export type PredictionResult = {
    churn_probability: number;
    churn_prediction: number;
    prediction_label: "Yes" | "No";
};

export type PredictionApiResponse = {
    success: boolean;
    requestId: string;
    data: PredictionResult;
};

export type HealthResponse = {
    status: string;
    service: string;
    ml_service: string;
    ml_response? : {
        status?: string;
        model_status?: string;
    };
    ml_error?: string;
};

export type HistoryItem = {
    timestamp: string;
    requestId: string;
    event: string;
    request?: Record<string, unknown>;
    response?: PredictionResult;
};
