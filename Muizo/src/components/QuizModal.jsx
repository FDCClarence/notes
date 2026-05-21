import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuiz } from '../hooks/useQuiz'

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

const SHIMMER_CSS = `
  @keyframes quiz-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes quiz-enter {
    from { opacity: 0; transform: scale(0.96) translateY(10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }
`

function Pulse({ width = '100%', height = 14, radius = 8 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)',
        backgroundSize: '200% 100%',
        animation: 'quiz-shimmer 1.6s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Pulse width={130} height={11} />
        <Pulse width={55} height={11} />
      </div>
      <Pulse height={6} radius={4} />
      <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="flex flex-col gap-2.5">
          <Pulse height={13} />
          <Pulse width="85%" height={13} />
          <Pulse width="60%" height={13} />
        </div>
      </div>
      <Pulse height={96} radius={12} />
      <Pulse height={42} radius={8} />
      <p className="text-center text-xs text-slate-400">Generating your quiz…</p>
    </div>
  )
}

// ─── Error view ───────────────────────────────────────────────────────────────

function ErrorView({ error, onRetry, onClose }) {
  const isMissingKey = error?.code === 'missing_key'
  const isEmpty = error?.code === 'empty_note'

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: isMissingKey ? '#fef3c7' : '#fef2f2' }}
      >
        {isMissingKey ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ) : isEmpty ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <div style={{ maxWidth: '300px' }}>
        <p className="text-base font-semibold text-slate-800">
          {isMissingKey
            ? 'API key not found'
            : isEmpty
            ? 'Nothing to quiz on yet'
            : 'Something went wrong'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {isMissingKey ? (
            <>
              Add <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">VITE_ANTHROPIC_API_KEY</code> to a{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">.env</code> file
              in the Muizo directory, then restart the dev server.
            </>
          ) : isEmpty ? (
            'Write some notes first, then open the quiz to generate questions.'
          ) : (
            error?.message
          )}
        </p>
      </div>

      <div className="flex gap-3">
        {!isEmpty && !isMissingKey && (
          <button
            onClick={onRetry}
            className="rounded-lg px-4 py-2 text-sm font-medium focus:outline-none"
            style={{ background: '#1e293b', color: '#fff' }}
          >
            Try again
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Progress bar + label ─────────────────────────────────────────────────────

function ProgressBar({ idx, total, correctSoFar }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">
          Question {idx + 1} of {total}
        </span>
        {correctSoFar > 0 && (
          <span className="text-xs text-emerald-600 font-medium">
            {correctSoFar} correct so far
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${((idx + 1) / total) * 100}%`,
            background: '#1e293b',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Question view ────────────────────────────────────────────────────────────

function QuestionView({ questions, idx, answers, onAnswer, onScore, onNext, onFinish }) {
  const q = questions[idx]
  const a = answers[idx] ?? { userAnswer: '', revealed: false, score: null }
  const isLast = idx === questions.length - 1
  const correctSoFar = answers.filter(x => x?.score === 'y').length

  function handleReveal() {
    onAnswer(idx, { ...a, revealed: true })
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar idx={idx} total={questions.length} correctSoFar={correctSoFar} />

      {/* Question card */}
      <div
        className="rounded-xl px-4 py-4"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        <p
          className="mb-1.5 uppercase tracking-widest"
          style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}
        >
          Question
        </p>
        <p className="text-[15px] leading-relaxed text-slate-800">{q.question}</p>
      </div>

      {/* Before reveal: textarea + reveal button */}
      {!a.revealed && (
        <>
          <textarea
            value={a.userAnswer}
            onChange={e => onAnswer(idx, { ...a, userAnswer: e.target.value })}
            placeholder="Write your answer here…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-shadow"
            style={{ height: '92px' }}
          />
          <button
            onClick={handleReveal}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity focus:outline-none hover:opacity-90"
            style={{ background: '#1e293b', color: '#fff' }}
          >
            Reveal answer
          </button>
        </>
      )}

      {/* After reveal */}
      {a.revealed && (
        <>
          {/* User's answer */}
          {a.userAnswer.trim() && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: '#fafafa', border: '1px solid #e2e8f0' }}
            >
              <p
                className="mb-1 uppercase tracking-widest"
                style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}
              >
                Your answer
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{a.userAnswer}</p>
            </div>
          )}

          {/* Correct answer */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}
          >
            <p
              className="mb-1 uppercase tracking-widest"
              style={{ fontSize: '9px', fontWeight: 600, color: '#16a34a' }}
            >
              ✓ Correct answer
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#166534' }}>
              {q.answer}
            </p>
          </div>

          {/* Self-report thumbs */}
          <div className="flex flex-col items-center gap-3 py-1">
            <p className="text-sm text-slate-500">Did you get it right?</p>
            <div className="flex gap-3">
              <ThumbButton
                emoji="👍"
                label="Yes"
                active={a.score === 'y'}
                activeColor="#22c55e"
                activeGlow="rgba(34,197,94,0.25)"
                onClick={() => onScore(idx, a.score === 'y' ? null : 'y')}
              />
              <ThumbButton
                emoji="👎"
                label="No"
                active={a.score === 'n'}
                activeColor="#ef4444"
                activeGlow="rgba(239,68,68,0.25)"
                onClick={() => onScore(idx, a.score === 'n' ? null : 'n')}
              />
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={isLast ? onFinish : onNext}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none"
            style={{ background: '#1e293b', color: '#fff' }}
          >
            {isLast ? 'See results →' : 'Next question →'}
          </button>
        </>
      )}
    </div>
  )
}

function ThumbButton({ emoji, label, active, activeColor, activeGlow, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all focus:outline-none"
      style={{
        background: active ? activeColor : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        boxShadow: active ? `0 0 0 3px ${activeGlow}` : 'none',
        transform: active ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{emoji}</span>
      {label}
    </button>
  )
}

// ─── Summary view ─────────────────────────────────────────────────────────────

const SCORE_PALETTE = {
  perfect: { bg: '#f0fdf4', ring: '#4ade80', text: '#15803d', label: 'Perfect score! Outstanding work! 🎉' },
  great:   { bg: '#eff6ff', ring: '#60a5fa', text: '#1d4ed8', label: "Great job — you know this material well." },
  okay:    { bg: '#fffbeb', ring: '#fbbf24', text: '#b45309', label: "Not bad — a little more review wouldn't hurt." },
  keep_at: { bg: '#fef2f2', ring: '#f87171', text: '#b91c1c', label: "Keep studying — you'll get there! 💪" },
}

function getPalette(correct, total) {
  if (total === 0) return SCORE_PALETTE.okay
  const r = correct / total
  if (r === 1) return SCORE_PALETTE.perfect
  if (r >= 0.7) return SCORE_PALETTE.great
  if (r >= 0.4) return SCORE_PALETTE.okay
  return SCORE_PALETTE.keep_at
}

function SummaryView({ questions, answers, onClose, onRetake }) {
  const correct = answers.filter(a => a?.score === 'y').length
  const total = questions.length
  const palette = getPalette(correct, total)

  return (
    <div className="flex flex-col gap-5">
      {/* Score circle */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-1">
        <div
          className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
          style={{
            background: palette.bg,
            boxShadow: `0 0 0 3px ${palette.ring}`,
          }}
        >
          <span className="font-bold" style={{ fontSize: '32px', color: palette.text, lineHeight: 1 }}>
            {correct}
          </span>
          <span style={{ fontSize: '12px', color: palette.text, opacity: 0.8 }}>
            / {total}
          </span>
        </div>
        <p className="text-center text-sm text-slate-600" style={{ maxWidth: '240px' }}>
          {palette.label}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="flex flex-col gap-2">
        {questions.map((q, i) => {
          const scored = answers[i]?.score
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{
                background: scored === 'y' ? '#f0fdf4' : scored === 'n' ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${scored === 'y' ? '#86efac' : scored === 'n' ? '#fca5a5' : '#e2e8f0'}`,
              }}
            >
              <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">
                {scored === 'y' ? '✅' : scored === 'n' ? '❌' : '–'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 leading-snug">{q.question}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{q.answer}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onRetake}
          className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
        >
          Retake quiz
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none"
          style={{ background: '#1e293b', color: '#fff' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

export function QuizModal({ open, onClose, activeNote }) {
  const { status, questions, error, generate, reset } = useQuiz()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase] = useState('quiz') // 'quiz' | 'summary'

  // Stable ref so the generate effect doesn't need activeNote as a dep
  const activeNoteRef = useRef(activeNote)
  activeNoteRef.current = activeNote

  // Trigger generation whenever the modal is open and status is 'idle'
  // (covers both initial open and post-reset retry)
  useEffect(() => {
    if (open && status === 'idle') {
      generate(activeNoteRef.current?.content ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status])

  // Initialise per-question state when questions arrive
  useEffect(() => {
    if (status === 'ready') {
      setAnswers(questions.map(() => ({ userAnswer: '', revealed: false, score: null })))
      setIdx(0)
      setPhase('quiz')
    }
  }, [status, questions])

  // Close + full reset
  const handleClose = useCallback(() => {
    reset()
    setPhase('quiz')
    setIdx(0)
    setAnswers([])
    onClose()
  }, [reset, onClose])

  // Re-call API (error retry)
  const handleRetry = useCallback(() => {
    reset() // → status becomes 'idle' → effect above fires generate()
  }, [reset])

  // Retake same questions locally
  const handleRetake = useCallback(() => {
    setAnswers(questions.map(() => ({ userAnswer: '', revealed: false, score: null })))
    setIdx(0)
    setPhase('quiz')
  }, [questions])

  const handleAnswer = useCallback((i, updated) => {
    setAnswers(prev => {
      const next = [...prev]
      next[i] = updated
      return next
    })
  }, [])

  const handleScore = useCallback((i, score) => {
    setAnswers(prev => {
      const next = [...prev]
      next[i] = { ...next[i], score }
      return next
    })
  }, [])

  // Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  if (!open) return null

  return (
    <>
      <style>{SHIMMER_CSS}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centered container — pointer events pass through, modal itself captures */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quiz"
          className="relative w-full pointer-events-auto flex flex-col rounded-2xl bg-white shadow-2xl"
          style={{
            maxWidth: '520px',
            maxHeight: 'min(90vh, 660px)',
            animation: 'quiz-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6"
            style={{ height: '54px' }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ fontSize: '17px' }}>🧠</span>
              <span className="text-sm font-semibold text-slate-800">Quiz</span>
              {status === 'ready' && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              aria-label="Close quiz"
              className="rounded p-1.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {status === 'loading' && <Skeleton />}

            {status === 'error' && (
              <ErrorView error={error} onRetry={handleRetry} onClose={handleClose} />
            )}

            {status === 'ready' && phase === 'quiz' && (
              <QuestionView
                questions={questions}
                idx={idx}
                answers={answers}
                onAnswer={handleAnswer}
                onScore={handleScore}
                onNext={() => setIdx(i => i + 1)}
                onFinish={() => setPhase('summary')}
              />
            )}

            {status === 'ready' && phase === 'summary' && (
              <SummaryView
                questions={questions}
                answers={answers}
                onClose={handleClose}
                onRetake={handleRetake}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
