import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Badge, Card, Field, Loading, useLoad } from '../ui'
import {
  IconShield,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconFileText,
} from '../icons'

const CATEGORIES = [
  { value: 'loan_disbursement', label: 'Loan Disbursement & Transfer' },
  { value: 'billing_interest', label: 'Interest Rate & Billing Transparency' },
  { value: 'shg_dispute', label: 'SHG Joint Liability / Thrift Dispute' },
  { value: 'recovery_conduct', label: 'Recovery Conduct & Fair Practices' },
  { value: 'kyc_document', label: 'KYC Document Verification Delay' },
  { value: 'other', label: 'General Banking & Technical Query' },
]

export default function Grievances() {
  const { user } = useAuth()
  const { t } = useLang()
  const isStaff = user?.role === 'officer' || user?.role === 'admin'

  const { data: tickets, reload, loading } = useLoad(() => api('/grievances'))

  // Borrower lodge state
  const [showLodgeModal, setShowLodgeModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    category: 'loan_disbursement',
    subject: '',
    description: '',
  })
  const [formErr, setFormErr] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Staff resolve state
  const [resolveTicket, setResolveTicket] = useState(null)
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved',
    response: '',
  })
  const [resolveErr, setResolveErr] = useState('')

  // Filter
  const [filterStatus, setFilterStatus] = useState('all')

  const handleLodge = async (e) => {
    e.preventDefault()
    setFormErr('')
    setSuccessMsg('')
    if (!form.subject.trim() || form.subject.length < 3) {
      setFormErr('Subject must be at least 3 characters.')
      return
    }
    if (!form.description.trim() || form.description.length < 10) {
      setFormErr('Detailed description must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      await api('/grievances', {
        method: 'POST',
        body: form,
      })
      setSuccessMsg('Grievance ticket successfully registered under RBI Fair Practice Cell.')
      setForm({ category: 'loan_disbursement', subject: '', description: '' })
      setShowLodgeModal(false)
      reload()
    } catch (err) {
      setFormErr(err.message || 'Failed to lodge grievance.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    setResolveErr('')
    if (!resolveForm.response.trim() || resolveForm.response.length < 5) {
      setResolveErr('Resolution response remarks must be at least 5 characters.')
      return
    }

    setSubmitting(true)
    try {
      await api(`/grievances/${resolveTicket.id}/resolve`, {
        method: 'POST',
        body: resolveForm,
      })
      setResolveTicket(null)
      setResolveForm({ status: 'resolved', response: '' })
      reload()
    } catch (err) {
      setResolveErr(err.message || 'Failed to update grievance ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const items = (tickets || []).filter((item) => {
    if (filterStatus === 'all') return true
    return item.status === filterStatus
  })

  return (
    <div className="page-container">
      {/* Statutory Header Banner */}
      <div className="card hero-banner" style={{ marginBottom: '1.5rem', background: 'var(--color-bg-alt, #f8fafc)', borderLeft: '4px solid var(--color-primary, #059669)' }}>
        <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary, #059669)', fontWeight: 600, fontSize: '0.85rem' }}>
              <IconShield size={18} />
              <span>RBI FAIR PRACTICES CODE • GRIEVANCE REDRESSAL MECHANISM</span>
            </div>
            <h2 style={{ margin: '0.35rem 0' }}>Internal Ombudsman & Grievance Cell</h2>
            <p className="muted" style={{ maxWidth: '680px', margin: 0 }}>
              Under the Reserve Bank of India (RBI) Microfinance Loans Directions 2022, every borrower has an institutional right to fair dispute redressal. All complaints are time-stamped and resolved within statutory 30-day turnaround.
            </p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => { setShowLodgeModal(true); setFormErr(''); }}
            >
              + Lodge New Grievance
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="alert success" style={{ marginBottom: '1rem' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="segmented-control" role="group">
          <button
            className={`seg-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Tickets ({(tickets || []).length})
          </button>
          <button
            className={`seg-btn ${filterStatus === 'open' ? 'active' : ''}`}
            onClick={() => setFilterStatus('open')}
          >
            Open Tickets ({((tickets || []).filter((t) => t.status === 'open')).length})
          </button>
          <button
            className={`seg-btn ${filterStatus === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('resolved')}
          >
            Resolved ({((tickets || []).filter((t) => t.status === 'resolved')).length})
          </button>
        </div>

        <div className="muted small">
          {isStaff ? 'Institutional Oversight Desk' : 'Borrower Dispute Register'}
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h3>No grievances found</h3>
          <p className="muted" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            {filterStatus === 'all'
              ? 'There are currently no active or historical grievance tickets logged in this account.'
              : `No tickets matching filter "${filterStatus}".`}
          </p>
          <button className="btn btn-secondary" onClick={() => setShowLodgeModal(true)}>
            Lodge a Grievance Ticket
          </button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map((g) => {
            const isResolved = g.status === 'resolved'
            const isOpen = g.status === 'open'

            return (
              <Card key={g.id} className="grievance-card">
                <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge small" style={{ fontFamily: 'monospace' }}>#{g.id}</span>
                      <span className="badge small secondary">
                        {CATEGORIES.find((c) => c.value === g.category)?.label || g.category}
                      </span>
                      <span className={`badge small ${isResolved ? 'success' : isOpen ? 'warning' : 'primary'}`}>
                        {g.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 style={{ margin: '0.2rem 0' }}>{g.subject}</h3>
                    <div className="muted small">
                      Logged on {new Date(g.created_at).toLocaleDateString()} at {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isStaff && (
                    <div>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setResolveTicket(g)
                          setResolveForm({
                            status: g.status === 'resolved' ? 'resolved' : 'resolved',
                            response: g.response || '',
                          })
                          setResolveErr('')
                        }}
                      >
                        {isResolved ? 'Update Resolution' : 'Review & Resolve'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-bg-alt, #f8fafc)', borderRadius: 'var(--radius-sm, 6px)', fontSize: '0.92rem' }}>
                  <strong>Description:</strong>
                  <p style={{ margin: '0.35rem 0 0', whiteSpace: 'pre-wrap' }}>{g.description}</p>
                </div>

                {isResolved && g.response && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', borderRadius: 'var(--radius-sm, 6px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>
                      <IconCheckCircle size={15} />
                      <span>OFFICIAL RESOLUTION • GRIEVANCE CELL</span>
                      {g.resolved_at && (
                        <span className="muted" style={{ fontWeight: 400, marginLeft: 'auto' }}>
                          Resolved on {new Date(g.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--color-text)' }}>
                      {g.response}
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal: Lodge Grievance */}
      {showLodgeModal && (
        <div className="modal-overlay" onClick={() => setShowLodgeModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Lodge a Formal Grievance</h3>
              <button className="icon-btn" onClick={() => setShowLodgeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLodge}>
              <div className="modal-body" style={{ display: 'grid', gap: '1rem' }}>
                {formErr && <div className="alert danger">{formErr}</div>}

                <div className="form-group">
                  <label className="label">Grievance Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Subject / Issue Summary</label>
                  <input
                    className="input"
                    placeholder="e.g. Loan disbursement delay beyond standard TAT"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Detailed Explanation & Transaction / Loan Ref</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Please mention specific loan ID, transaction amount, date, or field officer interaction details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>

                <div className="muted small" style={{ background: 'var(--color-bg-alt, #f8fafc)', padding: '0.75rem', borderRadius: '4px' }}>
                  ℹ️ Under RBI guidelines, our Grievance Redressal Officer reviews every ticket. If unresolved within 30 days, you may escalate to the RBI Banking Ombudsman (CMS portal).
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLodgeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Submit Grievance Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Staff Resolve */}
      {resolveTicket && (
        <div className="modal-overlay" onClick={() => setResolveTicket(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Resolve Grievance #{resolveTicket.id}</h3>
              <button className="icon-btn" onClick={() => setResolveTicket(null)}>✕</button>
            </div>
            <form onSubmit={handleResolve}>
              <div className="modal-body" style={{ display: 'grid', gap: '1rem' }}>
                {resolveErr && <div className="alert danger">{resolveErr}</div>}

                <div>
                  <div className="muted small">Subject:</div>
                  <strong>{resolveTicket.subject}</strong>
                </div>

                <div>
                  <div className="muted small">Borrower Description:</div>
                  <div style={{ background: 'var(--color-bg-alt, #f8fafc)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.88rem' }}>
                    {resolveTicket.description}
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Resolution Status</label>
                  <select
                    className="input"
                    value={resolveForm.status}
                    onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  >
                    <option value="resolved">Resolved (Action completed)</option>
                    <option value="in_progress">In Progress (Under investigation)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Official Resolution Remarks</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="State the corrective action, bank UTR reference, refund confirmation, or clarification provided to borrower..."
                    value={resolveForm.response}
                    onChange={(e) => setResolveForm({ ...resolveForm, response: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolveTicket(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Record Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
