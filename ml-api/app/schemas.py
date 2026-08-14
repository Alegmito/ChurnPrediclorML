from typing import Literal, Optional

from pydantic import BaseModel, Field

ContractType = Literal[
    "Month-to-month",
    "One Year",
    "Two Year"
]

PaymentMethodType = Literal[
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
]

class ChurnRequest(BaseModel):
    tenure: int = Field(..., ge=0, description="Number of months the customer has been with the company")
    MonthlyCharges: float = Field(..., ge=0)
    TotalCharges: Optional[float] = Field(None, ge=0)
    Contract: ContractType
    PaymentMethod: PaymentMethodType

class ChurnResponse(BaseModel):
    churn_probability: float = Field(..., ge=0, le=1)
    churn_prediction: int
    prediction_label: Literal["Yes", "No"]
