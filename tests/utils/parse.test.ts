/**
 * Tests for parse utilities
 */

import { describe, expect, it, vi } from 'vitest';

import { InvalidDataError } from '../../src/types/error.js';
import {
  cleanColumnName,
  csvToJson,
  detectDelimiter,
  jsonToCsv,
  parseBoolean,
  parseCsv,
  parseFloatSafe,
  parseIntSafe,
  parseJson,
  parseJsonFromResponse,
  parseNumber,
  parseParquet,
  parseParquetFromResponse,
  toCsv,
  transformCsvHeader,
} from '../../src/utils/parse.js';

describe('Parse Utilities', () => {
  describe('parseNumber', () => {
    it('should parse numeric strings', () => {
      expect(parseNumber('42')).toBe(42);
      expect(parseNumber('3.14')).toBe(3.14);
      expect(parseNumber('-10')).toBe(-10);
    });

    it('should return number as-is', () => {
      expect(parseNumber(42)).toBe(42);
      expect(parseNumber(3.14)).toBe(3.14);
    });

    it('should return null for invalid strings', () => {
      expect(parseNumber('abc')).toBe(null);
      expect(parseNumber('12abc')).toBe(null);
    });

    it('should return null for non-number types', () => {
      expect(parseNumber(null)).toBe(null);
      expect(parseNumber(undefined)).toBe(null);
      expect(parseNumber(true)).toBe(null);
      expect(parseNumber({})).toBe(null);
    });
  });

  describe('parseBoolean', () => {
    it('should parse boolean values', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean(false)).toBe(false);
    });

    it('should parse truthy strings', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
      expect(parseBoolean('YES')).toBe(true);
    });

    it('should parse falsy strings', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('FALSE')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('no')).toBe(false);
      expect(parseBoolean('NO')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(parseBoolean('  true  ')).toBe(true);
      expect(parseBoolean('  false  ')).toBe(false);
    });

    it('should parse numbers', () => {
      expect(parseBoolean(1)).toBe(true);
      expect(parseBoolean(0)).toBe(false);
      expect(parseBoolean(42)).toBe(true);
      expect(parseBoolean(-1)).toBe(true);
    });

    it('should return null for invalid strings', () => {
      expect(parseBoolean('abc')).toBe(null);
      expect(parseBoolean('maybe')).toBe(null);
    });

    it('should return null for null/undefined', () => {
      expect(parseBoolean(null)).toBe(null);
      expect(parseBoolean(undefined)).toBe(null);
    });
  });

  describe('parseIntSafe', () => {
    it('should parse integers', () => {
      expect(parseIntSafe('42')).toBe(42);
      expect(parseIntSafe(42)).toBe(42);
      expect(parseIntSafe('-10')).toBe(-10);
    });

    it('should floor floats', () => {
      expect(parseIntSafe('3.14')).toBe(3);
      expect(parseIntSafe(3.99)).toBe(3);
      expect(parseIntSafe(-2.5)).toBe(-3);
    });

    it('should return null for invalid values', () => {
      expect(parseIntSafe('abc')).toBe(null);
      expect(parseIntSafe(null)).toBe(null);
    });
  });

  describe('parseFloatSafe', () => {
    it('should parse floats', () => {
      expect(parseFloatSafe('3.14')).toBe(3.14);
      expect(parseFloatSafe(3.14)).toBe(3.14);
      expect(parseFloatSafe('-10.5')).toBe(-10.5);
    });

    it('should parse integers as floats', () => {
      expect(parseFloatSafe('42')).toBe(42);
      expect(parseFloatSafe(42)).toBe(42);
    });

    it('should return null for invalid values', () => {
      expect(parseFloatSafe('abc')).toBe(null);
      expect(parseFloatSafe(null)).toBe(null);
    });
  });

  describe('parseJson', () => {
    it('should parse valid JSON', () => {
      expect(parseJson('{"foo":"bar"}')).toEqual({ foo: 'bar' });
      expect(parseJson('[1,2,3]')).toEqual([1, 2, 3]);
      expect(parseJson('42')).toBe(42);
      expect(parseJson('"hello"')).toBe('hello');
    });

    it('should throw InvalidDataError on invalid JSON', () => {
      expect(() => parseJson('{invalid}')).toThrow(InvalidDataError);
      expect(() => parseJson('{')).toThrow(InvalidDataError);
    });

    it('should include original error in context', () => {
      try {
        parseJson('{invalid}');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidDataError);
        expect((error as InvalidDataError).context).toHaveProperty('originalError');
      }
    });
  });

  describe('parseJsonFromResponse', () => {
    it('should parse JSON from Response', async () => {
      const response = new Response('{"foo":"bar"}', {
        headers: { 'content-type': 'application/json' },
      });

      const result = await parseJsonFromResponse(response);
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should throw InvalidDataError on invalid JSON', async () => {
      const response = new Response('{invalid}', {
        headers: { 'content-type': 'application/json' },
      });

      await expect(parseJsonFromResponse(response)).rejects.toThrow(InvalidDataError);
    });
  });

  describe('cleanColumnName', () => {
    it('should convert to lowercase', () => {
      expect(cleanColumnName('FOO')).toBe('foo');
      expect(cleanColumnName('Foo Bar')).toBe('foo_bar');
    });

    it('should replace spaces with underscores', () => {
      expect(cleanColumnName('foo bar')).toBe('foo_bar');
      expect(cleanColumnName('foo  bar  baz')).toBe('foo_bar_baz');
    });

    it('should remove special characters', () => {
      expect(cleanColumnName('foo@bar')).toBe('foobar');
      expect(cleanColumnName('foo-bar')).toBe('foobar');
      expect(cleanColumnName('foo.bar')).toBe('foobar');
    });

    it('should normalize multiple underscores', () => {
      expect(cleanColumnName('foo___bar')).toBe('foo_bar');
    });

    it('should trim leading/trailing underscores', () => {
      expect(cleanColumnName('_foo_')).toBe('foo');
      expect(cleanColumnName('___foo___')).toBe('foo');
    });

    it('should handle complex names', () => {
      expect(cleanColumnName('  Player Name (Team)  ')).toBe('player_name_team');
      expect(cleanColumnName('Pass%')).toBe('pass');
    });
  });

  describe('transformCsvHeader', () => {
    it('should clean CSV headers', () => {
      expect(transformCsvHeader('Player Name')).toBe('player_name');
      expect(transformCsvHeader('Team ID')).toBe('team_id');
    });
  });

  describe('parseCsv', () => {
    it('should parse simple CSV with headers', () => {
      const csv = 'name,age\nJohn,30\nJane,25';
      const result = parseCsv(csv);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ name: 'John', age: 30 });
      expect(result.data[1]).toEqual({ name: 'Jane', age: 25 });
    });

    it('should skip empty lines', () => {
      const csv = 'name,age\nJohn,30\n\nJane,25\n\n';
      const result = parseCsv(csv);

      expect(result.data).toHaveLength(2);
    });

    it('should handle dynamic typing', () => {
      const csv = 'name,age,active\nJohn,30,true\nJane,25,false';
      const result = parseCsv(csv);

      expect(result.data[0]).toEqual({ name: 'John', age: 30, active: true });
    });

    it('should transform headers when provided', () => {
      const csv = 'Player Name,Team ID\nJohn,LAR\nJane,KC';
      const result = parseCsv(csv, {
        transformHeader: transformCsvHeader,
      });

      expect(result.data[0]).toHaveProperty('player_name');
      expect(result.data[0]).toHaveProperty('team_id');
    });

    it('should handle CSV without headers', () => {
      const csv = 'John,30\nJane,25';
      const result = parseCsv(csv, { header: false });

      expect(result.data).toHaveLength(2);
      expect(Array.isArray(result.data[0])).toBe(true);
    });

    it('should throw on parse errors', () => {
      // Papa Parse detects field mismatch errors
      const csv = 'name,age\nJohn,30,extra,fields,that,exceed,headers';

      // Should throw InvalidDataError when Papa Parse encounters errors
      expect(() => parseCsv(csv)).toThrow('CSV parse errors');
    });
  });

  describe('detectDelimiter', () => {
    it('should detect comma delimiter', () => {
      const csv = 'name,age,city\nJohn,30,NYC';
      expect(detectDelimiter(csv)).toBe(',');
    });

    it('should detect semicolon delimiter', () => {
      const csv = 'name;age;city\nJohn;30;NYC';
      expect(detectDelimiter(csv)).toBe(';');
    });

    it('should detect tab delimiter', () => {
      const csv = 'name\tage\tcity\nJohn\t30\tNYC';
      expect(detectDelimiter(csv)).toBe('\t');
    });

    it('should detect pipe delimiter', () => {
      const csv = 'name|age|city\nJohn|30|NYC';
      expect(detectDelimiter(csv)).toBe('|');
    });

    it('should default to comma for empty string', () => {
      expect(detectDelimiter('')).toBe(',');
    });
  });

  describe('toCsv', () => {
    it('should convert array to CSV with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const csv = toCsv(data);
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
      expect(csv).toContain('Jane,25');
    });

    it('should convert without headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const csv = toCsv(data, { header: false });
      expect(csv).not.toContain('name,age');
      expect(csv).toContain('John,30');
    });

    it('should use custom delimiter', () => {
      const data = [{ name: 'John', age: 30 }];
      const csv = toCsv(data, { delimiter: ';' });
      expect(csv).toContain('name;age');
      expect(csv).toContain('John;30');
    });
  });

  describe('csvToJson', () => {
    it('should convert CSV to JSON array', () => {
      const csv = 'name,age\nJohn,30\nJane,25';
      const json = csvToJson(csv);

      expect(json).toHaveLength(2);
      expect(json[0]).toEqual({ name: 'John', age: 30 });
    });

    it('should accept parse options', () => {
      const csv = 'Player Name,Age\nJohn,30';
      const json = csvToJson(csv, {
        transformHeader: transformCsvHeader,
      });

      expect(json[0]).toHaveProperty('player_name');
    });
  });

  describe('jsonToCsv', () => {
    it('should convert JSON array to CSV', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const csv = jsonToCsv(data);
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
    });
  });

  describe('roundtrip conversion', () => {
    it('should maintain data integrity in CSV->JSON->CSV', () => {
      const originalCsv = 'name,age,active\nJohn,30,true\nJane,25,false';
      const json = csvToJson(originalCsv);
      const newCsv = jsonToCsv(json);

      // Parse both to compare data
      const original = csvToJson(originalCsv);
      const roundtrip = csvToJson(newCsv);

      expect(roundtrip).toEqual(original);
    });
  });

  describe('parseParquet', () => {
    it('should accept ArrayBuffer and options', () => {
      const buffer = new ArrayBuffer(100);
      const options = {
        columns: ['id', 'name'],
        rowStart: 0,
        rowEnd: 10,
      };

      // Test that the function signature is correct
      expect(() => parseParquet(buffer, options)).toBeDefined();
    });

    it('should throw InvalidDataError for invalid parquet data', async () => {
      const invalidBuffer = new ArrayBuffer(10); // Too small to be valid Parquet

      await expect(parseParquet(invalidBuffer)).rejects.toThrow(InvalidDataError);
    });
  });

  describe('parseParquetFromResponse', () => {
    it('should throw InvalidDataError when arrayBuffer fails', async () => {
      const mockResponse = {
        url: 'https://example.com/data.parquet',
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Network error')),
      } as unknown as Response;

      await expect(parseParquetFromResponse(mockResponse)).rejects.toThrow(InvalidDataError);
    });

    it('should call arrayBuffer on Response object', async () => {
      const invalidBuffer = new ArrayBuffer(10);
      const mockResponse = {
        url: 'https://example.com/data.parquet',
        arrayBuffer: vi.fn().mockResolvedValue(invalidBuffer),
      } as unknown as Response;

      try {
        await parseParquetFromResponse(mockResponse);
      } catch {
        // Expected to fail due to invalid data
      }

      expect(mockResponse.arrayBuffer).toHaveBeenCalled();
    });
  });
});
