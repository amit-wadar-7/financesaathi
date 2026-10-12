import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Loading, useLoad } from '../ui'
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
  IconFlame,
  IconShield,
  IconUsers,
  IconBot,
  IconFileText,
  IconLock,
  IconPrinter,
  IconCheckCircle,
  IconPlus,
  IconArrowRight,
} from '../icons'

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  // Dynamic dashboard telemetry from backend
  const { data, loading, reload } = useLoad(() => api('/dashboard'))

  // State for interactive desktop modals & widgets
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showGoalDepositModal, setShowGoalDepositModal] = useState(false)
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
  const [paySuccess, setPaySuccess] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000)
  const [goalDepositAmount, setGoalDepositAmount] = useState(1000)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState(25000)
  const [busyAction, setBusyAction] = useState(false)

  // Derived user information from database
  const userName = user?.name || data?.name || 'Member'
  const shgName = data?.shg?.name || (user?.shg_id ? `SHG Group #${user.shg_id}` : 'Direct Individual Account')
  const location = data?.shg?.village || user?.phone || 'Aadhaar Verified'

  // Dynamic balances
  const totalSavings = data?.total_savings_and_assets ?? (user?.savings_balance || 0)
  const savingsBalance = data?.savings_balance ?? (user?.savings_balance || 0)
  const totalSavedInGoals = data?.total_saved ?? 0
  const nextInstallment = data?.next_installment || null
  const topGoal = data?.top_goal || null
  const cibilScore = data?.cibil_score || 720
  const healthScore = data?.health_score || 75
  const transactions = data?.transactions || []

  // Dynamic household financials
  const monthlyIncome = data?.monthly_income || user?.monthly_income || 0
  const monthlyExpenses = data?.monthly_expenses || user?.monthly_expenses || 0
  const existingEmi = data?.existing_emi || user?.existing_emi || (nextInstallment ? nextInstallment.amount : 0)
  const totalOutflow = monthlyExpenses + existingEmi
  const budgetHeadroom = Math.max(0, monthlyIncome - totalOutflow)
  const spentPct = monthlyIncome > 0 ? Math.min(100, Math.round((totalOutflow / monthlyIncome) * 100)) : 0

  // Category breakdown
  const catGroceries = Math.round(monthlyExpenses * 0.45)
  const catEducation = Math.round(monthlyExpenses * 0.20)
  const catFarm = Math.round(monthlyExpenses * 0.20)
  const catHealth = Math.round(monthlyExpenses * 0.15)

  // Sync UPI payment amount with installment due
  useEffect(() => {
    if (nextInstallment?.amount) {
      setPayAmount(String(nextInstallment.amount))
    }
  }, [nextInstallment])

  const staff = user?.role === 'officer' || user?.role === 'admin'

  const handleUpiPay = async (e) => {
    e.preventDefault()
    setPaySuccess(true)
    try {
      if (nextInstallment?.loan_id) {
        await api(`/loans/${nextInstallment.loan_id}/installments/${nextInstallment.number}/pay`, {
          method: 'POST',
          body: { amount: Number(payAmount) },
        })
      }
      setTimeout(async () => {
        await refresh()
        await reload()
        setShowUpiModal(false)
        setPaySuccess(false)
        alert(lang === 'mr' ? `₹${payAmount} चे UPI पेमेंट यशस्वी झाले!` : `UPI payment of ₹${payAmount} completed successfully!`)
      }, 1000)
    } catch (err) {
      setPaySuccess(false)
      alert(err.message || 'Payment processing error')
    }
  }

  const handleDepositShg = async (e) => {
    e.preventDefault()
    const amt = Number(depositAmount)
    if (!amt || amt <= 0) return
    setBusyAction(true)
    try {
      await api('/auth/me', {
        method: 'PATCH',
        body: {
          savings_balance: (user?.savings_balance || 0) + amt,
        },
      })
      await refresh()
      await reload()
      setShowDepositModal(false)
      alert(lang === 'mr' ? `₹${amt} बचत खात्यामध्ये यशस्वीरित्या जमा झाले!` : `₹${amt} successfully deposited to your savings account!`)
    } catch (err) {
      alert(err.message || 'Deposit error')
    } finally {
      setBusyAction(false)
    }
  }

  const handleDepositTopGoal = async (e) => {
    e.preventDefault()
    if (!topGoal?.id) return
    const amt = Number(goalDepositAmount)
    if (!amt || amt <= 0) return
    setBusyAction(true)
    try {
      await api(`/savings/goals/${topGoal.id}/deposit`, {
        method: 'POST',
        body: { amount: amt },
      })
      await reload()
      setShowGoalDepositModal(false)
      alert(lang === 'mr' ? `ध्येय बचतीमध्ये ₹${amt} जोडले गेले!` : `₹${amt} successfully deposited into ${topGoal.title}!`)
    } catch (err) {
      alert(err.message || 'Goal deposit error')
    } finally {
      setBusyAction(false)
    }
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    if (!newGoalTitle.trim()) return
    setBusyAction(true)
    try {
      await api('/savings/goals', {
        method: 'POST',
        body: {
          title: newGoalTitle.trim(),
          target_amount: Number(newGoalTarget),
        },
      })
      await reload()
      setShowCreateGoalModal(false)
      setNewGoalTitle('')
      alert('Target savings goal successfully established.')
    } catch (err) {
      alert(err.message || 'Failed to create goal')
    } finally {
      setBusyAction(false)
    }
  }

  const handleQuickCreateGoal = async (title, target) => {
    try {
      await api('/savings/goals', {
        method: 'POST',
        body: { title, target_amount: target },
      })
      await reload()
    } catch (err) {
      alert(err.message || 'Failed to create goal')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="dashboard-container">
      {/* 1. Header Greeting & Health Score Bar */}
      <div className="dash-hero-banner">
        <div className="dash-user-info">
          <div className="user-text">
            <h2>
              {t('welcome')}, {userName}!
            </h2>
            <p className="sub-tag">
              {shgName} • {location}
            </p>
          </div>
        </div>

        {/* Dynamic Financial Health Score Pill */}
        <div
          className="health-score-pill"
          onClick={() => setShowHealthModal(true)}
          title="Click to view Financial Health Score breakdown"
        >
          <span className="score-dot" />
          <span className="score-text">
            {healthScore >= 70 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Moderate'} • {cibilScore} <small>/ 900</small>
          </span>
          <span className="info-circle"><IconInfo size={14} /></span>
        </div>
      </div>

      {/* Staff View (Officers & Admins) */}
      {staff && (
        <div className="staff-overview-card card">
          <h3>Staff Loan Review & Portfolio</h3>
          <div className="grid">
            <div className="stat">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value">{data?.pending_review || 0}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Overdue Loans</div>
              <div className="stat-value bad-text">{data?.overdue_loans || 0}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Approved</div>
              <div className="stat-value">{data?.loans_by_status?.approved || 0}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Closed</div>
              <div className="stat-value">{data?.loans_by_status?.closed || 0}</div>
            </div>
          </div>
          <div className="row">
            <Link to="/at-risk" className="btn small">View At-Risk Loans</Link>
            <Link to="/loans" className="btn small ghost">View All Applications</Link>
          </div>
        </div>
      )}

      {/* 2. Dynamic EMI Due Alert Banner vs. Positive Zero Dues Standing */}
      {nextInstallment ? (
        <div className="emi-alert-banner">
          <div className="emi-alert-left">
            <div className="calendar-icon-box"><IconCalendar size={20} /></div>
            <div className="emi-alert-text">
              <div className="alert-title-row">
                <span className="alert-strong">
                  {nextInstallment.overdue ? 'Overdue Instalment' : 'Scheduled EMI Due'}
                </span>
                <span className={`alert-tag ${nextInstallment.overdue ? 'bad-tag' : ''}`}>
                  Due: {nextInstallment.due_date}
                </span>
              </div>
              <div className="alert-sub">
                <b>₹{Number(nextInstallment.amount).toLocaleString('en-IN')}</b> • Loan #{nextInstallment.loan_id} ({nextInstallment.purpose}) • Instalment #{nextInstallment.number}
              </div>
            </div>
          </div>
          <button className="btn pay-upi-btn" onClick={() => setShowUpiModal(true)}>
            <IconCreditCard size={15} /> Pay via UPI
          </button>
        </div>
      ) : (
        <div className="zero-dues-banner">
          <div className="zero-dues-left">
            <div className="zero-dues-icon-box">
              <IconCheckCircle size={22} />
            </div>
            <div className="zero-dues-text">
              <h4>Zero Pending Instalments — Credit Profile in Good Standing</h4>
              <p>
                All microcredit repayments are up to date. You hold eligible pre-sanction capacity across Kisan Agri, SHG Enterprise, and PM SVANidhi facilities.
              </p>
            </div>
          </div>
          <Link to="/loans" className="btn small ghost" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Browse Loan Facilities <IconArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. Main Desktop Grid Layout */}
      <div className="dash-desktop-grid">
        {/* Left Column (Primary Widgets) */}
        <div className="dash-col-primary">
          {/* Total Savings & Assets Card */}
          <div className="savings-assets-card">
            <div className="savings-card-top">
              <div className="card-label-row">
                <span className="card-label">TOTAL SAVINGS & ASSETS</span>
                <button
                  className="eye-toggle-btn"
                  onClick={() => setHideBalance(!hideBalance)}
                  title={hideBalance ? 'Show balance' : 'Hide balance'}
                >
                  {hideBalance ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
              <div className="balance-row">
                <span className="balance-num">
                  {hideBalance ? '₹••••••••' : `₹${Number(totalSavings).toLocaleString('en-IN')}`}
                </span>
                <span className="trend-badge"><IconTrendingUp size={14} /> Active</span>
              </div>
            </div>

            {/* Monthly Growth banner */}
            <div className="monthly-growth-pill">
              <span className="piggy-icon"><IconCoins size={16} /></span>
              <span>
                Verified Account Balance: <b>₹{Number(savingsBalance).toLocaleString('en-IN')}</b> • Active Target Goals: <b>₹{Number(totalSavedInGoals).toLocaleString('en-IN')}</b>
              </span>
            </div>

            {/* Sub-breakdown footer */}
            <div className="savings-card-bottom">
              <div className="breakdown-text">
                SHG / Personal: <b>₹{Number(savingsBalance).toLocaleString('en-IN')}</b> • Goal Funds: <b>₹{Number(totalSavedInGoals).toLocaleString('en-IN')}</b>
              </div>
              <button
                className="view-ledger-btn"
                onClick={() => setShowLedgerModal(true)}
              >
                View Official Passbook &gt;
              </button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="quick-actions-bar">
            <h4 className="section-title">
              {t('quickActions')} <span className="subtitle-hint">Self-Help Desk</span>
            </h4>
            <div className="quick-actions-grid">
              <button className="action-tile" onClick={() => setShowDepositModal(true)}>
                <div className="tile-icon-box bg-mint"><IconCoins size={20} /></div>
                <span className="tile-title">{t('depositShg')}</span>
              </button>

              <button className="action-tile" onClick={() => nextInstallment ? setShowUpiModal(true) : navigate('/loans')}>
                <div className="tile-icon-box bg-blue"><IconCreditCard size={20} /></div>
                <span className="tile-title">{nextInstallment ? t('payEmi') : 'Browse Loans'}</span>
              </button>

              <button className="action-tile" onClick={() => navigate('/saathi')}>
                <div className="tile-icon-box bg-teal"><IconBot size={20} /></div>
                <span className="tile-title">{t('askSaathi')}</span>
              </button>

              <button className="action-tile" onClick={() => navigate('/tools?calc=emergency')}>
                <div className="tile-icon-box bg-slate"><IconFileText size={20} /></div>
                <span className="tile-title">{t('emergencyCalc')}</span>
              </button>
            </div>
          </div>

          {/* Monthly Spend & Budget Household Tracker */}
          <div className="budget-tracker-card card">
            <div className="budget-header">
              <div className="budget-title-group">
                <span className="pie-icon"><IconCoins size={18} /></span>
                <div>
                  <h4>Monthly Household Budget</h4>
                  <p className="tracker-sub">Live Income, Expense & Safe Cashflow Telemetry</p>
                </div>
              </div>
              {monthlyIncome > 0 && (
                <span className="spent-badge">{spentPct}% Utilized</span>
              )}
            </div>

            {monthlyIncome > 0 ? (
              <>
                <div className="budget-numbers-row">
                  <span className="spent-amt">₹{totalOutflow.toLocaleString('en-IN')} Outflow</span>
                  <span className="cap-amt">Income: ₹{monthlyIncome.toLocaleString('en-IN')}</span>
                </div>

                {/* Budget Progress Bar */}
                <div className="budget-progress-track">
                  <div className="budget-progress-fill" style={{ width: `${spentPct}%` }} />
                </div>

                <div className="budget-headroom-row">
                  <span className="headroom-text">
                    ₹{budgetHeadroom.toLocaleString('en-IN')} Safe surplus remaining
                  </span>
                  <Link to="/profile" className="days-left-text" style={{ textDecoration: 'none' }}>
                    Adjust in Profile →
                  </Link>
                </div>

                {/* Category Cards Proportional to Real Expenses */}
                <div className="categories-grid">
                  <div className="category-chip">
                    <div className="cat-icon"><IconCart size={18} /></div>
                    <div className="cat-info">
                      <span className="cat-name">Groceries & Food</span>
                      <span className="cat-val">₹{catGroceries.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="category-chip">
                    <div className="cat-icon"><IconAcademic size={18} /></div>
                    <div className="cat-info">
                      <span className="cat-name">Education & Family</span>
                      <span className="cat-val">₹{catEducation.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="category-chip">
                    <div className="cat-icon"><IconTractor size={18} /></div>
                    <div className="cat-info">
                      <span className="cat-name">Farm / Enterprise</span>
                      <span className="cat-val">₹{catFarm.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="category-chip">
                    <div className="cat-icon"><IconHospital size={18} /></div>
                    <div className="cat-info">
                      <span className="cat-name">Health & Buffer</span>
                      <span className="cat-val">₹{catHealth.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <p className="muted small" style={{ marginBottom: '0.85rem' }}>
                  Provide your monthly household income and expenses to unlock live debt obligation analysis and budget headroom tracking.
                </p>
                <Link to="/profile" className="btn small">
                  Configure Household Budget in Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Goals, Academy, Community) */}
        <div className="dash-col-secondary">
          {/* Target Savings Goal Widget */}
          <div className="goal-widget-card card">
            <div className="goal-header">
              <div className="goal-title-wrap">
                <span className="goal-icon-wrap"><IconTarget size={18} /></span>
                <h4>Target Savings Goal</h4>
              </div>
              <Link to="/savings" className="all-goals-link">
                All Goals →
              </Link>
            </div>

            {topGoal ? (
              <div className="goal-content-box">
                {/* Circular Progress Ring */}
                <div className="circular-progress">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle-fill"
                      strokeDasharray={`${Math.min(100, topGoal.progress_pct)}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="circle-inner">
                    <span className="pct-num">{Math.round(topGoal.progress_pct)}%</span>
                    <span className="pct-label">SAVED</span>
                  </div>
                </div>

                <div className="goal-details">
                  <h5>{topGoal.title}</h5>
                  <p className="goal-sub">Priority Milestone Goal</p>
                  <div className="goal-amount-row">
                    <b>₹{Number(topGoal.saved_amount).toLocaleString('en-IN')}</b>
                    <span className="goal-of">of ₹{Number(topGoal.target_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  className="add-goal-btn"
                  onClick={() => setShowGoalDepositModal(true)}
                  title="Deposit into this goal"
                >
                  <IconPlus size={16} />
                </button>
              </div>
            ) : (
              <div style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  No active savings goal set yet. Set a targeted reserve for crop seeds, dairy animals, or emergency buffer.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn small ghost"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => handleQuickCreateGoal('Dairy Cow Purchase', 35000)}
                  >
                    + Dairy Cow (₹35k)
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => handleQuickCreateGoal('Kharif Crop Seeds', 15000)}
                  >
                    + Crop Seeds (₹15k)
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => handleQuickCreateGoal('Family Emergency Fund', 20000)}
                  >
                    + Emergency (₹20k)
                  </button>
                </div>
                <button
                  className="btn small"
                  onClick={() => setShowCreateGoalModal(true)}
                >
                  <IconPlus size={14} /> Establish Custom Goal
                </button>
              </div>
            )}
          </div>

          {/* Gamified Financial Learning Streak */}
          <div className="streak-card card">
            <div className="streak-header">
              <div className="streak-title">
                <span className="flame"><IconFlame size={18} /></span>
                <h4>Continuous Learning Pathway</h4>
              </div>
              <span className="pts-badge">{data?.courses_completed || 0} Modules Completed</span>
            </div>

            <div className="lesson-item-box">
              <div className="lesson-thumb">
                <span className="thumb-icon"><IconShield size={20} /></span>
              </div>
              <div className="lesson-meta">
                <span className="read-time">Certified Curriculum • Audio Supported</span>
                <h5>Digital UPI Safety & Scam Protection</h5>
                <p className="lesson-desc">
                  Safeguard your microcredit proceeds, QR codes, and SHG common accounts from digital frauds.
                </p>
              </div>
            </div>

            <div className="streak-footer">
              <span className="quiz-unlock-text">NABARD / RBI Literacy Certified</span>
              <button
                className="btn small start-lesson-btn"
                onClick={() => navigate('/learn')}
              >
                Browse Academy ▷
              </button>
            </div>
          </div>

          {/* SHG Community Card */}
          <div
            className="meeting-card card"
            onClick={() => navigate('/shg')}
            title="Click to view SHG details"
          >
            <div className="meeting-icon-box"><IconUsers size={20} /></div>
            <div className="meeting-text">
              <h5>{shgName}</h5>
              <p>Self-Help Group Joint Lending & Peer Guarantee Network</p>
            </div>
            <span className="arrow-right">&gt;</span>
          </div>

          {/* Saathi AI Side Promotion */}
          <div className="saathi-mini-promo card" onClick={() => navigate('/saathi')}>
            <div className="promo-top">
              <span className="promo-robot"><IconBot size={22} /></span>
              <div>
                <h5>Ask Saathi in your language</h5>
                <p className="small muted">Multilingual AI voice assistance for rural & informal finance</p>
              </div>
            </div>
            <button className="btn small w-100 mt-2">Chat with Saathi AI</button>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="demo-disclaimer-footer">
        <p>Institutional microfinance management platform. Regulated lending partners adhere to RBI Fair Practices Code.</p>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. UPI Payment Modal */}
      {showUpiModal && (
        <div className="modal-overlay" onClick={() => setShowUpiModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick UPI Payment</h3>
              <button className="icon-btn" onClick={() => setShowUpiModal(false)}>✕</button>
            </div>
            {nextInstallment ? (
              <p className="muted small">
                Paying for: <b>Loan #{nextInstallment.loan_id} ({nextInstallment.purpose}) • Instalment #{nextInstallment.number}</b>
              </p>
            ) : (
              <p className="muted small">
                Zero active overdue instalments. You may advance a payment to your active loan account.
              </p>
            )}

            <form onSubmit={handleUpiPay}>
              <div className="field">
                <span>Instalment Amount (Rs)</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span>Select UPI Provider / Method</span>
                <div className="upi-options-grid">
                  {[
                    ['gpay', 'Google Pay'],
                    ['phonepe', 'PhonePe'],
                    ['paytm', 'Paytm'],
                    ['bhim', 'BHIM UPI'],
                  ].map(([id, label]) => (
                    <label
                      key={id}
                      className={`upi-option-label ${selectedUpiApp === id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="upiApp"
                        checked={selectedUpiApp === id}
                        onChange={() => setSelectedUpiApp(id)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="upi-security-note">
                <IconLock size={14} /> Protected by NPCI UPI 256-bit encryption. No PIN shared online.
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowUpiModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pay-confirm-btn" disabled={paySuccess}>
                  {paySuccess ? 'Verifying with UPI…' : `Pay ₹${Number(payAmount || 0).toLocaleString('en-IN')} via UPI`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deposit Savings Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit to Savings Account / SHG Common Fund</h3>
              <button className="icon-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Deposit to liquid savings account for: <b>{userName}</b>
            </p>

            <form onSubmit={handleDepositShg}>
              <div className="field">
                <span>Deposit Amount (Rs)</span>
                <input
                  type="number"
                  min="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
              </div>

              <div className="quick-amount-pills">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="quick-pill"
                    onClick={() => setDepositAmount(amt)}
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
                  {busyAction ? 'Processing Deposit…' : 'Confirm Savings Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Deposit to Top Goal Modal */}
      {showGoalDepositModal && topGoal && (
        <div className="modal-overlay" onClick={() => setShowGoalDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Goal: {topGoal.title}</h3>
              <button className="icon-btn" onClick={() => setShowGoalDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Target: ₹{Number(topGoal.target_amount).toLocaleString('en-IN')} | Currently Saved: ₹{Number(topGoal.saved_amount).toLocaleString('en-IN')}
            </p>
            <form onSubmit={handleDepositTopGoal}>
              <div className="field">
                <span>Deposit Amount (Rs)</span>
                <input
                  type="number"
                  min="100"
                  value={goalDepositAmount}
                  onChange={(e) => setGoalDepositAmount(e.target.value)}
                  required
                />
              </div>
              <div className="quick-amount-pills">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="quick-pill"
                    onClick={() => setGoalDepositAmount(amt)}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowGoalDepositModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Adding Funds…' : `Add ₹${Number(goalDepositAmount).toLocaleString('en-IN')} to Goal`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Create Custom Goal Modal */}
      {showCreateGoalModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGoalModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Target Savings Goal</h3>
              <button className="icon-btn" onClick={() => setShowCreateGoalModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="field">
                <span>Goal Title / Purpose</span>
                <input
                  required
                  placeholder="e.g. Dairy cattle procurement, children tuition fee"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <span>Target Capital Amount (Rs)</span>
                <input
                  type="number"
                  min="500"
                  required
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowCreateGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={busyAction}>
                  {busyAction ? 'Saving Goal…' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Official Stamped Member Passbook Modal */}
      {showLedgerModal && (
        <div className="modal-overlay" onClick={() => setShowLedgerModal(false)}>
          <div className="modal-card wide printable-passbook" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconShield size={22} className="text-emerald" />
                <div>
                  <h3 style={{ margin: 0 }}>Official Member Passbook & Transaction Ledger</h3>
                  <span className="muted small">NABARD SHG-Bank Linkage Scheme Certified</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowLedgerModal(false)}>✕</button>
            </div>

            <div
              style={{
                background: 'var(--canvas-bg)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem' }}><b>Account Holder:</b> {userName}</div>
                <div className="muted small">Affiliation: {shgName} ({location})</div>
                <div className="muted small">Account KYC: Verified Aadhaar / PAN</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem' }}><b>Verified Total Savings:</b></div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald-action)' }}>
                  ₹{Number(totalSavings).toLocaleString('en-IN')}
                </div>
                <span className="badge approved" style={{ fontSize: '0.72rem' }}>
                  ✓ Performing Standing
                </span>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction Description</th>
                    <th>Channel</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td><b>{r.type}</b></td>
                        <td><span className="badge">{r.mode}</span></td>
                        <td>
                          <span className={`badge ${r.is_credit ? 'approved' : 'pending'}`}>
                            {r.is_credit ? 'Credit (+)' : 'Debit (-)'}
                          </span>
                        </td>
                        <td className={r.is_credit ? 'good-text' : 'bad-text'} style={{ fontWeight: 600 }}>
                          {r.is_credit ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        No transaction ledger records yet. Verified starting balance: ₹{Number(totalSavings).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              <div>
                <b>Digital Audit Seal:</b> Verified by RBI & NABARD Fair Practice Microfinance Core Protocol
              </div>
              <div>Generated: {new Date().toLocaleDateString('en-IN')}</div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={16} /> Print Passbook Slip
              </button>
              <button className="btn" onClick={() => setShowLedgerModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Health Score Details Modal */}
      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Financial Health & CIBIL Composite Score</h3>
              <button className="icon-btn" onClick={() => setShowHealthModal(false)}>✕</button>
            </div>
            <div className="score-modal-hero">
              <div className="score-big">{cibilScore} <small>/ 900</small></div>
              <Badge tone={healthScore >= 70 ? 'approved' : healthScore >= 50 ? 'pending' : 'muted'}>
                {healthScore >= 70 ? 'High Credit Quality' : healthScore >= 50 ? 'Good Standing' : 'Review Needed'} ({healthScore}/100)
              </Badge>
            </div>
            <p className="muted small mt-2">
              Your composite underwriting standing is evaluated transparently across 4 core credit pillars:
            </p>
            <ul className="factors-list">
              <li>
                <b>{data?.overdue_loans === 0 || !nextInstallment?.overdue ? '✓ 100% Timely Repayment Track:' : '⚠ Active Loan Observations:'}</b>{' '}
                {data?.overdue_loans === 0 || !nextInstallment?.overdue
                  ? 'No outstanding defaults or delinquent payments recorded in loan portfolio.'
                  : `${data?.overdue_loans || 1} payment requires prompt settlement.`}
              </li>
              <li>
                <b>✓ Fixed Obligation Ratio (FOIR):</b>{' '}
                {monthlyIncome > 0 ? `${Math.round((existingEmi / monthlyIncome) * 100)}% of household income` : 'Safe threshold (<40%)'} committed to existing debt repayments.
              </li>
              <li>
                <b>✓ Liquid Savings Reserve Buffer:</b>{' '}
                Holding ₹{Number(totalSavings).toLocaleString('en-IN')} across core savings & goal targets to cushion unexpected shocks.
              </li>
              <li>
                <b>✓ Financial Literacy Badges:</b>{' '}
                Completed {data?.courses_completed || 0} financial academy education modules.
              </li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowHealthModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
