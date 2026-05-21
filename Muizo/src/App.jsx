import { useState, useEffect, useCallback } from 'react'
import { GlobalFilters } from './components/GlobalFilters'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Toolbar } from './components/Toolbar'
import { SettingsPanel } from './components/SettingsPanel'
import { QuizModal } from './components/QuizModal'
import { usePreferences } from './hooks/usePreferences'
import { useNotes } from './hooks/useNotes'

// ── Empty-state illustration ──────────────────────────────────────────────────
function EmptyState({ onCreateNote }) {
  return (
    <div
      className="parch-empty flex flex-1 flex-col items-center justify-center select-none"
      style={{ zIndex: 3, position: 'relative', gap: '20px' }}
    >
      {/* Pencil + notepad illustration */}
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden="true"
        style={{ opacity: 0.55 }}
      >
        {/* Notepad body */}
        <rect x="18" y="22" width="52" height="62" rx="4" fill="#E2E8F0" />
        {/* Spiral binding */}
        <rect x="14" y="22" width="8" height="62" rx="2" fill="#CBD5E1" />
        {[30, 42, 54, 66, 78].map(y => (
          <circle key={y} cx="18" cy={y} r="3.5" fill="#94A3B8" />
        ))}
        {/* Ruled lines */}
        {[40, 52, 64, 74].map(y => (
          <line key={y} x1="30" y1={y} x2="62" y2={y} stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Pencil body */}
        <rect x="60" y="10" width="12" height="44" rx="2" fill="#FCD34D" transform="rotate(38 66 34)" />
        {/* Pencil tip */}
        <polygon points="80,62 86,76 74,68" fill="#F59E0B" transform="rotate(38 80 69)" />
        <polygon points="80,62 86,76 83,69" fill="#1E293B" transform="rotate(38 83 69)" />
        {/* Pencil eraser band */}
        <rect x="60" y="10" width="12" height="6" rx="1" fill="#FCA5A5" transform="rotate(38 66 13)" />
      </svg>

      <div className="flex flex-col items-center gap-2">
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>
          Create your first note
        </p>
        <p style={{ fontSize: '12px', color: '#94A3B8' }}>
          Press{' '}
          <kbd
            style={{
              display: 'inline-block',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              color: '#64748B',
            }}
          >
            ⌘ N
          </kbd>
          {' '}or click the + button
        </p>
      </div>

      <button
        onClick={onCreateNote}
        style={{
          marginTop: '4px',
          padding: '8px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          background: '#1E293B',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        New note
      </button>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const prefs = usePreferences()
  const { notes, activeId, setActiveId, activeNote, createNote, updateNote, deleteNote } = useNotes()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)

  const isSidebarOpen = prefs.sidebarOpen !== false

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  const downloadJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [notes])

  useEffect(() => {
    function handleKeyDown(e) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'n') {
        e.preventDefault()
        createNote()
      } else if (mod && e.key === 's') {
        e.preventDefault()
        downloadJSON()
      }
      // Escape is already handled inside SettingsPanel + QuizModal
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [createNote, downloadJSON])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Hidden SVG filter defs — rendered once, outside content flow */}
      <GlobalFilters />

      {/* ── Sidebar (stays mounted; shell animates width) ─────────────── */}
      <div
        className={`parch-sidebar-wrap${isSidebarOpen ? '' : ' parch-sidebar-wrap--collapsed'}`}
        aria-hidden={!isSidebarOpen}
      >
        <Sidebar
          notes={notes}
          activeId={activeId}
          setActiveId={setActiveId}
          createNote={createNote}
          deleteNote={deleteNote}
        />
      </div>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Toolbar always on top */}
        <Toolbar
          sidebarOpen={isSidebarOpen}
          onToggleSidebar={() => prefs.setPref('sidebarOpen', !isSidebarOpen)}
          onToggleSettings={() => setIsSettingsOpen(o => !o)}
          settingsOpen={isSettingsOpen}
          onOpenQuiz={() => setQuizOpen(true)}
          hasActiveNote={!!activeNote}
          prefs={prefs}
          setPref={prefs.setPref}
        />

        <div className="relative flex flex-1 min-h-0">
          {activeNote ? (
            <Editor
              activeId={activeId}
              activeNote={activeNote}
              updateNote={updateNote}
              prefs={prefs}
              quizOpen={quizOpen}
              settingsOpen={isSettingsOpen}
            />
          ) : notes.length === 0 ? (
            <EmptyState onCreateNote={createNote} />
          ) : (
            <div
              className="flex flex-1 items-center justify-center text-sm text-slate-400 select-none"
              style={{ zIndex: 3, position: 'relative' }}
            >
              Select a note or create one to start writing
            </div>
          )}
        </div>
      </div>

      {/* SettingsPanel sits in the flex row; width animates so the editor resizes */}
      <SettingsPanel
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prefs={prefs}
        setPref={prefs.setPref}
      />

      {/* Quiz modal — mounts lazily when quizOpen becomes true */}
      <QuizModal
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        activeNote={activeNote}
      />
    </div>
  )
}

export default App
