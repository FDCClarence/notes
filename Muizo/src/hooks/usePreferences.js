import { useState, useEffect } from 'react'
import { getItemWithMigration } from '../utils/localStorage'

const STORAGE_KEY = 'muizo_prefs'
const LEGACY_KEY = 'noter_prefs'

const DEFAULTS = {
  surface: 'yellow',
  font: 'serif',
  tool: 'pen',
  inkColor: 'midnight',
  highlightColor: 'yellow',
  sidebarOpen: true,
}

function loadPrefs() {
  try {
    const raw = getItemWithMigration(STORAGE_KEY, LEGACY_KEY)
    const prefs = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
    if (prefs.highlightColor === 'none') prefs.highlightColor = 'yellow'
    if (prefs.surface === 'napkin') prefs.surface = DEFAULTS.surface
    if (prefs.surface === 'plain') prefs.surface = 'notebook'
    return prefs
  } catch {
    return { ...DEFAULTS }
  }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(loadPrefs)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  const setPref = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  return { ...prefs, setPref }
}
