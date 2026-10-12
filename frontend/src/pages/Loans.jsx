import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Factors, Field, Loading, Progress, Stat, useLoad } from '../ui'
import {
  IconPlus,
  IconSearch,
  IconShield,
  IconCheckCircle,
  IconClock,
  IconAlertTriangle,
  IconCreditCard,
  IconFileText,
  IconArrowRight,
  IconCoins,
  IconTractor,
  IconUsers,
  IconCart,
  IconHospital,
  IconZap,
  IconCheck,
} from '../icons'

export const LOAN_PRODUCTS = [
  {
    id: 'kisan_agri',
    title: 'Kisan Agri & Harvest Facility',
    subtitle: 'Crop Cultivation, Seeds, Fertilizers & Farm Equipment',
    category: 'agri',
    icon: <IconTractor size={22} />,
    tag: '3% Interest Subvention Eligible',
    apr: 7.0,
    defaultAmount: 30000,
    minAmount: 5000,
    maxAmount: 100000,
    tenures: [6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Seasonal repayment aligned with Rabi & Kharif harvest cycles',
      'NABARD & Kisan Credit Card guideline compliant',
      'Disaster grace period & zero prepayment penalty',
    ],
    presets: [
      'Kharif Hybrid Seeds & Fertilizers',
      'Micro-Drip Irrigation Accessories',
      'Tractor & Harvester Service Rental',
      'Borewell Submersible Pump Replacement',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Official ID Proof'],
      ['land_record', 'Land Record (7/12 Extract) or Cultivator Declaration'],
      ['income_proof', 'Panchayat Agri Income Certificate'],
    ],
  },
  {
    id: 'mahila_shakti',
    title: 'Mahila Shakti SHG Enterprise Loan',
    subtitle: 'Joint-Liability Collateral-Free Credit for Women Micro-Entrepreneurs',
    category: 'shg',
    icon: <IconUsers size={22} />,
    tag: 'SHG Peer Guarantee Backed',
    apr: 11.5,
    defaultAmount: 40000,
    minAmount: 10000,
    maxAmount: 75000,
    tenures: [12, 18, 24, 36],
    defaultTenure: 18,
    features: [
      'Backed by Self-Help Group peer guarantee (no physical asset pledge)',
      'Special 1.5% interest rebate on 100% timely group repayment',
      'Comprehensive capacity building & financial literacy mentoring',
    ],
    presets: [
      'Dairy Cow & Cattle Procurement',
      'Tailoring & Garment Boutique Unit',
      'Kirana Store Inventory Expansion',
      'Handicraft, Pottery & Food Processing Unit',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Voter ID Proof'],
      ['shg_resolution', 'SHG Meeting Resolution & Peer Guarantee Letter'],
      ['address_proof', 'Ration Card / Electricity Bill Proof'],
    ],
  },
  {
    id: 'pm_svanidhi',
    title: 'PM SVANidhi Micro-Vendor Credit',
    subtitle: 'Working Capital Facility for Urban & Semi-Urban Street Vendors',
    category: 'vendor',
    icon: <IconCart size={22} />,
    tag: '7% Interest Subsidy Directly Credited',
    apr: 9.0,
    defaultAmount: 15000,
    minAmount: 5000,
    maxAmount: 50000,
    tenures: [6, 12],
    defaultTenure: 12,
    features: [
      'Tiered credit progression: ₹10,000 → ₹20,000 → ₹50,000 upon on-time settlement',
      'Monthly digital cashback incentives on QR UPI transactions',
      'Zero collateral or margin money required',
    ],
    presets: [
      'Street Vendor Daily Working Capital',
      'Kirana Shop Fast-Moving Stock Refill',
      'Handcart / Vending Stall Refurbishment',
      'Electronic Weighing Scale & Refrigerator Asset',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Official ID Proof'],
      ['vendor_cert', 'Street Vendor Certificate (CoVR / ULB Letter)'],
      ['income_proof', 'Bank Passbook / UPI QR Statement'],
    ],
  },
  {
    id: 'emergency_health',
    title: 'Emergency Medical & Contingency Pool',
    subtitle: 'Rapid Express Sanction for Unexpected Health & Social Shocks',
    category: 'emergency',
    icon: <IconHospital size={22} />,
    tag: '24-Hour Express Sanction',
    apr: 8.5,
    defaultAmount: 20000,
    minAmount: 5000,
    maxAmount: 30000,
    tenures: [3, 6, 12],
    defaultTenure: 6,
    features: [
      'Express sanction disbursed within 24 hours of doctor estimate',
      'Zero penalty for early repayment or foreclosure',
      'Protected by community contingency risk fund',
    ],
    presets: [
      'Urgent Hospitalization & Life-Saving Medicines',
      'Accident & Trauma Emergency Care',
      'Diagnostic Tests, Scans & Prescriptions',
      'Travel & Food Allowance for Outstation Treatment',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Family Member ID'],
      ['hospital_estimate', 'Hospital Admission Slip or Doctor Prescription'],
      ['address_proof', 'Ration Card / Local Residence Proof'],
    ],
  },
  {
    id: 'solar_green',
    title: 'PM-KUSUM Solar & Green Asset Loan',
    subtitle: 'Clean Energy Infrastructure for Irrigation Pumps & Rural Power',
    category: 'solar',
    icon: <IconZap size={22} />,
    tag: 'Green Concessional Financing',
    apr: 6.5,
    defaultAmount: 60000,
    minAmount: 20000,
    maxAmount: 150000,
    tenures: [12, 24, 36, 48],
    defaultTenure: 24,
    features: [
      'Subsidy integration with Central/State PM-KUSUM components',
      'Direct reduction in household diesel and electricity expenses',
      'Long-term asset warranty and insurance coverage backed',
    ],
    presets: [
      'Solar Irrigation Submersible Pump (3HP / 5HP)',
      'Rooftop Solar for Cottage Enterprise / Dairy',
      'Solar Micro-Cold Storage Unit',
      'Solar Grain Dryer & Flour Mill Installation',
    ],
    docs: [
      ['aadhaar', 'Aadhaar Proof'],
      ['land_record', 'Agricultural Land / Rooftop Ownership Proof'],
      ['equipment_quotation', 'Authorized Solar Vendor Equipment Quotation'],
    ],
  },
  {
    id: 'standard',
    title: 'Custom Microcredit Proposal',
    subtitle: 'General Purpose Flexible Credit for Trade, Home & Life Goals',
    category: 'custom',
    icon: <IconCreditCard size={22} />,
    tag: 'Tailored Terms & Schedule',
    apr: 12.0,
    defaultAmount: 25000,
    minAmount: 1000,
    maxAmount: 100000,
    tenures: [6, 12, 18, 24, 36],
    defaultTenure: 12,
    features: [
      'Reducing balance interest calculation methodology',
      'Flexible tenure customized to household cashflow profile',
      'Standard RBI Fair Practices Code conforming appraisal',
    ],
    presets: [
      'Home Roofing & Water Tank Repair',
      'Vocational Training & Skill Certification',
      'Debt Consolidation of High-Interest Informal Loans',
      'Wholesale Trade Working Capital',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Official ID Proof'],
      ['income_proof', 'Panchayat Income Slip / Bank Passbook'],
      ['address_proof', 'Ration Card / Electricity Bill Proof'],
    ],
  },
]

export function LoanList() {
  const { user } = useAuth()
  const { t } = useLang()
  const [activeTab, setActiveTab] = useState('catalog')
  const [status, setStatus] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data, error, loading } = useLoad(() => api('/loans' + (status ? '?status=' + status : '')), [status])
  const staff = user.role === 'officer' || user.role === 'admin'

  const loans = data || []
  const filteredLoans = loans.filter((l) => {
    if (productFilter && l.product_type !== productFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      String(l.id).includes(q) ||
      (l.borrower_name && l.borrower_name.toLowerCase().includes(q)) ||
      (l.purpose && l.purpose.toLowerCase().includes(q)) ||
      (l.product_type && l.product_type.toLowerCase().includes(q))
    )
  })

  const totalLoans = loans.length
  const activeCount = loans.filter((l) => l.status === 'approved').length
  const pendingCount = loans.filter((l) => l.status === 'pending').length
  const totalVolume = loans.reduce((acc, l) => acc + (l.amount || 0), 0)

  const getProductTitle = (type) => {
    const p = LOAN_PRODUCTS.find((x) => x.id === type)
    return p ? p.title : 'Standard Facility'
  }

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('loans')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Institutional credit products, joint-liability applications, and automated underwriting
          </p>
        </div>
        {!staff && (
          <Link
            className="btn"
            to="/loans/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPlus size={16} /> {t('newLoan')}
          </Link>
        )}
      </div>

      {/* Portfolio Quick Statistics */}
      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Total Loan Records" value={totalLoans} sub="Active portfolio volume" />
        <Stat label="Approved & Active" value={activeCount} sub="Performing credit assets" />
        <Stat label="Pending Sanctions" value={pendingCount} sub="Under officer review" />
        <Stat label="Total Sanction Volume" value={money(totalVolume)} sub="Disbursed capital" />
      </div>

      {/* Main View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-hairline)',
          marginBottom: '1.25rem',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'catalog' ? '' : 'ghost'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'catalog' ? '2px solid var(--emerald-brand)' : 'none',
            fontWeight: activeTab === 'catalog' ? 700 : 500,
          }}
          onClick={() => setActiveTab('catalog')}
        >
          Specialized Loan Catalog ({LOAN_PRODUCTS.length})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'portfolio' ? '' : 'ghost'}`}
          style={{
            borderRadius: '6px 6px 0 0',
            borderBottom: activeTab === 'portfolio' ? '2px solid var(--emerald-brand)' : 'none',
            fontWeight: activeTab === 'portfolio' ? 700 : 500,
          }}
          onClick={() => setActiveTab('portfolio')}
        >
          {staff ? 'Applications Portfolio' : 'My Applied Loans'} ({totalLoans})
        </button>
      </div>

      {/* Tab 1: Specialized Loan Catalog */}
      {activeTab === 'catalog' && (
        <div>
          <div className="row between" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Institutional Loan Facilities</h3>
              <p className="muted small" style={{ margin: '0.2rem 0 0 0' }}>
                Select an institutional microcredit product tailored to your livelihood and enterprise needs
              </p>
            </div>
          </div>

          <div className="loan-catalog-grid">
            {LOAN_PRODUCTS.map((p) => (
              <div key={p.id} className={`loan-product-card ${p.id === 'kisan_agri' ? 'featured' : ''}`}>
                <div className="product-card-top">
                  <div className={`product-icon-box ${p.category}`}>
                    {p.icon}
                  </div>
                  <div className="product-header-info">
                    <h4>{p.title}</h4>
                    <span className="product-tag-pill green">{p.tag}</span>
                  </div>
                </div>

                <p className="muted small" style={{ margin: '0 0 0.5rem 0', minHeight: '36px' }}>
                  {p.subtitle}
                </p>

                <div className="product-metrics-bar">
                  <div className="product-metric-item">
                    <span className="metric-label">Annual APR</span>
                    <span className="metric-val text-emerald">{p.apr}% p.a.</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">Max Sanction</span>
                    <span className="metric-val">{money(p.maxAmount)}</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">Tenure Window</span>
                    <span className="metric-val">{p.tenures[0]} - {p.tenures[p.tenures.length - 1]} Months</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">Default Starter</span>
                    <span className="metric-val">{money(p.defaultAmount)}</span>
                  </div>
                </div>

                <ul className="product-features-list">
                  {p.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="check-icon"><IconCheck size={14} /></span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/loans/new?product=${p.id}`}
                  className="btn product-apply-btn"
                >
                  Apply for This Facility <IconArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Applications & Dossiers Portfolio */}
      {activeTab === 'portfolio' && (
        <div>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: '', label: 'All Statuses' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'approved', label: 'Approved & Active' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'closed', label: 'Repaid & Closed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={'btn small ' + (status === tab.id ? '' : 'ghost')}
                  style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                  onClick={() => setStatus(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 8px', borderRadius: '4px' }}
              >
                <option value="">All Loan Products</option>
                {LOAN_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.title}
                  </option>
                ))}
              </select>

              <input
                placeholder="Search loan #, borrower..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 10px', width: '220px' }}
              />
            </div>
          </div>

          <Alert>{error}</Alert>

          {loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Loan Reference</th>
                    <th>Product Program</th>
                    {(staff || user.role === 'shg_leader') && <th>Borrower Name</th>}
                    <th>Principal</th>
                    <th>Monthly EMI</th>
                    <th>Tenure</th>
                    <th>AI Affordability</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((l) => {
                    const prodType = l.product_type || 'standard'
                    return (
                      <tr key={l.id}>
                        <td>
                          <Link to={'/loans/' + l.id} style={{ fontWeight: 600 }}>
                            #{l.id} {l.group_loan ? <span className="muted small">(SHG)</span> : ''}
                          </Link>
                        </td>
                        <td>
                          <span className={`product-type-badge ${prodType}`}>
                            {getProductTitle(prodType)}
                          </span>
                        </td>
                        {(staff || user.role === 'shg_leader') && (
                          <td>
                            <div style={{ fontWeight: 600 }}>{l.borrower_name}</div>
                            <div className="muted small">{l.purpose || 'General microfinance'}</div>
                          </td>
                        )}
                        <td style={{ fontWeight: 600 }}>{money(l.amount)}</td>
                        <td>{money(l.emi)}</td>
                        <td>{l.tenure_months} mo @ {l.annual_rate}%</td>
                        <td>
                          <Badge tone={l.ai_band}>{t(l.ai_band)}</Badge>
                        </td>
                        <td>
                          <Badge>{l.status}</Badge>
                        </td>
                        <td>
                          <Link to={'/loans/' + l.id} className="btn small ghost">
                            View Dossier
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td
                        colSpan={staff || user.role === 'shg_leader' ? 9 : 8}
                        className="muted"
                        style={{ textAlign: 'center', padding: '2rem 0' }}
                      >
                        No loan applications matching the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export function LoanApply() {
  const { user } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const initialProductId = searchParams.get('product') || 'standard'

  const [selectedProduct, setSelectedProduct] = useState(
    LOAN_PRODUCTS.find((p) => p.id === initialProductId) || LOAN_PRODUCTS[0]
  )

  const [f, setF] = useState({
    product_type: selectedProduct.id,
    amount: selectedProduct.defaultAmount,
    annual_rate: selectedProduct.apr,
    tenure_months: selectedProduct.defaultTenure,
    purpose: '',
    group_loan: selectedProduct.id === 'mahila_shakti',
    documents: [],
  })

  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const hasProfile = user.monthly_income > 0

  // Switch product when user selects a different facility
  const handleProductChange = (prod) => {
    setSelectedProduct(prod)
    setF({
      ...f,
      product_type: prod.id,
      amount: prod.defaultAmount,
      annual_rate: prod.apr,
      tenure_months: prod.defaultTenure,
      purpose: prod.presets[0] || '',
      group_loan: prod.id === 'mahila_shakti',
      documents: [],
    })
  }

  useEffect(() => {
    if (!hasProfile || !(f.amount > 0) || !(f.tenure_months > 0)) return
    const h = setTimeout(() => {
      api('/ai/affordability', {
        method: 'POST',
        body: {
          monthly_income: user.monthly_income,
          monthly_expenses: user.monthly_expenses,
          existing_emi: user.existing_emi,
          savings_balance: user.savings_balance,
          amount: Number(f.amount),
          annual_rate: Number(f.annual_rate),
          tenure_months: Number(f.tenure_months),
        },
      })
        .then(setPreview)
        .catch(() => setPreview(null))
    }, 350)
    return () => clearTimeout(h)
  }, [f.amount, f.annual_rate, f.tenure_months, hasProfile, user])

  const toggleDoc = (d) =>
    setF({
      ...f,
      documents: f.documents.includes(d) ? f.documents.filter((x) => x !== d) : [...f.documents, d],
    })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const loan = await api('/loans', {
        method: 'POST',
        body: {
          ...f,
          amount: Number(f.amount),
          annual_rate: Number(f.annual_rate),
          tenure_months: Number(f.tenure_months),
        },
      })
      nav('/loans/' + loan.id)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <>
      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'flex-start' }}>
        <div>
          <h2>{t('newLoan')}</h2>
          <p className="muted" style={{ margin: '0.2rem 0 0 0' }}>
            Submit microcredit proposal with automated AI affordability underwriting and RBI fair practices compliance
          </p>
        </div>
      </div>

      {!hasProfile && (
        <Alert kind="warn">
          {t('fillProfile')} <Link to="/profile">{t('profile')}</Link>
        </Alert>
      )}

      {/* Product Selection Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span className="muted small" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
          Select Credit Product Program:
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {LOAN_PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              type="button"
              className={`btn small ${selectedProduct.id === prod.id ? '' : 'ghost'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                border: selectedProduct.id === prod.id ? '2px solid var(--emerald-brand)' : '1px solid var(--border-hairline)',
              }}
              onClick={() => handleProductChange(prod)}
            >
              {prod.title}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <Card title={`Application: ${selectedProduct.title}`}>
          <div
            style={{
              background: 'var(--canvas-bg)',
              padding: '0.75rem',
              borderRadius: '6px',
              borderLeft: '3px solid var(--emerald-brand)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedProduct.tag}</div>
            <p className="muted small" style={{ margin: '0.2rem 0 0 0' }}>{selectedProduct.subtitle}</p>
          </div>

          <form onSubmit={submit}>
            <Alert>{err}</Alert>

            <Field label={t('amount')}>
              <input
                type="number"
                min={selectedProduct.minAmount}
                max={selectedProduct.maxAmount}
                step="500"
                required
                value={f.amount}
                onChange={set('amount')}
              />
            </Field>

            <div style={{ marginBottom: '1rem' }}>
              <span className="muted small" style={{ display: 'block', marginBottom: '0.35rem' }}>
                Tenure Options for {selectedProduct.title}:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProduct.tenures.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={'btn small ' + (f.tenure_months === m ? '' : 'ghost')}
                    style={{ flex: 1, minWidth: '70px', fontSize: '0.8rem' }}
                    onClick={() => setF({ ...f, tenure_months: m })}
                  >
                    {m} Months
                  </button>
                ))}
              </div>
            </div>

            <div className="row" style={{ gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <Field label={t('rate')}>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="0.1"
                    required
                    value={f.annual_rate}
                    onChange={set('annual_rate')}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label={t('months')}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={f.tenure_months}
                    onChange={set('tenure_months')}
                  />
                </Field>
              </div>
            </div>

            <Field label={t('purpose')}>
              <input
                value={f.purpose}
                onChange={set('purpose')}
                placeholder="e.g. Dairy cattle procurement, fertilizer stock"
                required
              />
            </Field>

            <div style={{ marginBottom: '1rem' }}>
              <span className="muted small" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Recommended Purpose Presets:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedProduct.presets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn small ghost"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => setF({ ...f, purpose: p })}
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {user.shg_id && (
              <label
                className="check"
                style={{
                  background: 'var(--canvas-bg)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={f.group_loan}
                  onChange={(e) => setF({ ...f, group_loan: e.target.checked })}
                />
                <div>
                  <span style={{ fontWeight: 600 }}>Joint Liability Group (SHG) Facility</span>
                  <div className="muted small">Backed by peer-guarantee from your Self-Help Group</div>
                </div>
              </label>
            )}

            <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              <p className="muted small" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                Program KYC Documents to Pledge:
              </p>
              {selectedProduct.docs.map(([k, label]) => (
                <label className="check" key={k} style={{ display: 'block', marginBottom: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={f.documents.includes(k)}
                    onChange={() => toggleDoc(k)}
                  />{' '}
                  {label}
                </label>
              ))}
            </div>

            <button
              className="btn"
              disabled={busy || !hasProfile}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <IconShield size={16} /> Submit Loan Application
            </button>
          </form>
        </Card>

        <Card title="AI Affordability Engine (Live Pre-Check)">
          {!preview ? (
            <p className="muted">{hasProfile ? 'Evaluating repayment capacity…' : t('fillProfile')}</p>
          ) : (
            <>
              <div
                style={{
                  background: 'var(--canvas-bg)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-hairline)',
                }}
              >
                <div className="row between" style={{ marginBottom: '0.5rem' }}>
                  <span className="muted small">Model Decision Readiness</span>
                  <Badge tone={preview.band}>{t(preview.band)}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-primary)' }}>
                    {preview.score}
                  </span>
                  <span className="muted small">/ 100 Safe Underwriting Score</span>
                </div>
              </div>

              <div className="grid" style={{ marginBottom: '1rem' }}>
                <Stat label="Estimated EMI" value={money(preview.emi)} />
                <Stat label="Safe Threshold" value={money(preview.safe_emi)} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                  <span>Safe Headroom Utilization</span>
                  <span style={{ fontWeight: 600 }}>
                    {preview.safe_emi > 0 ? `${Math.round((preview.emi / preview.safe_emi) * 100)}%` : 'N/A'}
                  </span>
                </div>
                <Progress pct={preview.safe_emi > 0 ? Math.min(100, (preview.emi / preview.safe_emi) * 100) : 50} />
              </div>

              <h4 style={{ fontSize: '0.88rem', margin: '1rem 0 0.5rem 0' }}>Underwriting Rationale:</h4>
              <Factors factors={preview.factors} />

              <div
                style={{
                  background: 'var(--canvas-bg)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  borderLeft: '3px solid var(--emerald-action)',
                }}
              >
                <div className="small">
                  <b>Maximum Recommended Principal:</b> {money(preview.safe_loan_amount)}
                </div>
                <p className="muted small" style={{ margin: '0.25rem 0 0 0' }}>
                  {preview.disclaimer}
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

export function LoanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useLang()
  const loan = useLoad(() => api('/loans/' + id), [id])
  const sched = useLoad(() => api('/loans/' + id + '/schedule'), [id])
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [note, setNote] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [customPayAmt, setCustomPayAmt] = useState('')
  const staff = user.role === 'officer' || user.role === 'admin'
  const l = loan.data

  const act = async (fn, ok) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await fn()
      setMsg({ kind: 'success', text: ok })
      loan.reload()
      sched.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
    }
  }

  const decide = (approve) =>
    act(
      () => api('/loans/' + id + '/decision', { method: 'POST', body: { approve, note } }),
      approve ? 'Loan sanction approved.' : 'Loan application rejected.'
    )

  const recordPayment = async () => {
    if (!paymentModal) return
    const instNumber = paymentModal.number
    const amount = customPayAmt ? Number(customPayAmt) : undefined
    setPaymentModal(null)
    setCustomPayAmt('')
    await act(
      () => api('/loans/' + id + '/installments/' + instNumber + '/pay', { method: 'POST', body: { amount } }),
      `Installment #${instNumber} payment registered.`
    )
  }

  const verify = (d) =>
    act(() => api('/loans/' + id + '/documents/' + d + '/verify', { method: 'POST' }), 'KYC Document authenticated.')

  if (loan.loading) return <Loading />
  if (loan.error) return <Alert>{loan.error}</Alert>

  const canPay = l.status === 'approved' && (user.id === l.user_id || staff)
  const installments = sched.data || []
  const paidCount = installments.filter((i) => i.status === 'paid').length
  const totalPaidAmount = installments.reduce((acc, i) => acc + (i.paid_amount || 0), 0)
  const totalScheduledAmount = installments.reduce((acc, i) => acc + (i.amount || 0), 0)
  const remainingAmount = Math.max(0, totalScheduledAmount - totalPaidAmount)
  const repaymentPct = totalScheduledAmount > 0 ? Math.round((totalPaidAmount / totalScheduledAmount) * 100) : 0

  const prodType = l.product_type || 'standard'
  const productInfo = LOAN_PRODUCTS.find((p) => p.id === prodType) || LOAN_PRODUCTS[LOAN_PRODUCTS.length - 1]

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/loans" className="btn small ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← {t('back')} to Loans Portfolio
        </Link>
      </div>

      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2>Loan Dossier #{l.id}</h2>
          <span className={`product-type-badge ${prodType}`}>
            {productInfo.title}
          </span>
          <Badge>{l.status}</Badge>
          {l.shg_id && <Badge tone="pending">SHG Joint Liability</Badge>}
        </div>
        <div className="muted small">
          Created on {new Date(l.created_at + 'Z').toLocaleDateString()}
        </div>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Principal Sanction" value={money(l.amount)} sub="Total microcredit" />
        <Stat label="Monthly EMI" value={money(l.emi)} sub={`${l.tenure_months} mo @ ${l.annual_rate}% APR`} />
        <Stat label="Borrower Name" value={l.borrower_name} sub={l.purpose || 'General Purpose'} />
        <Stat
          label="AI Credit Health"
          value={l.ai_score ? `${l.ai_score} / 100` : 'Assessed'}
          sub={`Band: ${t(l.ai_band)}`}
        />
      </div>

      {l.status === 'approved' && totalScheduledAmount > 0 && (
        <Card title="Repayment Amortization Progress" style={{ marginBottom: '1.25rem' }}>
          <div className="row between small" style={{ marginBottom: '0.4rem' }}>
            <span>
              <b>Collected:</b> {money(totalPaidAmount)} ({repaymentPct}%)
            </span>
            <span>
              <b>Remaining Balance:</b> {money(remainingAmount)}
            </span>
          </div>
          <Progress pct={repaymentPct} />
          <div className="row between small muted" style={{ marginTop: '0.4rem' }}>
            <span>{paidCount} of {installments.length} installments settled</span>
            <span>Interest Structure: Reducing Balance Rate</span>
          </div>
        </Card>
      )}

      <div className="two-col" style={{ marginBottom: '1.25rem' }}>
        <Card title="AI Underwriting Evaluation Summary">
          <div className="row between" style={{ marginBottom: '0.75rem' }}>
            <Badge tone={l.ai_band}>{t(l.ai_band)}</Badge>
            <span className="muted small">Composite Risk Metric: {l.ai_score}</span>
          </div>
          <Factors factors={l.ai_factors} />
          <p className="muted small" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            Underwriting rules conform to RBI Master Direction – Reserve Bank of India (Regulatory Framework for Microfinance Loans) Directions, 2022.
          </p>
        </Card>

        <Card title="KYC Document Verifications">
          {l.documents.length === 0 ? (
            <p className="muted small">No auxiliary documents attached.</p>
          ) : (
            <ul className="plain" style={{ margin: 0 }}>
              {l.documents.map((d) => (
                <li
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border-hairline)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconFileText size={16} className="text-muted" />
                    <span>{d.doc_type.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {d.verified ? (
                      <Badge tone="approved">Verified</Badge>
                    ) : (
                      <Badge tone="pending">Pending Check</Badge>
                    )}
                    {staff && !d.verified && (
                      <button className="btn small ghost" onClick={() => verify(d.id)}>
                        Authenticate
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {staff && l.status === 'pending' && (
        <Card title="Credit Officer Sanction Terminal" style={{ marginBottom: '1.25rem' }}>
          <Field label="Statutory Underwriting Notes / Conditions">
            <input
              placeholder="e.g. Sanctioned subject to SHG leader joint guarantee verification"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="row" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className="btn" onClick={() => decide(true)}>
              <IconCheckCircle size={16} /> Sanction & Approve Loan
            </button>
            <button className="btn danger" onClick={() => decide(false)}>
              <IconAlertTriangle size={16} /> Reject Application
            </button>
          </div>
        </Card>
      )}

      {l.officer_note && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-hairline)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <span className="muted small" style={{ fontWeight: 600 }}>Credit Officer Recorded Note:</span>
          <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>"{l.officer_note}"</p>
        </div>
      )}

      {l.status !== 'pending' && l.status !== 'rejected' && (
        <Card title="Full Amortization Schedule">
          {sched.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Instalment #</th>
                    <th>Due Date</th>
                    <th>Instalment Amount</th>
                    <th>Principal Share</th>
                    <th>Interest Share</th>
                    <th>Status</th>
                    <th>Payment Action</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((i) => (
                    <tr key={i.number} className={i.overdue ? 'overdue' : ''}>
                      <td style={{ fontWeight: 600 }}>#{i.number}</td>
                      <td>{i.due_date}</td>
                      <td style={{ fontWeight: 600 }}>{money(i.amount)}</td>
                      <td>{money(i.principal_part)}</td>
                      <td>{money(i.interest_part)}</td>
                      <td>
                        <Badge tone={i.overdue ? 'overdue' : i.status}>
                          {i.overdue ? 'Overdue' : i.status}
                        </Badge>
                      </td>
                      <td>
                        {canPay && i.status !== 'paid' && (
                          <button
                            className="btn small"
                            onClick={() => {
                              setPaymentModal(i)
                              setCustomPayAmt(String(i.amount - (i.paid_amount || 0)))
                            }}
                          >
                            <IconCreditCard size={14} /> {t('pay')}
                          </button>
                        )}
                        {i.status === 'paid' && (
                          <span className="muted small" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <IconCheckCircle size={14} className="text-emerald" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {paymentModal && (
        <div className="modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Settle Instalment #{paymentModal.number}</h3>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => setPaymentModal(null)}
                style={{ padding: '2px 8px', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--canvas-bg)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>Due Date:</span>
                <b>{paymentModal.due_date}</b>
              </div>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>Scheduled Amount:</span>
                <b>{money(paymentModal.amount)}</b>
              </div>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>Principal Component:</span>
                <span>{money(paymentModal.principal_part)}</span>
              </div>
              <div className="row between small">
                <span>Interest Component:</span>
                <span>{money(paymentModal.interest_part)}</span>
              </div>
            </div>

            <Field label="Amount to Pay (Rs)">
              <input
                type="number"
                min="1"
                max={paymentModal.amount - (paymentModal.paid_amount || 0)}
                value={customPayAmt}
                onChange={(e) => setCustomPayAmt(e.target.value)}
              />
            </Field>

            <div className="row" style={{ gap: '0.5rem', marginTop: '1.25rem' }}>
              <button className="btn" onClick={recordPayment} style={{ flex: 1 }}>
                Confirm Payment
              </button>
              <button className="btn ghost" onClick={() => setPaymentModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
