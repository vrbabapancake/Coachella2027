export const TIERS = {
  headliner: { label: 'Headliner',                  points: 1 },
  main:      { label: 'Main stage (non-headliner)', points: 2 },
  sahara:    { label: 'Sahara / DJ set',             points: 3 },
  small:     { label: 'Smaller stage',               points: 4 },
  secret:    { label: 'Secret / surprise set',       points: 5 },
}

export const BONUSES = {
  reunion: { label: 'Reunion',         points: 3 },
  debut:   { label: 'Coachella debut', points: 2 },
}

export const MULTIPLIER_PENALTIES = { 1: 0, 2: -1, 3: -2 }
export const MAX_CONFIDENCE_PICKS = 3
export const MAX_PICKS = 10

export function scorePick(pick, lineupEntry) {
  const multiplier = pick.multiplier ?? 1
  const breakdown  = []

  if (!lineupEntry) {
    const penalty = MULTIPLIER_PENALTIES[multiplier] ?? 0
    breakdown.push(penalty < 0
      ? `Not on lineup — ${multiplier}× penalty: ${penalty} pts`
      : 'Not on lineup — 0 pts')
    return { hit: false, basePoints: 0, bonusPoints: 0, subtotal: 0, multiplier, finalPoints: penalty, breakdown }
  }

  const tierDef    = TIERS[lineupEntry.tier] ?? TIERS.main
  const basePoints = tierDef.points
  breakdown.push(`${tierDef.label} — ${basePoints} pt${basePoints !== 1 ? 's' : ''}`)

  let bonusPoints = 0
  if (pick.predictedReunion && lineupEntry.isReunion) {
    bonusPoints += BONUSES.reunion.points
    breakdown.push(`Reunion bonus — +${BONUSES.reunion.points} pts`)
  } else if (pick.predictedReunion) {
    breakdown.push('Reunion predicted but did not happen')
  }
  if (pick.predictedDebut && lineupEntry.isDebut) {
    bonusPoints += BONUSES.debut.points
    breakdown.push(`Debut bonus — +${BONUSES.debut.points} pts`)
  } else if (pick.predictedDebut) {
    breakdown.push('Debut predicted but artist has played before')
  }

  const subtotal    = basePoints + bonusPoints
  const finalPoints = subtotal * multiplier
  if (multiplier > 1) breakdown.push(`${multiplier}× multiplier → ${subtotal} × ${multiplier} = ${finalPoints} pts`)

  return { hit: true, basePoints, bonusPoints, subtotal, multiplier, finalPoints, breakdown }
}

export function scoreEntry(entry, confirmedLineup) {
  let totalScore = 0, hits = 0, misses = 0
  const pickResults = []
  for (const pick of entry.picks) {
    const lineupEntry = confirmedLineup[pick.id] ?? null
    const result      = scorePick(pick, lineupEntry)
    totalScore += result.finalPoints
    if (result.hit) hits++; else misses++
    pickResults.push({ pick, lineupEntry, ...result })
  }
  return { userName: entry.userName, totalScore, hits, misses, pickResults }
}

export function scoreAllEntries(entries, confirmedLineup) {
  return entries
    .map(entry => scoreEntry(entry, confirmedLineup))
    .sort((a, b) => b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.hits - a.hits)
    .map((result, i) => ({ rank: i + 1, ...result }))
}
