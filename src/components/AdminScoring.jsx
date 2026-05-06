import { useState } from 'react'
import { scoreAllEntries } from '../utils/scoring.js'
import { submitScoresToSheet } from '../services/sheets.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'coachella2027'

export function AdminScoring({ entries, onClose, onReset }) {
  const [unlocked, setUnlocked]         = useState(false)
  const [keyInput, setKeyInput]         = useState('')
  const [keyError, setKeyError]         = useState(false)
  const [lineupText, setLineupText]     = useState('')
  const [results, setResults]           = useState(null)
  const [syncStatus, setSyncStatus]     = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleUnlock() {
    if (keyInput === ADMIN_KEY) {
      setUnlocked(true)
      setKeyError(false)
    } else {
      setKeyError(true)
    }
  }

  function handleScore() {
    const lines = lineupText.split('\n').map(l => l.trim()).filter(Boolean)
    const officialLineup = lines.map(line => {
      const headliner = line.startsWith('*')
      return { name: headliner ? line.slice(1).trim() : line, headliner }
    })
    setResults(scoreAllEntries(entries, officialLineup))
    setSyncStatus(null)
  }

  async function handleSyncToSheet() {
    if (!results) return
    setSyncStatus('syncing')
    const scores = results.map(r => ({ name: r.userName, total: r.total }))
    const { ok, error } = await submitScoresToSheet(scores)
    setSyncStatus(ok ? 'done' : `error: ${error}`)
  }

  if (!unlocked) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h2 style={titleStyle}>🔒 Admin access</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Enter the admin key to score picks.</p>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Admin key"
            style={{ width: '100%', marginBottom: '8px' }}
            autoFocus
          />
          {keyError && <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>Incorrect key</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={outlineBtn}>Cancel</button>
            <button onClick={handleUnlock} style={solidBtn}>Unlock</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={titleStyle}>🏆 Score picks</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--muted)' }}>✕</button>
        </div>

        {!results ? (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '8px' }}>
              Paste the official lineup — one artist per line.<br />
              Prefix headliners with <code style={{ background: 'var(--sand)', padding: '1px 4px', borderRadius: '4px' }}>*</code> (e.g. <code style={{ background: 'var(--sand)', padding: '1px 4px', borderRadius: '4px' }}>*Lady Gaga</code>).
            </p>
            <textarea
              value={lineupText}
              onChange={e => setLineupText(e.target.value)}
              placeholder={'*Lady Gaga\n*Frank Ocean\n*Kendrick Lamar\nSabrina Carpenter\nCharli XCX\n...'}
              style={{
                width: '100%', height: '220px', padding: '12px', borderRadius: '10px',
                border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-body)',
                resize: 'vertical', marginBottom: '12px', background: 'white',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', padding: 0 }}>
                  🗑 Reset leaderboard
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#dc2626' }}>Are you sure?</span>
                  <button onClick={() => { onReset(); onClose() }} style={{ ...solidBtn, background: '#dc2626', padding: '5px 12px', fontSize: '12px' }}>Yes, reset</button>
                  <button onClick={() => setConfirmReset(false)} style={{ ...outlineBtn, padding: '5px 12px', fontSize: '12px' }}>Cancel</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={outlineBtn}>Cancel</button>
                <button onClick={handleScore} disabled={!lineupText.trim()} style={{ ...solidBtn, opacity: lineupText.trim() ? 1 : 0.4 }}>
                  Calculate scores
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => { setResults(null); setSyncStatus(null) }} style={outlineBtn}>← Re-score</button>
              <button onClick={handleSyncToSheet} style={solidBtn} disabled={syncStatus === 'syncing' || syncStatus === 'done'}>
                {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'done' ? '✓ Synced to Sheet' : '📊 Sync to Google Sheet'}
              </button>
              {syncStatus && syncStatus.startsWith('error') && (
                <span style={{ color: '#dc2626', fontSize: '12px' }}>{syncStatus}</span>
              )}
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {results.map((entry, i) => (
                <div key={i} style={{
                  background: 'var(--card-bg)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: i < 3 ? 'var(--sunset)' : 'var(--muted)', minWidth: '24px' }}>
                      #{i + 1}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', flex: 1 }}>
                      {entry.userName}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px',
                      color: 'var(--sunset)', background: '#fff7f4', border: '1.5px solid #ffd4c2',
                      borderRadius: '8px', padding: '2px 10px',
                    }}>
                      {entry.total} pts
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {entry.breakdown.map((pick, j) => (
                      <span key={j} style={{
                        fontSize: '11px', padding: '2px 8px',
                        borderRadius: '999px', border: '1px solid var(--border)',
                        background: pick.matched ? (pick.headliner ? '#fef3c7' : '#dcfce7') : 'var(--sand)',
                        color: pick.matched ? (pick.headliner ? '#92400e' : '#166534') : 'var(--muted)',
                        textDecoration: pick.matched ? 'none' : 'line-through',
                      }}>
                        {pick.name}{pick.points > 0 ? ` +${pick.points}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(26,19,16,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 999, padding: '20px',
}
const modalStyle = {
  background: 'var(--card-bg)', borderRadius: '16px',
  padding: '28px', width: '100%', maxWidth: '480px',
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
}
const titleStyle = {
  fontFamily: 'var(--font-display)', fontWeight: 700,
  fontSize: '18px', marginBottom: '4px',
}
const solidBtn = {
  padding: '9px 18px', borderRadius: '10px', border: 'none',
  background: 'var(--dusk)', color: '#fff', cursor: 'pointer',
  fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-display)',
}
const outlineBtn = {
  padding: '9px 18px', borderRadius: '10px',
  border: '1.5px solid var(--border)', background: 'var(--card-bg)',
  cursor: 'pointer', fontWeight: 500, fontSize: '13px',
  fontFamily: 'var(--font-body)', color: 'var(--dusk)',
}
