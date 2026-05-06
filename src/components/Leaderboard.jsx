import { ProbabilityBadge } from './ProbabilityBadge.jsx'

const AVATAR_BASE = 'https://ui-avatars.com/api/?background=e8673a&color=fff&bold=true&name='

function Entry({ entry, rank, onView }) {
  const avgScore = entry.picks.length > 0
    ? Math.round(entry.picks.reduce((s, p) => s + (p.probability || 0), 0) / entry.picks.length)
    : 0

  return (
    <div style={{
      background:   'var(--card-bg)',
      border:       '1.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding:      '14px 16px',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontFamily:  'var(--font-display)',
          fontWeight:  700,
          fontSize:    '14px',
          color:       rank <= 3 ? 'var(--sunset)' : 'var(--muted)',
          minWidth:    '24px',
        }}>
          #{rank}
        </span>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px' }}>
            {entry.userName}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '11px', marginLeft: '8px' }}>
            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <ProbabilityBadge score={avgScore} showLabel={false} />
        <button
          onClick={() => onView(entry)}
          style={{
            fontSize:   '12px',
            padding:    '4px 12px',
            borderRadius: '8px',
            border:     '1.5px solid var(--border)',
            cursor:     'pointer',
            background: 'transparent',
            color:      'var(--dusk)',
            fontWeight: 500,
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sunset)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          View →
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {entry.picks.slice(0, 6).map(artist => (
          <span key={artist.id} style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '5px',
            fontSize:     '11px',
            padding:      '2px 8px',
            background:   'var(--sand)',
            borderRadius: '999px',
            border:       '1px solid var(--border)',
          }}>
            <img src={artist.image} alt="" style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.src = AVATAK_BASE + encodeURIComponent(artist.name) }} />
            {artist.name}
          </span>
        ))}
        {entry.picks.length > 6 && (
          <span style={{ fontSize: '11px', color: 'var(--muted)', padding: '2px 6px' }}>
            +{entry.picks.length - 6} more
          </span>
        )}
      </div>
    </div>
  )
}

export function Leaderboard({ entries, onViewList }) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
        <p>No predictions yet</p>
        <p>Lock in your picks to be first on the board!</p>
      </div>
    )
  }
  return (
    <div>
      {entries.map((entry, i) => (
        <Entry key={i} entry={entry} rank={i + 1} onView={onViewList} />
      ))}
    </div>
  )
}
