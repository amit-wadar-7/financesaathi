import { createContext, useContext, useEffect, useState } from 'react'

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  return <div className={'alert ' + kind}>{children}</div>
}

export function Card({ title, children, className = '', style }) {
  return (
    <section className={'card ' + className} style={style}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function Badge({ children, tone }) {
  return <span className={'badge ' + (tone || String(children))}>{children}</span>
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function Progress({ pct }) {
  return (
    <div className="progress"><div style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} /></div>
  )
}

/** Run an async loader and expose {data, error, loading, reload}. */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: '' }))
    fn().then(
      (data) => live && setState({ data, error: '', loading: false }),
      (e) => live && setState({ data: null, error: e.message, loading: false })
    )
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, reload: () => setTick((x) => x + 1) }
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite ease-in-out',
        ...style,
      }}
    />
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <Skeleton width="40%" height="20px" style={{ marginBottom: '1rem' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${90 - i * 15}%`} height="14px" style={{ marginBottom: '0.6rem' }} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div className="table-wrap">
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', marginBottom: '1rem' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} height="18px" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', marginBottom: '0.75rem' }}>
            {Array.from({ length: cols }).map((_, ci) => (
              <Skeleton key={ci} height="14px" width={ci === 0 ? '70%' : '90%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Loading() {
  return (
    <div style={{ padding: '2rem 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
      <TableSkeleton rows={3} cols={5} />
    </div>
  )
}

export function Factors({ factors }) {
  if (!factors || !factors.length) return null
  return (
    <ul className="factors">
      {factors.map((f, i) => (
        <li key={i} className={f.impact}>
          <span className="dot">{f.impact === 'helps' ? '✓' : '!'}</span> {f.message}
        </li>
      ))}
    </ul>
  )
}

/* =========================================================================
   FLOATING TOAST NOTIFICATION SYSTEM
   ========================================================================= */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (type, message, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }

  const toast = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    info: (msg) => addToast('info', msg),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}`}
            style={{
              pointerEvents: 'auto',
              minWidth: '280px',
              maxWidth: '420px',
              padding: '12px 18px',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 500,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              background: t.type === 'success' ? '#047857' : t.type === 'error' ? '#be123c' : '#0f172a',
            }}
          >
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext) || {
  success: (m) => console.log('toast success:', m),
  error: (m) => console.log('toast error:', m),
  info: (m) => console.log('toast info:', m),
}

/* =========================================================================
   INTERACTIVE SVG CHARTS & GAUGES
   ========================================================================= */

/** 1. CIBIL Bureau Speedometer Dial (300 to 900) */
export function CibilSpeedometer({ score = 740, size = 180 }) {
  const minScore = 300
  const maxScore = 900
  const clamped = Math.max(minScore, Math.min(maxScore, score))
  const percentage = (clamped - minScore) / (maxScore - minScore) // 0 to 1

  // Arc range: -180 deg to 0 deg (top half semicircle)
  const angle = -180 + percentage * 180
  const angleRad = (angle * Math.PI) / 180
  const cx = size / 2
  const cy = size / 2 + 10
  const r = size * 0.38

  const needleLength = r - 12
  const needleX = cx + needleLength * Math.cos(angleRad)
  const needleY = cy + needleLength * Math.sin(angleRad)

  const getScoreBand = (s) => {
    if (s >= 750) return { label: 'Excellent', color: '#059669' }
    if (s >= 700) return { label: 'Good', color: '#10b981' }
    if (s >= 600) return { label: 'Moderate', color: '#f59e0b' }
    return { label: 'Needs Attention', color: '#e11d48' }
  }

  const band = getScoreBand(clamped)

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <defs>
          <linearGradient id="cibilArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="65%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Color Gradient Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#cibilArcGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Center Pivot */}
        <circle cx={cx} cy={cy} r="6" fill="#0f172a" />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Min / Max Labels */}
        <text x={cx - r + 4} y={cy + 18} fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="600">300</text>
        <text x={cx + r - 4} y={cy + 18} fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="600">900</text>
      </svg>
      <div style={{ textAlign: 'center', marginTop: '-10px' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: band.color }}>{clamped}</span>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: band.color, textTransform: 'uppercase' }}>
          {band.label}
        </div>
      </div>
    </div>
  )
}

/** 2. Donut Split Chart (Principal vs. Interest) */
export function DonutSplitChart({ principal = 50000, interest = 6200, size = 140 }) {
  const total = (principal + interest) || 1
  const principalPct = Math.round((principal / total) * 100)
  const interestPct = 100 - principalPct

  const r = 45
  const c = 2 * Math.PI * r
  const principalOffset = c * (1 - principalPct / 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {/* Interest ring (background) */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f59e0b" strokeWidth="16" />
          {/* Principal ring (foreground) */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#059669"
            strokeWidth="16"
            strokeDasharray={c}
            strokeDashoffset={principalOffset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Principal</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{principalPct}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }} />
          <span>Principal: <b>₹{principal.toLocaleString()}</b> ({principalPct}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
          <span>Interest: <b>₹{interest.toLocaleString()}</b> ({interestPct}%)</span>
        </div>
        <div style={{ paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem' }}>
          Total Obligation: <b>₹{(principal + interest).toLocaleString()}</b>
        </div>
      </div>
    </div>
  )
}

/** 3. Household Cashflow Surplus / Deficit Bar Chart */
export function CashflowBarChart({ income = 25000, expenses = 14000, emi = 3200 }) {
  const maxVal = Math.max(income, expenses + emi, 1)
  const incomeHeight = Math.round((income / maxVal) * 100)
  const expensesHeight = Math.round((expenses / maxVal) * 100)
  const emiHeight = Math.round((emi / maxVal) * 100)
  const surplus = income - expenses - emi
  const surplusHeight = Math.max(0, Math.round((surplus / maxVal) * 100))

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', height: '120px', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
        {/* Income Bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>₹{(income / 1000).toFixed(1)}k</span>
          <div style={{ width: '100%', maxWidth: '42px', height: `${incomeHeight}%`, background: '#059669', borderRadius: '4px 4px 0 0' }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>Income</span>
        </div>

        {/* Expenses Bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', marginBottom: '4px' }}>₹{(expenses / 1000).toFixed(1)}k</span>
          <div style={{ width: '100%', maxWidth: '42px', height: `${expensesHeight}%`, background: '#f59e0b', borderRadius: '4px 4px 0 0' }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>Expenses</span>
        </div>

        {/* Debt Service Bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e11d48', marginBottom: '4px' }}>₹{(emi / 1000).toFixed(1)}k</span>
          <div style={{ width: '100%', maxWidth: '42px', height: `${emiHeight}%`, background: '#e11d48', borderRadius: '4px 4px 0 0' }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>Debt EMI</span>
        </div>

        {/* Safe Surplus Bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: surplus >= 0 ? '#0284c7' : '#e11d48', marginBottom: '4px' }}>
            ₹{(Math.abs(surplus) / 1000).toFixed(1)}k
          </span>
          <div style={{ width: '100%', maxWidth: '42px', height: `${surplusHeight}%`, background: surplus >= 0 ? '#0284c7' : '#e11d48', borderRadius: '4px 4px 0 0' }} />
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>Surplus</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
        <span>Capacity Headroom: <strong style={{ color: surplus >= 0 ? '#059669' : '#e11d48' }}>₹{surplus.toLocaleString()}/mo</strong></span>
        <span>FOIR: <strong>{income > 0 ? Math.round((emi / income) * 100) : 0}%</strong></span>
      </div>
    </div>
  )
}
