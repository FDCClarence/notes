import { useRef, useEffect, useCallback } from 'react'
import { GRID, surfaces, fonts, tools, inkColors } from '../config/themes'

// paddingTop must be a multiple of GRID so that the background rule lines
// land at the bottom of each text row rather than cutting through the middle.
const PADDING_TOP = GRID // 36px — first rule falls exactly at the end of line 1

function inkWithOpacity(hex, opacity) {
  if (opacity >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function Editor({ activeId, activeNote, updateNote, prefs }) {
  const editorRef = useRef(null)
  const isInternalUpdate = useRef(false)

  const surface = surfaces[prefs.surface] ?? surfaces.yellow
  const font = fonts.find(f => f.id === prefs.font) ?? fonts[0]
  const tool = tools.find(t => t.id === prefs.tool) ?? tools[0]
  const inkColor = inkColors.find(c => c.id === prefs.inkColor) ?? inkColors[0]

  const ruleColor = surface.rule ?? 'transparent'
  const rulePos = GRID - 1
  const isNapkin = prefs.surface === 'napkin'

  const paperStyle = {
    backgroundColor: surface.bg,
    backgroundImage: surface.rule
      ? `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent ${rulePos}px,
          ${ruleColor} ${rulePos}px,
          ${ruleColor} ${GRID}px
        )`
      : 'none',
    backgroundSize: `100% ${GRID}px`,
    backgroundPosition: `0 ${PADDING_TOP}px`,
    borderLeft: surface.borderLeft ?? 'none',
    borderTop: surface.borderTop ?? 'none',
    outline: surface.outline ?? 'none',
    paddingLeft: surface.paddingLeft ?? '24px',
    paddingRight: '32px',
    paddingTop: `${PADDING_TOP}px`,
    paddingBottom: `${GRID * 4}px`,
    transform: isNapkin ? 'rotate(0.4deg)' : 'none',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'background-color 200ms ease, transform 200ms ease',
  }

  const textStyle = {
    fontFamily: font.family,
    color: inkWithOpacity(inkColor.hex, tool.opacity),
    letterSpacing: tool.letterSpacing,
    fontWeight: tool.fontWeight,
    fontStyle: tool.fontStyle,
    filter: tool.filter,
    lineHeight: `${GRID}px`,
    fontSize: '16px',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    outline: 'none',
    minHeight: '100%',
    transition: 'color 200ms ease',
  }

  // On mount: set initial content
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When activeId changes: swap content without firing the input handler
  useEffect(() => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    editorRef.current.innerHTML = activeNote?.content ?? ''
    isInternalUpdate.current = false
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(
    e => {
      if (isInternalUpdate.current) return
      if (activeId) {
        updateNote(activeId, { content: e.target.innerHTML })
      }
    },
    [activeId, updateNote],
  )

  return (
    <div style={paperStyle}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={textStyle}
        spellCheck={false}
        data-testid="editor"
      />
    </div>
  )
}

export function applyHighlight(color) {
  const resolved = !color || color === 'none' ? 'transparent' : color
  document.execCommand('hiliteColor', false, resolved)
}
