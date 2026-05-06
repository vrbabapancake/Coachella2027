import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { MAX_CONFIDENCE_PICKS } from '../utils/scoring.js'

const AVATAR_BASE = 'https://ui-avatars.com/api/?background=e8673a&color=fff&bold=true&name='

const MULTIPLIER_INFO = {
  1: 'Normal pick — no risk, no bonus.',
  2: '2× boost — doubles your points if correct, but costs 1 pt if wrong.',
  3: '3× boost — triples your points if correct, but costs 2 pts if wrong.',
}

function SortableItem({ artist, index, onRemove, onUpdate, multiplierCount }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: artist.id })
  const [showInfo, setShowInfo]  = useState(false)
  const multiplier               = artist.multiplier ?? 1
  const canUpMultiplier          = multiplier === 1 && multiplierCount < MAX_CONFIDENCE_PICKS

  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.45 : 1,
      background: isDragging ? '#fdf7f4' : 'var(--card-bg)',
      border: `1.5px solid ${isDragging ? 'var(--sunset)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', marginBottom: '6px',
      boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.10)' : 'none',
    }}>
      {/* Artist row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: index < 3 ? 'var(--sunset)' : 'var(--muted)', minWidth: '18px', textAlign: 'center' }}>{index + 1}</span>
        <span {...attributes} {...listeners} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--border)', fontSize: '16px', userSelect: 'none', lineHeight: 1, touchAction: 'none' }}>⠿</span>
        <img src={artist.image} alt={artist.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#f0ece4' }} onError={e => { e.target.src = AVATAR_BASE + encodeURIComponent(artist.name) }} />
        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist.name}</span>
        <button onClick={() => onRemove(artist.id)} aria-label={`Remove ${artist.name}`} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px 4px', borderRadius: '6px', flexShrink: 0, transition: 'color 0.12s' }} onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>×</button>
      </div>

      {/* Controls row */}
      <div style={{ padding: '0 10px 8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Confidence:</span>
          {[1, 2, 3].map(m => {
            const active   = multiplier === m
            const disabled = !active && m > 1 && !canUpMultiplier
            return (
              <button key={m} title={MULTIPLIER_INFO[m]} onClick={() => !disabled && onUpdate(artist.id, { multiplier: m })} style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                border: active ? '1.5px solid var(--sunset)' : '1.5px solid var(--border)',
                background: active ? '#fff7f4' : 'transparent',
                color: active ? 'var(--sunset)' : disabled ? 'var(--border)' : 'var(--muted)',
                cursor: disabled ? 'default' : 'pointer',
              }}>{m}×</button>
            )
          })}
          <button onClick={() => setShowInfo(v => !v)} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', border: '1.5px solid var(--border)', background: showInfo ? 'var(--sand)' : 'transparent', color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>?</button>
          <div style={{ width: '1px', height: '14px', background: 'var(--border)', margin: '0 2px' }} />
          {[['predictedReunion', '🔄 Reunion'], ['predictedDebut', '✨ Debut']].map(([field, label]) => {
            const active = !!artist[field]
            return (
              <button key={field} onClick={() => onUpdate(artist.id, { [field]: !active })} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                border: active ? '1.5px solid var(--mauve)' : '1.5px solid var(--border)',
                background: active ? '#f5eeff' : 'transparent',
                color: active ? 'var(--mauve)' : 'var(--muted)',
                cursor: 'pointer',
              }}>{label}</button>
            )
          })}
        </div>
        {showInfo && (
          <div style={{ marginTop: '6px', padding: '8px 10px', background: 'var(--sand)', borderRadius: '8px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6 }}>
            <div><strong style={{ color: 'var(--dusk)' }}>1×</strong> — Normal pick. No risk, no bonus.</div>
            <div><strong style={{ color: 'var(--sunset)' }}>2×</strong> — Doubles points if correct. Costs 1 pt if wrong.</div>
            <div><strong style={{ color: 'var(--sunset)' }}>3×</strong> — Triples points if correct. Costs 2 pts if wrong.</div>
            <div style={{ marginTop: '4px' }}>Max {MAX_CONFIDENCE_PICKS} boosted picks total.</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PickList({ picks, onChange, onSubmit, userName, onUserNameChange }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const multiplierCount = picks.filter(p => (p.multiplier ?? 1) > 1).length

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    onChange(arrayMove(picks, picks.findIndex(p => p.id === active.id), picks.findIndex(p => p.id === over.id)))
  }

  function updatePick(id, changes) {
    onChange(picks.map(p => p.id === id ? { ...p, ...changes } : p))
  }

  const canSubmit = picks.length >= 1 && userName.trim().length > 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700 }}>Your picks</h2>
        <span style={{ fontSize: '12px', fontWeight: 500, color: picks.length >= 10 ? 'var(--palm)' : 'var(--muted)' }}>{picks.length}/10 {picks.length >= 10 ? '✓ Full' : ''}</span>
      </div>

      {multiplierCount > 0 && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
          {multiplierCount}/{MAX_CONFIDENCE_PICKS} confidence boosts used
        </p>
      )}

      {picks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--muted)', fontSize: '13px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', lineHeight: 1.6 }}>
          <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎶</div>
          Search for artists<br/>and add them to your list
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={picks.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {picks.map((artist, i) => (
              <SortableItem key={artist.id} artist={artist} index={i}
                onRemove={id => onChange(picks.filter(p => p.id !== id))}
                onUpdate={updatePick}
                multiplierCount={multiplierCount}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {picks.length > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <input type="text" placeholder="Your name (shown on leaderboard)" value={userName} onChange={e => onUserNameChange(e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
          <button onClick={onSubmit} disabled={!canSubmit} style={{
            width: '100%', padding: '11px', borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em',
            cursor: canSubmit ? 'pointer' : 'default',
            background: canSubmit ? 'linear-gradient(135deg, var(--sunset) 0%, var(--mauve) 100%)' : 'var(--border)',
            color: canSubmit ? '#fff' : 'var(--muted)',
          }}>🔒 Lock in my picks</button>
          {!userName.trim() && picks.length > 0 && <p style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '6px' }}>Add your name to submit</p>}
        </div>
      )}
    </div>
  )
}
