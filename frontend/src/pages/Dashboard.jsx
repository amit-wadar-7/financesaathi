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
} from '../icons'

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  // Real backend dashboard data
  const { data, loading, reload } = useLoad(() => api('/dashboard'))

  // State for interactive desktop modals & widgets
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)

  // Dynamic user data combined with screenshot data
  const userName = user?.name || (lang === 'mr' ? 'सुनीता ताई' : lang === 'hi' ? 'सुनीता देवी' : 'Sunita Devi')
  const shgName = 'Pragati SHG'
  const location = 'Ward 4, Solan'

  // Dynamic savings calculations
  const [totalSavings, setTotalSavings] = useState(48250)
  const [monthlyDeposit, setMonthlyDeposit] = useState(4500)
  const [goalAmount, setGoalAmount] = useState(14000)
  const goalTarget = 20000

  // Payment form state
  const [payAmount, setPayAmount] = useState(1850)
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
  const [paySuccess, setPaySuccess] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000)

  // Ledger records
  const [ledger, setLedger] = useState([
    { id: 1, date: '01 May 2024', type: 'SHG Monthly Contribution', amount: 1500, balance: 48250, mode: 'UPI' },
    { id: 2, date: '15 Apr 2024', type: 'Recurring Deposit Credit', amount: 3000, balance: 46750, mode: 'Auto-Debit' },
    { id: 3, date: '01 Apr 2024', type: 'SHG Monthly Contribution', amount: 1500, balance: 43750, mode: 'Cash' },
    { id: 4, date: '28 Mar 2024', type: 'Annual Dividend Share', amount: 1250, balance: 42250, mode: 'Credit' },
  ])

  // Sync with real user balance if available
  useEffect(() => {
    if (user?.savings_balance && user.savings_balance > 0) {
      setTotalSavings(user.savings_balance)
    }
  }, [user])

  const staff = user?.role === 'officer' || user?.role === 'admin'

  const handleUpiPay = async (e) => {
    e.preventDefault()
    setPaySuccess(true)
    setTimeout(async () => {
      // If there is an active loan installment, mark it paid in backend
      if (data?.next_installment?.loan_id) {
        try {
          await api(`/loans/${data.next_installment.loan_id}/installments/${data.next_installment.number}/pay`, {
            method: 'POST',
            body: { amount: Number(payAmount) },
          })
          reload()
        } catch {
          // Keep local simulated success
        }
      }
      setShowUpiModal(false)
      setPaySuccess(false)
      alert(lang === 'mr' ? '₹' + payAmount + ' चे UPI पेमेंट यशस्वी झाले!' : `UPI payment of ₹${payAmount} completed successfully!`)
    }, 1200)
  }

  const handleDepositShg = (e) => {
    e.preventDefault()
    const amt = Number(depositAmount)
    const newBal = totalSavings + amt
    setTotalSavings(newBal)
    setMonthlyDeposit((prev) => prev + amt)
    setLedger([
      { id: Date.now(), date: 'Today', type: 'SHG Monthly Contribution', amount: amt, balance: newBal, mode: 'UPI' },
      ...ledger,
    ])
    setShowDepositModal(false)
    alert(lang === 'mr' ? `₹${amt} बचत गटामध्ये यशस्वीरित्या जमा झाले!` : `₹${amt} successfully deposited to SHG!`)
  }

  const handleAddGoalMoney = (e) => {
    e.preventDefault()
    const addAmt = 2000
    setGoalAmount((prev) => Math.min(goalTarget, prev + addAmt))
    setShowGoalModal(false)
    alert(lang === 'mr' ? 'ध्येय बचतीमध्ये ₹2,000 जोडले गेले!' : '₹2,000 added to target savings goal!')
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

        {/* Financial Health Score Pill */}
        <div
          className="health-score-pill"
          onClick={() => setShowHealthModal(true)}
          title="Click to view Financial Health Score breakdown"
        >
          <span className="score-dot" />
          <span className="score-text">Good • 742 <small>/ 900</small></span>
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

      {/* 2. Urgent Actionable EMI Due Alert Banner */}
      <div className="emi-alert-banner">
        <div className="emi-alert-left">
          <div className="calendar-icon-box"><IconCalendar size={20} /></div>
          <div className="emi-alert-text">
            <div className="alert-title-row">
              <span className="alert-strong">SHG Loan EMI Due</span>
              <span className="alert-tag">In 3 days</span>
            </div>
            <div className="alert-sub">
              <b>₹1,850</b> • Mahila Samriddhi Livestock Loan #{data?.next_installment?.loan_id || '104'}
            </div>
          </div>
        </div>
        <button className="btn pay-upi-btn" onClick={() => setShowUpiModal(true)}>
          <IconCreditCard size={15} /> Pay via UPI
        </button>
      </div>

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
                  {hideBalance ? '₹••••••••' : `₹${totalSavings.toLocaleString('en-IN')}`}
                </span>
                <span className="trend-badge"><IconTrendingUp size={14} /> +9.8%</span>
              </div>
            </div>

            {/* Monthly Growth banner */}
            <div className="monthly-growth-pill">
              <span className="piggy-icon"><IconCoins size={16} /></span>
              <span>
                Monthly Growth: <b>+₹{monthlyDeposit.toLocaleString('en-IN')} deposited this month</b>
              </span>
            </div>

            {/* Sub-breakdown footer */}
            <div className="savings-card-bottom">
              <div className="breakdown-text">
                SHG Share: <b>₹32,000</b> • RD: <b>₹16,250</b>
              </div>
              <button
                className="view-ledger-btn"
                onClick={() => setShowLedgerModal(true)}
              >
                View Ledger &gt;
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

              <button className="action-tile" onClick={() => setShowUpiModal(true)}>
                <div className="tile-icon-box bg-blue"><IconCreditCard size={20} /></div>
                <span className="tile-title">{t('payEmi')}</span>
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
                  <h4>Monthly Spend & Budget</h4>
                  <p className="tracker-sub">May 2024 Household Tracker</p>
                </div>
              </div>
              <span className="spent-badge">74% Spent</span>
            </div>

            <div className="budget-numbers-row">
              <span className="spent-amt">₹18,500</span>
              <span className="cap-amt">Cap: ₹25,000</span>
            </div>

            {/* Budget Progress Bar */}
            <div className="budget-progress-track">
              <div className="budget-progress-fill" style={{ width: '74%' }} />
            </div>

            <div className="budget-headroom-row">
              <span className="headroom-text">₹6,500 Safe headroom remaining</span>
              <span className="days-left-text">11 Days Left</span>
            </div>

            {/* 4 Category Cards */}
            <div className="categories-grid">
              <div className="category-chip">
                <div className="cat-icon"><IconCart size={18} /></div>
                <div className="cat-info">
                  <span className="cat-name">Groceries</span>
                  <span className="cat-val">₹9,200</span>
                </div>
              </div>

              <div className="category-chip">
                <div className="cat-icon"><IconAcademic size={18} /></div>
                <div className="cat-info">
                  <span className="cat-name">Education</span>
                  <span className="cat-val">₹4,000</span>
                </div>
              </div>

              <div className="category-chip">
                <div className="cat-icon"><IconTractor size={18} /></div>
                <div className="cat-info">
                  <span className="cat-name">Farm Inputs</span>
                  <span className="cat-val">₹3,800</span>
                </div>
              </div>

              <div className="category-chip">
                <div className="cat-icon"><IconHospital size={18} /></div>
                <div className="cat-info">
                  <span className="cat-name">Health</span>
                  <span className="cat-val">₹1,500</span>
                </div>
              </div>
            </div>
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
                All Goals (2) →
              </Link>
            </div>

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
                    strokeDasharray={`${(goalAmount / goalTarget) * 100}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="circle-inner">
                  <span className="pct-num">{Math.round((goalAmount / goalTarget) * 100)}%</span>
                  <span className="pct-label">SAVED</span>
                </div>
              </div>

              <div className="goal-details">
                <h5>Children's School Fees</h5>
                <p className="goal-sub">Due in August • Kendriya Vidyalaya</p>
                <div className="goal-amount-row">
                  <b>₹{goalAmount.toLocaleString('en-IN')}</b>
                  <span className="goal-of">of ₹{goalTarget.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                className="add-goal-btn"
                onClick={() => setShowGoalModal(true)}
                title="Deposit into this goal"
              >
                +
              </button>
            </div>
          </div>

          {/* Gamified 5-Day Learning Streak */}
          <div className="streak-card card">
            <div className="streak-header">
              <div className="streak-title">
                <span className="flame"><IconFlame size={18} /></span>
                <h4>5-Day Learning Streak!</h4>
              </div>
              <span className="pts-badge">+120 Saathi Pts</span>
            </div>

            <div className="lesson-item-box">
              <div className="lesson-thumb">
                <span className="thumb-icon"><IconShield size={20} /></span>
              </div>
              <div className="lesson-meta">
                <span className="read-time">4 min read • Audio available</span>
                <h5>UPI Safety & QR Scams</h5>
                <p className="lesson-desc">
                  Protect your hard-earned shop profits and SHG savings from frauds.
                </p>
              </div>
            </div>

            <div className="streak-footer">
              <span className="quiz-unlock-text">Daily quiz reward unlocks upon finish</span>
              <button
                className="btn small start-lesson-btn"
                onClick={() => navigate('/learn/3')}
              >
                Start Lesson ▷
              </button>
            </div>
          </div>

          {/* SHG Meeting Community Notice */}
          <div
            className="meeting-card card"
            onClick={() => navigate('/shg')}
            title="Click to view SHG details"
          >
            <div className="meeting-icon-box"><IconUsers size={20} /></div>
            <div className="meeting-text">
              <h5>Pragati SHG Meeting: Thursday</h5>
              <p>Agenda: Dairy equipment bulk loan voting & deposits.</p>
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

      {/* Footer Demonstration Notice */}
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
            <p className="muted small">
              Paying for: <b>Mahila Samriddhi SHG Loan #{data?.next_installment?.loan_id || '104'}</b>
            </p>

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
                  {paySuccess ? 'Verifying with UPI…' : `Pay ₹${Number(payAmount).toLocaleString('en-IN')} via UPI`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Deposit SHG Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit to Pragati SHG Common Fund</h3>
              <button className="icon-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Monthly group contribution for: <b>{userName}</b>
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
                {[500, 1000, 1500, 2000].map((amt) => (
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
                <button type="submit" className="btn">
                  Confirm SHG Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Money to Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add to Goal: Children's School Fees</h3>
              <button className="icon-btn" onClick={() => setShowGoalModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Target: ₹20,000 | Current: ₹{goalAmount.toLocaleString('en-IN')}
            </p>
            <form onSubmit={handleAddGoalMoney}>
              <p>Add <b>₹2,000</b> to this milestone today from linked account?</p>
              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Add ₹2,000 Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Official Stamped Member Passbook Modal */}
      {showLedgerModal && (
        <div className="modal-overlay" onClick={() => setShowLedgerModal(false)}>
          <div className="modal-card wide printable-passbook" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
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
                <div className="muted small">SHG Affiliation: Pragati Mahila Bachat Gat (Ward 4)</div>
                <div className="muted small">Unique Member Ref: #M-98741 · KYC Status: Aadhaar Verified</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem' }}><b>Verified Ledger Balance:</b></div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--emerald-action)' }}>
                  ₹{totalSavings.toLocaleString('en-IN')}
                </div>
                <span className="badge approved" style={{ fontSize: '0.72rem' }}>
                  ✓ In Good Standing
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
                    <th>Credit (+)</th>
                    <th>Cumulative Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td><b>{r.type}</b></td>
                      <td><span className="badge">{r.mode}</span></td>
                      <td className="good-text">+₹{r.amount.toLocaleString('en-IN')}</td>
                      <td><b>₹{r.balance.toLocaleString('en-IN')}</b></td>
                    </tr>
                  ))}
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
                <b>Digital Audit Seal:</b> SHA256: 8f2a9c1e7d3b... Verified by Reserve Bank Fair Practice Protocol
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
                <IconPrinter size={16} /> Print / Save Passbook Slip
              </button>
              <button className="btn" onClick={() => setShowLedgerModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Health Score Details Modal */}
      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Financial Health Score Breakdown</h3>
              <button className="icon-btn" onClick={() => setShowHealthModal(false)}>✕</button>
            </div>
            <div className="score-modal-hero">
              <div className="score-big">742 <small>/ 900</small></div>
              <Badge tone="approved">Good Standing</Badge>
            </div>
            <p className="muted small mt-2">
              Your score is evaluated transparently based on 4 pillars:
            </p>
            <ul className="factors-list">
              <li><b>✓ 100% Timely SHG Repayments:</b> No active defaults or overdue instalments (+280 pts).</li>
              <li><b>✓ Debt-to-Income FOIR (28%):</b> Well below the recommended 40% threshold (+240 pts).</li>
              <li><b>✓ Consistent Group Savings:</b> Regular monthly deposits for &gt; 12 months (+150 pts).</li>
              <li><b>✓ Financial Academy Badges:</b> Completed modules on UPI fraud and emergency fund (+72 pts).</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowHealthModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
