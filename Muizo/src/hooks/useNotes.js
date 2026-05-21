import { useState, useEffect, useCallback } from 'react'
import { getItemWithMigration } from '../utils/localStorage'

const STORAGE_KEY = 'muizo_notes'
const LEGACY_KEY = 'noter_notes'

const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

function trimLine(text) {
  return text.replace(/\s+/g, ' ').trim()
}

/** Text through the first <br> or newline inside a single element subtree. */
function firstLineWithinElement(el) {
  let line = ''
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const chunk = node.textContent ?? ''
      const nl = chunk.indexOf('\n')
      if (nl >= 0) return line + chunk.slice(0, nl)
      line += chunk
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    if (node.tagName === 'BR') return line
    if (BLOCK_TAGS.has(node.tagName)) return line
    line += firstLineWithinElement(node)
  }
  return line
}

/**
 * First visual line from contentEditable HTML.
 * Walks root nodes in order; stops at <br>, newline, or a second top-level block
 * (e.g. title as a text node, body in the next <div>).
 */
export function getFirstLineFromContent(html) {
  if (!html || html === '<br>') return ''
  const root = document.createElement('div')
  root.innerHTML = html

  let line = ''

  for (const node of root.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const chunk = node.textContent ?? ''
      const nl = chunk.indexOf('\n')
      if (nl >= 0) return trimLine(line + chunk.slice(0, nl))
      line += chunk
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue

    if (node.tagName === 'BR') return trimLine(line)

    if (BLOCK_TAGS.has(node.tagName)) {
      if (trimLine(line)) return trimLine(line)
      return trimLine(firstLineWithinElement(node))
    }

    line += firstLineWithinElement(node)
    if (node.querySelector('br')) return trimLine(line)
  }

  return trimLine(line)
}

/** First line of plain text from HTML content (max 60 chars) for the title field. */
export function extractTitleFromContent(html) {
  const firstLine = getFirstLineFromContent(html)
  if (!firstLine) return ''
  return firstLine.length > 60 ? firstLine.slice(0, 60) : firstLine
}

/** Sidebar display name: stored title, else first line of content, else "Untitled". */
export function getNoteTitle(note) {
  const stored = (note.title ?? '').trim()
  if (stored) {
    return stored.length > 30 ? stored.slice(0, 30) + '\u2026' : stored
  }
  const firstLine = getFirstLineFromContent(note.content ?? '')
  if (!firstLine) return 'Untitled'
  return firstLine.length > 30 ? firstLine.slice(0, 30) + '\u2026' : firstLine
}

function loadNotes() {
  try {
    const raw = getItemWithMigration(STORAGE_KEY, LEGACY_KEY)
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
      prev.map(n => {
        if (n.id !== id) return n
        const next = { ...n, ...changes, updatedAt: new Date().toISOString() }
        if ('content' in changes) {
          next.title = extractTitleFromContent(changes.content)
        }
        return next
      }),
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
