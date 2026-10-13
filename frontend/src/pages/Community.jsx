import { useState } from 'react'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Field, Loading, Progress, Stat, useLoad, useToast } from '../ui'
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
  IconCheck,
  IconAward,
  IconLock,
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
  const toast = useToast()
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
      const ok = 'Savings target successfully registered.'
      setSuccessMsg(ok)
      toast.success(ok)
      goals.reload()
    } catch (x) {
      setErr(x.message)
      toast.error(x.message)
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
      const ok = `Deposited ${money(amountToDeposit)} into savings goal.`
      setSuccessMsg(ok)
      toast.success(ok)
      goals.reload()
    } catch (x) {
      setErr(x.message)
      toast.error(x.message)
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
  const toast = useToast()
  const [name, setName] = useState('')
  const [village, setVillage] = useState('')
  const [thriftAmt, setThriftAmt] = useState(500)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState({ kind: 'error', text: '' })

  // Meeting form
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split('T')[0])
  const [meetingAgenda, setMeetingAgenda] = useState('Monthly Thrift Collection & Inter-Lending Assembly')
  const [meetingMinutes, setMeetingMinutes] = useState('Quorum verified; savings collected; peer loans reviewed.')
  const [attendance, setAttendance] = useState({})

  // Thrift deposit form
  const [payMonth, setPayMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [payAmount, setPayAmount] = useState(500)
  const [paySource, setPaySource] = useState('wallet')

  // Internal loan modal
  const [showInterLoanModal, setShowInterLoanModal] = useState(false)
  const [interLoanForm, setInterLoanForm] = useState({
    amount: 5000,
    tenure_months: 6,
    purpose: 'Emergency Medical & Crop Input',
  })

  // Repay modal
  const [repayModalLoan, setRepayModalLoan] = useState(null)
  const [repayAmount, setRepayAmount] = useState('')

  const summary = useLoad(
    () => (user.shg_id ? api('/shgs/' + user.shg_id + '/summary') : Promise.resolve(null)),
    [user.shg_id]
  )

  const meetings = useLoad(
    () => (user.shg_id ? api('/shgs/' + user.shg_id + '/meetings') : Promise.resolve([])),
    [user.shg_id]
  )

  const thrift = useLoad(
    () => (user.shg_id ? api('/shgs/' + user.shg_id + '/thrift') : Promise.resolve([])),
    [user.shg_id]
  )

  const internalLoans = useLoad(
    () => (user.shg_id ? api('/shgs/' + user.shg_id + '/internal-loans') : Promise.resolve([])),
    [user.shg_id]
  )

  const invites = useLoad(
    () => (!user.shg_id ? api('/shgs/invites/my') : Promise.resolve([])),
    [user.shg_id]
  )

  const run = async (fn, ok) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await fn()
      setMsg({ kind: 'success', text: ok })
      toast.success(ok)
    } catch (x) {
      setMsg({ kind: 'error', text: x.message })
      toast.error(x.message)
    }
  }

  const create = (e) => {
    e.preventDefault()
    run(async () => {
      await api('/shgs', {
        method: 'POST',
        body: { name, village, monthly_thrift_amount: Number(thriftAmt) || 500 },
      })
      await refresh()
    }, 'Self-Help Group successfully registered.')
  }

  const respondInvite = async (invId, accept) => {
    run(async () => {
      await api('/shgs/invites/' + invId + '/respond', {
        method: 'POST',
        body: { accept },
      })
      await refresh()
    }, accept ? 'SHG membership invitation accepted!' : 'Invitation declined.')
  }

  const addMember = (e) => {
    e.preventDefault()
    run(async () => {
      await api('/shgs/' + user.shg_id + '/members', { method: 'POST', body: { email } })
      setEmail('')
      summary.reload()
    }, 'Member successfully enrolled into group.')
  }

  const handleRecordMeeting = async (e) => {
    e.preventDefault()
    const membersList = summary.data?.members || []
    const attendeeIds = membersList.filter((m) => attendance[m.id] !== false).map((m) => m.id)
    run(async () => {
      await api('/shgs/' + user.shg_id + '/meetings', {
        method: 'POST',
        body: {
          meeting_date: meetingDate,
          agenda: meetingAgenda,
          minutes: meetingMinutes,
          attendee_ids: attendeeIds,
        },
      })
      meetings.reload()
    }, 'Assembly attendance and resolutions recorded in register.')
  }

  const handlePayThrift = async (e) => {
    e.preventDefault()
    const amt = Number(payAmount)
    if (!amt || amt <= 0) return
    run(async () => {
      await api('/shgs/' + user.shg_id + '/thrift', {
        method: 'POST',
        body: {
          month_year: payMonth,
          amount: amt,
          source: paySource,
        },
      })
      thrift.reload()
      summary.reload()
      await refresh()
    }, `Monthly thrift contribution of ${money(amt)} recorded.`)
  }

  const handleRequestInternalLoan = async (e) => {
    e.preventDefault()
    const amt = Number(interLoanForm.amount)
    if (!amt || amt <= 0) return
    run(async () => {
      await api('/shgs/' + user.shg_id + '/internal-loans', {
        method: 'POST',
        body: {
          amount: amt,
          tenure_months: Number(interLoanForm.tenure_months) || 6,
          purpose: interLoanForm.purpose,
        },
      })
      setShowInterLoanModal(false)
      internalLoans.reload()
      summary.reload()
    }, `Internal loan request for ${money(amt)} submitted to group.`)
  }

  const handleDecideInternalLoan = async (loanId, approve) => {
    const note = approve ? 'Approved by SHG consensus' : window.prompt('Enter rejection reason:') || 'Declined'
    run(async () => {
      await api('/shgs/' + user.shg_id + '/internal-loans/' + loanId + '/decide', {
        method: 'POST',
        body: { approve, note },
      })
      internalLoans.reload()
      summary.reload()
      await refresh()
    }, approve ? 'Internal loan sanctioned and disbursed from corpus.' : 'Loan request rejected.')
  }

  const handleRepayInternalLoan = async (e) => {
    e.preventDefault()
    if (!repayModalLoan) return
    const amt = Number(repayAmount)
    if (!amt || amt <= 0) return
    run(async () => {
      await api('/shgs/' + user.shg_id + '/internal-loans/' + repayModalLoan.id + '/repay', {
        method: 'POST',
        body: { amount: amt },
      })
      setRepayModalLoan(null)
      setRepayAmount('')
      internalLoans.reload()
      summary.reload()
      await refresh()
    }, `Repayment of ${money(amt)} credited back to SHG corpus.`)
  }

  const handleLeaveSHG = async () => {
    if (!window.confirm('Are you sure you want to depart from this Self-Help Group?')) return
    run(async () => {
      await api('/shgs/' + user.shg_id + '/leave', { method: 'POST' })
      await refresh()
    }, 'Successfully departed the SHG.')
  }

  const membersList = summary.data?.members || []
  const presentCount = membersList.filter((m) => attendance[m.id] !== false).length
  const quorumPct = membersList.length > 0 ? Math.round((presentCount / membersList.length) * 100) : 100
  const corpus = summary.data?.corpus_balance || 0
  const isLeader = user.role === 'shg_leader' || user.role === 'admin' || (summary.data?.leader_id === user.id)

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('shg')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            NABARD SHG-Bank Linkage Program, Joint Liability Group Governance & Micro-Savings Pool
          </p>
        </div>
        {user.shg_id && (
          <button type="button" className="btn small ghost danger" onClick={handleLeaveSHG}>
            Leave SHG
          </button>
        )}
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      {!user.shg_id ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {invites.data && invites.data.length > 0 && (
            <Card title="Pending Membership Invitations">
              <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                You have received invitations to join the following Self-Help Groups:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {invites.data.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--slate-50, #f8fafc)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{inv.shg_name}</div>
                      <div className="muted small">{inv.village ? `Village: ${inv.village}` : 'Village community'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn small emerald" onClick={() => respondInvite(inv.id, true)}>
                        Accept
                      </button>
                      <button className="btn small ghost danger" onClick={() => respondInvite(inv.id, false)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
              <Field label="Standard Monthly Thrift per Member (Rs)">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={thriftAmt}
                  onChange={(e) => setThriftAmt(e.target.value)}
                />
              </Field>
              <button className="btn" style={{ marginTop: '0.5rem' }}>
                <IconUsers size={16} /> Register SHG
              </button>
            </form>
          </Card>
        </div>
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
              <span className="muted small">Monthly Thrift Rate</span>
              <div style={{ fontWeight: 700, color: 'var(--emerald-action)' }}>
                {money(summary.data.monthly_thrift_amount || 500)} / member
              </div>
            </div>
          </div>

          <div className="grid" style={{ marginBottom: '1.25rem' }}>
            <Stat label="Total Group Members" value={summary.data.members.length} sub="Joint liability roll" />
            <Stat label="Group Common Pool" value={money(corpus)} sub="Accumulated savings corpus" />
            <Stat label={t('outstanding')} value={money(summary.data.outstanding)} sub="Active bank linkage" />
            <Stat
              label="Overdue Instalments"
              value={summary.data.overdue_installments}
              sub={summary.data.overdue_installments === 0 ? 'Zero delinquency' : 'Attention required'}
            />
          </div>

          <div className="two-col" style={{ marginBottom: '1.25rem' }}>
            {/* 1. Monthly Assembly & Statutory Attendance */}
            <Card title="Monthly Assembly & Attendance Roll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.85rem' }}>
                <div className="row between small">
                  <div>
                    <span className="muted">Quorum Status:</span>{' '}
                    <b>{quorumPct}% ({presentCount}/{membersList.length})</b>
                  </div>
                  <Badge tone={quorumPct >= 50 ? 'approved' : 'pending'}>
                    {quorumPct >= 50 ? 'Quorum Met (≥50%)' : 'Quorum Not Met (<50%)'}
                  </Badge>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.85rem' }}>
                <div style={{ background: 'var(--slate-50)', padding: '0.45rem 0.65rem', fontWeight: 600, fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Member Roll</span>
                  <span>Present: {presentCount} of {membersList.length}</span>
                </div>
                {membersList.map((m) => {
                  const isPresent = attendance[m.id] !== false
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '0.45rem 0.65rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-color)',
                        background: isPresent ? '#ffffff' : '#fef2f2',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{m.name}</span>
                      <button
                        type="button"
                        className={`btn small ${isPresent ? 'emerald' : 'ghost'}`}
                        style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                        onClick={() => setAttendance({ ...attendance, [m.id]: !isPresent })}
                      >
                        {isPresent ? '✓ Present' : '✕ Absent'}
                      </button>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={handleRecordMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className="row" style={{ gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <span className="small muted">Meeting Date</span>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <span className="small muted">Agenda</span>
                    <input
                      value={meetingAgenda}
                      onChange={(e) => setMeetingAgenda(e.target.value)}
                      placeholder="Meeting agenda"
                      required
                    />
                  </div>
                </div>
                <div>
                  <span className="small muted">Meeting Minutes / Decisions</span>
                  <input
                    value={meetingMinutes}
                    onChange={(e) => setMeetingMinutes(e.target.value)}
                    placeholder="Brief notes of resolutions"
                  />
                </div>
                <button type="submit" className="btn small ghost w-100" style={{ marginTop: '0.3rem' }}>
                  Log Statutory Assembly in Register
                </button>
              </form>

              {meetings.data && meetings.data.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.4rem' }}>Recent Assemblies Log</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '160px', overflowY: 'auto' }}>
                    {meetings.data.slice(0, 5).map((mt) => (
                      <div key={mt.id} className="small" style={{ padding: '0.4rem 0.6rem', background: '#f9fafb', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <div className="row between">
                          <b>{mt.meeting_date}</b>
                          <Badge tone={mt.quorum_met ? 'approved' : 'pending'}>{mt.quorum_pct}% Quorum</Badge>
                        </div>
                        <div className="muted" style={{ marginTop: '0.2rem' }}>{mt.agenda}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* 2. Monthly Thrift Contribution & Member Enrollment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Card title="Monthly Thrift Deposit">
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  Members contribute regular thrift savings into the SHG common corpus to build group creditworthiness and fund peer emergency loans.
                </p>
                <form onSubmit={handlePayThrift} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="row" style={{ gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <span className="small muted">Month (YYYY-MM)</span>
                      <input
                        type="month"
                        value={payMonth}
                        onChange={(e) => setPayMonth(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span className="small muted">Thrift Amount (Rs)</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row between" style={{ alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={paySource === 'wallet'}
                        onChange={() => setPaySource('wallet')}
                      />
                      Deduct from Wallet ({money(user.savings_balance)})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={paySource === 'external_upi'}
                        onChange={() => setPaySource('external_upi')}
                      />
                      Direct UPI / Cash
                    </label>
                  </div>
                  <button type="submit" className="btn small emerald" style={{ marginTop: '0.3rem' }}>
                    Deposit {money(payAmount)} to Common Corpus
                  </button>
                </form>

                {thrift.data && thrift.data.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.4rem' }}>Recent Thrift Contributions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto' }}>
                      {thrift.data.slice(0, 5).map((tItem) => (
                        <div key={tItem.id} className="small row between" style={{ padding: '0.3rem 0.5rem', background: '#f9fafb', borderRadius: '4px' }}>
                          <span><b>{tItem.member_name}</b> ({tItem.month_year})</span>
                          <span style={{ fontWeight: 600, color: '#059669' }}>+{money(tItem.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card title="Enroll SHG Member">
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  Borrowers must have an active FinanceSaathi account to be inducted into your group roster.
                </p>
                <form onSubmit={addMember} className="row" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
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

                <div style={{ background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Joint Liability Terms:</span>
                  <p className="muted small" style={{ margin: '0.2rem 0 0 0', fontSize: '0.74rem' }}>
                    All members mutually guarantee loans extended to the group under NABARD SHG-Bank Linkage guidelines.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* 3. Inter-Lending Common Corpus Card */}
          <Card title="SHG Internal Lending Common Corpus" style={{ marginBottom: '1.25rem' }}>
            <div className="row between" style={{ alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span className="muted small">Accumulated Group Common Fund:</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  {money(corpus)}
                </div>
                <span className="muted small">Liquid micro-reserves available for peer emergency inter-lending</span>
              </div>
              <button
                type="button"
                className="btn small emerald"
                onClick={() => setShowInterLoanModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPlus size={14} /> Request Peer Emergency Loan
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Loan Ref</th>
                    <th>Borrower Member</th>
                    <th>Sanction Amount</th>
                    <th>Tenure</th>
                    <th>Emergency Purpose</th>
                    <th>Repaid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(internalLoans.data || []).map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>#{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.borrower_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--emerald-700)' }}>{money(l.amount)}</td>
                      <td>{l.tenure_months} mo</td>
                      <td className="small">{l.purpose}</td>
                      <td>{money(l.repaid_amount || 0)}</td>
                      <td>
                        <Badge tone={l.status === 'active' ? 'approved' : l.status === 'closed' ? 'approved' : l.status === 'rejected' ? 'danger' : 'pending'}>
                          {l.status}
                        </Badge>
                      </td>
                      <td>
                        {l.status === 'requested' && isLeader && l.borrower_id !== user.id && (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button
                              type="button"
                              className="btn small emerald"
                              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                              onClick={() => handleDecideInternalLoan(l.id, true)}
                            >
                              Sanction
                            </button>
                            <button
                              type="button"
                              className="btn small ghost danger"
                              style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                              onClick={() => handleDecideInternalLoan(l.id, false)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {l.status === 'active' && (user.id === l.borrower_id || isLeader) && (
                          <button
                            type="button"
                            className="btn small ghost"
                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                            onClick={() => {
                              setRepayModalLoan(l)
                              setRepayAmount(Math.max(0, l.amount - (l.repaid_amount || 0)))
                            }}
                          >
                            Repay
                          </button>
                        )}
                        {l.status === 'closed' && <span className="small muted">Fully Settled</span>}
                      </td>
                    </tr>
                  ))}
                  {(internalLoans.data || []).length === 0 && (
                    <tr>
                      <td colSpan="8" className="muted" style={{ textAlign: 'center', padding: '1rem' }}>
                        No internal peer loans requested yet. Members can tap into the common corpus for urgent needs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 4. Roster Table */}
          <Card title="SHG Member Roster & Contribution Ledger">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Full Name</th>
                    <th>Designation</th>
                    <th>Individual Savings Balance</th>
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
                      <td>{money(m.savings || 0)}</td>
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

          {/* Inter-Lending Modal */}
          {showInterLoanModal && (
            <div className="modal-overlay" onClick={() => setShowInterLoanModal(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                <div className="modal-header">
                  <h3>Request Peer Emergency Loan</h3>
                  <button className="icon-btn" onClick={() => setShowInterLoanModal(false)}>✕</button>
                </div>
                <p className="muted small" style={{ marginBottom: '1rem' }}>
                  Emergency internal loan from {summary.data.name} Common Savings Pool (Balance: {money(corpus)}).
                </p>

                <form onSubmit={handleRequestInternalLoan}>
                  <div className="field">
                    <span>Borrower</span>
                    <input disabled value={user.name} />
                  </div>

                  <div className="field">
                    <span>Requested Amount (Rs)</span>
                    <input
                      type="number"
                      min="500"
                      max={corpus > 0 ? corpus : 500}
                      step="100"
                      required
                      value={interLoanForm.amount}
                      onChange={(e) => setInterLoanForm({ ...interLoanForm, amount: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <span>Tenure (Months)</span>
                    <select
                      value={interLoanForm.tenure_months}
                      onChange={(e) => setInterLoanForm({ ...interLoanForm, tenure_months: Number(e.target.value) })}
                    >
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>

                  <div className="field">
                    <span>Emergency Purpose</span>
                    <input
                      required
                      placeholder="e.g. Seed purchase, hospital visit"
                      value={interLoanForm.purpose}
                      onChange={(e) => setInterLoanForm({ ...interLoanForm, purpose: e.target.value })}
                    />
                  </div>

                  <div style={{ background: '#ecfdf5', padding: '0.65rem', borderRadius: '6px', fontSize: '0.74rem', color: '#047857', marginBottom: '1rem' }}>
                    ✓ 1% concessional interest per month credited directly back into the SHG common pool upon repayment.
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn ghost" onClick={() => setShowInterLoanModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn">
                      Submit Loan Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Repay Modal */}
          {repayModalLoan && (
            <div className="modal-overlay" onClick={() => setRepayModalLoan(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                  <h3>Repay Internal Loan #{repayModalLoan.id}</h3>
                  <button className="icon-btn" onClick={() => setRepayModalLoan(null)}>✕</button>
                </div>
                <form onSubmit={handleRepayInternalLoan}>
                  <div className="field">
                    <span>Repayment Amount (Rs)</span>
                    <input
                      type="number"
                      min="100"
                      max={Math.max(0, repayModalLoan.amount - (repayModalLoan.repaid_amount || 0))}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      required
                    />
                  </div>
                  <p className="muted small" style={{ marginBottom: '1rem' }}>
                    Deducts from your wallet and credits the collective SHG savings corpus.
                  </p>
                  <div className="modal-actions">
                    <button type="button" className="btn ghost" onClick={() => setRepayModalLoan(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn emerald">
                      Confirm Repayment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

