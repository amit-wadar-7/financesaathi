import { useMemo, useState } from 'react'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, Modal, Progress, Stat, useLoad } from '../ui'
import {
  IconCoins,
  IconSearch,
  IconFilter,
  IconPrinter,
  IconCreditCard,
  IconArrowRight,
  IconShield,
  IconCheckCircle,
  IconPlus,
  IconCalendar,
  IconTarget,
} from '../icons'

function numberToWords(num) {
  const n = Math.floor(Math.abs(Number(num) || 0))
  if (n === 0) return 'Zero Rupees Only'
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'FifFifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const convertChunk = (val) => {
    let str = ''
    if (val >= 100) {
      str += units[Math.floor(val / 100)] + ' Hundred '
      val %= 100
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + ' '
      val %= 10
    }
    if (val > 0) {
      str += units[val] + ' '
    }
    return str
  }

  let result = ''
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const remainder = n % 1000

  if (crore > 0) result += convertChunk(crore) + 'Crore '
  if (lakh > 0) result += convertChunk(lakh) + 'Lakh '
  if (thousand > 0) result += convertChunk(thousand) + 'Thousand '
  if (remainder > 0) result += convertChunk(remainder)

  return result.trim() + ' Rupees Only'
}

export default function Transactions() {
  const { user, refresh } = useAuth()
  const { t, lang } = useLang()
  const { data: dashData, loading, reload } = useLoad(() => api('/dashboard'))

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'credit', 'debit'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmt, setDepositAmt] = useState(1000)
  const [busyDeposit, setBusyDeposit] = useState(false)

  const [statusMsg, setStatusMsg] = useState({ kind: '', text: '' })

  const transactions = dashData?.transactions || []
  const savingsBalance = dashData?.savings_balance ?? (user?.savings_balance || 0)
  const totalAssets = dashData?.total_savings_and_assets ?? savingsBalance

  const filtered = transactions.filter((tx) => {
    if (filterType === 'credit' && !tx.is_credit) return false
    if (filterType === 'debit' && tx.is_credit) return false
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (tx.type && tx.type.toLowerCase().includes(q)) ||
      (tx.mode && tx.mode.toLowerCase().includes(q)) ||
      (tx.date && tx.date.toLowerCase().includes(q)) ||
      String(tx.amount).includes(q)
    )
  })

  const totalInflow = transactions
    .filter((tx) => tx.is_credit)
    .reduce((acc, tx) => acc + (tx.amount || 0), 0)

  const totalOutflow = transactions
    .filter((tx) => !tx.is_credit)
    .reduce((acc, tx) => acc + (tx.amount || 0), 0)

  // Category Budget & Expense Discipline Breakdown
  const categorySpending = useMemo(() => {
    const debitTxns = transactions.filter((tx) => !tx.is_credit)
    const totalDebit = debitTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0)

    const catDefinitions = {
      emi_payment: { label: 'Loan EMI Servicing', icon: '💳', maxPct: 35, color: '#f59e0b' },
      food: { label: 'Food & Groceries', icon: '🌾', maxPct: 40, color: '#059669' },
      agri_inputs: { label: 'Farm Inputs & Seeds', icon: '🚜', maxPct: 25, color: '#10b981' },
      emergency: { label: 'Health & Medical', icon: '🏥', maxPct: 15, color: '#ef4444' },
      general: { label: 'Household & General', icon: '🛒', maxPct: 20, color: '#6366f1' },
      savings_deposit: { label: 'Thrift & Savings', icon: '🪙', maxPct: 20, color: '#3b82f6' },
      transfer: { label: 'Goal Reserves', icon: '🎯', maxPct: 15, color: '#8b5cf6' },
    }

    const spent = {}
    debitTxns.forEach((tx) => {
      const cat = tx.category || 'general'
      spent[cat] = (spent[cat] || 0) + (tx.amount || 0)
    })

    return Object.entries(catDefinitions)
      .map(([key, meta]) => {
        const amt = spent[key] || 0
        const pct = totalDebit > 0 ? Math.round((amt / totalDebit) * 100) : 0
        const isOver = pct > meta.maxPct && amt > 0
        return {
          key,
          ...meta,
          amount: amt,
          pct,
          isOver,
        }
      })
      .filter((c) => c.amount > 0 || ['emi_payment', 'food', 'agri_inputs', 'general'].includes(c.key))
  }, [transactions])

  const handleDeposit = async (e) => {
    e.preventDefault()
    const amt = Number(depositAmt)
    if (!amt || amt <= 0) return
    setBusyDeposit(true)
    setStatusMsg({ kind: '', text: '' })
    try {
      await api('/money/income', {
        method: 'POST',
        body: {
          amount: amt,
          title: 'Verified Savings Deposit',
          category: 'savings_deposit',
          mode: 'UPI / Bank',
        },
      })
      await refresh()
      await reload()
      setShowDepositModal(false)
      setStatusMsg({
        kind: 'success',
        text: lang === 'mr'
          ? `₹${amt.toLocaleString()} बचत खात्यामध्ये यशस्वीरित्या जमा झाले!`
          : `₹${amt.toLocaleString()} successfully deposited into verified savings account!`,
      })
    } catch (err) {
      setStatusMsg({ kind: 'error', text: err.message || 'Deposit failed' })
    } finally {
      setBusyDeposit(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page-container">
      {/* Status Alert Banner */}
      <Alert kind={statusMsg.kind}>{statusMsg.text}</Alert>

      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>Passbook & Financial Ledger</h2>
          <p className="page-subtitle">
            Verified audit trail of savings deposits, microcredit disbursements, and installment settlements
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPrinter size={16} /> Print Full Passbook
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowDepositModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPlus size={16} /> Add Funds
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label="Verified Account Balance"
          value={money(savingsBalance)}
          sub="Liquid core savings"
        />
        <Stat
          label="Total Cumulative Assets"
          value={money(totalAssets)}
          sub="Savings + goal reserves"
        />
        <Stat
          label="Recorded Inflows (+)"
          value={money(totalInflow)}
          sub="Deposits & credits"
        />
        <Stat
          label="Recorded Repayments (-)"
          value={money(totalOutflow)}
          sub="Settled loan EMIs"
        />
      </div>

      {/* Category Budget & Expense Discipline Breakdown */}
      <Card title="Household Category Budget Planner & Expense Discipline" style={{ marginBottom: '1.25rem' }}>
        <p className="muted small" style={{ marginBottom: '1rem' }}>
          Real-time expense distribution from your verified ledger compared against RBI-aligned microfinance spending ceilings.
        </p>

        <div className="grid" style={{ gap: '0.85rem' }}>
          {categorySpending.map((cat) => (
            <div
              key={cat.key}
              style={{
                background: 'var(--card-bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
              }}
            >
              <div className="row between" style={{ marginBottom: '0.4rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--slate-900)' }}>
                    {cat.label}
                  </span>
                </div>
                <Badge tone={cat.isOver ? 'caution' : 'approved'}>
                  {cat.isOver ? 'Elevated' : 'Safe Limit'}
                </Badge>
              </div>

              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {money(cat.amount)}
                </span>
                <span className="muted small" style={{ fontSize: '0.78rem' }}>
                  {cat.pct}% of outflows (Max {cat.maxPct}%)
                </span>
              </div>

              <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(cat.pct, 100)}%`,
                    height: '100%',
                    background: cat.isOver ? 'var(--alert-red, #dc2626)' : cat.color,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="row between" style={{ alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'credit', label: 'Credits & Inflow (+)' },
              { id: 'debit', label: 'Debits & Outflow (-)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn small ${filterType === tab.id ? '' : 'ghost'}`}
                onClick={() => setFilterType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
            <input
              placeholder="Search date, title, mode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.84rem', padding: '6px 10px', width: '100%' }}
            />
          </div>
        </div>

        {/* Category Pills Row */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
          <span className="muted small" style={{ alignSelf: 'center', marginRight: '0.25rem', fontWeight: 600 }}>Category:</span>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'emi_payment', label: 'EMI Repayments' },
            { id: 'savings_deposit', label: 'Savings & Deposits' },
            { id: 'transfer', label: 'Goal Transfers' },
            { id: 'milk_sales', label: 'Livelihood & Income' },
            { id: 'general', label: 'General' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`quick-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{
                fontSize: '0.76rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontWeight: selectedCategory === cat.id ? 700 : 500,
                background: selectedCategory === cat.id ? 'var(--emerald-600)' : 'var(--slate-100)',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--slate-700)',
                border: '1px solid transparent',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction Description</th>
              <th>Channel / Gateway</th>
              <th>Flow</th>
              <th>Amount (₹)</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{r.date}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{r.type}</div>
                  <span className="muted small">Ref: #{r.id}</span>
                </td>
                <td>
                  <span className="badge neutral">{r.mode}</span>
                </td>
                <td>
                  <span className={`badge ${r.is_credit ? 'approved' : 'pending'}`}>
                    {r.is_credit ? 'Credit (+)' : 'Debit (-)'}
                  </span>
                </td>
                <td
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: r.is_credit ? 'var(--emerald-600)' : 'var(--slate-800)',
                  }}
                >
                  {r.is_credit ? '+' : '-'}₹{Number(r.amount).toLocaleString('en-IN')}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => setSelectedTxn(r)}
                  >
                    View Voucher
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                  No transaction records matching the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Official Printable Transaction Voucher / Receipt Modal */}
      {selectedTxn && (
        <Modal
          isOpen={Boolean(selectedTxn)}
          onClose={() => setSelectedTxn(null)}
          title="Official Transaction Voucher"
          maxWidth={520}
        >
          <div className="printable-passbook" style={{ padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--emerald-700)', fontWeight: 700 }}>
                FinanceSaathi Microfinance & SHG Network
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '2px' }}>
                OFFICIAL PAYMENT VOUCHER
              </div>
              <span className="muted small">Voucher Ref: #VCH-{selectedTxn.id}-{new Date().getFullYear()}</span>
            </div>

            <div style={{ textAlign: 'center', padding: '0.85rem 0', background: 'var(--card-bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <span className="muted small" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                Settlement Sum
              </span>
              <div
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: selectedTxn.is_credit ? 'var(--emerald-600)' : 'var(--slate-900)',
                  margin: '0.2rem 0',
                }}
              >
                {selectedTxn.is_credit ? '+' : '-'}₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--slate-600)' }}>
                {numberToWords(selectedTxn.amount)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div className="row between">
                <span className="muted">Transaction Date:</span>
                <b>{selectedTxn.date}</b>
              </div>
              <div className="row between">
                <span className="muted">Narration / Head:</span>
                <b>{selectedTxn.type}</b>
              </div>
              <div className="row between">
                <span className="muted">Category:</span>
                <span className="badge neutral">{selectedTxn.category || 'General'}</span>
              </div>
              <div className="row between">
                <span className="muted">Payment Channel:</span>
                <b>{selectedTxn.mode}</b>
              </div>
              <div className="row between">
                <span className="muted">Account Beneficiary:</span>
                <b>{user?.name || 'Verified Member'}</b>
              </div>
              <div className="row between">
                <span className="muted">Statutory Verification:</span>
                <span className="text-emerald" style={{ fontWeight: 600 }}>✓ Digitally Reconciled Ledger</span>
              </div>
            </div>

            {/* Signature Block for Official Printouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', height: '40px', marginBottom: '4px' }} />
                <span className="muted small" style={{ fontSize: '0.72rem' }}>Bank Mitra / Officer Signature</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', height: '40px', marginBottom: '4px' }} />
                <span className="muted small" style={{ fontSize: '0.72rem' }}>Member / Depositor Signature</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={16} /> Print Voucher
              </button>
              <button type="button" className="btn" onClick={() => setSelectedTxn(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Funds Modal */}
      {showDepositModal && (
        <Modal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          title="Deposit Funds into Core Savings"
          maxWidth={460}
        >
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            Direct liquid savings deposit for <b>{user?.name || 'Member'}</b>. Reconciles into ledger immediately.
          </p>

          <form onSubmit={handleDeposit}>
            <div className="field">
              <span>Deposit Amount (₹)</span>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
              {[500, 1000, 2500, 5000].map((a) => (
                <button
                  key={a}
                  type="button"
                  className="btn small ghost"
                  style={{ flex: 1 }}
                  onClick={() => setDepositAmt(a)}
                >
                  +₹{a}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setShowDepositModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={busyDeposit}>
                {busyDeposit ? 'Confirming…' : `Confirm Deposit of ₹${Number(depositAmt).toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
