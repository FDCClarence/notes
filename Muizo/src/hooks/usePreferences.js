import { useState, useEffect } from 'react'

const STORAGE_KEY = 'noter_prefs'

const DEFAULTS = {
  surface: 'yellow',
  font: 'serif',
  tool: 'pen',
  inkColor: 'midnight',
  highlightColor: 'none',
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
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
