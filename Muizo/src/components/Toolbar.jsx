import { useEffect, useRef, useState } from 'react'
import { highlightColors } from '../config/themes'

/** Matches SettingsPanel width transition (0.28s) */
const SETTINGS_PANEL_MS = 280

export function Toolbar({
  sidebarOpen,
  onToggleSidebar,
  onToggleSettings,
  settingsOpen,
  onOpenQuiz,
  hasActiveNote,
  prefs,
  setPref,
}) {
  const [actionsMounted, setActionsMounted] = useState(!settingsOpen)
  const [actionsVisible, setActionsVisible] = useState(!settingsOpen)
  const wasSettingsOpen = useRef(settingsOpen)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (settingsOpen) {
      setActionsMounted(false)
      setActionsVisible(false)
      wasSettingsOpen.current = true
      return
    }

    const justClosed = wasSettingsOpen.current
    wasSettingsOpen.current = false
    setActionsMounted(true)

    if (!justClosed) {
      setActionsVisible(true)
      return
    }

    setActionsVisible(false)
    const timer = setTimeout(() => setActionsVisible(true), SETTINGS_PANEL_MS)
    return () => clearTimeout(timer)
  }, [settingsOpen])

  useEffect(() => {
    if (!dropdownOpen) return
    function handleMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [dropdownOpen])

  const activeHighlight =
    highlightColors.find(c => c.id === prefs?.highlightColor) ?? highlightColors[0]
  const activeColorHex = activeHighlight.hex

  return (
    <div
      className="parch-topbar flex items-center gap-1 px-3"
      style={{ height: '44px', flexShrink: 0 }}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="parch-sidebar-toggle"
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarOpen}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? '←' : '→'}
      </button>

      <button
        type="button"
        onClick={onOpenQuiz}
        disabled={!hasActiveNote}
        className="parch-quiz-btn"
        aria-label="Generate quiz from note"
        title={hasActiveNote ? 'Generate quiz' : 'Open a note to generate a quiz'}
      >
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
        <span>QUIZ ME</span>
      </button>

      {actionsMounted && (
      <div
        className={`parch-topbar-actions flex flex-1 items-center justify-end gap-1 min-w-0${actionsVisible ? ' parch-topbar-actions--visible' : ''}`}
      >
      {/* Highlight color picker */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="parch-highlight-btn"
          onClick={() => setDropdownOpen(o => !o)}
          aria-label={`Choose highlight color: ${activeHighlight.label}`}
          aria-expanded={dropdownOpen}
        >
          <span aria-hidden="true" style={{ fontSize: '12px', lineHeight: 1 }}>✦</span>
          <span>Highlight Color :</span>
          <span
            className="parch-highlight-btn__swatch"
            aria-hidden="true"
            style={{ backgroundColor: activeColorHex }}
          />
        </button>

        {dropdownOpen && (
          <div
            role="listbox"
            aria-label="Highlight colors"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: '#fdf7eb',
              border: '1px solid rgba(180,155,110,0.28)',
              borderRadius: '10px',
              padding: '7px 8px',
              boxShadow: '0 4px 18px rgba(80,60,20,0.13)',
              display: 'flex',
              gap: '5px',
              alignItems: 'center',
              zIndex: 50,
            }}
          >
            {highlightColors.map(color => {
              const isActive = (prefs?.highlightColor ?? 'yellow') === color.id
              return (
                <button
                  key={color.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={color.label}
                  title={color.label}
                  onClick={() => {
                    setPref('highlightColor', color.id)
                    setDropdownOpen(false)
                  }}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '5px',
                    border: isActive
                      ? '2.5px solid #7a6035'
                      : '1.5px solid rgba(180,155,100,0.38)',
                    background: color.hex,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'transform 0.1s, border-color 0.1s',
                    padding: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                </button>
              )
            })}
          </div>
        )}
      </div>

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
      )}
    </div>
  )
}
