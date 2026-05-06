/**
 * scoring.js
 * Scores a pick list against the official Coachella lineup.
 *
 * Rules:
 *   Artist on lineup:              3 pts
 *   Artist is a headliner:        +2 pts
 *   Headliner picked in top 3:    +1 pt
 */

export function scoreEntry(picks, officialLineup) {
  const lineupMap = new Map(
    officialLineup.map(a => [normalize(a.name), a])
  )

  let total = 0
  const breakdown = picks.map((pick, rank) => {
    const match = lineupMap.get(normalize(pick.name))
    if (!match) return { ...pick, rank: rank + 1, points: 0, matched: false }

    let pts = 3
    if (match.headliner) {
      pts += 2
      if (rank < 3) pts += 1
    }
    total += pts
    return { ...pick, rank: rank + 1, points: pts, matched: true, headliner: match.headliner }
  })

  return { total, breakdown }
}

export function scoreAllEntries(entries, officialLineup) {
  return entries
    .map(entry => ({ ...entry, ...scoreEntry(entry.picks, officialLineup) }))
    .sort((a, b) => b.total - a.total)
}

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}
