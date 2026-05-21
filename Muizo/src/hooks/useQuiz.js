import { useState, useCallback } from 'react'

const MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT =
  "You are a study assistant. Given a set of notes, generate 1-10 questions depending on the amount of notes. quiz questions to test understanding. Return ONLY a JSON array — no markdown, no explanation — where each item has: { question: string, answer: string, type: 'short' }"

function stripHtml(html) {
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || el.innerText || '').trim()
}

// status: 'idle' | 'loading' | 'ready' | 'error'
export function useQuiz() {
  const [status, setStatus] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [error, setError] = useState(null) // { code: string, message: string } | null

  const generate = useCallback(async (htmlContent) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

    if (!apiKey) {
      setError({ code: 'missing_key', message: 'missing_key' })
      setStatus('error')
      return
    }

    const plainText = stripHtml(htmlContent)

    if (!plainText) {
      setError({ code: 'empty_note', message: 'empty_note' })
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)
    setQuestions([])

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: plainText }],
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error?.message ?? `Request failed (${res.status})`)
      }

      const data = await res.json()
      const raw = (data.content?.[0]?.text ?? '').trim()

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch {
        // Gracefully extract JSON array if model added surrounding text
        const match = raw.match(/\[[\s\S]*\]/)
        if (match) {
          parsed = JSON.parse(match[0])
        } else {
          throw new Error('The AI returned an unexpected format. Please try again.')
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No questions were generated. Try adding more content to your note.')
      }

      setQuestions(parsed)
      setStatus('ready')
    } catch (err) {
      setError({ code: 'api_error', message: err.message ?? 'Something went wrong.' })
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setQuestions([])
    setError(null)
  }, [])

  return { status, questions, error, generate, reset }
}
