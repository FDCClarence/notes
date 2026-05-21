import { highlightColors } from '../config/themes'
import { applyHighlight } from './Editor'

export function Toolbar({ onToggleSettings, settingsOpen, onOpenQuiz, hasActiveNote, prefs, setPref }) {
  function handleHighlight(colorId) {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    setPref('highlightColor', colorId)
    const colorEntry = highlightColors.find(c => c.id === colorId)
    applyHighlight(colorEntry?.hex ?? 'none')
  }

  return (
    <div
      className="parch-topbar flex items-center justify-end gap-1 px-3"
      style={{ height: '44px', flexShrink: 0 }}
    >
      {/* Highlight color swatches */}
      <div className="flex items-center gap-1.5 mr-0.5" aria-label="Highlight color">
        {highlightColors.map(color => {
          const isSelected = prefs?.highlightColor === color.id
          const isNone = color.id === 'none'
          return (
            <button
              key={color.id}
              onClick={() => handleHighlight(color.id)}
              aria-label={`Highlight: ${color.label}`}
              aria-pressed={isSelected}
              title={color.label}
              className="relative rounded-full focus:outline-none transition-transform hover:scale-110 active:scale-95"
              style={{
                width: '17px',
                height: '17px',
                flexShrink: 0,
                backgroundColor: isNone ? '#f5f1eb' : color.hex,
                border: isNone ? '1px solid #d4cfc7' : 'none',
                boxShadow: isSelected
                  ? `0 0 0 2px white, 0 0 0 3.5px ${isNone ? '#94a3b8' : color.hex}`
                  : '0 1px 2px rgba(0,0,0,0.16)',
                transition: 'transform 0.12s, box-shadow 0.15s',
              }}
            >
              {isNone && (
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto' }}
                >
                  <line x1="2.5" y1="2.5" x2="6.5" y2="6.5" stroke="#b0a898" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="6.5" y1="2.5" x2="2.5" y2="6.5" stroke="#b0a898" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

      {/* Quiz button */}
      <button
        onClick={onOpenQuiz}
        disabled={!hasActiveNote}
        aria-label="Generate quiz from note"
        title={hasActiveNote ? 'Generate quiz' : 'Open a note to generate a quiz'}
        className="focus:outline-none rounded transition-colors disabled:cursor-not-allowed"
        style={{
          padding: '6px',
          color: hasActiveNote ? '#64748b' : '#cbd5e1',
          backgroundColor: 'transparent',
        }}
      >
        {/* Feather book-open icon */}
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />

      {/* Settings / gear button */}
      <button
        data-settings-toggle
        onClick={onToggleSettings}
        aria-label="Toggle settings"
        aria-expanded={settingsOpen}
        className="focus:outline-none rounded transition-colors"
        style={{
          padding: '6px',
          color: settingsOpen ? '#1e293b' : '#94a3b8',
          backgroundColor: settingsOpen ? '#f1f5f9' : 'transparent',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  )
}
