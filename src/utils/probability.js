/**
 * probability.js
 */

const MAX_FANS = 12_000_000

export function fanScoreFromDeezer(nbFan) {
  if (!nbFan || nbFan <= 0) return 15
  const score = (Math.log10(nbFan) / Math.log10(MAX_FANS)) * 100
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function getMockOddsScore(artistName) {
  let hash = 0
  for (let i = 0; i < artistName.length; i++) {
    hash = ((hash << 5) - hash) + artistName.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash % 55) + 22
}

export function calcProbability(artist) {
  const fanScore  = fanScoreFromDeezer(artist.nbFan)
  const oddsScore = artist.oddsScore ?? getMockOddsScore(artist.name)
  return Math.round(fanScore * 0.6 + oddsScore * 0.4)
}

export function probabilityLabel(score) {
  if (score >= 78) return 'Very likely'
  if (score >= 58) return 'Likely'
  if (score >= 38) return 'Possible'
  return 'Longshot'
}

export const PROBABILITY_COLORS = {
  'Very likely': { text: '#166534', bg: '#dcfce7', border: '#86efac' },
  'Likely':      { text: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  'Possible':    { text: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  'Longshot':    { text: '#6b21a8', bg: '#f3e8ff', border: '#d8b4fe' },
}
