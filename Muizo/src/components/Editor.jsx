import { useRef, useEffect, useCallback, useState, useLayoutEffect } from 'react'
import { GRID, surfaces, fonts, tools, inkColors } from '../config/themes'
import { SelectionTooltip } from './SelectionTooltip'

export const TOPIC_PREFIX = 'Topic : '
const TOPIC_PLACEHOLDER = 'Add a topic\u2026'

function isContentEmpty(html) {
  if (!html || html === '<br>') return true
  const div = document.createElement('div')
  div.innerHTML = html
  return !(div.textContent || '').trim()
}

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

export function Editor({ activeId, activeNote, updateNote, prefs, quizOpen = false, settingsOpen = false }) {
  const editorRef = useRef(null)
  const prefixRef = useRef(null)
  const isInternalUpdate = useRef(false)
  const [prefixWidth, setPrefixWidth] = useState(0)
  const [showPlaceholder, setShowPlaceholder] = useState(() =>
    isContentEmpty(activeNote?.content),
  )

  const surface = surfaces[prefs.surface] ?? surfaces.yellow
  const font = fonts.find(f => f.id === prefs.font) ?? fonts[0]
  const tool = tools.find(t => t.id === prefs.tool) ?? tools[0]
  const inkColor = inkColors.find(c => c.id === prefs.inkColor) ?? inkColors[0]

  const ruleColor = surface.rule ?? 'transparent'
  const rulePos = GRID - 1
  const isNapkin = prefs.surface === 'napkin'

  const paperStyle = {
    backgroundColor: surface.bg,
    backgroundImage: surface.bgImage
      ? surface.bgImage
      : surface.rule
        ? `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent ${rulePos}px,
          ${ruleColor} ${rulePos}px,
          ${ruleColor} ${GRID}px
        )`
        : 'none',
    backgroundSize: surface.bgImage ? surface.bgSize : `100% ${GRID}px`,
    backgroundPosition: surface.bgImage ? surface.bgPosition : `0 ${PADDING_TOP}px`,
    backgroundRepeat: surface.bgImage ? surface.bgRepeat : undefined,
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
      setShowPlaceholder(isContentEmpty(activeNote.content))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When activeId changes: swap content without firing the input handler
  useEffect(() => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    editorRef.current.innerHTML = activeNote?.content ?? ''
    isInternalUpdate.current = false
    setShowPlaceholder(isContentEmpty(activeNote?.content))
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback(
    e => {
      if (isInternalUpdate.current) return
      const html = e.target.innerHTML
      setShowPlaceholder(isContentEmpty(html))
      if (activeId) {
        updateNote(activeId, { content: html })
      }
    },
    [activeId, updateNote],
  )

  useLayoutEffect(() => {
    if (prefixRef.current) {
      setPrefixWidth(prefixRef.current.offsetWidth)
    }
  }, [font.id, tool.id, inkColor.id, prefs.surface])

  const prefixStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    lineHeight: `${GRID}px`,
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fontWeight: textStyle.fontWeight,
    fontStyle: textStyle.fontStyle,
    letterSpacing: textStyle.letterSpacing,
    color: textStyle.color,
    filter: textStyle.filter,
    pointerEvents: 'none',
    userSelect: 'none',
  }

  const editorWithIndent = {
    ...textStyle,
    textIndent: prefixWidth > 0 ? `${prefixWidth}px` : undefined,
  }

  return (
    <div style={paperStyle}>
      <SelectionTooltip
        editorRef={editorRef}
        prefs={prefs}
        quizOpen={quizOpen}
        settingsOpen={settingsOpen}
      />
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <span ref={prefixRef} className="editor-title-prefix" aria-hidden="true" style={prefixStyle}>
          {TOPIC_PREFIX}
        </span>
        {showPlaceholder && (
          <div
            className="editor-title-placeholder"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: prefixWidth,
              right: 0,
              lineHeight: `${GRID}px`,
              fontSize: textStyle.fontSize,
              fontFamily: textStyle.fontFamily,
              letterSpacing: textStyle.letterSpacing,
            }}
          >
            {TOPIC_PLACEHOLDER}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          style={editorWithIndent}
          spellCheck={false}
          translate="no"
          data-testid="editor"
        />
      </div>
    </div>
  )
}

export function applyHighlight(color) {
  const resolved = !color || color === 'none' ? 'transparent' : color
  document.execCommand('hiliteColor', false, resolved)
}
