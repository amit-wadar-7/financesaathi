import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Field } from '../ui'
import { IconLogo } from '../icons'

function Shell({ title, children }) {
  const { lang, setLang } = useLang()
  return (
    <div className="center">
      <div className="auth card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: '#0f172a', borderRadius: '8px', color: '#ffffff', marginBottom: '0.5rem' }}>
            <IconLogo size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.2rem' }}>FinanceSaathi</h2>
          <p className="muted small">Digital Financial Literacy & Microfinance Platform</p>
          <div className="lang-toggle-pills" style={{ display: 'inline-flex', marginTop: '0.8rem' }}>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हि</button>
            <button className={`lang-btn ${lang === 'mr' ? 'active' : ''}`} onClick={() => setLang('mr')}>मरा</button>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>{title}</h3>
        {children}

        <div style={{ marginTop: '1.5rem', paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
          <Link to="/privacy" style={{ color: '#64748b' }}>Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" style={{ color: '#64748b' }}>Terms & Fair Practice</Link>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const { t } = useLang()
  const [f, setF] = useState({ email: 'admin@syra-demo.com', password: 'admin123' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await login(f.email, f.password)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (email, password) => {
    setF({ email, password })
  }

  return (
    <Shell title={t('login')}>
      <form onSubmit={submit}>
        <Alert>{err}</Alert>
        <Field label={t('email')}>
          <input
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Field label={t('password')}>
          <input
            type="password"
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
          />
        </Field>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing In…' : t('login')}
        </button>
      </form>

      {/* 1-Click Demo Accounts Selector */}
      <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <p className="small muted" style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Quick 1-Click Demo Logins:</p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button type="button" className="quick-pill" onClick={() => fillDemo('borrower@syra-demo.com', 'borrower123')}>Borrower</button>
          <button type="button" className="quick-pill" onClick={() => fillDemo('officer@syra-demo.com', 'officer123')}>Loan Officer</button>
          <button type="button" className="quick-pill" onClick={() => fillDemo('leader@syra-demo.com', 'leader123')}>SHG Leader</button>
          <button type="button" className="quick-pill" onClick={() => fillDemo('admin@syra-demo.com', 'admin123')}>Admin</button>
        </div>
      </div>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {t('noAccount')} <Link to="/register">{t('register')}</Link>
      </p>
    </Shell>
  )
}

export function Register() {
  const { register } = useAuth()
  const { t, lang } = useLang()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await register({ ...f, language: lang })
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title={t('register')}>
      <form onSubmit={submit}>
        <Alert>{err}</Alert>
        <Field label={t('name')}>
          <input required minLength={2} value={f.name} onChange={set('name')} placeholder="Legal Full Name (as per Aadhaar)" />
        </Field>
        <Field label={t('email')}>
          <input type="email" required value={f.email} onChange={set('email')} placeholder="e.g. member@shg.com" />
        </Field>
        <Field label={t('phone')}>
          <input value={f.phone} onChange={set('phone')} placeholder="+91 98XXXXXXXX" />
        </Field>
        <Field label={t('password') + ' (min 6)'}>
          <input type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="Choose a secure password" />
        </Field>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating Account…' : t('register')}
        </button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {t('haveAccount')} <Link to="/">{t('login')}</Link>
      </p>
    </Shell>
  )
}
