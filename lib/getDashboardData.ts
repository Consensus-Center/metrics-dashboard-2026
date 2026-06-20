import { query } from './db'

/**
 * Replicates the original Retool backend function
 * (/backend/functions/getDashboardData.ts).
 *
 * The four cc_* tables are queried in parallel and returned in the same shape
 * the frontend already expects. Ordering mirrors the original, except cc_history
 * is ordered by its real `date` column so the timeline is chronological
 * (the original ordered by the textual `month`, which sorts alphabetically).
 */
export async function getDashboardData() {
  const [metrics, sections, history, operators] = await Promise.all([
    query('SELECT * FROM cc_metrics ORDER BY sort_order'),
    query('SELECT * FROM cc_sections ORDER BY sort_order'),
    query('SELECT * FROM cc_history ORDER BY date'),
    query('SELECT * FROM cc_operators ORDER BY members_served DESC'),
  ])

  return {
    metrics: metrics.rows,
    sections: sections.rows,
    history: history.rows,
    operators: operators.rows,
  }
}
