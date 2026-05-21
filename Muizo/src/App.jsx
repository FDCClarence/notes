import { useState, useEffect, useCallback } from 'react'
import { GlobalFilters } from './components/GlobalFilters'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Toolbar } from './components/Toolbar'
import { SettingsPanel } from './components/SettingsPanel'
import { QuizModal } from './components/QuizModal'
import { usePreferences } from './hooks/usePreferences'
import { useNotes } from './hooks/useNotes'

// Absolutely-positioned napkin texture overlays: crinkle corners, ketchup
// blobs, and grease smears. Shown only when surface === 'napkin'.
function NapkinOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ zIndex: 2 }}
    >
      {/* ── Crinkle corners ───────────────────────────────────────────── */}
      {/* top-left */}
      <svg
        className="absolute top-0 left-0"
        width="90"
        height="90"
        viewBox="0 0 90 90"
      >
        <path d="M0,0 L48,18 L18,48 Z" fill="rgba(175,158,135,0.18)" />
        <line x1="0" y1="0" x2="48" y2="18" stroke="rgba(150,130,105,0.28)" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="18" y2="48" stroke="rgba(150,130,105,0.28)" strokeWidth="0.8" />
        <line x1="22" y1="0" x2="48" y2="22" stroke="rgba(150,130,105,0.15)" strokeWidth="0.5" />
      </svg>

      {/* top-right */}
      <svg
        className="absolute top-0 right-0"
        width="90"
        height="90"
        viewBox="0 0 90 90"
      >
        <path d="M90,0 L42,20 L72,50 Z" fill="rgba(175,158,135,0.15)" />
        <line x1="90" y1="0" x2="42" y2="20" stroke="rgba(150,130,105,0.24)" strokeWidth="0.8" />
        <line x1="90" y1="0" x2="72" y2="50" stroke="rgba(150,130,105,0.24)" strokeWidth="0.8" />
      </svg>

      {/* bottom-left */}
      <svg
        className="absolute bottom-0 left-0"
        width="70"
        height="70"
        viewBox="0 0 70 70"
      >
        <path d="M0,70 L35,52 L18,28 Z" fill="rgba(175,158,135,0.13)" />
        <line x1="0" y1="70" x2="35" y2="52" stroke="rgba(150,130,105,0.22)" strokeWidth="0.8" />
        <line x1="0" y1="70" x2="18" y2="28" stroke="rgba(150,130,105,0.22)" strokeWidth="0.8" />
      </svg>

      {/* bottom-right */}
      <svg
        className="absolute bottom-0 right-0"
        width="70"
        height="70"
        viewBox="0 0 70 70"
      >
        <path d="M70,70 L38,50 L55,25 Z" fill="rgba(175,158,135,0.13)" />
        <line x1="70" y1="70" x2="38" y2="50" stroke="rgba(150,130,105,0.22)" strokeWidth="0.8" />
        <line x1="70" y1="70" x2="55" y2="25" stroke="rgba(150,130,105,0.22)" strokeWidth="0.8" />
      </svg>

      {/* ── Ketchup blobs ─────────────────────────────────────────────── */}
      {/* primary blob, upper-right quadrant */}
      <div
        style={{
          position: 'absolute',
          top: '18%',
          right: '12%',
          width: '32px',
          height: '24px',
          backgroundColor: 'rgba(178, 44, 32, 0.16)',
          borderRadius: '62% 38% 55% 45% / 44% 56% 38% 62%',
          transform: 'rotate(12deg)',
        }}
      />
      {/* small satellite blob */}
      <div
        style={{
          position: 'absolute',
          top: '21%',
          right: '10%',
          width: '14px',
          height: '11px',
          backgroundColor: 'rgba(178, 44, 32, 0.12)',
          borderRadius: '55% 45% 60% 40% / 50% 50% 50% 50%',
          transform: 'rotate(-8deg)',
        }}
      />
      {/* tiny splatter dot */}
      <div
        style={{
          position: 'absolute',
          top: '16%',
          right: '14%',
          width: '6px',
          height: '6px',
          backgroundColor: 'rgba(178, 44, 32, 0.14)',
          borderRadius: '50%',
        }}
      />

      {/* second ketchup spot, lower-left */}
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: '16%',
          width: '20px',
          height: '16px',
          backgroundColor: 'rgba(165, 38, 28, 0.12)',
          borderRadius: '50% 50% 44% 56% / 56% 44% 56% 44%',
          transform: 'rotate(-20deg)',
        }}
      />

      {/* ── Grease smears ─────────────────────────────────────────────── */}
      {/* long diagonal smear, centre-left */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '8%',
          width: '80px',
          height: '10px',
          backgroundColor: 'rgba(210, 188, 130, 0.20)',
          borderRadius: '50%',
          transform: 'rotate(-10deg)',
          filter: 'blur(2px)',
        }}
      />
      {/* short smear, lower-right */}
      <div
        style={{
          position: 'absolute',
          bottom: '35%',
          right: '18%',
          width: '52px',
          height: '8px',
          backgroundColor: 'rgba(215, 192, 135, 0.18)',
          borderRadius: '50%',
          transform: 'rotate(6deg)',
          filter: 'blur(1.5px)',
        }}
      />
      {/* faint wide smear, near top */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '30%',
          width: '110px',
          height: '7px',
          backgroundColor: 'rgba(205, 182, 122, 0.13)',
          borderRadius: '50%',
          transform: 'rotate(2deg)',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )
}

// ── Empty-state illustration ──────────────────────────────────────────────────
function EmptyState({ onCreateNote }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center select-none"
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

  const isNapkin = prefs.surface === 'napkin'

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

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <Sidebar
        notes={notes}
        activeId={activeId}
        setActiveId={setActiveId}
        createNote={createNote}
        deleteNote={deleteNote}
      />

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Toolbar always on top */}
        <Toolbar
          onToggleSettings={() => setIsSettingsOpen(o => !o)}
          settingsOpen={isSettingsOpen}
          onOpenQuiz={() => setQuizOpen(true)}
          hasActiveNote={!!activeNote}
        />

        {/* Editor area — relative so the napkin overlay stays contained */}
        <div className="relative flex flex-1 min-h-0">
          {isNapkin && <NapkinOverlay />}

          {activeNote ? (
            <Editor
              activeId={activeId}
              activeNote={activeNote}
              updateNote={updateNote}
              prefs={prefs}
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
