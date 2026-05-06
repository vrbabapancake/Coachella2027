/**
 * sheets.js
 * Submits a picks entry to Google Sheets via a Apps Script Web App endpoint.
 *
 * Setup (one-time):
 *   1. Create a Google Sheet with columns:
 *      Timestamp | Name | Picks (JSON) | Share URL | Score
 *   2. In the Sheet, go to Extensions → Apps Script and paste the code in
 *      docs/apps-script.js, then Deploy → New deployment → Web app
 *      (Execute as: Me, Who has access: Anyone)
 *   3. Copy the deployment URL and set VITE_SHEETS_ENDPOINT in your .env file.
 *
 * The endpoint accepts POST with JSON body:
 *   { name, picks, shareUrl, submittedAt }
 */

const ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT

export async function submitPicksToSheet({ name, picks, shareUrl }) {
  if (!ENDPOINT) return { ok: false, error: 'VITE_SHEETS_ENDPOINT not set' }

  const body = {
    name,
    picks: JSON.stringify(picks.map((p, i) => ({ rank: i + 1, name: p.name, probability: p.probability }))),
    shareUrl,
    submittedAt: new Date().toISOString(),
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ok: true }
  } catch (err) {
    console.error('Sheets submission failed:', err)
    return { ok: false, error: err.message }
  }
}

export async function fetchEntriesFromSheet() {
  if (!ENDPOINT) return null

  try {
    const res = await fetch(`${ENDPOINT}?action=list`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.entries || []
  } catch (err) {
    console.error('Sheets fetch failed:', err)
    return null
  }
}

export async function submitScoresToSheet(scores) {
  if (!ENDPOINT) return { ok: false, error: 'VITE_SHEETS_ENDPOINT not set' }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'score', scores }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
