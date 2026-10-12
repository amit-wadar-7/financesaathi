import { useState } from 'react'
import { money } from '../api'
import { Badge, Card } from '../ui'
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

export const GOVERNMENT_SCHEMES = [
  {
    id: 'pm_kisan',
    code: 'PM-KISAN',
    name: 'Pradhan Mantri Kisan Samman Nidhi',
    nodalMinistry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'agri',
    tag: '100% Central DBT Grant',
    valueNum: 6000,
    benefitHighlight: '₹6,000 / Year Direct Bank Transfer in 3 tranches of ₹2,000',
    summary:
      'Direct income support scheme providing guaranteed financial assistance to small and marginal agricultural landholder families across India with zero intermediary fees.',
    eligibilityCriteria: [
      'Small and marginal farmer families holding cultivable land',
      'Name recorded in state land revenue records (7/12 extract / Khasra)',
      'Bank account must be Aadhaar-seeded for direct DBT credit',
    ],
    documents: [
      'Aadhaar Card (Mandatory)',
      'Landownership Records (7/12 / Khasra Document)',
      'Active Bank Account Passbook with IFSC',
    ],
    applicationSteps:
      'Register on official PM-KISAN portal or via Common Service Centre (CSC). State nodal officer verifies landholding records.',
    portalUrl: 'https://pmkisan.gov.in',
    matchCriteria: {
      occupations: ['farmer'],
      requiresLand: true,
      maxIncome: 800000,
    },
  },
  {
    id: 'pm_mudra',
    code: 'PMMY',
    name: 'Pradhan Mantri MUDRA Yojana',
    nodalMinistry: 'Ministry of Finance / Dept of Financial Services',
    category: 'msme',
    tag: 'Collateral-Free MSME Credit',
    valueNum: 1000000,
    benefitHighlight: 'Collateral-free loans up to ₹10 Lakh across Shishu, Kishore & Tarun',
    summary:
      'Provides institutional credit to micro and small non-farm enterprises for trading, manufacturing, and retail expansion with zero collateral requirement and concessional rates.',
    eligibilityCriteria: [
      'Indian citizens running micro enterprises, shopkeeping, or trading units',
      'Manufacturing, trading, processing, and allied agricultural service businesses',
      'Clean repayment record with no bank defaults',
    ],
    documents: [
      'Identity & Address Proof (Aadhaar / Voter ID)',
      'Business Registration / Shop Establishment Certificate',
      'Quotations for machinery / stock inventory procurement',
    ],
    applicationSteps:
      'Apply online on Udyam Mitra portal or submit proposal directly at any commercial, rural, or cooperative bank branch.',
    portalUrl: 'https://www.mudra.org.in',
    matchCriteria: {
      occupations: ['vendor', 'artisan', 'dairy', 'general'],
      requiresLand: false,
      maxIncome: 1200000,
    },
  },
  {
    id: 'pm_svanidhi',
    code: 'PM-SVANidhi',
    name: "PM Street Vendor's AtmaNirbhar Nidhi",
    nodalMinistry: 'Ministry of Housing and Urban Affairs',
    category: 'msme',
    tag: '7% Direct Interest Rebate',
    valueNum: 50000,
    benefitHighlight: '₹10,000 → ₹20,000 → ₹50,000 working capital + 7% interest rebate',
    summary:
      'Dedicated micro-credit facility empowering urban and peri-urban street vendors and hawkers to resume and expand daily livelihoods with digital cashback rewards.',
    eligibilityCriteria: [
      'Urban and semi-urban street vendors, cart pullers, and hawkers',
      'Vendors holding Certificate of Vending or ULB Letter of Recommendation (LoR)',
      'Prompt repayment unlocks higher credit tiers automatically',
    ],
    documents: [
      'Aadhaar Card with linked mobile number',
      'Certificate of Vending (CoVR) or Urban Local Body (ULB) Recommendation',
      'Bank Passbook / UPI QR Merchant Proof',
    ],
    applicationSteps:
      'Submit online application via PM SVANidhi portal or nearest Municipal Ward Office with Aadhaar OTP authentication.',
    portalUrl: 'https://pmsvanidhi.mohua.gov.in',
    matchCriteria: {
      occupations: ['vendor'],
      requiresLand: false,
      maxIncome: 400000,
    },
  },
  {
    id: 'pm_kusum',
    code: 'PM-KUSUM',
    name: 'Pradhan Mantri Kisan Urja Suraksha (PM-KUSUM)',
    nodalMinistry: 'Ministry of New and Renewable Energy',
    category: 'solar',
    tag: 'Up to 60% Capital Subsidy',
    valueNum: 150000,
    benefitHighlight: '60% Combined Capital Subsidy on Standalone Solar Irrigation Pumps',
    summary:
      'De-diesels the agricultural sector by subsidizing off-grid and grid-connected solar water irrigation pumps (3HP to 7.5HP) and rural decentralized renewable power.',
    eligibilityCriteria: [
      'Individual agricultural cultivators and farmers with water source',
      'Farmer Producer Organizations (FPOs) and Water User Associations (WUAs)',
      'Cultivable land suitable for solar array installation',
    ],
    documents: [
      'Landownership Documentation (7/12 Extract)',
      'Aadhaar Card and Passport Photo',
      'Bank Account Passbook for state subsidy disbursement',
    ],
    applicationSteps:
      'Register on State Renewable Energy Development Agency (SREDA) portal and pay nominal 10% farmer share after sanction.',
    portalUrl: 'https://pmkusum.mnre.gov.in',
    matchCriteria: {
      occupations: ['farmer'],
      requiresLand: true,
      maxIncome: 1000000,
    },
  },
  {
    id: 'standup_india',
    code: 'Stand-Up India',
    name: 'Stand-Up India Enterprise Scheme',
    nodalMinistry: 'Ministry of Finance / SIDBI',
    category: 'women',
    tag: '₹10 Lakh to ₹1 Crore Financing',
    valueNum: 2500000,
    benefitHighlight: 'Bank loans from ₹10 Lakh up to ₹1 Crore for greenfield enterprises',
    summary:
      'Promotes entrepreneurship by facilitating at least one woman or SC/ST borrower per scheduled commercial bank branch to establish new non-farm greenfield businesses.',
    eligibilityCriteria: [
      'Women entrepreneurs or SC/ST individuals aged 18+',
      'Greenfield project in manufacturing, services, agri-allied, or trading',
      'Non-individual enterprises must have 51% woman/SC/ST shareholding',
    ],
    documents: [
      'Identity & Address Proof, PAN Card',
      'Detailed Project Appraisal Report (DPR)',
      'Proof of promoter contribution (minimum 15% equity margin)',
    ],
    applicationSteps:
      'Apply online through Stand-Up Mitra portal (standupmitra.in) or walk into nearest scheduled commercial bank branch.',
    portalUrl: 'https://www.standupmitra.in',
    matchCriteria: {
      occupations: ['vendor', 'dairy', 'artisan', 'general'],
      isWomanOnly: true,
      requiresLand: false,
      maxIncome: 2000000,
    },
  },
  {
    id: 'pmfby',
    code: 'PMFBY',
    name: 'Pradhan Mantri Fasal Bima Yojana',
    nodalMinistry: 'Ministry of Agriculture & Farmers Welfare',
    category: 'agri',
    tag: '1.5% to 2% Concessional Premium',
    valueNum: 80000,
    benefitHighlight: 'Full sum insured protection against natural drought, flood & pests',
    summary:
      'Comprehensive agricultural risk insurance covering pre-sowing to post-harvest crop losses due to unpreventable weather calamities with ultra-low farmer premium.',
    eligibilityCriteria: [
      'All farmers growing notified crops in notified areas',
      'Both loanee farmers (via KCC) and non-loanee farmers eligible',
      'Covers localized calamities, unseasonal rainfall, and mid-season adversity',
    ],
    documents: [
      'Land Revenue Record / Land Possession Certificate',
      'Crop Sowing Certificate issued by Patwari / Village Agriculture Officer',
      'Aadhaar Card & Bank Passbook',
    ],
    applicationSteps:
      'Enroll via nearest bank branch, Primary Agricultural Credit Society (PACS), or directly on National Crop Insurance Portal.',
    portalUrl: 'https://pmfby.gov.in',
    matchCriteria: {
      occupations: ['farmer'],
      requiresLand: true,
      maxIncome: 1000000,
    },
  },
  {
    id: 'day_nrlm',
    code: 'DAY-NRLM',
    name: 'National Rural Livelihoods Mission (Aajeevika)',
    nodalMinistry: 'Ministry of Rural Development',
    category: 'women',
    tag: 'Interest Subvention Down to 7%',
    valueNum: 150000,
    benefitHighlight: 'Revolving Capital Funds & subsidized bank linkage interest down to 7%',
    summary:
      'Mobilizes rural women into Self-Help Groups (SHGs) and federations, connecting them with formal bank credit, financial literacy training, and micro-enterprise capital.',
    eligibilityCriteria: [
      'Rural households with female members organized into affinity SHGs',
      'SHG practicing Panchasutra (Regular meetings, savings, inter-loaning, timely repayment, accounting)',
      'Subsidized interest rate down to 7% with prompt repayment rebate',
    ],
    documents: [
      'SHG Resolution Register & Membership Roll',
      'Panchasutra Compliance Grade Certificate',
      'Group Bank Account Details',
    ],
    applicationSteps:
      'Contact local Cluster Level Federation (CLF) or Block Mission Management Unit (BMMU) for SHG-Bank linkage.',
    portalUrl: 'https://aajeevika.gov.in',
    matchCriteria: {
      occupations: ['farmer', 'vendor', 'dairy', 'artisan', 'general'],
      isShgOnly: true,
      requiresLand: false,
      maxIncome: 600000,
    },
  },
  {
    id: 'ab_pmjay',
    code: 'AB-PMJAY',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana',
    nodalMinistry: 'National Health Authority (NHA)',
    category: 'social',
    tag: '₹5 Lakh Free Hospital Coverage',
    valueNum: 500000,
    benefitHighlight: '₹5,00,000 / Year Cashless Hospitalization per family per year',
    summary:
      'World largest government-funded health assurance scheme providing complete cashless secondary and tertiary medical treatment across empaneled public & private hospitals.',
    eligibilityCriteria: [
      'Deprived rural and occupational urban families identified under SECC 2011',
      'Zero cap on family size or age of members',
      'Covers pre-existing diseases and 3-day pre / 15-day post hospitalization costs',
    ],
    documents: [
      'Aadhaar Card / Ration Card',
      'Ayushman Card (PM-JAY Golden Card)',
      'Registered Mobile Number',
    ],
    applicationSteps:
      'Check eligibility on mera.pmjay.gov.in or visit any empaneled hospital Ayushman Mitra desk for instant e-card issuance.',
    portalUrl: 'https://pmjay.gov.in',
    matchCriteria: {
      occupations: ['farmer', 'vendor', 'dairy', 'artisan', 'general'],
      requiresLand: false,
      maxIncome: 500000,
    },
  },
  {
    id: 'sukanya_samriddhi',
    code: 'SSY',
    name: 'Sukanya Samriddhi Yojana (Beti Bachao Beti Padhao)',
    nodalMinistry: 'Ministry of Finance / National Savings Institute',
    category: 'women',
    tag: '8.2% Sovereign Guaranteed Interest',
    valueNum: 150000,
    benefitHighlight: '8.2% Highest Sovereign Compounding Interest + 100% Tax Exemption',
    summary:
      'Small deposit savings scheme for girl child education and marriage, offering the highest government guaranteed interest rate with triple tax exemptions (EEE status).',
    eligibilityCriteria: [
      'Parent or legal guardian of a girl child from birth up to age 10',
      'Maximum 2 accounts per family (one for each girl child)',
      'Minimum deposit ₹250/year, maximum ₹1,50,000/year',
    ],
    documents: [
      'Birth Certificate of Girl Child',
      'Identity Proof of Parent/Guardian (Aadhaar / PAN)',
      'Address Proof of Guardian',
    ],
    applicationSteps:
      'Open account at any Post Office or authorized commercial bank branch with starter deposit of ₹250.',
    portalUrl: 'https://www.indiapost.gov.in',
    matchCriteria: {
      occupations: ['farmer', 'vendor', 'dairy', 'artisan', 'general'],
      requiresLand: false,
      maxIncome: 1500000,
    },
  },
]

export default function SchemesPortal() {
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedScheme, setSelectedScheme] = useState(null)

  // Eligibility Finder State
  const [finderOccupation, setFinderOccupation] = useState('farmer')
  const [finderIncome, setFinderIncome] = useState(180000)
  const [finderIsShg, setFinderIsShg] = useState(true)
  const [finderHasLand, setFinderHasLand] = useState(true)
  const [finderIsWoman, setFinderIsWoman] = useState(true)
  const [showOnlyEligible, setShowOnlyEligible] = useState(false)

  // Matching logic
  const isEligible = (sch) => {
    const c = sch.matchCriteria
    if (c.occupations && !c.occupations.includes(finderOccupation)) return false
    if (c.requiresLand && !finderHasLand) return false
    if (c.isShgOnly && !finderIsShg) return false
    if (c.isWomanOnly && !finderIsWoman) return false
    if (c.maxIncome && finderIncome > c.maxIncome) return false
    return true
  }

  const eligibleSchemes = GOVERNMENT_SCHEMES.filter(isEligible)
  const totalEligibleValue = eligibleSchemes.reduce((acc, s) => acc + s.valueNum, 0)

  const displayedSchemes = GOVERNMENT_SCHEMES.filter((s) => {
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
        </div>
        <p className="muted small" style={{ marginBottom: '1.25rem' }}>
          Answer 4 quick profile questions to calculate the exact government grants and subsidized capital available to you.
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
            <span>Annual Household Income (Rs)</span>
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
              ✓ {eligibleSchemes.length} of {GOVERNMENT_SCHEMES.length} Flagship Schemes Matched
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
            { id: 'social', label: 'Social & Healthcare' },
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
                {matched && (
                  <span className="badge approved" style={{ fontSize: '0.7rem' }}>
                    ✓ Eligible
                  </span>
                )}
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
                <span className="muted small">{selectedScheme.nodalMinistry}</span>
              </div>
              <button className="icon-btn" onClick={() => setSelectedScheme(null)}>✕</button>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: '6px', margin: '0.85rem 0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-600)', textTransform: 'uppercase' }}>
                Flagship Benefit
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {selectedScheme.benefitHighlight}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.4rem' }}>Eligibility Criteria:</h4>
              <ul className="factors-list" style={{ paddingLeft: '1rem' }}>
                {selectedScheme.eligibilityCriteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.4rem' }}>Required KYC & Application Documents:</h4>
              <ul className="factors-list" style={{ paddingLeft: '1rem' }}>
                {selectedScheme.documents.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
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
