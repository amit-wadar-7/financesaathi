import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Field } from '../ui'
import { IconLogo } from '../icons'

function Shell({ title, children }) {
  const { lang, setLang, t } = useLang()
  return (
    <div className="center">
      <div className="auth card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'var(--primary, #0f172a)', borderRadius: '8px', color: '#ffffff', marginBottom: '0.5rem' }}>
            <IconLogo size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main, #0f172a)', marginBottom: '0.2rem' }}>FinanceSaathi</h2>
          <p className="muted small">Digital Financial Literacy & Microfinance Platform</p>
          <div className="lang-toggle-pills" style={{ display: 'inline-flex', marginTop: '0.8rem' }}>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हि</button>
            <button className={`lang-btn ${lang === 'mr' ? 'active' : ''}`} onClick={() => setLang('mr')}>मरा</button>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '0.5rem' }}>{title}</h3>
        {children}

        <div style={{ marginTop: '1.5rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-color, #f1f5f9)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
          <Link to="/privacy" style={{ color: 'var(--text-muted, #64748b)' }}>{t("privacy")}</Link>
          <span>•</span>
          <Link to="/terms" style={{ color: 'var(--text-muted, #64748b)' }}>Terms & Fair Practice</Link>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login } = useAuth()
  const { t, lang } = useLang()
  const [f, setF] = useState({ email: '', password: '' })
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

  const quickLogin = async (email, password) => {
    setF({ email, password })
    setErr('')
    setBusy(true)
    try {
      await login(email, password)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
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
            placeholder="name@example.com"
          />
        </Field>
        <Field label={t('password')}>
          <input
            type="password"
            required
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            placeholder="••••••••"
          />
        </Field>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing In…' : t('login')}
        </button>

        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
            <div className="muted small" style={{ marginBottom: '0.6rem', textAlign: 'center', fontWeight: 600 }}>
              {lang === 'hi' ? 'डेमो त्वरित लॉगिन (1-क्लिक):' : lang === 'mr' ? 'डेमो त्वरित लॉगिन (1-क्लिक):' : 'Demo Quick Login (1-Click):'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn small ghost"
                disabled={busy}
                onClick={() => quickLogin('borrower@financesaathi.in', 'Borrower#2025!')}
                style={{ fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem 0.5rem' }}
              >
                👩‍🌾 {lang === 'hi' ? 'उधारकर्ता (Asha)' : lang === 'mr' ? 'कर्जदार (Asha)' : 'Borrower (Asha)'}
              </button>
              <button
                type="button"
                className="btn small ghost"
                disabled={busy}
                onClick={() => quickLogin('leader@financesaathi.in', 'Leader#2025!')}
                style={{ fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem 0.5rem' }}
              >
                🤝 {lang === 'hi' ? 'एसएचजी लीडर' : lang === 'mr' ? 'बचत गट प्रमुख' : 'SHG Leader'}
              </button>
              <button
                type="button"
                className="btn small ghost"
                disabled={busy}
                onClick={() => quickLogin('officer@financesaathi.in', 'Officer#2025!')}
                style={{ fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem 0.5rem' }}
              >
                📋 {lang === 'hi' ? 'क्रेडिट ऑफिसर' : lang === 'mr' ? 'क्रेडिट अधिकारी' : 'Credit Officer'}
              </button>
              <button
                type="button"
                className="btn small ghost"
                disabled={busy}
                onClick={() => quickLogin('admin@financesaathi.in', 'Admin#2025!')}
                style={{ fontSize: '0.8rem', justifyContent: 'center', padding: '0.45rem 0.5rem' }}
              >
                ⚙️ {lang === 'hi' ? 'व्यवस्थापक (Admin)' : lang === 'mr' ? 'प्रशासक (Admin)' : 'Administrator'}
              </button>
            </div>
          </div>
        )}
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {t('noAccount')} <Link to="/register">{t('register')}</Link>
      </p>
    </Shell>
  )
}

export function Register() {
  const { register } = useAuth()
  const { t, lang } = useLang()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', consent: false })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!f.consent) {
      setErr('You must consent to digital processing under DPDP Act 2023 to proceed.')
      return
    }
    setBusy(true)
    try {
      await register({
        name: f.name,
        email: f.email,
        phone: f.phone,
        password: f.password,
        consent: f.consent,
        language: lang,
      })
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
        <Field label={t('password') + ' (min 8 characters)'}>
          <input type="password" required minLength={8} value={f.password} onChange={set('password')} placeholder="Choose a secure password (min 8 chars)" />
        </Field>
        <div style={{ marginTop: '0.8rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              required
              checked={f.consent}
              onChange={(e) => setF({ ...f, consent: e.target.checked })}
              style={{ marginTop: '0.2rem' }}
            />
            <span>
              I consent to the collection and processing of my financial data in accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the platform <Link to="/privacy">{t("privacy")}</Link>.
            </span>
          </label>
        </div>
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
