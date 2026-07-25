from __future__ import annotations

from datetime import date, time
from typing import Any, Optional

from .stub_chart import build_stub_chart
from .swiss_chart import build_swiss_chart, swiss_available


def calculate_chart(
    *,
    birth_profile_id: Optional[str],
    full_name: str,
    birth_date: date,
    birth_time: Optional[time],
    unknown_birth_time: bool,
    latitude: Optional[float],
    longitude: Optional[float],
    timezone_name: str,
    language: str,
) -> dict[str, Any]:
    if swiss_available():
        try:
            return build_swiss_chart(
                birth_profile_id=birth_profile_id,
                full_name=full_name,
                birth_date=birth_date,
                birth_time=birth_time,
                unknown_birth_time=unknown_birth_time,
                latitude=latitude,
                longitude=longitude,
                timezone_name=timezone_name,
                language=language,
            )
        except Exception as exc:  # noqa: BLE001 — fall back for missing ephe files etc.
            chart = build_stub_chart(
                birth_profile_id=birth_profile_id,
                full_name=full_name,
                birth_date=birth_date,
                unknown_birth_time=unknown_birth_time,
                latitude=latitude,
                longitude=longitude,
                language=language,
            )
            chart["notes"] = [
                f"Swiss Ephemeris failed ({exc}); using stub fallback.",
                *chart["notes"],
            ]
            return chart

    return build_stub_chart(
        birth_profile_id=birth_profile_id,
        full_name=full_name,
        birth_date=birth_date,
        unknown_birth_time=unknown_birth_time,
        latitude=latitude,
        longitude=longitude,
        language=language,
    )


def engine_mode() -> str:
    return "swisseph" if swiss_available() else "stub"
