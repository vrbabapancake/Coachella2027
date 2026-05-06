import { useState, useMemo } from 'react'
import { scoreAllEntries, TIERS } from '../utils/scoring.js'
import { submitScoresToSheet } from '../services/sheets.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'coachella2027'

export function AdminScoring({ entries, onClose, onReset }) {
  const [unlocked, setUnlocked]       = useState(false)
  const [keyInput, setKeyInput]       = useState('')
  const [keyError, setKeyError]       = useState(false)
  const [settings, setSettings]       = useState({})   // artistId → { onLineup, tier, isReunion, isDebut }
  const [results, setResults]         = useState(null)
  const [syncStatus, setSyncStatus]   = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  // All unique artists picked across all entries
  const uniqueArtists = useMemo(() => {
    const map = new Map()
    for (const entry of entries) {
      for (const pick of (entry.picks || [])) {
        if (!map.has(pick.id)) map.set(pick.id, pick)
      }
    }
    return [...map.values()]
  }, [entries])

  function handleUnlock() {
    if (keyInput === ADMIN_KEY) { setUnlocked(true); setKeyError(false) }
    else setKeyError(true)
  }

  function updateSetting(artistId, changes) {
    setSettings(prev => ({
      ...prev,
      [artistId]: { onLineup: false, tier: 'main', isReunion: false, isDebut: false, ...prev[artistId], ...changes },
    }))
  }

  function handleScore() {
    const confirmedLineup = {}
    for (const [artistId, s] of Object.entries(settings)) {
      if (s.onLineup) confirmedLineup[artistId] = { tier: s.tier, isReunion: !!s.isReunion, isDebut: !!s.isDebut }
    }
    setResults(scoreAllEntries(entries, confirmedLineup))
    setSyncStatus(null)
  }

  async function handleSyncToSheet() {
    if (!results) return
    setSyncStatus('syncing')
    const scores = results.map(r => ({ name: r.userName, total: r.totalScore }))
    const { ok, error } = await submitScoresToSheet(scores)
    setSyncStatus(ok ? 'done' : `error: ${error}`)
  }

  if (!unlocked) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h2 style={titleStyle}>🔒 Admin access</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Enter the admin key to score picks.</p>
          <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlock()} placeholder="Admin key" style={{ width: '100%', marginBottom: '8px' }} autoFocus />
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
          <h2 style={titleStyle}>{results ? '🏆 Results' : '🎯 Score picks'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--muted)' }}>✕</button>
        </div>

        {!results ? (
          <>
            {uniqueArtists.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No picks submitted yet.</p>
            ) : (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '12px' }}>
                  Mark which artists made the official lineup, then set their tier and bonuses.
                </p>
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
                  {uniqueArtists.map(artist => {
                    const s = settings[artist.id] || {}
                    const on = !!s.onLineup
                    return (
                      <div key={artist.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', marginBottom: '6px', borderRadius: 'var(--radius)', border: `1.5px solid ${on ? 'var(--sunset)' : 'var(--border)'}`, background: on ? '#fff9f7' : 'var(--card-bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={artist.image} alt={artist.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px' }}>{artist.name}</span>
                          <button onClick={() => updateSetting(artist.id, { onLineup: !on })} style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '8px', border: 'none', background: on ? 'var(--sunset)' : 'var(--border)', color: on ? '#fff' : 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>
                            {on ? '✓ On lineup' : 'Add to lineup'}
                          </button>
                        </div>
                        {on && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '42px' }}>
                            <select value={s.tier || 'main'} onChange={e => updateSetting(artist.id, { tier: e.target.value })} style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', border: '1.5px solid var(--border)', background: 'white', cursor: 'pointer' }}>
                              {Object.entries(TIERS).map(([key, { label, points }]) => (
                                <option key={key} value={key}>{label} ({points} pt{points !== 1 ? 's' : ''})</option>
                              ))}
                            </select>
                            {[['isReunion', '🔄 Reunion'], ['isDebut', '✨ Debut']].map(([field, label]) => (
                              <button key={field} onClick={() => updateSetting(artist.id, { [field]: !s[field] })} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', border: `1.5px solid ${s[field] ? 'var(--mauve)' : 'var(--border)'}`, background: s[field] ? '#f5eeff' : 'transparent', color: s[field] ? 'var(--mauve)' : 'var(--muted)', cursor: 'pointer' }}>{label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', padding: 0 }}>🗑 Reset leaderboard</button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#dc2626' }}>Are you sure?</span>
                  <button onClick={() => { onReset(); onClose() }} style={{ ...solidBtn, background: '#dc2626', padding: '5px 12px', fontSize: '12px' }}>Yes, reset</button>
                  <button onClick={() => setConfirmReset(false)} style={{ ...outlineBtn, padding: '5px 12px', fontSize: '12px' }}>Cancel</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onClose} style={outlineBtn}>Cancel</button>
                <button onClick={handleScore} disabled={uniqueArtists.length === 0} style={{ ...solidBtn, opacity: uniqueArtists.length === 0 ? 0.4 : 1 }}>Calculate scores</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <button onClick={() => { setResults(null); setSyncStatus(null) }} style={outlineBtn}>← Re-score</button>
              <button onClick={handleSyncToSheet} style={solidBtn} disabled={syncStatus === 'syncing' || syncStatus === 'done'}>
                {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'done' ? '✓ Synced' : '📊 Sync to Sheet'}
              </button>
              {syncStatus?.startsWith('error') && <span style={{ color: '#dc2626', fontSize: '12px' }}>{syncStatus}</span>}
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {results.map((entry, i) => (
                <div key={i} style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: i < 3 ? 'var(--sunset)' : 'var(--muted)', minWidth: '24px' }}>#{entry.rank}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', flex: 1 }}>{entry.userName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{entry.hits} hits · {entry.misses} misses</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--sunset)', background: '#fff7f4', border: '1.5px solid #ffd4c2', borderRadius: '8px', padding: '2px 10px' }}>{entry.totalScore} pts</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {entry.pickResults.map((pr, j) => (
                      <span key={j} title={pr.breakdown.join('\n')} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)', background: pr.hit ? '#dcfce7' : 'var(--sand)', color: pr.hit ? '#166534' : 'var(--muted)', textDecoration: pr.hit ? 'none' : 'line-through' }}>
                        {pr.pick.name}{pr.finalPoints !== 0 ? ` ${pr.finalPoints > 0 ? '+' : ''}${pr.finalPoints}` : ''}
                        {pr.pick.multiplier > 1 ? ` ${pr.pick.multiplier}×` : ''}
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

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(26,19,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }
const modalStyle   = { background: 'var(--card-bg)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.20)' }
const titleStyle   = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', marginBottom: '4px' }
const solidBtn     = { padding: '9px 18px', borderRadius: '10px', border: 'none', background: 'var(--dusk)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-display)' }
const outlineBtn   = { padding: '9px 18px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--dusk)' }
