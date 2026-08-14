from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.inference import ModelNotAvailiableError, PredictionError, get_model, predict_churn
from app.schemas import ChurnRequest, ChurnResponse

app = FastAPI(
    title="Churn Prediction API",
    description="API for customer churn prediction",
    version="1.0.0",
)

@app.get("/health")
def health():
    try:
        get_model()
        return {
            "status": "ok",
            "model_status": "loaded",
        }
    except ModelNotAvailiableError as error:
        return JSONResponse(
                status_code=503,
                content={
                    "status": "error",
                    "model_status": "failed_to_load",
                    "detail": str(error),
                    },
                )

@app.post("/predict", response_model=ChurnResponse)
def predict(request: ChurnRequest):
    try:
        result = predict_churn(request.model_dump())
        return result
    except ModelNotAvailiableError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        )
    except PredictionError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
