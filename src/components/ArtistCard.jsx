import { calcProbability } from '../utils/probability.js'
import { ProbabilityBadge }  from './ProbabilityBadge.jsx'

const AVATAK_BASE = 'https://ui-avatars.com/api/?background=e8673a&color=fff&bold=true&name='

export function ArtistCard({ artist, onAdd, added, disabled }) {
  const probability = calcProbability(artist)
  const isDisabled  = added || disabled

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`Add ${artist.name} to picks`}
      onClick={() => !isDisabled && onAdd({ ...artist, probability })}
      onKeyDown={e => e.key === 'Enter' && !isDisabled && onAdd({ ...artist, probability })}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: 'var(--radius)',
        cursor: isDisabled ? 'default' : 'pointer',
        background: isDisabled ? 'rgba(0,0,0,0.02)' : 'var(--card-bg)',
        border: '1.5px solid var(--border)',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.15s', userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.borderColor = 'var(--sunset)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <img src={artist.image} alt={artist.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#f0ece4' }} onError={e => { e.target.src = AVATAR_BASE + encodeURIComponent(artist.name) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
          {artist.name}
        </div>
        <ProbabilityBadge score={probability} />
      </div>
      <button tabIndex={-1} disabled={isDisabled} style={{
        padding: '5px 14px', borderRadius: '8px',
        border: isDisabled ? '1.5px solid var(--border)' : '1.5px solid var(--dusk)',
        background: isDisabled ? 'transparent' : 'var(--dusk)',
        color: isDisabled ? 'var(--muted)' : '#fff',
        fontSize: '12px', fontWeight: 500,
        cursor: isDisabled ? 'default' : 'pointer',
        flexShrink: 0, transition: 'all 0.15s',
      }}>
        {added ? 'Added' : '+ Add'}
      </button>
    </div>
  )
}
