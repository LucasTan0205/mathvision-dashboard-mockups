/**
 * Pure transformation helpers for the mapping quality chart.
 * Extracted so they can be property-tested independently of the DOM.
 */

/**
 * Takes the last `n` rows from a sorted-ascending timeseries array.
 * @param {Array} rows - Timeseries rows sorted ascending by date
 * @param {number} n - Number of most-recent rows to keep (default 7)
 * @returns {Array}
 */
export function sliceRecentRows(rows, n = 7) {
  return rows.slice(-n);
}

/**
 * Converts a timeseries row array into chart-ready labels and data.
 * @param {Array<{date: string, avg_final_score: string|number}>} rows
 * @returns {{ labels: string[], values: number[] }}
 */
export function transformToChartData(rows) {
  return {
    labels: rows.map((r) => r.date),
    values: rows.map((r) => parseFloat(r.avg_final_score) * 100)
  };
}
