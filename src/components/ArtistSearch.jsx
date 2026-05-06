import { useState } from 'react'
import { useArtistSearch } from '../hooks/useArtistSearch.js'
import { ArtistCard }       from './ArtistCard.jsx'

export function ArtistSearch({ picks, onAdd }) {
  const [query, setQuery]                 = useState('')
  const { results, loading, error, search } = useArtistSearch()
  const addedIds                          = new Set(picks.map(p => p.id))
  const isFull                            = picks.length >= 10

  function handleChange(e) {
    setQuery(e.target.value)
    search(e.target.value)
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
        <input type="text" value={query} onChange={handleChange} placeholder={isFull ? 'List is full (10/10)' : 'Search artists…'} disabled={isFull} style={{ width: '100%', paddingLeft: '36px' }} />
      </div>
      {loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '12px 0' }}>Searching…</p>}
      {error && <p style={{ color: '#dc2626', fontSize: '13px', padding: '8px 0' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {results.map(artist => (
          <ArtistCard key={artist.id} artist={artist} onAdd={onAdd} added={addedIds.has(artist.id)} disabled={isFull && !addedIds.has(artist.id)} />
        ))}
      </div>
      {!loading && !error && query && results.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '16px 0' }}>No artists found for "query}"</p>}
      {!query && !loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>Try "Billie Eilish", "Kendrick", "Sabrina"…</p>}
    </div>
  )
}
