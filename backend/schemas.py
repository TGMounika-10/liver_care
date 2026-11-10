from typing import Union, Optional
from pydantic import BaseModel, Field, field_validator


class PatientInput(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Patient age in years (1 - 120)")
    gender: Union[int, str] = Field(..., description="1 / 'Male' or 0 / 'Female'")
    total_bilirubin: float = Field(..., ge=0.1, le=100.0, description="Total Bilirubin in mg/dL")
    direct_bilirubin: float = Field(..., ge=0.0, le=50.0, description="Direct Bilirubin in mg/dL")
    albumin: float = Field(..., ge=0.5, le=10.0, description="Serum Albumin in g/dL")
    alkaline_phosphatase: float = Field(..., ge=10.0, le=2000.0, description="Alkaline Phosphatase in U/L")
    sgot: float = Field(..., ge=5.0, le=2000.0, description="SGOT / AST in U/L")
    cholesterol: float = Field(..., ge=50.0, le=1000.0, description="Total Cholesterol in mg/dL")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: Union[int, str]) -> int:
        if isinstance(v, int):
            if v in (0, 1):
                return v
            raise ValueError("Gender integer must be 0 (Female) or 1 (Male)")
        if isinstance(v, str):
            val = v.strip().lower()
            if val in ("male", "m", "1"):
                return 1
            if val in ("female", "f", "0"):
                return 0
        raise ValueError("Gender must be 'Male'/1 or 'Female'/0")

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 52,
                "gender": 0,
                "total_bilirubin": 1.1,
                "direct_bilirubin": 0.4,
                "albumin": 3.8,
                "alkaline_phosphatase": 90,
                "sgot": 42,
                "cholesterol": 170,
            }
        }
    }


class PredictionResponse(BaseModel):
    id: int
    result: str
    probability: float
    risk_level: str
    stage: Optional[str] = None
    database_backend: str


class HistoryRecord(BaseModel):
    id: int
    age: int
    gender: str
    total_bilirubin: float
    direct_bilirubin: float
    albumin: float
    alkaline_phosphatase: float
    sgot: float
    cholesterol: float
    result: str
    probability: float
    created_at: str
    formatted_date: str

