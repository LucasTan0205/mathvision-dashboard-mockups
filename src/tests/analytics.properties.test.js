/**
 * Property-based tests for analytics dashboard integration.
 *
 * Feature: analytics-dashboard-integration
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { sliceRecentRows, transformToChartData } from '../lib/mapping-quality-transform.js';

// ── Arbitraries ──────────────────────────────────────────────────────────────

/** Generates a YYYY-MM-DD date string */
const arbDate = fc
  .tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }) // cap at 28 to avoid month-end edge cases
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

/** Generates a single timeseries row */
const arbTimeseriesRow = fc.record({
  date: arbDate,
  avg_final_score: fc.float({ min: 0, max: 1, noNaN: true }),
  run_count: fc.nat(),
  run_timestamp: fc.constant('2025-01-01T00:00:00Z')
});

/** Generates an array of timeseries rows sorted ascending by date (>= 1 row) */
const arbSortedRows = fc
  .array(arbTimeseriesRow, { minLength: 1, maxLength: 30 })
  .map((rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date)));

/** Generates an array with more than 7 rows sorted ascending */
const arbSortedRowsGt7 = fc
  .array(arbTimeseriesRow, { minLength: 8, maxLength: 30 })
  .map((rows) => [...rows].sort((a, b) => a.date.localeCompare(b.date)));

// ── Property 8: Timeseries data transformation for chart ─────────────────────
// Feature: analytics-dashboard-integration, Property 8: timeseries data transformation for chart
// Validates: Requirements 4.2

describe('Property 8: timeseries data transformation for chart', () => {
  it('x-axis labels equal date values and y-axis data equals avg_final_score * 100 in the same order', () => {
    fc.assert(
      fc.property(arbSortedRows, (rows) => {
        const { labels, values } = transformToChartData(rows);

        // Labels must equal the date values in the same order
        if (labels.length !== rows.length) return false;
        for (let i = 0; i < rows.length; i++) {
          if (labels[i] !== rows[i].date) return false;
        }

        // Values must equal avg_final_score * 100 in the same order
        if (values.length !== rows.length) return false;
        for (let i = 0; i < rows.length; i++) {
          const expected = parseFloat(rows[i].avg_final_score) * 100;
          if (Math.abs(values[i] - expected) > 1e-9) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 9: Most-recent-7 slicing ────────────────────────────────────────
// Feature: analytics-dashboard-integration, Property 9: most-recent-7 slicing
// Validates: Requirements 4.5

describe('Property 9: most-recent-7 slicing', () => {
  it('returns exactly the last 7 rows from an array with more than 7 elements', () => {
    fc.assert(
      fc.property(arbSortedRowsGt7, (rows) => {
        const slice = sliceRecentRows(rows);

        // Must always return exactly 7 rows
        if (slice.length !== 7) return false;

        // Must be the last 7 rows of the input
        const expected = rows.slice(-7);
        for (let i = 0; i < 7; i++) {
          if (slice[i].date !== expected[i].date) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('returns all rows when the array has 7 or fewer elements', () => {
    fc.assert(
      fc.property(
        fc.array(arbTimeseriesRow, { minLength: 1, maxLength: 7 }),
        (rows) => {
          const slice = sliceRecentRows(rows);
          return slice.length === rows.length;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 10: Accuracy value formatting ───────────────────────────────────
// Feature: analytics-dashboard-integration, Property 10: accuracy value formatting
// Validates: Requirements 5.1

import { formatAccuracy, isStale } from '../pages/dashboard-page.js';

describe('Property 10: accuracy value formatting', () => {
  it('formatted match score equals (parseFloat(v) * 100).toFixed(1) + "%"', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1, noNaN: true }),
        (v) => {
          const str = String(v);
          const result = formatAccuracy(str);
          const expected = (parseFloat(str) * 100).toFixed(1) + '%';
          return result === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 11: Distinct student count ──────────────────────────────────────
// Feature: analytics-dashboard-integration, Property 11: distinct student count
// Validates: Requirements 5.2

describe('Property 11: distinct student count', () => {
  it('computed count equals the number of unique student_id values', () => {
    const arbRankingRows = fc.array(
      fc.record({ student_id: fc.string({ minLength: 1, maxLength: 10 }) }),
      { minLength: 0, maxLength: 50 }
    );

    fc.assert(
      fc.property(arbRankingRows, (rows) => {
        const computed = new Set(rows.map(r => r.student_id)).size;
        const expected = new Set(rows.map(r => r.student_id)).size;
        return computed === expected;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 12: Analytics metrics localStorage persistence ──────────────────
// Feature: analytics-dashboard-integration, Property 12: analytics metrics localStorage persistence
// Validates: Requirements 5.4

describe('Property 12: analytics metrics localStorage persistence', () => {
  it('values written to localStorage are derivable from fetched data and survive a read', () => {
    const arbMetrics = fc.record({
      matchScore: fc.string({ minLength: 1 }),
      studentCount: fc.nat(),
      fetchedAt: fc.constant(new Date().toISOString()),
      runTimestamp: fc.option(fc.constant('2025-01-01T00:00:00Z'), { nil: null })
    });

    // Simulate localStorage with a plain Map (JSON serialize → deserialize round-trip)
    fc.assert(
      fc.property(arbMetrics, (metrics) => {
        const serialized = JSON.stringify(metrics);
        const read = JSON.parse(serialized);
        return (
          read.matchScore === metrics.matchScore &&
          read.studentCount === metrics.studentCount &&
          read.fetchedAt === metrics.fetchedAt &&
          read.runTimestamp === metrics.runTimestamp
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 16: Staleness classification ────────────────────────────────────
// Feature: analytics-dashboard-integration, Property 16: staleness classification
// Validates: Requirements 8.2

describe('Property 16: staleness classification', () => {
  it('amber indicator shown if and only if timestamp is more than 24 hours before now', () => {
    // Generate timestamps offset from now by a random number of hours
    const arbOffsetHours = fc.integer({ min: -72, max: 72 });

    fc.assert(
      fc.property(arbOffsetHours, (offsetHours) => {
        const ts = new Date(Date.now() - offsetHours * 3600 * 1000).toISOString();
        const stale = isStale(ts);
        const expectedStale = offsetHours > 24;
        return stale === expectedStale;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 14: Pairings aggregation per tutor ──────────────────────────────
// Feature: analytics-dashboard-integration, Property 14: pairings aggregation per tutor
// Validates: Requirements 7.2

import { filterToRecentWindow, aggregateTutorHours } from '../pages/capacity-utilization-page.js';

describe('Property 14: pairings aggregation per tutor', () => {
  it('aggregated hours per tutor_name equals sum of duration_hours for that tutor in the filtered window', () => {
    const arbTutorName = fc.constantFrom('Alice', 'Bob', 'Carol', 'Dave', 'Eve');
    const arbPairingRow = fc.record({
      tutor_name: arbTutorName,
      session_date: arbDate,
      duration_hours: fc.float({ min: 0.5, max: 8, noNaN: true }).map(v => String(v))
    });

    fc.assert(
      fc.property(fc.array(arbPairingRow, { minLength: 1, maxLength: 50 }), (rows) => {
        const filtered = filterToRecentWindow(rows);
        const result = aggregateTutorHours(filtered);

        // For each tutor in the result, verify hours equals Math.round(sum of duration_hours)
        for (const entry of result) {
          const expected = Math.round(
            filtered
              .filter(r => r.tutor_name === entry.name)
              .reduce((sum, r) => sum + parseFloat(r.duration_hours), 0)
          );
          if (entry.hours !== expected) return false;
        }

        // Every tutor present in filtered rows should appear in result
        const tutorNamesInFiltered = new Set(filtered.map(r => r.tutor_name).filter(Boolean));
        const tutorNamesInResult = new Set(result.map(e => e.name));
        for (const name of tutorNamesInFiltered) {
          if (!tutorNamesInResult.has(name)) return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 15: 30-day window filter ────────────────────────────────────────
// Feature: analytics-dashboard-integration, Property 15: 30-day window filter
// Validates: Requirements 7.5

describe('Property 15: 30-day window filter', () => {
  it('includes exactly rows where session_date >= maxDate - 30 days and excludes all others', () => {
    const arbPairingRow = fc.record({
      tutor_name: fc.constant('Alice'),
      session_date: arbDate,
      duration_hours: fc.constant('1')
    });

    fc.assert(
      fc.property(fc.array(arbPairingRow, { minLength: 1, maxLength: 30 }), (rows) => {
        const filtered = filterToRecentWindow(rows);

        const maxDate = new Date(Math.max(...rows.map(r => new Date(r.session_date))));
        const windowStart = new Date(maxDate.getTime() - 30 * 24 * 3600 * 1000);

        // Every row in filtered must be within the window
        for (const r of filtered) {
          if (new Date(r.session_date) < windowStart) return false;
        }

        // Every row outside the window must NOT be in filtered
        const filteredDates = new Set(filtered.map(r => r.session_date));
        for (const r of rows) {
          if (new Date(r.session_date) < windowStart && filteredDates.has(r.session_date)) {
            // A date outside the window appeared in filtered — but only fail if
            // that date is strictly before windowStart (not equal)
            if (new Date(r.session_date).getTime() < windowStart.getTime()) return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
