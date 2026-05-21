export const GRID = 36

export const surfaces = {
  yellow: {
    label: 'Yellow',
    bg: '#FDF5C0',
    rule: '#C8BF6A',
    borderLeft: '3px solid #E8A0A0',
    borderTop: null,
    paddingLeft: '36px',
    outline: null,
  },
  plain: {
    label: 'Plain',
    hidden: true,
    bg: '#FAFAF8',
    rule: '#E0DDD4',
    borderLeft: null,
    borderTop: null,
    paddingLeft: '24px',
    outline: null,
  },
  notebook: {
    label: 'Notebook',
    bg: '#FDFCFA',
    rule: '#D4CCE0',
    borderLeft: null,
    borderTop: '3px solid #A89ED4',
    paddingLeft: '24px',
    outline: null,
  },
  napkin: {
    label: 'Napkin',
    hidden: true,
    bg: '#fdfaf4',
    rule: null,
    borderLeft: null,
    borderTop: null,
    paddingLeft: '24px',
    outline: '1.5px dashed #C4B9AA',
  },
  dark: {
    label: 'Dark',
    bg: '#3c3c3e',
    rule: '#525255',
    textColor: '#f5f5f0',
    borderLeft: null,
    borderTop: null,
    paddingLeft: '24px',
    outline: null,
  },
}

export const fonts = [
  { id: 'serif', label: 'Serif', family: 'Georgia, serif' },
  { id: 'comic', label: 'Comic Sans', family: '"Comic Sans MS", cursive' },
  { id: 'typewriter', label: 'Typewriter', family: '"Courier New", monospace' },
  {
    id: 'handwritten',
    label: 'Handwritten',
    family: '"Caveat", cursive',
    googleFont: 'Caveat',
  },
]

export const tools = [
  {
    id: 'pen',
    label: 'Pen',
    opacity: 1,
    letterSpacing: 'normal',
    fontWeight: 400,
    fontStyle: 'normal',
    filter: 'none',
  },
  {
    id: 'pencil',
    label: 'Pencil',
    opacity: 0.65,
    letterSpacing: '0.04em',
    fontWeight: 300,
    fontStyle: 'normal',
    filter: 'url(#pencil-filter)',
  },
  {
    id: 'marker',
    label: 'Marker',
    opacity: 0.9,
    letterSpacing: '0.08em',
    fontWeight: 700,
    fontStyle: 'normal',
    filter: 'none',
  },
  {
    id: 'fountainPen',
    label: 'Fountain pen',
    opacity: 1,
    letterSpacing: '0.02em',
    fontWeight: 500,
    fontStyle: 'italic',
    filter: 'none',
  },
  {
    id: 'crayon',
    label: 'Crayon',
    opacity: 0.8,
    letterSpacing: '0.06em',
    fontWeight: 600,
    fontStyle: 'normal',
    filter: 'url(#pencil-filter)',
  },
]

export const inkColors = [
  { id: 'midnight', label: 'Midnight', hex: '#1a1a2e' },
  { id: 'navy', label: 'Navy', hex: '#1b3a6b' },
  { id: 'ocean', label: 'Ocean', hex: '#1a5276' },
  { id: 'forest', label: 'Forest', hex: '#145a32' },
  { id: 'brown', label: 'Brown', hex: '#6e2c00' },
  { id: 'redInk', label: 'Red ink', hex: '#7b241c' },
  { id: 'purple', label: 'Purple', hex: '#4a235a' },
  { id: 'graphite', label: 'Graphite', hex: '#555555' },
  { id: 'lightPencil', label: 'Light pencil', hex: '#a0a0a0' },
]

export const highlightColors = [
  { id: 'yellow', label: 'Yellow', hex: '#FFF176' },
  { id: 'green', label: 'Green', hex: '#B9F6CA' },
  { id: 'cyan', label: 'Cyan', hex: '#80DEEA' },
  { id: 'pink', label: 'Pink', hex: '#F48FB1' },
  { id: 'purple', label: 'Purple', hex: '#CE93D8' },
  { id: 'orange', label: 'Orange', hex: '#FFCC80' },
]
