# Astrology Engine Architecture

**Status:** Phase 9 — Swiss Ephemeris (Lahiri) with stub fallback

## Role

Deterministic calculation service. Workers call it; customers never call it directly.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | `mode=swisseph\|stub`, version |
| POST | `/v1/calculate` | Birth payload → chart JSON |

## Calculation

1. Prefer **pyswisseph** Lahiri sidereal (`ADR-012`)
2. On import/runtime failure → deterministic stub (`placeholder: true`)
3. Worker last resort: `apps/worker/src/chart/local-chart.ts` if engine HTTP is down

## Chart payload (selected fields)

- `engineVersion`, `placeholder`, `system`, `ayanamsa`
- `lagna` (sign, degree, longitude, houseSystem=`WholeSign`)
- `planets[]` (name, sign, degree, longitude, house, retrograde)
- `houses[]`, `themes[]`, `notes[]`

## Local run

```bash
# With Docker (recommended on this Windows host)
docker compose up -d --build astrology-engine

# Or with Python 3.12+
cd services/astrology-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

## Related

- ADR-005, ADR-012
