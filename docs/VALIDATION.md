# Input Validation Guide

This document describes the validation system in nflreadts, including validation rules, constraints, and best practices.

## Table of Contents

- [Overview](#overview)
- [Validation Layer Architecture](#validation-layer-architecture)
- [Validation Rules and Constraints](#validation-rules-and-constraints)
- [Using Validation Functions](#using-validation-functions)
- [Type Coercion](#type-coercion)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

nflreadts provides a comprehensive validation system that ensures data integrity at every layer of the application. All user inputs are validated before processing, providing:

- **Type safety**: Runtime type guards ensure types match expectations
- **Early error detection**: Invalid inputs are caught before API calls
- **Clear error messages**: Validation errors include context and suggestions
- **Automatic coercion**: Optional type coercion for common scenarios
- **Performance**: Efficient validation with minimal overhead

## Validation Layer Architecture

The validation system is organized into three layers:

### 1. Core Validators (`src/utils/validation.ts`)

Low-level validation functions and type guards:

```typescript
- isValidSeason(season: number): boolean
- isValidWeek(week: number, seasonType?: SeasonType): boolean
- isValidTeam(team: string): boolean
- assertValidSeason(season: number): asserts season is Season
```

### 2. Centralized Validation Layer (`src/validation/index.ts`)

Higher-level validation with options and type coercion:

```typescript
- validateSeason(input: unknown, options?: SeasonValidationOptions): ValidationResult<Season>
- validateWeek(input: unknown, options?: WeekValidationOptions): ValidationResult<Week>
- validateTeam(input: unknown, options?: TeamValidationOptions): ValidationResult<TeamAbbr>
```

### 3. Data Loader Validation

Integration in data loading functions:

```typescript
// Automatic validation before API calls
const result = await loadSchedules([2020, 2021, 2022]);
// Validates all seasons before fetching
```

## Validation Rules and Constraints

### Season Validation

**Valid Range**: 1999 to current season + 1

**Rules**:
- Must be an integer
- Cannot be before 1999 (modern NFL era)
- Can be up to 1 year in the future (for scheduling)
- Some endpoints have different minimum years (e.g., rosters start at 1920)

**Examples**:
```typescript
// Valid
isValidSeason(2023);        // ✓ Current season
isValidSeason(2024);        // ✓ Next season (scheduling)
isValidSeason(1999);        // ✓ Minimum season

// Invalid
isValidSeason(1998);        // ✗ Before minimum
isValidSeason(2026);        // ✗ Too far in future
isValidSeason(2023.5);      // ✗ Not an integer
```

### Week Validation

**Valid Ranges** (season-type dependent):

| Season Type | Week Range | Description |
|-------------|------------|-------------|
| `REG` | 1-18 | Regular season |
| `POST` | 19-22 | Playoffs (Wild Card → Super Bowl) |
| `PRE` | 1-4 | Preseason |

**Rules**:
- Must be an integer
- Must be ≥ 1
- Maximum depends on season type
- POST weeks must be 19-22 (not 1-4)

**Examples**:
```typescript
// Valid
isValidWeek(10, 'REG');     // ✓ Mid-season
isValidWeek(19, 'POST');    // ✓ Wild Card
isValidWeek(22, 'POST');    // ✓ Super Bowl
isValidWeek(3, 'PRE');      // ✓ Preseason week 3

// Invalid
isValidWeek(0, 'REG');      // ✗ Week 0 doesn't exist
isValidWeek(19, 'REG');     // ✗ Week 19 is playoffs
isValidWeek(10, 'POST');    // ✗ POST weeks start at 19
isValidWeek(5, 'PRE');      // ✗ Preseason only has 4 weeks
```

### Team Validation

**Current Teams** (32 NFL teams):
```
AFC East:  BUF, MIA, NE, NYJ
AFC North: BAL, CIN, CLE, PIT
AFC South: HOU, IND, JAX, TEN
AFC West:  DEN, KC, LV, LAC
NFC East:  DAL, NYG, PHI, WAS
NFC North: CHI, DET, GB, MIN
NFC South: ATL, CAR, NO, TB
NFC West:  ARI, LA, SF, SEA
```

**Historical Teams**:
```
SD   - San Diego Chargers (now LAC)
STL  - St. Louis Rams (now LA)
OAK  - Oakland Raiders (now LV)
```

**Team Abbreviation Variations**:
```
LAR → LA   (Los Angeles Rams)
WSH → WAS  (Washington)
WFT → WAS  (Washington Football Team, historical)
```

**Rules**:
- Must be uppercase
- Must match current or historical team
- Can be normalized to handle variations

**Examples**:
```typescript
// Valid
isValidTeam('KC');                    // ✓ Kansas City Chiefs
isValidTeamOrHistorical('SD');        // ✓ San Diego (historical)
normalizeTeamAbbr('lar');            // 'LA'

// Invalid
isValidTeam('INVALID');              // ✗ Not a team
isValidTeam('kc');                   // ✗ Must be uppercase
isValidTeam('SD', false);            // ✗ Historical not allowed
```

### Format Validation

**Valid Formats**: `csv`, `parquet`, `json`, `rds`

Most endpoints support CSV and Parquet. Parquet is recommended for better performance.

### Game ID Validation

**Format**: `YYYY_WW_AWAY_HOME`

**Rules**:
- YYYY: Valid season year (≥ 1999)
- WW: Valid week number (01-22)
- AWAY/HOME: Team abbreviations

**Examples**:
```typescript
// Valid
isValidGameId('2023_01_KC_PHI');     // ✓
isValidGameId('2022_22_KC_PHI');     // ✓ Super Bowl

// Invalid
isValidGameId('2023_01_KC');         // ✗ Missing home team
isValidGameId('invalid');            // ✗ Wrong format
```

## Using Validation Functions

### Basic Validation (Boolean)

Use `isValid*` functions for simple checks:

```typescript
import { isValidSeason, isValidTeam, isValidWeek } from 'nflreadts';

if (isValidSeason(2023)) {
  // Season is valid
}

if (isValidWeek(10, 'REG')) {
  // Week is valid for regular season
}

if (isValidTeam('KC')) {
  // Team is valid
}
```

### Assert Validation (Throws)

Use `assertValid*` functions when you want to fail fast:

```typescript
import { assertValidSeason, assertValidTeam } from 'nflreadts';

try {
  assertValidSeason(1990);  // Throws ValidationError
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
    console.error(error.context);
  }
}
```

### Validation with Results

Use `validate*` functions for detailed results with type coercion:

```typescript
import { validateSeason, validateWeek, validateTeam } from 'nflreadts';

// Validate with coercion
const seasonResult = validateSeason('2023', { coerce: true });
if (seasonResult.valid) {
  const season: Season = seasonResult.value;  // Type-safe
} else {
  console.error(seasonResult.error?.message);
}

// Validate week with season type
const weekResult = validateWeek(10, { seasonType: 'REG' });

// Validate team with normalization
const teamResult = validateTeam('kc', { normalize: true });
// teamResult.value === 'KC'
```

### Array Validation

Validate multiple values at once:

```typescript
import { validateSeasons, validateTeams } from 'nflreadts';

// Validate multiple seasons
const seasonsResult = validateSeasons([2020, 2021, 2022]);
if (seasonsResult.valid) {
  const seasons: Season[] = seasonsResult.value;
}

// Validate with options
const teamsResult = validateTeams(
  ['KC', 'SF', 'kc'],  // Will be normalized
  { normalize: true },  // Team options
  { unique: true }      // Array options (remove duplicates)
);
// teamsResult.value === ['KC', 'SF']

// Respect array constraints
const limitedResult = validateSeasons(
  [2020],
  {},
  { minLength: 2 }  // Require at least 2 seasons
);
// limitedResult.valid === false
```

## Type Coercion

The validation layer supports automatic type coercion for common scenarios:

### Number Coercion

```typescript
// String to number
validateSeason('2023', { coerce: true });
// → { valid: true, value: 2023 }

// With whitespace
validateWeek('  10  ', { coerce: true });
// → { valid: true, value: 10 }

// Invalid coercion
validateSeason('abc', { coerce: true });
// → { valid: false, error: ValidationError }
```

### String Coercion

```typescript
// Uppercase coercion
validateTeam('kc', { coerce: true });
// → { valid: true, value: 'KC' }

// Normalization
validateTeam('lar', { normalize: true });
// → { valid: true, value: 'LA' }
```

### Array Coercion

```typescript
// Single value → array
validateSeasons(2023);
// → { valid: true, value: [2023] }

// Array passthrough
validateSeasons([2020, 2021]);
// → { valid: true, value: [2020, 2021] }
```

### Sanitization

Clean inputs before validation:

```typescript
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeArray
} from 'nflreadts/validation';

sanitizeString('  hello  ');          // 'hello'
sanitizeNumber(42);                   // 42
sanitizeNumber(NaN);                  // NaN
sanitizeArray([1, null, 2, undefined]); // [1, 2]
```

## Error Handling

### ValidationError Structure

All validation errors are instances of `ValidationError`:

```typescript
interface ValidationError extends Error {
  code: ErrorCode;           // Error code enum
  context?: Record<string, unknown>;  // Additional context
  message: string;           // Human-readable message
}
```

### Error Codes

```typescript
enum ErrorCode {
  INVALID_SEASON = 'INVALID_SEASON',
  INVALID_WEEK = 'INVALID_WEEK',
  INVALID_TEAM = 'INVALID_TEAM',
  INVALID_PLAYER = 'INVALID_PLAYER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
}
```

### Handling Validation Errors

```typescript
import { validateSeason, ValidationError, ErrorCode } from 'nflreadts';

const result = validateSeason(input);

if (!result.valid) {
  const error = result.error!;

  switch (error.code) {
    case ErrorCode.INVALID_SEASON:
      console.error(`Season ${error.context?.season} is invalid`);
      console.error(`Valid range: ${error.context?.minSeason}-${error.context?.maxSeason}`);
      break;

    case ErrorCode.INVALID_PARAMETER:
      console.error('Invalid parameter:', error.context);
      break;
  }
}
```

### Error Messages

Validation errors include helpful context:

```typescript
// Season too old
validateSeason(1990);
// Error: "Invalid season: 1990. Must be between 1999 and 2025"

// Week invalid for season type
validateWeek(19, { seasonType: 'REG' });
// Error: "Invalid week: 19 for season type REG. Must be between 1 and 18"

// Invalid team
validateTeam('INVALID');
// Error: "Invalid team abbreviation: INVALID"
```

## Best Practices

### 1. Validate at the Boundary

Validate inputs as soon as they enter your system:

```typescript
async function fetchSchedule(season: unknown) {
  // Validate immediately
  const result = validateSeason(season, { coerce: true });
  if (!result.valid) {
    return Err(result.error!);
  }

  // Now safe to use
  return await loadSchedules(result.value);
}
```

### 2. Use Type Guards for Type Narrowing

```typescript
import { isSeasonType, isTeamAbbrType } from 'nflreadts/validation';

function processSeason(input: unknown) {
  if (isSeasonType(input)) {
    // TypeScript knows input is Season here
    const season: Season = input;
  }
}
```

### 3. Leverage Coercion for User Input

```typescript
// Handle user input flexibly
const userSeasonInput = document.getElementById('season').value;
const result = validateSeason(userSeasonInput, { coerce: true });
```

### 4. Provide Clear Error Messages to Users

```typescript
const result = validateSeasons(userInput);
if (!result.valid) {
  displayError(`
    Invalid seasons provided.
    ${result.error?.message}
    Please enter seasons between ${MIN_SEASON} and ${getCurrentSeason()}.
  `);
}
```

### 5. Use Array Validation Options

```typescript
// Ensure unique values
validateTeams(teams, {}, { unique: true });

// Enforce constraints
validateSeasons(seasons, {}, {
  minLength: 1,
  maxLength: 10,
  unique: true
});
```

### 6. Combine Validators

```typescript
function validateGameParameters(params: {
  season?: unknown;
  week?: unknown;
  team?: unknown;
}) {
  const errors: string[] = [];

  if (params.season) {
    const result = validateSeason(params.season);
    if (!result.valid) errors.push(result.error!.message);
  }

  if (params.week) {
    const result = validateWeek(params.week);
    if (!result.valid) errors.push(result.error!.message);
  }

  if (params.team) {
    const result = validateTeam(params.team);
    if (!result.valid) errors.push(result.error!.message);
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
```

## Migration Guide

### From Manual Validation

**Before:**
```typescript
function loadData(season: number) {
  if (season < 1999 || season > 2024) {
    throw new Error('Invalid season');
  }
  // ...
}
```

**After:**
```typescript
import { assertValidSeason } from 'nflreadts';

function loadData(season: number) {
  assertValidSeason(season);  // Throws ValidationError
  // ...
}
```

### From Boolean Checks to Results

**Before:**
```typescript
if (!isValidSeason(input)) {
  throw new Error('Invalid season');
}
const season = input as Season;
```

**After:**
```typescript
const result = validateSeason(input);
if (!result.valid) {
  return Err(result.error!);
}
const season = result.value;  // Type-safe
```

### Adding Validation to Existing Functions

**Before:**
```typescript
async function getSchedules(seasons: number[]) {
  return await loadSchedules(seasons);
}
```

**After:**
```typescript
import { validateSeasons } from 'nflreadts';

async function getSchedules(seasons: unknown) {
  const result = validateSeasons(seasons, { coerce: true });
  if (!result.valid) {
    return Err(result.error!);
  }

  return await loadSchedules(result.value);
}
```

## Validation in Data Loaders

All data loading functions now validate inputs automatically:

```typescript
import { loadSchedules, loadRosters, loadPlayers, loadTeams } from 'nflreadts';

// Season validation
await loadSchedules([2020, 2021]);  // ✓ Validated
await loadSchedules([1990]);        // ✗ ValidationError thrown

// Format validation
await loadPlayers({ format: 'parquet' });  // ✓ Validated
await loadPlayers({ format: 'xml' });      // ✗ ValidationError thrown

// Team validation (where applicable)
// Teams are validated when used as parameters
```

## Additional Resources

- [Type Definitions](./TYPES.md) - Complete type definitions
- [Error Handling](../README.md#error-handling) - General error handling guide
- [API Reference](./API.md) - Full API documentation

## Examples

See [`tests/validation/`](../tests/validation/) for comprehensive validation examples:

- [`seasons.test.ts`](../tests/validation/seasons.test.ts) - Season validation examples
- [`teams.test.ts`](../tests/validation/teams.test.ts) - Team validation examples
- [`weeks.test.ts`](../tests/validation/weeks.test.ts) - Week validation examples
- [`edge-cases.test.ts`](../tests/validation/edge-cases.test.ts) - Edge cases and complex scenarios
