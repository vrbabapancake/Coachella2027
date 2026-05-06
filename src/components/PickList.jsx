import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ProbabilityBadge } from './ProbabilityBadge.jsx'

const AVATAK_BASE = 'https://ui-avatars.com/api/?background=e8673a&color=fff&bold=true&name='

function SortableItem({ artist, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: artist.id })
  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      opacity: isDragging ? 0.45 : 1, display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 12px', background: isDragging ? '#fdf7f4' : 'var(--card-bg)',
      border: `1.5px solid ${isDragging ? 'var(--sunset)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', marginBottom: '5px',
      boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.10)' : 'none',
    }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: index < 3 ? 'var(--sunset)' : 'var(--muted)', minWidth: '18px', textAlign: 'center' }}>{index + 1}</span>
      <span {...attributes} {...listeners} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--border)', fontSize: '18px', userSelect: 'none', lineHeight: 1, touchAction: 'none' }}>⠿</span>
      <img src={artist.image} alt={artist.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#f0ece4' }} onError={e => { e.target.src = AVATAR_BASE + encodeURIComponent(artist.name) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{artist.name}</div>
        <ProbabilityBadge score={artist.probability} showLabel={false} />
      </div>
      <button onClick={() => onRemove(artist.id)} aria-label={`Remove ${artist.name}`} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', borderRadius: '6px', flexShrink: 0, transition: 'color 0.12s' }} onMouseEnter={e => e.currentTarget.style.color = '#dc2626'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>×</button>
    </div>
  )
}

export function PickList({ picks, onChange, onSubmit, userName, onUserNameChange }) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIdx = picks.findIndex(p => p.id === active.id)
    const newIdx = picks.findIndex(p => p.id === over.id)
    onChange(arrayMove(picks, oldIdx, newIdx))
  }

  const canSubmit = picks.length >= 1 && userName.trim().length > 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700 }}>Your picks</h2>
        <span style={{ fontSize: '12px', fontWeight: 500, color: picks.length >= 10 ? 'var(--palm)' : 'var(--muted)' }}>{picks.length}/10 {picks.length >= 10 ? '✓ Full' : ''}</span>
      </div>
      {picks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--muted)', fontSize: '13px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', lineHeight: 1.6 }}>
          <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎶</div>
          Search for artists<br/>and add them to your list
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={picks.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {picks.map((artist, i) => (
              <SortableItem key={artist.id} artist={artist} index={i} onRemove={id => onChange(picks.filter(p => p.id !== id))} />
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
