import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Field, Loading, Modal, Progress, Stat, useLoad } from '../ui'
import {
  IconUser,
  IconBell,
  IconShield,
  IconCheckCircle,
  IconAlertTriangle,
  IconCreditCard,
  IconCoins,
  IconClock,
  IconFilter,
} from '../icons'

export function Profile() {
  const { user, refresh } = useAuth()
  const { t, setLang } = useLang()
  const [f, setF] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    language: user?.language || 'en',
    monthly_income: user?.monthly_income || 0,
    monthly_expenses: user?.monthly_expenses || 0,
    existing_emi: user?.existing_emi || 0,
    savings_balance: user?.savings_balance || 0,
  })

  useEffect(() => {
    if (user) {
      setF({
        name: user.name || '',
        phone: user.phone || '',
        language: user.language || 'en',
        monthly_income: user.monthly_income || 0,
        monthly_expenses: user.monthly_expenses || 0,
        existing_emi: user.existing_emi || 0,
        savings_balance: user.savings_balance || 0,
      })
    }
  }, [user])

  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setMsg({ kind: 'error', text: '' })
    setSaving(true)
    try {
      await api('/auth/me', {
        method: 'PATCH',
        body: {
          ...f,
          monthly_income: Number(f.monthly_income),
          monthly_expenses: Number(f.monthly_expenses),
          existing_emi: Number(f.existing_emi),
          savings_balance: Number(f.savings_balance),
        },
      })
      setLang(f.language)
      await refresh()
      setMsg({ kind: 'success', text: 'Borrower profile & household parameters saved successfully.' })
    } catch (x) {
      setMsg({ kind: 'error', text: x.message })
    } finally {
      setSaving(false)
    }
  }

  const income = Number(f.monthly_income) || 0
  const expenses = Number(f.monthly_expenses) || 0
  const emi = Number(f.existing_emi) || 0
  const savings = Number(f.savings_balance) || 0

  const foirPct = income > 0 ? Math.round((emi / income) * 100) : 0
  const monthlySurplus = income - expenses - emi
  const emergencyMonths = expenses > 0 ? (savings / expenses).toFixed(1) : '0'

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('profile')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Household financial census, KYC parameters, and automated debt obligation assessment
          </p>
        </div>
        <div>
          <Badge tone={user.role === 'admin' ? 'approved' : user.role === 'officer' ? 'pending' : 'muted'}>
            Role: {user.role.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label="Fixed Obligation Ratio (FOIR)"
          value={`${foirPct}%`}
          sub={foirPct <= 40 ? 'Safe (<50% threshold)' : 'Elevated debt level'}
        />
        <Stat
          label="Net Household Surplus"
          value={money(monthlySurplus)}
          sub={monthlySurplus >= 0 ? 'Positive cashflow' : 'Deficit spending'}
        />
        <Stat
          label="Liquid Savings Reserve"
          value={money(savings)}
          sub={`${emergencyMonths} months expense buffer`}
        />
        <Stat
          label="Primary Dialect"
          value={f.language === 'mr' ? 'मराठी' : f.language === 'hi' ? 'हिन्दी' : 'English'}
          sub="Localized voice TTS enabled"
        />
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      <div className="two-col">
        <Card title="Borrower Identification & Preferences">
          <form onSubmit={submit}>
            <Field label={t('name')}>
              <input required value={f.name} onChange={set('name')} />
            </Field>

            <Field label="Registered Email (Account Key)">
              <input disabled value={user.email} style={{ background: 'var(--canvas-bg)', cursor: 'not-allowed' }} />
            </Field>

            <Field label={t('phone')}>
              <input value={f.phone} onChange={set('phone')} placeholder="+91 98XXXXXXXX" />
            </Field>

            <Field label={t('language')}>
              <select value={f.language} onChange={set('language')}>
                <option value="en">English (Official Interface)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </Field>

            <h4 style={{ fontSize: '0.9rem', margin: '1.25rem 0 0.5rem 0', color: 'var(--navy-primary)' }}>
              Monthly Household Income & Expenditure
            </h4>
            <p className="muted small" style={{ marginBottom: '0.75rem' }}>
              Statutory figures used strictly for RBI affordability evaluation and microcredit appraisal.
            </p>

            <Field label={t('income')}>
              <input type="number" min="0" value={f.monthly_income} onChange={set('monthly_income')} />
            </Field>

            <Field label={t('expenses')}>
              <input type="number" min="0" value={f.monthly_expenses} onChange={set('monthly_expenses')} />
            </Field>

            <Field label={t('existingEmi')}>
              <input type="number" min="0" value={f.existing_emi} onChange={set('existing_emi')} />
            </Field>

            <Field label={t('savingsBalance')}>
              <input type="number" min="0" value={f.savings_balance} onChange={set('savings_balance')} />
            </Field>

            <button className="btn" style={{ marginTop: '0.5rem', width: '100%' }} disabled={saving}>
              {saving ? 'Saving Parameters…' : t('save') + ' Profile & Metrics'}
            </button>
          </form>
        </Card>

        <Card title="Household Financial Health Diagnostics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--canvas-bg)', padding: '1rem', borderRadius: '8px' }}>
              <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>{t("debtServiceBurden")}</span>
                <span>{foirPct}% of Income</span>
              </div>
              <Progress pct={Math.min(100, foirPct)} />
              <div className="muted small" style={{ marginTop: '0.35rem' }}>
                {foirPct <= 40
                  ? 'Your debt obligations are within safe regulatory limits (under 50%).'
                  : 'High debt burden. Adding further loans may jeopardize monthly savings.'}
              </div>
            </div>

            <div style={{ background: 'var(--canvas-bg)', padding: '1rem', borderRadius: '8px' }}>
              <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>{t("emergencyCushion")}</span>
                <span>{emergencyMonths} Months</span>
              </div>
              <Progress pct={Math.min(100, (Number(emergencyMonths) / 3) * 100)} />
              <div className="muted small" style={{ marginTop: '0.35rem' }}>
                {Number(emergencyMonths) >= 3
                  ? 'Excellent. You have at least 3 months of survival reserve.'
                  : 'Target at least 3 months of household expenses in liquid savings.'}
              </div>
            </div>

            <div
              style={{
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                padding: '1rem',
                background: 'var(--card-bg, #ffffff)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <IconShield size={18} className="text-emerald" />
                <h4 style={{ margin: 0, fontSize: '0.88rem' }}>{t("dpdpConsentConfidentiality")}</h4>
              </div>
              <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
                Your financial figures are processed exclusively for credit risk analysis in compliance with the Digital Personal Data Protection Act, 2023. We do not sell or monetize personal credit metrics.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

export function Notifications() {
  const { t } = useLang()
  const n = useLoad(() => api('/notifications'))
  const [filter, setFilter] = useState('all')

  const read = async (id) => {
    await api('/notifications/' + id + '/read', { method: 'POST' })
    n.reload()
  }

  const markAllRead = async () => {
    const unreadList = (n.data || []).filter((x) => !x.read)
    for (const item of unreadList) {
      await api('/notifications/' + item.id + '/read', { method: 'POST' })
    }
    n.reload()
  }

  const notifications = n.data || []
  const unreadCount = notifications.filter((x) => !x.read).length
  const filteredNotes = notifications.filter((x) => {
    if (filter === 'unread') return !x.read
    if (filter === 'read') return x.read
    return true
  })

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('notifications')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            System dispatches, loan repayment reminders, and SHG governance alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn small ghost" onClick={markAllRead}>
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Total Dispatches" value={notifications.length} sub="Lifetime notifications" />
        <Stat label="Pending Attention" value={unreadCount} sub={unreadCount === 0 ? 'All caught up' : 'Unread alerts'} />
        <Stat label="Dispatched Channel" value="In-App Notification" sub="Institutional direct alerts" />
      </div>

      <div
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          className={'btn small ' + (filter === 'all' ? '' : 'ghost')}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={'btn small ' + (filter === 'unread' ? '' : 'ghost')}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          className={'btn small ' + (filter === 'read' ? '' : 'ghost')}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {n.loading ? (
        <Loading />
      ) : (
        <ul className="notes" style={{ padding: 0 }}>
          {filteredNotes.map((x) => (
            <li
              key={x.id}
              className={x.read ? 'read' : ''}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                background: x.read ? 'var(--card-bg, #ffffff)' : 'var(--teal-soft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <IconBell size={18} className={x.read ? 'text-muted' : 'text-emerald'} style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: x.read ? 400 : 600 }}>{x.message}</div>
                  <small className="muted">
                    {new Date(x.created_at + 'Z').toLocaleString()} · Dispatch #{x.id}
                  </small>
                </div>
              </div>
              {!x.read && (
                <button className="btn small ghost" onClick={() => read(x.id)} style={{ flexShrink: 0 }}>
                  Mark Read
                </button>
              )}
            </li>
          ))}
          {filteredNotes.length === 0 && (
            <li className="muted" style={{ textAlign: 'center', padding: '2rem 0', listStyle: 'none' }}>
              No notifications matching current filter.
            </li>
          )}
        </ul>
      )}
    </>
  )
}

export function AtRisk() {
  const { t } = useLang()
  const r = useLoad(() => api('/officer/at-risk'))
  const atRiskList = r.data || []

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>At-Risk Credit Monitoring (Early Warning System)</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Machine learning anomaly detection, delinquency triggers, and risk mitigation terminal
          </p>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="At-Risk Accounts" value={atRiskList.length} sub="Flagged by ML model" />
        <Stat label="Early Warning Triggers" value="Overdue > 0" sub="Days past due threshold" />
        <Stat label="Resolution Protocol" value="SHG Peer Meeting" sub="Intervention strategy" />
      </div>

      <Alert>{r.error}</Alert>

      {r.loading ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("loanReference")}</th>
                <th>{t("borrower")}</th>
                <th>{t("overdueInstalments")}</th>
                <th>AI Risk Score</th>
                <th>{t("underwritingAnomaly")}</th>
                <th>{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {atRiskList.map((x) => (
                <tr key={x.loan_id}>
                  <td>
                    <Link to={'/loans/' + x.loan_id} style={{ fontWeight: 600 }}>
                      #{x.loan_id}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 600 }}>{x.borrower}</td>
                  <td>
                    <Badge tone="overdue">{x.overdue} Overdue</Badge>
                  </td>
                  <td>
                    <Badge tone={x.ai_score < 40 ? 'not_ready' : 'caution'}>
                      Score: {x.ai_score}
                    </Badge>
                  </td>
                  <td>
                    <div className="small" style={{ color: 'var(--alert-red)' }}>
                      {x.reasons.join('; ')}
                    </div>
                  </td>
                  <td>
                    <Link to={'/loans/' + x.loan_id} className="btn small ghost">
                      Review Dossier
                    </Link>
                  </td>
                </tr>
              ))}
              {atRiskList.length === 0 && (
                <tr>
                  <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
                    Zero credit facilities flagged. All borrower portfolios are currently in healthy standing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export function Admin() {
  const { t } = useLang()
  const users = useLoad(() => api('/admin/users'))
  const audit = useLoad(() => api('/admin/audit?limit=50'))
  const loanProducts = useLoad(() => api('/loans/products'))
  const schemes = useLoad(() => api('/schemes?language=en'))
  const courses = useLoad(() => api('/courses?language=en'))

  const [adminTab, setAdminTab] = useState('governance') // 'governance', 'products', 'schemes', 'courses'
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [runningReminders, setRunningReminders] = useState(false)

  // Product Edit State
  const [editingProduct, setEditingProduct] = useState(null)
  const [savingProduct, setSavingProduct] = useState(false)

  // Scheme Edit State
  const [editingScheme, setEditingScheme] = useState(null)
  const [savingScheme, setSavingScheme] = useState(false)

  const setRole = async (id, role) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await api('/admin/users/' + id + '/role', { method: 'PATCH', body: { role } })
      setMsg({ kind: 'success', text: `Role updated for user #${id} to ${role}.` })
      users.reload()
      audit.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    }
  }

  const remind = async () => {
    setRunningReminders(true)
    try {
      const r = await api('/admin/run-reminders', { method: 'POST' })
      setMsg({ kind: 'success', text: `${r.created} automated payment reminder(s) generated.` })
      audit.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    } finally {
      setRunningReminders(false)
    }
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setSavingProduct(true)
    setMsg({ kind: 'error', text: '' })
    try {
      await api('/admin/loan-products/' + editingProduct.id, {
        method: 'PUT',
        body: {
          code: editingProduct.code,
          name: editingProduct.name,
          name_hi: editingProduct.name_hi || '',
          name_mr: editingProduct.name_mr || '',
          annual_rate: Number(editingProduct.annual_rate),
          min_amount: Number(editingProduct.min_amount),
          max_amount: Number(editingProduct.max_amount),
          min_tenure: Number(editingProduct.min_tenure),
          max_tenure: Number(editingProduct.max_tenure),
          allowed_schedule_types: editingProduct.allowed_schedule_types || ['monthly'],
          required_documents: editingProduct.required_documents || ['aadhaar'],
          eligibility_notes: editingProduct.eligibility_notes || '',
          active: editingProduct.active ?? true,
        },
      })
      setMsg({ kind: 'success', text: `Loan product '${editingProduct.name}' updated successfully.` })
      setEditingProduct(null)
      loanProducts.reload()
      audit.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    } finally {
      setSavingProduct(false)
    }
  }

  const handleSaveScheme = async (e) => {
    e.preventDefault()
    setSavingScheme(true)
    setMsg({ kind: 'error', text: '' })
    try {
      await api('/admin/schemes/' + editingScheme.id, {
        method: 'PUT',
        body: {
          code: editingScheme.code,
          name: editingScheme.name,
          language: editingScheme.language || 'en',
          category: editingScheme.category || 'general',
          benefit_summary: editingScheme.benefit_summary || '',
          benefit_value: Number(editingScheme.benefit_value) || 0,
          description: editingScheme.description || '',
          eligibility: editingScheme.eligibility || '',
          url: editingScheme.url || '',
        },
      })
      setMsg({ kind: 'success', text: `Scheme '${editingScheme.name}' updated successfully.` })
      setEditingScheme(null)
      schemes.reload()
      audit.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    } finally {
      setSavingScheme(false)
    }
  }

  const userList = users.data || []
  const auditList = audit.data || []
  const productList = loanProducts.data || []
  const schemeList = schemes.data || []
  const courseList = courses.data || []

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t("sysAdminGovernance")}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Authoritative microfinance catalog CMS, welfare scheme registry, statutory audit trail, and user roles
          </p>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Total Users" value={userList.length} sub="Across all roles" />
        <Stat label="Loan Products" value={productList.length} sub="Institutional catalog" />
        <Stat label="Welfare Schemes" value={schemeList.length} sub="Active national registry" />
        <Stat label="Audit Events" value={auditList.length} sub="Cryptographic log" />
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      {/* Admin Tab Bar */}
      <div className="card tab-bar-card" style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={`tab-btn ${adminTab === 'governance' ? 'active' : ''}`}
          onClick={() => setAdminTab('governance')}
        >
          Governance & Access ({userList.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${adminTab === 'products' ? 'active' : ''}`}
          onClick={() => setAdminTab('products')}
        >
          Loan Products CMS ({productList.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${adminTab === 'schemes' ? 'active' : ''}`}
          onClick={() => setAdminTab('schemes')}
        >
          Welfare Schemes CMS ({schemeList.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${adminTab === 'courses' ? 'active' : ''}`}
          onClick={() => setAdminTab('courses')}
        >
          Courses CMS ({courseList.length})
        </button>
      </div>

      {/* TAB 1: Governance & Access */}
      {adminTab === 'governance' && (
        <>
          <Card title="Batch Execution Services" style={{ marginBottom: '1.25rem' }}>
            <div className="row between" style={{ alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{t("automatedEmiReminders")}</h4>
                <p className="muted small" style={{ margin: '0.2rem 0 0 0' }}>
                  Scans all active repayment schedules for upcoming maturities and triggers notices.
                </p>
              </div>
              <button className="btn" onClick={remind} disabled={runningReminders}>
                <IconClock size={16} /> {runningReminders ? 'Triggering Reminders…' : 'Execute Reminder Engine Now'}
              </button>
            </div>
          </Card>

          <Card title="User Access Directory & Role Assignment" style={{ marginBottom: '1.25rem' }}>
            {users.loading ? (
              <Loading />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("userId")}</th>
                      <th>{t("legalName")}</th>
                      <th>{t("emailCredential")}</th>
                      <th>{t("privilegeRole")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => setRole(u.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                          >
                            {['user', 'shg_leader', 'officer', 'admin'].map((r) => (
                              <option key={r} value={r}>
                                {r.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Statutory Audit Trail (Last 50 Events)">
            {audit.loading ? (
              <Loading />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("timeLabel")}</th>
                      <th>{t("actorId")}</th>
                      <th>{t("action")}</th>
                      <th>{t("targetEntity")}</th>
                      <th>{t("operationDetails")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditList.map((a) => (
                      <tr key={a.id}>
                        <td>{new Date(a.created_at + 'Z').toLocaleString()}</td>
                        <td>Actor #{a.actor_id}</td>
                        <td>
                          <Badge tone="pending">{a.action}</Badge>
                        </td>
                        <td>
                          {a.entity} #{a.entity_id}
                        </td>
                        <td className="small">{a.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* TAB 2: Loan Products CMS */}
      {adminTab === 'products' && (
        <Card title="Authoritative Loan Product Catalog (Server Backed)">
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Interest rates, principal caps, and repayment tenure ranges configured here dynamically bind into the borrowing marketplace.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("productCode")}</th>
                  <th>{t("facilityName")}</th>
                  <th>{t("authoritativeApr")}</th>
                  <th>{t("principalRange")}</th>
                  <th>{t("tenureRange")}</th>
                  <th>{t("status")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge neutral">{p.code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="muted small">{p.eligibility_notes}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-600)' }}>
                      {p.annual_rate}% p.a.
                    </td>
                    <td>
                      ₹{p.min_amount.toLocaleString('en-IN')} – ₹{p.max_amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {p.min_tenure} – {p.max_tenure} mo
                    </td>
                    <td>
                      <Badge tone={p.active ? 'approved' : 'caution'}>
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => setEditingProduct({ ...p })}
                      >
                        Edit Limits & Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Welfare Schemes CMS */}
      {adminTab === 'schemes' && (
        <Card title="National & State Welfare Schemes Registry">
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Government DBT programs, subsidies, and eligibility criteria synchronized across English, Hindi, and Marathi.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("schemeCode")}</th>
                  <th>{t("schemeName")}</th>
                  <th>{t("category")}</th>
                  <th>{t("directGrantValue")}</th>
                  <th>{t("verifiedAsOf")}</th>
                  <th>{t("action")}</th>
                </tr>
              </thead>
              <tbody>
                {schemeList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="badge neutral">{s.code}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="muted small">{s.benefit_summary}</div>
                    </td>
                    <td>
                      <span className="badge">{s.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--emerald-600)' }}>
                      {s.benefit_value > 0 ? `₹${Number(s.benefit_value).toLocaleString('en-IN')}` : 'Subsidized Credit'}
                    </td>
                    <td className="muted small">{s.last_verified}</td>
                    <td>
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => setEditingScheme({ ...s })}
                      >
                        Edit Scheme
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Courses CMS */}
      {adminTab === 'courses' && (
        <Card title="Financial Literacy Modules Catalog">
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Bite-sized rural education modules with interactive 8-question quizzes.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("slugReference")}</th>
                  <th>{t("courseTitle")}</th>
                  <th>{t("summary")}</th>
                  <th>{t("language")}</th>
                </tr>
              </thead>
              <tbody>
                {courseList.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge neutral">{c.slug}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td className="muted small" style={{ maxWidth: '350px' }}>{c.summary}</td>
                    <td>
                      <Badge>{c.language.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <Modal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          title={`Edit Loan Product: ${editingProduct.name}`}
          maxWidth={500}
        >
          <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="Annual Interest Rate (% p.a.)">
              <input
                type="number"
                step="0.1"
                min="1"
                max="60"
                required
                value={editingProduct.annual_rate}
                onChange={(e) => setEditingProduct({ ...editingProduct, annual_rate: e.target.value })}
              />
            </Field>

            <div className="row" style={{ gap: '0.6rem' }}>
              <div style={{ flex: 1 }}>
                <Field label="Min Principal (₹)">
                  <input
                    type="number"
                    step="500"
                    min="500"
                    required
                    value={editingProduct.min_amount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_amount: e.target.value })}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Max Principal (₹)">
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    value={editingProduct.max_amount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, max_amount: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="row" style={{ gap: '0.6rem' }}>
              <div style={{ flex: 1 }}>
                <Field label="Min Tenure (Mo)">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={editingProduct.min_tenure}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_tenure: e.target.value })}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Max Tenure (Mo)">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={editingProduct.max_tenure}
                    onChange={(e) => setEditingProduct({ ...editingProduct, max_tenure: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <Field label="Eligibility Guidelines & Underwriting Notes">
              <textarea
                rows={2}
                value={editingProduct.eligibility_notes}
                onChange={(e) => setEditingProduct({ ...editingProduct, eligibility_notes: e.target.value })}
              />
            </Field>

            <label className="check" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={editingProduct.active}
                onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
              />
              <span>{t("productActiveMarketplace")}</span>
            </label>

            <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn ghost" onClick={() => setEditingProduct(null)}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={savingProduct}>
                {savingProduct ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Scheme Edit Modal */}
      {editingScheme && (
        <Modal
          isOpen={Boolean(editingScheme)}
          onClose={() => setEditingScheme(null)}
          title={`Edit Welfare Scheme: ${editingScheme.name}`}
          maxWidth={500}
        >
          <form onSubmit={handleSaveScheme} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <Field label="Scheme Headline & Title">
              <input
                type="text"
                required
                value={editingScheme.name}
                onChange={(e) => setEditingScheme({ ...editingScheme, name: e.target.value })}
              />
            </Field>

            <Field label="Key Financial Benefit Summary">
              <input
                type="text"
                required
                value={editingScheme.benefit_summary}
                onChange={(e) => setEditingScheme({ ...editingScheme, benefit_summary: e.target.value })}
              />
            </Field>

            <Field label="Grant / Assistance Ceiling (₹)">
              <input
                type="number"
                step="500"
                min="0"
                value={editingScheme.benefit_value}
                onChange={(e) => setEditingScheme({ ...editingScheme, benefit_value: e.target.value })}
              />
            </Field>

            <Field label="Official Portal URL">
              <input
                type="url"
                value={editingScheme.url}
                onChange={(e) => setEditingScheme({ ...editingScheme, url: e.target.value })}
              />
            </Field>

            <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="btn ghost" onClick={() => setEditingScheme(null)}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={savingScheme}>
                {savingScheme ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
