import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, money, qs } from '../api'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Field, Stat } from '../ui'
import {
  IconCalculator,
  IconShield,
  IconCoins,
  IconTarget,
  IconTrendingUp,
  IconAlertTriangle,
  IconTractor,
  IconZap,
  IconCheckCircle,
} from '../icons'

function useCalc(path) {
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const run = async (params) => {
    setErr('')
    try {
      setRes(await api(path + '?' + qs(params), { auth: false }))
    } catch (e) {
      setErr(e.message)
      setRes(null)
    }
  }
  return { res, err, run }
}

function Num({ label, v, set, step = 'any', min = 0 }) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        min={min}
        value={v}
        onChange={(e) => set(e.target.value)}
      />
    </Field>
  )
}

function SahukarTrap() {
  const [amount, setAmount] = useState(30000)
  const [quoteRate, setQuoteRate] = useState(3.0) // Rs 3 per month per Rs 100
  const [months, setMonths] = useState(12)
  const [upfrontCut, setUpfrontCut] = useState(5.0) // 5% deducted upfront
  const [instRate, setInstRate] = useState(12.0)
  const c = useCalc('/calc/sahukar-trap')

  useEffect(() => {
    c.run({
      amount,
      rate_per_hundred_per_month: quoteRate,
      months,
      upfront_cut_pct: upfrontCut,
      institutional_rate: instRate,
    })
  }, [amount, quoteRate, months, upfrontCut, instRate])

  const res = c.res

  return (
    <Card title="Predatory Moneylender (Sahukar) Trap Exposer & Debt Swap Calculator">
      <p className="muted small mb-2">
        Informal moneylenders often quote deceptively simple numbers like <i>'₹3 per ₹100 per month'</i>. This tool unmasks the true astronomical APR, hidden upfront deductions, and calculates your exact savings by refinancing through an SHG or Bank loan.
      </p>

      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label="Borrowing Amount (Rs)" v={amount} set={setAmount} min={1000} />
        <div>
          <Field label="Moneylender Quote (Rs per Rs 100 / month)">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="20"
              value={quoteRate}
              onChange={(e) => setQuoteRate(Number(e.target.value))}
            />
          </Field>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[
              { val: 2, label: '₹2 (24% APR)' },
              { val: 3, label: '₹3 (36% APR)' },
              { val: 5, label: '₹5 (60% APR)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                className={`btn small ${quoteRate === p.val ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                onClick={() => setQuoteRate(p.val)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Num label="Tenure (Months)" v={months} set={setMonths} min={1} />
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[6, 12, 24].map((m) => (
              <button
                key={m}
                type="button"
                className={`btn small ${months === m ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                onClick={() => setMonths(m)}
              >
                {m} mo
              </button>
            ))}
          </div>
        </div>

        <div>
          <Num label="Upfront Cutback Deducted (%)" v={upfrontCut} set={setUpfrontCut} min={0} max={30} />
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[0, 5, 10].map((cut) => (
              <button
                key={cut}
                type="button"
                className={`btn small ${upfrontCut === cut ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                onClick={() => setUpfrontCut(cut)}
              >
                {cut}% cut
              </button>
            ))}
          </div>
        </div>
      </div>

      <Alert>{c.err}</Alert>

      {res && (
        <div style={{ marginTop: '1.25rem' }}>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div className="row between" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconAlertTriangle size={20} className="text-danger" />
                <h4 style={{ margin: 0, color: 'var(--alert-red)' }}>
                  True Effective Annual Percentage Rate: {res.sahukar.effective_apr}% APR
                </h4>
              </div>
              <Badge tone="not_ready">PREDATORY DEBT</Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7f1d1d' }}>
              On a ₹{amount.toLocaleString()} loan, the moneylender gives you only <b>{money(res.in_hand_amount)}</b> in hand while taking <b>{money(res.sahukar.total_interest)}</b> in raw interest. You pay <b>{res.wealth_loss.interest_multiple}x times</b> more interest than through an SHG!
            </p>
          </div>

          <div className="grid" style={{ marginBottom: '1.25rem' }}>
            <Stat
              label="Moneylender Total Repayment"
              value={money(res.sahukar.total_repayment)}
              sub={`Interest: ${money(res.sahukar.total_interest)}`}
            />
            <Stat
              label="SHG / Bank 12% Total Repayment"
              value={money(res.institutional.total_repayment)}
              sub={`Interest: ${money(res.institutional.total_interest)}`}
            />
            <Stat
              label="Direct Wealth Saved"
              value={money(res.wealth_loss.total_savings)}
              sub={`Save ${money(res.wealth_loss.monthly_savings_avg)}/month`}
            />
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-hairline)',
              borderRadius: '8px',
              padding: '1.2rem',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <IconZap size={18} className="text-emerald" />
              <h4 style={{ margin: 0 }}>3-Step Debt-Swap Refinancing Roadmap</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-brand)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  1
                </span>
                <div>
                  <b>Request Final Payoff Statement:</b> Ask the moneylender for exact principal outstanding without compounding penalties.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-brand)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  2
                </span>
                <div>
                  <b>Apply for SHG Joint Refinance Loan:</b> Present your proposal under the FinanceSaathi portal to obtain subsidized credit at 12% reducing balance.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-brand)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  3
                </span>
                <div>
                  <b>Retire Informal Debt & Release Pledged Gold/Assets:</b> Pay off the moneylender in full, obtain an official discharge receipt, and begin safe EMI repayments with your SHG.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function KisanFlexiEMI() {
  const [amount, setAmount] = useState(40000)
  const [rate, setRate] = useState(7.0) // 7% KCC concessional rate
  const [months, setMonths] = useState(12)
  const c = useCalc('/calc/kisan-schedule')

  useEffect(() => {
    c.run({ amount, rate, months })
  }, [amount, rate, months])

  const res = c.res

  return (
    <Card title="Kisan Crop-Cycle Harvest-Aligned Repayment Planner">
      <p className="muted small mb-2">
        Agricultural cash flows are seasonal, not salaried. During crop gestation, farmers pay low interest-only maintenance to avoid distress. Upon mandi harvest sales (e.g., month 6 & 12), lumpsum principal payments retire the debt smoothly.
      </p>

      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label="Crop Facility Amount (Rs)" v={amount} set={setAmount} min={5000} />
        <div>
          <Num label="Annual Interest Rate (%)" v={rate} set={setRate} min={0} max={30} />
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[
              { val: 7.0, label: '7% (KCC Subsidized)' },
              { val: 10.0, label: '10% (Cooperative)' },
              { val: 12.0, label: '12% (Standard MFI)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                className={`btn small ${rate === p.val ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                onClick={() => setRate(p.val)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Num label="Tenure (Months)" v={months} set={setMonths} min={3} max={36} />
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {[6, 12, 18, 24].map((m) => (
              <button
                key={m}
                type="button"
                className={`btn small ${months === m ? '' : 'ghost'}`}
                style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                onClick={() => setMonths(m)}
              >
                {m} mo
              </button>
            ))}
          </div>
        </div>
      </div>

      <Alert>{c.err}</Alert>

      {res && (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="grid" style={{ marginBottom: '1.25rem' }}>
            <Stat
              label="Gestation Monthly Payment"
              value={money(res.avg_gestation_payment)}
              sub="Interest-only maintenance"
            />
            <Stat
              label="Harvest Lumpsum Payment"
              value={money(res.avg_harvest_payment)}
              sub={`${res.harvest_count} mandi harvest sales`}
            />
            <Stat
              label="Total Cost of Facility"
              value={money(res.total_repayment)}
              sub={`Total interest: ${money(res.total_interest)}`}
            />
          </div>

          <h4 style={{ margin: '1.25rem 0 0.5rem', fontSize: '0.92rem' }}>
            Seasonal Cashflow Amortization Table
          </h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Scheduled Due Date</th>
                  <th>Seasonal Phase</th>
                  <th>Due Installment</th>
                  <th>Principal Component</th>
                  <th>Interest Component</th>
                  <th>Remaining Loan Balance</th>
                </tr>
              </thead>
              <tbody>
                {res.schedule.map((row) => (
                  <tr
                    key={row.number}
                    style={{
                      background: row.is_harvest ? 'var(--emerald-soft)' : undefined,
                    }}
                  >
                    <td><b>#{row.number}</b></td>
                    <td>{row.due_date}</td>
                    <td>
                      <Badge tone={row.is_harvest ? 'approved' : 'muted'}>
                        {row.phase}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 700 }}>{money(row.amount)}</td>
                    <td className="good-text">{money(row.principal_part)}</td>
                    <td className="muted">{money(row.interest_part)}</td>
                    <td>{money(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}

function EMI() {
  const { t } = useLang()
  const [a, setA] = useState(20000)
  const [r, setR] = useState(12)
  const [m, setM] = useState(12)
  const c = useCalc('/calc/emi')

  return (
    <Card title="SHG & Microfinance Reducing-Balance EMI Calculator">
      <p className="muted small mb-2">
        Transparent calculation based on true reducing balance (diminishing interest) as mandated by the RBI Fair Practices Code.
      </p>
      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label={t('amount') + ' (Rs)'} v={a} set={setA} />
        <Num label={t('rate') + ' (% per year)'} v={r} set={setR} />
        <Num label={t('months')} v={m} set={setM} min={1} />
      </div>
      <button
        className="btn"
        onClick={() => c.run({ amount: a, rate: r, months: m, schedule: true })}
      >
        Calculate Installment Schedule
      </button>
      <Alert>{c.err}</Alert>
      {c.res && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="grid">
            <Stat label={t('emi')} value={money(c.res.emi)} sub="Per month installment" />
            <Stat label="Total Interest" value={money(c.res.total_interest)} sub={`At ${r}% per annum`} />
            <Stat label="Total Repayment" value={money(c.res.total_payment)} sub={`Principal + Interest`} />
          </div>
          <h4 style={{ margin: '1.5rem 0 0.5rem', fontSize: '0.95rem' }}>Full Amortization Repayment Schedule</h4>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due Date</th>
                  <th>Monthly EMI</th>
                  <th>Principal Part</th>
                  <th>Interest Part</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {c.res.schedule.map((s) => (
                  <tr key={s.number}>
                    <td><b>{s.number}</b></td>
                    <td>{s.due_date}</td>
                    <td><b>{money(s.amount)}</b></td>
                    <td className="good-text">{money(s.principal_part)}</td>
                    <td className="muted">{money(s.interest_part)}</td>
                    <td>{money(s.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}

function EmergencyFund() {
  const [exp, setExp] = useState(12000)
  const [targetMonths, setTargetMonths] = useState(3)
  const [sav, setSav] = useState(15000)
  const c = useCalc('/calc/emergency-fund')

  useEffect(() => {
    c.run({ monthly_expense: exp, months: targetMonths, current_savings: sav })
  }, [exp, targetMonths, sav])

  const target = exp * targetMonths
  const gap = Math.max(0, target - sav)
  const coveragePct = target > 0 ? Math.min(100, Math.round((sav / target) * 100)) : 100

  return (
    <Card title="Rural Household Emergency Cushion & Resilience Simulator">
      <p className="muted small mb-2">
        Assess your family's financial safety buffer against medical emergencies, crop loss, or drought shocks without turning to moneylenders.
      </p>

      <div className="grid wide" style={{ marginBottom: '1.2rem' }}>
        <Num label="Monthly Household Living Cost (Rs)" v={exp} set={setExp} min={1000} />
        <div>
          <Field label="Target Emergency Duration">
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
              {[3, 6, 9, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`btn small ${targetMonths === m ? '' : 'ghost'}`}
                  style={{ flex: 1, padding: '6px 4px', fontSize: '0.82rem' }}
                  onClick={() => setTargetMonths(m)}
                >
                  {m} Months
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Num label="Current Liquid Savings / Cash (Rs)" v={sav} set={setSav} min={0} />
      </div>

      <Alert>{c.err}</Alert>

      <div style={{ marginTop: '1.2rem' }}>
        <div className="grid">
          <Stat
            label="Required Safety Fund"
            value={money(target)}
            sub={`${targetMonths} months of essential needs`}
          />
          <Stat
            label="Current Available Buffer"
            value={money(sav)}
            sub={`${(exp > 0 ? (sav / exp).toFixed(1) : 0)} months covered`}
          />
          <Stat
            label={gap === 0 ? "Buffer Status" : "Protection Shortfall"}
            value={gap === 0 ? "Fully Protected" : money(gap)}
            sub={gap === 0 ? "100% Target Met" : "Shortfall to accumulate"}
          />
        </div>

        <div style={{ marginTop: '1.2rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Readiness Gauge: {coveragePct}%</span>
            <span className="muted">{money(sav)} / {money(target)}</span>
          </div>
          <div style={{ height: '9px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${coveragePct}%`,
                height: '100%',
                background: coveragePct >= 100 ? '#059669' : coveragePct >= 50 ? '#0284c7' : '#d97706',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {gap > 0 ? (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.88rem', color: '#0f172a' }}>Actionable Savings Milestones:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              <li>Deposit <b>{money(Math.round(gap / 6))} / month</b> to reach full family safety in <b>6 months</b>.</li>
              <li>Deposit <b>{money(Math.round(gap / 12))} / month</b> to reach full family safety in <b>12 months</b>.</li>
              <li>Keep this fund in your SHG group passbook or bank account; do not lock into illiquid assets.</li>
            </ul>
          </div>
        ) : (
          <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
            <p style={{ margin: 0, color: '#065f46', fontSize: '0.88rem', fontWeight: 600 }}>
              ✓ Excellent financial resilience! Your household has an adequate cushion for medical or business contingencies.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

function Interest() {
  const [p, setP] = useState(10000)
  const [r, setR] = useState(10)
  const [y, setY] = useState(2)
  const [n, setN] = useState(1)
  const si = useCalc('/calc/simple-interest')
  const ci = useCalc('/calc/compound-interest')

  const go = () => {
    si.run({ principal: p, rate: r, years: y })
    ci.run({ principal: p, rate: r, years: y, times_per_year: n })
  }

  return (
    <Card title="Simple vs Compound Interest Comparison">
      <p className="muted small mb-2">
        Learn how compound interest grows your deposits faster over time compared to flat simple interest.
      </p>
      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label="Principal Deposit (Rs)" v={p} set={setP} />
        <Num label="Annual Rate (%)" v={r} set={setR} />
        <Num label="Duration (Years)" v={y} set={setY} />
        <Num label="Compounding Frequency (per year)" v={n} set={setN} min={1} />
      </div>
      <button className="btn" onClick={go}>Compare Returns</button>
      <Alert>{si.err || ci.err}</Alert>
      {si.res && ci.res && (
        <div className="grid" style={{ marginTop: '1.2rem' }}>
          <Stat
            label="Simple Interest"
            value={money(si.res.interest)}
            sub={'Maturity: ' + money(si.res.total)}
          />
          <Stat
            label="Compound Interest"
            value={money(ci.res.interest)}
            sub={'Maturity: ' + money(ci.res.total)}
          />
          <Stat
            label="Compounding Advantage"
            value={money(ci.res.interest - si.res.interest)}
            sub="Additional wealth gained"
          />
        </div>
      )}
    </Card>
  )
}

function SavingsGrowth() {
  const [m, setM] = useState(500)
  const [r, setR] = useState(7)
  const [mo, setMo] = useState(24)
  const c = useCalc('/calc/savings')

  const go = () => c.run({ monthly_deposit: m, rate: r, months: mo })

  return (
    <Card title="Recurring Deposit (RD) & SHG Savings Growth">
      <p className="muted small mb-2">
        Calculate how small regular monthly contributions into your SHG or Post Office RD compound into a significant lump sum.
      </p>
      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label="Monthly Deposit (Rs)" v={m} set={setM} />
        <Num label="Interest Rate (% per year)" v={r} set={setR} />
        <Num label="Duration (Months)" v={mo} set={setMo} min={1} />
      </div>
      <button className="btn" onClick={go}>Project Savings</button>
      <Alert>{c.err}</Alert>
      {c.res && (
        <div className="grid" style={{ marginTop: '1.2rem' }}>
          <Stat label="Total Principal Deposited" value={money(c.res.deposited)} />
          <Stat label="Interest Earned" value={money(c.res.interest_earned)} />
          <Stat label="Final Maturity Value" value={money(c.res.final_value)} />
        </div>
      )}
    </Card>
  )
}

function Compare() {
  const [a, setA] = useState(30000)
  const [m, setM] = useState(12)
  const [ra, setRa] = useState(12)
  const [rb, setRb] = useState(36)
  const c = useCalc('/calc/compare-lenders')

  const go = () => c.run({ amount: a, months: m, rate_a: ra, rate_b: rb })

  return (
    <Card title="Direct Lender APR Comparison">
      <p className="muted small mb-2">
        Directly compare two lending offers to see the real difference in monthly EMI and total interest paid.
      </p>
      <div className="grid wide" style={{ marginBottom: '1rem' }}>
        <Num label="Loan Amount (Rs)" v={a} set={setA} />
        <Num label="Tenure (Months)" v={m} set={setM} min={1} />
        <Num label="Lender A Rate (% per year)" v={ra} set={setRa} />
        <Num label="Lender B Rate (% per year)" v={rb} set={setRb} />
      </div>
      <button className="btn" onClick={go}>Compare Lenders</button>
      <Alert>{c.err}</Alert>
      {c.res && (
        <div style={{ marginTop: '1.2rem' }}>
          <div className="grid">
            <Stat
              label={`Lender A (${ra}%) EMI`}
              value={money(c.res.lender_a.emi)}
              sub={'Total int: ' + money(c.res.lender_a.total_interest)}
            />
            <Stat
              label={`Lender B (${rb}%) EMI`}
              value={money(c.res.lender_b.emi)}
              sub={'Total int: ' + money(c.res.lender_b.total_interest)}
            />
            <Stat
              label="Extra Cost of Lender B"
              value={money(c.res.extra_cost_of_b)}
              sub="Money saved by choosing A"
            />
          </div>
        </div>
      )}
    </Card>
  )
}

export function Tools() {
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = searchParams.get('calc') || 'sahukar'
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    const q = searchParams.get('calc')
    if (q && ['sahukar', 'kisan', 'emi', 'emergency', 'interest', 'savings', 'compare'].includes(q)) {
      setTab(q)
    }
  }, [searchParams])

  const handleTabChange = (k) => {
    setTab(k)
    setSearchParams({ calc: k })
  }

  const tabs = {
    sahukar: ['Sahukar Trap Exposer', IconAlertTriangle, SahukarTrap],
    kisan: ['Kisan Harvest Flexi-EMI', IconTractor, KisanFlexiEMI],
    emi: ['Reducing-Balance EMI', IconCalculator, EMI],
    emergency: ['Emergency Fund Cushion', IconShield, EmergencyFund],
    interest: ['Interest Comparison', IconCoins, Interest],
    savings: ['Savings Growth', IconTarget, SavingsGrowth],
    compare: ['Compare Lenders', IconTrendingUp, Compare],
  }

  const Cur = tabs[tab] ? tabs[tab][2] : SahukarTrap

  return (
    <div className="tools-view">
      <div style={{ marginBottom: '1.2rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a' }}>{t('calculators')}</h2>
        <p className="muted small">
          Decision-support financial models & transparent microfinance calculators for rural empowerment.
        </p>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {Object.entries(tabs).map(([k, [label, Icon]]) => (
          <button
            key={k}
            className={`tab-btn ${tab === k ? 'active' : ''}`}
            onClick={() => handleTabChange(k)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.95rem',
              border: tab === k ? '1px solid #047857' : '1px solid #cbd5e1',
              background: tab === k ? '#ecfdf5' : '#ffffff',
              color: tab === k ? '#047857' : '#475569',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <Cur />
    </div>
  )
}

export default Tools

