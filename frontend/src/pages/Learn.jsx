import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, money, qs } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, useLoad } from '../ui'
import {
  IconAcademic,
  IconVolume2,
  IconCheck,
  IconShield,
  IconAward,
  IconCheckCircle,
} from '../icons'

export function Learn() {
  const { lang, t } = useLang()
  const courses = useLoad(() => api('/courses?' + qs({ language: lang }), { auth: false }), [lang])
  const progress = useLoad(() => api('/progress'))
  const done = Object.fromEntries((progress.data || []).map((p) => [p.course_slug, p]))

  const completedCount = Object.values(done).filter((p) => p.completed).length
  const totalCourses = courses.data ? courses.data.length : 6
  const totalScore = (progress.data || []).reduce((acc, p) => acc + (p.best_score || 0), 0)

  return (
    <div className="learn-page">
      {/* Academy Hero Header & Gamified Milestone Card */}
      <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <IconAcademic size={24} className="text-emerald" />
              <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-900)' }}>{t('learn')} — {t('financialAcademy')}</h2>
            </div>
            <p className="muted small">
              {t('academyHeroSubtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
              <IconCheck size={14} /> {completedCount} / {totalCourses} {t('completed')}
            </span>
            {completedCount > 0 ? (
              <>
                <span className="badge" style={{ background: 'var(--emerald-50)', color: 'var(--emerald-700)', border: '1px solid var(--emerald-200)', padding: '4px 8px' }}>
                  +{Math.round(totalScore)} {t('quizScore')}
                </span>
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                  <IconAward size={14} /> {completedCount} {t('modulesCertified')}
                </span>
              </>
            ) : (
              <span className="badge" style={{ padding: '4px 8px', color: 'var(--slate-500)' }}>
                {t('zeroScoreStartLesson')}
              </span>
            )}
          </div>
        </div>
      </div>

      <Alert>{courses.error}</Alert>

      {courses.loading ? <Loading /> : (
        <div className="grid wide">
          {courses.data.map((c) => {
            const p = done[c.slug]
            const catLabel = c.slug.includes('fraud')
              ? t('catCyberSafety')
              : c.slug.includes('loan') || c.slug.includes('emi')
              ? t('catCreditBorrowing')
              : c.slug.includes('shg')
              ? t('catShgGov')
              : c.slug.includes('kisan')
              ? t('catAgriCredit')
              : c.slug.includes('gov')
              ? t('catWelfare')
              : t('catHouseholdSavings')

            return (
              <Card key={c.id} className="course-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {catLabel}
                  </span>
                  <span className="muted small" style={{ fontSize: '0.74rem' }}>
                    {t('readTimeAudio')}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--slate-900)' }}>{c.title}</h3>
                <p className="muted small" style={{ minHeight: '40px', marginBottom: '0.8rem' }}>{c.summary}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color)' }}>
                  {p ? (
                    <div>
                      {p.completed ? (
                        <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconCheck size={13} /> {t('completed')} ({p.best_score}%)
                        </span>
                      ) : (
                        <span className="badge pending">{t('inProgress')} ({p.best_score}%)</span>
                      )}
                    </div>
                  ) : (
                    <span className="muted small">{t('notStarted')}</span>
                  )}
                  <Link className="btn small" to={'/learn/' + c.id}>
                    {p?.completed ? t('reviewModule') : t('startModule')}
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Rich({ text }) {
  return (
    <div className="prose" style={{ lineHeight: '1.7', color: 'var(--text)' }}>
      {text.split('\n\n').map((block, i) => (
        block.startsWith('## ')
          ? <div key={i}><h3 style={{ color: 'var(--slate-900)', margin: '1.2rem 0 0.5rem' }}>{block.split('\n')[0].slice(3)}</h3>{block.split('\n').slice(1).map((l, j) => <p key={j} style={{ margin: '0.4rem 0' }}>{l}</p>)}</div>
          : <p key={i} style={{ margin: '0.6rem 0' }}>{block}</p>
      ))}
    </div>
  )
}

export function CourseView() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { user } = useAuth()
  const course = useLoad(() => api('/courses/' + id, { auth: false }), [id])
  const quiz = useLoad(() => api('/courses/' + id + '/quiz', { auth: false }), [id])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [speaking, setSpeaking] = useState(false)

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const textToRead = course.data ? (course.data.title + '. ' + course.data.content) : ''
    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const submit = async () => {
    setErr('')
    try {
      const arr = quiz.data.map((_, i) => (answers[i] === undefined ? -1 : answers[i]))
      setResult(await api('/courses/' + id + '/quiz/submit', { method: 'POST', body: { answers: arr } }))
    } catch (e) {
      setErr(e.message)
    }
  }

  if (course.loading) return <Loading />
  if (course.error) return <Alert>{course.error}</Alert>

  return (
    <div className="course-view-page" style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link to="/learn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          ← {t('backToAcademy')}
        </Link>
        <button
          className={`btn small ${speaking ? 'active' : 'ghost'}`}
          onClick={toggleSpeech}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconVolume2 size={16} />
          <span>{speaking ? t('stopReading') : t('listenAloud')}</span>
        </button>
      </div>

      <Card style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
          <span className="badge" style={{ marginBottom: '0.4rem' }}>{t('interactiveModule')}</span>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>{course.data.title}</h2>
        </div>
        <Rich text={course.data.content} />
      </Card>

      <Card title={t('knowledgeQuiz')} style={{ marginTop: '1.2rem', padding: '1.8rem' }}>
        <p className="muted small" style={{ marginBottom: '1rem' }}>
          {t('quizDesc')}
        </p>

        {(quiz.data || []).map((q, qi) => (
          <div key={q.id} className="question" style={{ marginBottom: '1.4rem', paddingBottom: '1.2rem', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.6rem' }}>
              {qi + 1}. {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {q.options.map((o, oi) => (
                <label
                  key={oi}
                  className="check"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.8rem',
                    borderRadius: '6px',
                    background: answers[qi] === oi ? 'var(--emerald-50)' : 'var(--card-bg-subtle)',
                    border: answers[qi] === oi ? '1px solid var(--emerald-500)' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name={'q' + qi}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers({ ...answers, [qi]: oi })}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            {result && (
              <p
                style={{
                  marginTop: '0.6rem',
                  fontSize: '0.85rem',
                  color: result.results[qi].correct ? 'var(--emerald-600)' : 'var(--rose-600, #dc2626)',
                  fontWeight: 500
                }}
              >
                {result.results[qi].correct ? `✓ ${t('correctMark')} ` : `✗ ${t('incorrectMark')} `}
                {result.results[qi].explanation}
              </p>
            )}
          </div>
        ))}

        <Alert>{err}</Alert>

        {result && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '6px',
              background: result.passed ? 'var(--emerald-50)' : 'var(--card-bg-subtle)',
              border: result.passed ? '1px solid var(--emerald-500)' : '1px solid var(--border-color)',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: result.passed ? 'var(--emerald-700)' : 'var(--amber-700)' }}>
                {t('yourScore')}: {result.score}%
              </span>
              <Badge tone={result.passed ? 'approved' : 'caution'}>
                {result.passed ? t('passedDistinction') : t('needsReview')}
              </Badge>
            </div>
          </div>
        )}

        <button className="btn" onClick={submit} disabled={!user}>
          {t('submitQuiz')}
        </button>
      </Card>
    </div>
  )
}

export { default as Schemes } from './SchemesPortal'
