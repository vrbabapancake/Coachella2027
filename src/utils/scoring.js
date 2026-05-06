// Scoring rules:
//   Correct pick:  +multiplier pts (1×=1, 2×=2, 3×=3)
//   Wrong pick:    0 (1×), -1 (2×), -2 (3×)
//   Reunion bonus: +2 if predicted AND confirmed — no penalty if wrong
//   Debut bonus:   +2 if predicted AND confirmed — no penalty if wrong
//   Reunion and Debut cannot be on the same pick
//   Each can only be used once per entry

export const WRONG_PENALTY = { 1: 0, 2: -1, 3: -2 }
export const BONUS_POINTS  = 2
export const MAX_PICKS     = 10

export function scorePick(pick, lineupEntry) {
  const multiplier = pick.multiplier ?? 1
  const breakdown  = []

  if (!lineupEntry) {
    const penalty = WRONG_PENALTY[multiplier] ?? 0
    breakdown.push(penalty < 0 ? `Not on lineup — ${multiplier}× penalty: ${penalty} pts` : 'Not on lineup — 0 pts')
    return { hit: false, multiplierPoints: penalty, bonusPoints: 0, finalPoints: penalty, breakdown }
  }

  const multiplierPoints = multiplier
  breakdown.push(`On lineup — ${multiplier}× = +${multiplierPoints} pt${multiplierPoints !== 1 ? 's' : ''}`)

  let bonusPoints = 0
  if (pick.predictedReunion && lineupEntry.isReunion) {
    bonusPoints += BONUS_POINTS
    breakdown.push(`Reunion confirmed — +${BONUS_POINTS} pts`)
  } else if (pick.predictedReunion) {
    breakdown.push('Reunion predicted but not confirmed — no bonus, no penalty')
  }
  if (pick.predictedDebut && lineupEntry.isDebut) {
    bonusPoints += BONUS_POINTS
    breakdown.push(`Debut confirmed — +${BONUS_POINTS} pts`)
  } else if (pick.predictedDebut) {
    breakdown.push('Debut predicted but not confirmed — no bonus, no penalty')
  }

  return { hit: true, multiplierPoints, bonusPoints, finalPoints: multiplierPoints + bonusPoints, breakdown }
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
