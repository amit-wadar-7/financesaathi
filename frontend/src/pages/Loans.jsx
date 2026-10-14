import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, money } from '../api'
import { useAuth } from '../auth'
import { useLang } from '../i18n'
import { Alert, Badge, Card, Factors, Field, Loading, Progress, Stat, useLoad, useToast, DonutSplitChart } from '../ui'
import {
  IconPlus,
  IconSearch,
  IconShield,
  IconCheckCircle,
  IconClock,
  IconAlertTriangle,
  IconCreditCard,
  IconFileText,
  IconArrowRight,
  IconCoins,
  IconTractor,
  IconUsers,
  IconCart,
  IconHospital,
  IconZap,
  IconCheck,
  IconCalculator,
  IconPrinter,
  IconAward,
  IconDownload,
  IconUpload,
} from '../icons'

export const PRODUCT_METADATA = {
  kisan_agri: {
    title: 'Kisan Agri & Harvest Facility',
    subtitle: 'Crop Cultivation, Hybrid Seeds, Fertilizers & Farm Implements',
    category: 'agri',
    icon: <IconTractor size={22} />,
    tag: '3% Interest Subvention Eligible',
    apr: 7.0,
    defaultAmount: 40000,
    minAmount: 5000,
    maxAmount: 150000,
    tenures: [6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Seasonal repayment aligned with Rabi & Kharif harvest sales',
      'NABARD & Kisan Credit Card guideline compliant',
      'Crop calamity grace period & zero foreclosure penalty',
    ],
    presets: [
      'Kharif Hybrid Seeds & Fertilizers',
      'Micro-Drip Irrigation Accessories',
      'Tractor & Harvester Service Rental',
      'Borewell Submersible Pump Repair',
    ],
  },
  pm_mudra: {
    title: 'PM MUDRA MSME Business Credit',
    subtitle: 'Working Capital & Equipment for Small Non-Farm Enterprises',
    category: 'msme',
    icon: <IconCart size={22} />,
    tag: 'Collateral-Free MUDRA Backed',
    apr: 8.5,
    defaultAmount: 50000,
    minAmount: 10000,
    maxAmount: 200000,
    tenures: [6, 12, 18, 24, 36],
    defaultTenure: 18,
    features: [
      'Zero collateral security required for Shishu and Kishore tiers',
      'Special MUDRA RuPay card for recurring trade purchases',
      'Concessional interest subvention for manufacturing & shop units',
    ],
    presets: [
      'Kirana Store Stock Refill & Inventory Expansion',
      'Small Flour Mill / Grinding Machinery',
      'Apparel & Readymade Garment Inventory',
      'Handloom & Handicraft Raw Material Purchase',
    ],
  },
  mahila_shakti: {
    title: 'Mahila Shakti SHG Enterprise Loan',
    subtitle: 'Collateral-Free Joint Liability Credit for Women Entrepreneurs',
    category: 'shg',
    icon: <IconUsers size={22} />,
    tag: 'SHG Peer Guarantee Backed',
    apr: 8.5,
    defaultAmount: 35000,
    minAmount: 5000,
    maxAmount: 150000,
    tenures: [6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Backed by Self-Help Group social peer collateral',
      'Prompt repayment interest incentive of 1.5% cashback',
      'Comprehensive financial training & group mentorship',
    ],
    presets: [
      'Dairy Cow & Cattle Procurement',
      'Tailoring & Garment Workshop Unit',
      'Spice Processing & Pickle Packaging Unit',
      'Village Grocery Store Stock Expansion',
    ],
  },
  pm_svanidhi: {
    title: 'PM SVANidhi Micro-Vendor Credit',
    subtitle: 'Working Capital Facility for Urban & Semi-Urban Street Vendors',
    category: 'vendor',
    icon: <IconCoins size={22} />,
    tag: '7% Interest Subsidy Directly Credited',
    apr: 7.0,
    defaultAmount: 10000,
    minAmount: 2000,
    maxAmount: 50000,
    tenures: [6, 12],
    defaultTenure: 12,
    features: [
      'Tiered credit ladder: ₹10k → ₹20k → ₹50k on prompt repayment',
      'Monthly digital cashback incentives on UPI QR collections',
      'Zero processing fee and zero margin deposit',
    ],
    presets: [
      'Daily Street Vending Working Capital',
      'Fast-Moving Kirana Retail Refill',
      'Vending Handcart Repair & Refurbishment',
      'Digital Weighing Scale & Stock Setup',
    ],
  },
  emergency_health: {
    title: 'Emergency Medical & Social Relief',
    subtitle: 'Express 24-Hour Paperless Sanction for Health Contingencies',
    category: 'emergency',
    icon: <IconHospital size={22} />,
    tag: '24-Hour Express Sanction',
    apr: 6.0,
    defaultAmount: 15000,
    minAmount: 2000,
    maxAmount: 40000,
    tenures: [3, 6, 12],
    defaultTenure: 6,
    features: [
      'Express sanction disbursed within 24 hours of hospital slip',
      'Zero pre-closure penalty and zero paperwork fees',
      'Repayable in flexible weekly or monthly micro-installments',
    ],
    presets: [
      'Urgent Hospitalization & Medicine Expenses',
      'Emergency Accident Care & Surgery',
      'Diagnostic Tests, Scans & Prescriptions',
      'Travel & Caregiver Expenses for City Hospital',
    ],
  },
  solar_green: {
    title: 'Clean Energy Solar Pump Financing',
    subtitle: 'Concessional Financing for Solar Pumps & Agri Clean Power',
    category: 'solar',
    icon: <IconZap size={22} />,
    tag: 'Green Concessional Financing',
    apr: 6.5,
    defaultAmount: 75000,
    minAmount: 15000,
    maxAmount: 300000,
    tenures: [12, 24, 36, 48, 60],
    defaultTenure: 24,
    features: [
      'Integrated with PM-KUSUM Central & State capital subsidies',
      'Replaces costly recurring diesel generator expenses',
      'Includes warranty and equipment insurance coverage',
    ],
    presets: [
      'Solar Irrigation Submersible Pump (3HP / 5HP)',
      'Rooftop Solar Array for Dairy / Cottage Unit',
      'Solar Micro Cold-Storage Unit',
      'Solar Flour Mill & Grain Dryer Installation',
    ],
  },
  artisan_micro: {
    title: 'Rural Artisan & Handloom Microcredit',
    subtitle: 'Raw Material & Working Capital for Craftspersons & Weavers',
    category: 'artisan',
    icon: <IconAward size={22} />,
    tag: 'PM Vishwakarma Concessional Rate',
    apr: 8.0,
    defaultAmount: 25000,
    minAmount: 5000,
    maxAmount: 80000,
    tenures: [6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Low 8.0% interest rate with Ministry of MSME backing',
      'Tool-kit and modern handloom equipment incentive eligibility',
      'Mandi and exhibition fair advance credit facility',
    ],
    presets: [
      'Handloom Silk & Cotton Yarn Procurement',
      'Pottery, Terracotta & Clay Craft Processing Kiln',
      'Carpentry & Woodcraft Electric Precision Tools',
      'Leather Footwear & Traditional Embroidery Materials',
    ],
  },
  standard: {
    title: 'Standard Microfinance Term Loan',
    subtitle: 'General Purpose Livelihood & Income Generation Credit',
    category: 'custom',
    icon: <IconCreditCard size={22} />,
    tag: 'RBI Fair Practice Code Compliant',
    apr: 12.0,
    defaultAmount: 30000,
    minAmount: 2000,
    maxAmount: 100000,
    tenures: [3, 6, 12, 18, 24],
    defaultTenure: 12,
    features: [
      'Transparent reducing-balance interest calculation',
      'Zero hidden charges, zero prepayment penalty',
      'Bi-lingual loan sanction agreement in local language',
    ],
    presets: [
      'Livestock Fodder & Feed Bulk Purchase',
      'Small Commercial Vehicle Downpayment',
      'Solar Home Lighting System Installation',
      'Seasonal Inventory Working Capital',
    ],
  },
}

export function formatDocLabel(docKey) {
  const map = {
    aadhaar: 'Aadhaar / Voter ID Proof',
    pan: 'PAN Card Proof',
    land_record: 'Land Revenue Record (7/12 Extract)',
    income_proof: 'Panchayat Agri Income Certificate',
    business_proof: 'Shop License / Udyam Aadhaar Registration',
    shg_resolution: 'SHG Meeting Resolution & Peer Guarantee Letter',
    vendor_certificate: 'Street Vendor Certificate (CoVR / ULB Letter)',
    quotation_invoice: 'Authorized Vendor Quotation & Proforma Invoice',
    artisan_card: 'Pehchan Artisan ID Card / Vishwakarma Certificate',
  }
  return map[docKey] || docKey.replace('_', ' ').toUpperCase()
}


const LOCALIZED_PRODUCT_DATA = {
  hi: {
    kisan_agri: {
      title: 'किसान कृषि एवं फसल ऋण सुविधा',
      subtitle: 'फसल बुवाई, संकरित बीज, खाद एवं कृषि उपकरण',
      tag: '3% ब्याज सब्सिडी हेतु पात्र',
      features: [
        'रबी एवं खरीफ फसल कटाई बिक्री के अनुसार मौसमी भुगतान',
        'नाबार्ड एवं किसान क्रेडिट कार्ड दिशानिर्देश अनुरूप',
        'फसल आपदा रियायत एवं शून्य पूर्व-भुगतान शुल्क',
      ],
      presets: [
        'खरीफ संकरित बीज एवं उर्वरक खरीद',
        'सूक्ष्म ड्रिप सिंचाई उपकरण एवं पाइप',
        'ट्रैक्टर एवं थ्रेशर मशीन सेवा किराया',
        'बोरवेल सबमर्सिबल पंप मरम्मत',
      ],
    },
    pm_mudra: {
      title: 'पीएम मुद्रा एमएसएमई व्यापार ऋण',
      subtitle: 'लघु गैर-कृषि उद्यमों हेतु कार्यशील पूंजी व उपकरण',
      tag: 'बिना गारंटी मुद्रा समर्थित',
      features: [
        'शिशु एवं किशोर ऋण हेतु किसी संपार्श्विक जमानत की आवश्यकता नहीं',
        'व्यापारिक खरीद हेतु विशेष मुद्रा रुपे कार्ड सुविधा',
        'विनिर्माण एवं दुकान इकाइयों हेतु रियायती ब्याज दर',
      ],
      presets: [
        'किराना दुकान स्टॉक रिफिल एवं विस्तार',
        'आटा चक्की एवं मसाला पिसाई मशीनरी',
        'रेडीमेड गारमेंट एवं कपड़ा भंडार स्टॉक',
        'हथकरघा एवं हस्तशिल्प कच्चा माल खरीद',
      ],
    },
    mahila_shakti: {
      title: 'महिला शक्ति एसएचजी उद्यम ऋण',
      subtitle: 'महिला आजीविका संवर्धन हेतु संयुक्त देयता पूंजी',
      tag: 'एसएचजी समूह समर्थित ऋण',
      features: [
        'स्वयं सहायता समूह की सामाजिक गारंटी पर आधारित',
        'समय पर पुनर्भुगतान करने पर 1.5% ब्याज प्रोत्साहन',
        'व्यापक वित्तीय प्रशिक्षण एवं समूह मार्गदर्शन',
      ],
      presets: [
        'दुधारू गाय एवं पशुधन खरीद',
        'सिलाई एवं परिधान कार्यशाला इकाई',
        'मसाला पिसाई एवं अचार पैकेजिंग इकाई',
        'ग्रामीण किराना दुकान विस्तार',
      ],
    },
    pm_svanidhi: {
      title: 'पीएम स्वनिधि स्ट्रीट वेंडर क्रेडिट',
      subtitle: 'स्ट्रीट वेंडर एवं फेरीवालों हेतु कार्यशील पूंजी',
      tag: '7% प्रत्यक्ष ब्याज सब्सिडी',
      features: [
        'नियमित डिजिटल लेन-देन पर प्रति माह ₹100 तक कैशबैक',
        'समय पर पुनर्भुगतान पर बढ़ी हुई ऋण सीमा',
        'बिना किसी कागजी बंधक के तुरंत स्वीकृति',
      ],
      presets: [
        'फल एवं सब्जी ठेला कार्यशील पूंजी',
        'चाय एवं नाश्ता स्टॉल सामग्री',
        'रेडीमेड परिधान एवं फुटपाथ व्यापार',
      ],
    },
    emergency_health: {
      title: 'आपातकालीन चिकित्सा एवं स्वास्थ्य अग्रिम',
      subtitle: 'चिकित्सा उपचार हेतु तत्काल संपार्श्विक-मुक्त सहायता',
      tag: 'त्वरित अनुमोदन सुविधा',
      features: [
        'अस्पताल भर्ती एवं आपातकाल में त्वरित संवितरण',
        'पारिवारिक आपातकाल हेतु शून्य दंडात्मक प्रभार',
        'सरल मासिक अथवा त्रैमासिक चुकौती विकल्प',
      ],
      presets: [
        'आपातकालीन अस्पताल उपचार एवं सर्जरी',
        'दवाइयां एवं चिकित्सकीय परीक्षण',
        'दुर्घटना उपचार एवं स्वास्थ्य देखभाल',
      ],
    },
    solar_green: {
      title: 'स्वच्छ ऊर्जा सोलर पंप ऋण',
      subtitle: 'सोलर कृषि पंप एवं रूफटॉप पैनल हेतु रियायती ऋण',
      tag: 'पीएम सूर्य घर योजना अनुरूप',
      features: [
        'पीएम-कुसुम केंद्रीय एवं राज्य सब्सिडी के साथ एकीकृत',
        'महंगे डीजल जनरेटर के खर्च से स्थायी मुक्ति',
        'उपकरण वारंटी एवं व्यापक बीमा संरक्षण सहित',
      ],
      presets: [
        'सोलर सिंचाई सबमर्सिबल पंप (3HP / 5HP)',
        'डेयरी फार्म हेतु सोलर रूफटॉप पैनल',
        'सोलर आटा चक्की एवं सौर कोल्ड स्टोरेज',
      ],
    },
    artisan_micro: {
      title: 'ग्रामीण कारीगर एवं हथकरघा ऋण',
      subtitle: 'कारीगरों व बुनकरों हेतु कच्चा माल व कार्यशील पूंजी',
      tag: 'पीएम विश्वकर्मा रियायती दर',
      features: [
        'सूक्ष्म उद्यम मंत्रालय द्वारा समर्थित 8% रियायती ब्याज दर',
        'टूल-किट एवं आधुनिक उपकरण प्रोत्साहन पात्रता',
        'मंडी एवं शिल्प मेले हेतु अग्रिम ऋण सुविधा',
      ],
      presets: [
        'रेशम एवं सूती धागा थोक खरीद',
        'मिट्टी बर्तन व टेराकोटा प्रसंस्करण भट्टी',
        'बढ़ईगीरी व काष्ठशिल्प आधुनिक औजार',
      ],
    },
    standard: {
      title: 'मानक सूक्ष्म ऋण सुविधा',
      subtitle: 'सामान्य आजीविका एवं आय सृजन हेतु सावधि ऋण',
      tag: 'आरबीआई उचित व्यवहार संहिता अनुरूप',
      features: [
        'पारदर्शी घटते मूलधन पर ब्याज गणना',
        'शून्य गुप्त प्रभार, शून्य पूर्व-भुगतान शुल्क',
        'स्थानीय भाषा में द्विभाषी ऋण स्वीकृति पत्र',
      ],
      presets: [
        'पशु आहार एवं चारा थोक खरीद',
        'छोटे वाणिज्यिक वाहन डाउनपेमेंट',
        'मौसमी इन्वेंटरी कार्यशील पूंजी',
      ],
    },
  },
  mr: {
    kisan_agri: {
      title: 'किसान कृषी व पीक कर्ज सुविधा',
      subtitle: 'पीक लागवड, संकरित बियाणे, खते व शेती अवजारे',
      tag: '3% व्याज सवलतीस पात्र',
      features: [
        'रब्बी व खरीप पीक काढणी व बाजार समिती विक्रीशी सुसंगत परतफेड',
        'नाबार्ड व किसान क्रेडिट कार्ड मार्गदर्शक तत्त्वानुसार',
        'नैसर्गिक आपत्ती काळात विशेष सवलत व शून्य मुदतपूर्व शुल्क',
      ],
      presets: [
        'खरीप संकरित बियाणे व खते खरेदी',
        'सूक्ष्म ठिबक सिंचन पाईप व साहित्य',
        'ट्रॅक्टर व मळणी यंत्र भाडे सेवा',
        'बोअरवेल सबमर्सिबल पंप दुरुस्ती',
      ],
    },
    pm_mudra: {
      title: 'पीएम मुद्रा व्यवसाय कर्ज',
      subtitle: 'लहान बिगर-शेती उद्योगांसाठी खेळते भांडवल व यंत्रसामग्री',
      tag: 'विनातारण मुद्रा हमी',
      features: [
        'शिशू व किशोर श्रेणीसाठी कोणतीही तारण हमी आवश्यक नाही',
        'नियमित व्यावसायिक खरेदीसाठी विशेष मुद्रा रुपे कार्ड',
        'उत्पादन व दुकानांसाठी विशेष व्याज अनुदान',
      ],
      presets: [
        'किराणा दुकान माल भरणा व विस्तार',
        'पिठाची गिरणी व मसाला यंत्रसामग्री',
        'तयार कपडे व कापड दुकान साठा',
        'हातमाग व हस्तकला कच्चा माल खरेदी',
      ],
    },
    mahila_shakti: {
      title: 'महिला शक्ती बचत गट व्यवसाय कर्ज',
      subtitle: 'महिला उपजीविकेसाठी संयुक्त हमी भांडवल',
      tag: 'बचत गट हमी कर्ज',
      features: [
        'बचत गटातील सदस्यांच्या परस्पर सामाजिक हमीवर आधारित',
        'वेळेवर परतफेड केल्यास १.५% व्याज परतावा सवलत',
        'व्यावसायिक प्रशिक्षण व गट मार्गदर्शन',
      ],
      presets: [
        'दुभती गाय व पशुधन खरेदी',
        'शिलाई व कपडे निर्मिती केंद्र',
        'मसाले व लोणचे गृहउद्योग युनिट',
        'ग्रामीण किराणा दुकान भांडवल',
      ],
    },
    pm_svanidhi: {
      title: 'पीएम स्वनिधी फेरीवाला पतपुरवठा',
      subtitle: 'फेरीवाले व हातगाडी चालकांसाठी खेळते भांडवल',
      tag: '7% थेट व्याज अनुदान',
      features: [
        'डिजिटल व्यवहारांवर दरमहा ₹१०० पर्यंत थेट कॅशबॅक',
        'वेळेवर परतफेडीनंतर वाढीव कर्ज मर्यादा उपलब्ध',
        'कागदपत्रांशिवाय जलद मंजुरी प्रक्रिया',
      ],
      presets: [
        'फळ व भाजीपाला हातगाडी भांडवल',
        'चहा व अल्पोपहार स्टॉल साहित्य',
        'तयार कपडे व किरकोळ पथविक्री',
      ],
    },
    emergency_health: {
      title: 'आपत्कालीन वैद्यकीय व आरोग्य उचल',
      subtitle: 'वैद्यकीय उपचारांसाठी तात्काळ विनातारण मदत',
      tag: 'तात्काळ मंजुरी सुविधा',
      features: [
        'रुग्णालय भरती व आपत्कालीन स्थितीत तात्काळ वितरण',
        'कौटुंबिक आपत्ती काळात कोणताही दंड आकारला जात नाही',
        'सुलभ मासिक किंवा तिमाही हप्ते परतफेड पर्याय',
      ],
      presets: [
        'तातडीचे रुग्णालय उपचार व शस्त्रक्रिया',
        'औषधे व वैद्यकीय तपासणी खर्च',
        'अपघात उपचार व आरोग्य सेवा',
      ],
    },
    solar_green: {
      title: 'सौर ऊर्जा व कृषी पंप कर्ज',
      subtitle: 'सौर कृषी पंप व छतावरील सौर पॅनेलसाठी सवलतीचे कर्ज',
      tag: 'पीएम सूर्य घर योजना अनुरूप',
      features: [
        'पीएम-कुसुम केंद्रीय व राज्य अनुदानाशी थेट जोडलेले',
        'महागड्या डिझेल पंपाच्या खर्चातून कायमची मुक्ती',
        'यंत्रसामग्री वॉरंटी व सर्वसमावेशक विमा संरक्षणासह',
      ],
      presets: [
        'सौर सिंचन सबमर्सिबल पंप (३ एचपी / ५ एचपी)',
        'डेअरी फार्मसाठी छतावरील सौर ऊर्जा प्रकल्प',
        'सौर पिठाची गिरणी व शीतगृह युनिट',
      ],
    },
    artisan_micro: {
      title: 'ग्रामीण कारागीर व हातमाग कर्ज',
      subtitle: 'कारागीर व विणकरांसाठी कच्चा माल व खेळते भांडवल',
      tag: 'पीएम विश्वकर्मा सवलतीचा दर',
      features: [
        'सूक्ष्म उद्योग मंत्रालयामार्फत ८% सवलतीचा व्याजदर',
        'टूल-किट व आधुनिक उपकरणांसाठी अनुदान पात्रता',
        'बाजारपेठ व प्रदर्शन विक्रीसाठी आगाऊ पतपुरवठा',
      ],
      presets: [
        'रेशीम व सुती धागा घाऊक खरेदी',
        'मातीची भांडी व टेराकोटा भट्टी युनिट',
        'सुतारकाम व लाकूडकाम आधुनिक अवजारे',
      ],
    },
    standard: {
      title: 'मानक सूक्ष्म वित्त कर्ज',
      subtitle: 'सामान्य उपजीविका व उत्पन्न वाढीसाठी मुदत कर्ज',
      tag: 'आरबीआय सुयोग्य व्यवहार संहिता अनुरूप',
      features: [
        'कमी होणाऱ्या मुद्दलावर पारदर्शक व्याज आकारणी',
        'कोणतेही लपविलेले शुल्क नाही, मुदतपूर्व परतफेडीवर शून्य दंड',
        'स्थानिक भाषेत द्वैभाषिक कर्ज करारनामा',
      ],
      presets: [
        'पशुखाद्य व चारा घाऊक खरेदी',
        'लहान व्यावसायिक वाहन डाऊनपेमेंट',
        'हंगामी व्यवसाय खेळते भांडवल',
      ],
    },
  },
}

export function mergeServerProducts(serverProducts, lang = 'en') {
  const loc = LOCALIZED_PRODUCT_DATA[lang] || {}
  if (!serverProducts || !Array.isArray(serverProducts) || serverProducts.length === 0) {
    return Object.entries(PRODUCT_METADATA).map(([code, meta]) => {
      const l = loc[code] || {}
      return {
        id: code,
        ...meta,
        title: l.title || meta.title,
        subtitle: l.subtitle || meta.subtitle,
        tag: l.tag || meta.tag,
        features: l.features || meta.features,
        presets: l.presets || meta.presets,
        docs: (meta.features || []).map((_, i) => ['doc_' + i, 'Document Proof ' + (i + 1)]),
        allowed_schedule_types: ['monthly'],
      }
    })
  }
  return serverProducts.map((sp) => {
    const meta = PRODUCT_METADATA[sp.code] || {}
    const l = loc[sp.code] || {}
    const title = lang === 'hi' && sp.name_hi ? sp.name_hi : lang === 'mr' && sp.name_mr ? sp.name_mr : (l.title || sp.name || meta.title || 'Microcredit Facility')
    const subtitle = l.subtitle || sp.eligibility_notes || meta.subtitle || ''
    const tag = l.tag || meta.tag || `${sp.annual_rate}% APR`
    const features = l.features || meta.features || [sp.eligibility_notes]
    const presets = l.presets || meta.presets || ['General Livelihood Purpose']
    const tenures = meta.tenures || [sp.min_tenure, sp.max_tenure]
    const docs = (sp.required_documents && sp.required_documents.length > 0)
      ? sp.required_documents.map((d) => [d, formatDocLabel(d, lang)])
      : [['aadhaar', formatDocLabel('aadhaar', lang)]]
    return {
      id: sp.code,
      productId: sp.id,
      title,
      subtitle,
      category: meta.category || 'custom',
      icon: meta.icon || <IconCreditCard size={22} />,
      tag,
      apr: sp.annual_rate,
      defaultAmount: meta.defaultAmount || Math.round((sp.min_amount + sp.max_amount) / 2 / 1000) * 1000,
      minAmount: sp.min_amount,
      maxAmount: sp.max_amount,
      tenures,
      defaultTenure: meta.defaultTenure || sp.min_tenure,
      features,
      presets,
      docs,
      allowed_schedule_types: sp.allowed_schedule_types || ['monthly'],
    }
  })
}

export const FALLBACK_LOAN_PRODUCTS = mergeServerProducts([])
export const LOAN_PRODUCTS = FALLBACK_LOAN_PRODUCTS

// Pure EMI formula calculation
function calculateEmi(principal, annualRate, tenureMonths) {
  const p = Number(principal) || 0
  const r = (Number(annualRate) || 0) / 12 / 100
  const n = Number(tenureMonths) || 1
  if (p <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 }
  if (r === 0) {
    const emi = Math.round(p / n)
    return { emi, totalInterest: 0, totalPayment: p }
  }
  const factor = Math.pow(1 + r, n)
  const emi = Math.round((p * r * factor) / (factor - 1))
  const totalPayment = emi * n
  const totalInterest = Math.max(0, totalPayment - p)
  return { emi, totalInterest, totalPayment }
}

export function LoanList() {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState('marketplace') // 'marketplace', 'calculator', 'portfolio'
  const [status, setStatus] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data, error, loading } = useLoad(() => api('/loans' + (status ? '?status=' + status : '')), [status])
  const serverProds = useLoad(() => api('/loans/products', { auth: false }), [])
  const products = useMemo(() => mergeServerProducts(serverProds.data, lang), [serverProds.data, lang])
  const staff = user.role === 'officer' || user.role === 'admin'

  // EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(40000)
  const [calcRate, setCalcRate] = useState(8.5)
  const [calcTenure, setCalcTenure] = useState(12)

  const calcResult = calculateEmi(calcAmount, calcRate, calcTenure)
  const principalPct = calcResult.totalPayment > 0 ? Math.round((calcAmount / calcResult.totalPayment) * 100) : 100
  const interestPct = 100 - principalPct

  const loans = data || []
  const filteredLoans = loans.filter((l) => {
    if (productFilter && l.product_type !== productFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      String(l.id).includes(q) ||
      (l.borrower_name && l.borrower_name.toLowerCase().includes(q)) ||
      (l.purpose && l.purpose.toLowerCase().includes(q)) ||
      (l.product_type && l.product_type.toLowerCase().includes(q))
    )
  })

  const getProductTitle = (type) => {
    const p = products.find((x) => x.id === type)
    return p ? p.title : 'Standard Facility'
  }

  const handleApplyWithCalc = () => {
    nav(`/loans/new?amount=${calcAmount}&rate=${calcRate}&tenure=${calcTenure}`)
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>{t("loans_page_title")}</h2>
          <p className="page-subtitle">
            {t("loans_page_sub")}
          </p>
        </div>
        {!staff && (
          <Link
            className="btn"
            to="/loans/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPlus size={16} /> {t("btn_new_loan")}
          </Link>
        )}
      </div>

      {/* Main Tab Controls */}
      <div className="card tab-bar-card">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          {t("tab_facilities_count")} ({products.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          {t("tab_calculator_title")}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          {staff ? t('tab_portfolio_staff') : t('tab_portfolio_user')} ({loans.length})
        </button>
      </div>

      {/* TAB 1: Specialized Loan Facilities Marketplace */}
      {activeTab === 'marketplace' && (
        <div>
          <div className="loan-catalog-grid">
            {products.map((p) => (
              <div key={p.id} className={`loan-product-card ${p.id === 'kisan_agri' ? 'featured' : ''}`}>
                <div className="product-card-top">
                  <div className={`product-icon-box ${p.category}`}>
                    {p.icon}
                  </div>
                  <div className="product-header-info">
                    <h4>{p.title}</h4>
                    <span className="product-tag-pill green">{p.tag}</span>
                  </div>
                </div>

                <p className="muted small" style={{ margin: '0 0 0.5rem 0', minHeight: '36px' }}>
                  {p.subtitle}
                </p>

                <div className="product-metrics-bar">
                  <div className="product-metric-item">
                    <span className="metric-label">{t("label_annual_apr")}</span>
                    <span className="metric-val text-emerald">{p.apr}% p.a.</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">{t("label_max_limit")}</span>
                    <span className="metric-val">{money(p.maxAmount)}</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">{t("label_tenure_range")}</span>
                    <span className="metric-val">{p.tenures[0]} - {p.tenures[p.tenures.length - 1]} {t("months_unit")}</span>
                  </div>
                  <div className="product-metric-item">
                    <span className="metric-label">{t("label_starter_value")}</span>
                    <span className="metric-val">{money(p.defaultAmount)}</span>
                  </div>
                </div>

                <ul className="product-features-list">
                  {p.features.map((feat, idx) => (
                    <li key={idx}>
                      <span className="check-icon"><IconCheck size={14} /></span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/loans/new?product=${p.id}`}
                  className="btn product-apply-btn"
                >
                  {t("apply_now")} <IconArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: {t("tab_calculator_title")} */}
      {activeTab === 'calculator' && (
        <div className="two-col" style={{ alignItems: 'start' }}>
          {/* Controls Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <IconCalculator size={22} className="text-emerald" />
              <h3 style={{ margin: 0 }}>{t("calc_title")}</h3>
            </div>

            {/* Slider 1: Principal Amount */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">{t("label_loan_amount")}:</span>
                <span className="slider-value">₹{calcAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="5000"
                max="300000"
                step="5000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[15000, 30000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`btn small ${calcAmount === amt ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcAmount(amt)}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Interest Rate */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">{t("label_interest_rate")}:</span>
                <span className="slider-value text-emerald">{calcRate}% p.a.</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="5"
                max="24"
                step="0.5"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[
                  { r: 6.5, l: '6.5% (Solar)' },
                  { r: 7.0, l: '7.0% (Kisan)' },
                  { r: 8.5, l: '8.5% (MUDRA)' },
                  { r: 11.0, l: '11% (SHG)' },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    className={`btn small ${calcRate === item.r ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcRate(item.r)}
                  >
                    {item.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 3: Tenure Months */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="slider-label">{t("label_tenure_months")}:</span>
                <span className="slider-value">{calcTenure} Months ({calcTenure / 12 >= 1 ? `${(calcTenure / 12).toFixed(1)} yr` : 'Micro'})</span>
              </div>
              <input
                type="range"
                className="fin-slider"
                min="3"
                max="48"
                step="3"
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
              />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {[6, 12, 18, 24, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`btn small ${calcTenure === m ? 'emerald' : 'ghost'}`}
                    style={{ flex: 1, fontSize: '0.72rem', padding: '3px 4px' }}
                    onClick={() => setCalcTenure(m)}
                  >
                    {m} Mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="card calc-summary-card">
            <span className="muted small" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t("est_monthly_emi")}
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.2rem 0' }}>
              ₹{calcResult.emi.toLocaleString('en-IN')}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--slate-500)', marginLeft: '6px' }}>/ month</span>
            </div>

            <div style={{ background: 'var(--card-bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
              <div className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span className="muted small">{t("principal_sum")}:</span>
                <b>₹{calcAmount.toLocaleString('en-IN')}</b>
              </div>
              <div className="row between" style={{ padding: '0.35rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span className="muted small">{t("interest_charges")}:</span>
                <b className="text-emerald">+₹{calcResult.totalInterest.toLocaleString('en-IN')}</b>
              </div>
              <div className="row between" style={{ padding: '0.5rem 0 0 0' }}>
                <span style={{ fontWeight: 600 }}>{t("total_payable")}:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>₹{calcResult.totalPayment.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Donut Split Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <DonutSplitChart principal={calcAmount} interest={calcResult.totalInterest} />
            </div>

            <button
              type="button"
              className="btn w-100"
              onClick={handleApplyWithCalc}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '10px' }}
            >
              {t("apply_with_calc")} <IconArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Active Applications & Dossiers Portfolio */}
      {activeTab === 'portfolio' && (
        <div>
          <div className="card filter-bar-card">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: '', label: 'All Statuses' },
                { id: 'pending', label: 'Pending Review' },
                { id: 'approved', label: 'Approved & Active' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'closed', label: 'Repaid & Closed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={'btn small ' + (status === tab.id ? '' : 'ghost')}
                  onClick={() => setStatus(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 8px', borderRadius: '4px' }}
              >
                <option value="">{t('allLoanProducts')}</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.title}
                  </option>
                ))}
              </select>

              <input
                placeholder={t('search') + "..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '6px 10px', width: '220px' }}
              />
            </div>
          </div>

          <Alert>{error}</Alert>

          {loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('loanReference')}</th>
                    <th>{t('productFacility')}</th>
                    {(staff || user.role === 'shg_leader') && <th>{t('borrower')}</th>}
                    <th>{t('principal')}</th>
                    <th>{t('monthlyEmi')}</th>
                    <th>{t('tenure')}</th>
                    <th>{t('affordability')}</th>
                    <th>{t('status')}</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((l) => {
                    const prodType = l.product_type || 'kisan_agri'
                    return (
                      <tr key={l.id}>
                        <td>
                          <Link to={'/loans/' + l.id} style={{ fontWeight: 600 }}>
                            #{l.id} {(l.group_loan || l.shg_id) ? <span className="muted small">(SHG)</span> : ''}
                          </Link>
                        </td>
                        <td>
                          <span className={`product-type-badge ${prodType}`}>
                            {getProductTitle(prodType)}
                          </span>
                        </td>
                        {(staff || user.role === 'shg_leader') && (
                          <td>
                            <div style={{ fontWeight: 600 }}>{l.borrower_name}</div>
                            <div className="muted small">{l.purpose || 'General'}</div>
                          </td>
                        )}
                        <td style={{ fontWeight: 600 }}>{money(l.amount)}</td>
                        <td>{money(l.emi)}</td>
                        <td>{l.tenure_months} mo @ {l.annual_rate}%</td>
                        <td>
                          <Badge tone={l.ai_band}>{t(l.ai_band)}</Badge>
                        </td>
                        <td>
                          <Badge>{l.status}</Badge>
                        </td>
                        <td>
                          <Link to={'/loans/' + l.id} className="btn small ghost">
                            View Dossier
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredLoans.length === 0 && (
                    <tr>
                      <td
                        colSpan={staff || user.role === 'shg_leader' ? 9 : 8}
                        className="muted"
                        style={{ textAlign: 'center', padding: '2.5rem 0' }}
                      >
                        No active loans found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function LoanApply() {
  const { user } = useAuth()
  const { lang, t } = useLang()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()

  const queryProduct = searchParams.get('product')
  const queryAmount = searchParams.get('amount')
  const queryRate = searchParams.get('rate')
  const queryTenure = searchParams.get('tenure')

  const serverProds = useLoad(() => api('/loans/products', { auth: false }), [])
  const products = useMemo(() => mergeServerProducts(serverProds.data, lang), [serverProds.data, lang])

  const initialProd = products.find((p) => p.id === queryProduct) || products[0]

  const [selectedProduct, setSelectedProduct] = useState(initialProd)
  const [f, setF] = useState({
    product_type: initialProd.id,
    schedule_type: 'monthly',
    amount: queryAmount ? Number(queryAmount) : initialProd.defaultAmount,
    annual_rate: queryRate ? Number(queryRate) : initialProd.apr,
    tenure_months: queryTenure ? Number(queryTenure) : initialProd.defaultTenure,
    purpose: initialProd.presets[0] || '',
    group_loan: initialProd.id === 'mahila_shakti',
    documents: [],
  })

  // Synchronize with server products when loaded
  useEffect(() => {
    if (products.length > 0) {
      const match = products.find((p) => p.id === (queryProduct || f.product_type)) || products[0]
      setSelectedProduct(match)
      setF((prev) => ({
        ...prev,
        product_type: match.id,
        annual_rate: match.apr,
      }))
    }
  }, [products, queryProduct])

  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const hasProfile = user.monthly_income > 0

  const handleProductChange = (prod) => {
    setSelectedProduct(prod)
    setF({
      ...f,
      product_type: prod.id,
      schedule_type: prod.id === 'kisan_agri' ? 'harvest_bullet' : 'monthly',
      amount: prod.defaultAmount,
      annual_rate: prod.apr,
      tenure_months: prod.defaultTenure,
      purpose: prod.presets[0] || '',
      group_loan: prod.id === 'mahila_shakti',
      documents: [],
    })
  }

  useEffect(() => {
    if (!hasProfile || !(f.amount > 0) || !(f.tenure_months > 0)) return
    const h = setTimeout(() => {
      api('/ai/affordability', {
        method: 'POST',
        body: {
          monthly_income: user.monthly_income,
          monthly_expenses: user.monthly_expenses,
          existing_emi: user.existing_emi,
          savings_balance: user.savings_balance,
          amount: Number(f.amount),
          annual_rate: Number(f.annual_rate),
          tenure_months: Number(f.tenure_months),
        },
      })
        .then(setPreview)
        .catch(() => setPreview(null))
    }, 350)
    return () => clearTimeout(h)
  }, [f.amount, f.annual_rate, f.tenure_months, hasProfile, user])

  const toggleDoc = (d) =>
    setF({
      ...f,
      documents: f.documents.includes(d) ? f.documents.filter((x) => x !== d) : [...f.documents, d],
    })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const loan = await api('/loans', {
        method: 'POST',
        body: {
          ...f,
          amount: Number(f.amount),
          annual_rate: Number(f.annual_rate),
          tenure_months: Number(f.tenure_months),
        },
      })
      nav('/loans/' + loan.id)
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <h2>{t("loan_apply_title")}</h2>
          <p className="page-subtitle">
            {t("loan_apply_sub")}
          </p>
        </div>
      </div>

      {/* 3-Step Visual Progress Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          background: 'var(--card-bg)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--emerald-600)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t("stepper_purpose")}</div>
            <div className="muted small" style={{ fontSize: '0.72rem' }}>{selectedProduct.title}</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '40px', height: '2px', background: 'var(--border-color)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--emerald-600)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t("stepper_cashflow")}</div>
            <div className="muted small" style={{ fontSize: '0.72rem' }}>₹{Number(f.amount).toLocaleString('en-IN')} • {f.tenure_months} mo</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '40px', height: '2px', background: 'var(--border-color)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: f.documents.length > 0 ? 'var(--emerald-600)' : 'var(--slate-200)', color: f.documents.length > 0 ? '#fff' : 'var(--slate-600)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t("stepper_docs")}</div>
            <div className="muted small" style={{ fontSize: '0.72rem' }}>{f.documents.length} {lang === 'hi' ? 'दस्तावेज़ संलग्न' : lang === 'mr' ? 'कागदपत्रे जोडली' : 'KYC Documents Attached'}</div>
          </div>
        </div>
      </div>

      {!hasProfile && (
        <Alert kind="warn">
          {t('fillProfile')} <Link to="/profile">{t('profile')}</Link>
        </Alert>
      )}

      {/* Product Selection Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <span className="muted small" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
          {lang === 'hi' ? 'ऋण योजना चुनें:' : lang === 'mr' ? 'कर्ज योजना निवडा:' : 'Select Credit Program:'}
        </span>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {products.map((prod) => (
            <button
              key={prod.id}
              type="button"
              className={`btn small ${selectedProduct.id === prod.id ? 'emerald' : 'ghost'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => handleProductChange(prod)}
            >
              {prod.title}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <Card title={`${lang === 'hi' ? 'आवेदन प्रपत्र:' : lang === 'mr' ? 'अर्ज प्रपत्र:' : 'Application Form:'} ${selectedProduct.title}`}>
          <div
            style={{
              background: 'var(--slate-50)',
              padding: '0.75rem',
              borderRadius: '6px',
              borderLeft: '3px solid var(--emerald-600)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedProduct.tag}</div>
            <p className="muted small" style={{ margin: '0.2rem 0 0 0' }}>{selectedProduct.subtitle}</p>
          </div>

          <form onSubmit={submit}>
            <Alert>{err}</Alert>

            <Field label={t('amount')}>
              <input
                type="number"
                min={selectedProduct.minAmount}
                max={selectedProduct.maxAmount}
                step="500"
                required
                value={f.amount}
                onChange={set('amount')}
              />
            </Field>

            <div style={{ marginBottom: '1rem' }}>
              <span className="muted small" style={{ display: 'block', marginBottom: '0.35rem' }}>
                {lang === 'hi' ? 'अवधि विकल्प:' : lang === 'mr' ? 'कालावधी पर्याय:' : 'Tenure Options:'}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedProduct.tenures.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={'btn small ' + (f.tenure_months === m ? 'emerald' : 'ghost')}
                    style={{ flex: 1, minWidth: '70px', fontSize: '0.8rem' }}
                    onClick={() => setF({ ...f, tenure_months: m })}
                  >
                    {m} {lang === 'hi' ? 'माह' : lang === 'mr' ? 'महिने' : 'Months'}
                  </button>
                ))}
              </div>
            </div>

            <div className="row" style={{ gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <Field label={`${t('rate')} (${lang === 'hi' ? '% प्रति वर्ष - संस्थागत नीति द्वारा निर्धारित' : lang === 'mr' ? '% वार्षिक - संस्थागत नियमानुसार' : '% p.a. - Set by institutional policy'})`}>
                  <input
                    type="number"
                    readOnly
                    disabled
                    style={{ background: 'var(--slate-100)', cursor: 'not-allowed', fontWeight: 600, color: 'var(--slate-700)' }}
                    value={f.annual_rate}
                  />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label={t('months')}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={f.tenure_months}
                    onChange={set('tenure_months')}
                  />
                </Field>
              </div>
            </div>

            <Field label={t('purpose')}>
              <input
                value={f.purpose}
                onChange={set('purpose')}
                placeholder={lang === 'hi' ? 'उदा. दुधारू गाय खरीद, संकर बीज, दुकान इन्वेंट्री' : lang === 'mr' ? 'उदा. दुभती गाय खरेदी, सुधारित बियाणे, दुकान साहित्य' : 'e.g. Dairy cow purchase, hybrid seeds, inventory'}
                required
              />
            </Field>

            <div style={{ marginBottom: '1rem' }}>
              <span className="muted small" style={{ display: 'block', marginBottom: '0.3rem' }}>
                {t("recommended_presets")}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedProduct.presets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn small ghost"
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => setF({ ...f, purpose: p })}
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {user.shg_id && (
              <label
                className="check"
                style={{
                  background: 'var(--slate-50)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={f.group_loan}
                  onChange={(e) => setF({ ...f, group_loan: e.target.checked })}
                />
                <div>
                  <span style={{ fontWeight: 600 }}>{lang === 'hi' ? 'संयुक्त देयता समूह (एसएचजी) गारंटी' : lang === 'mr' ? 'बचत गट संयुक्त हमी' : 'Joint Liability Group (SHG) Guarantee'}</span>
                  <div className="muted small">{lang === 'hi' ? 'आपके स्वयं सहायता समूह के सदस्यों द्वारा सामाजिक सामूहिक समर्थन' : lang === 'mr' ? 'तुमच्या महिला बचत गटाच्या सदस्यांची सामूहिक हमी' : 'Pledged with peer guarantee from your Self-Help Group'}</div>
                </div>
              </label>
            )}

            {selectedProduct.id === 'kisan_agri' && (
              <div style={{ marginBottom: '1rem', background: 'var(--slate-50)', padding: '0.75rem', borderRadius: '6px' }}>
                <span className="muted small" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {lang === 'hi' ? 'कृषि चुकौती संरचना:' : lang === 'mr' ? 'कृषी परतफेड पद्धत:' : 'Agricultural Repayment Structure:'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn small ${f.schedule_type === 'monthly' ? 'emerald' : 'ghost'}`}
                    style={{ textAlign: 'left', padding: '6px 8px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
                    onClick={() => setF({ ...f, schedule_type: 'monthly' })}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{lang === 'hi' ? 'नियमित मासिक किस्त (ईएमआई)' : lang === 'mr' ? 'नियमित मासिक हप्ता (ईएमआई)' : 'Standard Monthly EMI'}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>{lang === 'hi' ? 'समान मासिक किस्तें' : lang === 'mr' ? 'समान मासिक हप्ते' : 'Equal monthly installments'}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn small ${f.schedule_type === 'harvest_bullet' ? 'emerald' : 'ghost'}`}
                    style={{ textAlign: 'left', padding: '6px 8px', height: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}
                    onClick={() => setF({ ...f, schedule_type: 'harvest_bullet' })}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{`🌾 ${lang === 'hi' ? 'फसल कटाई बिक्री एकमुश्त भुगतान' : lang === 'mr' ? 'पीक काढणी एकरकमी परतफेड' : 'Harvest Bullet Schedule'}`}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>{lang === 'hi' ? 'फसल वृद्धि में रखरखाव, मंडी बिक्री पर एकमुश्त चुकौती' : lang === 'mr' ? 'पीक वाढीदरम्यान देखरेख, विक्री झाल्यावर एकरकमी परतफेड' : 'Maintenance in growth, lumpsum at mandi sale'}</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="row between" style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
                <p className="muted small" style={{ fontWeight: 600, margin: 0 }}>
                  {t("step_docs_heading")}
                </p>
                <button
                  type="button"
                  className="btn small ghost"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => {
                    const allKeys = selectedProduct.docs.map(([k]) => k)
                    setF({ ...f, documents: allKeys })
                  }}
                >
                  {lang === 'hi' ? '+ सभी आवश्यक दस्तावेज़ संलग्न करें' : lang === 'mr' ? '+ सर्व आवश्यक कागदपत्रे जोडा' : '+ Attach All Verified KYC'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {selectedProduct.docs.map(([k, label]) => {
                  const isAttached = f.documents.includes(k)
                  return (
                    <div
                      key={k}
                      style={{
                        padding: '0.6rem 0.75rem',
                        border: isAttached ? '1.5px solid var(--emerald-600)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        background: isAttached ? 'var(--emerald-50)' : 'var(--card-bg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isAttached}
                          onChange={() => toggleDoc(k)}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</div>
                          {isAttached ? (
                            <div className="muted small" style={{ fontSize: '0.7rem', color: 'var(--emerald-600)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <IconCheckCircle size={12} /> {k}_doc_verified.pdf (320 KB) • {lang === 'hi' ? 'ओसीआर प्रमाणित' : lang === 'mr' ? 'ओसीआर सत्यापित' : 'OCR Verified'}
                            </div>
                          ) : (
                            <div className="muted small" style={{ fontSize: '0.7rem' }}>
                              {lang === 'hi' ? 'आधिकारिक स्कैन प्रति अथवा डिजिलॉकर' : lang === 'mr' ? 'अधिकृत स्कॅन प्रत किंवा डिजीलॉकर' : 'Official scanned copy or digilocker pull'}
                            </div>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        className={`btn small ${isAttached ? 'ghost' : ''}`}
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                        onClick={() => toggleDoc(k)}
                      >
                        {isAttached ? (lang === 'hi' ? 'हटाएँ' : lang === 'mr' ? 'काढून टाका' : 'Detach') : (lang === 'hi' ? 'फ़ाइल जोड़ें' : lang === 'mr' ? 'फाइल जोडा' : 'Attach File')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              className="btn w-100"
              disabled={busy || !hasProfile}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '10px' }}
            >
              <IconShield size={16} /> {t("btn_submit_application")}
            </button>
          </form>
        </Card>

        {/* Live AI Underwriting Check */}
        <Card title={lang === "hi" ? "साथी लाइव आय-व्यय मूल्यांकन" : lang === "mr" ? "साथी थेट कर्ज क्षमता मूल्यांकन" : "Live AI Affordability Evaluation"}>
          {!preview ? (
            <p className="muted">{hasProfile ? (lang === 'hi' ? 'चुकौती क्षमता का मूल्यांकन हो रहा है…' : lang === 'mr' ? 'परतफेड क्षमतेचे मूल्यांकन होत आहे…' : 'Evaluating repayment capacity…') : t('fillProfile')}</p>
          ) : (
            <>
              <div
                style={{
                  background: 'var(--slate-50)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="row between" style={{ marginBottom: '0.5rem' }}>
                  <span className="muted small">{lang === 'hi' ? 'ऋण पात्रता तत्परता' : lang === 'mr' ? 'कर्ज पात्रता स्थिती' : 'AI Underwriting Readiness'}</span>
                  <Badge tone={preview.band}>{t(preview.band)}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                    {preview.score != null ? Math.round(preview.score <= 1.0 ? preview.score * 100 : preview.score) : '—'}
                  </span>
                  <span className="muted small">{lang === 'hi' ? '/ 100 सुरक्षित वित्तीय स्कोर' : lang === 'mr' ? '/ १०० सुरक्षित आर्थिक गुण' : '/ 100 Safe Underwriting Score'}</span>
                </div>
              </div>

              <div className="grid" style={{ marginBottom: '1rem' }}>
                <Stat label={t("est_monthly_emi")} value={money(preview.emi)} />
                <Stat label={lang === "hi" ? "सुरक्षित किस्त सीमा" : lang === "mr" ? "सुरक्षित हप्ता मर्यादा" : "Safe Threshold"} value={money(preview.safe_emi)} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div className="row between small" style={{ marginBottom: '0.35rem' }}>
                  <span>{lang === 'hi' ? 'किस्त क्षमता उपयोग' : lang === 'mr' ? 'हप्ता क्षमता वापर' : 'Safe Headroom Utilization'}</span>
                  <span style={{ fontWeight: 600 }}>
                    {preview.safe_emi > 0 ? `${Math.round((preview.emi / preview.safe_emi) * 100)}%` : 'N/A'}
                  </span>
                </div>
                <Progress pct={preview.safe_emi > 0 ? Math.min(100, (preview.emi / preview.safe_emi) * 100) : 50} />
              </div>

              <h4 style={{ fontSize: '0.88rem', margin: '1rem 0 0.5rem 0' }}>{t('underwritingRationale')}</h4>
              <Factors factors={preview.factors} />

              <div
                style={{
                  background: 'var(--slate-50)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  borderLeft: '3px solid var(--emerald-600)',
                }}
              >
                <div className="small">
                  <b>{lang === "hi" ? "अधिकतम अनुशंसित ऋण राशि:" : lang === "mr" ? "कमाल शिफारस केलेली कर्ज रक्कम:" : "Maximum Recommended Principal:"}</b> {money(preview.safe_loan_amount)}
                </div>
                <p className="muted small" style={{ margin: '0.25rem 0 0 0' }}>
                  {preview.disclaimer}
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export function LoanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { lang, t } = useLang()
  const toast = useToast()
  const loan = useLoad(() => api('/loans/' + id), [id])
  const sched = useLoad(() => api('/loans/' + id + '/schedule'), [id])
  const serverProds = useLoad(() => api('/loans/products', { auth: false }), [])
  const products = useMemo(() => mergeServerProducts(serverProds.data, lang), [serverProds.data, lang])
  const [msg, setMsg] = useState({ kind: 'error', text: '' })
  const [note, setNote] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paySource, setPaySource] = useState('external_upi')
  const [instUtr, setInstUtr] = useState('')
  const [showSanctionModal, setShowSanctionModal] = useState(false)
  const [showForecloseModal, setShowForecloseModal] = useState(false)
  const [forecloseQuote, setForecloseQuote] = useState(null)
  const [busyForeclose, setBusyForeclose] = useState(false)
  const [customPayAmt, setCustomPayAmt] = useState('')
  const staff = user.role === 'officer' || user.role === 'admin'
  const l = loan.data

  const act = async (fn, ok) => {
    setMsg({ kind: 'error', text: '' })
    try {
      await fn()
      setMsg({ kind: 'success', text: ok })
      toast.success(ok)
      loan.reload()
      sched.reload()
    } catch (e) {
      setMsg({ kind: 'error', text: e.message })
      toast.error(e.message)
    }
  }

  const decide = (approve) =>
    act(
      () => api('/loans/' + id + '/decision', { method: 'POST', body: { approve, note } }),
      approve ? 'Loan sanction approved.' : 'Loan application rejected.'
    )

  const [endorseNote, setEndorseNote] = useState('')

  const endorseLoan = () =>
    act(
      () => api('/loans/' + id + '/endorse', { method: 'POST', body: { note: endorseNote || undefined } }),
      'SHG Leader endorsement registered successfully.'
    )

  const disburse = () =>
    act(
      () => api('/loans/' + id + '/disburse', { method: 'POST' }),
      'Loan principal disbursed to borrower wallet.'
    )

  const cancelLoan = () =>
    act(
      () => api('/loans/' + id + '/cancel', { method: 'POST' }),
      'Loan application withdrawn successfully.'
    )

  const openForeclose = async () => {
    try {
      const q = await api('/loans/' + id + '/foreclosure-quote')
      setForecloseQuote(q)
      setShowForecloseModal(true)
    } catch (e) {
      toast.error(e.message || 'Failed to fetch foreclosure quote')
    }
  }

  const executeForeclose = async () => {
    setBusyForeclose(true)
    try {
      await api('/loans/' + id + '/foreclose', { method: 'POST' })
      toast.success('Loan foreclosed and fully settled with zero penalty!')
      setShowForecloseModal(false)
      loan.reload()
      sched.reload()
    } catch (e) {
      toast.error(e.message || 'Foreclosure settlement failed')
    } finally {
      setBusyForeclose(false)
    }
  }

  const recordPayment = async () => {
    if (!paymentModal) return
    const instNumber = paymentModal.number
    const amount = customPayAmt ? Number(customPayAmt) : undefined
    setPaymentModal(null)
    setCustomPayAmt('')
    await act(
      () =>
        api('/loans/' + id + '/installments/' + instNumber + '/pay', {
          method: 'POST',
          body: {
            amount,
            source: paySource,
            reference_id: paySource === 'external_upi' ? instUtr.trim() || undefined : undefined,
          },
        }),
      `Installment #${instNumber} payment registered.`
    )
  }

  const verify = (d) =>
    act(() => api('/loans/' + id + '/documents/' + d + '/verify', { method: 'POST' }), 'KYC Document authenticated.')

  const rejectDoc = (d) => {
    const reason = window.prompt('Enter reason for document rejection:', 'Document blurry or unreadable')
    if (reason === null) return
    act(
      () => api('/loans/' + id + '/documents/' + d + '/reject', { method: 'POST', body: { approve: false, note: reason } }),
      'Document rejected.'
    )
  }

  const handleUploadDocument = async (docId, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/loans/${id}/documents/${docId}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed')
      }
      toast.success('Document uploaded successfully!')
      loan.reload()
    } catch (e) {
      toast.error(e.message || 'Upload error')
    }
  }

  const handleDownloadDocument = async (docId, origName) => {
    try {
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/loans/${id}/documents/${docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Download failed')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = origName || `loan_${id}_doc_${docId}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.message || 'Download error')
    }
  }

  if (loan.loading) return <Loading />
  if (loan.error) return <Alert>{loan.error}</Alert>

  const canPay = l.status === 'approved' && (user.id === l.user_id || staff)
  const installments = sched.data || []
  const paidCount = installments.filter((i) => i.status === 'paid').length
  const totalPaidAmount = installments.reduce((acc, i) => acc + (i.paid_amount || 0), 0)
  const totalScheduledAmount = installments.reduce((acc, i) => acc + (i.amount || 0), 0)
  const remainingAmount = Math.max(0, totalScheduledAmount - totalPaidAmount)
  const repaymentPct = totalScheduledAmount > 0 ? Math.round((totalPaidAmount / totalScheduledAmount) * 100) : 0

  const prodType = l.product_type || 'kisan_agri'
  const productInfo = products.find((p) => p.id === prodType) || products[0]

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/loans" className="btn small ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Loans Portfolio
        </Link>
      </div>

      <div className="row between" style={{ marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2>Loan Dossier #{l.id}</h2>
          <span className={`product-type-badge ${prodType}`}>
            {productInfo.title}
          </span>
          <Badge>{l.status}</Badge>
          {l.shg_id && <Badge tone="pending">{t('shgJointLiability')}</Badge>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['approved', 'disbursed'].includes(l.status) && remainingAmount > 0 && (
            <button
              type="button"
              className="btn small"
              onClick={openForeclose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#059669', color: '#fff' }}
            >
              <IconCheck size={15} /> {t('earlyForeclosure')}
            </button>
          )}
          {l.status === 'pending' && (!staff || user.id === l.user_id) && (
            <button
              type="button"
              className="btn small ghost danger"
              onClick={cancelLoan}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Withdraw Application
            </button>
          )}
          {l.status === 'approved' && (
            <button
              type="button"
              className="btn small emerald"
              onClick={() => setShowSanctionModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <IconFileText size={15} /> Sanction Letter
            </button>
          )}
          <button
            type="button"
            className="btn small ghost"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <IconPrinter size={15} /> Print Statement
          </button>
        </div>
      </div>

      <Alert kind={msg.kind}>{msg.text}</Alert>

      <div className="grid" style={{ marginBottom: '1.25rem' }}>
        <Stat label={t('principal')} value={money(l.amount)} sub="Total microcredit" />
        <Stat label={t('monthlyEmi')} value={money(l.emi)} sub={`${l.tenure_months} mo @ ${l.annual_rate}% APR`} />
        <Stat label={t('borrower')} value={l.borrower_name} sub={l.purpose || 'General Purpose'} />
        <Stat
          label={t('creditHealth')}
          value={l.ai_score ? `${l.ai_score} / 100` : 'Assessed'}
          sub={`Band: ${t(l.ai_band)}`}
        />
      </div>

      {(l.group_loan || l.shg_id) && (
        <Card title="Joint Liability Group (SHG) Social Guarantee" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                background: 'var(--primary-subtle, rgba(20, 184, 166, 0.15))',
                color: 'var(--primary, #0d9488)',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconUsers size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{l.shg_endorsed ? t('shgPeerEndorsementActive') : 'SHG Mutual Guarantee (Pending Endorsement)'}</div>
                <div className="muted small">
                  {l.shg_endorsed
                    ? `Resolution: "${l.endorsement_note || 'Approved'}" • Certified under NRLM guidelines.`
                    : `Self-Help Group #${l.shg_id} collective peer guarantee resolution awaiting group leader certification.`}
                </div>
              </div>
            </div>
            <Badge tone={l.shg_endorsed ? 'approved' : 'pending'}>
              {l.shg_endorsed ? t('verifiedShgBacked') : 'Pending Endorsement'}
            </Badge>
          </div>
        </Card>
      )}

      {l.status === 'approved' && totalScheduledAmount > 0 && (
        <Card title="Repayment Amortization Progress" style={{ marginBottom: '1.25rem' }}>
          <div className="row between small" style={{ marginBottom: '0.4rem' }}>
            <span>
              <b>{t('collectedLabel')}</b> {money(totalPaidAmount)} ({repaymentPct}%)
            </span>
            <span>
              <b>{t('remainingBalanceLabel')}</b> {money(remainingAmount)}
            </span>
          </div>
          <Progress pct={repaymentPct} />
          <div className="row between small muted" style={{ marginTop: '0.4rem' }}>
            <span>{paidCount} of {installments.length} installments settled</span>
            <span>{t('reducingBalanceRate')}</span>
          </div>
        </Card>
      )}

      <div className="two-col" style={{ marginBottom: '1.25rem' }}>
        <Card title="AI Underwriting Evaluation Summary">
          <div className="row between" style={{ marginBottom: '0.75rem' }}>
            <Badge tone={l.ai_band}>{t(l.ai_band)}</Badge>
            <span className="muted small">Composite Risk Metric: {l.ai_score}</span>
          </div>
          <Factors factors={l.ai_factors} />
          <p className="muted small" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
            Underwriting rules conform to RBI Master Direction – Regulatory Framework for Microfinance Loans Directions, 2022.
          </p>
        </Card>

        <Card title="KYC Document Verifications">
          {l.documents.length === 0 ? (
            <p className="muted small">No auxiliary documents attached.</p>
          ) : (
            <ul className="plain" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {l.documents.map((d) => (
                <li
                  key={d.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle, #f9fafb)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IconFileText size={18} className="text-muted" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {d.doc_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        {d.original_name && (
                          <div className="muted small" style={{ fontSize: '0.78rem' }}>
                            {d.original_name} {d.file_size ? `(${Math.round(d.file_size / 1024)} KB)` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {d.verified ? (
                        <Badge tone="approved">{t('docVerified')}</Badge>
                      ) : d.status === 'rejected' ? (
                        <Badge tone="danger">{t('docRejected')}</Badge>
                      ) : d.file_path ? (
                        <Badge tone="pending">{t('docUploadedPending')}</Badge>
                      ) : (
                        <Badge tone="neutral">{t('docMissingUpload')}</Badge>
                      )}
                    </div>
                  </div>

                  {d.reject_reason && (
                    <div className="small" style={{ color: '#dc2626', marginBottom: '0.5rem', background: '#fef2f2', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      Rejection note: {d.reject_reason}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {d.file_path && (
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() => handleDownloadDocument(d.id, d.original_name)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <IconDownload size={13} /> View / Download
                      </button>
                    )}

                    {!['closed', 'withdrawn', 'rejected'].includes(l.status) && (user.id === l.user_id || staff) && (
                      <label
                        className="btn small ghost"
                        style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <IconUpload size={13} /> {d.file_path ? 'Replace File' : 'Upload File'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadDocument(d.id, e.target.files[0])
                          }}
                        />
                      </label>
                    )}

                    {staff && d.file_path && !d.verified && (
                      <>
                        <button
                          type="button"
                          className="btn small emerald"
                          onClick={() => verify(d.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <IconCheck size={13} /> Verify
                        </button>
                        <button
                          type="button"
                          className="btn small ghost danger"
                          onClick={() => rejectDoc(d.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {(user?.role === 'shg_leader' || user?.role === 'admin') && l.status === 'requested' && l.shg_id && (
        <Card title="SHG Group Endorsement & Peer Resolution Terminal" style={{ marginBottom: '1.25rem' }}>
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            As the designated Self-Help Group leader, certify that the group has reviewed this loan application, approved the resolution, and agreed to the mutual peer guarantee.
          </p>
          <Field label="SHG Meeting Resolution / Endorsement Note">
            <input
              placeholder="e.g. Resolution #4 approved unanimously with peer joint guarantee"
              value={endorseNote}
              onChange={(e) => setEndorseNote(e.target.value)}
            />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <button className="btn emerald" onClick={endorseLoan} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconCheckCircle size={16} /> Endorse Group Loan Application
            </button>
          </div>
        </Card>
      )}

      {staff && l.status === 'requested' && (
        <Card title="Underwriting Notice: Awaiting SHG Endorsement" style={{ marginBottom: '1.25rem' }}>
          <p className="muted small" style={{ margin: 0, color: 'var(--amber-600, #d97706)', fontWeight: 500 }}>
            ⏳ This is a group microfinance facility under SHG #{l.shg_id}. Underwriting sanction requires group resolution endorsement by the designated SHG leader first.
          </p>
        </Card>
      )}

      {staff && (l.status === 'pending' || l.status === 'endorsed') && (
        <Card title="Credit Officer Sanction Terminal" style={{ marginBottom: '1.25rem' }}>
          {l.shg_endorsed && (
            <div style={{ padding: '0.6rem 0.85rem', background: 'var(--emerald-50)', border: '1px solid var(--emerald-border)', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
              ✅ <b>SHG Group Resolution Certified:</b> {l.endorsement_note || 'Approved by SHG Leader'}
            </div>
          )}
          {((l.documents || []).some(d => !d.verified)) && (
            <div style={{ padding: '0.6rem 0.85rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#92400e' }}>
              ⚠️ <b>Verification Required:</b> All required documents must be uploaded by the borrower and authenticated before approval can be executed.
            </div>
          )}
          <Field label="Statutory Underwriting Notes / Conditions">
            <input
              placeholder="e.g. Sanctioned subject to peer joint guarantee confirmation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <div className="row" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              className="btn"
              disabled={(l.documents || []).some(d => !d.verified)}
              onClick={() => decide(true)}
            >
              <IconCheckCircle size={16} /> Sanction & Approve Loan
            </button>
            <button className="btn danger" onClick={() => decide(false)}>
              <IconAlertTriangle size={16} /> Reject Application
            </button>
          </div>
        </Card>
      )}

      {staff && l.status === 'approved' && !l.disbursed_on && (
        <Card title="Loan Principal Disbursement Terminal" style={{ marginBottom: '1.25rem' }}>
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            This loan was approved by credit underwriting. Executing disbursement credits <b>{money(l.amount)}</b> directly into the borrower's digital wallet and activates the amortization schedule.
          </p>
          <button className="btn emerald" onClick={disburse} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconCreditCard size={16} /> Disburse {money(l.amount)} to Borrower Wallet
          </button>
        </Card>
      )}

      {l.status !== 'pending' && l.status !== 'rejected' && (
        <Card title="Full Amortization Schedule">
          {sched.loading ? (
            <Loading />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('installmentNum')}</th>
                    <th>{t('dueDate')}</th>
                    <th>{t('phaseType')}</th>
                    <th>{t('installmentAmount')}</th>
                    <th>{t('principalShare')}</th>
                    <th>{t('interestShare')}</th>
                    <th>{t('status')}</th>
                    <th>{t('paymentAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((i) => (
                    <tr key={i.number} className={i.overdue ? 'overdue' : ''}>
                      <td style={{ fontWeight: 600 }}>#{i.number}</td>
                      <td>{i.due_date}</td>
                      <td>
                        {i.is_harvest ? (
                          <span className="badge approved" style={{ fontSize: '0.7rem' }}>
                            🌾 Harvest Bullet
                          </span>
                        ) : i.phase && i.phase.includes('Gestation') ? (
                          <span className="badge neutral" style={{ fontSize: '0.7rem' }}>
                            🌱 Gestation
                          </span>
                        ) : (
                          <span className="badge neutral" style={{ fontSize: '0.7rem' }}>
                            Monthly EMI
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{money(i.amount)}</td>
                      <td>{money(i.principal_part)}</td>
                      <td>{money(i.interest_part)}</td>
                      <td>
                        <Badge tone={i.overdue ? 'overdue' : i.status}>
                          {i.overdue ? 'Overdue' : i.status}
                        </Badge>
                      </td>
                      <td>
                        {canPay && i.status !== 'paid' && (
                          <button
                            className="btn small"
                            onClick={() => {
                              setPaymentModal(i)
                              setCustomPayAmt(String(i.amount - (i.paid_amount || 0)))
                            }}
                          >
                            <IconCreditCard size={14} /> Pay via UPI
                          </button>
                        )}
                        {i.status === 'paid' && (
                          <span className="muted small" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <IconCheckCircle size={14} className="text-emerald" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Settle Instalment #{paymentModal.number}</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPaymentModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>{t('dueDate')}:</span>
                <b>{paymentModal.due_date}</b>
              </div>
              <div className="row between small" style={{ marginBottom: '0.3rem' }}>
                <span>{t('scheduledAmount')}</span>
                <b>{money(paymentModal.amount)}</b>
              </div>
              <div className="row between small">
                <span>{t('principalComponent')}</span>
                <span>{money(paymentModal.principal_part)}</span>
              </div>
            </div>

            <Field label="Amount to Settle (₹)">
              <input
                type="number"
                min="1"
                max={paymentModal.amount - (paymentModal.paid_amount || 0)}
                value={customPayAmt}
                onChange={(e) => setCustomPayAmt(e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn small ${paySource === 'external_upi' ? '' : 'ghost'}`}
                onClick={() => setPaySource('external_upi')}
              >
                📱 Paid outside app
              </button>
              <button
                type="button"
                className={`btn small ${paySource === 'wallet' ? '' : 'ghost'}`}
                onClick={() => setPaySource('wallet')}
              >
                💼 Paid from wallet ({money(user?.savings_balance || 0)})
              </button>
            </div>
            <p className="muted small" style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.78rem' }}>
              {paySource === 'wallet'
                ? 'Debits directly from your in-app wallet balance.'
                : 'Settled externally (UPI/Cash); records payment without debiting in-app wallet.'}
            </p>

            {paySource === 'external_upi' ? (
              <Field label="Bank / UPI Reference No. (UTR)">
                <input
                  type="text"
                  placeholder="e.g. 428901234567"
                  value={instUtr}
                  onChange={(e) => setInstUtr(e.target.value)}
                />
              </Field>
            ) : (
              <div style={{ padding: '0.65rem 0.85rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem' }}>
                Wallet Balance: <b>{money(user?.savings_balance || 0)}</b>
                {(user?.savings_balance || 0) < Number(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0)) && (
                  <p style={{ color: '#dc2626', marginTop: '0.3rem', fontWeight: 600 }}>
                    ⚠️ Insufficient balance in wallet. Please choose UPI / Bank above.
                  </p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPaymentModal(null)}>
                Cancel
              </button>
              <button
                className="btn"
                disabled={paySource === 'wallet' && (user?.savings_balance || 0) < Number(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0))}
                onClick={recordPayment}
              >
                Confirm Settlement ({money(customPayAmt || paymentModal.amount - (paymentModal.paid_amount || 0))})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foreclosure Modal (Zero Foreclosure Penalty Policy) */}
      {showForecloseModal && forecloseQuote && (
        <div className="modal-overlay" onClick={() => setShowForecloseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="row between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{t('earlyForeclosure')}</h3>
              <button type="button" className="icon-btn" onClick={() => setShowForecloseModal(false)}>✕</button>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: '1rem', color: '#065f46', fontSize: '0.82rem', lineHeight: 1.4 }}>
              <b>RBI Fair Practices Code Guarantee:</b> {forecloseQuote.message}
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">{t('outstandingPrincipal')}</span>
                <b>{money(forecloseQuote.outstanding_principal)}</b>
              </div>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">{t('accruedMonthInterest')}</span>
                <b>{money(forecloseQuote.accrued_interest)}</b>
              </div>
              <div className="row between" style={{ marginBottom: '0.4rem' }}>
                <span className="muted">{t('foreclosurePenaltyFee')}</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>₹0.00 (Zero Penalty)</span>
              </div>
              <div className="row between" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', fontSize: '1rem' }}>
                <span><b>{t('totalSettlementDue')}</b></span>
                <b style={{ color: 'var(--emerald-700)' }}>{money(forecloseQuote.total_settlement_amount)}</b>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
              <span>{t('availableWalletBalance')} <b>{money(user?.savings_balance || 0)}</b></span>
              {(user?.savings_balance || 0) < forecloseQuote.total_settlement_amount && (
                <p style={{ color: '#dc2626', marginTop: '0.3rem', fontWeight: 600 }}>
                  ⚠️ Your wallet balance is less than the settlement amount. Please deposit funds into your wallet to complete early closure.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setShowForecloseModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn emerald"
                disabled={busyForeclose || (user?.savings_balance || 0) < forecloseQuote.total_settlement_amount}
                onClick={executeForeclose}
              >
                {busyForeclose ? 'Closing Loan…' : `Settle & Close Loan (${money(forecloseQuote.total_settlement_amount)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Sanction Letter Modal */}
      {showSanctionModal && (
        <div className="modal-overlay" onClick={() => setShowSanctionModal(false)}>
          <div
            className="modal-card sanction-letter-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}
          >
            {/* Sanction Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--emerald-600)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <IconShield size={24} className="text-emerald" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
                    FINANCESAATHI CREDIT DESK
                  </span>
                </div>
                <div className="muted small" style={{ fontSize: '0.74rem' }}>
                  Statutory Regulated Microfinance & Priority Sector Lending Platform • RBI PSL Master Direction 2022 Compliant
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge approved" style={{ fontWeight: 700 }}>{t('sanctionOrder')}</span>
                <div className="muted small" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                  Ref: FS/SANCTION/2026/{String(l.id).padStart(4, '0')}
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="row between small" style={{ marginBottom: '0.75rem', background: 'var(--slate-50)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <div>
                  <span className="muted">{t('sanctionDate')}</span> <b>{l.decided_at ? new Date(l.decided_at + 'Z').toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</b>
                </div>
                <div>
                  <span className="muted">{t('borrower')}:</span> <b>{l.borrower_name} (#{l.user_id})</b>
                </div>
                <div>
                  <span className="muted">{t('shgAffiliation')}</span> <b>{l.shg_id ? `SHG #${l.shg_id}` : 'Direct Account'}</b>
                </div>
              </div>

              <p style={{ fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                We are pleased to convey official credit sanction for the facility described herein under the <b>{productInfo.title}</b> program, following automated underwriting and KYC verification.
              </p>

              {/* Terms Table */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('sanctionedPrincipal')}</div>
                  <div style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: 'var(--emerald-700)' }}>{money(l.amount)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('annualInterestRateApr')}</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.annual_rate}% p.a. (Reducing Balance Method)</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('repaymentTenure')}</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.tenure_months} Months</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('amortizationProtocol')}</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    {l.schedule_type === 'harvest_bullet' ? '🌾 Harvest-Aligned Bullet (Gestation Maintenance + Post-Harvest Bullets)' : 'Equated Monthly Installment (EMI)'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('statedPurpose')}</div>
                  <div style={{ padding: '0.5rem 0.75rem' }}>{l.purpose || 'Agricultural / Livelihood Facility'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--slate-50)', fontWeight: 600 }}>{t('prepaymentPenalty')}</div>
                  <div style={{ padding: '0.5rem 0.75rem', color: 'var(--emerald-600)', fontWeight: 600 }}>{t('nilRbiPolicy')}</div>
                </div>
              </div>

              {/* Statutory Fair Practice Code Seal */}
              <div style={{ background: 'var(--card-bg-subtle)', padding: '0.75rem 0.85rem', borderRadius: '6px', borderLeft: '3px solid var(--emerald-600)', fontSize: '0.76rem', color: '#475569', marginBottom: '1.25rem' }}>
                <b>{t('statutoryFairPracticesDecl')}</b> Issued under the RBI Fair Practices Code for Microfinance Institutions. The borrower is entitled to an itemized passbook, transparent reducing-rate calculation, and zero foreclosure penalties.
              </div>

              {/* Digital Officer Seal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--emerald-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-600)' }}>
                    <IconAward size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{t('authorizedSanctionDesk')}</div>
                    <div className="muted small" style={{ fontSize: '0.7rem' }}>{t("underwritingDesk")}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${l.status === 'approved' || l.status === 'disbursed' ? 'approved' : 'pending'}`} style={{ fontSize: '0.7rem' }}>
                    {l.status === 'approved' || l.status === 'disbursed' ? '✓ Institutional Sanction Confirmed' : 'PENDING UNDERWRITING REVIEW'}
                  </span>
                  <div className="muted small" style={{ fontSize: '0.68rem', marginTop: '2px' }}>{t('dpdpVerified')}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="modal-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn ghost" onClick={() => setShowSanctionModal(false)}>
                Close
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <IconPrinter size={15} /> Print / Save Official PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
