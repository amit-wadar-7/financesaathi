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
      emi_payment: { label: t('cat_emi') || 'Loan EMI Servicing', icon: '💳', maxPct: 35, color: '#f59e0b' },
      food: { label: t('cat_groceries') || 'Food & Groceries', icon: '🌾', maxPct: 40, color: '#059669' },
      agri_inputs: { label: t('cat_agri') || 'Farm Inputs & Seeds', icon: '🚜', maxPct: 25, color: '#10b981' },
      emergency: { label: t('cat_health') || 'Health & Medical', icon: '🏥', maxPct: 15, color: '#ef4444' },
      general: { label: t('cat_general') || 'Household & General', icon: '🛒', maxPct: 20, color: '#6366f1' },
      savings_deposit: { label: t('cat_savings') || 'Thrift & Savings', icon: '🪙', maxPct: 20, color: '#3b82f6' },
      transfer: { label: t('cat_transfers') || 'Goal Reserves', icon: '🎯', maxPct: 15, color: '#8b5cf6' },
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
          <h2>{t('passbook_header_title')}</h2>
          <p className="page-subtitle">
            {t('passbook_header_subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPrinter size={16} /> {t('btn_print_full_passbook')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowDepositModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPlus size={16} /> {t('btn_add_funds')}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat
          label={t('stat_verified_balance')}
          value={money(savingsBalance)}
          sub={t('stat_sub_liquid_savings')}
        />
        <Stat
          label={t('stat_total_assets')}
          value={money(totalAssets)}
          sub={t('stat_sub_total_assets')}
        />
        <Stat
          label={t('stat_recorded_inflows')}
          value={money(totalInflow)}
          sub={t('stat_sub_inflows')}
        />
        <Stat
          label={t('stat_recorded_outflows')}
          value={money(totalOutflow)}
          sub={t('stat_sub_outflows')}
        />
      </div>

      {/* Category Budget & Expense Discipline Breakdown */}
      {/* Category Budget & Expense Discipline Breakdown */}
      <Card title={t('budget_discipline_title')} style={{ marginBottom: '1.25rem' }}>
        <p className="muted small" style={{ marginBottom: '1rem' }}>
          {t('budget_discipline_subtitle')}
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
                  {cat.isOver ? (lang === 'hi' ? 'उच्च सीमा' : lang === 'mr' ? 'जास्त मर्यादा' : 'Elevated') : (lang === 'hi' ? 'सुरक्षित सीमा' : lang === 'mr' ? 'सुरक्षित मर्यादा' : 'Safe Limit')}
                </Badge>
              </div>

              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {money(cat.amount)}
                </span>
                <span className="muted small" style={{ fontSize: '0.78rem' }}>
                  {cat.pct}% {lang === 'hi' ? 'खर्च का' : lang === 'mr' ? 'खर्चाचे' : 'of outflows'} ({lang === 'hi' ? 'अधिकतम' : lang === 'mr' ? 'कमाल' : 'Max'} {cat.maxPct}%)
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
              { id: 'all', label: t('tab_all_activity') },
              { id: 'credit', label: t('tab_money_in') },
              { id: 'debit', label: t('tab_money_out') },
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
              placeholder={t('search_ledger_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ fontSize: '0.84rem', padding: '6px 10px', width: '100%' }}
            />
          </div>
        </div>

        {/* Category Pills Row */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
          <span className="muted small" style={{ alignSelf: 'center', marginRight: '0.25rem', fontWeight: 600 }}>{t('label_category')}</span>
          {[
            { id: 'all', label: t('cat_all') },
            { id: 'emi_payment', label: t('cat_emi') },
            { id: 'savings_deposit', label: t('cat_savings') },
            { id: 'transfer', label: t('cat_transfers') },
            { id: 'milk_sales', label: t('cat_livelihood') },
            { id: 'general', label: t('cat_general') },
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
              <th>{t('th_date')}</th>
              <th>{t('th_description')}</th>
              <th>{t('th_channel')}</th>
              <th>{t('th_flow')}</th>
              <th>{t('th_amount')}</th>
              <th>{t('th_receipt')}</th>
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
                    {r.is_credit ? (lang === 'hi' ? 'जमा (+)' : lang === 'mr' ? 'जमा (+)' : 'Credit (+)') : (lang === 'hi' ? 'निकासी (-)' : lang === 'mr' ? 'खर्च (-)' : 'Debit (-)')}
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
                    {t('btn_view_voucher')}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '2.2rem' }}>🧾</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary, #f8fafc)' }}>
                      {t('no_transactions_found')}
                    </strong>
                    <span className="muted small" style={{ maxWidth: '360px' }}>
                      {t('adjust_filters_hint')}
                    </span>
                  </div>
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
                {t('network_name')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '2px' }}>
                {t('official_voucher_header')}
              </div>
              <span className="muted small">{t('voucher_ref')} #VCH-{selectedTxn.id}-{new Date().getFullYear()}</span>
            </div>

            <div style={{ textAlign: 'center', padding: '0.85rem 0', background: 'var(--card-bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <span className="muted small" style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                {t('settlement_sum')}
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
                <span className="muted">{t('th_date')}:</span>
                <b>{selectedTxn.date}</b>
              </div>
              <div className="row between">
                <span className="muted">{t('th_description')}:</span>
                <b>{selectedTxn.type}</b>
              </div>
              <div className="row between">
                <span className="muted">{t('label_category')}</span>
                <span className="badge neutral">{selectedTxn.category || t('cat_general')}</span>
              </div>
              <div className="row between">
                <span className="muted">{t('th_channel')}:</span>
                <b>{selectedTxn.mode}</b>
              </div>
              <div className="row between">
                <span className="muted">{lang === 'hi' ? 'खाताधारक:' : lang === 'mr' ? 'खातेदार:' : 'Account Beneficiary:'}</span>
                <b>{user?.name || (lang === 'hi' ? 'सत्यापित सदस्य' : lang === 'mr' ? 'नोंदणीकृत सदस्य' : 'Verified Member')}</b>
              </div>
              <div className="row between">
                <span className="muted">{lang === 'hi' ? 'सत्यापन स्थिति:' : lang === 'mr' ? 'पडताळणी स्थिती:' : 'Statutory Verification:'}</span>
                <span className="text-emerald" style={{ fontWeight: 600 }}>✓ {t('ledger_reconciled')}</span>
              </div>
            </div>

            {/* Signature Block for Official Printouts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', height: '40px', marginBottom: '4px' }} />
                <span className="muted small" style={{ fontSize: '0.72rem' }}>{lang === 'hi' ? 'बैंक मित्र / अधिकारी हस्ताक्षर' : lang === 'mr' ? 'बँक प्रतिनिधी / अधिकारी स्वाक्षरी' : 'Bank Mitra / Officer Signature'}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', height: '40px', marginBottom: '4px' }} />
                <span className="muted small" style={{ fontSize: '0.72rem' }}>{lang === 'hi' ? 'सदस्य / जमाकर्ता हस्ताक्षर' : lang === 'mr' ? 'सदस्य / ठेवीदार स्वाक्षरी' : 'Member / Depositor Signature'}</span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={16} /> {t('btn_print_voucher')}
              </button>
              <button type="button" className="btn" onClick={() => setSelectedTxn(null)}>
                {t('btn_close')}
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
          title={t('deposit_modal_title')}
          maxWidth={460}
        >
          <p className="muted small" style={{ marginBottom: '1rem' }}>
            {t('deposit_modal_sub')}
          </p>

          <form onSubmit={handleDeposit}>
            <div className="field">
              <span>{t('label_deposit_amount')}</span>
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
                {t('btn_cancel')}
              </button>
              <button type="submit" className="btn" disabled={busyDeposit}>
                {busyDeposit ? t('btn_depositing') : `${t('btn_confirm_deposit')} (₹${Number(depositAmt).toLocaleString('en-IN')})`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
