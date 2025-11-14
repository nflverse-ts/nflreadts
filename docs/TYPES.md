# Type System Documentation

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

const position: Position = 'QB'; // QB, RB, WR, etc.
const playType: PlayType = 'pass'; // pass, run, punt, etc.
const down: Down = 1; // 1, 2, 3, or 4
```

### Conference and Division

```typescript
import type { Conference, Division, FullDivision } from 'nflreadts';

const conf: Conference = 'AFC'; // 'AFC' | 'NFC'
const div: Division = 'West'; // 'East' | 'West' | 'North' | 'South'
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
import type { LoadOptions, FilterOptions, PaginatedResponse, DataState } from 'nflreadts';

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
    { season: 2023 } // context
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
ErrorCode.NETWORK_ERROR;
ErrorCode.TIMEOUT;
ErrorCode.RATE_LIMIT;
ErrorCode.DATA_NOT_FOUND;
ErrorCode.INVALID_DATA;
ErrorCode.PARSE_ERROR;
ErrorCode.INVALID_SEASON;
ErrorCode.INVALID_WEEK;
ErrorCode.INVALID_TEAM;
ErrorCode.INVALID_PLAYER;
ErrorCode.INVALID_PARAMETER;
ErrorCode.CONFIG_ERROR;
ErrorCode.CACHE_ERROR;
ErrorCode.UNKNOWN_ERROR;
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
const mapped = mapError(error, (e) => new NflReadError(e.message, ErrorCode.NETWORK_ERROR));
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
  week?: Week
): Promise<Schedule[]> {
  // Implementation
}

// TypeScript enforces valid teams
getTeamSchedule('KC', 2023, 1); // ✅ OK
getTeamSchedule('INVALID', 2023, 1); // ❌ TypeScript error
```

## Schedule and Game Types

### Schedule Entry

```typescript
import type { ScheduleGame } from 'nflreadts';

const game: ScheduleGame = {
  game_id: '2023_01_KC_DET',
  season: 2023,
  week: 1,
  game_type: 'REG',
  gameday: '2023-09-07',
  weekday: 'Thursday',
  gametime: '20:20',
  home_team: 'DET',
  away_team: 'KC',
  home_score: 20,
  away_score: 21,
  location: 'Ford Field',
  roof: 'dome',
  surface: 'fieldturf',
  temp: 72,
  wind: 0,
  home_rest: 7,
  away_rest: 7,
  home_moneyline: -125,
  away_moneyline: +105,
  spread_line: -2.5,
  total_line: 51.5,
  div_game: false,
  overtime: false,
};
```

### Depth Chart Entry

```typescript
import type { DepthChartEntry } from 'nflreadts';

const depthEntry: DepthChartEntry = {
  season: 2023,
  club_code: 'KC',
  week: 1,
  game_type: 'REG',
  depth_team: 'KC',
  last_name: 'Mahomes',
  first_name: 'Patrick',
  football_name: 'Patrick',
  formation: 'OFFENSE',
  gsis_id: '00-0033873',
  jersey_number: '15',
  position: 'QB',
  elias_id: 'MAH517371',
  depth_position: 'QB',
  full_name: 'Patrick Mahomes',
};
```

## Play-by-Play Types

### Play-by-Play Data

```typescript
import type { PlayByPlay } from 'nflreadts';

const play: PlayByPlay = {
  play_id: '20230907_KC@DET_1234',
  game_id: '2023_01_KC_DET',
  season: 2023,
  week: 1,
  game_type: 'REG',
  posteam: 'KC',
  defteam: 'DET',
  side_of_field: 'KC',
  yardline_100: 75,
  game_date: '2023-09-07',
  quarter_seconds_remaining: 720,
  half_seconds_remaining: 1920,
  game_seconds_remaining: 3600,
  down: 1,
  ydstogo: 10,
  yards_gained: 12,
  play_type: 'pass',
  pass_length: 'short',
  pass_location: 'middle',
  complete_pass: true,
  touchdown: false,
  interception: false,
  fumble: false,
  first_down: true,
  passer_player_id: '00-0033873',
  passer_player_name: 'P.Mahomes',
  receiver_player_id: '00-0036389',
  receiver_player_name: 'T.Kelce',
  epa: 0.85,
  wpa: 0.012,
  wp: 0.55,
  desc: 'P.Mahomes pass short middle to T.Kelce for 12 yards',
};
```

## Configuration Types

### Configuration Interface

```typescript
import type { NflReadConfig, PartialNflReadConfig } from 'nflreadts';

const config: NflReadConfig = {
  http: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    userAgent: 'nflreadts/1.0.0',
    headers: {},
  },
  cache: {
    enabled: true,
    ttl: 3600000,
    maxSize: 100,
    storage: 'memory',
  },
  dataSources: {
    baseUrl: 'https://github.com/nflverse/nflverse-data/releases/download',
    mirrors: [],
  },
  logging: {
    debug: false,
    level: 'warn',
  },
};

// Partial config for updates
const partialConfig: PartialNflReadConfig = {
  cache: {
    enabled: false,
  },
  logging: {
    debug: true,
  },
};
```

## Type Reference Index

### Core Types
- `Season` - NFL season year (number)
- `Week` - Week number 1-22
- `SeasonType` - 'REG' | 'POST' | 'PRE'
- `TeamAbbr` - Team abbreviation (3 letters)
- `PlayerId` - Player GSIS ID
- `GameId` - Game identifier
- `Position` - Player position
- `Conference` - 'AFC' | 'NFC'
- `Division` - 'East' | 'West' | 'North' | 'South'

### Data Types
- `Team` - Team information
- `Player` - Player details
- `RosterEntry` - Roster entry for a player
- `ScheduleGame` - Game schedule information
- `DepthChartEntry` - Depth chart entry
- `PlayByPlay` - Play-by-play data
- `PassingStats` - Passing statistics
- `RushingStats` - Rushing statistics
- `ReceivingStats` - Receiving statistics
- `DefensiveStats` - Defensive statistics
- `KickingStats` - Kicking statistics

### Error Types
- `NflReadError` - Base error class
- `NetworkError` - Network-related errors
- `TimeoutError` - Request timeout errors
- `RateLimitError` - Rate limit exceeded
- `DataNotFoundError` - Data not found
- `InvalidDataError` - Data parsing/validation errors
- `ValidationError` - Input validation errors
- `ErrorCode` - Enumeration of error codes

### Utility Types
- `Result<T, E>` - Result pattern (Ok or Err)
- `DataState<T>` - Async loading state
- `Range<T>` - Min/max range
- `Nullable<T>` - Make properties nullable
- `RequireFields<T, K>` - Make specific fields required
- `OptionalFields<T, K>` - Make specific fields optional

## Advanced Type Patterns

### Discriminated Unions

```typescript
import type { Result } from 'nflreadts';

// Result is a discriminated union
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// TypeScript can narrow the type
function handleResult<T, E>(result: Result<T, E>) {
  if (result.ok) {
    // TypeScript knows result.value exists
    return result.value;
  } else {
    // TypeScript knows result.error exists
    throw result.error;
  }
}
```

### Generic Constraints

```typescript
import type { Season, Week } from 'nflreadts';

// Function with generic constraints
function processSeasons<T extends { season: Season; week?: Week }>(
  data: T[]
): Map<Season, T[]> {
  const grouped = new Map<Season, T[]>();

  for (const item of data) {
    const existing = grouped.get(item.season) ?? [];
    grouped.set(item.season, [...existing, item]);
  }

  return grouped;
}

// Works with any type that has a season field
const rosterData = processSeasons(rosters);
const scheduleData = processSeasons(schedules);
```

### Type Inference

```typescript
import { loadRosters, loadSchedule } from 'nflreadts';

// TypeScript infers the return type automatically
const rostersResult = await loadRosters(2023);
// rostersResult: Result<RosterEntry[], NflReadError>

if (rostersResult.ok) {
  // TypeScript knows this is RosterEntry[]
  const rosters = rostersResult.value;
  rosters.forEach(roster => {
    console.log(roster.player_name); // Fully typed!
  });
}
```

## Migration Guide

### From JavaScript to TypeScript

If you're migrating from JavaScript:

1. **Add type imports**:
   ```typescript
   // Before (JS)
   const season = 2023;

   // After (TS)
   import type { Season } from 'nflreadts';
   const season: Season = 2023;
   ```

2. **Handle Result types**:
   ```typescript
   // Before (JS) - throws on error
   const rosters = await loadRosters(2023);

   // After (TS) - explicit error handling
   const result = await loadRosters(2023);
   if (result.ok) {
     const rosters = result.value;
   } else {
     console.error(result.error);
   }
   ```

3. **Use type guards**:
   ```typescript
   import { isOk, isErr } from 'nflreadts';

   const result = await loadRosters(2023);

   if (isOk(result)) {
     // TypeScript knows result.value exists
     processRosters(result.value);
   }
   ```

### From nflreadr/nflreadpy

Key differences when migrating from R/Python versions:

1. **Naming**: TypeScript uses camelCase for functions, snake_case for data fields
   ```typescript
   // R: load_rosters(seasons = 2023)
   // Python: load_rosters(seasons=2023)
   // TS: loadRosters(2023)
   ```

2. **Error Handling**: TypeScript uses Result pattern instead of exceptions
   ```typescript
   // Python (raises exception)
   rosters = load_rosters(2023)

   // TypeScript (returns Result)
   const result = await loadRosters(2023);
   if (result.ok) {
     const rosters = result.value;
   }
   ```

3. **Type Safety**: TypeScript provides compile-time type checking
   ```typescript
   // Will catch errors at compile time
   loadRosters('invalid'); // ❌ Type error
   loadRosters(2023); // ✅ OK
   ```

## Tips for TypeScript Beginners

### 1. Let TypeScript Infer Types

```typescript
// Don't over-annotate
const season: Season = 2023; // Explicit
const season = 2023 as Season; // Better - assertion
const season = 2023; // Best - let TS infer

// TypeScript knows the type from usage
const result = await loadRosters(2023);
// No need to annotate, TS knows it's Result<RosterEntry[], NflReadError>
```

### 2. Use Type Guards

```typescript
import { isValidTeam, isValidSeason } from 'nflreadts';

const team = userInput;
if (isValidTeam(team)) {
  // TypeScript knows team is ValidTeamAbbr here
  const schedule = await loadSchedule(2023, team);
}
```

### 3. Destructure with Type Safety

```typescript
const result = await loadRosters(2023);

if (result.ok) {
  const { value: rosters } = result;
  // rosters is typed as RosterEntry[]
}
```

### 4. Use Const Assertions

```typescript
const teams = ['KC', 'BUF', 'MIA'] as const;
// teams: readonly ["KC", "BUF", "MIA"]

type MyTeams = typeof teams[number];
// MyTeams: "KC" | "BUF" | "MIA"
```

## Best Practices

1. **Use Specific Types**: Prefer `ValidTeamAbbr` over `string` for type safety
2. **Leverage Type Guards**: Use `isOk`, `isErr`, `isSuccess`, etc. for type narrowing
3. **Handle Errors Explicitly**: Use Result pattern for operations that can fail
4. **Use Readonly**: Leverage `DeepReadonly` for immutable data
5. **Discriminated Unions**: Use `DataState` for managing async loading states
6. **Let TypeScript Infer**: Don't over-annotate, let TypeScript infer types when possible
7. **Validate Inputs**: Use validation functions before processing user input
8. **Type Your Callbacks**: Ensure callback functions are properly typed

## Common Patterns

### Loading Data with Error Handling

```typescript
import { loadRosters, isOk } from 'nflreadts';
import type { Result, RosterEntry, NflReadError } from 'nflreadts';

async function getRostersSafely(season: number): Promise<RosterEntry[]> {
  const result = await loadRosters(season);

  if (isOk(result)) {
    return result.value;
  }

  // Handle error
  console.error(`Failed to load rosters: ${result.error.message}`);
  return []; // Return empty array as fallback
}
```

### Filtering by Team

```typescript
import { loadRosters, isValidTeam } from 'nflreadts';
import type { ValidTeamAbbr, RosterEntry } from 'nflreadts';

async function getTeamRoster(
  season: number,
  team: string
): Promise<RosterEntry[]> {
  // Validate team
  if (!isValidTeam(team)) {
    throw new Error(`Invalid team: ${team}`);
  }

  const result = await loadRosters(season);

  if (!result.ok) {
    throw result.error;
  }

  // Filter by team (now TypeScript knows team is valid)
  return result.value.filter(r => r.team === team);
}
```

### Working with Multiple Seasons

```typescript
import { loadRosters, isOk } from 'nflreadts';
import type { Season, RosterEntry } from 'nflreadts';

async function loadMultipleSeasons(
  seasons: Season[]
): Promise<Map<Season, RosterEntry[]>> {
  const results = new Map<Season, RosterEntry[]>();

  // Load all seasons in parallel
  const promises = seasons.map(async (season) => {
    const result = await loadRosters(season);
    if (isOk(result)) {
      results.set(season, result.value);
    }
  });

  await Promise.all(promises);
  return results;
}
```

## See Also

- [Configuration Guide](./CONFIGURATION.md)
- [Getting Started](./GETTING_STARTED.md)
- [Coverage Report](./COVERAGE.md)
- [Roadmap](./ROADMAP.md)
