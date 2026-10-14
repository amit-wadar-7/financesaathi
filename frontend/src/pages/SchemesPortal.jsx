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


const LOCALIZED_SCHEME_METADATA = {
  hi: {
    pm_kisan: {
      nodalMinistry: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार',
      tag: '100% केंद्रीय प्रत्यक्ष लाभ अंतरण (DBT)',
      documents: ['आधार कार्ड (अनिवार्य)', 'कृषि भूमि रिकॉर्ड (7/12 खतौनी / खसरा)', 'बैंक खाता पासबुक आईएफएससी कोड सहित'],
      applicationSteps: 'आधिकारिक पीएम-किसान पोर्टल अथवा नजदीकी सामान्य सेवा केंद्र (सीएससी) पर पंजीकरण करें। राज्य नोडल अधिकारी भूमि अभिलेखों का सत्यापन करते हैं।',
    },
    pm_mudra: {
      nodalMinistry: 'वित्त मंत्रालय / वित्तीय सेवा विभाग',
      tag: 'बिना गारंटी मुद्रा एमएसएमई ऋण',
      documents: ['पहचान एवं निवास प्रमाण (आधार / मतदाता पत्र)', 'दुकान लाइसेंस / उद्यम आधार प्रमाण पत्र', 'मशीनरी / सामग्री खरीद कोटेशन'],
      applicationSteps: 'उद्यम मित्र पोर्टल पर ऑनलाइन आवेदन करें अथवा किसी भी वाणिज्यिक, ग्रामीण या सहकारी बैंक शाखा में सीधे प्रस्ताव जमा करें।',
    },
    pm_svanidhi: {
      nodalMinistry: 'आवासन और शहरी कार्य मंत्रालय',
      tag: '7% प्रत्यक्ष ब्याज सब्सिडी',
      documents: ['मोबाइल लिंक्ड आधार कार्ड', 'स्ट्रीट वेंडिंग प्रमाणपत्र (CoVR) अथवा नगर निकाय अनुशंसा पत्र', 'बैंक पासबुक / यूपीआई क्यूआर मर्चेंट प्रमाण'],
      applicationSteps: 'पीएम-स्वनिधि पोर्टल अथवा स्थानीय नगर निकाय (ULB) नोडल अधिकारी के माध्यम से आवेदन करें।',
    },
    day_nrlm: {
      nodalMinistry: 'ग्रामीण विकास मंत्रालय',
      tag: 'बचत गट बैंक लिंकेज एवं ब्याज सब्सिडी',
      documents: ['बचत गट सदस्य पासबुक व बैठक प्रस्ताव पुस्तिका', 'सदस्य का आधार कार्ड', 'बचत गट बैंक खाता विवरण'],
      applicationSteps: 'राज्य ग्रामीण आजीविका मिशन (SRLM) के अंतर्गत गांव में स्वयं सहायता समूह में शामिल हों अथवा बनाएं।',
    },
    pmjdy: {
      nodalMinistry: 'वित्तीय सेवा विभाग, वित्त मंत्रालय',
      tag: 'सार्वभौमिक शून्य-शेष बैंक खाता',
      documents: ['आधार कार्ड (अथवा कोई आधिकारिक वैध पहचान पत्र)', 'पासपोर्ट आकार का फोटो'],
      applicationSteps: 'आधार कार्ड लेकर किसी भी बैंक शाखा अथवा बैंक मित्र / ग्राहक सेवा केंद्र पर तुरंत जन धन खाता खुलवाएं।',
    },
    pm_kusum: {
      nodalMinistry: 'नवीन और नवीकरणीय ऊर्जा मंत्रालय (MNRE)',
      tag: '60% तक सोलर पंप सब्सिडी',
      documents: ['कृषि भूमि 7/12 खतौनी अभिलेख', 'आधार कार्ड एवं बैंक पासबुक', 'जल स्रोत प्रमाण पत्र / भूजल अनापत्ति प्रमाण'],
      applicationSteps: 'राज्य अक्षय ऊर्जा विकास एजेंसी पोर्टल (जैसे MEDA / डिस्कॉम) के माध्यम से आवेदन करें। 10-40% किसान अंशदान जमा करें।',
    },
    pm_awas: {
      nodalMinistry: 'ग्रामीण विकास मंत्रालय',
      tag: 'पक्का आवास प्रत्यक्ष निर्माण अनुदान',
      documents: ['परिवार के सभी वयस्क सदस्यों का आधार कार्ड', 'मनरेगा जॉब कार्ड', 'आधार लिंक्ड बैंक खाता पासबुक'],
      applicationSteps: 'ग्राम सभा सामाजिक-आर्थिक जाति जनगणना (SECC) सूची से पात्र लाभार्थियों का चयन करती है। निर्माण चरणों के सत्यापन उपरांत सीधी सहायता मिलती है।',
    },
    sukanya: {
      nodalMinistry: 'वित्त मंत्रालय / राष्ट्रीय बचत संस्थान',
      tag: '8.2% संप्रभु चक्रवृद्धि ब्याज दर',
      documents: ['बालिका का जन्म प्रमाण पत्र', 'माता-पिता/अभिभावक का पहचान प्रमाण (आधार / पैन)', 'अभिभावक का निवास प्रमाण पत्र'],
      applicationSteps: 'मात्र ₹250 की शुरुआती जमा राशि से किसी भी डाकघर अथवा अधिकृत वाणिज्यिक बैंक शाखा में खाता खुलवाएं।',
    },
  },
  mr: {
    pm_kisan: {
      nodalMinistry: 'कृषी व शेतकरी कल्याण मंत्रालय, भारत सरकार',
      tag: '१००% थेट बँक खात्यात अनुदान (DBT)',
      documents: ['आधार कार्ड (अनिवार्य)', 'शेती जमीन मालकी नोंद (७/१२ उतारा व ८-अ)', 'बँक खाते पासबुक आयएफएससी कोडसह'],
      applicationSteps: 'अधिकृत पीएम-किसान पोर्टलवर किंवा जवळच्या महा-ई-सेवा केंद्रावर नोंदणी करा. तालुका कृषी अधिकारी शेतजमीन नोंदींची पडताळणी करतात.',
    },
    pm_mudra: {
      nodalMinistry: 'वित्त मंत्रालय, भारत सरकार',
      tag: 'विनातारण मुद्रा व्यवसाय कर्ज',
      documents: ['ओळख व पत्त्याचा पुरावा (आधार / मतदार ओळखपत्र)', 'दुकान परवाना / उद्यम आधार नोंदणी प्रमाणपत्र', 'यंत्रसामग्री व माल खरेदी कोटेशन बिल'],
      applicationSteps: 'उद्यम मित्र पोर्टलवर ऑनलाइन अर्ज करा किंवा कोणत्याही राष्ट्रीयीकृत, ग्रामीण अथवा सहकारी बँकेत थेट अर्ज सादर करा.',
    },
    pm_svanidhi: {
      nodalMinistry: 'गृहनिर्माण व नगरविकास मंत्रालय',
      tag: '७% थेट व्याज सवलत अनुदान',
      documents: ['मोबाईल जोडलेले आधार कार्ड', 'फेरीवाला प्रमाणपत्र (CoVR) किंवा नगरपरिषद शिफारस पत्र', 'बँक पासबुक / डिजिटल यूपीआय क्युआर कोड पुरावा'],
      applicationSteps: 'पीएम-स्वनिधी पोर्टलवर किंवा स्थानिक नगरपरिषद / महानगरपालिका कक्षात थेट अर्ज सादर करा.',
    },
    day_nrlm: {
      nodalMinistry: 'ग्रामीण विकास मंत्रालय',
      tag: 'बचत गट बँक जोडणी व व्याज सवलत',
      documents: ['बचत गट सदस्य पासबुक व बैठक ठराव वही', 'सदस्याचे आधार कार्ड', 'बचत गट अधिकृत बँक खाते तपशील'],
      applicationSteps: 'उमेद महाराष्ट्र राज्य ग्रामीण जीवनोन्नती अभियानांतर्गत (MSRLM) गावात महिला बचत गट स्थापन करा अथवा जोडले जा.',
    },
    pmjdy: {
      nodalMinistry: 'वित्तीय सेवा विभाग, वित्त मंत्रालय',
      tag: 'शून्य शिल्लक जन धन बँक खाते',
      documents: ['आधार कार्ड (किंवा अधिकृत वैध ओळख पुरावा)', 'पासपोर्ट आकाराचे छायाचित्र'],
      applicationSteps: 'कोणत्याही बँक शाखेत किंवा बँक प्रतिनिधी / सीएससी केंद्रावर जाऊन आधार कार्डद्वारे शून्य शिल्लक जन धन खाते उघडा.',
    },
    pm_kusum: {
      nodalMinistry: 'नवीन व नवीकरणीय ऊर्जा मंत्रालय (MNRE)',
      tag: '६०% पर्यंत सौर कृषी पंप अनुदान',
      documents: ['शेती जमीन ७/१२ उतारा व ८-अ नोंद', 'आधार कार्ड व बँक पासबुक प्रत', 'पाणी स्रोत उपलब्धता दाखला / भूजल विभाग मंजुरी'],
      applicationSteps: 'महाऊर्जा (MEDA) पोर्टलवर किंवा महावितरण संकेतस्थळावर सौर कृषी पंपासाठी ऑनलाइन नोंदणी करा.',
    },
    pm_awas: {
      nodalMinistry: 'ग्रामीण विकास मंत्रालय',
      tag: 'थेट पक्के घर बांधकाम अनुदान',
      documents: ['कुटुंबातील सर्व सज्ञान सदस्यांचे आधार कार्ड', 'मनरेगा जॉब कार्ड', 'आधार जोडलेले बँक खाते पासबुक'],
      applicationSteps: 'ग्रामसभेमार्फत प्रधानमंत्री आवास योजनेच्या प्रतीक्षा यादीतून लाभार्थी निवडले जातात. जिओटॅगिंगनुसार हप्त्यांमध्ये रक्कम जमा होते.',
    },
    sukanya: {
      nodalMinistry: 'वित्त मंत्रालय / राष्ट्रीय अल्पबचत संस्था',
      tag: '८.२% सर्वोच्च चक्रवाढ व्याजदर',
      documents: ['मुलीचा अधिकृत जन्म दाखला', 'पालकांचे आधार कार्ड व पॅन कार्ड', 'पालकांचा रहिवासी दाखला'],
      applicationSteps: 'फक्त ₹२५० भरून कोणत्याही पोस्ट ऑफिसमध्ये किंवा अधिकृत बँकेच्या शाखेत सुकन्या समृद्धी खाते उघडा.',
    },
  },
}

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
          <h2>{t("schemes_header_title")}</h2>
          <p className="page-subtitle">
            {t("schemes_header_sub")}
          </p>
        </div>
      </div>

      {/* Interactive Smart Eligibility Finder Banner */}
      <div className="card eligibility-finder-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
          <IconAward size={22} className="text-emerald" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t("matcher_title")}</h3>
          {user && (
            <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--emerald-50)', color: 'var(--emerald-700)', border: '1px solid var(--emerald-200)' }}>
              {t("matcher_auto_matched")}
            </span>
          )}
        </div>
        <p className="muted small" style={{ marginBottom: '1.25rem' }}>
          {t("matcher_sub")}
        </p>

        <div className="finder-inputs-grid">
          <div className="field" style={{ margin: 0 }}>
            <span>{t("label_primary_livelihood")}</span>
            <select
              value={finderOccupation}
              onChange={(e) => setFinderOccupation(e.target.value)}
            >
              <option value="farmer">{t("occ_farmer")}</option>
              <option value="vendor">{t("occ_vendor")}</option>
              <option value="dairy">{t("occ_dairy")}</option>
              <option value="artisan">{t("occ_artisan")}</option>
              <option value="general">{t("occ_general")}</option>
            </select>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <span>{t("label_annual_income")}</span>
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
              <span>{t("check_has_land")}</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={finderIsShg}
                onChange={(e) => setFinderIsShg(e.target.checked)}
              />
              <span>{t("check_is_shg")}</span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <label className="check">
              <input
                type="checkbox"
                checked={finderIsWoman}
                onChange={(e) => setFinderIsWoman(e.target.checked)}
              />
              <span>{t("check_is_woman")}</span>
            </label>
            <button
              type="button"
              className={`btn small ${showOnlyEligible ? 'emerald' : 'ghost'}`}
              onClick={() => setShowOnlyEligible(!showOnlyEligible)}
              style={{ marginTop: '0.2rem' }}
            >
              {showOnlyEligible ? t("btn_showing_matched") : t("btn_filter_match")}
            </button>
          </div>
        </div>

        {/* Calculated Match Banner */}
        <div className="finder-results-bar">
          <div>
            <span className="results-label">{t("unlocked_assistance")}</span>
            <div className="results-amount">
              {t("up_to")} {money(totalEligibleValue)} {t("in_grants")}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge approved" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              ✓ {eligibleSchemes.length} of {schemesList.length} {t("schemes_matched_badge")}
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
            placeholder={lang === "hi" ? "योजना का नाम, मंत्रालय खोजें..." : lang === "mr" ? "योजनेचे नाव, मंत्रालय शोधा..." : "Search scheme name, ministry..."}
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
                      {lang === "hi" ? "✓ पात्र" : lang === "mr" ? "✓ पात्र" : "✓ Eligible"}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="scheme-title">{s.name}</h3>
              <p className="scheme-ministry">{s.nodalMinistry}</p>

              <div className="scheme-highlight-box">
                <span className="highlight-label">{lang === "hi" ? "प्रमुख लाभ" : lang === "mr" ? "मुख्य लाभ" : "KEY BENEFIT"}</span>
                <span className="highlight-text">{s.benefitHighlight}</span>
              </div>

              <p className="scheme-summary">{s.summary}</p>

              <div className="scheme-footer-actions">
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => setSelectedScheme(s)}
                >
                  {t("btn_view_details")}
                </button>
                <a
                  href={s.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {t("official_portal_link")}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {displayedSchemes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', marginTop: '1rem' }}>
          <p className="muted">{lang === "hi" ? "चयनित फ़िल्टर से मेल खाती कोई योजना नहीं मिली।" : lang === "mr" ? "निवडलेल्या फिल्टरनुसार कोणतीही योजना आढळली नाही." : "No schemes found matching the selected filters."}</p>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              setSelectedCat('all')
              setSearch('')
              setShowOnlyEligible(false)
            }}
          >
            {lang === "hi" ? "फ़िल्टर हटाएं" : lang === "mr" ? "फिल्टर काढा" : "Clear Filters"}
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
                {lang === "hi" ? "प्रमुख वित्तीय लाभ" : lang === "mr" ? "प्रमुख शासकीय लाभ" : "Flagship Benefit"}
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
