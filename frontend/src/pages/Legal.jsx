import { Link } from 'react-router-dom'
import { IconShield, IconFileText, IconArrowRight } from '../icons'

export function PrivacyPolicy() {
  return (
    <div className="legal-page card" style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <IconShield size={26} className="text-emerald" />
        <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Privacy Policy</h2>
      </div>
      <p className="muted small">Last Updated: October 12, 2024 • Version 1.2 (DPDP Act, 2023 Compliant)</p>

      <section style={{ marginTop: '1.5rem', lineHeight: '1.7', color: '#334155' }}>
        <h4 style={{ color: '#0f172a', marginBottom: '0.4rem' }}>1. Scope and Purpose</h4>
        <p>
          FinanceSaathi operates as a digital financial literacy, community book-keeping, and decision support platform
          for Self-Help Groups (SHGs), Joint Liability Groups (JLGs), and individual microfinance borrowers. We are committed
          to safeguarding borrower confidentiality in accordance with the Digital Personal Data Protection (DPDP) Act, 2023
          and the Reserve Bank of India (RBI) Regulatory Framework for Microfinance Loans.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>2. Data We Collect</h4>
        <p>We collect only the minimum required information to provide financial health calculations and loan administration:</p>
        <ul style={{ paddingLeft: '1.2rem' }}>
          <li><b>Identity & Contact Information:</b> Full name, phone number, email address, and language preference.</li>
          <li><b>Socio-Economic & Cashflow Data:</b> Self-reported monthly household income, regular expenses, existing debt commitments, and group savings balances.</li>
          <li><b>SHG Governance Records:</b> Group affiliation, meeting attendance records, passbook contributions, and repayment history.</li>
          <li><b>Verification Metadata:</b> Identification type references (Aadhaar/Voter ID numbers without biometric storage).</li>
        </ul>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>3. Data Protection & Encryption</h4>
        <p>
          All passwords are encrypted using salted bcrypt hashing. Transmitted data is protected with TLS 1.3 encryption.
          We never store plaintext financial credentials, UPI PINs, or bank account login passwords.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>4. Zero Commercial Data Resale</h4>
        <p>
          We do not sell, rent, or trade user data to third-party advertisers or unregulated telemarketers. Information is
          shared strictly with designated SHG federations and registered lending institutions upon explicit member consent
          for loan underwriting.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>5. Grievance Redressal Officer</h4>
        <p>
          For privacy concerns, access requests, or record correction, contact our Data Protection Officer:
          <br />
          <b>Email:</b> privacy@financesaathi.org | <b>Helpline:</b> 1800-425-1930
        </p>

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <Link to="/" className="btn ghost small">← Back to Dashboard</Link>
        </div>
      </section>
    </div>
  )
}

export function TermsOfService() {
  return (
    <div className="legal-page card" style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <IconFileText size={26} className="text-emerald" />
        <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Terms & Conditions</h2>
      </div>
      <p className="muted small">Effective Date: October 12, 2024 • Governing Law: Republic of India</p>

      <section style={{ marginTop: '1.5rem', lineHeight: '1.7', color: '#334155' }}>
        <h4 style={{ color: '#0f172a', marginBottom: '0.4rem' }}>1. Platform Character and Role</h4>
        <p>
          FinanceSaathi provides digital ledger software, loan affordability simulators, and financial education.
          FinanceSaathi is not a bank, Non-Banking Financial Company (NBFC), or money lender. It operates as a technology
          infrastructure provider enabling Self-Help Groups and microfinance institutions to maintain auditable books.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>2. Saathi AI Advisory Disclaimer</h4>
        <p>
          The Saathi AI assistant, affordability model scores, and budget calculators are automated decision support
          tools designed for educational guidance. They do not constitute formal credit underwriting or guaranteed loan approval.
          Formal microfinance loan approvals remain solely under the authority of registered lending officers and SHG resolutions.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>3. Fair Practice Disclosures & Interest Rates</h4>
        <p>
          In adherence to the RBI Fair Practices Code:
        </p>
        <ul style={{ paddingLeft: '1.2rem' }}>
          <li>All interest calculations are displayed on a transparent <b>reducing balance method</b> rather than flat interest.</li>
          <li>Full repayment schedules, principal portions, and due dates are disclosed prior to application submission.</li>
          <li>Borrowers shall not be subjected to coercive recovery practices or undue harassment.</li>
        </ul>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>4. SHG Group Liability & Peer Guarantee</h4>
        <p>
          Members participating in group lending (JLG/SHG models) acknowledge mutual peer monitoring and collective group
          responsibility under the respective group charter.
        </p>

        <h4 style={{ color: '#0f172a', margin: '1.2rem 0 0.4rem' }}>5. Cyber Security Obligations</h4>
        <p>
          Users are strictly advised never to disclose their UPI PIN or SMS OTP to any individual claiming to represent
          FinanceSaathi, banks, or police authorities. In case of suspected fraud, immediately dial <b>1930</b>.
        </p>

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <Link to="/" className="btn ghost small">← Back to Dashboard</Link>
        </div>
      </section>
    </div>
  )
}
