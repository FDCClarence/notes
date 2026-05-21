import { useState } from 'react'
import { getNoteTitle } from '../hooks/useNotes'

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

export function Sidebar({ notes, activeId, setActiveId, createNote, deleteNote }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? notes.filter(note => {
        const q = query.toLowerCase()
        const plain = stripHtml(note.content).toLowerCase()
        return plain.includes(q)
      })
    : notes

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
