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
  IconFlame,
  IconArrowRight,
  IconLandmark,
  IconTarget,
  IconZap,
  IconCheckCircle,
  IconCoins,
  IconAward,
} from '../icons'

export function Learn() {
  const { lang, t } = useLang()
  const courses = useLoad(() => api('/courses?' + qs({ language: lang }), { auth: false }), [lang])
  const progress = useLoad(() => api('/progress'))
  const done = Object.fromEntries((progress.data || []).map((p) => [p.course_slug, p]))

  const completedCount = Object.values(done).filter((p) => p.completed).length
  const totalCourses = courses.data ? courses.data.length : 3

  return (
    <div className="learn-page">
      {/* Academy Hero Header & Gamified Milestone Card */}
      <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <IconAcademic size={24} className="text-emerald" />
              <h2 style={{ fontSize: '1.4rem', color: '#0f172a' }}>{t('learn')} — Financial Academy</h2>
            </div>
            <p className="muted small">
              Practical, bite-sized lessons designed for SHG leaders and microfinance borrowers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
              <IconCheck size={14} /> {completedCount} of {totalCourses} Completed
            </span>
            {completedCount > 0 ? (
              <>
                <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 8px' }}>
                  +{completedCount * 50} Saathi Pts
                </span>
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                  <IconFlame size={14} /> {Math.min(completedCount, 7)}-Day Streak
                </span>
              </>
            ) : (
              <span className="badge" style={{ padding: '4px 8px', color: 'var(--slate-500)' }}>
                0 Pts • Start First Lesson
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
            return (
              <Card key={c.id} className="course-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {c.slug.includes('fraud') ? 'Cyber Safety & UPI' : c.slug.includes('loan') ? 'Credit & Borrowing' : 'Household Savings'}
                  </span>
                  <span className="muted small" style={{ fontSize: '0.74rem' }}>
                    4 min read • Audio
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#0f172a' }}>{c.title}</h3>
                <p className="muted small" style={{ minHeight: '40px', marginBottom: '0.8rem' }}>{c.summary}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9' }}>
                  {p ? (
                    <div>
                      {p.completed ? (
                        <span className="badge approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconCheck size={13} /> Completed ({p.best_score}%)
                        </span>
                      ) : (
                        <span className="badge pending">In Progress ({p.best_score}%)</span>
                      )}
                    </div>
                  ) : (
                    <span className="muted small">Not Started</span>
                  )}
                  <Link className="btn small" to={'/learn/' + c.id}>
                    {p?.completed ? 'Review Module' : t('start') + ' Module'}
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
    <div className="prose" style={{ lineHeight: '1.7', color: '#334155' }}>
      {text.split('\n\n').map((block, i) => (
        block.startsWith('## ')
          ? <div key={i}><h3 style={{ color: '#0f172a', margin: '1.2rem 0 0.5rem' }}>{block.split('\n')[0].slice(3)}</h3>{block.split('\n').slice(1).map((l, j) => <p key={j} style={{ margin: '0.4rem 0' }}>{l}</p>)}</div>
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
          ← {t('back')} to Academy
        </Link>
        <button
          className={`btn small ${speaking ? 'active' : 'ghost'}`}
          onClick={toggleSpeech}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <IconVolume2 size={16} />
          <span>{speaking ? 'Stop Reading' : 'Listen Aloud (Audio)'}</span>
        </button>
      </div>

      <Card style={{ padding: '2rem' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
          <span className="badge" style={{ marginBottom: '0.4rem' }}>Interactive Learning Module</span>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>{course.data.title}</h2>
        </div>
        <Rich text={course.data.content} />
      </Card>

      <Card title="Knowledge Verification Quiz" style={{ marginTop: '1.2rem', padding: '1.8rem' }}>
        <p className="muted small" style={{ marginBottom: '1rem' }}>
          Test your comprehension to earn your Saathi Academy badge and improve your Financial Health Score.
        </p>

        {(quiz.data || []).map((q, qi) => (
          <div key={q.id} className="question" style={{ marginBottom: '1.4rem', paddingBottom: '1.2rem', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.6rem' }}>
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
                    background: answers[qi] === oi ? '#f0fdf4' : '#f8fafc',
                    border: answers[qi] === oi ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
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
                  color: result.results[qi].correct ? '#047857' : '#b91c1c',
                  fontWeight: 500
                }}
              >
                {result.results[qi].correct ? '✓ Correct! ' : '✗ Incorrect. '}
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
              background: result.passed ? '#ecfdf5' : '#fef2f2',
              border: result.passed ? '1px solid #a7f3d0' : '1px solid #fecaca',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: result.passed ? '#065f46' : '#991b1b' }}>
                Your Score: {result.score}%
              </span>
              <Badge tone={result.passed ? 'approved' : 'caution'}>
                {result.passed ? 'Passed with Distinction' : 'Needs Review (Retake Quiz)'}
              </Badge>
            </div>
          </div>
        )}

        <button className="btn" onClick={submit} disabled={!user}>
          {t('submit')} Quiz Answers
        </button>
      </Card>
    </div>
  )
}

export function Schemes() {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const s = useLoad(() => api('/schemes?' + qs({ language: lang }), { auth: false }), [lang])

  const [landAcres, setLandAcres] = useState(1.5)
  const [isShg, setIsShg] = useState(true)
  const [occupation, setOccupation] = useState('farmer')
  const [income, setIncome] = useState(user?.monthly_income ? user.monthly_income * 12 : 75000)
  const [gender, setGender] = useState('female')
  const [matcher, setMatcher] = useState(null)

  useEffect(() => {
    api('/calc/scheme-match?' + qs({
      land_acres: landAcres,
      is_shg_member: isShg,
      gender,
      annual_income: income,
      occupation,
    }), { auth: false })
      .then(setMatcher)
      .catch(() => setMatcher(null))
  }, [landAcres, isShg, gender, income, occupation])

  return (
    <div className="schemes-page">
      <div className="card" style={{ padding: '1.4rem', marginBottom: '1.2rem', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <IconLandmark size={24} className="text-emerald" />
          <h2 style={{ fontSize: '1.4rem', color: '#0f172a' }}>{t('schemes')} & Government Subsidies</h2>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Central & State welfare programs, Lakhpati Didi rural mission, and collateral-free microcredit facilities.
        </p>
      </div>

      {/* Interactive Scheme Eligibility & Lakhpati Didi Finder */}
      <Card title="Direct Benefit Transfer (DBT) & Yojana Eligibility Matcher" style={{ marginBottom: '1.5rem' }}>
        <p className="muted small mb-2">
          Select your household parameters to instantly compute all government grants, interest subventions, and priority sector facilities you qualify for.
        </p>

        <div className="grid wide" style={{ marginBottom: '1.2rem' }}>
          <div>
            <label className="field">
              <span>Landholding (Acres)</span>
              <input
                type="number"
                step="0.5"
                min="0"
                value={landAcres}
                onChange={(e) => setLandAcres(Number(e.target.value))}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
              {[
                { val: 0, label: 'Landless' },
                { val: 1.5, label: 'Marginal (1.5 ac)' },
                { val: 3.5, label: 'Small (3.5 ac)' },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  className={`btn small ${landAcres === p.val ? '' : 'ghost'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                  onClick={() => setLandAcres(p.val)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field">
              <span>Primary Rural Livelihood</span>
              <select value={occupation} onChange={(e) => setOccupation(e.target.value)}>
                <option value="farmer">Farmer / Crop Cultivator</option>
                <option value="micro_vendor">Street Vendor / Kirana Trader</option>
                <option value="dairy">Dairy & Livestock Rearer</option>
                <option value="artisan">Rural Artisan / Handloom</option>
              </select>
            </label>
          </div>

          <div>
            <label className="field">
              <span>Annual Household Income (Rs)</span>
              <input
                type="number"
                min="10000"
                step="5000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
              />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <label className="check" style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={isShg}
                onChange={(e) => setIsShg(e.target.checked)}
              />
              <span style={{ fontWeight: 600 }}>Active Self-Help Group (SHG) Member</span>
            </label>
          </div>
        </div>

        {matcher && (
          <div>
            <div
              style={{
                background: 'var(--emerald-soft)',
                border: '1px solid var(--emerald-border)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.8rem',
              }}
            >
              <div>
                <span className="small text-emerald" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Flagship Support Unlocked
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--emerald-brand)' }}>
                  Up to {money(matcher.total_eligible_value)} in Grants & Subsidized Capital
                </div>
              </div>
              <div>
                <Badge tone="approved">{matcher.matched_count} Government Schemes Matched</Badge>
              </div>
            </div>

            <div className="grid wide" style={{ marginBottom: '1rem' }}>
              {matcher.schemes.map((sch) => (
                <div
                  key={sch.code}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-subtle)',
                  }}
                >
                  <div className="row between" style={{ alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <Badge tone="approved">{sch.badge}</Badge>
                    <span style={{ fontWeight: 700, color: 'var(--emerald-action)' }}>
                      Max: {money(sch.max_value)}
                    </span>
                  </div>
                  <h4 style={{ margin: '0.2rem 0 0.4rem 0', color: 'var(--navy-primary)' }}>{sch.name}</h4>
                  <p className="small muted" style={{ margin: '0 0 0.6rem 0', lineHeight: 1.5 }}>
                    {sch.description}
                  </p>
                  <div style={{ background: 'var(--canvas-bg)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <b>How to Apply:</b> {sch.action_steps}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>National Rural Livelihoods Scheme Directory</h3>
        <p className="muted small">Comprehensive official portal links and nodal ministry listings.</p>
      </div>

      <Alert>{s.error}</Alert>

      {s.loading ? <Loading /> : (
        <div className="grid wide">
          {s.data.map((x) => (
            <Card key={x.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                    Government Scheme
                  </span>
                  <span className="badge approved">Active</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.5rem' }}>{x.name}</h3>
                <p style={{ fontSize: '0.88rem', color: '#334155', marginBottom: '0.8rem' }}>{x.description}</p>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <p className="small" style={{ margin: 0, color: '#475569' }}>
                    <b>Eligibility & Criteria:</b> {x.eligibility}
                  </p>
                </div>
              </div>
              <div style={{ paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9' }}>
                <a
                  href={x.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn small ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Official Government Portal</span>
                  <IconArrowRight size={14} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p className="muted small">
          Always verify official guidelines with your local Block Development Office (BDO) or bank branch before applying.
        </p>
      </div>
    </div>
  )
}
