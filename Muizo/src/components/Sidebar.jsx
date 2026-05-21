import { useState, useRef } from 'react'
import { getNoteTitle } from '../hooks/useNotes'

function isValidNote(item) {
  return (
    item &&
    typeof item === 'object' &&
    !Array.isArray(item) &&
    typeof item.id === 'string' &&
    'content' in item
  )
}

/** Accepts a single note (Save Notes export) or an array (full backup). */
function normalizeNotesImport(data) {
  if (Array.isArray(data)) {
    return data.every(isValidNote) ? data : null
  }
  return isValidNote(data) ? [data] : null
}

function stripHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function formatDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function NoteCard({ note, isActive, onSelect, onDelete }) {
  return (
    <li
      onClick={onSelect}
      className={`parch-note-item group relative mx-1 flex cursor-pointer flex-col gap-0.5 rounded-md transition-colors${isActive ? ' active' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="parch-text truncate text-sm font-medium leading-snug">
          {getNoteTitle(note)}
        </span>
        <button
          onClick={onDelete}
          className="parch-text-faint ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          aria-label="Delete note"
        >
          <TrashIcon />
        </button>
      </div>
      <span className="parch-text-faint text-xs">{formatDate(note.updatedAt)}</span>
    </li>
  )
}

function buildFilename(note) {
  const title = getNoteTitle(note)
  const words = title.trim().split(/\s+/).slice(0, 4)
  const slug = words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'note'
  return `${slug}-muizo.json`
}

export function Sidebar({ notes, activeId, setActiveId, createNote, deleteNote, activeNote, onImport }) {
  const [query, setQuery] = useState('')
  const [importError, setImportError] = useState(false)
  const fileInputRef = useRef(null)

  function handleExport() {
    if (!activeNote) return
    const blob = new Blob([JSON.stringify(activeNote, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = buildFilename(activeNote)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filtered = query.trim()
    ? notes.filter(note => {
        const q = query.toLowerCase()
        const plain = stripHtml(note.content).toLowerCase()
        return plain.includes(q)
      })
    : notes

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    // Reset so the same file can be re-selected if cancelled
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        const imported = normalizeNotesImport(data)
        if (!imported) {
          setImportError(true)
          return
        }
        setImportError(false)
        onImport(imported)
      } catch {
        setImportError(true)
      }
    }
    reader.readAsText(file)
  }

  function handleUploadClick() {
    setImportError(false)
    fileInputRef.current?.click()
  }

  return (
    <aside className="parch-sidebar flex h-screen flex-col">
      <div className="p-3 border-b border-slate-100">
        <button
          onClick={createNote}
          className="parch-btn parch-btn-primary w-full justify-center font-medium"
        >
          <span className="text-base leading-none">+</span>
          New note
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <input
          type="text"
          placeholder="Search…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="parch-input w-full text-sm"
        />
      </div>

      <ul className="flex-1 overflow-y-auto py-1">
        {filtered.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isActive={note.id === activeId}
            onSelect={() => setActiveId(note.id)}
            onDelete={e => {
              e.stopPropagation()
              deleteNote(note.id)
            }}
          />
        ))}
        {filtered.length === 0 && (
          <li className="parch-text-faint px-4 py-6 text-center text-xs">
            {query ? 'No results' : 'No notes yet'}
          </li>
        )}
      </ul>

      {/* ── Import / Export footer — always pinned to the bottom ── */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: '1px solid var(--parch-border-hard)',
          padding: '8px',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {importError && (
          <p
            style={{
              fontSize: '11px',
              color: '#92400e',
              marginBottom: '6px',
              padding: '0 2px',
            }}
          >
            Invalid notes file
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={handleUploadClick}
            className="parch-btn parch-btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Upload Notes File
          </button>
          <button
            onClick={handleExport}
            disabled={!activeNote}
            className="parch-btn parch-btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: activeNote ? 1 : 0.4,
              cursor: activeNote ? 'pointer' : 'not-allowed',
            }}
          >
            Save Notes
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Worn-edge vignette on the right border */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '14px',
          height: '100%',
          background: 'linear-gradient(to right, transparent, rgba(80,50,10,0.07))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </aside>
  )
}
