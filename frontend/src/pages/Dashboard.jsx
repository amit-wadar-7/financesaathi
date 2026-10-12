import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, useLoad } from '../ui'
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
} from '../icons'

export default function Dashboard() {
  const { user, refresh } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  // Real backend dashboard data
  const { data, loading, reload } = useLoad(() => api('/dashboard'))

  // State for interactive modals
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay')
  const [paySuccess, setPaySuccess] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000)
  const [busyAction, setBusyAction] = useState(false)

  // Quick Dashboard Calculator State
  const [dashAmount, setDashAmount] = useState(30000)
  const [dashTenure, setDashTenure] = useState(12)
  const dashRate = 8.5
  const dashEmi = Math.round(
    (dashAmount * (dashRate / 1200) * Math.pow(1 + dashRate / 1200, dashTenure)) /
      (Math.pow(1 + dashRate / 1200, dashTenure) - 1)
  )

  // Dynamic user data
  const userName = user?.name || data?.name || 'Member'
  const shgName = data?.shg?.name || (user?.shg_id ? `SHG Group #${user.shg_id}` : 'Direct Individual Account')
  const location = data?.shg?.village || user?.phone || 'Aadhaar Verified'

  const totalSavings = data?.total_savings_and_assets ?? (user?.savings_balance || 0)
  const savingsBalance = data?.savings_balance ?? (user?.savings_balance || 0)
  const totalSavedInGoals = data?.total_saved ?? 0
  const nextInstallment = data?.next_installment || null
  const topGoal = data?.top_goal || null
  const cibilScore = data?.cibil_score || 740
  const healthScore = data?.health_score || 78
  const transactions = data?.transactions || []

  // Dynamic household financials
  const monthlyIncome = data?.monthly_income || user?.monthly_income || 0
  const monthlyExpenses = data?.monthly_expenses || user?.monthly_expenses || 0
  const existingEmi = data?.existing_emi || user?.existing_emi || (nextInstallment ? nextInstallment.amount : 0)
  const totalOutflow = monthlyExpenses + existingEmi
  const budgetHeadroom = Math.max(0, monthlyIncome - totalOutflow)
  const spentPct = monthlyIncome > 0 ? Math.min(100, Math.round((totalOutflow / monthlyIncome) * 100)) : 0
  const foirPct = monthlyIncome > 0 ? Math.round((existingEmi / monthlyIncome) * 100) : 0

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
        alert(lang === 'mr' ? `₹${payAmount} चे UPI पेमेंट यशस्वी झाले!` : `UPI payment of ₹${payAmount} settled successfully!`)
      }, 1000)
    } catch (err) {
      setPaySuccess(false)
      alert(err.message || 'Payment processing error')
    }
  }

  const handleDeposit = async (e) => {
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
      alert(lang === 'mr' ? `₹${amt} बचत खात्यामध्ये जमा झाले!` : `₹${amt} deposited successfully to savings!`)
    } catch (err) {
      alert(err.message || 'Deposit failed')
    } finally {
      setBusyAction(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page-container">
      {/* 1. Account Hero Header */}
      <div className="card hero-account-card">
        <div className="hero-account-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Verified Liquid Balance
              </span>
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setHideBalance(!hideBalance)}
                title={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>

            <div className="hero-balance-val">
              {hideBalance ? '₹••••••••' : `₹${Number(totalSavings).toLocaleString('en-IN')}`}
            </div>

            <div className="hero-subtext">
              Account Holder: <b>{userName}</b> • {shgName} ({location})
            </div>
          </div>

          <div className="hero-actions-group">
            <button
              type="button"
              className="btn emerald"
              onClick={() => setShowDepositModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconPlus size={16} /> Add Funds
            </button>
            <Link
              to="/loans"
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconCreditCard size={16} /> Apply for Loan
            </Link>
            <div
              className="health-badge-btn"
              onClick={() => setShowHealthModal(true)}
              title="Click for CIBIL breakdown"
            >
              <span className="score-dot" />
              <span>CIBIL Score: <b>{cibilScore}</b> / 900</span>
              <IconInfo size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Notice (if Officer / Admin) */}
      {staff && (
        <div className="card" style={{ marginBottom: '1.25rem', background: '#f8fafc', borderLeft: '4px solid var(--slate-900)' }}>
          <div className="row between" style={{ alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 0.2rem 0' }}>Staff Lending Terminal Active</h4>
              <p className="muted small" style={{ margin: 0 }}>
                {data?.pending_review || 0} applications awaiting underwriting review • {data?.overdue_loans || 0} overdue facilities.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/at-risk" className="btn small ghost">Risk Alerts</Link>
              <Link to="/loans" className="btn small">Review Applications</Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Primary Action Banner: Active Repayment Due vs Pre-Approved Offer */}
      {nextInstallment ? (
        <div className="emi-alert-banner">
          <div className="emi-alert-left">
            <div className="calendar-icon-box"><IconCalendar size={20} /></div>
            <div className="emi-alert-text">
              <div className="alert-title-row">
                <span className="alert-strong">
                  {nextInstallment.overdue ? 'Overdue Loan EMI' : 'Scheduled Installment Due'}
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
              <h4>Credit Profile in Good Standing — Zero Outstanding Overdues</h4>
              <p>
                You hold active pre-sanction eligibility across Kisan Agri, MUDRA MSME, and PM-KUSUM Solar facilities up to ₹1,50,000.
              </p>
            </div>
          </div>
          <Link
            to="/loans"
            className="btn small ghost"
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            Explore Loan Facilities <IconArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3. Main Two-Column Content Grid */}
      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Quick Interactive Loan Calculator */}
          <div className="card">
            <div className="row between" style={{ alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconCalculator size={20} className="text-emerald" />
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Instant Loan EMI Appraisal</h3>
              </div>
              <span className="badge approved">8.5% Base Rate</span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                <span className="muted">Principal Amount:</span>
                <b>₹{dashAmount.toLocaleString('en-IN')}</b>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="5000"
                max="150000"
                step="5000"
                value={dashAmount}
                onChange={(e) => setDashAmount(Number(e.target.value))}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                <span className="muted">Repayment Tenure:</span>
                <b>{dashTenure} Months</b>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="3"
                max="36"
                step="3"
                value={dashTenure}
                onChange={(e) => setDashTenure(Number(e.target.value))}
              />
            </div>

            <div
              style={{
                background: 'var(--slate-50)',
                padding: '0.85rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span className="muted small">Monthly Repayment:</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  ₹{dashEmi.toLocaleString('en-IN')} <small style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ mo</small>
                </div>
              </div>
              <Link
                to={`/loans/new?amount=${dashAmount}&tenure=${dashTenure}&rate=${dashRate}`}
                className="btn small"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Apply for This Facility <IconArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Recent Financial Activity / Ledger Preview */}
          <div className="card">
            <div className="row between" style={{ alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Recent Account Activity</h3>
              <Link to="/transactions" className="small" style={{ fontWeight: 600 }}>
                View Full Passbook →
              </Link>
            </div>

            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Mode</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{r.type}</div>
                      </td>
                      <td>
                        <span className="badge neutral" style={{ fontSize: '0.7rem' }}>{r.mode}</span>
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: r.is_credit ? 'var(--emerald-600)' : 'var(--slate-900)',
                        }}
                      >
                        {r.is_credit ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Household Cashflow & Safe Borrowing Headroom */}
          <div className="card">
            <div className="row between" style={{ alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Household Cashflow & Capacity</h3>
              <Link to="/profile" className="small">
                Adjust Profile →
              </Link>
            </div>

            {monthlyIncome > 0 ? (
              <div>
                <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                  <span className="muted">Total Monthly Outflow (Expenses + EMIs):</span>
                  <b>₹{totalOutflow.toLocaleString('en-IN')} of ₹{monthlyIncome.toLocaleString('en-IN')}</b>
                </div>

                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: `${spentPct}%`,
                      background: spentPct > 80 ? '#ef4444' : 'var(--emerald-600)',
                      height: '100%',
                    }}
                  />
                </div>

                <div className="row between small" style={{ padding: '0.6rem', background: 'var(--slate-50)', borderRadius: '6px' }}>
                  <span>Safe Surplus Cashflow:</span>
                  <b className="text-emerald">₹{budgetHeadroom.toLocaleString('en-IN')} / mo</b>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                  Add your household monthly income and expenses to unlock live debt capacity analysis.
                </p>
                <Link to="/profile" className="btn small">
                  Configure Income in Profile
                </Link>
              </div>
            )}
          </div>

          {/* Featured Government Schemes Spotlight */}
          <div className="card">
            <div className="row between" style={{ alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconLandmark size={18} className="text-emerald" />
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Flagship Welfare Schemes</h3>
              </div>
              <Link to="/schemes" className="small" style={{ fontWeight: 600 }}>
                All Schemes →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  code: 'PM-KISAN',
                  name: 'Pradhan Mantri Kisan Samman Nidhi',
                  grant: '₹6,000 / yr DBT',
                  tag: 'Agriculture',
                },
                {
                  code: 'PMMY',
                  name: 'Pradhan Mantri MUDRA Yojana',
                  grant: 'Up to ₹10 Lakh',
                  tag: 'MSME Business',
                },
                {
                  code: 'PM-SVANidhi',
                  name: "Street Vendor's AtmaNirbhar Nidhi",
                  grant: '7% Interest Subsidy',
                  tag: 'Urban Vendors',
                },
                {
                  code: 'PM-KUSUM',
                  name: 'Solar Irrigation Pump Subsidy',
                  grant: '60% Capital Subsidy',
                  tag: 'Clean Energy',
                },
              ].map((sch) => (
                <div
                  key={sch.code}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sch.code}</span>
                      <span className="badge neutral" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{sch.tag}</span>
                    </div>
                    <div className="muted small" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
                      {sch.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="text-emerald" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {sch.grant}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/schemes" className="btn small ghost w-100 mt-2" style={{ textAlign: 'center', display: 'block' }}>
              Check All Scheme Eligibilities
            </Link>
          </div>

          {/* Active Target Savings Goal */}
          {topGoal && (
            <div className="card">
              <div className="row between" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <IconTarget size={18} className="text-emerald" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Priority Goal: {topGoal.title}</h4>
                </div>
                <span className="badge approved">{Math.round(topGoal.progress_pct)}%</span>
              </div>
              <div className="row between small" style={{ marginBottom: '0.4rem' }}>
                <span>Saved: <b>₹{Number(topGoal.saved_amount).toLocaleString('en-IN')}</b></span>
                <span className="muted">Target: ₹{Number(topGoal.target_amount).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, topGoal.progress_pct)}%`, background: 'var(--emerald-600)', height: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. UPI Payment Modal */}
      {showUpiModal && (
        <div className="modal-overlay" onClick={() => setShowUpiModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settle Loan Installment via UPI</h3>
              <button className="icon-btn" onClick={() => setShowUpiModal(false)}>✕</button>
            </div>
            {nextInstallment && (
              <p className="muted small">
                Paying for: <b>Loan #{nextInstallment.loan_id} ({nextInstallment.purpose}) • Instalment #{nextInstallment.number}</b>
              </p>
            )}

            <form onSubmit={handleUpiPay}>
              <div className="field">
                <span>Amount to Pay (Rs)</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <span>Select UPI App</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    ['gpay', 'Google Pay'],
                    ['phonepe', 'PhonePe'],
                    ['paytm', 'Paytm'],
                    ['bhim', 'BHIM UPI'],
                  ].map(([id, label]) => (
                    <label
                      key={id}
                      style={{
                        padding: '0.5rem',
                        border: selectedUpiApp === id ? '2px solid var(--emerald-600)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        background: selectedUpiApp === id ? '#ecfdf5' : '#ffffff',
                      }}
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

              <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '6px', fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                <IconLock size={14} /> Protected by NPCI UPI 256-bit encryption. No PIN stored.
              </div>

              <div className="modal-actions">
                <button type="button" className="btn ghost" onClick={() => setShowUpiModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={paySuccess}>
                  {paySuccess ? 'Verifying with UPI…' : `Pay ₹${Number(payAmount || 0).toLocaleString('en-IN')} via UPI`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Funds Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Funds to Core Savings</h3>
              <button className="icon-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Deposit to liquid savings account for: <b>{userName}</b>
            </p>

            <form onSubmit={handleDeposit}>
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

              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn small ghost"
                    style={{ flex: 1 }}
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
                  {busyAction ? 'Processing…' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Health Score Details Modal */}
      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Financial Health & CIBIL Composite Score</h3>
              <button className="icon-btn" onClick={() => setShowHealthModal(false)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {cibilScore} <small style={{ fontSize: '1rem', color: '#64748b' }}>/ 900</small>
              </div>
              <Badge tone={healthScore >= 70 ? 'approved' : 'pending'}>
                {healthScore >= 70 ? 'High Credit Quality' : 'Moderate Standing'}
              </Badge>
            </div>

            <div style={{ padding: '1rem 0' }}>
              <p className="muted small" style={{ marginBottom: '0.75rem' }}>
                Underwriting composite evaluation parameters:
              </p>
              <ul className="factors-list" style={{ paddingLeft: '1rem', fontSize: '0.84rem' }}>
                <li><b>Repayment Track Record:</b> {data?.overdue_loans === 0 ? '100% clean history with zero delinquent payments' : `${data?.overdue_loans} overdue payment flag`}</li>
                <li><b>Debt Service Ratio (FOIR):</b> {foirPct}% of household income currently committed to existing debts (Threshold: 40%)</li>
                <li><b>Liquid Reserve Cushion:</b> ₹{Number(totalSavings).toLocaleString('en-IN')} available across core liquid balances</li>
              </ul>
            </div>

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
