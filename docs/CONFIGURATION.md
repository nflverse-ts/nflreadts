# Configuration Guide

nflreadts provides a flexible configuration system that allows you to customize behavior for your specific needs.

## Quick Start

```typescript
import { configure } from 'nflreadts';

// Configure with custom settings
configure({
  http: {
    timeout: 60000, // 60 seconds
  },
  cache: {
    enabled: true,
    ttl: 7200000, // 2 hours
  },
});
```

## Configuration Options

### HTTP Configuration

Controls HTTP client behavior for fetching data.

```typescript
interface HttpConfig {
  timeout: number; // Request timeout in milliseconds (default: 30000)
  retries: number; // Number of retry attempts (default: 3)
  retryDelay: number; // Delay between retries in ms (default: 1000)
  userAgent: string; // User agent string (default: "nflreadts/{version}")
  headers: Record<string, string>; // Custom headers (default: {})
}
```

**Example:**

```typescript
configure({
  http: {
    timeout: 45000,
    retries: 5,
    headers: {
      'X-Custom-Header': 'value',
    },
  },
});
```

### Cache Configuration

Controls data caching behavior.

```typescript
interface CacheConfig {
  enabled: boolean; // Enable/disable caching (default: true)
  ttl: number; // Cache time-to-live in ms (default: 3600000 = 1 hour)
  maxSize: number; // Maximum cache items (default: 100)
  storage: 'memory' | 'persistent'; // Storage type (default: 'memory')
}
```

**Example:**

```typescript
configure({
  cache: {
    enabled: true,
    ttl: 1800000, // 30 minutes
    maxSize: 200,
  },
});
```

### Data Source Configuration

Controls where data is fetched from.

```typescript
interface DataSourceConfig {
  baseUrl: string; // Base URL for nflverse data
  mirrors: string[]; // Alternative mirror URLs for failover
}
```

**Default:**

```typescript
{
  baseUrl: 'https://github.com/nflverse/nflverse-data/releases/download',
  mirrors: []
}
```

**Example:**

```typescript
configure({
  dataSources: {
    baseUrl: 'https://custom-mirror.example.com',
    mirrors: ['https://mirror1.example.com', 'https://mirror2.example.com'],
  },
});
```

### Logging Configuration

Controls logging and debugging output.

```typescript
interface LogConfig {
  debug: boolean; // Enable debug logging (default: false)
  level: 'error' | 'warn' | 'info' | 'debug'; // Log level (default: 'warn')
  logger?: (level: string, message: string, ...args: unknown[]) => void;
}
```

**Example:**

```typescript
configure({
  logging: {
    debug: true,
    level: 'debug',
    logger: (level, message, ...args) => {
      console.log(`[${level.toUpperCase()}]`, message, ...args);
    },
  },
});
```

## Environment Variables

You can also configure nflreadts using environment variables (Node.js only):

```bash
# HTTP Configuration
NFLREADTS_HTTP_TIMEOUT=60000
NFLREADTS_HTTP_RETRIES=5
NFLREADTS_HTTP_RETRY_DELAY=2000
NFLREADTS_HTTP_USER_AGENT="my-app/1.0"

# Cache Configuration
NFLREADTS_CACHE_ENABLED=true
NFLREADTS_CACHE_TTL=7200000
NFLREADTS_CACHE_MAX_SIZE=200

# Data Source Configuration
NFLREADTS_DATA_SOURCE_BASE_URL="https://custom.example.com"

# Logging Configuration
NFLREADTS_LOGGING_DEBUG=true
NFLREADTS_LOGGING_LEVEL=debug
```

To load environment variables:

```typescript
import { loadConfigFromEnv, configure } from 'nflreadts';

// Load and apply environment variable configuration
const envConfig = loadConfigFromEnv();
configure(envConfig);
```

## Getting Current Configuration

```typescript
import { getConfig } from 'nflreadts';

// Get the current configuration
const config = getConfig();
console.log(config.http.timeout);

// Or use ConfigManager directly
import { ConfigManager } from 'nflreadts';

const manager = ConfigManager.getInstance();

// Get entire section
const httpConfig = manager.get('http');

// Get specific value
const timeout = manager.get('http', 'timeout');
```

## Updating Configuration

You can update configuration at any time:

```typescript
import { ConfigManager } from 'nflreadts';

const manager = ConfigManager.getInstance();

// Update specific settings
manager.update({
  cache: {
    enabled: false,
  },
});

// Reset to defaults
manager.resetToDefaults();
```

## Environment-Specific Defaults

nflreadts automatically applies environment-specific defaults:

### Node.js Environment

- No specific overrides currently

### Browser Environment

- `cache.maxSize`: 50 (reduced due to memory constraints)

## Configuration Priority

Configuration is merged in the following order (later overrides earlier):

1. Built-in defaults
2. Environment-specific defaults
3. Environment variables (if loaded)
4. User configuration via `configure()`
5. Runtime updates via `ConfigManager.update()`

## TypeScript Support

All configuration options are fully typed:

```typescript
import type { NflReadConfig, PartialNflReadConfig } from 'nflreadts';

// Full configuration type
const fullConfig: NflReadConfig = {
  http: {
    /* ... */
  },
  cache: {
    /* ... */
  },
  dataSources: {
    /* ... */
  },
  logging: {
    /* ... */
  },
};

// Partial configuration (for user overrides)
const partialConfig: PartialNflReadConfig = {
  http: {
    timeout: 60000,
  },
};
```

## Best Practices

1. **Configure Once**: Set up configuration at application startup
2. **Use Environment Variables**: For deployment-specific settings
3. **Enable Caching**: Keep caching enabled for better performance
4. **Adjust Timeouts**: Increase timeouts for slower connections
5. **Debug Mode**: Enable debug logging only during development

## Examples

### Production Configuration

```typescript
import { configure } from 'nflreadts';

configure({
  http: {
    timeout: 45000,
    retries: 3,
  },
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour
  },
  logging: {
    level: 'error',
  },
});
```

### Development Configuration

```typescript
import { configure } from 'nflreadts';

configure({
  http: {
    timeout: 60000,
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes (shorter for faster updates)
  },
  logging: {
    debug: true,
    level: 'debug',
  },
});
```

### Testing Configuration

```typescript
import { configure, ConfigManager } from 'nflreadts';

// Disable caching for tests
configure({
  cache: {
    enabled: false,
  },
  logging: {
    level: 'error', // Reduce noise in test output
  },
});

// Reset after tests
afterEach(() => {
  ConfigManager.reset();
});
```
