/**
 * useArtistSearch.js
 * Searches Deezer for artists (free, no auth, CORS-enabled).
 * Deezer returns: name, picture_medium, nb_fan (great popularity signal).
 *
 * Endpoint: https://api.deezer.com/search/artist?q={query}&limit=8
 */
import { useState, useCallback, useRef } from 'react'

export function useArtistSearch() {
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const debounceRef             = useRef(null)

  const search = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=8&country=us`
        )
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setResults(
          (data.results || []).map(artist => ({
            id:    String(artist.artistId),
            name:  artist.artistName,
            image: (artist.artworkUrl100 || '').replace('100x100', '200x200'),
            nbFan: null,
          }))
        )
      } catch (err) {
        setError('Search failed — check your connection and try again.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 380)
  }, [])

  return { results, loading, error, search }
}
