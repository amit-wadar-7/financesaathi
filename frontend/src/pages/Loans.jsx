import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Factors, Field, Loading, Progress, Stat, useLoad, useToast, DonutSplitChart } from '../ui'
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
  IconCalculator,
  IconPrinter,
  IconAward,
  IconDownload,
  IconUpload,
} from '../icons'

export const LOAN_PRODUCTS = [
  {
    id: 'kisan_agri',
    title: 'Kisan Agri & Harvest Facility',
    subtitle: 'Crop Cultivation, Hybrid Seeds, Fertilizers & Farm Implements',
    category: 'agri',
    icon: <IconTractor size={22} />,
    tag: '3% Interest Subvention Eligible',
    apr: 7.0,
    defaultAmount: 40000,
    minAmount: 5000,
    maxAmount: 150000,
    tenures: [6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Seasonal repayment aligned with Rabi & Kharif harvest sales',
      'NABARD & Kisan Credit Card guideline compliant',
      'Crop calamity grace period & zero foreclosure penalty',
    ],
    presets: [
      'Kharif Hybrid Seeds & Fertilizers',
      'Micro-Drip Irrigation Accessories',
      'Tractor & Harvester Service Rental',
      'Borewell Submersible Pump Repair',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Voter ID Proof'],
      ['land_record', 'Land Revenue Record (7/12 Extract) or Cultivator Declaration'],
      ['income_proof', 'Panchayat Agri Income Certificate'],
    ],
  },
  {
    id: 'pm_mudra',
    title: 'PM MUDRA MSME Business Credit',
    subtitle: 'Working Capital & Equipment for Small Non-Farm Enterprises',
    category: 'msme',
    icon: <IconCart size={22} />,
    tag: 'Collateral-Free MUDRA Backed',
    apr: 8.5,
    defaultAmount: 50000,
    minAmount: 10000,
    maxAmount: 200000,
    tenures: [12, 18, 24, 36],
    defaultTenure: 18,
    features: [
      'Zero collateral security required for Shishu and Kishore tiers',
      'Special MUDRA RuPay card for recurring trade purchases',
      'Concessional interest subvention for manufacturing & shop units',
    ],
    presets: [
      'Kirana Store Stock Refill & Inventory Expansion',
      'Small Flour Mill / Grinding Machinery',
      'Apparel & Readymade Garment Inventory',
      'Handloom & Handicraft Raw Material Purchase',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / PAN Card Proof'],
      ['business_proof', 'Shop License / Udyam Aadhaar Registration'],
      ['income_proof', 'Bank Account Statement (Last 6 Months)'],
    ],
  },
  {
    id: 'mahila_shakti',
    title: 'Mahila Shakti SHG Enterprise Loan',
    subtitle: 'Collateral-Free Joint Liability Credit for Women Entrepreneurs',
    category: 'shg',
    icon: <IconUsers size={22} />,
    tag: 'SHG Peer Guarantee Backed',
    apr: 11.0,
    defaultAmount: 35000,
    minAmount: 10000,
    maxAmount: 75000,
    tenures: [12, 18, 24, 36],
    defaultTenure: 18,
    features: [
      'Backed by Self-Help Group social peer collateral',
      'Prompt repayment interest incentive of 1.5% cashback',
      'Comprehensive financial training & group mentorship',
    ],
    presets: [
      'Dairy Cow & Cattle Procurement',
      'Tailoring & Garment Workshop Unit',
      'Spice Processing & Pickle Packaging Unit',
      'Village Grocery Store Stock Expansion',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Official ID Proof'],
      ['shg_resolution', 'SHG Meeting Resolution & Peer Guarantee Letter'],
      ['address_proof', 'Ration Card / Local Residence Proof'],
    ],
  },
  {
    id: 'pm_svanidhi',
    title: 'PM SVANidhi Micro-Vendor Credit',
    subtitle: 'Working Capital Facility for Urban & Semi-Urban Street Vendors',
    category: 'vendor',
    icon: <IconCoins size={22} />,
    tag: '7% Interest Subsidy Directly Credited',
    apr: 9.0,
    defaultAmount: 15000,
    minAmount: 5000,
    maxAmount: 50000,
    tenures: [6, 12],
    defaultTenure: 12,
    features: [
      'Tiered credit ladder: ₹10k → ₹20k → ₹50k on prompt repayment',
      'Monthly digital cashback incentives on UPI QR collections',
      'Zero processing fee and zero margin deposit',
    ],
    presets: [
      'Daily Street Vending Working Capital',
      'Fast-Moving Kirana Retail Refill',
      'Vending Handcart Repair & Refurbishment',
      'Digital Weighing Scale & Stock Setup',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Official ID Proof'],
      ['vendor_cert', 'Street Vendor Certificate (CoVR / ULB Letter)'],
      ['income_proof', 'Bank Passbook / UPI QR Statement'],
    ],
  },
  {
    id: 'emergency_health',
    title: 'Emergency Medical & Social Relief',
    subtitle: 'Express 24-Hour Paperless Sanction for Health Contingencies',
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
      'Express sanction disbursed within 24 hours of hospital slip',
      'Zero pre-closure penalty and zero paperwork fees',
      'Repayable in flexible weekly or monthly micro-installments',
    ],
    presets: [
      'Urgent Hospitalization & Medicine Expenses',
      'Emergency Accident Care & Surgery',
      'Diagnostic Tests, Scans & Prescriptions',
      'Travel & Caregiver Expenses for City Hospital',
    ],
    docs: [
      ['aadhaar', 'Aadhaar / Family Member ID'],
      ['hospital_estimate', 'Hospital Admission Slip or Doctor Prescription'],
      ['address_proof', 'Ration Card / Local Residence Proof'],
    ],
  },
  {
    id: 'solar_green',
    title: 'PM-KUSUM Solar & Clean Energy Loan',
    subtitle: 'Concessional Financing for Solar Pumps & Agri Clean Power',
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
      'Integrated with PM-KUSUM Central & State capital subsidies',
      'Replaces costly recurring diesel generator expenses',
      'Includes warranty and equipment insurance coverage',
    ],
    presets: [
      'Solar Irrigation Submersible Pump (3HP / 5HP)',
      'Rooftop Solar Array for Dairy / Cottage Unit',
      'Solar Micro Cold-Storage Unit',
      'Solar Flour Mill & Grain Dryer Installation',
    ],
    docs: [
      ['aadhaar', 'Aadhaar Proof'],
      ['land_record', 'Agricultural Land Ownership Proof'],
      ['equipment_quotation', 'Authorized Solar Vendor Quotation'],
    ],
  },
  {
    id: 'personal_edu',
    title: 'Personal & Higher Education Microcredit',
    subtitle: 'Tuition Fees, School Expenses & Vocational Skill Training',
    category: 'custom',
    icon: <IconCreditCard size={22} />,
    tag: 'Flexible Reducing Balance',
    apr: 10.5,
    defaultAmount: 25000,
    minAmount: 5000,
    maxAmount: 80000,
    tenures: [6, 12, 18, 24, 36],
    defaultTenure: 12,
    features: [
      'Transparent reducing balance interest computation',
      'Grace period until academic term completion',
      'Direct fee disbursal to accredited vocational institute',
    ],
    presets: [
      'Children College / School Annual Tuition Fee',
      'Vocational Computer & IT Skill Certification',
      'Home Roofing & Water Tank Monsoon Repair',
      'High-Interest Informal Debt Consolidation',
    ],
    docs: [
      ['aadhaar', 'Aadhaar Proof'],
      ['income_proof', 'Income Certificate / Bank Passbook'],
      ['address_proof', 'Ration Card / Electricity Bill Proof'],
    ],
  },
]

// Pure EMI formula calculation
function calculateEmi(principal, annualRate, tenureMonths) {
  const p = Number(principal) || 0
  const r = (Number(annualRate) || 0) / 12 / 100
  const n = Number(tenureMonths) || 1
  if (p <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 }
  if (r === 0) {
    const emi = Math.round(p / n)
    return { emi, totalInterest: 0, totalPayment: p }
  }
  const factor = Math.pow(1 + r, n)
  const emi = Math.round((p * r * factor) / (factor - 1))
  const totalPayment = emi * n
  const totalInterest = Math.max(0, totalPayment - p)
  return { emi, totalInterest, totalPayment }
}

export function LoanList() {
  const { user } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('marketplace') // 'marketplace', 'calculator', 'portfolio'
  const [status, setStatus] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data, error, loading } = useLoad(() => api('/loans' + (status ? '?status=' + status : '')), [status])
  const staff = user.role === 'officer' || user.role === 'admin'

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(40000)
  const [calcRate, setCalcRate] = useState(8.5)
  const [calcTenure, setCalcTenure] = useState(12)

  const calcResult = calculateEmi(calcAmount, calcRate, calcTenure)
  const principalPct = calcResult.totalPayment > 0 ? Math.round((calcAmount / calcResult.totalPayment) * 100) : 100
  const interestPct = 100 - principalPct

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

  const getProductTitle = (type) => {
    const p = LOAN_PRODUCTS.find((x) => x.id === type)
    return p ? p.title : 'Standard Facility'
  }

  const handleApplyWithCalc = () => {
    nav(`/loans/new?amount=${calcAmount}&rate=${calcRate}&tenure=${calcTenure}`)
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>Loans & Credit Facilities</h2>
          <p className="page-subtitle">
            Regulated institutional microcredit, livelihood financing, live EMI appraisal, and automated underwriting
          </p>
        </div>
        {!staff && (
          <Link
            className="btn"
            to="/loans/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPlus size={16} /> New Loan Application
          </Link>
        )}
      </div>

      {/* Main Tab Controls */}
      <div className="card tab-bar-card">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          Loan Facilities ({LOAN_PRODUCTS.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          Interactive EMI Calculator
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          {staff ? 'Applications Portfolio' : 'My Active Loans'} ({loans.length})
        </button>
      </div>

      {/* TAB 1: Specialized Loan Facilities Marketplace */}
      {activeTab === 'marketplace' && (
        <div>
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
                    <span className="metric-label">Max Limit</span>
                    <span className="metric-val">{money(p.maxAmount)}</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">Tenure Range</span>
                    <span className="metric-val">{p.tenures[0]} - {p.tenures[p.tenures.length - 1]} Months</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">Starter Value</span>
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

      {/* TAB 2: Interactive EMI Calculator */}
      {activeTab === 'calculator' && (
        <div className="two-col" style={{ alignItems: 'start' }}>
          {/* Controls Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <IconCalculator size={22} className="text-emerald" />
              <h3 style={{ margin: 0 }}>Interactive Loan EMI Calculator</h3>
            </div>

            {/* Slider 1: Principal Amount */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">Loan Principal Amount:</span>
                <span className="slider-value">₹{calcAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="5000"
                max="300000"
                step="5000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[15000, 30000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`btn small ${calcAmount === amt ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcAmount(amt)}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Interest Rate */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">Annual Interest Rate (APR):</span>
                <span className="slider-value text-emerald">{calcRate}% p.a.</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="5"
                max="24"
                step="0.5"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[
                  { r: 6.5, l: '6.5% (Solar)' },
                  { r: 7.0, l: '7.0% (Kisan)' },
                  { r: 8.5, l: '8.5% (MUDRA)' },
                  { r: 11.0, l: '11% (SHG)' },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    className={`btn small ${calcRate === item.r ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcRate(item.r)}
                  >
                    {item.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Tenure Months */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">Repayment Tenure:</span>
                <span className="slider-value">{calcTenure} Months ({calcTenure / 12 >= 1 ? `${(calcTenure / 12).toFixed(1)} yr` : 'Micro'})</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="3"
                max="48"
                step="3"
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[6, 12, 18, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`btn small ${calcTenure === m ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcTenure(m)}
                  >
                    {m} Mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
            <span className="muted small" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated Monthly Obligation
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.2rem 0' }}>
              ₹{calcResult.emi.toLocaleString('en-IN')}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--slate-500)', marginLeft: '6px' }}>/ month</span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
              <div className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span className="muted small">Principal Borrowed:</span>
                <b>₹{calcAmount.toLocaleString('en-IN')}</b>
              </div>
              <div className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span className="muted small">Total Interest Accrued:</span>
                <b className="text-emerald">+₹{calcResult.totalInterest.toLocaleString('en-IN')}</b>
              </div>
              <div className="row between" style={{ padding: '0.5rem 0 0 0' }}>
                <span style={{ fontWeight: 600 }}>Total Repayment Outflow:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>₹{calcResult.totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Donut Split Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <DonutSplitChart principal={calcAmount} interest={calcResult.totalInterest} />
            </div>

            <button
              type="button"
              className="btn w-100"
              onClick={handleApplyWithCalc}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '10px' }}
            >
              Apply for ₹{calcAmount.toLocaleString('en-IN')} Facility <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Active Applications & Dossiers Portfolio */}
      {activeTab === 'portfolio' && (
        <div>
          <div className="card filter-bar-card">
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
                    <th>Product Facility</th>
                    {(staff || user.role === 'shg_leader') && <th>Borrower</th>}
                    <th>Principal</th>
                    <th>Monthly EMI</th>
                    <th>Tenure</th>
                    <th>Affordability</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((l) => {
                    const prodType = l.product_type || 'kisan_agri'
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
                            <div className="muted small">{l.purpose || 'General'}</div>
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
                        style={{ textAlign: 'center', padding: '2.5rem 0' }}
                      >
                        No active loans found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function LoanApply() {
  const { user } = useAuth()
  const { t } = useLang()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  const queryProduct = searchParams.get('product')
  const queryAmount = searchParams.get('amount')
  const queryRate = searchParams.get('rate')
  const queryTenure = searchParams.get('tenure')

  const initialProd = LOAN_PRODUCTS.find((p) => p.id === queryProduct) || LOAN_PRODUCTS[0]

  const [selectedProduct, setSelectedProduct] = useState(initialProd)
  const [f, setF] = useState({
    product_type: initialProd.id,
    schedule_type: 'monthly',
    amount: queryAmount ? Number(queryAmount) : initialProd.defaultAmount,
    annual_rate: queryRate ? Number(queryRate) : initialProd.apr,
    tenure_months: queryTenure ? Number(queryTenure) : initialProd.defaultTenure,
    purpose: initialProd.presets[0] || '',
    group_loan: initialProd.id === 'mahila_shakti',
    documents: [],
  })

  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const hasProfile = user.monthly_income > 0

  const handleProductChange = (prod) => {
    setSelectedProduct(prod)
    setF({
      ...f,
      product_type: prod.id,
      schedule_type: prod.id === 'kisan_agri' ? 'harvest_bullet' : 'monthly',
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
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>Submit Loan Proposal</h2>
          <p className="page-subtitle">
            3-Step institutional microcredit submission with automated AI credit affordability underwriting
          </p>
        </div>
      </div>

      {!hasProfile && (
        <Alert kind="warn">
          {t('fillProfile')} <Link to="/profile">{t('profile')}</Link>
        </Alert>
      )}

      {/* Product Selection Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <span className="muted small" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
          Select Credit Program:
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {LOAN_PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              type="button"
              className={`btn small ${selectedProduct.id === prod.id ? 'emerald' : 'ghost'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => handleProductChange(prod)}
            >
              {prod.title}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <Card title={`Application Form: ${selectedProduct.title}`}>
          <div
            style={{
              background: 'var(--slate-50)',
              padding: '0.75rem',
              borderRadius: '6px',
              borderLeft: '3px solid var(--emerald-600)',
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
                Tenure Options:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProduct.tenures.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={'btn small ' + (f.tenure_months === m ? 'emerald' : 'ghost')}
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
                placeholder="e.g. Dairy cow purchase, hybrid seeds, inventory"
                required
              />
            </Field>

            <div style={{ marginBottom: '1rem' }}>
              <span className="muted small" style={{ display: 'block', marginBottom: '0.3rem' }}>
                Preset Livelihood Purposes:
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
                  background: 'var(--slate-50)',
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
                  <span style={{ fontWeight: 600 }}>Joint Liability Group (SHG) Guarantee</span>
                  <div className="muted small">Pledged with peer guarantee from your Self-Help Group</div>
                </div>
              </label>
            )}

            {selectedProduct.id === 'kisan_agri' && (
              <div style={{ marginBottom: '1rem', background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '6px' }}>
                <span className="muted small" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Agricultural Repayment Structure:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn small ${f.schedule_type === 'monthly' ? 'emerald' : 'ghost'}`}
                    style={{ textAlign: 'left', padding: '6px 8px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
                    onClick={() => setF({ ...f, schedule_type: 'monthly' })}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>Standard Monthly EMI</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Equal monthly installments</span>
                  </button>
                  <button
                    type="button"
                    className={`btn small ${f.schedule_type === 'harvest_bullet' ? 'emerald' : 'ghost'}`}
                    style={{ textAlign: 'left', padding: '6px 8px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
                    onClick={() => setF({ ...f, schedule_type: 'harvest_bullet' })}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>🌾 Harvest Bullet Schedule</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Maintenance in growth, lumpsum at mandi sale</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="row between" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
                <p className="muted small" style={{ fontWeight: 600, margin: 0 }}>
                  Statutory KYC & Income Verification Documents:
                </p>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => {
                    const allKeys = selectedProduct.docs.map(([k]) => k)
                    setF({ ...f, documents: allKeys })
                  }}
                >
                  + Attach All Verified KYC
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {selectedProduct.docs.map(([k, label]) => {
                  const isAttached = f.documents.includes(k)
                  return (
                    <div
                      key={k}
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: isAttached ? '1.5px solid var(--emerald-600)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: isAttached ? 'var(--emerald-50, #ecfdf5)' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isAttached}
                          onChange={() => toggleDoc(k)}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</div>
                          {isAttached ? (
                            <div className="muted small" style={{ fontSize: '0.7rem', color: 'var(--emerald-600)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <IconCheckCircle size={12} /> {k}_doc_verified.pdf (320 KB) • OCR Verified
                            </div>
                          ) : (
                            <div className="muted small" style={{ fontSize: '0.7rem' }}>
                              Official scanned copy or digilocker pull
                            </div>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        className={`btn small ${isAttached ? 'ghost' : ''}`}
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        onClick={() => toggleDoc(k)}
                      >
                        {isAttached ? 'Detach' : 'Attach File'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              className="btn w-100"
              disabled={busy || !hasProfile}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '10px' }}
            >
              <IconShield size={16} /> Submit Loan Application for Sanction
            </button>
          </form>
        </Card>

        {/* Live AI Underwriting Check */}
        <Card title="Live AI Affordability Evaluation">
          {!preview ? (
            <p className="muted">{hasProfile ? 'Evaluating repayment capacity…' : t('fillProfile')}</p>
          ) : (
            <>
              <div
                style={{
                  background: 'var(--slate-50)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="row between" style={{ marginBottom: '0.5rem' }}>
                  <span className="muted small">AI Underwriting Readiness</span>
                  <Badge tone={preview.band}>{t(preview.band)}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
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
                  background: 'var(--slate-50)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  borderLeft: '3px solid var(--emerald-600)',
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
    </div>
  )
}

export function LoanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useLang()
  const toast = useToast()
  const loan = useLoad(() => api('/loans/' + id), [id])
  const sched = useLoad(() => api('/loans/' + id + '/schedule'), [id])
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [note, setNote] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paySource, setPaySource] = useState('external_upi')
  const [instUtr, setInstUtr] = useState('')
  const [showSanctionModal, setShowSanctionModal] = useState(false)
  const [showForecloseModal, setShowForecloseModal] = useState(false)
  const [forecloseQuote, setForecloseQuote] = useState(null)
  const [busyForeclose, setBusyForeclose] = useState(false)
  const [customPayAmt, setCustomPayAmt] = useState('')
  const staff = user.role === 'officer' || user.role === 'admin'
  const l = loan.data

  const act = async (fn, ok) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await fn()
      setMsg({ kind: 'success', text: ok })
      toast.success(ok)
      loan.reload()
      sched.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
      toast.error(e.message)
    }
  }

  const decide = (approve) =>
    act(
      () => api('/loans/' + id + '/decision', { method: 'POST', body: { approve, note } }),
      approve ? 'Loan sanction approved.' : 'Loan application rejected.'
    )

  const disburse = () =>
    act(
      () => api('/loans/' + id + '/disburse', { method: 'POST' }),
      'Loan principal disbursed to borrower wallet.'
    )

  const cancelLoan = () =>
    act(
      () => api('/loans/' + id + '/cancel', { method: 'POST' }),
      'Loan application withdrawn successfully.'
    )

  const openForeclose = async () => {
    try {
      const q = await api('/loans/' + id + '/foreclosure-quote')
      setForecloseQuote(q)
      setShowForecloseModal(true)
    } catch (e) {
      toast.error(e.message || 'Failed to fetch foreclosure quote')
    }
  }

  const executeForeclose = async () => {
    setBusyForeclose(true)
    try {
      await api('/loans/' + id + '/foreclose', { method: 'POST' })
      toast.success('Loan foreclosed and fully settled with zero penalty!')
      setShowForecloseModal(false)
      loan.reload()
      sched.reload()
    } catch (e) {
      toast.error(e.message || 'Foreclosure settlement failed')
    } finally {
      setBusyForeclose(false)
    }
  }

  const recordPayment = async () => {
    if (!paymentModal) return
    const instNumber = paymentModal.number
    const amount = customPayAmt ? Number(customPayAmt) : undefined
    setPaymentModal(null)
    setCustomPayAmt('')
    await act(
      () =>
        api('/loans/' + id + '/installments/' + instNumber + '/pay', {
          method: 'POST',
          body: {
            amount,
            source: paySource,
            reference_id: paySource === 'external_upi' ? instUtr.trim() || undefined : undefined,
          },
        }),
      `Installment #${instNumber} payment registered.`
    )
  }

  const verify = (d) =>
    act(() => api('/loans/' + id + '/documents/' + d + '/verify', { method: 'POST' }), 'KYC Document authenticated.')

  const rejectDoc = (d) => {
    const reason = window.prompt('Enter reason for document rejection:', 'Document blurry or unreadable')
    if (reason === null) return
    act(
      () => api('/loans/' + id + '/documents/' + d + '/reject', { method: 'POST', body: { approve: false, note: reason } }),
      'Document rejected.'
    )
  }

  const handleUploadDocument = async (docId, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/loans/${id}/documents/${docId}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed')
      }
      toast.success('Document uploaded successfully!')
      loan.reload()
    } catch (e) {
      toast.error(e.message || 'Upload error')
    }
  }

  const handleDownloadDocument = async (docId, origName) => {
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/loans/${id}/documents/${docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Download failed')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = origName || `loan_${id}_doc_${docId}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.message || 'Download error')
    }
  }

  if (loan.loading) return <Loading />
  if (loan.error) return <Alert>{loan.error}</Alert>

  const canPay = l.status === 'approved' && (user.id === l.user_id || staff)
  const installments = sched.data || []
  const paidCount = installments.filter((i) => i.status === 'paid').length
  const totalPaidAmount = installments.reduce((acc, i) => acc + (i.paid_amount || 0), 0)
  const totalScheduledAmount = installments.reduce((acc, i) => acc + (i.amount || 0), 0)
  const remainingAmount = Math.max(0, totalScheduledAmount - totalPaidAmount)
  const repaymentPct = totalScheduledAmount > 0 ? Math.round((totalPaidAmount / totalScheduledAmount) * 100) : 0

  const prodType = l.product_type || 'kisan_agri'
  const productInfo = LOAN_PRODUCTS.find((p) => p.id === prodType) || LOAN_PRODUCTS[0]

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/loans" className="btn small ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Loans Portfolio
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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['approved', 'disbursed'].includes(l.status) && remainingAmount > 0 && (
            <button
              type="button"
              className="btn small"
              onClick={openForeclose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#059669', color: '#fff' }}
            >
              <IconCheck size={15} /> Foreclose Early (0% Fee)
            </button>
          )}
          {l.status === 'pending' && (!staff || user.id === l.user_id) && (
            <button
              type="button"
              className="btn small ghost danger"
              onClick={cancelLoan}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Withdraw Application
            </button>
          )}
          {l.status === 'approved' && (
            <button
              type="button"
              className="btn small emerald"
              onClick={() => setShowSanctionModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconFileText size={15} /> Sanction Letter
            </button>
          )}
          <button
            type="button"
            className="btn small ghost"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPrinter size={15} /> Print Statement
          </button>
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
            Underwriting rules conform to RBI Master Direction – Regulatory Framework for Microfinance Loans Directions, 2022.
          </p>
        </Card>

        <Card title="KYC Document Verifications">
          {l.documents.length === 0 ? (
            <p className="muted small">No auxiliary documents attached.</p>
          ) : (
            <ul className="plain" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {l.documents.map((d) => (
                <li
                  key={d.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle, #f9fafb)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IconFileText size={18} className="text-muted" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {d.doc_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        {d.original_name && (
                          <div className="muted small" style={{ fontSize: '0.78rem' }}>
                            {d.original_name} {d.file_size ? `(${Math.round(d.file_size / 1024)} KB)` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {d.verified ? (
                        <Badge tone="approved">Verified</Badge>
                      ) : d.status === 'rejected' ? (
                        <Badge tone="danger">Rejected</Badge>
                      ) : d.file_path ? (
                        <Badge tone="pending">Uploaded (Pending Check)</Badge>
                      ) : (
                        <Badge tone="neutral">Missing Upload</Badge>
                      )}
                    </div>
                  </div>

                  {d.reject_reason && (
                    <div className="small" style={{ color: '#dc2626', marginBottom: '0.5rem', background: '#fef2f2', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      Rejection note: {d.reject_reason}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {d.file_path && (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => handleDownloadDocument(d.id, d.original_name)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <IconDownload size={13} /> View / Download
                      </button>
                    )}

                    {!['closed', 'withdrawn', 'rejected'].includes(l.status) && (user.id === l.user_id || staff) && (
                      <label
                        className="btn small ghost"
                        style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <IconUpload size={13} /> {d.file_path ? 'Replace File' : 'Upload File'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadDocument(d.id, e.target.files[0])
                          }}
                        />
                      </label>
                    )}

                    {staff && d.file_path && !d.verified && (
                      <>
                        <button
                          type="button"
                          className="btn small emerald"
                          onClick={() => verify(d.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <IconCheck size={13} /> Verify
                        </button>
                        <button
                          type="button"
                          className="btn small ghost danger"
                          onClick={() => rejectDoc(d.id)}
                        >
                          Reject
                        </button>
                      </>
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
              placeholder="e.g. Sanctioned subject to peer joint guarantee confirmation"
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

      {staff && l.status === 'approved' && !l.disbursed_on && (
        <Card title="Loan Principal Disbursement Terminal" style={{ marginBottom: '1.25rem' }}>
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            This loan was approved by credit underwriting. Executing disbursement credits <b>{money(l.amount)}</b> directly into the borrower's digital wallet and activates the amortization schedule.
          </p>
          <button className="btn emerald" onClick={disburse} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconCreditCard size={16} /> Disburse {money(l.amount)} to Borrower Wallet
          </button>
        </Card>
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
                    <th>Phase / Type</th>
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
                      <td>
                        {i.is_harvest ? (
                          <span className="badge approved" style={{ fontSize: '0.7rem' }}>
                            🌾 Harvest Bullet
                          </span>
                        ) : i.phase && i.phase.includes('Gestation') ? (
                          <span className="badge neutral" style={{ fontSize: '0.7rem' }}>
                            🌱 Gestation
                          </span>
                        ) : (
                          <span className="badge neutral" style={{ fontSize: '0.7rem' }}>
                            Monthly EMI
                          </span>
                        )}
                      </td>
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
                            <IconCreditCard size={14} /> Pay via UPI
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
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Settle Instalment #{paymentModal.number}</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPaymentModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>Due Date:</span>
                <b>{paymentModal.due_date}</b>
              </div>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>Scheduled Amount:</span>
                <b>{money(paymentModal.amount)}</b>
              </div>
              <div className="row between small">
                <span>Principal Component:</span>
                <span>{money(paymentModal.principal_part)}</span>
              </div>
            </div>

            <Field label="Amount to Settle (₹)">
              <input
                type="number"
                min="1"
                max={paymentModal.amount - (paymentModal.paid_amount || 0)}
                value={customPayAmt}
                onChange={(e) => setCustomPayAmt(e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
              <button
                type="button"
                className={`btn small ${paySource === 'external_upi' ? '' : 'ghost'}`}
                onClick={() => setPaySource('external_upi')}
              >
                📱 UPI / Bank
              </button>
              <button
                type="button"
                className={`btn small ${paySource === 'wallet' ? '' : 'ghost'}`}
                onClick={() => setPaySource('wallet')}
              >
                💼 Wallet ({money(user?.savings_balance || 0)})
              </button>
            </div>

            {paySource === 'external_upi' ? (
              <Field label="Bank / UPI Reference No. (UTR)">
                <input
                  type="text"
                  placeholder="e.g. 428901234567"
                  value={instUtr}
                  onChange={(e) => setInstUtr(e.target.value)}
                />
              </Field>
            ) : (
              <div style={{ padding: '0.65rem 0.85rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem' }}>
                Wallet Balance: <b>{money(user?.savings_balance || 0)}</b>
                {(user?.savings_balance || 0) < Number(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0)) && (
                  <p style={{ color: '#dc2626', marginTop: '0.3rem', fontWeight: 600 }}>
                    ⚠️ Insufficient balance in wallet. Please choose UPI / Bank above.
                  </p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPaymentModal(null)}>
                Cancel
              </button>
              <button
                className="btn"
                disabled={paySource === 'wallet' && (user?.savings_balance || 0) < Number(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0))}
                onClick={recordPayment}
              >
                Confirm Settlement ({money(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0))})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foreclosure Modal (Zero Foreclosure Penalty Policy) */}
      {showForecloseModal && forecloseQuote && (
        <div className="modal-overlay" onClick={() => setShowForecloseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Early Loan Foreclosure & Settlement</h3>
              <button type="button" className="icon-btn" onClick={() => setShowForecloseModal(false)}>✕</button>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#065f46', fontSize: '0.82rem', lineHeight: 1.4 }}>
              <b>RBI Fair Practices Code Guarantee:</b> {forecloseQuote.message}
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">Outstanding Principal:</span>
                <b>{money(forecloseQuote.outstanding_principal)}</b>
              </div>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">Accrued Month Interest:</span>
                <b>{money(forecloseQuote.accrued_interest)}</b>
              </div>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">Foreclosure Penalty Fee:</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>₹0.00 (Zero Penalty)</span>
              </div>
              <div className="row between" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', fontSize: '1rem' }}>
                <span><b>Total Settlement Due:</b></span>
                <b style={{ color: 'var(--emerald-700)' }}>{money(forecloseQuote.total_settlement_amount)}</b>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
              <span>Available Wallet Balance: <b>{money(user?.savings_balance || 0)}</b></span>
              {(user?.savings_balance || 0) < forecloseQuote.total_settlement_amount && (
                <p style={{ color: '#dc2626', marginTop: '0.3rem', fontWeight: 600 }}>
                  ⚠️ Your wallet balance is less than the settlement amount. Please deposit funds into your wallet to complete early closure.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setShowForecloseModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn emerald"
                disabled={busyForeclose || (user?.savings_balance || 0) < forecloseQuote.total_settlement_amount}
                onClick={executeForeclose}
              >
                {busyForeclose ? 'Closing Loan…' : `Settle & Close Loan (${money(forecloseQuote.total_settlement_amount)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Sanction Letter Modal */}
      {showSanctionModal && (
        <div className="modal-overlay" onClick={() => setShowSanctionModal(false)}>
          <div
            className="modal-card sanction-letter-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}
          >
            {/* Sanction Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--emerald-600)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <IconShield size={24} className="text-emerald" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
                    FINANCESAATHI CREDIT DESK
                  </span>
                </div>
                <div className="muted small" style={{ fontSize: '0.74rem' }}>
                  Statutory Regulated Microfinance & Priority Sector Lending Platform • RBI PSL Master Direction 2022 Compliant
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge approved" style={{ fontWeight: 700 }}>SANCTION ORDER</span>
                <div className="muted small" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                  Ref: FS/SANCTION/2026/{String(l.id).padStart(4, '0')}
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between small" style={{ marginBottom: '0.75rem', background: 'var(--slate-50)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div>
                  <span className="muted">Sanction Date:</span> <b>{l.decided_at ? new Date(l.decided_at + 'Z').toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</b>
                </div>
                <div>
                  <span className="muted">Borrower:</span> <b>{l.borrower_name} (#{l.user_id})</b>
                </div>
                <div>
                  <span className="muted">SHG Affiliation:</span> <b>{l.shg_id ? `SHG #${l.shg_id}` : 'Direct Account'}</b>
                </div>
              </div>

              <p style={{ fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                We are pleased to convey official credit sanction for the facility described herein under the <b>{productInfo.title}</b> program, following automated underwriting and KYC verification.
              </p>

              {/* Terms Table */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Sanctioned Principal:</div>
                  <div style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: 'var(--emerald-700)' }}>{money(l.amount)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Annual Interest Rate (APR):</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.annual_rate}% p.a. (Reducing Balance Method)</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Repayment Tenure:</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.tenure_months} Months</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Amortization Protocol:</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    {l.schedule_type === 'harvest_bullet' ? '🌾 Harvest-Aligned Bullet (Gestation Maintenance + Post-Harvest Bullets)' : 'Equated Monthly Installment (EMI)'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Stated Livelihood Purpose:</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.purpose || 'Agricultural / Livelihood Facility'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>Foreclosure / Prepayment Penalty:</div>
                  <div style={{ padding: '0.5rem 0.75rem', color: 'var(--emerald-600)', fontWeight: 600 }}>NIL (0% per RBI Fair Practice Code)</div>
                </div>
              </div>

              {/* Statutory Fair Practice Code Seal */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 0.85rem', borderRadius: '6px', borderLeft: '3px solid var(--emerald-600)', fontSize: '0.76rem', color: '#475569', marginBottom: '1.25rem' }}>
                <b>Statutory Fair Practices Declaration:</b> Issued under the RBI Fair Practices Code for Microfinance Institutions. The borrower is entitled to an itemized passbook, transparent reducing-rate calculation, and zero foreclosure penalties.
              </div>

              {/* Digital Officer Seal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--emerald-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-600)' }}>
                    <IconAward size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>AUTHORIZED SANCTION DESK</div>
                    <div className="muted small" style={{ fontSize: '0.7rem' }}>FinanceSaathi Automated Underwriting</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge approved" style={{ fontSize: '0.7rem' }}>✓ DIGITALLY SEALED</span>
                  <div className="muted small" style={{ fontSize: '0.68rem', marginTop: '2px' }}>DPDP-2023 Verified</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn ghost" onClick={() => setShowSanctionModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={15} /> Print / Save Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
