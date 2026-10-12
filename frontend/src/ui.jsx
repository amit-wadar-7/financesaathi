import { useEffect, useState } from 'react'

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  return <div className={'alert ' + kind}>{children}</div>
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={'card ' + className}>
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
    <div className="progress"><div style={{ width: Math.min(100, pct) + '%' }} /></div>
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

export function Loading() { return <p className="muted">Loading…</p> }

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
