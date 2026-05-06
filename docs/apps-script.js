/**
 * Google Apps Script — paste this into your Sheet's script editor.
 *
 * Sheet columns (Row 1 = headers):
 *   A: Timestamp  B: Name  C: Picks (JSON)  D: Share URL  E: Score
 *
 * Deploy as Web App:
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * Then copy the URL into VITE_SHEETS_ENDPOINT in your .env file.
 */

const SHEET_NAME = 'Picks'

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
  const body  = JSON.parse(e.postData.contents)

  if (body.action === 'score') {
    // Write scores into column E, matched by name in column B
    const data  = sheet.getDataRange().getValues()
    body.scores.forEach(({ name, total }) => {
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === name) {
          sheet.getRange(i + 1, 5).setValue(total)
        }
      }
    })
    return jsonResponse({ ok: true })
  }

  // Default: append a new picks row
  sheet.appendRow([
    body.submittedAt,
    body.name,
    body.picks,
    body.shareUrl,
    '',  // Score filled in later by Admin panel
  ])
  return jsonResponse({ ok: true })
}

function doGet(e) {
  if (e.parameter.action === 'list') {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    const rows  = sheet.getDataRange().getValues().slice(1) // skip header
    const entries = rows.map(r => ({
      submittedAt: r[0],
      userName:    r[1],
      picks:       JSON.parse(r[2] || '[]'),
      shareUrl:    r[3],
      score:       r[4],
    }))
    return jsonResponse({ entries })
  }
  return jsonResponse({ ok: true })
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
