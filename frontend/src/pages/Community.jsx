import { useState } from 'react'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Field, Loading, Progress, Stat, useLoad } from '../ui'
import {
  IconCoins,
  IconTractor,
  IconHospital,
  IconCart,
  IconPlus,
  IconCheckCircle,
  IconCalendar,
  IconUsers,
  IconShield,
  IconClock,
  IconTarget,
} from '../icons'

function getGoalIcon(title = '') {
  const t = title.toLowerCase()
  if (t.includes('tractor') || t.includes('goat') || t.includes('cow') || t.includes('seed') || t.includes('farm') || t.includes('crop')) {
    return <IconTractor size={20} className="text-emerald" />
  }
  if (t.includes('health') || t.includes('medical') || t.includes('hospital') || t.includes('emergency')) {
    return <IconHospital size={20} className="text-emerald" />
  }
  if (t.includes('shop') || t.includes('store') || t.includes('cart') || t.includes('inventory') || t.includes('business')) {
    return <IconCart size={20} className="text-emerald" />
  }
  return <IconCoins size={20} className="text-emerald" />
}

export function Savings() {
  const { t } = useLang()
  const goals = useLoad(() => api('/savings/goals'))
  const [f, setF] = useState({ title: '', target_amount: '' })
  const [dep, setDep] = useState({})
  const [err, setErr] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const PRESET_GOALS = [
    { title: 'Dairy Cow Purchase', target: 35000 },
    { title: 'Kharif Crop Seeds & Fertilizer', target: 15000 },
    { title: 'Emergency Family Health Reserve', target: 20000 },
    { title: 'Kirana Shop Working Capital', target: 25000 },
  ]

  const create = async (e) => {
    e.preventDefault()
    setErr('')
    setSuccessMsg('')
    try {
      await api('/savings/goals', {
        method: 'POST',
        body: { title: f.title, target_amount: Number(f.target_amount) },
      })
      setF({ title: '', target_amount: '' })
      setSuccessMsg('Savings target successfully registered.')
      goals.reload()
    } catch (x) {
      setErr(x.message)
    }
  }

  const deposit = async (id, customAmount = null) => {
    setErr('')
    setSuccessMsg('')
    const amountToDeposit = customAmount !== null ? customAmount : Number(dep[id])
    if (!amountToDeposit || amountToDeposit <= 0) return
    try {
      await api('/savings/goals/' + id + '/deposit', {
        method: 'POST',
        body: { amount: amountToDeposit },
      })
      setDep({ ...dep, [id]: '' })
      setSuccessMsg(`Deposited ${money(amountToDeposit)} into savings goal.`)
      goals.reload()
    } catch (x) {
      setErr(x.message)
    }
  }

  const goalsList = goals.data || []
  const totalSavedAcrossGoals = goalsList.reduce((acc, g) => acc + (g.saved_amount || 0), 0)
  const totalTargetAcrossGoals = goalsList.reduce((acc, g) => acc + (g.target_amount || 0), 0)
  const completedGoalsCount = goalsList.filter((g) => g.progress_pct >= 100).length

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('savings')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Structured savings plans and goal-oriented accumulation for rural households
          </p>
        </div>
      </div>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Total Saved in Goals" value={money(totalSavedAcrossGoals)} />
        <Stat label="Combined Target" value={money(totalTargetAcrossGoals)} />
        <Stat label="Active Goals" value={goalsList.length} sub={`${completedGoalsCount} completed`} />
        <Stat
          label="Overall Completion"
          value={totalTargetAcrossGoals > 0 ? `${Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100)}%` : '0%'}
        />
      </div>

      <Card title="Register New Savings Goal" className="mb-4">
        <form onSubmit={create}>
          <div className="row" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input
              required
              style={{ flex: 2 }}
              placeholder="Goal title (e.g., Dairy cow purchase, Micro-irrigation)"
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
            <input
              required
              style={{ flex: 1 }}
              type="number"
              min="100"
              placeholder="Target (Rs)"
              value={f.target_amount}
              onChange={(e) => setF({ ...f, target_amount: e.target.value })}
            />
            <button className="btn" type="submit">
              <IconPlus size={16} /> Add Target
            </button>
          </div>
        </form>

        <div style={{ marginTop: '0.6rem' }}>
          <span className="muted small" style={{ marginRight: '0.5rem' }}>Quick presets:</span>
          {PRESET_GOALS.map((p, i) => (
            <button
              key={i}
              type="button"
              className="btn small ghost"
              style={{ marginRight: '0.4rem', marginBottom: '0.4rem', fontSize: '0.75rem' }}
              onClick={() => setF({ title: p.title, target_amount: p.target })}
            >
              + {p.title} ({money(p.target)})
            </button>
          ))}
        </div>
      </Card>

      {successMsg && <Alert kind="success">{successMsg}</Alert>}
      <Alert>{err || goals.error}</Alert>

      {goals.loading ? (
        <Loading />
      ) : (
        <div className="grid wide">
          {goalsList.map((g) => {
            const isCompleted = g.progress_pct >= 100
            return (
              <Card key={g.id}>
                <div className="row between" style={{ alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: '6px', background: 'var(--canvas-bg)', borderRadius: '6px' }}>
                      {getGoalIcon(g.title)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{g.title}</h4>
                      <span className="muted small">Goal #{g.id}</span>
                    </div>
                  </div>
                  <div>
                    {isCompleted ? (
                      <Badge tone="approved">Completed</Badge>
                    ) : g.progress_pct >= 50 ? (
                      <Badge tone="pending">Over 50%</Badge>
                    ) : (
                      <Badge tone="muted">In Progress</Badge>
                    )}
                  </div>
                </div>

                <div style={{ margin: '0.75rem 0' }}>
                  <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                    <span className="text-emerald" style={{ fontWeight: 600 }}>{money(g.saved_amount)}</span>
                    <span className="muted">Target: {money(g.target_amount)}</span>
                  </div>
                  <Progress pct={g.progress_pct} />
                  <div className="row between small muted" style={{ marginTop: '0.35rem' }}>
                    <span>{g.progress_pct}% reached</span>
                    <span>Remaining: {money(Math.max(0, g.target_amount - g.saved_amount))}</span>
                  </div>
                </div>

                <div style={{ background: 'var(--canvas-bg)', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem' }}>
                  <div className="muted small" style={{ marginBottom: '0.4rem', fontWeight: 600 }}>
                    Quick Deposit:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    {[500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="btn small ghost"
                        style={{ flex: 1, padding: '4px 6px', fontSize: '0.75rem' }}
                        onClick={() => deposit(g.id, amt)}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Custom amount (Rs)"
                      value={dep[g.id] || ''}
                      onChange={(e) => setDep({ ...dep, [g.id]: e.target.value })}
                    />
                    <button
                      className="btn small"
                      onClick={() => deposit(g.id)}
                      disabled={!dep[g.id] || Number(dep[g.id]) <= 0}
                    >
                      Deposit
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
          {goalsList.length === 0 && (
            <p className="muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0' }}>
              No savings goals configured yet. Register a goal above to build financial resilience.
            </p>
          )}
        </div>
      )}
    </>
  )
}

export function SHG() {
  const { user, refresh } = useAuth()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [village, setVillage] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const summary = useLoad(
    () => (user.shg_id ? api('/shgs/' + user.shg_id + '/summary') : Promise.resolve(null)),
    [user.shg_id]
  )

  const run = async (fn, ok) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await fn()
      setMsg({ kind: 'success', text: ok })
    } catch (x) {
      setMsg({ kind: 'error', text: x.message })
    }
  }

  const create = (e) => {
    e.preventDefault()
    run(async () => {
      await api('/shgs', { method: 'POST', body: { name, village } })
      await refresh()
    }, 'Self-Help Group successfully registered.')
  }

  const add = (e) => {
    e.preventDefault()
    run(async () => {
      await api('/shgs/' + user.shg_id + '/members', { method: 'POST', body: { email } })
      setEmail('')
      summary.reload()
    }, 'Member successfully enrolled into group.')
  }

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('shg')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            NABARD SHG-Bank Linkage Program & Joint Liability Group Management
          </p>
        </div>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      {!user.shg_id ? (
        <Card title="Establish a Self-Help Group (SHG)">
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Self-Help Groups aggregate savings, provide peer financial discipline, and qualify for subsidized group microcredit under NRLM (National Rural Livelihoods Mission).
          </p>
          <form onSubmit={create}>
            <Field label="SHG Name">
              <input
                required
                minLength={2}
                placeholder="e.g. Jai Kisan Mahila Bachat Gat"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Village / Gram Panchayat">
              <input
                value={village}
                placeholder="e.g. Shindewadi, Satara District"
                onChange={(e) => setVillage(e.target.value)}
              />
            </Field>
            <button className="btn" style={{ marginTop: '0.5rem' }}>
              <IconUsers size={16} /> Register SHG
            </button>
          </form>
        </Card>
      ) : summary.loading ? (
        <Loading />
      ) : summary.data && (
        <>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '1.2rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconShield size={22} className="text-emerald" />
                <h3 style={{ margin: 0 }}>{summary.data.name}</h3>
                <Badge tone="approved">Active SHG</Badge>
              </div>
              <p className="muted small" style={{ margin: '0.3rem 0 0 0' }}>
                {summary.data.village ? `Village: ${summary.data.village}` : 'Village Registered'} · SHG ID: #{summary.data.id} · NRLM Linkage Status: Verified
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="muted small">Monthly Savings Protocol</span>
              <div style={{ fontWeight: 700, color: 'var(--emerald-action)' }}>100% On-Time Ledger</div>
            </div>
          </div>

          <div className="grid" style={{ marginBottom: '1.25rem' }}>
            <Stat label="Total Members" value={summary.data.members.length} sub="Registered borrowers" />
            <Stat label="Group Credit Portfolio" value={summary.data.group_loans} sub="Active joint facilities" />
            <Stat label={t('outstanding')} value={money(summary.data.outstanding)} sub="Collective balance" />
            <Stat
              label="Overdue Instalments"
              value={summary.data.overdue_installments}
              sub={summary.data.overdue_installments === 0 ? 'Zero delinquency' : 'Attention required'}
            />
          </div>

          <div className="two-col" style={{ marginBottom: '1.25rem' }}>
            <Card title="Monthly Meeting Schedule & Governance">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <IconCalendar size={18} className="text-emerald" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Next Assembly: 15th of Every Month</div>
                    <div className="muted small">Location: Gram Panchayat Community Hall (11:00 AM)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <IconCheckCircle size={18} className="text-emerald" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Quorum Rule: Minimum 75% Attendance</div>
                    <div className="muted small">Passed in statutory resolution. Last quorum: 100% present.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <IconTarget size={18} className="text-emerald" style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Agenda Item</div>
                    <div className="muted small">Bulk procurement of organic fertilizer and dairy loan sanction.</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Enroll SHG Member">
              <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                Borrowers must have an active FinanceSaathi account to be inducted into your group roster.
              </p>
              <form onSubmit={add} className="row" style={{ gap: '0.5rem' }}>
                <input
                  type="email"
                  required
                  placeholder="Member's registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn" type="submit">
                  <IconPlus size={16} /> Add Member
                </button>
              </form>
            </Card>
          </div>

          <Card title="SHG Member Roster & Contribution Ledger">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Full Name</th>
                    <th>Designation</th>
                    <th>Monthly Contribution</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.data.members.map((m, idx) => (
                    <tr key={m.id}>
                      <td>#{m.id}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>
                        <Badge tone={idx === 0 ? 'approved' : 'muted'}>
                          {idx === 0 ? 'Group Leader' : 'Active Member'}
                        </Badge>
                      </td>
                      <td>₹500 / month</td>
                      <td>
                        <Badge tone="approved">In Good Standing</Badge>
                      </td>
                    </tr>
                  ))}
                  {summary.data.members.length === 0 && (
                    <tr>
                      <td colSpan="5" className="muted" style={{ textAlign: 'center' }}>
                        No members added yet. Use the enrollment form above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
