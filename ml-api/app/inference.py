from typing import Optional
from sklearn.pipeline import Pipeline
import joblib
import pandas as pd

from scripts.config import FEATURES, MODEL_PATH

_model:Optional[Pipeline] = None

class ModelNotAvailiableError(RuntimeError):
    pass

class PredictionError(RuntimeError):
    pass

def get_model() -> Pipeline:
    """
    Load model only once
    """
    global _model

    try:
        if _model is None:
            _model = joblib.load(MODEL_PATH)
    except FileNotFoundError as error:
        raise ModelNotAvailiableError("Model file not found") from error

    if not isinstance(_model, Pipeline):
        raise ModelNotAvailiableError("Loaded model isn't a scikit-learn Pipeline. Make sure to save a pipeline, not classifier")

    return _model

def predict_churn(data: dict) -> dict:
    """
    Use trained model pipeline to predict churn
    """
    try:
        model = get_model()

        input_df = pd.DataFrame([data])

        input_df = input_df[FEATURES]

        probability = float(model.predict_proba(input_df)[0,1])
        prediction = int(probability >= 0.5)


        return {
            "churn_probability": round(probability, 4),
            "churn_prediction": prediction,
            "prediction_label": "Yes" if prediction == 1 else "No",
        }

    except ModelNotAvailiableError:
        raise

    except Exception as error:
        raise PredictionError(f"Prediction failed {str(error)}")
