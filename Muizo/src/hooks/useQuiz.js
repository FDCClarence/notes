import { useState, useCallback } from 'react'

const MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT = `You are a study assistant. The user will provide notes. Create quiz questions that test understanding of that material.

Rules:
- Return ONLY a valid JSON array. No markdown, no code fences, no explanation before or after.
- NEVER return an empty array. Always return at least 3 questions, even if the notes are short (use the available text; ask about key terms, claims, or implications).
- Return 3–10 questions: more notes → more questions.
- Each item: { "question": string, "answer": string, "type": "short" }
- Answers must be concise (1–3 sentences) and grounded in the notes.`

const MIN_NOTE_CHARS = 24

function stripHtml(html) {
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || el.innerText || '').trim()
}

function normalizeQuestions(parsed) {
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((q) => ({
      question: String(q?.question ?? '').trim(),
      answer: String(q?.answer ?? '').trim(),
      type: 'short',
    }))
    .filter((q) => q.question && q.answer)
}

function parseQuestionsFromText(raw) {
  const trimmed = raw.trim()
  try {
    return normalizeQuestions(JSON.parse(trimmed))
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('The AI returned an unexpected format. Please try again.')
    return normalizeQuestions(JSON.parse(match[0]))
  }
}

async function requestQuestions(apiKey, messages) {
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
      messages,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`)
  }

  const data = await res.json()
  const raw = (data.content?.[0]?.text ?? '').trim()
  return parseQuestionsFromText(raw)
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

    if (!plainText || plainText.length < MIN_NOTE_CHARS) {
      setError({ code: 'empty_note', message: 'empty_note' })
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)
    setQuestions([])

    const userContent = `Generate quiz questions from these notes:\n\n${plainText}`

    try {
      let parsed = await requestQuestions(apiKey, [{ role: 'user', content: userContent }])

      if (parsed.length === 0) {
        parsed = await requestQuestions(apiKey, [
          { role: 'user', content: userContent },
          { role: 'assistant', content: '[]' },
          {
            role: 'user',
            content:
              'You returned an empty JSON array. The notes above contain material to quiz on. Return at least 3 questions as a JSON array only — no empty array.',
          },
        ])
      }

      if (parsed.length === 0) {
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
