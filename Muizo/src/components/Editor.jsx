import { useRef, useEffect, useCallback, useState } from 'react'
import { GRID, surfaces, fonts, tools, inkColors } from '../config/themes'
import { SelectionTooltip } from './SelectionTooltip'

const TITLE_PLACEHOLDER = 'Title'

function isContentEmpty(html) {
  if (!html || html === '<br>') return true
  const div = document.createElement('div')
  div.innerHTML = html
  return !(div.textContent || '').trim()
}

// FADE_TOP: height of the top fade zone; contentEditable paddingTop matches so
// the first text line begins exactly where the mask becomes fully opaque.
// backgroundPosition-y is also set to FADE_TOP so rule lines land at the
// bottom of each text row (FADE_TOP + GRID - 1 = bottom of line 1).
const FADE_TOP = 40
const FADE_BOTTOM = 48

// Text on bright highlight swatches in dark mode (matches tooltip / charcoal ink)
export const DARK_HIGHLIGHT_TEXT = '#1c1c1e'

function isDarkHighlightInk(color) {
  if (!color) return false
  const c = color.replace(/\s/g, '').toLowerCase()
  return c === DARK_HIGHLIGHT_TEXT || c === 'rgb(28,28,30)'
}

function inkWithOpacity(hex, opacity) {
  if (opacity >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export function Editor({ activeId, activeNote, updateNote, prefs, quizOpen = false, settingsOpen = false }) {
  const editorRef = useRef(null)
  const isInternalUpdate = useRef(false)
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId
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
  const isDark = prefs.surface === 'dark'

  const maskGradient = `linear-gradient(to bottom, transparent 0px, black ${FADE_TOP}px, black calc(100% - ${FADE_BOTTOM}px), transparent 100%)`

  const paperStyle = {
    backgroundColor: surface.bg,
    ...(surface.bgImage
      ? {
          backgroundImage: surface.bgImage,
          backgroundSize: surface.bgSize,
          backgroundPosition: surface.bgPosition,
          backgroundRepeat: surface.bgRepeat,
        }
      : {}),
    borderLeft: surface.borderLeft ?? 'none',
    borderTop: surface.borderTop ?? 'none',
    outline: surface.outline ?? 'none',
    paddingLeft: surface.paddingLeft ?? '24px',
    paddingRight: '32px',
    // vertical padding lives on the contentEditable (matches fade distances)
    transform: isNapkin ? 'rotate(0.4deg)' : 'none',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'background-color 200ms ease, transform 200ms ease',
  }

  const scrollStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    maskImage: maskGradient,
    WebkitMaskImage: maskGradient,
    // Sit above the ::before napkin pseudo-element (z-index: 0)
    position: 'relative',
    zIndex: 1,
  }

  const textStyle = {
    fontFamily: font.family,
    // Dark surface always uses its own light textColor for readability;
    // ink color selection is overridden and has no effect in this mode.
    color: isDark ? surface.textColor : inkWithOpacity(inkColor.hex, tool.opacity),
    caretColor: isDark ? surface.textColor : 'auto',
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
    // Vertical padding lives here so it scrolls with the content.
    // FADE_TOP/FADE_BOTTOM match the mask fade distances so text never sits
    // in the fully-transparent zone at the edges of the scroll container.
    paddingTop: `${FADE_TOP}px`,
    paddingBottom: `${GRID * 4}px`,
    // Ruled lines on the contentEditable scroll with the text; napkin texture
    // is on the outer paper container so it stays fixed in the viewport.
    backgroundImage: surface.rule
      ? `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent ${rulePos}px,
          ${ruleColor} ${rulePos}px,
          ${ruleColor} ${GRID}px
        )`
      : 'none',
    backgroundSize: surface.rule ? `100% ${GRID}px` : undefined,
    // Offset by FADE_TOP so the first rule lands at the bottom of line 1:
    // FADE_TOP + (GRID - 1) = bottom of the first text row.
    backgroundPosition: surface.rule ? `0 ${FADE_TOP}px` : undefined,
  }

  // On mount: set initial content
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content ?? ''
      setShowPlaceholder(isContentEmpty(activeNote.content))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When activeId changes: swap content without persisting to the previous note
  useEffect(() => {
    if (!editorRef.current) return
    isInternalUpdate.current = true
    editorRef.current.innerHTML = activeNote?.content ?? ''
    setShowPlaceholder(isContentEmpty(activeNote?.content))
    syncHighlightTextColor(editorRef.current, isDark)
    const frame = requestAnimationFrame(() => {
      isInternalUpdate.current = false
    })
    return () => cancelAnimationFrame(frame)
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep highlight text readable when toggling the dark surface
  useEffect(() => {
    syncHighlightTextColor(editorRef.current, isDark)
  }, [isDark])

  const handleInput = useCallback(
    e => {
      if (isInternalUpdate.current) return
      const html = e.target.innerHTML
      setShowPlaceholder(isContentEmpty(html))
      const id = activeIdRef.current
      if (id) {
        updateNote(id, { content: html })
      }
    },
    [updateNote],
  )

  return (
    <div style={paperStyle} className={isNapkin ? 'napkin-surface' : undefined}>
      <SelectionTooltip
        editorRef={editorRef}
        prefs={prefs}
        quizOpen={quizOpen}
        settingsOpen={settingsOpen}
        isDark={isDark}
      />
      <div style={scrollStyle}>
        <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {showPlaceholder && (
            <div
              className="editor-title-placeholder"
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: FADE_TOP,
                left: 0,
                right: 0,
                lineHeight: `${GRID}px`,
                fontSize: textStyle.fontSize,
                fontFamily: textStyle.fontFamily,
                letterSpacing: textStyle.letterSpacing,
              }}
            >
              {TITLE_PLACEHOLDER}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            style={textStyle}
            className={isDark ? 'editor--dark' : undefined}
            spellCheck={false}
            translate="no"
            data-testid="editor"
          />
        </div>
      </div>
    </div>
  )
}

function isHighlightSpan(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false
  const tag = el.tagName
  if (tag !== 'SPAN' && tag !== 'FONT') return false
  const bg = el.style?.backgroundColor
  return Boolean(bg && bg !== '' && bg !== 'transparent')
}

function forEachHighlightSpanInRange(range, editorRoot, fn) {
  const root = range.commonAncestorContainer
  const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root
  if (!walkerRoot || !editorRoot.contains(walkerRoot)) return

  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node === editorRoot) return NodeFilter.FILTER_SKIP
      if (!isHighlightSpan(node)) return NodeFilter.FILTER_SKIP
      try {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      } catch {
        return NodeFilter.FILTER_ACCEPT
      }
    },
  })

  const spans = []
  let node
  while ((node = walker.nextNode())) spans.push(node)
  spans.forEach(fn)
}

function syncHighlightTextColor(editorRoot, isDark) {
  if (!editorRoot) return
  const spans = editorRoot.querySelectorAll('span, font')
  spans.forEach(el => {
    if (!isHighlightSpan(el)) return
    if (isDark) el.style.color = DARK_HIGHLIGHT_TEXT
    else el.style.removeProperty('color')
  })
}

function forEachStyledSpanInRange(range, editorRoot, fn) {
  const root = range.commonAncestorContainer
  const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root
  if (!walkerRoot || !editorRoot.contains(walkerRoot)) return

  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node === editorRoot) return NodeFilter.FILTER_SKIP
      const tag = node.tagName
      if (tag !== 'SPAN' && tag !== 'FONT') return NodeFilter.FILTER_SKIP
      try {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      } catch {
        return NodeFilter.FILTER_ACCEPT
      }
    },
  })

  const spans = []
  let node
  while ((node = walker.nextNode())) spans.push(node)
  spans.forEach(fn)
}

export function applyHighlight(color, { isDark = false, editorRoot = null } = {}) {
  const resolved = !color || color === 'none' ? 'transparent' : color
  const removing = resolved === 'transparent'
  const sel = window.getSelection()
  const range =
    sel && sel.rangeCount > 0 && !sel.isCollapsed ? sel.getRangeAt(0).cloneRange() : null

  // Capture highlight wrappers before execCommand — after removal they no longer
  // match isHighlightSpan (background is transparent) but may still carry dark ink.
  const spansToReset = []
  if (removing && isDark && editorRoot && range) {
    forEachHighlightSpanInRange(range, editorRoot, el => spansToReset.push(el))
  }

  document.execCommand('hiliteColor', false, resolved)

  if (!editorRoot || !range) return

  if (removing) {
    if (!isDark) return
    spansToReset.forEach(el => el.style.removeProperty('color'))
    // execCommand can leave empty styled spans with dark highlight ink still set
    forEachStyledSpanInRange(range, editorRoot, el => {
      if (isDarkHighlightInk(el.style.color)) el.style.removeProperty('color')
    })
    return
  }

  if (isDark) {
    forEachHighlightSpanInRange(range, editorRoot, el => {
      el.style.color = DARK_HIGHLIGHT_TEXT
    })
  }
}
