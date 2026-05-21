import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'noter_notes'

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Evaluated once when the module first loads. If localStorage is empty we
// seed it with a single blank note so the editor is never in a "no notes"
// state on first visit. The array is cached so both useState initialisers
// below receive the same identity and the same UUID.
const _initialNotes = (() => {
  const stored = loadNotes()
  if (stored.length > 0) return stored
  const now = new Date().toISOString()
  return [{ id: crypto.randomUUID(), title: '', content: '', createdAt: now, updatedAt: now }]
})()

export function useNotes() {
  const [notes, setNotes] = useState(() => _initialNotes)
  const [activeId, setActiveId] = useState(() => _initialNotes[0].id)

  // Debounced persistence — clears and restarts the 500 ms timer on every
  // notes change, so localStorage is only written after typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
    }, 500)
    return () => clearTimeout(timer)
  }, [notes])

  const createNote = useCallback(() => {
    const now = new Date().toISOString()
    const note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
    }
    setNotes(prev => [note, ...prev])
    setActiveId(note.id)
  }, [])

  const updateNote = useCallback((id, changes) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, ...changes, updatedAt: new Date().toISOString() }
          : n,
      ),
    )
  }, [])

  const deleteNote = useCallback((id) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === id)
      const next = prev.filter(n => n.id !== id)

      setActiveId(() => {
        if (next.length === 0) return null
        // prefer the note that slid into the same position, or the last one
        return next[Math.min(idx, next.length - 1)].id
      })

      return next
    })
  }, [])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  return {
    notes,
    activeId,
    setActiveId,
    activeNote,
    createNote,
    updateNote,
    deleteNote,
  }
}
