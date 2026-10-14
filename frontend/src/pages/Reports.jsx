import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Loading, useLoad } from '../ui'
import {
  IconFileText,
  IconPrinter,
  IconDownload,
  IconShield,
  IconLandmark,
  IconCreditCard,
  IconUsers,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconTrendingUp,
  IconLock,
} from '../icons'

export default function Reports() {
  const { user } = useAuth()
  const { t } = useLang()
  const [selectedCategory, setSelectedCategory] = useState(user?.role === 'user' ? 'borrower' : 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeReportSlug, setActiveReportSlug] = useState(null)

  const today = new Date()
  const fyStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  const fyStr = `FY${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`

  // Load Catalog
  const { data: catalogData, loading: catalogLoading } = useLoad(() => api('/reports/catalog'))

  const reports = catalogData?.catalog || []

  const categories = [
    { id: 'all', label: t('repAll') },
    { id: 'lending', label: t('repLending') },
    { id: 'borrower', label: t('repBorrower') },
    { id: 'shg', label: t('repShg') },
    { id: 'compliance', label: t('repCompliance') },
  ]

  const filteredReports = reports.filter((r) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      r.category === selectedCategory ||
      (selectedCategory === 'lending' && ['lending', 'risk', 'performance', 'collections'].includes(r.category)) ||
      (selectedCategory === 'shg' && ['shg', 'community'].includes(r.category))
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'lending':
      case 'risk':
      case 'performance':
      case 'collections':
        return 'badge-primary'
      case 'borrower':
        return 'badge-success'
      case 'shg':
      case 'community':
        return 'badge-warning'
      case 'compliance':
        return 'badge-neutral'
      default:
        return 'badge-default'
    }
  }

  return (
    <div className="page-container">
      {/* 1. Header Banner */}
      <div className="account-hero-header">
        <div className="hero-text-col">
          <div className="hero-badge">
            <span className="live-dot" /> {t("instReporting")}
          </div>
          <h2 className="hero-greeting">{t("financialStatementsAudit")}</h2>
          <p className="hero-subtext">
            Generate and export real-time statements, delinquency aging analytics, tax interest certificates,
            SHG joint liability records, and RBI Fair Practice statutory audits.
          </p>
        </div>
        <div className="hero-actions-col">
          <button
            className="btn ghost small"
            onClick={() => setActiveReportSlug('loan-statement')}
          >
            <IconFileText size={15} /> {t("myStatementSoa")}
          </button>
          <button
            className="btn small"
            onClick={() => setActiveReportSlug('tax-certificate')}
          >
            <IconDownload size={15} /> {t("taxCertFy")} ({fyStr})
          </button>
        </div>
      </div>

      {/* 2. Controls: Filter Tabs & Search */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <div className="row between" style={{ alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`quick-pill ${selectedCategory === c.id ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: selectedCategory === c.id ? 700 : 500,
                  background: selectedCategory === c.id ? 'var(--tab-active-bg)' : 'var(--card-bg-subtle)',
                  color: selectedCategory === c.id ? 'var(--tab-active-text)' : 'var(--slate-700)',
                  border: '1px solid transparent',
                }}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <input
              type="text"
              placeholder="Search reports (e.g. Delinquency, PAR, Tax, RBI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '0.82rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Reports Grid Catalog */}
      {catalogLoading ? (
        <Loading />
      ) : filteredReports.length === 0 ? (
        <div className="card center" style={{ padding: '3rem', textAlign: 'center' }}>
          <p className="muted">No reports found matching your search.</p>
          <button className="btn small ghost" onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="card report-catalog-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem',
                borderTop: '3px solid var(--slate-900)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div>
                <div className="row between" style={{ alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <span
                    className={`badge ${getCategoryBadgeClass(report.category)}`}
                    style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}
                  >
                    {report.category}
                  </span>
                  <span className="muted small" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <IconClock size={12} /> {report.frequency}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.45rem', color: 'var(--slate-900)', lineHeight: 1.35 }}>
                  {report.title}
                </h3>
                <p className="muted small" style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {report.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                  {report.export_types.map((type) => (
                    <span
                      key={type}
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        background: 'var(--slate-100)',
                        color: 'var(--slate-600)',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {report.target_roles && !report.target_roles.includes(user?.role) ? (
                  <button
                    className="btn small ghost"
                    style={{ width: '100%', justifyContent: 'center', opacity: 0.65, cursor: 'not-allowed' }}
                    disabled
                    title={`Restricted to ${report.target_roles.join(', ')}`}
                  >
                    <IconLock size={14} /> Restricted ({report.target_roles.join('/')})
                  </button>
                ) : (
                  <button
                    className="btn small"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setActiveReportSlug(report.id)}
                  >
                    <IconFileText size={15} /> Generate & View Report →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Active Report Viewer Modal */}
      {activeReportSlug && (
        <ReportViewerModal
          slug={activeReportSlug}
          onClose={() => setActiveReportSlug(null)}
        />
      )}
    </div>
  )
}

function ReportViewerModal({ slug, onClose }) {
  const { data, loading, error } = useLoad(() => api(`/reports/data/${slug}`))

  const handlePrint = () => {
    window.print()
  }

  const handleExportCsv = () => {
    if (!data) return

    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `Report Title,${data.title || slug}\r\n`
    csvContent += `Generated Date,${data.as_of_date || new Date().toISOString()}\r\n\r\n`

    // Extract table rows if available
    if (data.buckets) {
      csvContent += "Bucket,Loans Count,Principal Exposure,Status\r\n"
      data.buckets.forEach((b) => {
        csvContent += `"${b.dpd}",${b.loans},${b.principal},"${b.status}"\r\n`
      })
    } else if (data.installments) {
      csvContent += "Instalment No,Due Date,Amount,Principal,Interest,Paid Amount,Paid On,Status\r\n"
      data.installments.forEach((i) => {
        csvContent += `${i.number},"${i.due_date}",${i.amount},${i.principal_part},${i.interest_part},${i.paid_amount},"${i.paid_on || ''}","${i.status}"\r\n`
      })
    } else if (data.products) {
      csvContent += "Product Code,Product Name,Applications,Approved,Disbursed Capital,Avg Ticket\r\n"
      data.products.forEach((p) => {
        csvContent += `"${p.product_code}","${p.product_name}",${p.applications},${p.approved},${p.total_disbursed},${p.avg_ticket}\r\n`
      })
    } else if (data.statutory_checks) {
      csvContent += "Parameter,Statutory Norm,Actual Performance,Compliance Result\r\n"
      data.statutory_checks.forEach((s) => {
        csvContent += `"${s.parameter}","${s.statutory_norm}","${s.actual}","${s.compliance}"\r\n`
      })
    } else {
      // General key value fallback
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v !== 'object') {
          csvContent += `"${k}","${v}"\r\n`
        }
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `FinanceSaathi_Report_${slug}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-card print-report-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'var(--card-bg)',
        }}
      >
        {/* Top Control Bar (Hidden during print) */}
        <div
          className="report-modal-header no-print"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--tab-active-bg)', color: 'var(--tab-active-text)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: 'var(--emerald-400)' }}><IconFileText size={18} /></span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {data?.title || 'Institutional Statement & Report'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn small ghost"
              style={{ color: '#ffffff', borderColor: '#334155' }}
              onClick={handleExportCsv}
              disabled={loading || !data}
              title="Download structured CSV dataset"
            >
              <IconDownload size={14} /> Export CSV
            </button>
            <button
              className="btn small"
              style={{ background: 'var(--emerald-600)', color: '#ffffff', borderColor: 'transparent' }}
              onClick={handlePrint}
              disabled={loading || !data}
              title="Print official statement"
            >
              <IconPrinter size={14} /> Print / Save PDF
            </button>
            <button
              className="btn small ghost"
              style={{ color: '#94a3b8', border: 'none', fontSize: '1.2rem', padding: '0 6px' }}
              onClick={onClose}
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: 'var(--card-bg-subtle)' }}>
          {loading ? (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <Loading />
            </div>
          ) : error ? (
            <div className="alert danger" style={{ margin: '1rem 0' }}>
              Failed to load report data: {error.message}
            </div>
          ) : (
            <div
              className="official-report-document"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '2rem',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              {/* Institutional Document Header */}
              <div
                style={{
                  borderBottom: '2px solid var(--slate-900)',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-900)', margin: '0 0 0.2rem' }}>
                    FINANCESAATHI MICROFINANCE PLATFORM
                  </h2>
                  <p className="muted small" style={{ margin: 0 }}>
                    Institutional SHG & Rural Micro-Credit Network • RBI Fair Practices Code Registered
                  </p>
                  <p className="muted small" style={{ margin: '0.2rem 0 0', fontSize: '0.72rem' }}>
                    Audit & Regulatory Compliance Verification Reference: FS-DOC-{Math.abs(slug.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0))}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      background: 'var(--emerald-50)',
                      color: 'var(--emerald-700)',
                      border: '1px solid var(--emerald-200)',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      marginBottom: '0.2rem',
                    }}
                  >
                    OFFICIAL RECORD
                  </span>
                  <div className="muted small" style={{ fontSize: '0.75rem' }}>
                    As of: <strong>{data.as_of_date || new Date().toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Report Body Rendering based on slug */}
              {slug === 'par-aging' && <ParAgingView data={data} />}
              {slug === 'product-performance' && <ProductPerformanceView data={data} />}
              {slug === 'collection-efficiency' && <CollectionEfficiencyView data={data} />}
              {slug === 'loan-statement' && <LoanStatementView data={data} />}
              {slug === 'tax-certificate' && <TaxCertificateView data={data} />}
              {slug === 'credit-health' && <CreditHealthView data={data} />}
              {slug === 'shg-audit' && <ShgAuditView data={data} />}
              {slug === 'rbi-compliance' && <RbiComplianceView data={data} />}

              {/* Institutional Footer Disclaimer & Stamp */}
              <div
                style={{
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--slate-500)',
                }}
              >
                <div>
                  <span>{t("cryptoRecordValid")}</span>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600 }}>
                  <span>{t("verifiedByUnderwriting")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
   SUB-VIEWS FOR INDIVIDUAL REPORT TYPES
   ------------------------------------------------------------------------- */

function ParAgingView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">{t("delinquencyAgingDesc")}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("totalLoanPortfolio")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--slate-900)' }}>
            ₹{data.total_portfolio?.toLocaleString()}
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("capitalAtRisk")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--rose-600)' }}>
            ₹{data.at_risk_capital?.toLocaleString()}
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("parRatio")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: data.par_percentage > 5 ? 'var(--rose-600)' : 'var(--emerald-600)' }}>
            {data.par_percentage}%
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("npa90Dpd")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--slate-700)' }}>
            {data.npa_percentage}%
          </h4>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("delinquencyAgingBuckets")}</h4>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>{t("bucketClassification")}</th>
              <th>{t("facilitiesCount")}</th>
              <th>{t("principalExposure")}</th>
              <th>{t("riskClassification")}</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets?.map((b, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{b.dpd}</td>
                <td>{b.loans} loans</td>
                <td>₹{b.principal.toLocaleString()}</td>
                <td>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: idx === 0 ? 'var(--emerald-50)' : idx < 3 ? 'var(--amber-50)' : 'var(--rose-50)',
                      color: idx === 0 ? 'var(--emerald-700)' : idx < 3 ? 'var(--amber-700)' : 'var(--rose-700)',
                    }}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.watchlist_loans?.length > 0 && (
        <>
          <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("priorityWatchlist")}</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>{t("loanId")}</th>
                  <th>{t("borrower")}</th>
                  <th>{t("product")}</th>
                  <th>{t("overdueAmount")}</th>
                  <th>{t("daysOverdue")}</th>
                  <th>{t("agingBucket")}</th>
                </tr>
              </thead>
              <tbody>
                {data.watchlist_loans.map((w, idx) => (
                  <tr key={idx}>
                    <td>#{w.loan_id}</td>
                    <td style={{ fontWeight: 600 }}>{w.borrower_name}</td>
                    <td>{w.product}</td>
                    <td style={{ color: 'var(--rose-600)', fontWeight: 600 }}>₹{w.overdue_amount.toLocaleString()}</td>
                    <td>{w.days_overdue} days</td>
                    <td><span className="badge small">{w.bucket}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function ProductPerformanceView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">{t("volumeApprovalDesc")}</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>{t("productFacility")}</th>
              <th>{t("applications")}</th>
              <th>{t("sanctioned")}</th>
              <th>{t("disbursedCapital")}</th>
              <th>{t("avgTicketSize")}</th>
              <th>{t("approvalRate")}</th>
            </tr>
          </thead>
          <tbody>
            {data.products?.map((p, idx) => {
              const rate = p.applications > 0 ? Math.round((p.approved / p.applications) * 100) : 0
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                  <td>{p.applications}</td>
                  <td style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>{p.approved}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.total_disbursed.toLocaleString()}</td>
                  <td>₹{p.avg_ticket.toLocaleString()}</td>
                  <td>
                    <span className="badge small" style={{ fontWeight: 700 }}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CollectionEfficiencyView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">{data.reporting_period}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("billedDemand")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0' }}>₹{data.total_demand?.toLocaleString()}</h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("totalRecovered")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--emerald-600)' }}>
            ₹{data.total_collected?.toLocaleString()}
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("overdueReceivables")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--rose-600)' }}>
            ₹{data.overdue_receivables?.toLocaleString()}
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("collectionEfficiency")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--emerald-700)' }}>
            {data.collection_efficiency_pct}%
          </h4>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("collectionChannelsSplit")}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {data.channel_breakdown?.map((ch, idx) => (
          <div key={idx} className="card" style={{ padding: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{ch.channel}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{ch.volume}</span>
              <span className="badge small">{ch.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("monthlyRecoveryTrend")}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>{t("monthFormat")}</th>
              <th>{t("demand")}</th>
              <th>{t("collected")}</th>
              <th>{t("efficiency")}</th>
            </tr>
          </thead>
          <tbody>
            {data.monthly_trend?.map((m, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{m.month}</td>
                <td>₹{m.demand.toLocaleString()}</td>
                <td style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>₹{m.collected.toLocaleString()}</td>
                <td>
                  <span style={{ fontWeight: 700, color: m.efficiency >= 96 ? 'var(--emerald-700)' : 'var(--amber-700)' }}>
                    {m.efficiency}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LoanStatementView({ data }) {
  const { t } = useLang()
  if (!data.has_loan) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center' }}>
        <p className="muted">{data.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <h3 style={{ margin: '0 0 0.2rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <span className="muted small">Account: {data.account_number} • Product: {data.product}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.82rem' }}>
          <span className="muted">{t("borrowerName")}</span>
          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{data.borrower_name}</div>
          <div className="muted small">{data.borrower_phone}</div>
        </div>
        <div style={{ fontSize: '0.82rem' }}>
          <span className="muted">{t("sanctionedAmount")}</span>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
            ₹{data.sanctioned_amount?.toLocaleString()}
          </div>
          <div className="muted small">{data.tenure_months} Months @ {data.interest_rate}% APR</div>
        </div>
        <div style={{ fontSize: '0.82rem' }}>
          <span className="muted">{t("outstandingPrincipal")}</span>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--emerald-700)' }}>
            ₹{data.outstanding_balance?.toLocaleString()}
          </div>
          <div className="muted small">Total Repaid: ₹{data.total_paid?.toLocaleString()}</div>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("installmentScheduleLedger")}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>{t("dueDate")}</th>
              <th>{t("installmentEmi")}</th>
              <th>{t("principalPart")}</th>
              <th>{t("interestPart")}</th>
              <th>{t("paidAmount")}</th>
              <th>{t("paidOn")}</th>
              <th>{t("balancePrincipal")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {data.installments?.map((i) => (
              <tr key={i.number}>
                <td>{i.number}</td>
                <td style={{ fontWeight: 600 }}>{i.due_date}</td>
                <td style={{ fontWeight: 600 }}>₹{i.amount.toLocaleString()}</td>
                <td>₹{i.principal_part.toLocaleString()}</td>
                <td>₹{i.interest_part.toLocaleString()}</td>
                <td style={{ color: i.paid_amount > 0 ? 'var(--emerald-600)' : 'inherit', fontWeight: 600 }}>
                  ₹{i.paid_amount.toLocaleString()}
                </td>
                <td className="muted small">{i.paid_on || '—'}</td>
                <td style={{ fontWeight: 500 }}>₹{i.balance_principal.toLocaleString()}</td>
                <td>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: i.status === 'Paid' ? 'var(--emerald-50)' : 'var(--slate-100)',
                      color: i.status === 'Paid' ? 'var(--emerald-700)' : 'var(--slate-700)',
                    }}
                  >
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaxCertificateView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.3rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small" style={{ margin: 0 }}>Certificate Reference: {data.certificate_number}</p>
        <p className="muted small" style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>Financial Year: {data.financial_year}</p>
      </div>

      <div className="card" style={{ background: 'var(--card-bg-subtle)', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <span className="muted">{t("borrowerName")}</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>{data.borrower_name}</div>
          </div>
          <div>
            <span className="muted">{t("panAadhaarRef")}</span>
            <div style={{ fontWeight: 600 }}>{data.borrower_pan_aadhaar}</div>
          </div>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("fiscalSummaryRepayments")}</h4>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>{t("particulars")}</th>
              <th>{t("statutoryCategory")}</th>
              <th>{t("amountClearedInr")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>{t("principalRepaid")}</td>
              <td className="muted small">{t("microfinanceCapRecovery")}</td>
              <td style={{ fontWeight: 700 }}>₹{data.principal_repaid?.toLocaleString()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>{t("interestPaid")}</td>
              <td className="muted small">{t("fiscalFinanceCharges")}</td>
              <td style={{ fontWeight: 700 }}>₹{data.interest_paid?.toLocaleString()}</td>
            </tr>
            <tr style={{ background: 'var(--card-bg-subtle)' }}>
              <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{t("totalRepaymentService")}</td>
              <td className="muted small">{t("totalCashflowOutflow")}</td>
              <td style={{ fontWeight: 800, color: 'var(--slate-900)' }}>₹{data.total_repaid?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1rem', background: 'var(--emerald-50)', border: '1px solid var(--emerald-200)' }}>
        <h5 style={{ margin: '0 0 0.3rem', color: 'var(--emerald-900)' }}>{t("interestSubventionElig")}</h5>
        <p className="small" style={{ margin: 0, color: 'var(--emerald-800)' }}>
          Eligible for prompt repayment incentive & 2% Central Subvention benefit: <strong>₹{data.subvention_eligible?.toLocaleString()}</strong>
        </p>
      </div>

      <p className="muted small" style={{ marginTop: '1.5rem', lineHeight: 1.5, fontStyle: 'italic' }}>
        "{data.certification_statement}"
      </p>
    </div>
  )
}

function CreditHealthView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.3rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">Member: {data.borrower_name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card center" style={{ padding: '1rem', background: 'var(--card-bg-subtle)', textAlign: 'center' }}>
          <span className="muted small">{t('healthScore')}</span>
          <h2 style={{ fontSize: '2rem', margin: '0.2rem 0', color: 'var(--emerald-700)' }}>{data.bureau_score}</h2>
          <span className="badge success">{data.score_band}</span>
        </div>
        <div className="card" style={{ padding: '1rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("debtToIncomeFoir")}</span>
          <h3 style={{ margin: '0.3rem 0', fontSize: '1.3rem' }}>{data.foir_percentage}%</h3>
          <span className="muted small">Existing EMIs: ₹{data.existing_debt_service} / mo</span>
        </div>
        <div className="card" style={{ padding: '1rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("safeBorrowingHeadroom")}</span>
          <h3 style={{ margin: '0.3rem 0', fontSize: '1.3rem', color: 'var(--emerald-700)' }}>
            ₹{data.capacity_headroom?.toLocaleString()}
          </h3>
          <span className="muted small">{t("monthlyCapacityBuffer")}</span>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("healthAssessmentFactors")}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {data.factors?.map((f, idx) => (
          <div key={idx} className="card" style={{ padding: '0.85rem' }}>
            <div className="row between" style={{ alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.name}</span>
              <span className="badge small">{f.score}</span>
            </div>
            <p className="muted small" style={{ margin: 0 }}>{f.detail}</p>
          </div>
        ))}
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("advisoryScoreGrowth")}</h4>
      <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--slate-700)' }}>
        {data.recommendations?.map((r, idx) => (
          <li key={idx} style={{ marginBottom: '0.3rem' }}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function ShgAuditView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.3rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">SHG: <strong>{data.group_name}</strong> • Cluster: {data.village_cluster}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("enrolledMembers")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0' }}>{data.total_members} Members</h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("groupSavingsFund")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--emerald-600)' }}>
            {data.accumulated_group_savings}
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("bankCreditLinkage")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0' }}>{data.active_credit_linkage}</h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("complianceRating")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--emerald-700)' }}>
            {data.joint_liability_compliance}
          </h4>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("memberContributionMatrix")}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>{t("memberName")}</th>
              <th>{t("groupDesignation")}</th>
              <th>{t("monthlySavingsDeposit")}</th>
              <th>{t("internalLoanStatus")}</th>
              <th>{t("meetingAttendance")}</th>
            </tr>
          </thead>
          <tbody>
            {data.member_roster_sample?.map((m, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td><span className="badge small">{m.role}</span></td>
                <td>{m.monthly_savings}</td>
                <td>{m.loan_status}</td>
                <td style={{ fontWeight: 600, color: 'var(--emerald-600)' }}>{m.attendance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RbiComplianceView({ data }) {
  const { t } = useLang()
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.3rem', color: 'var(--slate-900)' }}>{data.title}</h3>
        <p className="muted small">{data.regulatory_framework}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("statutoryPslTarget")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0' }}>{data.psl_target_pct}% of Book</h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("actualPslAchieved")}</span>
          <h4 style={{ fontSize: '1.2rem', margin: '0.3rem 0 0', color: 'var(--emerald-700)' }}>
            {data.psl_achieved_pct}%
          </h4>
        </div>
        <div className="card" style={{ padding: '0.85rem', background: 'var(--card-bg-subtle)' }}>
          <span className="muted small">{t("complianceStatus")}</span>
          <h4 style={{ fontSize: '1.1rem', margin: '0.3rem 0 0', color: 'var(--emerald-700)' }}>
            {data.psl_status}
          </h4>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.6rem', fontSize: '0.95rem' }}>{t("rbiChecklist")}</h4>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>{t("regulatoryParam")}</th>
              <th>{t("statutoryNormRbi")}</th>
              <th>{t("platformPerf")}</th>
              <th>{t("auditResult")}</th>
            </tr>
          </thead>
          <tbody>
            {data.statutory_checks?.map((c, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{c.parameter}</td>
                <td>{c.statutory_norm}</td>
                <td>{c.actual}</td>
                <td>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'var(--emerald-50)',
                      color: 'var(--emerald-700)',
                      border: '1px solid var(--emerald-200)',
                    }}
                  >
                    {c.compliance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: '1rem', background: 'var(--card-bg-subtle)' }}>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          {data.audit_declaration}
        </p>
      </div>
    </div>
  )
}
