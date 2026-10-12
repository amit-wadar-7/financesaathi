import { useState } from 'react'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Loading, Stat, useLoad } from '../ui'
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
} from '../icons'

export default function Transactions() {
  const { user, refresh } = useAuth()
  const { t, lang } = useLang()
  const { data: dashData, loading, reload } = useLoad(() => api('/dashboard'))

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'credit', 'debit'
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmt, setDepositAmt] = useState(1000)
  const [busyDeposit, setBusyDeposit] = useState(false)

  const transactions = dashData?.transactions || []
  const savingsBalance = dashData?.savings_balance ?? (user?.savings_balance || 0)
  const totalAssets = dashData?.total_savings_and_assets ?? savingsBalance

  const filtered = transactions.filter((tx) => {
    if (filterType === 'credit' && !tx.is_credit) return false
    if (filterType === 'debit' && tx.is_credit) return false
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

  const handleDeposit = async (e) => {
    e.preventDefault()
    const amt = Number(depositAmt)
    if (!amt || amt <= 0) return
    setBusyDeposit(true)
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
      alert(lang === 'mr' ? `₹${amt} बचत खात्यामध्ये जमा झाले!` : `₹${amt} successfully deposited!`)
    } catch (err) {
      alert(err.message || 'Deposit failed')
    } finally {
      setBusyDeposit(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>Passbook & Financial Ledger</h2>
          <p className="page-subtitle">
            Verified audit trail of savings deposits, microcredit disbursements, and installment settlements
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
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

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card">
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'credit', label: 'Credits & Inflow (+)' },
            { id: 'debit', label: 'EMI Debits & Outflow (-)' },
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '260px' }}>
          <input
            placeholder="Search date, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.84rem', padding: '6px 10px' }}
          />
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
              <th>Amount (Rs)</th>
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
                    View Slip
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

      {/* Transaction Slip Modal */}
      {selectedTxn && (
        <div className="modal-overlay" onClick={() => setSelectedTxn(null)}>
          <div className="modal-card printable-passbook" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconShield size={20} className="text-emerald" />
                <h3 style={{ margin: 0 }}>Official Transaction Receipt</h3>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTxn(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="muted small">Transaction Amount</span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: selectedTxn.is_credit ? 'var(--emerald-600)' : 'var(--slate-900)',
                }}
              >
                {selectedTxn.is_credit ? '+' : '-'}₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
              </div>
              <span className={`badge ${selectedTxn.is_credit ? 'approved' : 'pending'}`}>
                {selectedTxn.is_credit ? 'Payment Received / Credited' : 'Settlement Disbursed'}
              </span>
            </div>

            <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div className="row between">
                <span className="muted">Transaction Reference:</span>
                <b>#{selectedTxn.id}</b>
              </div>
              <div className="row between">
                <span className="muted">Recorded Date:</span>
                <b>{selectedTxn.date}</b>
              </div>
              <div className="row between">
                <span className="muted">Narration / Purpose:</span>
                <b>{selectedTxn.type}</b>
              </div>
              <div className="row between">
                <span className="muted">Channel / Method:</span>
                <b>{selectedTxn.mode}</b>
              </div>
              <div className="row between">
                <span className="muted">Account Holder:</span>
                <b>{user?.name || 'Verified Member'}</b>
              </div>
              <div className="row between">
                <span className="muted">Audit Compliance:</span>
                <span className="text-emerald" style={{ fontWeight: 600 }}>✓ Verified Bank Linkage</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={16} /> Print Receipt
              </button>
              <button className="btn" onClick={() => setSelectedTxn(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit Funds into Core Savings</h3>
              <button className="icon-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <p className="muted small">
              Deposit to liquid account for <b>{user?.name || 'Member'}</b>. Balance updates in real-time.
            </p>

            <form onSubmit={handleDeposit}>
              <div className="field">
                <span>Deposit Amount (Rs)</span>
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
          </div>
        </div>
      )}
    </div>
  )
}
