# Birth Profiles Module

**Status:** Implemented (Phase 1 CRUD)

## Scope

- Authenticated CRUD for birth profiles
- Required: fullName, birthDate, birthPlaceName
- birthTime required unless `unknownBirthTime: true` (BR-003 warning returned)
- Optional coordinates, timezone, language, notes
- Creating a profile enqueues `astrology.calculate` (best-effort if Redis down)

## Files

- `apps/api/src/birth-profiles/`
- Prisma: `BirthProfile`
