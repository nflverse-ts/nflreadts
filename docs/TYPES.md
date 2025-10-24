## Type System Documentation

nflreadts provides a comprehensive, type-safe API for working with NFL data. This document describes the type system.

## Table of Contents

- [Common Types](#common-types)
- [Team Types](#team-types)
- [Player Types](#player-types)
- [Utility Types](#utility-types)
- [Error Types](#error-types)
- [Result Pattern](#result-pattern)

## Common Types

### Basic NFL Types

```typescript
import type { Season, Week, SeasonType, TeamAbbr, PlayerId, GameId } from 'nflreadts';

// Season (year)
const season: Season = 2023;

// Week number (1-22)
const week: Week = 1;

// Season type
const seasonType: SeasonType = 'REG'; // 'REG' | 'POST' | 'PRE'

// Team abbreviation
const team: TeamAbbr = 'KC';

// Player ID (GSIS format)
const playerId: PlayerId = '00-0033873';

// Game ID
const gameId: GameId = '2023_01_KC_PHI';
```

### Positions and Play Types

```typescript
import type { Position, PlayType, Down } from 'nflreadts';

const position: Position = 'QB';  // QB, RB, WR, etc.
const playType: PlayType = 'pass'; // pass, run, punt, etc.
const down: Down = 1; // 1, 2, 3, or 4
```

### Conference and Division

```typescript
import type { Conference, Division, FullDivision } from 'nflreadts';

const conf: Conference = 'AFC'; // 'AFC' | 'NFC'
const div: Division = 'West';   // 'East' | 'West' | 'North' | 'South'
const fullDiv: FullDivision = 'AFC West';
```

## Team Types

### Team Interface

```typescript
import type { Team } from 'nflreadts';

const team: Team = {
  team_abbr: 'KC',
  team_name: 'Kansas City Chiefs',
  team_location: 'Kansas City',
  team_nick: 'Chiefs',
  team_conf: 'AFC',
  team_division: 'West',
  team_color: '#E31837',
  team_color2: '#FFB612',
  team_logo_espn: 'https://...',
  stadium: 'GEHA Field at Arrowhead Stadium',
  stadium_location: 'Kansas City, MO',
};
```

### Valid Team Abbreviations

```typescript
import { NFL_TEAMS, HISTORICAL_TEAMS } from 'nflreadts';
import type { ValidTeamAbbr, HistoricalTeamAbbr, AnyTeamAbbr } from 'nflreadts';

// Current teams (32)
console.log(NFL_TEAMS); // ['BUF', 'MIA', 'NE', 'NYJ', ...]

// Historical teams (relocated/renamed)
console.log(HISTORICAL_TEAMS); // ['SD', 'STL', 'OAK']

// Type-safe team abbreviations
const currentTeam: ValidTeamAbbr = 'KC';
const historicalTeam: HistoricalTeamAbbr = 'SD';
const anyTeam: AnyTeamAbbr = 'KC'; // Accepts both current and historical
```

## Player Types

### Player Interface

```typescript
import type { Player } from 'nflreadts';

const player: Player = {
  player_id: '00-0033873',
  player_name: 'Patrick Mahomes',
  first_name: 'Patrick',
  last_name: 'Mahomes',
  position: 'QB',
  team: 'KC',
  jersey_number: 15,
  height: 75, // inches
  weight: 230, // pounds
  birth_date: '1995-09-17',
  college: 'Texas Tech',
  draft_year: 2017,
  draft_round: 1,
  draft_pick: 10,
  status: 'ACT',
};
```

### Player Statistics

```typescript
import type {
  PassingStats,
  RushingStats,
  ReceivingStats,
  DefensiveStats,
  KickingStats,
} from 'nflreadts';

// Passing stats
const passingStats: PassingStats = {
  player_id: '00-0033873',
  player_name: 'Patrick Mahomes',
  season: 2023,
  week: 1,
  team: 'KC',
  position: 'QB',
  attempts: 35,
  completions: 25,
  passing_yards: 325,
  passing_tds: 3,
  interceptions: 0,
  completion_percentage: 71.4,
  passing_epa: 0.25,
};

// Rushing stats
const rushingStats: RushingStats = {
  player_id: '00-0036945',
  player_name: 'Isiah Pacheco',
  season: 2023,
  week: 1,
  team: 'KC',
  position: 'RB',
  carries: 18,
  rushing_yards: 95,
  rushing_tds: 1,
  rushing_epa: 0.15,
};
```

### Roster Entry

```typescript
import type { RosterEntry } from 'nflreadts';

const rosterEntry: RosterEntry = {
  player_id: '00-0033873',
  player_name: 'Patrick Mahomes',
  position: 'QB',
  team: 'KC',
  season: 2023,
  week: 1,
  depth_chart_position: 'QB',
  depth_order: 1, // 1 = starter
  jersey_number: 15,
  status: 'ACT',
};
```

## Utility Types

### Type Transformers

```typescript
import type { RequireFields, OptionalFields, Nullable } from 'nflreadts';

interface Example {
  required: string;
  optional?: number;
  nullable: boolean | null;
}

// Make specific fields required
type RequiredExample = RequireFields<Example, 'optional'>;
// { required: string; optional: number; nullable: boolean | null }

// Make specific fields optional
type OptionalExample = OptionalFields<Example, 'required'>;
// { required?: string; optional?: number; nullable: boolean | null }

// Make all fields nullable
type NullableExample = Nullable<Example>;
// { required: string | null; optional?: number | null; nullable: boolean | null }
```

### Data Loading Types

```typescript
import type {
  LoadOptions,
  FilterOptions,
  PaginatedResponse,
  DataState,
} from 'nflreadts';

// Load options for API calls
const options: LoadOptions = {
  limit: 100,
  offset: 0,
  sortBy: 'week',
  sortOrder: 'desc',
  forceRefresh: true, // Bypass cache
  signal: new AbortController().signal, // For cancellation
};

// Paginated response
const response: PaginatedResponse<Player> = {
  data: [], // Array of players
  total: 1000,
  offset: 0,
  limit: 100,
  hasMore: true,
};

// Data loading state
type PlayerDataState = DataState<Player[]>;

const loadingState: PlayerDataState = { status: 'loading' };
const successState: PlayerDataState = { status: 'success', data: [] };
const errorState: PlayerDataState = { status: 'error', error: new Error() };
```

### Type Guards

```typescript
import { isSuccess, isError, isLoading } from 'nflreadts';
import type { DataState } from 'nflreadts';

function handleDataState(state: DataState<number>) {
  if (isLoading(state)) {
    console.log('Loading...');
  } else if (isSuccess(state)) {
    console.log('Data:', state.data); // TypeScript knows state.data exists
  } else if (isError(state)) {
    console.error('Error:', state.error); // TypeScript knows state.error exists
  }
}
```

### Range Types

```typescript
import type { Range, SeasonRange, WeekRange } from 'nflreadts';

const seasonRange: SeasonRange = {
  min: 2020,
  max: 2023,
};

const weekRange: WeekRange = {
  min: 1,
  max: 18,
};

// Generic range
const scoreRange: Range<number> = {
  min: 0,
  max: 100,
};
```

## Error Types

### Error Classes

```typescript
import {
  NflReadError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  DataNotFoundError,
  InvalidDataError,
  ValidationError,
  ErrorCode,
} from 'nflreadts';

// Base error
try {
  throw new NflReadError(
    'Something went wrong',
    ErrorCode.UNKNOWN_ERROR,
    { season: 2023 }, // context
  );
} catch (error) {
  if (error instanceof NflReadError) {
    console.log(error.code); // ErrorCode.UNKNOWN_ERROR
    console.log(error.context); // { season: 2023 }
    console.log(error.toJSON()); // Serializable error
  }
}

// Network errors
try {
  throw new NetworkError('Failed to fetch data');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log(error.code); // ErrorCode.NETWORK_ERROR
  }
}

// Timeout errors
throw new TimeoutError('Request timed out after 30s');

// Rate limit errors
throw new RateLimitError('Rate limit exceeded', Date.now() + 60000);

// Data errors
throw new DataNotFoundError('No data for season 2025');
throw new InvalidDataError('Invalid JSON format');

// Validation errors
throw new ValidationError('Invalid season', ErrorCode.INVALID_SEASON, { season: -1 });
```

### Error Codes

```typescript
import { ErrorCode } from 'nflreadts';

// Available error codes
ErrorCode.NETWORK_ERROR
ErrorCode.TIMEOUT
ErrorCode.RATE_LIMIT
ErrorCode.DATA_NOT_FOUND
ErrorCode.INVALID_DATA
ErrorCode.PARSE_ERROR
ErrorCode.INVALID_SEASON
ErrorCode.INVALID_WEEK
ErrorCode.INVALID_TEAM
ErrorCode.INVALID_PLAYER
ErrorCode.INVALID_PARAMETER
ErrorCode.CONFIG_ERROR
ErrorCode.CACHE_ERROR
ErrorCode.UNKNOWN_ERROR
```

## Result Pattern

nflreadts uses the Result pattern for operations that can fail, providing type-safe error handling.

### Basic Usage

```typescript
import { Ok, Err, isOk, isErr, unwrap, unwrapOr } from 'nflreadts';
import type { Result } from 'nflreadts';

function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) {
    return Err(new Error('Division by zero'));
  }
  return Ok(a / b);
}

// Check result type
const result = divide(10, 2);

if (isOk(result)) {
  console.log('Success:', result.value); // TypeScript knows result.value exists
} else {
  console.error('Error:', result.error); // TypeScript knows result.error exists
}

// Unwrap (throws on error)
const value = unwrap(divide(10, 2)); // 5
// unwrap(divide(10, 0)); // Throws Error

// Unwrap with default
const safeValue = unwrapOr(divide(10, 0), 0); // 0
```

### Transforming Results

```typescript
import { mapResult, mapError, Ok, Err } from 'nflreadts';
import { NflReadError, ErrorCode } from 'nflreadts';

// Map successful result
const result = Ok(5);
const doubled = mapResult(result, (x) => x * 2);
// doubled = Ok(10)

// Map error
const error = Err(new Error('Failed'));
const mapped = mapError(error, (e) =>
  new NflReadError(e.message, ErrorCode.NETWORK_ERROR)
);
// mapped = Err(NflReadError)
```

### Async Functions with Results

```typescript
import type { Result } from 'nflreadts';
import { Ok, Err, DataNotFoundError } from 'nflreadts';

async function fetchPlayer(id: string): Promise<Result<Player, NflReadError>> {
  try {
    const response = await fetch(`/api/players/${id}`);
    if (!response.ok) {
      return Err(new DataNotFoundError(`Player ${id} not found`));
    }
    const data = await response.json();
    return Ok(data);
  } catch (error) {
    return Err(new NflReadError('Network error', ErrorCode.NETWORK_ERROR));
  }
}

// Usage
const result = await fetchPlayer('00-0033873');
if (isOk(result)) {
  console.log('Player:', result.value);
} else {
  console.error('Failed:', result.error.message);
}
```

## Type-Safe Function Parameters

```typescript
import type { Season, Week, TeamAbbr, ValidTeamAbbr } from 'nflreadts';

// Function with type-safe parameters
function getTeamSchedule(
  team: ValidTeamAbbr, // Only accepts valid team abbreviations
  season: Season,
  week?: Week,
): Promise<Schedule[]> {
  // Implementation
}

// TypeScript enforces valid teams
getTeamSchedule('KC', 2023, 1); // ✅ OK
getTeamSchedule('INVALID', 2023, 1); // ❌ TypeScript error
```

## Best Practices

1. **Use Specific Types**: Prefer `ValidTeamAbbr` over `string` for type safety
2. **Leverage Type Guards**: Use `isOk`, `isErr`, `isSuccess`, etc. for type narrowing
3. **Handle Errors Explicitly**: Use Result pattern for operations that can fail
4. **Use Readonly**: Leverage `DeepReadonly` for immutable data
5. **Discriminated Unions**: Use `DataState` for managing async loading states

## See Also

- [Configuration Guide](./CONFIGURATION.md)
- [API Reference](./API.md) (Coming soon)
