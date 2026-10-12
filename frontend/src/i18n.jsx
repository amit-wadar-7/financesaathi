import { createContext, useContext, useState } from 'react'

const D = {
  en: {
    dashboard: 'Dashboard', loans: 'Loans & SHG', calculators: 'Calculators', learn: 'Academy', schemes: 'Schemes',
    savings: 'Savings & Budget', profile: 'Profile', shg: 'My SHG', atRisk: 'At-risk loans', admin: 'Admin',
    notifications: 'Notifications', logout: 'Logout', login: 'Login', register: 'Register',
    email: 'Email', password: 'Password', name: 'Full name', phone: 'Phone', language: 'Language',
    newLoan: 'New loan', amount: 'Amount (Rs)', rate: 'Interest rate (% per year)', months: 'Tenure (months)',
    purpose: 'Purpose', apply: 'Apply', status: 'Status', emi: 'EMI', outstanding: 'Outstanding',
    nextInstallment: 'Next instalment', totalSaved: 'Total saved', coursesDone: 'Courses completed',
    activeLoans: 'Active loans', pendingLoans: 'Pending loans', healthScore: 'Financial health score',
    save: 'Save', income: 'Monthly income (Rs)', expenses: 'Monthly expenses (Rs)',
    existingEmi: 'Existing EMIs per month (Rs)', savingsBalance: 'Current savings (Rs)',
    welcome: 'Namaste', pay: 'Pay', approve: 'Approve', reject: 'Reject', submit: 'Submit',
    start: 'Start', back: 'Back', ready: 'Ready', caution: 'Needs caution', not_ready: 'Not ready',
    fillProfile: 'Please fill in your income and expenses in your profile first.',
    noAccount: 'No account?', haveAccount: 'Already registered?',
    saathiAi: 'Saathi AI', quickActions: 'Quick Actions', depositShg: 'Deposit SHG', payEmi: 'Pay EMI',
    askSaathi: 'Ask Saathi', emergencyCalc: 'Emergency Calc', totalSavingsAssets: 'TOTAL SAVINGS & ASSETS',
    monthlySpend: 'Monthly Spend & Budget', targetGoal: 'Target Savings Goal', streak: '5-Day Learning Streak!',
    viewLedger: 'View Ledger', payUpi: 'Pay UPI', allGoals: 'All Goals', startLesson: 'Start Lesson',
  },
  hi: {
    dashboard: 'डैशबोर्ड', loans: 'ऋण व SHG', calculators: 'कैलकुलेटर', learn: 'अकादमी', schemes: 'योजनाएँ',
    savings: 'बचत व बजट', profile: 'प्रोफ़ाइल', shg: 'मेरा एसएचजी', atRisk: 'जोखिम वाले ऋण', admin: 'एडमिन',
    notifications: 'सूचनाएँ', logout: 'लॉग आउट', login: 'लॉग इन', register: 'पंजीकरण',
    email: 'ईमेल', password: 'पासवर्ड', name: 'पूरा नाम', phone: 'फ़ोन', language: 'भाषा',
    newLoan: 'नया ऋण', amount: 'राशि (रु)', rate: 'ब्याज दर (% प्रति वर्ष)', months: 'अवधि (महीने)',
    purpose: 'उद्देश्य', apply: 'आवेदन करें', status: 'स्थिति', emi: 'ईएमआई', outstanding: 'बकाया',
    nextInstallment: 'अगली किस्त', totalSaved: 'कुल बचत', coursesDone: 'पूरे किए कोर्स',
    activeLoans: 'चालू ऋण', pendingLoans: 'लंबित ऋण', healthScore: 'वित्तीय स्वास्थ्य स्कोर',
    save: 'सहेजें', income: 'मासिक आय (रु)', expenses: 'मासिक खर्च (रु)',
    existingEmi: 'मौजूदा मासिक ईएमआई (रु)', savingsBalance: 'वर्तमान बचत (रु)',
    welcome: 'नमस्ते', pay: 'भुगतान', approve: 'मंज़ूर करें', reject: 'अस्वीकार करें', submit: 'जमा करें',
    start: 'शुरू करें', back: 'वापस', ready: 'तैयार', caution: 'सावधानी ज़रूरी', not_ready: 'तैयार नहीं',
    fillProfile: 'कृपया पहले प्रोफ़ाइल में अपनी आय और खर्च भरें।',
    noAccount: 'खाता नहीं है?', haveAccount: 'पहले से पंजीकृत हैं?',
    saathiAi: 'साथी AI', quickActions: 'त्वरित क्रियाएँ', depositShg: 'SHG बचत जमा', payEmi: 'किस्त भरें',
    askSaathi: 'साथी से पूछें', emergencyCalc: 'आपातकालीन कैल्क', totalSavingsAssets: 'कुल बचत एवं संपत्ति',
    monthlySpend: 'मासिक खर्च व बजट', targetGoal: 'लक्ष्य बचत योजना', streak: '5-दिवसीय लर्निंग स्ट्रीक!',
    viewLedger: 'लेजर देखें', payUpi: 'UPI भुगतान', allGoals: 'सभी लक्ष्य', startLesson: 'पाठ शुरू करें',
  },
  mr: {
    dashboard: 'डॅशबोर्ड', loans: 'कर्जे व बचत गट', calculators: 'कॅल्क्युलेटर', learn: 'अकादमी', schemes: 'शासकीय योजना',
    savings: 'बचत व अंदाजपत्रक', profile: 'प्रोफाइल', shg: 'माझा बचत गट', atRisk: 'जोखमीची कर्जे', admin: 'अॅडमिन',
    notifications: 'सूचना', logout: 'लॉग आउट', login: 'लॉग इन', register: 'नोंदणी',
    email: 'ईमेल', password: 'पासवर्ड', name: 'पूर्ण नाव', phone: 'फोन', language: 'भाषा',
    newLoan: 'नवीन कर्ज', amount: 'रक्कम (रु)', rate: 'व्याजदर (% वार्षिक)', months: 'कालावधी (महिने)',
    purpose: 'उद्देश', apply: 'अर्ज करा', status: 'स्थिती', emi: 'ईएमआय', outstanding: 'थकबाकी',
    nextInstallment: 'पुढचा हप्ता', totalSaved: 'एकूण बचत', coursesDone: 'पूर्ण केलेले कोर्स',
    activeLoans: 'चालू कर्जे', pendingLoans: 'प्रलंबित कर्जे', healthScore: 'आर्थिक आरोग्य गुण',
    save: 'जतन करा', income: 'मासिक उत्पन्न (रु)', expenses: 'मासिक खर्च (रु)',
    existingEmi: 'सध्याचे मासिक ईएमआय (रु)', savingsBalance: 'सध्याची बचत (रु)',
    welcome: 'नमस्ते', pay: 'भरा', approve: 'मंजूर करा', reject: 'नाकारा', submit: 'सादर करा',
    start: 'सुरू करा', back: 'मागे', ready: 'तयार', caution: 'सावधगिरी हवी', not_ready: 'तयार नाही',
    fillProfile: 'कृपया आधी प्रोफाइलमध्ये तुमचे उत्पन्न आणि खर्च भरा.',
    noAccount: 'खाते नाही?', haveAccount: 'आधीच नोंदणी केली आहे?',
    saathiAi: 'साथी AI', quickActions: 'जलद कृती', depositShg: 'बचत गट जमा', payEmi: 'हप्ता भरा',
    askSaathi: 'साथीला विचारा', emergencyCalc: 'आपत्कालीन कैल्क', totalSavingsAssets: 'एकूण बचत व मालमत्ता',
    monthlySpend: 'मासिक खर्च व अंदाजपत्रक', targetGoal: 'ध्येय बचत योजना', streak: '५-दिवसीय लर्निंग स्ट्रीक!',
    viewLedger: 'पासबुक/लेजर', payUpi: 'UPI भरा', allGoals: 'सर्व ध्येये', startLesson: 'धडा सुरू करा',
  },
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('lang') || 'en')
  const setLang = (l) => { localStorage.setItem('lang', l); setLangState(l) }
  const t = (k) => (D[lang] && D[lang][k]) || D.en[k] || k
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
