import { useState, useEffect } from 'react'
import { applyHighlight } from './Editor'
import { highlightColors } from '../config/themes'

const TOOLTIP_HEIGHT = 30 // approximate pill height in px

// applyHighlight uses execCommand('hiliteColor'), which wraps text in
// <span style="background-color: <hex>;"> (or transparent when removing).
function isHighlightSpan(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false
  const tag = el.tagName
  if (tag !== 'SPAN' && tag !== 'FONT') return false
  const bg = el.style?.backgroundColor
  return Boolean(bg && bg !== '' && bg !== 'transparent')
}

function hasHighlightAncestor(node, editorRoot) {
  let cur = node.nodeType === Node.TEXT_NODE ? node.parentNode : node
  while (cur && cur !== editorRoot) {
    if (isHighlightSpan(cur)) return true
    cur = cur.parentNode
  }
  return false
}

function isSelectionHighlighted(editorRoot) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !editorRoot) return false
  const range = sel.getRangeAt(0)

  const root = range.commonAncestorContainer
  const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root
  if (!walkerRoot || !editorRoot.contains(walkerRoot)) return false

  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      try {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      } catch {
        return NodeFilter.FILTER_ACCEPT
      }
    },
  })

  let textNode
  while ((textNode = walker.nextNode())) {
    if (hasHighlightAncestor(textNode, editorRoot)) return true
  }
  return false
}

export function SelectionTooltip({ editorRef, prefs, quizOpen, settingsOpen }) {
  const [tipState, setTipState] = useState(null) // { rect, isHighlighted } | null

  // Hide whenever modal/settings opens
  useEffect(() => {
    if (quizOpen || settingsOpen) setTipState(null)
  }, [quizOpen, settingsOpen])

  // Show on mouseup inside editor
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    function handleMouseUp() {
      if (quizOpen || settingsOpen) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setTipState(null)
        return
      }

      const range = sel.getRangeAt(0)
      if (!editor.contains(range.commonAncestorContainer)) {
        setTipState(null)
        return
      }

      const rect = range.getBoundingClientRect()
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setTipState(null)
        return
      }

      setTipState({ rect, isHighlighted: isSelectionHighlighted(editor) })
    }

    editor.addEventListener('mouseup', handleMouseUp)
    return () => editor.removeEventListener('mouseup', handleMouseUp)
  }, [editorRef, quizOpen, settingsOpen])

  // Hide when selection collapses
  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setTipState(null)
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  // Hide when user starts typing
  useEffect(() => {
    function handleKeyDown() {
      setTipState(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!tipState || quizOpen || settingsOpen) return null

  const { rect, isHighlighted } = tipState
  const left = rect.left + rect.width / 2
  const top = rect.top - TOOLTIP_HEIGHT - 8

  function handleHighlightClick(e) {
    e.preventDefault()
    const entry =
      highlightColors.find(c => c.id === prefs.highlightColor) ?? highlightColors[0]
    applyHighlight(entry.hex)
    setTipState(null)
  }

  function handleRemoveClick(e) {
    e.preventDefault()
    applyHighlight('none')
    setTipState(null)
  }

  const pillStyle = {
    position: 'fixed',
    left,
    top,
    transform: 'translateX(-50%)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'auto',
    animation: 'seltooltip-fadein 0.12s ease both',
  }

  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '0 11px',
    height: `${TOOLTIP_HEIGHT}px`,
    borderRadius: '20px',
    border: '1px solid rgba(160,138,95,0.28)',
    background: '#fdf7eb',
    boxShadow: '0 2px 10px rgba(80,55,15,0.14), 0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    color: isHighlighted ? '#7a3a2a' : '#5a4a28',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    transition: 'background 0.1s',
    userSelect: 'none',
  }

  return (
    <>
      <style>{`
        @keyframes seltooltip-fadein {
          from { opacity: 0; transform: translateX(-50%) translateY(3px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={pillStyle}>
        {isHighlighted ? (
          <button
            style={btnStyle}
            onMouseDown={handleRemoveClick}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5eddb' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fdf7eb' }}
          >
            <span aria-hidden="true" style={{ fontSize: '11px', opacity: 0.75 }}>✕</span>
            Remove Highlight
          </button>
        ) : (
          <button
            style={btnStyle}
            onMouseDown={handleHighlightClick}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5eddb' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fdf7eb' }}
          >
            <span aria-hidden="true" style={{ fontSize: '11px' }}>✦</span>
            Highlight
          </button>
        )}
      </div>
    </>
  )
}
