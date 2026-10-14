import { useEffect, useState, useMemo } from 'react'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Badge, Card, Loading, useLoad } from '../ui'
import {
  IconLandmark,
  IconTractor,
  IconUsers,
  IconCart,
  IconZap,
  IconHospital,
  IconShield,
  IconArrowRight,
  IconCheck,
  IconSearch,
  IconFilter,
  IconAward,
} from '../icons'

// UI Metadata enriching server schemes with nodal ministry and application steps
const SCHEME_METADATA = {
  pm_kisan: {
    nodalMinistry: 'Ministry of Agriculture & Farmers Welfare',
    tag: '100% Central DBT Grant',
    documents: ['Aadhaar Card (Mandatory)', 'Landownership Records (7/12 / Khasra Document)', 'Bank Account Passbook with IFSC'],
    applicationSteps: 'Register on official PM-KISAN portal or via Common Service Centre (CSC). State nodal officer verifies landholding records.',
    defaultUrl: 'https://pmkisan.gov.in',
  },
  pm_mudra: {
    nodalMinistry: 'Ministry of Finance / Dept of Financial Services',
    tag: 'Collateral-Free MSME Credit',
    documents: ['Identity & Address Proof (Aadhaar / Voter ID)', 'Business Registration / Shop Establishment Certificate', 'Quotations for machinery / inventory'],
    applicationSteps: 'Apply online on Udyam Mitra portal or submit proposal directly at any commercial, rural, or cooperative bank branch.',
    defaultUrl: 'https://www.mudra.org.in',
  },
  pm_svanidhi: {
    nodalMinistry: 'Ministry of Housing and Urban Affairs',
    tag: '7% Direct Interest Rebate',
    documents: ['Aadhaar Card with linked mobile number', 'Certificate of Vending (CoVR) or ULB Recommendation', 'Bank Passbook / UPI QR Merchant Proof'],
    applicationSteps: 'Apply via PM-SVANidhi portal or through ULB nodal officer. Vending certificate/recommendation letter required.',
    defaultUrl: 'https://pmsvanidhi.mohua.gov.in',
  },
  day_nrlm: {
    nodalMinistry: 'Ministry of Rural Development',
    tag: 'SHG Bank Linkage & Interest Subsidy',
    documents: ['SHG Member Passbook & Resolution Book', 'Aadhaar Card of Member', 'SHG Bank Account Details'],
    applicationSteps: 'Form or join village Self-Help Group (SHG) under State Rural Livelihood Mission (SRLM). Access Community Investment Fund (CIF).',
    defaultUrl: 'https://aajeevika.gov.in',
  },
  pmjdy: {
    nodalMinistry: 'Department of Financial Services, Ministry of Finance',
    tag: 'Universal Zero-Balance Banking',
    documents: ['Aadhaar Card (or any Officially Valid Document)', 'Passport size photograph'],
    applicationSteps: 'Open zero-balance Jan Dhan account at any bank branch or Bank Mitra / Business Correspondent point with Aadhaar.',
    defaultUrl: 'https://pmjdy.gov.in',
  },
  pm_kusum: {
    nodalMinistry: 'Ministry of New & Renewable Energy (MNRE)',
    tag: 'Up to 60% Solar Pump Subsidy',
    documents: ['Land Revenue 7/12 Extract', 'Aadhaar Card & Bank Account Passbook', 'Water Source Certificate / Ground Water Clearance'],
    applicationSteps: 'Apply through State Renewable Energy Agency portal (e.g. MEDA / DISCOM). Pay farmer contribution of 10-40%.',
    defaultUrl: 'https://pmkusum.mnre.gov.in',
  },
  pm_awas: {
    nodalMinistry: 'Ministry of Rural Development',
    tag: 'Direct House Grant + MGNREGA',
    documents: ['Aadhaar Card of all adult family members', 'MGNREGA Job Card', 'Bank Account Passbook (Aadhaar linked)'],
    applicationSteps: 'Gram Sabha identifies eligible beneficiaries from SECC census list. Direct DBT grant transferred in geotagged construction phases.',
    defaultUrl: 'https://pmayg.nic.in',
  },
  sukanya: {
    nodalMinistry: 'Ministry of Finance / National Savings Institute',
    tag: '8.2% Sovereign Compounding Interest',
    documents: ['Birth Certificate of Girl Child', 'Identity Proof of Parent/Guardian (Aadhaar / PAN)', 'Address Proof of Guardian'],
    applicationSteps: 'Open account at any Post Office or authorized commercial bank branch with starter deposit of Rs 250.',
    defaultUrl: 'https://www.indiapost.gov.in',
  },
}

// Fallback scheme catalog for offline resilience
const FALLBACK_SCHEMES = [
  {
    code: 'pm_kisan',
    name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    category: 'agri',
    benefit_summary: 'Rs 6,000 / Year Direct DBT in 3 tranches of Rs 2,000',
    benefit_value: 6000,
    description: 'Direct income support scheme providing guaranteed financial assistance to small and marginal landholding farmer families.',
    eligibility: 'Small and marginal farmer families holding cultivable land in state revenue records with Aadhaar-linked bank accounts.',
    eligibility_rules: { occupations: ['farmer'], requiresLand: true, maxIncome: 800000 },
    url: 'https://pmkisan.gov.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'pm_mudra',
    name: 'PMMY (Pradhan Mantri MUDRA Yojana)',
    category: 'msme',
    benefit_summary: 'Collateral-free institutional microcredit up to Rs 10 Lakh',
    benefit_value: 1000000,
    description: 'Provides institutional credit to micro and small non-farm enterprises for trading, manufacturing, and retail expansion.',
    eligibility: 'Micro enterprises, retail shopkeepers, and manufacturing units with clean repayment records.',
    eligibility_rules: { occupations: ['vendor', 'artisan', 'dairy', 'general'], requiresLand: false, maxIncome: 1200000 },
    url: 'https://www.mudra.org.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'pm_svanidhi',
    name: 'PM-SVANidhi (Street Vendor Financial Facility)',
    category: 'msme',
    benefit_summary: 'Rs 10,000 to Rs 50,000 working capital + 7% interest rebate',
    benefit_value: 50000,
    description: 'Dedicated working capital facility empowering urban and peri-urban street vendors and hawkers with digital cashback incentives.',
    eligibility: 'Urban and semi-urban street vendors and hawkers holding Certificate of Vending or Urban Local Body recommendation.',
    eligibility_rules: { occupations: ['vendor', 'artisan', 'general'], requiresLand: false, maxIncome: 500000 },
    url: 'https://pmsvanidhi.mohua.gov.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'day_nrlm',
    name: 'DAY-NRLM (Deendayal Antyodaya Yojana - Ajeevika)',
    category: 'women',
    benefit_summary: 'Community Investment Support & Subsidized SHG Bank Linkage',
    benefit_value: 250000,
    description: 'National Rural Livelihoods Mission organizing rural women into Self-Help Groups with revolving funds and low-interest bank linkage.',
    eligibility: 'Rural women from low-income households organized into active SHGs with regular thrift savings.',
    eligibility_rules: { occupations: ['farmer', 'artisan', 'dairy', 'general'], isShgOnly: true, isWomanOnly: true, maxIncome: 400000 },
    url: 'https://aajeevika.gov.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'pmjdy',
    name: 'PMJDY (Pradhan Mantri Jan Dhan Yojana)',
    category: 'banking',
    benefit_summary: 'Zero-balance savings account + Rs 2 Lakh accidental cover + Rs 10k OD',
    benefit_value: 10000,
    description: 'Universal zero-balance basic savings bank account with free RuPay debit card and overdraft facility.',
    eligibility: 'Any unbanked Indian citizen aged 10+ with basic KYC proof.',
    eligibility_rules: { occupations: ['farmer', 'vendor', 'artisan', 'dairy', 'general'], maxIncome: 10000000 },
    url: 'https://pmjdy.gov.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'pm_kusum',
    name: 'PM-KUSUM (Solar Agri Pump Subsidy)',
    category: 'solar',
    benefit_summary: 'Up to 60% combined Central and State solar pump capital subsidy',
    benefit_value: 200000,
    description: 'Subsidizes standalone solar irrigation pumps up to 7.5 HP to replace expensive diesel generator sets.',
    eligibility: 'Farmers, Farmer Producer Organizations (FPOs), and rural water user associations with farmland.',
    eligibility_rules: { occupations: ['farmer'], requiresLand: true, maxIncome: 1500000 },
    url: 'https://pmkusum.mnre.gov.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'pm_awas',
    name: 'PMAY-G (Pradhan Mantri Awas Yojana - Gramin)',
    category: 'housing',
    benefit_summary: 'Rs 1.20 Lakh direct pucca house grant + 90 days MGNREGA wages',
    benefit_value: 120000,
    description: 'Financial grant assistance for homeless rural households or those living in kutcha/dilapidated homes.',
    eligibility: 'Rural homeless or kutcha house households identified via SECC census list.',
    eligibility_rules: { occupations: ['farmer', 'vendor', 'artisan', 'dairy', 'general'], maxIncome: 300000 },
    url: 'https://pmayg.nic.in',
    last_verified: '2026-10-01',
  },
  {
    code: 'sukanya',
    name: 'Sukanya Samriddhi Yojana (SSY)',
    category: 'savings',
    benefit_summary: '8.2% Sovereign compounding interest rate with 100% tax exemption',
    benefit_value: 150000,
    description: 'Small deposit savings scheme for girl child education and marriage, offering guaranteed high compounding interest.',
    eligibility: 'Parents or legal guardians of a girl child from birth up to age 10.',
    eligibility_rules: { occupations: ['farmer', 'vendor', 'artisan', 'dairy', 'general'], isWomanOnly: true, maxIncome: 1500000 },
    url: 'https://www.indiapost.gov.in',
    last_verified: '2026-10-01',
  },
]

export default function SchemesPortal() {
  const { lang, t } = useLang()
  const { user } = useAuth()
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedScheme, setSelectedScheme] = useState(null)

  // Load live localized schemes from backend
  const { data: serverSchemes, loading: schemesLoading } = useLoad(
    () => api(`/schemes?language=${lang}`, { auth: false }),
    [lang]
  )

  // Smart Eligibility Finder State (Auto-populated from User Profile)
  const [finderOccupation, setFinderOccupation] = useState('farmer')
  const [finderIncome, setFinderIncome] = useState(180000)
  const [finderIsShg, setFinderIsShg] = useState(true)
  const [finderHasLand, setFinderHasLand] = useState(true)
  const [finderIsWoman, setFinderIsWoman] = useState(true)
  const [showOnlyEligible, setShowOnlyEligible] = useState(false)

  // Auto-populate from logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.monthly_income > 0) {
        setFinderIncome(user.monthly_income * 12)
      }
      if (user.shg_id) {
        setFinderIsShg(true)
      }
    }
  }, [user])

  // Process server schemes with rich presentation metadata
  const schemesList = useMemo(() => {
    const sourceData = (serverSchemes && Array.isArray(serverSchemes) && serverSchemes.length > 0)
      ? serverSchemes
      : FALLBACK_SCHEMES

    return sourceData.map((s) => {
      const code = s.code || 'general'
      const meta = SCHEME_METADATA[code] || {}
      return {
        id: code,
        code: (s.code || '').toUpperCase().replace('_', '-'),
        name: s.name,
        category: s.category || 'general',
        nodalMinistry: meta.nodalMinistry || 'Government of India',
        tag: meta.tag || 'Central Welfare Scheme',
        valueNum: Number(s.benefit_value) || 0,
        benefitHighlight: s.benefit_summary || (s.benefit_value > 0 ? `Direct financial assistance up to ₹${Number(s.benefit_value).toLocaleString('en-IN')}` : 'Institutional Support'),
        summary: s.description || '',
        eligibilityCriteria: s.eligibility ? s.eligibility.split('. ').filter(Boolean) : ['Indian citizens meeting specific program criteria'],
        documents: meta.documents || ['Aadhaar Card', 'Bank Passbook'],
        applicationSteps: meta.applicationSteps || 'Apply at official government portal or local Common Service Centre (CSC).',
        portalUrl: s.url || meta.defaultUrl || 'https://www.india.gov.in',
        last_verified: s.last_verified || '2026-10-01',
        matchCriteria: s.eligibility_rules || { occupations: ['farmer', 'vendor', 'artisan', 'dairy', 'general'] },
      }
    })
  }, [serverSchemes])

  // Matching logic
  const isEligible = (sch) => {
    const c = sch.matchCriteria || {}
    if (c.occupations && !c.occupations.includes(finderOccupation)) return false
    if (c.requiresLand && !finderHasLand) return false
    if (c.isShgOnly && !finderIsShg) return false
    if (c.isWomanOnly && !finderIsWoman) return false
    if (c.maxIncome && finderIncome > c.maxIncome) return false
    return true
  }

  const eligibleSchemes = schemesList.filter(isEligible)
  const totalEligibleValue = eligibleSchemes.reduce((acc, s) => acc + s.valueNum, 0)

  const displayedSchemes = schemesList.filter((s) => {
    if (showOnlyEligible && !isEligible(s)) return false
    if (selectedCat !== 'all' && s.category !== selectedCat) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.nodalMinistry.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2>Government Welfare & Subsidy Schemes</h2>
          <p className="page-subtitle">
            Central & State flagship financial assistance, direct DBT grants, credit subsidies, and social protection
          </p>
        </div>
      </div>

      {/* Interactive Smart Eligibility Finder Banner */}
      <div className="card eligibility-finder-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
          <IconAward size={22} className="text-emerald" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Smart Scheme Eligibility Matcher</h3>
          {user && (
            <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--emerald-50)', color: 'var(--emerald-700)', border: '1px solid var(--emerald-200)' }}>
              Auto-matched to your profile
            </span>
          )}
        </div>
        <p className="muted small" style={{ marginBottom: '1.25rem' }}>
          Adjust your household parameters to calculate the exact government grants and subsidized capital available to you.
        </p>

        <div className="finder-inputs-grid">
          <div className="field" style={{ margin: 0 }}>
            <span>Primary Livelihood</span>
            <select
              value={finderOccupation}
              onChange={(e) => setFinderOccupation(e.target.value)}
            >
              <option value="farmer">Farmer / Crop Cultivator</option>
              <option value="vendor">Street Vendor / Kirana Trader</option>
              <option value="dairy">Dairy & Livestock Rearer</option>
              <option value="artisan">Rural Artisan / Handloom</option>
              <option value="general">General Micro-Enterprise / Service</option>
            </select>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <span>Annual Household Income (₹)</span>
            <input
              type="number"
              step="10000"
              min="20000"
              max="2000000"
              value={finderIncome}
              onChange={(e) => setFinderIncome(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <label className="check">
              <input
                type="checkbox"
                checked={finderHasLand}
                onChange={(e) => setFinderHasLand(e.target.checked)}
              />
              <span>Owns Agricultural Land (7/12 Extract)</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={finderIsShg}
                onChange={(e) => setFinderIsShg(e.target.checked)}
              />
              <span>Active Self-Help Group (SHG) Member</span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <label className="check">
              <input
                type="checkbox"
                checked={finderIsWoman}
                onChange={(e) => setFinderIsWoman(e.target.checked)}
              />
              <span>Woman Borrower / Woman Co-Applicant</span>
            </label>
            <button
              type="button"
              className={`btn small ${showOnlyEligible ? 'emerald' : 'ghost'}`}
              onClick={() => setShowOnlyEligible(!showOnlyEligible)}
              style={{ marginTop: '0.2rem' }}
            >
              {showOnlyEligible ? '✓ Showing Matched Only' : 'Filter by My Match'}
            </button>
          </div>
        </div>

        {/* Calculated Match Banner */}
        <div className="finder-results-bar">
          <div>
            <span className="results-label">TOTAL GOVERNMENT ASSISTANCE UNLOCKED</span>
            <div className="results-amount">
              Up to {money(totalEligibleValue)} in Direct Grants & Concessions
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge approved" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              ✓ {eligibleSchemes.length} of {schemesList.length} Flagship Schemes Matched
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search */}
      <div className="card filter-bar-card" style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Schemes' },
            { id: 'agri', label: 'Agriculture & Allied' },
            { id: 'msme', label: 'MSME & Vendors' },
            { id: 'women', label: 'Women & SHG' },
            { id: 'solar', label: 'Clean Energy & Solar' },
            { id: 'housing', label: 'Housing Grants' },
            { id: 'savings', label: 'Savings & Deposit' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`btn small ${selectedCat === cat.id ? '' : 'ghost'}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ width: '260px' }}>
          <input
            placeholder="Search scheme name, ministry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.84rem', padding: '6px 10px' }}
          />
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="schemes-catalog-grid">
        {displayedSchemes.map((s) => {
          const matched = isEligible(s)
          return (
            <div key={s.id} className={`scheme-card ${matched ? 'matched' : ''}`}>
              <div className="scheme-card-header">
                <div>
                  <span className="scheme-code-badge">{s.code}</span>
                  <span className="scheme-tag-pill">{s.tag}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="muted small" style={{ fontSize: '0.72rem' }}>
                    Verified: {s.last_verified}
                  </span>
                  {matched && (
                    <span className="badge approved" style={{ fontSize: '0.7rem' }}>
                      ✓ Eligible
                    </span>
                  )}
                </div>
              </div>

              <h3 className="scheme-title">{s.name}</h3>
              <p className="scheme-ministry">{s.nodalMinistry}</p>

              <div className="scheme-highlight-box">
                <span className="highlight-label">KEY BENEFIT</span>
                <span className="highlight-text">{s.benefitHighlight}</span>
              </div>

              <p className="scheme-summary">{s.summary}</p>

              <div className="scheme-footer-actions">
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => setSelectedScheme(s)}
                >
                  View Details & KYC
                </button>
                <a
                  href={s.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  Official Portal <IconArrowRight size={13} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {displayedSchemes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', marginTop: '1rem' }}>
          <p className="muted">No schemes found matching the selected filters.</p>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              setSelectedCat('all')
              setSearch('')
              setShowOnlyEligible(false)
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Detailed Modal */}
      {selectedScheme && (
        <div className="modal-overlay" onClick={() => setSelectedScheme(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <span className="badge neutral">{selectedScheme.code}</span>
                <h3 style={{ margin: '0.3rem 0 0 0' }}>{selectedScheme.name}</h3>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.2rem' }}>
                  <span className="muted small">{selectedScheme.nodalMinistry}</span>
                  <span className="muted small">• Verified: {selectedScheme.last_verified}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedScheme(null)} aria-label="Close modal">✕</button>
            </div>

            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '6px', margin: '0.85rem 0', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-600)', textTransform: 'uppercase' }}>
                Flagship Benefit
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {selectedScheme.benefitHighlight}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--slate-900)' }}>Eligibility Criteria:</h4>
              <ul className="factors-list" style={{ paddingLeft: '1rem' }}>
                {selectedScheme.eligibilityCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--slate-900)' }}>Required KYC & Application Documents:</h4>
              <ul className="factors-list" style={{ paddingLeft: '1rem' }}>
                {selectedScheme.documents.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--card-bg-subtle)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                Step-by-Step Application Process:
              </div>
              <p className="muted small" style={{ margin: '0.3rem 0 0 0' }}>
                {selectedScheme.applicationSteps}
              </p>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setSelectedScheme(null)}>
                Close
              </button>
              <a
                href={selectedScheme.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Go to Official Government Portal <IconArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
