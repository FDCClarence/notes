import { useEffect, useRef, useState } from 'react'
import { surfaces, fonts, tools, inkColors } from '../config/themes'
import { ANTHROPIC_KEY_STORAGE } from '../hooks/useQuiz'

// ─── Surface thumbnail ────────────────────────────────────────────────────────

function SurfaceSwatch({ id, surface, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      title={surface.label}
      className="relative overflow-hidden flex-1 rounded focus:outline-none"
      style={{
        height: '64px',
        boxShadow: selected
          ? '0 0 0 2px #1e293b, 0 0 0 3px white inset'
          : '0 0 0 1px #e2e8f0',
      }}
    >
      {/* Ruled paper background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: surface.bg,
          backgroundImage: surface.bgImage
            ? surface.bgImage
            : surface.rule
              ? `repeating-linear-gradient(to bottom, transparent 0px, transparent 9px, ${surface.rule} 9px, ${surface.rule} 10px)`
              : 'none',
          backgroundSize: surface.bgImage ? surface.bgSize : '100% 10px',
          backgroundPosition: surface.bgImage ? surface.bgPosition : undefined,
          backgroundRepeat: surface.bgImage ? surface.bgRepeat : undefined,
          borderLeft: surface.borderLeft ?? undefined,
          borderTop: surface.borderTop ?? undefined,
          outline: surface.outline ?? undefined,
          outlineOffset: '-1.5px',
        }}
      />

      {/* Label strip — inverted for dark surface so text stays legible */}
      <div
        className="absolute bottom-0 inset-x-0 text-center"
        style={{
          fontSize: '8px',
          lineHeight: '14px',
          color: surface.textColor ? 'rgba(245,245,240,0.75)' : '#64748b',
          backgroundColor: surface.textColor
            ? 'rgba(0,0,0,0.35)'
            : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(2px)',
        }}
      >
        {surface.label}
      </div>
    </button>
  )
}

// ─── Font card ────────────────────────────────────────────────────────────────

function FontCard({ font, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(font.id)}
      aria-pressed={selected}
      className="flex flex-col items-center justify-center gap-1 flex-1 rounded focus:outline-none transition-shadow"
      style={{
        height: '56px',
        backgroundColor: selected ? '#f8fafc' : '#ffffff',
        boxShadow: selected
          ? '0 0 0 2px #1e293b'
          : '0 0 0 1px #e2e8f0',
      }}
    >
      <span
        style={{
          fontFamily: font.family,
          fontSize: '20px',
          lineHeight: 1,
          color: '#1e293b',
        }}
      >
        Aa
      </span>
      <span
        style={{
          fontSize: '8px',
          color: '#94a3b8',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.02em',
        }}
      >
        {font.label}
      </span>
    </button>
  )
}

// ─── SettingsPanel ─────────────────────────────────────────────────────────────

export function SettingsPanel({ open, onClose, prefs, setPref }) {
  const panelRef = useRef(null)
  const [hasStoredKey, setHasStoredKey] = useState(() => !!localStorage.getItem(ANTHROPIC_KEY_STORAGE))
  const [keyRemovedMsg, setKeyRemovedMsg] = useState(false)

  useEffect(() => {
    if (open) setHasStoredKey(!!localStorage.getItem(ANTHROPIC_KEY_STORAGE))
  }, [open])

  function handleForgetKey() {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE)
    setHasStoredKey(false)
    setKeyRemovedMsg(true)
    setTimeout(() => setKeyRemovedMsg(false), 2000)
  }

  // Close on outside click — but ignore the gear toggle button
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e) {
      if (e.target.closest('[data-settings-toggle]')) return
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal={open}
      aria-label="Settings"
      aria-hidden={!open}
      className="parch-settings flex h-full flex-shrink-0 flex-col overflow-hidden"
      style={{
        width: open ? '320px' : '0',
        boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.10)' : 'none',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 border-b border-slate-100" style={{ height: '52px' }}>
        <h2 className="parch-text-mid text-xs font-semibold tracking-widest uppercase">
          Preferences
        </h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="parch-text-faint hover:text-slate-700 transition-colors rounded p-1 focus:outline-none"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="3" x2="12" y2="12" />
            <line x1="12" y1="3" x2="3" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Scrollable sections ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>

        {/* ── 1. Writing surface ── */}
        <section className="mb-6">
          <SectionLabel>Writing surface</SectionLabel>
          <div className="flex gap-2">
            {Object.entries(surfaces)
              .filter(([, surface]) => !surface.hidden)
              .map(([id, surface]) => (
              <SurfaceSwatch
                key={id}
                id={id}
                surface={surface}
                selected={prefs.surface === id}
                onSelect={val => setPref('surface', val)}
              />
            ))}
          </div>
        </section>

        <Divider />

        {/* ── 2. Font ── */}
        <section className="mb-6">
          <SectionLabel>Font</SectionLabel>
          <div className="flex gap-2">
            {fonts.map(font => (
              <FontCard
                key={font.id}
                font={font}
                selected={prefs.font === font.id}
                onSelect={val => setPref('font', val)}
              />
            ))}
          </div>
        </section>

        <Divider />

        {/* ── 3. Writing tool ── */}
        <section className="mb-6">
          <SectionLabel>Writing tool</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setPref('tool', tool.id)}
                aria-pressed={prefs.tool === tool.id}
                className="focus:outline-none transition-all"
                style={{
                  padding: '5px 14px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: prefs.tool === tool.id ? 500 : 400,
                  backgroundColor: prefs.tool === tool.id ? '#1e293b' : '#f1f5f9',
                  color: prefs.tool === tool.id ? '#ffffff' : '#475569',
                  boxShadow: prefs.tool === tool.id ? 'none' : '0 0 0 1px #e2e8f0',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </section>

        <Divider />

        {/* ── 4. Ink color ── */}
        <section>
          <SectionLabel>Ink color</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            {inkColors.map(color => {
              const isSelected = prefs.inkColor === color.id
              return (
                <button
                  key={color.id}
                  onClick={() => setPref('inkColor', color.id)}
                  aria-label={color.label}
                  aria-pressed={isSelected}
                  title={color.label}
                  className="relative rounded-full focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  style={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: color.hex,
                    boxShadow: isSelected
                      ? `0 0 0 2.5px white, 0 0 0 4.5px ${color.hex}`
                      : '0 1px 3px rgba(0,0,0,0.25)',
                    transition: 'transform 0.12s, box-shadow 0.15s',
                  }}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path
                          d="M2.2 5.5l2.3 2.3 4.3-4.3"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

      </div>

      {(hasStoredKey || keyRemovedMsg) && (
        <div
          className="shrink-0 border-t px-5 py-4 flex flex-col items-center gap-2"
          style={{ borderColor: 'var(--parch-border)' }}
        >
          {keyRemovedMsg && (
            <p className="text-xs parch-text-mid" style={{ opacity: 0.85 }}>
              Key removed
            </p>
          )}
          {hasStoredKey && (
            <button
              type="button"
              onClick={handleForgetKey}
              className="text-xs parch-text-faint hover:text-[var(--parch-mid)] transition-colors focus:outline-none"
            >
              Forget API key
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="parch-text-faint mb-3"
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </p>
  )
}

function Divider() {
  return <div className="parch-divider mb-6" />
}
