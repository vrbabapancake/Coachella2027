import { probabilityLabel, PROBABILITY_COLORS } from '../utils/probability.js'

export function ProbabilityBadge({ score, showLabel = true }) {
  const label  = probabilityLabel(score)
  const colors = PROBABILITY_COLORS[label]

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      gap:            '4px',
      padding:        '2px 8px',
      borderRadius:   '999px',
      fontSize:       '11px',
      fontWeight:     500,
      letterSpacing:  '0.02em',
      color:          colors.text,
      background:     colors.bg,
      border:         `1px solid ${colors.border}`,
      whiteSpace:     'nowrap',
    }}>
      {score}%{showLabel ? ` · ${label}` : ''}
    </span>
  )
}
