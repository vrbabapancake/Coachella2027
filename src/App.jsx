import { useState, useEffect } from 'react'
import { ArtistSearch }           from './components/ArtistSearch.jsx'
import { PickList }               from './components/PickList.jsx'
import { Leaderboard }            from './components/Leaderboard.jsx'
import { AdminScoring }           from './components/AdminScoring.jsx'
import { getShareUrl, getSharedPicksFromUrl } from './utils/share.js'
import { submitPicksToSheet }     from './services/sheets.js'
import { useIsMobile }            from './hooks/useIsMobile.js'

const ENTRIES_KEY  = 'coachella-predictor-v1-entries'
const MY_PICKS_KEY = 'coachella-predictor-v1-my-picks'
const AVATAR_BASE  = 'https://ui-avatars.com/api/?background=e8673a&color=fff&bold=true&name='

export default function App() {
  const isMobile = useIsMobile()
  const [view, setView]         = useState('pick')
  const [picks, setPicks]       = useState([])
  const [userName, setUserName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [entries, setEntries]   = useState([])
  const [shareUrl, setShareUrl] = useState('')
  const [viewingList, setViewingList] = useState(null)
  const [copyDone, setCopyDone]   = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [sheetStatus, setSheetStatus] = useState(null)

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]')) } catch {}
    try {
      const saved = JSON.parse(localStorage.getItem(MY_PICKS_KEY) || 'null')
      if (saved) {
        setPicks(saved.picks || [])
        setUserName(saved.userName || '')
        setSubmitted(saved.submitted || false)
      }
    } catch {}
    const shared = getSharedPicksFromUrl()
    if (shared) { setViewingList(shared); setView('shared') }
  }, [])

  useEffect(() => {
    localStorage.setItem(MY_PICKS_KEY, JSON.stringify({ picks, userName, submitted }))
  }, [picks, userName, submitted])

  function handleAdd(artist) {
    if (picks.length >= 10 || submitted) return
    if (picks.find(p => p.id === artist.id)) return
    setPicks(prev => [...prev, artist])
  }

  async function handleSubmit() {
    const shareLink = getShareUrl(picks, userName)
    const entry     = { picks, userName, createdAt: Date.now() }
    const next      = [...entries, entry]
    setEntries(next)
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
    setSubmitted(true)
    setShareUrl(shareLink)
    setSheetStatus('syncing')
    const { ok } = await submitPicksToSheet({ name: userName, picks, shareUrl: shareLink })
    setSheetStatus(ok ? 'done' : 'local-only')
  }

  function handleLeaderboardReset() {
    setEntries([])
    localStorage.removeItem(ENTRIES_KEY)
  }

  function handleReset() {
    setPicks([])
    setUserName('')
    setSubmitted(false)
    setShareUrl('')
    setSheetStatus(null)
    localStorage.removeItem(MY_PICKS_KEY)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2200)
  }

  function handleViewList(entry) {
    setViewingList(entry)
    setView('shared')
  }

  if (view === 'shared' && viewingList) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <Header view={view} setView={setView} />
        <main style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px' }}>
          <button onClick={() => { setView('leaderboard'); window.location.hash = '' }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>← Back to leaderboard</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', marginBottom: '4px' }}>{viewingList.userName}'s picks</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>Submitted {new Date(viewingList.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {viewingList.picks.map((artist, i) => (
              <div key={artist.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: i < viewingList.picks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', minWidth: '22px', color: i < 3 ? 'var(--sunset)' : 'var(--muted)' }}>{i + 1}</span>
                <img src={artist.image} alt={artist.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.src = AVATAR_BASE + encodeURIComponent(artist.name) }} />
                <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '14px' }}>{artist.name}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <Header view={view} setView={setView} />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '16px 14px' : '28px 20px' }}>
        {view === 'pick' && !submitted && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
            <section>
              <SectionHeading>Search artists</SectionHeading>
              <ArtistSearch picks={picks} onAdd={handleAdd} />
            </section>
            <section>
              <SectionHeading>Build your top 10</SectionHeading>
              <PickList picks={picks} onChange={setPicks} onSubmit={handleSubmit} userName={userName} onUserNameChange={setUserName} />
            </section>
          </div>
        )}
        {view === 'pick' && submitted && (
          <div style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px', marginBottom: '6px' }}>Locked in, {userName}!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>Check back after Coachella announces its lineup to see how you did.</p>
            {sheetStatus === 'syncing' && <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Saving to shared sheet…</p>}
            {sheetStatus === 'done'    && <p style={{ fontSize: '12px', color: '#166534', marginBottom: '12px' }}>✓ Saved to shared sheet</p>}
            {sheetStatus === 'local-only' && <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Saved locally (sheet unavailable)</p>}
            <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '20px', textAlign: 'left' }}>
              {picks.map((artist, i) => (
                <div key={artist.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 16px', borderBottom: i < picks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', minWidth: '22px', color: i < 3 ? 'var(--sunset)' : 'var(--muted)' }}>{i + 1}</span>
                  <img src={artist.image} alt={artist.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.src = AVATAR_BASE + encodeURIComponent(artist.name) }} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '14px' }}>{artist.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={handleCopyLink} style={outlineBtn}>{copyDone ? '✓ Copied!' : '📋 Copy share link'}</button>
              <button onClick={() => setView('leaderboard')} style={solidBtn}>View leaderboard →</button>
            </div>
            <button onClick={handleReset} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
              Reset and start over
            </button>
          </div>
        )}
        {view === 'leaderboard' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>🏆 All predictions</h2>
                <button onClick={() => setShowAdmin(true)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Admin</button>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{entries.length === 0 ? 'No picks yet — be the first!' : `${entries.length} ${entries.length === 1 ? 'person has' : 'people have'} locked in their picks`}</p>
            </div>
            <Leaderboard entries={entries} onViewList={handleViewList} />
          </div>
        )}
      </main>
      <footer style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--muted)', fontSize: '12px', borderTop: '1px solid var(--border)', marginTop: '40px' }}>Predictions stored locally in your browser · Scores revealed when the lineup drops</footer>
      {showAdmin && <AdminScoring entries={entries} onClose={() => setShowAdmin(false)} onReset={handleLeaderboardReset} />}
    </div>
  )
}

function Header({ view, setView }) {
  const isMobile = useIsMobile()
  return (
    <header style={{ background: 'var(--dusk)', color: '#fff', padding: '0 16px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '48px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? '13px' : '17px', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
          🌴 Coachella Predictor <span style={{ fontWeight: 300, opacity: 0.4, fontSize: '11px' }}>2027</span>
        </span>
        <nav style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {[['pick', '🎵', 'My Picks'], ['leaderboard', '🏆', 'Leaderboard']].map(([id, emoji, label]) => (
            <button key={id} onClick={() => setView(id)} style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', background: view === id ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === id ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--font-body)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {isMobile ? emoji : `${emoji} ${label}`}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '12px', marginTop: 0 }}>{children}</h2>
  )
}

const solidBtn = { padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--dusk)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-display)' }
const outlineBtn = { padding: '10px 20px', borderRadius: '10px', border: '1.5px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--dusk)' }
