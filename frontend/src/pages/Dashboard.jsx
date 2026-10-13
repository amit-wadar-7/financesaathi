import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, Progress, Stat, useLoad, useToast, CibilSpeedometer, CashflowBarChart } from '../ui'
import {
  IconInfo,
  IconCalendar,
  IconCreditCard,
  IconTrendingUp,
  IconEye,
  IconEyeOff,
  IconCoins,
  IconCart,
  IconAcademic,
  IconTractor,
  IconHospital,
  IconTarget,
  IconShield,
  IconUsers,
  IconBot,
  IconLock,
  IconPrinter,
  IconCheckCircle,
  IconPlus,
  IconArrowRight,
  IconCalculator,
  IconLandmark,
  IconAward,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconFileText,
  IconPiggyBank,
} from '../icons'

/* =========================================================================
   1. ADMIN DASHBOARD WORKSPACE
   ========================================================================= */
function AdminDashboardView({ data, reload }) {
  const toast = useToast()
  const users = useLoad(() => api('/admin/users'))
  const audit = useLoad(() => api('/admin/audit?limit=15'))
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [runningReminders, setRunningReminders] = useState(false)
  const [searchUser, setSearchUser] = useState('')

  const handleSetRole = async (userId, newRole) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await api(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role: newRole } })
      const text = `User #${userId} role successfully changed to ${newRole.toUpperCase()}.`
      setMsg({ kind: 'success', text })
      toast.success(text)
      users.reload()
      audit.reload()
    } catch (err) {
      setMsg({ kind: 'error', text: err.message })
      toast.error(err.message)
    }
  }

  const handleRunReminders = async () => {
    setRunningReminders(true)
    setMsg({ kind: 'error', text: '' })
    try {
      const res = await api('/admin/run-reminders', { method: 'POST' })
      const text = `Automated engine dispatched ${res.created} upcoming installment notification(s).`
      setMsg({ kind: 'success', text })
      toast.success(text)
      audit.reload()
      reload()
    } catch (err) {
      setMsg({ kind: 'error', text: err.message })
      toast.error(err.message)
    } finally {
      setRunningReminders(false)
    }
  }

  const userList = (users.data || []).filter((u) => {
    if (!searchUser.trim()) return true
    const q = searchUser.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q)
  })

  const auditEvents = audit.data || []
  const loansByStatus = data?.loans_by_status || {}

  return (
    <div className="page-container">
      {/* Admin Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge approved" style={{ fontWeight: 700 }}>SYSTEM ADMINISTRATOR CONSOLE</span>
          </div>
          <h2>Enterprise Operations & Governance Hub</h2>
          <p className="page-subtitle">
            Centralized platform oversight, user role-based access control, statutory audit trails, and automated batch cron engines
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn"
            onClick={handleRunReminders}
            disabled={runningReminders}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconClock size={16} /> {runningReminders ? 'Dispatching Reminders…' : 'Run EMI Reminders Cron'}
          </button>
        </div>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      {/* Admin Platform KPIs */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label="Total Registered Users"
          value={data?.total_users || users.data?.length || 0}
          sub="Platform user directory"
        />
        <Stat
          label="Pending Underwriting"
          value={data?.pending_review || loansByStatus.pending || 0}
          sub="Awaiting officer decision"
        />
        <Stat
          label="Active Performing Loans"
          value={loansByStatus.approved || 0}
          sub="Capital disbursed & performing"
        />
        <Stat
          label="Overdue Delinquencies"
          value={data?.overdue_loans || 0}
          sub="Requires early warning action"
        />
      </div>

      <div className="two-col" style={{ alignItems: 'start', marginBottom: '1.25rem' }}>
        {/* User Directory & Role Assignment */}
        <div className="card">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>User Directory & Privilege Management</h3>
              <span className="muted small">Promote or assign permissions across roles</span>
            </div>
            <input
              placeholder="Search user name, email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              style={{ width: '200px', fontSize: '0.82rem', padding: '5px 8px' }}
            />
          </div>

          {users.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Assigned Role</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>#{u.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{u.name}</div>
                        <span className="muted small">{u.phone || 'No phone'}</span>
                      </td>
                      <td className="small">{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleSetRole(u.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            borderRadius: '4px',
                            background: u.role === 'admin' ? '#f1f5f9' : u.role === 'officer' ? '#eff6ff' : '#ffffff',
                          }}
                        >
                          <option value="user">USER (Borrower)</option>
                          <option value="officer">OFFICER (Credit Underwriter)</option>
                          <option value="shg_leader">SHG_LEADER (Group Head)</option>
                          <option value="admin">ADMIN (Superuser)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {userList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        No users matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Trail & Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Immutable Statutory Audit Log</h3>
                <span className="muted small">Real-time DPDP Act 2023 compliance record</span>
              </div>
              <button type="button" className="btn small ghost" onClick={() => audit.reload()}>
                Refresh
              </button>
            </div>

            {audit.loading ? (
              <Loading />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Operation Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEvents.slice(0, 8).map((ev) => (
                      <tr key={ev.id}>
                        <td style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                          {new Date(ev.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className="badge neutral" style={{ fontSize: '0.7rem' }}>{ev.action}</span>
                        </td>
                        <td className="small">
                          {ev.entity} #{ev.entity_id}
                        </td>
                        <td className="small muted" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.detail || '-'}
                        </td>
                      </tr>
                    ))}
                    {auditEvents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                          No audit events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Admin Actions Card */}
          <div className="card">
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Superuser Operations</h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/loans" className="btn small ghost">
                Review All Loans ({loansByStatus.pending || 0} Pending)
              </Link>
              <Link to="/at-risk" className="btn small ghost">
                At-Risk Delinquency Radar
              </Link>
              <Link to="/schemes" className="btn small ghost">
                Government Welfare Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   2. LOAN OFFICER DASHBOARD WORKSPACE
   ========================================================================= */
function OfficerDashboardView({ data, reload }) {
  const pendingLoans = useLoad(() => api('/loans?status=pending'))
  const atRisk = useLoad(() => api('/officer/at-risk'))

  const pendingList = pendingLoans.data || []
  const atRiskList = atRisk.data || []

  return (
    <div className="page-container">
      {/* Officer Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge pending" style={{ fontWeight: 700 }}>CREDIT UNDERWRITING TERMINAL</span>
          </div>
          <h2>Loan Officer Sanction & Risk Workbench</h2>
          <p className="page-subtitle">
            Statutory credit appraisal, AI affordability evaluation, KYC authentication, and Portfolio-at-Risk (PAR) mitigation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link
            to="/loans"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconCreditCard size={16} /> All Loan Files ({pendingList.length})
          </Link>
        </div>
      </div>

      {/* Officer KPIs */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label="Underwriting Queue"
          value={pendingList.length}
          sub="Awaiting sanction decision"
        />
        <Stat
          label="Approved Active Loans"
          value={data?.loans_by_status?.approved || 0}
          sub="Performing assets"
        />
        <Stat
          label="Overdue Delinquencies"
          value={data?.overdue_loans || 0}
          sub="Requires borrower contact"
        />
        <Stat
          label="At-Risk Credit Flagged"
          value={atRiskList.length}
          sub="Early warning triggers"
        />
      </div>

      <div className="two-col" style={{ alignItems: 'start', marginBottom: '1.25rem' }}>
        {/* Pending Applications Queue */}
        <div className="card">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Pending Applications Awaiting Sanction</h3>
              <span className="muted small">Review AI scores, authenticate KYC documents, and approve</span>
            </div>
            <span className="badge pending">{pendingList.length} In Queue</span>
          </div>

          {pendingLoans.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Borrower</th>
                    <th>Principal</th>
                    <th>AI Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((ln) => (
                    <tr key={ln.id}>
                      <td style={{ fontWeight: 600 }}>#{ln.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{ln.borrower_name}</div>
                        <span className="muted small">{ln.purpose || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{money(ln.amount)}</td>
                      <td>
                        <Badge tone={ln.ai_band}>{ln.ai_score ? `${ln.ai_score}/100` : ln.ai_band}</Badge>
                      </td>
                      <td>
                        <Link to={`/loans/${ln.id}`} className="btn small">
                          Sanction Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pendingList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
                        Underwriting queue clear! Zero pending applications awaiting review.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Early Warning Risk Radar */}
        <div className="card">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Portfolio at Risk (PAR) Early Warning</h3>
              <span className="muted small">Automated ML delinquency detection</span>
            </div>
            <Link to="/at-risk" className="small" style={{ fontWeight: 600 }}>
              Full Risk Radar →
            </Link>
          </div>

          {atRisk.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Borrower</th>
                    <th>Overdue Count</th>
                    <th>Risk Rationale</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskList.slice(0, 6).map((item) => (
                    <tr key={item.loan_id}>
                      <td>
                        <Link to={`/loans/${item.loan_id}`} style={{ fontWeight: 600 }}>
                          #{item.loan_id}
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.borrower}</td>
                      <td>
                        <Badge tone="overdue">{item.overdue} Overdue</Badge>
                      </td>
                      <td className="small" style={{ color: 'var(--rose-600)' }}>
                        {item.reasons.join(', ')}
                      </td>
                      <td>
                        <Link to={`/loans/${item.loan_id}`} className="btn small ghost">
                          Dossier
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {atRiskList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
                        Zero accounts flagged for delinquency risk.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   3. SHG LEADER DASHBOARD WORKSPACE
   ========================================================================= */
function SHGLeaderDashboardView({ user, refresh }) {
  const toast = useToast()
  const [shgSummaryData, setShgSummaryData] = useState(null)
  const [loadingShg, setLoadingShg] = useState(true)
  const [showCreateShg, setShowCreateShg] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [shgNameInput, setShgNameInput] = useState('')
  const [shgVillageInput, setShgVillageInput] = useState('')
  const [memberEmailInput, setMemberEmailInput] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const loadShg = async () => {
    setLoadingShg(true)
    try {
      if (user?.shg_id) {
        const s = await api(`/shgs/${user.shg_id}/summary`)
        setShgSummaryData(s)
      } else {
        setShgSummaryData(null)
      }
    } catch {
      setShgSummaryData(null)
    } finally {
      setLoadingShg(false)
    }
  }

  useEffect(() => {
    loadShg()
  }, [user])

  const handleCreateSHG = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    try {
      const created = await api('/shgs', {
        method: 'POST',
        body: { name: shgNameInput.trim(), village: shgVillageInput.trim() },
      })
      await refresh()
      setShowCreateShg(false)
      const successText = `SHG "${created.name}" established successfully!`
      setMsg(successText)
      toast.success(successText)
      loadShg()
    } catch (x) {
      setErr(x.message)
      toast.error(x.message)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!user?.shg_id || !memberEmailInput.trim()) return
    setErr('')
    setMsg('')
    try {
      await api(`/shgs/${user.shg_id}/members`, {
        method: 'POST',
        body: { email: memberEmailInput.trim() },
      })
      setMemberEmailInput('')
      setShowAddMember(false)
      const successText = 'Member enrolled into SHG group successfully!'
      setMsg(successText)
      toast.success(successText)
      loadShg()
    } catch (x) {
      setErr(x.message)
      toast.error(x.message)
    }
  }

  if (loadingShg) return <Loading />

  return (
    <div className="page-container">
      {/* SHG Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge approved" style={{ fontWeight: 700 }}>SHG LEADER FEDERATION HUB</span>
          </div>
          <h2>Self-Help Group (SHG) Governance Desk</h2>
          <p className="page-subtitle">
            Joint-liability member roll, NABARD SHG-Bank Linkage coordination, and peer-guarantee microcredit voting
          </p>
        </div>
        <div>
          {shgSummaryData ? (
            <button
              type="button"
              className="btn"
              onClick={() => setShowAddMember(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconPlus size={16} /> Enroll New Member
            </button>
          ) : (
            <button
              type="button"
              className="btn emerald"
              onClick={() => setShowCreateShg(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconPlus size={16} /> Establish SHG Group
            </button>
          )}
        </div>
      </div>

      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert kind="error">{err}</Alert>}

      {shgSummaryData ? (
        <>
          {/* Group Overview Stats */}
          <div className="grid" style={{ marginBottom: '1.25rem' }}>
            <Stat
              label="SHG Group Name"
              value={shgSummaryData.name}
              sub={`Village: ${shgSummaryData.village}`}
            />
            <Stat
              label="Enrolled Group Members"
              value={shgSummaryData.members?.length || 0}
              sub="Joint liability members"
            />
            <Stat
              label="Collective Active Loans"
              value={shgSummaryData.group_loans || 0}
              sub="Peer guaranteed facilities"
            />
            <Stat
              label="Group Outstanding Capital"
              value={money(shgSummaryData.outstanding || 0)}
              sub={`${shgSummaryData.overdue_installments || 0} Overdue instalments`}
            />
          </div>

          <div className="two-col" style={{ alignItems: 'start' }}>
            {/* Member Roster */}
            <div className="card">
              <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Registered Member Roster</h3>
                  <span className="muted small">Self-Help Group joint-liability members</span>
                </div>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => setShowAddMember(true)}
                >
                  + Add Member
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Legal Name</th>
                      <th>Affiliation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(shgSummaryData.members || []).map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>#{m.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{m.name}</td>
                        <td>
                          <span className="badge approved">Active Member</span>
                        </td>
                      </tr>
                    ))}
                    {(shgSummaryData.members || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                          No members registered yet. Click "Enroll New Member" above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Group Linkage Guidelines Card */}
            <div className="card">
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>NABARD SHG-Bank Linkage Scheme Standards</h3>
              <p className="muted small" style={{ marginBottom: '1rem' }}>
                Under Reserve Bank of India & NABARD guidelines, active SHGs must observe the <b>Panchasutra</b> code of governance:
              </p>
              <ul className="factors-list" style={{ paddingLeft: '1rem', fontSize: '0.82rem' }}>
                <li><b>1. Regular Weekly / Monthly Meetings:</b> Maintain quorum and recorded meeting minutes.</li>
                <li><b>2. Mandatory Group Savings:</b> Deposit common thrift funds prior to external borrowing.</li>
                <li><b>3. Internal Lending:</b> Prioritize member emergency funds and health reserves.</li>
                <li><b>4. Timely Loan Repayments:</b> Ensure 100% on-time repayment to unlock 1.5% interest rebates.</li>
                <li><b>5. Transparent Books of Accounts:</b> Up-to-date member passbooks and digital ledgers.</li>
              </ul>
              <div style={{ marginTop: '1.25rem' }}>
                <Link to="/loans" className="btn small">
                  View Joint Liability Loan Proposals →
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <div style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--emerald-50)', color: 'var(--emerald-600)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1rem' }}>
              <IconUsers size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Establish Your Self-Help Group (SHG)</h3>
            <p className="muted small" style={{ marginBottom: '1.25rem' }}>
              As a designated SHG Leader, register your group name and village to enroll members, coordinate joint-liability loans, and access subsidized bank credit.
            </p>
            <button className="btn" onClick={() => setShowCreateShg(true)}>
              Register Self-Help Group Now
            </button>
          </div>
        </div>
      )}

      {/* Create SHG Modal */}
      {showCreateShg && (
        <div className="modal-overlay" onClick={() => setShowCreateShg(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Self-Help Group (SHG)</h3>
              <button className="icon-btn" onClick={() => setShowCreateShg(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSHG}>
              <div className="field">
                <span>SHG Group Name</span>
                <input
                  required
                  value={shgNameInput}
                  onChange={(e) => setShgNameInput(e.target.value)}
                  placeholder="e.g. Mahila Bachat Gat"
                />
              </div>
              <div className="field">
                <span>Village / Gram Panchayat / Ward</span>
                <input
                  required
                  value={shgVillageInput}
                  onChange={(e) => setShgVillageInput(e.target.value)}
                  placeholder="e.g. Ward 4, Solan"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCreateShg(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Establish Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enroll Member into {shgSummaryData?.name}</h3>
              <button className="icon-btn" onClick={() => setShowAddMember(false)}>✕</button>
            </div>
            <p className="muted small">
              The member must be registered with an account email on the platform first.
            </p>
            <form onSubmit={handleAddMember}>
              <div className="field">
                <span>Member Email Address</span>
                <input
                  type="email"
                  required
                  value={memberEmailInput}
                  onChange={(e) => setMemberEmailInput(e.target.value)}
                  placeholder="e.g. member@example.com"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowAddMember(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Enroll Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================================
   4. BORROWER / MEMBER DASHBOARD WORKSPACE
   ========================================================================= */
function BorrowerDashboardView({ data, user, refresh, reload }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { t, lang } = useLang()

  // Balance visibility toggle
  const [hideBalance, setHideBalance] = useState(false)

  // Interactive Modal Visibility
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)

  // Modal form states
  const [busyAction, setBusyAction] = useState(false)
  const [incomeAmt, setIncomeAmt] = useState('')
  const [incomeTitle, setIncomeTitle] = useState('')
  const [incomeCat, setIncomeCat] = useState('milk_sales')
  const [incomeMode, setIncomeMode] = useState('UPI')

  const [expenseAmt, setExpenseAmt] = useState('')
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseCat, setExpenseCat] = useState('groceries')
  const [expenseMode, setExpenseMode] = useState('UPI')

  const [transferAmt, setTransferAmt] = useState('')
  const [transferGoalId, setTransferGoalId] = useState('')
  const [transferNote, setTransferNote] = useState('')

  const [goalDepositAmt, setGoalDepositAmt] = useState(500)

  // Repayment UPI State
  const [selectedRepayment, setSelectedRepayment] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState('upi_qr') // 'upi_qr' | 'wallet'
  const [utrNumber, setUtrNumber] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [paySuccess, setPaySuccess] = useState(false)

  useEffect(() => {
    if (!selectedRepayment || !payAmount) {
      setQrDataUrl('')
      return
    }
    const note = selectedRepayment.loan_id
      ? `Loan #${selectedRepayment.loan_id} Inst #${selectedRepayment.number}`
      : selectedRepayment.title || 'SHG Repayment'
    const upiUri = `upi://pay?pa=financesaathi@bank&pn=FinanceSaathi&am=${encodeURIComponent(payAmount)}&cu=INR&tn=${encodeURIComponent(note)}`
    QRCode.toDataURL(upiUri, { width: 180, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''))
  }, [selectedRepayment, payAmount])

  // Hovered state for 6-month chart bar
  const [hoveredMonth, setHoveredMonth] = useState(null)

  // User-specific data mapping
  const userName = user?.name || data?.name || 'Member'
  const shgName = data?.shg?.name || (user?.shg_id ? `SHG Group #${user.shg_id}` : '')
  const availableBalance = data?.savings_balance ?? (user?.savings_balance || 0)

  const topGoal = data?.top_goal || (data?.goals && data.goals[0]) || null
  const goalsList = data?.goals || (topGoal ? [topGoal] : [])

  const healthScore = data?.health_score ?? (data?.ai_health_score ?? null)
  const transactions = data?.transactions || []
  const recentNet = transactions.slice(0, 5).reduce((acc, tx) => {
    return acc + (tx.is_credit ? Number(tx.amount || 0) : -Number(tx.amount || 0))
  }, 0)
  const upcomingRepayments = data?.upcoming_repayments || []
  const monthlyIncome = data?.monthly_income || user?.monthly_income || 0
  const monthlyExpenses = data?.monthly_expenses || user?.monthly_expenses || 0

  const cashflowHistory = data?.cashflow_history || []
  const kpiData = data?.kpi_metrics || {
    income_this_month: 0,
    income_delta: '',
    expenses_this_month: 0,
    expenses_delta: '',
    savings_this_month: 0,
    savings_delta: '',
  }
  const seasonalTip = data?.seasonal_tip || null

  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Max value for 6-month chart scaling
  const maxCashflow = Math.max(...cashflowHistory.map((c) => Math.max(c.income || 0, c.expenses || 0)), 20000)

  // 1. Handlers for Live Financial Operations
  const handleAddIncome = async (e) => {
    e.preventDefault()
    const amt = Number(incomeAmt)
    if (!amt || amt <= 0) return
    setBusyAction(true)
    try {
      await api('/money/income', {
        method: 'POST',
        body: {
          amount: amt,
          title: incomeTitle || 'Agricultural / Household Income',
          category: incomeCat,
          mode: incomeMode,
        },
      })
      await refresh()
      await reload()
      setShowIncomeModal(false)
      setIncomeAmt('')
      setIncomeTitle('')
      toast.success(lang === 'mr' ? `₹${amt.toLocaleString()} शिल्लकमध्ये जमा झाले!` : `₹${amt.toLocaleString()} added to Available Balance!`)
    } catch (err) {
      toast.error(err.message || 'Failed to add income')
    } finally {
      setBusyAction(false)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    const amt = Number(expenseAmt)
    if (!amt || amt <= 0) return
    setBusyAction(true)
    try {
      await api('/money/expense', {
        method: 'POST',
        body: {
          amount: amt,
          title: expenseTitle || 'Household / Farm Expense',
          category: expenseCat,
          mode: expenseMode,
        },
      })
      await refresh()
      await reload()
      setShowExpenseModal(false)
      setExpenseAmt('')
      setExpenseTitle('')
      toast.success(lang === 'mr' ? `₹${amt.toLocaleString()} खर्च नोंदवला गेला!` : `₹${amt.toLocaleString()} recorded as expense!`)
    } catch (err) {
      toast.error(err.message || 'Failed to record expense')
    } finally {
      setBusyAction(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    const amt = Number(transferAmt)
    const targetId = Number(transferGoalId || topGoal?.id)
    if (!amt || amt <= 0 || !targetId) return
    setBusyAction(true)
    try {
      await api('/money/transfer', {
        method: 'POST',
        body: {
          target_goal_id: targetId,
          amount: amt,
          note: transferNote,
        },
      })
      await refresh()
      await reload()
      setShowTransferModal(false)
      setTransferAmt('')
      setTransferNote('')
      toast.success(lang === 'mr' ? `₹${amt.toLocaleString()} बचत ध्येयात जमा झाले!` : `₹${amt.toLocaleString()} transferred to savings goal!`)
    } catch (err) {
      toast.error(err.message || 'Transfer failed')
    } finally {
      setBusyAction(false)
    }
  }

  const handleGoalDepositQuick = async (amt) => {
    if (!topGoal?.id) return
    setBusyAction(true)
    try {
      await api(`/savings/goals/${topGoal.id}/deposit`, {
        method: 'POST',
        body: { amount: Number(amt) },
      })
      await refresh()
      await reload()
      toast.success(lang === 'mr' ? `₹${amt} ध्येयात जमा झाले!` : `₹${amt} deposited to ${topGoal?.title || 'Savings Goal'}!`)
    } catch (err) {
      toast.error(err.message || 'Deposit failed')
    } finally {
      setBusyAction(false)
    }
  }

  const handleCustomGoalDeposit = async (e) => {
    e.preventDefault()
    if (!topGoal?.id) return
    const amt = Number(goalDepositAmt)
    if (!amt || amt <= 0) return
    setBusyAction(true)
    try {
      await api(`/savings/goals/${topGoal.id}/deposit`, {
        method: 'POST',
        body: { amount: amt },
      })
      await refresh()
      await reload()
      setShowDepositModal(false)
      toast.success(lang === 'mr' ? `₹${amt} ध्येयात जमा झाले!` : `₹${amt} deposited to ${topGoal?.title || 'Savings Goal'}!`)
    } catch (err) {
      toast.error(err.message || 'Deposit failed')
    } finally {
      setBusyAction(false)
    }
  }

  const openRepayModal = (rep) => {
    setSelectedRepayment(rep)
    setPayAmount(String(rep.amount))
    setPayMode('upi_qr')
    setUtrNumber('')
    setShowUpiModal(true)
  }

  const handleExecuteUpiPay = async (e) => {
    e.preventDefault()
    if (!selectedRepayment) return
    setPaySuccess(true)
    try {
      if (selectedRepayment.loan_id) {
        await api(`/loans/${selectedRepayment.loan_id}/installments/${selectedRepayment.number}/pay`, {
          method: 'POST',
          body: {
            amount: Number(payAmount),
            source: payMode === 'wallet' ? 'wallet' : 'external_upi',
            reference_id: payMode === 'wallet' ? undefined : (utrNumber.trim() || `UPI-MANUAL-${Date.now()}`),
          },
        })
      } else {
        // SHG thrift deposit
        await api('/money/expense', {
          method: 'POST',
          body: {
            amount: Number(payAmount),
            title: selectedRepayment.title,
            category: 'shg_thrift',
            mode: payMode === 'wallet' ? 'Wallet Balance' : `UPI UTR (${utrNumber.trim() || 'Manual'})`,
          },
        })
      }
      await refresh()
      await reload()
      setShowUpiModal(false)
      setPaySuccess(false)
      setSelectedRepayment(null)
      setUtrNumber('')
      toast.success(
        lang === 'mr'
          ? `₹${payAmount} चे पेमेंट यशस्वी झाले!`
          : `Repayment of ₹${payAmount} settled successfully!`
      )
    } catch (err) {
      setPaySuccess(false)
      toast.error(err.message || 'Payment processing error')
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Header Row */}
      <div className="page-header-row" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Namaskar, {userName} 👋</h2>
          <p className="page-subtitle" style={{ marginTop: '2px', fontSize: '0.9rem' }}>
            Here's your financial picture for today • <span className="muted">{todayDateStr}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${user?.kyc_status === 'verified' ? 'approved' : 'pending'}`} style={{ fontWeight: 600 }}>
            {user?.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
          </span>
          {shgName && (
            <span className="badge neutral" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              {shgName}
            </span>
          )}
        </div>
      </div>

      {/* 2. Available Balance Hero Card (Media-Inspired) */}
      <div className="balance-hero-card">
        <div className="balance-hero-header">
          <div className="balance-title-wrap">
            <span>Available balance</span>
            <button
              type="button"
              className="balance-eye-btn"
              onClick={() => setHideBalance(!hideBalance)}
              title={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <IconEyeOff size={15} /> : <IconEye size={15} />}
            </button>
          </div>
          <div className="balance-trend-tag">
            <IconTrendingUp size={14} />
            <span>
              {recentNet > 0
                ? `+₹${recentNet.toLocaleString('en-IN')} net activity`
                : recentNet < 0
                ? `-₹${Math.abs(recentNet).toLocaleString('en-IN')} net outflow`
                : 'Ledger Reconciled'}
            </span>
          </div>
        </div>

        <div className="balance-amount-row">
          <div className="balance-amount-display">
            {hideBalance ? '₹••••••••' : `₹${Number(availableBalance).toLocaleString('en-IN')}`}
          </div>
          <div className="balance-sparkline-svg">
            <svg viewBox="0 0 140 40" fill="none" style={{ width: '100%', height: '100%' }}>
              <path
                d="M 5 32 Q 30 16, 55 24 T 95 14 T 135 6"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="135" cy="6" r="4.5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* 4 Interactive Buttons Row */}
        <div className="balance-actions-row">
          <button
            type="button"
            className="hero-action-btn"
            onClick={() => setShowIncomeModal(true)}
          >
            <IconPlus size={16} /> Add Income
          </button>
          <button
            type="button"
            className="hero-action-btn"
            onClick={() => setShowExpenseModal(true)}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 0.8, fontWeight: 800 }}>−</span> Add Expense
          </button>
          <button
            type="button"
            className="hero-action-btn"
            onClick={() => setShowTransferModal(true)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 0.9 }}>⇄</span> Transfer
          </button>
          <button
            type="button"
            className="hero-action-btn secondary"
            onClick={() => navigate('/transactions')}
          >
            <IconFileText size={15} /> View Statement
          </button>
        </div>
      </div>

      {/* 3. Three KPI Metric Cards Row */}
      <div className="kpi-cards-grid">
        <div className="kpi-metric-card">
          <div className="kpi-metric-title">Income this month</div>
          <div className="kpi-metric-bottom">
            <div className="kpi-metric-value">
              ₹{Number(kpiData.income_this_month).toLocaleString('en-IN')}
            </div>
            <span className="kpi-delta-tag positive">
              <IconTrendingUp size={12} /> {kpiData.income_delta}
            </span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-metric-title">Expenses</div>
          <div className="kpi-metric-bottom">
            <div className="kpi-metric-value">
              ₹{Number(kpiData.expenses_this_month).toLocaleString('en-IN')}
            </div>
            <span className="kpi-delta-tag negative">
              <span>↓</span> {kpiData.expenses_delta}
            </span>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-metric-title">Savings Surplus</div>
          <div className="kpi-metric-bottom">
            <div className="kpi-metric-value">
              ₹{Number(kpiData.savings_this_month).toLocaleString('en-IN')}
            </div>
            <span className="kpi-delta-tag positive">
              <IconTrendingUp size={12} /> {kpiData.savings_delta}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: 6-Month Income vs Expenses Grouped Bar Chart + Savings Goal & AI */}
      <div className="middle-dashboard-grid">
        {/* Left: 6-Month Income vs Expenses Bar Chart */}
        <div className="dashboard-card-box">
          <div className="chart-card-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Income vs Expenses</h3>
              <p className="muted small" style={{ marginTop: '2px' }}>Last 6 months cashflow trend</p>
            </div>
            <div className="chart-legend-row">
              <div className="legend-item">
                <span className="legend-dot income" />
                <span>Income</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot expense" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          {/* Interactive Bars Container */}
          <div className="chart-bars-container">
            {cashflowHistory.map((item) => {
              const incHeight = Math.max(15, Math.round((item.income / maxCashflow) * 140))
              const expHeight = Math.max(15, Math.round((item.expenses / maxCashflow) * 140))
              const isHovered = hoveredMonth === item.month

              return (
                <div
                  key={item.month}
                  className="bar-month-group"
                  onMouseEnter={() => setHoveredMonth(item.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  <div className="bars-pair">
                    <div
                      className="chart-bar income"
                      style={{ height: `${incHeight}px` }}
                      title={`${item.month} Income: ₹${item.income.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="chart-bar expense"
                      style={{ height: `${expHeight}px` }}
                      title={`${item.month} Expenses: ₹${item.expenses.toLocaleString('en-IN')}`}
                    />
                  </div>
                  <span className="month-label" style={{ color: isHovered ? '#059669' : undefined }}>
                    {item.month}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="chart-insight-footer">
            <span>Average monthly surplus: <b>₹{Number(kpiData.savings_this_month).toLocaleString('en-IN')}</b></span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Savings Rate: 48.3%</span>
          </div>
        </div>

        {/* Right: Stack of Savings Goal Card and Saathi AI */}
        <div className="side-cards-stack">
          {/* Savings Goal Card */}
          {topGoal ? (
            <div className="savings-goal-banner">
              <div className="goal-banner-header">
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', fontWeight: 700 }}>
                    SAVINGS GOAL
                  </span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.05rem', color: '#064e3b' }}>
                    {topGoal.title}
                  </h4>
                </div>
                <div className="goal-jar-badge" title="Target Savings Jar">
                  🌱
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.84rem' }}>
                <span>
                  <b>₹{Number(topGoal.saved_amount || 0).toLocaleString('en-IN')}</b> of ₹{Number(topGoal.target_amount || 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {Math.round(topGoal.progress_pct || ((topGoal.saved_amount || 0) / (topGoal.target_amount || 1) * 100))}%
                </span>
              </div>

              <div className="goal-progress-bar-wrap">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${Math.min(100, topGoal.progress_pct || ((topGoal.saved_amount || 0) / (topGoal.target_amount || 1) * 100))}%` }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn small"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                  onClick={() => handleGoalDepositQuick(500)}
                  disabled={busyAction}
                >
                  + Deposit ₹500
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                  onClick={() => setShowDepositModal(true)}
                >
                  Custom Deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="savings-goal-banner empty-goal-banner" style={{ background: 'var(--card-bg, #ffffff)', border: '1px dashed var(--border-color, #e2e8f0)', padding: '1.25rem', borderRadius: 'var(--radius-md, 10px)' }}>
              <div className="goal-banner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', fontWeight: 700 }}>
                    SAVINGS GOAL
                  </span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1rem', color: 'var(--slate-800)' }}>
                    Set your first savings goal
                  </h4>
                </div>
                <div className="goal-jar-badge" style={{ fontSize: '1.4rem' }}>🎯</div>
              </div>
              <p className="muted small" style={{ margin: '0.5rem 0 0.85rem' }}>
                Build an emergency buffer, crop input fund, or family savings with dedicated target jars.
              </p>
              <Link to="/savings" className="btn small btn-primary" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                + Set Your First Goal
              </Link>
            </div>
          )}

          {/* Saathi AI Companion Card */}
          <div className="saathi-card-box">
            <div className="saathi-card-top">
              <div className="saathi-avatar-pill">
                <IconBot size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Saathi AI</h4>
                <p className="muted small" style={{ margin: 0 }}>Your rural financial companion</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', margin: '0.2rem 0' }}>
              Ask in Marathi, Hindi, or English about your loan options, savings tip, or govt schemes.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span
                className="saathi-pill-prompt"
                onClick={() => navigate('/saathi?prompt=' + encodeURIComponent('Can I afford a Rs 25,000 agricultural loan?'))}
              >
                Can I afford a ₹25,000 loan?
              </span>
              <span
                className="saathi-pill-prompt"
                onClick={() => navigate('/saathi?prompt=' + encodeURIComponent('Emergency fund calculation'))}
              >
                Emergency fund buffer
              </span>
            </div>

            <div style={{ marginTop: '0.25rem' }}>
              <Link
                to="/saathi"
                className="small"
                style={{ fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Ask Saathi →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Upcoming Repayments + Recent Transactions + Seasonal Tip */}
      <div className="bottom-dashboard-grid">
        {/* Card 1: Upcoming Repayments */}
        <div className="dashboard-card-box">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>Upcoming Repayments</h3>
            <span className="badge neutral small">{upcomingRepayments.length} due</span>
          </div>

          <div>
            {upcomingRepayments.slice(0, 3).map((rep) => (
              <div key={rep.id} className="table-subtle-row">
                <div className="repayment-left-info">
                  <span className="repayment-title">{rep.title}</span>
                  <span className="repayment-date">
                    Due {rep.due_date} • <span style={{ color: rep.overdue ? '#e11d48' : '#059669', fontWeight: 600 }}>{rep.status_text}</span>
                  </span>
                </div>
                <div className="repayment-right-action">
                  <span className="repay-amount">₹{Number(rep.amount).toLocaleString('en-IN')}</span>
                  <button
                    type="button"
                    className="btn small"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                    onClick={() => openRepayModal(rep)}
                  >
                    Pay UPI
                  </button>
                </div>
              </div>
            ))}

            {upcomingRepayments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p className="muted small">All active loan repayments are up to date! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recent Transactions (Passbook) */}
        <div className="dashboard-card-box">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>Recent Transactions</h3>
            <Link to="/transactions" className="small" style={{ fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          <div>
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="txn-item-row">
                <div className="txn-left-block">
                  <div className={`txn-icon-circle ${tx.is_credit ? 'credit' : 'debit'}`}>
                    {tx.category === 'milk_sales' ? '🥛' :
                     tx.category === 'groceries' ? '🛒' :
                     tx.category === 'fertilizer' ? '🌱' :
                     tx.category === 'subsidy' ? '🏛️' :
                     tx.category === 'tailoring' ? '✂️' :
                     tx.is_credit ? '↓' : '↑'}
                  </div>
                  <div>
                    <div className="txn-title-text">{tx.title || tx.type}</div>
                    <div className="txn-date-text">{tx.date} • {tx.mode || 'UPI'}</div>
                  </div>
                </div>
                <div className={`txn-amount-val ${tx.is_credit ? 'credit' : 'debit'}`}>
                  {tx.is_credit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p className="muted small">No recent passbook transactions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Seasonal Income Tip */}
        <div className="seasonal-tip-box">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🌾</span>
              <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#92400e', fontWeight: 700 }}>
                {seasonalTip.title}
              </h4>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.45, margin: 0 }}>
              {seasonalTip.description}
            </p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Link
              to={seasonalTip.action_target}
              className="btn small"
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                width: '100%',
                display: 'block',
                textAlign: 'center',
                boxShadow: 'none',
              }}
            >
              {seasonalTip.action_label}
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS FOR REAL MONEY OPERATIONS
          ========================================================================= */}

      {/* 1. Add Income Modal */}
      {showIncomeModal && (
        <div className="modal-overlay" onClick={() => setShowIncomeModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Record Income to Balance</h3>
              <button className="icon-btn" onClick={() => setShowIncomeModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Increases verified liquid balance for <b>{userName}</b> and logs into passbook.
            </p>

            <form onSubmit={handleAddIncome}>
              <div className="field">
                <span>Income Amount (Rs)</span>
                <input
                  type="number"
                  min="10"
                  required
                  placeholder="e.g. 1200"
                  value={incomeAmt}
                  onChange={(e) => setIncomeAmt(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Source Description / Title</span>
                <input
                  required
                  placeholder="e.g. Milk Sales to Co-operative Dairy"
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Category</span>
                <select value={incomeCat} onChange={(e) => setIncomeCat(e.target.value)}>
                  <option value="milk_sales">Dairy & Milk Sales</option>
                  <option value="crop_sale">Mandi Crop & Vegetable Sales</option>
                  <option value="wages">Daily Labour / Farm Wages</option>
                  <option value="tailoring">Stitching & Garment Orders</option>
                  <option value="subsidy">Government DBT Subsidy</option>
                  <option value="other">Other Household Inflow</option>
                </select>
              </div>

              <div className="field">
                <span>Received Via</span>
                <select value={incomeMode} onChange={(e) => setIncomeMode(e.target.value)}>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Cash">Cash at Mandi / Doorstep</option>
                  <option value="Bank Transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowIncomeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Crediting…' : 'Add to Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>− Record Household / Farm Expense</h3>
              <button className="icon-btn" onClick={() => setShowExpenseModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Deducts from available balance for <b>{userName}</b> and registers in passbook ledger.
            </p>

            <form onSubmit={handleAddExpense}>
              <div className="field">
                <span>Expense Amount (Rs)</span>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 450"
                  value={expenseAmt}
                  onChange={(e) => setExpenseAmt(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Spent On / Item</span>
                <input
                  required
                  placeholder="e.g. Groceries & Provisions"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Category</span>
                <select value={expenseCat} onChange={(e) => setExpenseCat(e.target.value)}>
                  <option value="groceries">Groceries & Household Ration</option>
                  <option value="fertilizer">Fertilizer, Seeds & Agri Inputs</option>
                  <option value="materials">Fabric, Threads & Stock Inventory</option>
                  <option value="medical">Health & Pharmacy</option>
                  <option value="education">School Fees & Books</option>
                  <option value="bills">Electricity & Mobile Recharge</option>
                  <option value="other">Miscellaneous</option>
                </select>
              </div>

              <div className="field">
                <span>Paid Via</span>
                <select value={expenseMode} onChange={(e) => setExpenseMode(e.target.value)}>
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Debit</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Recording…' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Transfer to Savings Goal Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⇄ Transfer Money to Savings Goal</h3>
              <button className="icon-btn" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Transfers funds from Available Balance (₹{Number(availableBalance).toLocaleString('en-IN')}) into your goal reserve.
            </p>

            <form onSubmit={handleTransfer}>
              <div className="field">
                <span>Target Savings Goal</span>
                <select
                  value={transferGoalId || topGoal?.id}
                  onChange={(e) => setTransferGoalId(e.target.value)}
                >
                  {goalsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} (Target: ₹{Number(g.target_amount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span>Transfer Amount (Rs)</span>
                <input
                  type="number"
                  min="10"
                  max={availableBalance}
                  required
                  placeholder="e.g. 500"
                  value={transferAmt}
                  onChange={(e) => setTransferAmt(e.target.value)}
                />
              </div>

              <div className="field">
                <span>Optional Note</span>
                <input
                  placeholder="e.g. Monthly harvest surplus buffer"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Transferring…' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Custom Goal Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit to Goal: {topGoal?.title}</h3>
              <button className="icon-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Current progress: ₹{Number(topGoal?.saved_amount || 0).toLocaleString('en-IN')} of ₹{Number(topGoal?.target_amount || 0).toLocaleString('en-IN')}.
            </p>

            <form onSubmit={handleCustomGoalDeposit}>
              <div className="field">
                <span>Deposit Amount (Rs)</span>
                <input
                  type="number"
                  min="50"
                  required
                  value={goalDepositAmt}
                  onChange={(e) => setGoalDepositAmt(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {[200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn small ghost"
                    style={{ flex: 1 }}
                    onClick={() => setGoalDepositAmt(amt)}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Depositing…' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Real UPI Repayment & Ledger Settlement Modal */}
      {showUpiModal && selectedRepayment && (
        <div className="modal-overlay" onClick={() => setShowUpiModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{selectedRepayment.loan_id ? 'Loan EMI Settlement' : 'SHG Contribution Settlement'}</h3>
              <button className="icon-btn" onClick={() => setShowUpiModal(false)}>✕</button>
            </div>
            <p className="muted small" style={{ marginBottom: '0.75rem' }}>
              Facility: <b>{selectedRepayment.title}</b>
            </p>

            <form onSubmit={handleExecuteUpiPay}>
              <div className="field">
                <span>Amount to Settle (₹)</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              {/* Payment Mode Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`btn small ${payMode === 'upi_qr' ? '' : 'ghost'}`}
                  onClick={() => setPayMode('upi_qr')}
                >
                  📱 UPI QR / App
                </button>
                <button
                  type="button"
                  className={`btn small ${payMode === 'wallet' ? '' : 'ghost'}`}
                  onClick={() => setPayMode('wallet')}
                >
                  💼 Syra Wallet
                </button>
              </div>

              {payMode === 'upi_qr' ? (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR"
                      style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block', margin: '0 auto 0.5rem' }}
                    />
                  ) : (
                    <div style={{ width: '160px', height: '160px', background: '#f1f5f9', display: 'grid', placeItems: 'center', margin: '0 auto 0.5rem', borderRadius: '8px' }}>
                      <Loading small />
                    </div>
                  )}

                  <p className="muted small" style={{ marginBottom: '0.5rem' }}>
                    Scan using BHIM, GPay, PhonePe, or Paytm
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <a
                      href={`upi://pay?pa=financesaathi@bank&pn=FinanceSaathi&am=${encodeURIComponent(payAmount)}&cu=INR&tn=${encodeURIComponent(selectedRepayment.loan_id ? `Loan #${selectedRepayment.loan_id} Inst #${selectedRepayment.number}` : selectedRepayment.title || 'Settlement')}`}
                      className="btn small secondary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      ⚡ Open UPI App
                    </a>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px dashed #cbd5e1', marginBottom: '1rem' }}>
                    Institutional UPI VPA: <b>financesaathi@bank</b>
                  </div>

                  <div className="field" style={{ textAlign: 'left' }}>
                    <span>Bank / UPI Reference No. (UTR)</span>
                    <input
                      type="text"
                      placeholder="e.g. 428901234567"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                    <small className="muted">Enter UTR number from your payment confirmation to record on statement.</small>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>Available Wallet Balance:</span>
                    <b>₹{Number(availableBalance).toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>Amount to Debit:</span>
                    <b>₹{Number(payAmount || 0).toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #86efac', paddingTop: '0.3rem' }}>
                    <span>Remaining Balance:</span>
                    <b>₹{Math.max(0, availableBalance - Number(payAmount || 0)).toLocaleString('en-IN')}</b>
                  </div>
                  {availableBalance < Number(payAmount || 0) && (
                    <p style={{ color: '#dc2626', marginTop: '0.5rem', fontWeight: 600 }}>
                      ⚠️ Insufficient wallet balance. Please switch to UPI QR above.
                    </p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowUpiModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={paySuccess || (payMode === 'wallet' && availableBalance < Number(payAmount || 0))}
                >
                  {paySuccess ? 'Settling Ledger…' : `Confirm Settlement (₹${Number(payAmount || 0).toLocaleString('en-IN')})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const { data, loading, reload } = useLoad(() => api('/dashboard'))

  if (loading) return <Loading />

  // 1. System Administrator Workspace
  if (user?.role === 'admin') {
    return <AdminDashboardView data={data} reload={reload} />
  }

  // 2. Loan / Credit Officer Workspace
  if (user?.role === 'officer') {
    return <OfficerDashboardView data={data} reload={reload} />
  }

  // 3. SHG Group Leader Workspace
  if (user?.role === 'shg_leader') {
    return <SHGLeaderDashboardView user={user} refresh={refresh} />
  }

  // 4. Default Borrower / Member Workspace
  return <BorrowerDashboardView data={data} user={user} refresh={refresh} reload={reload} />
}
