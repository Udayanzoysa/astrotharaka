from datetime import date, time
from typing import Any, Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .chart_service import calculate_chart, engine_mode
from .swiss_chart import swiss_available

app = FastAPI(title="AstroGuruAI Astrology Engine", version="0.3.0")


class CalculateRequest(BaseModel):
    birthProfileId: Optional[str] = None
    fullName: str = Field(min_length=1)
    birthDate: date
    birthTime: Optional[time] = None
    unknownBirthTime: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: str = "Asia/Colombo"
    language: Literal["en", "si", "ta"] = "en"


class CalculateResponse(BaseModel):
    engineVersion: str
    placeholder: bool
    system: str = "sidereal-stub"
    ayanamsa: Any = None
    birthProfileId: Optional[str]
    language: str
    lagna: dict
    planets: list
    houses: list
    themes: list[str]
    notes: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    mode = engine_mode()
    return {
        "status": "ok",
        "service": "astrology-engine",
        "version": "0.3.0",
        "mode": mode,
        "swisseph": "available" if swiss_available() else "unavailable",
    }


@app.post("/v1/calculate", response_model=CalculateResponse)
def calculate(payload: CalculateRequest) -> CalculateResponse:
    chart = calculate_chart(
        birth_profile_id=payload.birthProfileId,
        full_name=payload.fullName,
        birth_date=payload.birthDate,
        birth_time=payload.birthTime,
        unknown_birth_time=payload.unknownBirthTime,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timezone_name=payload.timezone,
        language=payload.language,
    )
    return CalculateResponse(**chart)
