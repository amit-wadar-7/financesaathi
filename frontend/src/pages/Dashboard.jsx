import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, Progress, Stat, useLoad, useToast, FinancialHealthScoreDial, CashflowBarChart } from '../ui'
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

const MONTH_NAMES = {
  hi: { May: 'मई', Jun: 'जून', Jul: 'जुलाई', Aug: 'अगस्त', Sep: 'सितंबर', Oct: 'अक्टूबर', Nov: 'नवंबर', Dec: 'दिसंबर', Jan: 'जनवरी', Feb: 'फ़रवरी', Mar: 'मार्च', Apr: 'अप्रैल' },
  mr: { May: 'मे', Jun: 'जून', Jul: 'जुलै', Aug: 'ऑगस्ट', Sep: 'सप्टेंबर', Oct: 'ऑक्टोबर', Nov: 'नोव्हेंबर', Dec: 'डिसेंबर', Jan: 'जानेवारी', Feb: 'फेब्रुवारी', Mar: 'मार्च', Apr: 'एप्रिल' },
}

const SEASONAL_TIPS_I18N = {
  hi: {
    'Post-Monsoon & Mandi Sales Buffer': {
      title: 'मानसून उपरांत एवं मंडी बिक्री बफर',
      description: 'फसल की शुरुआती बिक्री और त्योहारी सीजन की वित्तीय योजना। बिक्री से प्राप्त राशि का 20% अपने बचत गट (एसएचजी) बचत खाते में सुरक्षित रखें।',
      action_label: 'एसएचजी पासबुक देखें →',
    },
    'Rabi Sowing & Harvest Advisory': {
      title: 'रबी बुवाई एवं फसल सुरक्षा परामर्श',
      description: 'रबी फसल देखभाल एवं कटाई की अवधि। आगामी खरीफ बुवाई से पहले फसल आय में से एक आपातकालीन बचत फंड तैयार करें।',
      action_label: 'फसल योजना कैलकुलेटर →',
    },
    'Pre-Monsoon & Summer Preparation': {
      title: 'मानसून पूर्व एवं ग्रीष्मकालीन तैयारी',
      description: 'मानसून से पहले कृषि खाद-बीज और मिट्टी परीक्षण की तैयारी करें। पीएम-कुसुम के तहत रियायती सोलर पंप योजनाओं का लाभ लें।',
      action_label: 'सोलर योजनाएं देखें →',
    },
    'Kharif Monsoon Sowing Advisory': {
      title: 'खरीफ मानसून बुवाई परामर्श',
      description: 'अंतिम तिथि से पहले प्रधानमंत्री फसल बीमा योजना (PMFBY) में नामांकन सुनिश्चित करें। सरकारी खाद सब्सिडी सत्यापन हेतु रसीदें सुरक्षित रखें।',
      action_label: 'फसल बीमा देखें →',
    },
  },
  mr: {
    'Post-Monsoon & Mandi Sales Buffer': {
      title: 'पावसाळ्यानंतरचा काळ व बाजार समिती विक्री राखीव निधी',
      description: 'सुरुवातीची पीक विक्री व सणासुदीचे आर्थिक नियोजन. पीक विक्रीतून मिळालेल्या पैशांमधील २०% रक्कम बचत गट खात्यात सुरक्षित ठेवा.',
      action_label: 'बचत गट पासबुक पहा →',
    },
    'Rabi Sowing & Harvest Advisory': {
      title: 'रब्बी पेरणी व पीक सल्ला',
      description: 'रब्बी पिकांची निगा व काढणीचा काळ. पुढील खरीप हंगामापूर्वी पीक उत्पन्नातून आणीबाणीसाठी रोख रक्कम बाजूला ठेवा.',
      action_label: 'पीक नियोजन कॅल्क्युलेटर →',
    },
    'Pre-Monsoon & Summer Preparation': {
      title: 'पावसाळापूर्व व उन्हाळी पूर्वतयारी',
      description: 'पावसाळ्यापूर्वी शेती साहित्य व माती परीक्षण करा. पीएम-कुसुम योजनेअंतर्गत सौर कृषी पंपाच्या सवलतींचा लाभ घ्या.',
      action_label: 'सौर योजना पहा →',
    },
    'Kharif Monsoon Sowing Advisory': {
      title: 'खरीप पेरणी सल्ला',
      description: 'मुदतीपूर्वी प्रधानमंत्री पीक विमा योजनेत (PMFBY) नाव नोंदवा. शासकीय खत अनुदानासाठी पावत्या जपून ठेवा.',
      action_label: 'पीक विमा पहा →',
    },
  },
}

/* =========================================================================
   1. ADMIN DASHBOARD WORKSPACE
   ========================================================================= */
function AdminDashboardView({ data, reload }) {
  const toast = useToast()
  const { t, lang } = useLang()
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
            <span className="badge approved" style={{ fontWeight: 700 }}>{t('sysAdminConsole')}</span>
          </div>
          <h2>{t('enterpriseOpsHub')}</h2>
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
            <IconClock size={16} /> {runningReminders ? 'Dispatching Reminders…' : t('runEmiRemindersCron')}
          </button>
        </div>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      {/* Admin Platform KPIs */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label={t("totalRegisteredUsers")}
          value={data?.total_users || users.data?.length || 0}
          sub="Platform user directory"
        />
        <Stat
          label={t("pendingUnderwriting")}
          value={data?.pending_review || loansByStatus.pending || 0}
          sub="Awaiting officer decision"
        />
        <Stat
          label={t("activePerformingLoans")}
          value={loansByStatus.approved || 0}
          sub="Capital disbursed & performing"
        />
        <Stat
          label={t("overdueDelinquencies")}
          value={data?.overdue_loans || 0}
          sub="Requires early warning action"
        />
      </div>

      <div className="two-col" style={{ alignItems: 'start', marginBottom: '1.25rem' }}>
        {/* User Directory & Role Assignment */}
        <div className="card">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t("userDirectoryPrivilege")}</h3>
              <span className="muted small">{t("promoteAssignPermissions")}</span>
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
                    <th>{t("userId")}</th>
                    <th>{t("userName")}</th>
                    <th>{t("email")}</th>
                    <th>{t("assignedRole")}</th>
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
                          <option value="user">{t("roleUserBorrower")}</option>
                          <option value="officer">{t("roleOfficerCredit")}</option>
                          <option value="shg_leader">{t("roleShgLeader")}</option>
                          <option value="admin">{t("roleAdminSuperuser")}</option>
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
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t("statutoryAuditLog")}</h3>
                <span className="muted small">{t("dpdpCompliance")}</span>
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
                      <th>{t("timeLabel")}</th>
                      <th>{t("actionLabel")}</th>
                      <th>{t("entityLabel")}</th>
                      <th>{t("operationDetails")}</th>
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
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{t("superuserOps")}</h4>
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
  const { t, lang } = useLang()
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
            <span className="badge pending" style={{ fontWeight: 700 }}>{t('creditUnderwritingTerminal')}</span>
          </div>
          <h2>{t('officerWorkbench')}</h2>
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
          label={t("underwritingQueue")}
          value={pendingList.length}
          sub="Awaiting sanction decision"
        />
        <Stat
          label={t("approvedActiveLoans")}
          value={data?.loans_by_status?.approved || 0}
          sub="Performing assets"
        />
        <Stat
          label={t("overdueDelinquencies")}
          value={data?.overdue_loans || 0}
          sub="Requires borrower contact"
        />
        <Stat
          label={t("atRiskCreditFlagged")}
          value={atRiskList.length}
          sub="Early warning triggers"
        />
      </div>

      <div className="two-col" style={{ alignItems: 'start', marginBottom: '1.25rem' }}>
        {/* Pending Applications Queue */}
        <div className="card">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t("pendingApplicationsAwaiting")}</h3>
              <span className="muted small">{t("reviewAiScoresAuth")}</span>
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
                    <th>{t("refNum")}</th>
                    <th>{t("borrower")}</th>
                    <th>{t("principal")}</th>
                    <th>AI Score</th>
                    <th>{t("actionLabel")}</th>
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
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t("parEarlyWarning")}</h3>
              <span className="muted small">{t("automatedMlDetection")}</span>
            </div>
            <Link to="/at-risk" className="small" style={{ fontWeight: 600 }}>
              {t('fullRiskRadar')} →
            </Link>
          </div>

          {atRisk.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("refNum")}</th>
                    <th>{t("borrower")}</th>
                    <th>{t("overdueCount")}</th>
                    <th>{t("riskRationale")}</th>
                    <th>{t("actionLabel")}</th>
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
  const { t, lang } = useLang()
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
            <span className="badge approved" style={{ fontWeight: 700 }}>{t('shgLeaderFederationHub')}</span>
          </div>
          <h2>{t('shgGovernanceDesk')}</h2>
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
              <IconPlus size={16} /> {t("enrollNewMember")}
            </button>
          ) : (
            <button
              type="button"
              className="btn emerald"
              onClick={() => setShowCreateShg(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconPlus size={16} /> {t("establishShgGroup")}
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
              label={t("shgGroupName")}
              value={shgSummaryData.name}
              sub={`Village: ${shgSummaryData.village}`}
            />
            <Stat
              label={t("enrolledGroupMembers")}
              value={shgSummaryData.members?.length || 0}
              sub="Joint liability members"
            />
            <Stat
              label={t("collectiveActiveLoans")}
              value={shgSummaryData.group_loans || 0}
              sub="Peer guaranteed facilities"
            />
            <Stat
              label={t("groupOutstandingCapital")}
              value={money(shgSummaryData.outstanding || 0)}
              sub={`${shgSummaryData.overdue_installments || 0} Overdue instalments`}
            />
          </div>

          <div className="two-col" style={{ alignItems: 'start' }}>
            {/* Member Roster */}
            <div className="card">
              <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t("registeredMemberRoster")}</h3>
                  <span className="muted small">{t("shgJointLiabilityMembers")}</span>
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
                      <th>{t("memberId")}</th>
                      <th>{t("legalName")}</th>
                      <th>{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(shgSummaryData.members || []).map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>#{m.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{m.name}</td>
                        <td>
                          <span className="badge approved">{t("activeMember")}</span>
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
                <span>{t("memberEmailAddress")}</span>
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
  const incomeNum = Number(monthlyIncome || 0)
  const expensesNum = Number(monthlyExpenses || 0)

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

  const todayDateStr = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN', {
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{lang === 'hi' ? `नमस्ते, ${userName}` : lang === 'mr' ? `नमस्कार, ${userName}` : `Namaskar, ${userName}`} 👋</h2>
          <p className="page-subtitle" style={{ marginTop: '2px', fontSize: '0.9rem' }}>
            {lang === 'hi' ? 'आज का आपका वित्तीय विवरण • ' : lang === 'mr' ? 'आजचे तुमचे आर्थिक चित्र • ' : "Here's your financial picture for today • "}
            <span className="muted">{todayDateStr}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${user?.kyc_status === 'verified' ? 'approved' : 'pending'}`} style={{ fontWeight: 600 }}>
            {user?.kyc_status === 'verified' ? t('kycVerified') : t('kycPending')}
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
            <span>{t("availableBalance")}</span>
            <button
              type="button"
              className="balance-eye-btn"
              onClick={() => setHideBalance(!hideBalance)}
              title={hideBalance ? 'Show balance' : 'Hide balance'}
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <IconEyeOff size={15} /> : <IconEye size={15} />}
            </button>
          </div>
          <div className="balance-trend-tag">
            <IconTrendingUp size={14} />
            <span>
              {recentNet > 0
                ? (lang === 'hi' ? `+₹${recentNet.toLocaleString('en-IN')} शुद्ध गतिविधि` : lang === 'mr' ? `+₹${recentNet.toLocaleString('en-IN')} निव्वळ जमा` : `+₹${recentNet.toLocaleString('en-IN')} net activity`)
                : recentNet < 0
                ? (lang === 'hi' ? `-₹${Math.abs(recentNet).toLocaleString('en-IN')} शुद्ध निकासी` : lang === 'mr' ? `-₹${Math.abs(recentNet).toLocaleString('en-IN')} निव्वळ खर्च` : `-₹${Math.abs(recentNet).toLocaleString('en-IN')} net outflow`)
                : (transactions && transactions.length > 0 ? (lang === 'hi' ? 'खाता संतुलित' : lang === 'mr' ? 'खाते संतुलित' : 'Ledger Reconciled') : (lang === 'hi' ? 'कोई लेन-देन नहीं' : lang === 'mr' ? 'कोणतेही व्यवहार नाहीत' : 'No transactions yet'))}
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
            <IconPlus size={16} /> {lang === 'hi' ? 'आय जोड़ें' : lang === 'mr' ? 'उत्पन्न जोडा' : 'Add Income'}
          </button>
          <button
            type="button"
            className="hero-action-btn"
            onClick={() => setShowExpenseModal(true)}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 0.8, fontWeight: 800 }}>−</span> {lang === 'hi' ? 'खर्च दर्ज करें' : lang === 'mr' ? 'खर्च नोंदवा' : 'Add Expense'}
          </button>
          <button
            type="button"
            className="hero-action-btn"
            onClick={() => setShowTransferModal(true)}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 0.9 }}>⇄</span> {lang === 'hi' ? 'स्थानांतरण' : lang === 'mr' ? 'पैसे पाठवा' : 'Transfer'}
          </button>
          <button
            type="button"
            className="hero-action-btn secondary"
            onClick={() => navigate('/transactions')}
          >
            <IconFileText size={15} /> {lang === 'hi' ? 'पासबुक देखें' : lang === 'mr' ? 'पासबुक पहा' : 'View Statement'}
          </button>
        </div>
      </div>

      {/* 3. Three KPI Metric Cards Row */}
      <div className="kpi-cards-grid">
        <div className="kpi-metric-card">
          <div className="kpi-metric-title">{t("incomeThisMonth")}</div>
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
          <div className="kpi-metric-title">{t("expenses")}</div>
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
          <div className="kpi-metric-title">{t("savingsSurplus")}</div>
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
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{t("incomeVsExpenses")}</h3>
              <p className="muted small" style={{ marginTop: '2px' }}>{t("last6MonthsTrend")}</p>
            </div>
            <div className="chart-legend-row">
              <div className="legend-item">
                <span className="legend-dot income" />
                <span>{t("income")}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot expense" />
                <span>{t("expenses")}</span>
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
                    {(MONTH_NAMES[lang] && MONTH_NAMES[lang][item.month]) || item.month}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="chart-insight-footer">
            <span>{t("avgMonthlySurplus")} <b>₹{Number(kpiData.savings_this_month).toLocaleString('en-IN')}</b></span>
            {incomeNum > 0 ? (
              <span style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>
                {t('savingsRate')}: {Math.max(0, Math.round(((incomeNum - expensesNum) / incomeNum) * 100))}%
              </span>
            ) : (
              <span className="muted" style={{ fontWeight: 500 }}>
                {t('savingsRate')}: —
              </span>
            )}
          </div>
        </div>

        {/* Right: Stack of Savings Goal Card and Saathi AI */}
        <div className="side-cards-stack">
          {/* Savings Goal Card */}
          {topGoal ? (
            <div className="savings-goal-banner">
              <div className="goal-banner-header">
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--emerald-600, #047857)', fontWeight: 700 }}>
                    {lang === 'hi' ? 'बचत लक्ष्य' : lang === 'mr' ? 'बचत उद्दिष्ट' : 'SAVINGS GOAL'}
                  </span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.05rem', color: 'var(--slate-900, #064e3b)' }}>
                    {topGoal.title}
                  </h4>
                </div>
                <div className="goal-jar-badge" title="Target Savings Jar">
                  🌱
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.84rem' }}>
                <span>
                  <b>₹{Number(topGoal.saved_amount || 0).toLocaleString('en-IN')}</b> {lang === 'hi' ? 'में से' : lang === 'mr' ? 'पैकी' : 'of'} ₹{Number(topGoal.target_amount || 0).toLocaleString('en-IN')}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--emerald-600, #059669)' }}>
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
                  {lang === 'hi' ? '+ ₹500 जमा करें' : lang === 'mr' ? '+ ₹500 जमा करा' : '+ Deposit ₹500'}
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                  onClick={() => setShowDepositModal(true)}
                >
                  {lang === 'hi' ? 'अन्य राशि' : lang === 'mr' ? 'इतर रक्कम' : 'Custom Deposit'}
                </button>
              </div>
            </div>
          ) : (
            <div className="savings-goal-banner empty-goal-banner" style={{ background: 'var(--card-bg, #ffffff)', border: '1px dashed var(--border-color, #e2e8f0)', padding: '1.25rem', borderRadius: 'var(--radius-md, 10px)' }}>
              <div className="goal-banner-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', fontWeight: 700 }}>
                    {lang === 'hi' ? 'बचत लक्ष्य' : lang === 'mr' ? 'बचत उद्दिष्ट' : 'SAVINGS GOAL'}
                  </span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1rem', color: 'var(--slate-800)' }}>
                    {lang === 'hi' ? 'अपना पहला बचत लक्ष्य निर्धारित करें' : lang === 'mr' ? 'तुमचे पहिले बचत उद्दिष्ट ठरवा' : 'Set your first savings goal'}
                  </h4>
                </div>
                <div className="goal-jar-badge" style={{ fontSize: '1.4rem' }}>🎯</div>
              </div>
              <p className="muted small" style={{ margin: '0.5rem 0 0.85rem' }}>
                {lang === 'hi' ? 'समर्पित लक्ष्य जार के साथ आपातकालीन फंड, फसल इनपुट या पारिवारिक बचत बनाएं।' : lang === 'mr' ? 'विशिष्ट उद्दिष्टांच्या मदतीने आणीबाणी निधी किंवा कौटुंबिक बचत उभारा.' : 'Build an emergency buffer, crop input fund, or family savings with dedicated target jars.'}
              </p>
              <Link to="/savings" className="btn small btn-primary" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                {lang === 'hi' ? '+ पहला लक्ष्य निर्धारित करें' : lang === 'mr' ? '+ पहिले उद्दिष्ट ठरवा' : '+ Set Your First Goal'}
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
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>{t("saathiAi")}</h4>
                <p className="muted small" style={{ margin: 0 }}>{t("ruralFinancialCompanion")}</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', margin: '0.2rem 0' }}>
              {t("saathiCardDesc")}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <span
                className="saathi-pill-prompt"
                onClick={() => navigate('/saathi?prompt=' + encodeURIComponent('Can I afford a Rs 25,000 agricultural loan?'))}
              >
                {t("saathiPromptPill1")}
              </span>
              <span
                className="saathi-pill-prompt"
                onClick={() => navigate('/saathi?prompt=' + encodeURIComponent('Emergency fund calculation'))}
              >
                {t("saathiPromptPill2")}
              </span>
            </div>

            <div style={{ marginTop: '0.25rem' }}>
              <Link
                to="/saathi"
                className="small"
                style={{ fontWeight: 700, color: 'var(--emerald-600, #059669)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {lang === 'hi' ? 'साथी से पूछें →' : lang === 'mr' ? 'साथीला विचारा →' : 'Ask Saathi →'}
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
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>{t("upcomingRepayments")}</h3>
            <span className="badge neutral small">{upcomingRepayments.length} {lang === 'hi' ? 'बाकी' : lang === 'mr' ? 'थकबाकी' : 'due'}</span>
          </div>

          <div>
            {upcomingRepayments.slice(0, 3).map((rep) => {
              const localizedTitle = rep.title
                ? rep.title.replace(/^Loan Repayment:\s*/i, lang === 'hi' ? 'ऋण पुनर्भुगतान: ' : lang === 'mr' ? 'कर्ज परतफेड: ' : 'Loan Repayment: ')
                : rep.title
              const statusDisplay = rep.overdue || rep.status_text === 'Overdue'
                ? (lang === 'hi' ? 'अतिदेय' : lang === 'mr' ? 'थकीत' : 'Overdue')
                : rep.status_text === 'Scheduled'
                ? (lang === 'hi' ? 'निर्धारित' : lang === 'mr' ? 'नियोजित' : 'Scheduled')
                : rep.status_text
              return (
              <div key={rep.id} className="table-subtle-row">
                <div className="repayment-left-info">
                  <span className="repayment-title">{localizedTitle}</span>
                  <span className="repayment-date">
                    {lang === 'hi' ? 'अंतिम तिथि' : lang === 'mr' ? 'देय तारीख' : 'Due'} {rep.due_date} • <span style={{ color: rep.overdue ? '#e11d48' : 'var(--emerald-600, #059669)', fontWeight: 600 }}>{statusDisplay}</span>
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
                    {lang === 'hi' ? 'यूपीआई भुगतान' : lang === 'mr' ? 'यूपीआय भरा' : 'Pay UPI'}
                  </button>
                </div>
              </div>
            )})}

            {upcomingRepayments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p className="muted small">{t("allRepaymentsUpToDate")} 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recent Transactions (Passbook) */}
        <div className="dashboard-card-box">
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>{t("recentTransactions")}</h3>
            <Link to="/transactions" className="small" style={{ fontWeight: 600 }}>
              {t('viewAll')} →
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
                <p className="muted small">{lang === 'hi' ? 'कोई हालिया पासबुक लेनदेन नहीं।' : lang === 'mr' ? 'कोणतेही अलीकडील पासबुक व्यवहार नाहीत.' : 'No recent passbook transactions.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Seasonal Income Tip */}
        {(() => {
          const locTip = (seasonalTip && SEASONAL_TIPS_I18N[lang] && SEASONAL_TIPS_I18N[lang][seasonalTip.title]) || seasonalTip
          if (!locTip) return null
          return (
            <div className="seasonal-tip-box">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🌾</span>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#92400e', fontWeight: 700 }}>
                    {locTip.title}
                  </h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.45, margin: 0 }}>
                  {locTip.description}
                </p>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Link
                  to={locTip.action_target}
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
                  {locTip.action_label}
                </Link>
              </div>
            </div>
          )
        })()}
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
                <span>{t("incomeAmount")}</span>
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
                <span>{t("sourceDesc")}</span>
                <input
                  required
                  placeholder="e.g. Milk Sales to Co-operative Dairy"
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <span>{t("category")}</span>
                <select value={incomeCat} onChange={(e) => setIncomeCat(e.target.value)}>
                  <option value="milk_sales">{t("catDairySales")}</option>
                  <option value="crop_sale">{t("catMandiSales")}</option>
                  <option value="wages">{t("catLabourWages")}</option>
                  <option value="tailoring">{t("catStitchingOrders")}</option>
                  <option value="subsidy">{t("catDbtSubsidy")}</option>
                  <option value="other">{t("catOtherInflow")}</option>
                </select>
              </div>

              <div className="field">
                <span>{t("receivedVia")}</span>
                <select value={incomeMode} onChange={(e) => setIncomeMode(e.target.value)}>
                  <option value="UPI">{t("viaUpi")}</option>
                  <option value="Cash">{t("viaCashMandi")}</option>
                  <option value="Bank Transfer">{t("viaBankTransfer")}</option>
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
                <span>{t("expenseAmount")}</span>
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
                <span>{t("spentOnItem")}</span>
                <input
                  required
                  placeholder="e.g. Groceries & Provisions"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <span>{t("category")}</span>
                <select value={expenseCat} onChange={(e) => setExpenseCat(e.target.value)}>
                  <option value="groceries">{t("catGroceries")}</option>
                  <option value="fertilizer">{t("catAgriInputs")}</option>
                  <option value="materials">{t("catFabricInventory")}</option>
                  <option value="medical">{t("catHealthPharmacy")}</option>
                  <option value="education">{t("catSchoolFees")}</option>
                  <option value="bills">{t("catElectricityMobile")}</option>
                  <option value="other">{t("catMisc")}</option>
                </select>
              </div>

              <div className="field">
                <span>{t("paidVia")}</span>
                <select value={expenseMode} onChange={(e) => setExpenseMode(e.target.value)}>
                  <option value="UPI">{t("viaUpi")}</option>
                  <option value="Cash">{t("viaCash")}</option>
                  <option value="Bank Transfer">{t("viaBankDebit")}</option>
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
                <span>{t("targetSavingsGoal")}</span>
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
                <span>{t("transferAmount")}</span>
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
                <span>{t("optionalNote")}</span>
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
                <span>{t("depositAmount")}</span>
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
                <span>{t("amountToSettle")}</span>
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
                    <span>{t("bankUpiRefUtr")}</span>
                    <input
                      type="text"
                      placeholder="e.g. 428901234567"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                    />
                    <small className="muted">{t("enterUtrHelp")}</small>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>{t("availableWalletBalance")}</span>
                    <b>₹{Number(availableBalance).toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span>{t("amountToDebit")}</span>
                    <b>₹{Number(payAmount || 0).toLocaleString('en-IN')}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #86efac', paddingTop: '0.3rem' }}>
                    <span>{t("remainingBalanceLabel")}</span>
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
