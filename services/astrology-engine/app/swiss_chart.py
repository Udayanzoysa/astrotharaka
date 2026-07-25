from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Any, Optional
from zoneinfo import ZoneInfo

from .stub_chart import HOUSE_THEMES, longitude_to_sign_degree

ENGINE_VERSION = "swisseph-lahiri-0.3.0"


def swiss_available() -> bool:
    try:
        import swisseph as swe  # noqa: F401

        return True
    except Exception:
        return False


def _to_ut_julian(
    birth_date: date,
    birth_time: Optional[time],
    tz_name: str,
    unknown_birth_time: bool,
) -> tuple[float, bool]:
    import swisseph as swe

    local_tz = ZoneInfo(tz_name)
    clock = time(12, 0, 0) if (unknown_birth_time or birth_time is None) else birth_time
    used_noon = unknown_birth_time or birth_time is None
    local_dt = datetime(
        birth_date.year,
        birth_date.month,
        birth_date.day,
        clock.hour,
        clock.minute,
        clock.second,
        tzinfo=local_tz,
    )
    ut = local_dt.astimezone(timezone.utc)
    jd = swe.julday(
        ut.year,
        ut.month,
        ut.day,
        ut.hour + ut.minute / 60.0 + ut.second / 3600.0,
    )
    return jd, used_noon


def _house_for_longitude(longitude: float, asc_longitude: float) -> int:
    """Whole-sign house from Lagna (common Vedic presentation)."""
    planet_sign = int((longitude % 360.0) // 30)
    lagna_sign = int((asc_longitude % 360.0) // 30)
    return ((planet_sign - lagna_sign) % 12) + 1


def build_swiss_chart(
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
    import swisseph as swe

    lat = latitude if latitude is not None else 6.9271
    lon = longitude if longitude is not None else 79.8612
    tz_name = timezone_name or "Asia/Colombo"

    # Prefer package ephemeris path when present
    try:
        import os

        ephe = os.environ.get("SE_EPHE_PATH") or os.environ.get("SWISSEPH_PATH")
        if ephe:
            swe.set_ephe_path(ephe)
    except Exception:
        pass

    swe.set_sid_mode(swe.SIDM_LAHIRI)
    jd, used_noon = _to_ut_julian(birth_date, birth_time, tz_name, unknown_birth_time)
    flags = swe.FLG_SWIEPH | swe.FLG_SIDEREAL | swe.FLG_SPEED

    # Houses / Ascendant (sidereal)
    _cusps, ascmc = swe.houses_ex(jd, lat, lon, b"P", flags=swe.FLG_SIDEREAL)
    asc_lon = float(ascmc[0]) % 360.0
    asc_sign, asc_deg = longitude_to_sign_degree(asc_lon)

    bodies = [
        ("Sun", swe.SUN),
        ("Moon", swe.MOON),
        ("Mercury", swe.MERCURY),
        ("Venus", swe.VENUS),
        ("Mars", swe.MARS),
        ("Jupiter", swe.JUPITER),
        ("Saturn", swe.SATURN),
        ("Rahu", swe.TRUE_NODE),
    ]

    planets: list[dict[str, Any]] = []
    for name, body in bodies:
        xx, _retflag = swe.calc_ut(jd, body, flags)
        body_lon = float(xx[0]) % 360.0
        speed = float(xx[3]) if len(xx) > 3 else 0.0
        sign, degree = longitude_to_sign_degree(body_lon)
        planets.append(
            {
                "name": name,
                "sign": sign,
                "degree": round(degree, 4),
                "longitude": round(body_lon, 4),
                "house": _house_for_longitude(body_lon, asc_lon),
                "retrograde": speed < 0,
            }
        )

    rahu = next(p for p in planets if p["name"] == "Rahu")
    ketu_lon = (float(rahu["longitude"]) + 180.0) % 360.0
    ketu_sign, ketu_deg = longitude_to_sign_degree(ketu_lon)
    planets.append(
        {
            "name": "Ketu",
            "sign": ketu_sign,
            "degree": round(ketu_deg, 4),
            "longitude": round(ketu_lon, 4),
            "house": _house_for_longitude(ketu_lon, asc_lon),
            "retrograde": True,
        }
    )

    # Order like previous stub for stable UI
    order = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]
    planets.sort(key=lambda p: order.index(p["name"]) if p["name"] in order else 99)

    lagna_sign_idx = int(asc_lon // 30) % 12
    houses = []
    for i, theme in enumerate(HOUSE_THEMES):
        cusp = (lagna_sign_idx * 30 + i * 30) % 360.0
        sign, _deg = longitude_to_sign_degree(cusp)
        houses.append(
            {
                "number": i + 1,
                "sign": sign,
                "theme": theme,
                "cuspLongitude": round(cusp, 4),
            }
        )

    sun = next(p for p in planets if p["name"] == "Sun")
    moon = next(p for p in planets if p["name"] == "Moon")
    themes = [
        f"Lagna in {asc_sign} frames identity and initiative",
        f"Sun in {sun['sign']} (H{sun['house']}) colours vitality and direction",
        f"Moon in {moon['sign']} (H{moon['house']}) colours emotional pacing",
    ]

    ayanamsa = float(swe.get_ayanamsa_ut(jd))
    notes = [
        "Calculated with Swiss Ephemeris (Lahiri sidereal).",
        f"Ayanamsa ≈ {ayanamsa:.4f}°.",
        f"Native: {full_name}.",
    ]
    if used_noon:
        notes.append("Birth time unknown/approximate — used local noon; house emphasis softened.")

    return {
        "engineVersion": ENGINE_VERSION,
        "placeholder": False,
        "system": "sidereal-lahiri",
        "ayanamsa": round(ayanamsa, 4),
        "birthProfileId": birth_profile_id,
        "language": language,
        "lagna": {
            "sign": asc_sign,
            "degree": round(asc_deg, 4),
            "longitude": round(asc_lon, 4),
            "houseSystem": "WholeSign",
        },
        "planets": planets,
        "houses": houses,
        "themes": themes,
        "notes": notes,
    }
