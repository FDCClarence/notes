import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuiz, ANTHROPIC_KEY_STORAGE } from '../hooks/useQuiz'

// Parchment palette (matches src/styles/parchment.css)
const P = {
  accent: 'var(--parch-accent)',
  accentDark: 'var(--parch-accent-dark)',
  dark: 'var(--parch-dark)',
  mid: 'var(--parch-mid)',
  faint: 'var(--parch-faint)',
  border: 'var(--parch-border-hard)',
  borderSoft: 'var(--parch-border)',
  panel: '#DDD0B0',
  card: 'rgba(255, 248, 230, 0.55)',
  muted: 'rgba(100, 70, 30, 0.08)',
  mutedStrong: 'rgba(100, 70, 30, 0.15)',
  cream: '#FDF5E4',
  correctBg: 'rgba(74, 124, 63, 0.14)',
  correctBorder: 'rgba(74, 124, 63, 0.35)',
  correctLabel: '#4a7c3f',
  correctText: '#3d5c34',
  wrongBg: 'rgba(139, 60, 50, 0.1)',
  wrongBorder: 'rgba(139, 60, 50, 0.3)',
  warnBg: 'rgba(180, 130, 40, 0.15)',
  errorBg: 'rgba(139, 60, 50, 0.12)',
}

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
        background: `linear-gradient(90deg, ${P.muted} 0%, rgba(200, 180, 140, 0.35) 50%, ${P.muted} 100%)`,
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
      <div className="rounded-xl p-4" style={{ background: P.card, border: `1px solid ${P.borderSoft}` }}>
        <div className="flex flex-col gap-2.5">
          <Pulse height={13} />
          <Pulse width="85%" height={13} />
          <Pulse width="60%" height={13} />
        </div>
      </div>
      <Pulse height={96} radius={12} />
      <Pulse height={42} radius={8} />
      <p className="text-center text-xs parch-text-faint">Generating your quiz…</p>
    </div>
  )
}

// ─── API key input ────────────────────────────────────────────────────────────

function KeyInputView({ onSave, onClose }) {
  const [key, setKey] = useState('')

  function handleSave() {
    const trimmed = key.trim()
    if (!trimmed) return
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmed)
    onSave()
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full mx-auto"
        style={{ background: P.warnBg }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className="text-center" style={{ maxWidth: '340px', margin: '0 auto' }}>
        <p className="text-base font-semibold parch-text">Anthropic API key</p>
        <p className="mt-2 text-sm leading-relaxed parch-text-mid">
          Enter your Anthropic API key to use the quiz feature. It&apos;s stored only in your browser.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="sk-ant-…"
          autoComplete="off"
          className="parch-input w-full rounded-xl px-4 py-3 text-sm transition-shadow focus:outline-none"
        />
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs parch-text-faint hover:underline"
          style={{ color: P.mid }}
        >
          Get a key at console.anthropic.com
        </a>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!key.trim()}
          className="parch-btn-primary flex-1 rounded-lg py-2.5 text-sm font-medium transition-opacity focus:outline-none disabled:opacity-50"
        >
          Save &amp; Continue
        </button>
        <button
          onClick={onClose}
          className="parch-btn rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Error view ───────────────────────────────────────────────────────────────

function ErrorView({ error, onRetry, onClose }) {
  const isEmpty = error?.code === 'empty_note'

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: isEmpty ? P.muted : P.errorBg }}
      >
        {isEmpty ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a04030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <div style={{ maxWidth: '300px' }}>
        <p className="text-base font-semibold parch-text">
          {isEmpty ? 'Nothing to quiz on yet' : 'Something went wrong'}
        </p>
        <p className="mt-2 text-sm leading-relaxed parch-text-mid">
          {isEmpty
            ? 'Write some notes first, then open the quiz to generate questions.'
            : error?.message}
        </p>
      </div>

      <div className="flex gap-3">
        {!isEmpty && (
          <button
            onClick={onRetry}
            className="parch-btn-primary rounded-lg px-4 py-2 text-sm font-medium focus:outline-none"
          >
            Try again
          </button>
        )}
        <button
          onClick={onClose}
          className="parch-btn rounded-lg px-4 py-2 text-sm font-medium focus:outline-none"
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
        <span className="text-xs font-medium parch-text-faint">
          Question {idx + 1} of {total}
        </span>
        {correctSoFar > 0 && (
          <span className="text-xs font-medium" style={{ color: P.correctLabel }}>
            {correctSoFar} correct so far
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: P.muted }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${((idx + 1) / total) * 100}%`,
            background: P.accent,
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
        style={{ background: P.card, border: `1px solid ${P.borderSoft}` }}
      >
        <p
          className="mb-1.5 uppercase tracking-widest parch-text-faint"
          style={{ fontSize: '9px', fontWeight: 600 }}
        >
          Question
        </p>
        <p className="text-[15px] leading-relaxed parch-text">{q.question}</p>
      </div>

      {/* Before reveal: textarea + reveal button */}
      {!a.revealed && (
        <>
          <textarea
            value={a.userAnswer}
            onChange={e => onAnswer(idx, { ...a, userAnswer: e.target.value })}
            placeholder="Write your answer here…"
            className="parch-input w-full resize-none rounded-xl px-4 py-3 text-sm transition-shadow focus:outline-none"
            style={{ height: '92px' }}
          />
          <button
            onClick={handleReveal}
            className="parch-btn-primary w-full rounded-lg py-2.5 text-sm font-medium transition-opacity focus:outline-none hover:opacity-90"
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
              style={{ background: P.card, border: `1px solid ${P.borderSoft}` }}
            >
              <p
                className="mb-1 uppercase tracking-widest parch-text-faint"
                style={{ fontSize: '9px', fontWeight: 600 }}
              >
                Your answer
              </p>
              <p className="text-sm parch-text leading-relaxed">{a.userAnswer}</p>
            </div>
          )}

          {/* Correct answer */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: P.correctBg, border: `1px solid ${P.correctBorder}` }}
          >
            <p
              className="mb-1 uppercase tracking-widest"
              style={{ fontSize: '9px', fontWeight: 600, color: P.correctLabel }}
            >
              ✓ The correct answer is
            </p>
            <p className="text-sm leading-relaxed" style={{ color: P.correctText }}>
              {q.answer}
            </p>
          </div>

          {/* Self-report thumbs */}
          <div className="flex flex-col items-center gap-3 py-1">
            <p className="text-sm parch-text-mid">Did you get it right?</p>
            <div className="flex gap-3">
              <ThumbButton
                emoji="👍"
                label="Yes"
                active={a.score === 'y'}
                activeColor={P.correctLabel}
                activeGlow="rgba(74, 124, 63, 0.25)"
                onClick={() => onScore(idx, a.score === 'y' ? null : 'y')}
              />
              <ThumbButton
                emoji="👎"
                label="No"
                active={a.score === 'n'}
                activeColor="#a04030"
                activeGlow="rgba(160, 64, 48, 0.25)"
                onClick={() => onScore(idx, a.score === 'n' ? null : 'n')}
              />
            </div>
          </div>

          {/* Navigation */}
          <button
            onClick={isLast ? onFinish : onNext}
            className="parch-btn-primary w-full rounded-lg py-2.5 text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none"
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
        background: active ? activeColor : P.muted,
        color: active ? P.cream : P.mid,
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
  perfect: { bg: P.correctBg, ring: P.correctBorder, text: P.correctText, label: 'Perfect score! Outstanding work! 🎉' },
  great:   { bg: 'rgba(139, 101, 52, 0.12)', ring: P.accent, text: P.accentDark, label: "Great job — you know this material well." },
  okay:    { bg: P.warnBg, ring: 'rgba(180, 130, 40, 0.45)', text: '#8B6534', label: "Not bad — a little more review wouldn't hurt." },
  keep_at: { bg: P.wrongBg, ring: P.wrongBorder, text: '#8B3A2A', label: "Keep studying — you'll get there! 💪" },
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
        <p className="text-center text-sm parch-text-mid" style={{ maxWidth: '240px' }}>
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
                background: scored === 'y' ? P.correctBg : scored === 'n' ? P.wrongBg : P.card,
                border: `1px solid ${scored === 'y' ? P.correctBorder : scored === 'n' ? P.wrongBorder : P.borderSoft}`,
              }}
            >
              <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">
                {scored === 'y' ? '✅' : scored === 'n' ? '❌' : '–'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium parch-text leading-snug">{q.question}</p>
                <p className="mt-1 text-xs parch-text-mid leading-relaxed">{q.answer}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onRetake}
          className="parch-btn flex-1 rounded-lg py-2.5 text-sm font-medium focus:outline-none"
        >
          Retake quiz
        </button>
        <button
          onClick={onClose}
          className="parch-btn-primary flex-1 rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none"
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
        style={{ background: 'rgba(44, 31, 14, 0.45)', backdropFilter: 'blur(3px)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Centered container — pointer events pass through, modal itself captures */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Custom quiz"
          className="relative w-full pointer-events-auto flex flex-col rounded-2xl shadow-2xl"
          style={{
            maxWidth: '520px',
            maxHeight: 'min(90vh, 660px)',
            animation: 'quiz-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            backgroundColor: P.panel,
            border: `1px solid ${P.border}`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center justify-between px-6"
            style={{ height: '54px', borderBottom: `1px solid ${P.border}` }}
          >
            <div className="flex items-center gap-2.5">
              <span className="parch-text-mid text-xs font-semibold tracking-widest uppercase">
                Custom Quiz
              </span>
              {status === 'ready' && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: P.mutedStrong, color: P.mid }}
                >
                  {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
              aria-label="Close custom quiz"
              className="parch-text-faint hover:text-[var(--parch-dark)] transition-colors rounded p-1.5 focus:outline-none"
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

            {status === 'error' && error?.code === 'missing_key' && (
              <KeyInputView onSave={handleRetry} onClose={handleClose} />
            )}

            {status === 'error' && error?.code !== 'missing_key' && (
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
