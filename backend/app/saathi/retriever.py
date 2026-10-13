"""Saathi AI Offline RAG-Lite Knowledge Retriever.

Uses offline TF-IDF vectorization and cosine similarity over a verified corpus of
financial literacy courses, NABARD/RBI microfinance directives, government schemes,
and fraud protection protocols. 100% free, zero external API keys required.
"""
import re
from typing import Any, Dict, List, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


KNOWLEDGE_ITEMS = [
    {
        "id": "shg_basics",
        "category": "shg",
        "keywords": "shg self help group bachat gat swayam sahayata samooh thrift corpus inter lending nrlm",
        "title_en": "Self-Help Groups (SHG) & Joint Liability",
        "title_hi": "स्वयं सहायता समूह (SHG) एवं संयुक्त देयता",
        "title_mr": "स्वयं सहाय्यता गट (बचत गट) व संयुक्त जबाबदारी",
        "content_en": "A Self-Help Group (SHG) consists of 10-20 rural or semi-urban members who save regular thrift contributions (typically Rs 100-500/month). The accumulated corpus provides emergency peer microloans at low reducing interest (typically 12% APR) and qualifies for bank linkage under NRLM.",
        "content_hi": "स्वयं सहायता समूह (SHG) में 10-20 सदस्य होते हैं जो नियमित बचत (सामान्यतः ₹100-500/माह) जमा करते हैं। यह संचित कोष सदस्यों को कम ब्याज (12% वार्षिक) पर आपातकालीन ऋण देता है और NRLM के तहत बैंक लिंकेज प्राप्त करता है।",
        "content_mr": "बचत गटात १०-२० सदस्य असतात जे नियमित मासिक बचत (₹१००-५००) जमा करतात. जमा झालेला निधी सदस्यांना कमी व्याजावर (१२% वार्षिक) तातडीचे अंतर्गत कर्ज देतो व NRLM अंतर्गत बँक पतपुरवठ्यासाठी पात्र ठरतो.",
        "route": "/community",
        "route_label": "Open SHG Portal",
    },
    {
        "id": "sahukar_trap",
        "category": "loans",
        "keywords": "sahukar moneylender illegal interest predatory trap unorganized 3 percent per month debt trap girvi",
        "title_en": "Predatory Moneylender (Sahukar) Trap Warning",
        "title_hi": "साहूकार / सूदखोर चक्रव्यूह से बचाव",
        "title_mr": "सावकारी कर्ज सापळा व सावधगिरी",
        "content_en": "Local moneylenders often charge 'Rs 3 per hundred per month', which is 36% APR (or more with compound interest and upfront cuts). In comparison, SHG or bank microfinance loans are regulated at 7-12% APR reducing balance. Borrowing Rs 50,000 from a moneylender can cost over Rs 18,000 extra in interest alone.",
        "content_hi": "निजी साहूकार '₹3 सैकड़ा प्रति माह' ब्याज लेते हैं जो वास्तव में 36% वार्षिक ब्याज है। इसके विपरीत, SHG या बैंक ऋण 7-12% वार्षिक घटते ब्याज पर उपलब्ध हैं। साहूकार से ₹50,000 लेने पर ₹18,000 से अधिक का अतिरिक्त नुकसान होता है।",
        "content_mr": "खाजगी सावकार '₹३ शेकडा प्रति महिना' व्याज घेतात, जे प्रत्यक्षात ३६% वार्षिक व्याज असते. याउलट, बचत गट किंवा बँकेचे कर्ज ७-१२% कमी होणाऱ्या व्याजावर मिळते. सावकाराकडून ₹५०,००० घेतल्यास केवळ व्याजातच ₹१८,००० पेक्षा जास्त तोटा होतो.",
        "route": "/tools?calc=sahukar",
        "route_label": "Expose Sahukar Trap Calculator",
    },
    {
        "id": "kisan_harvest",
        "category": "agriculture",
        "keywords": "kisan agri crop harvest bullet emi rabi kharif seeds fertilizer mandi apmc farmer agriculture",
        "title_en": "Kisan Harvest Flexi-EMI Facility",
        "title_hi": "किसान हार्वेस्ट फ्लेक्सी-EMI सुविधा",
        "title_mr": "किसान पीक कर्ज व काढणी-हप्ता सुविधा",
        "content_en": "Agricultural income is seasonal, peaking at Kharif and Rabi harvest sales. Regular monthly EMIs strain smallholder farmers during crop gestation. Under Kisan harvest schedules, regular months require only small interest service, while principal lumpsums are settled after mandi sales.",
        "content_hi": "किसानों की आय मौसमी होती है जो रबी और खरीफ फसल बिकने पर ही आती है। फसल उगने के दौरान नियमित मासिक किस्त देना कठिन होता है। किसान हार्वेस्ट प्लान में सामान्य महीनों में केवल मामूली ब्याज देना होता है, और मूलधन मंडी में फसल बिकने पर एकमुश्त चुकाया जाता है।",
        "content_mr": "शेतकऱ्यांचे उत्पन्न खरीप व रब्बी हंगामानंतरच हातात येते. पीक वाढीच्या काळात नियमित मासिक हप्ता भरणे कठीण असते. किसान हार्वेस्ट योजनेमध्ये सामान्य महिन्यांत फक्त नाममात्र व्याज भरावे लागते आणि मुख्य मुद्दल कृषी उत्पन्न बाजार समितीत माल विकल्यावर फेडले जाते.",
        "route": "/tools?calc=kisan",
        "route_label": "Calculate Harvest Plan",
    },
    {
        "id": "cyber_fraud",
        "category": "safety",
        "keywords": "cyber fraud scam upi pin otp 1930 bank sms fake call password qr code hack",
        "title_en": "Cyber & UPI Safety Golden Rules",
        "title_hi": "साइबर एवं डिजिटल UPI सुरक्षा नियम",
        "title_mr": "सायबर व UPI सुरक्षिततेचे सुवर्णनियम",
        "content_en": "1. Never share your 4 or 6 digit UPI PIN or SMS OTP with anyone. Bank managers or police NEVER ask for PINs. 2. You NEVER need to scan a QR code or enter your PIN to receive money. 3. If fraud occurs, dial National Cyber Crime Helpline 1930 within 2 hours or visit cybercrime.gov.in.",
        "content_hi": "1. अपना UPI PIN या SMS OTP कभी किसी से साझा न करें। बैंक या पुलिस कभी PIN नहीं मांगते। 2. पैसे प्राप्त करने के लिए कभी भी QR कोड स्कैन करने या PIN डालने की ज़रूरत नहीं होती। 3. फ्रॉड होने पर तुरंत 1930 हेल्पलाइन पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें।",
        "content_mr": "१. आपला ४ किंवा ६ अंकी UPI PIN किंवा OTP कोणालाही सांगू नका. बँक कर्मचारी कधीही PIN मागत नाहीत. २. पैसे मिळवण्यासाठी कधीही QR कोड स्कॅन करावा लागत नाही. ३. फसवणूक झाल्यास त्वरित राष्ट्रीय सायबर हेल्पलाईन १९३० वर संपर्क साधा किंवा cybercrime.gov.in वर तक्रार करा.",
        "route": "/learn",
        "route_label": "Take Cyber Safety Course",
    },
    {
        "id": "pm_svanidhi",
        "category": "schemes",
        "keywords": "pm svanidhi street vendor hawker working capital 10000 20000 50000 urban livelihood subsidy",
        "title_en": "PM SVANidhi Scheme for Micro-Vendors",
        "title_hi": "प्रधानमंत्री स्वनिधि योजना (स्ट्रीट वेंडर ऋण)",
        "title_mr": "पीएम स्वनिधी योजना (फेरीवाले व छोटे व्यावसायिक)",
        "content_en": "Provides collateral-free working capital microloans to urban/rural street vendors and small merchants. Tranches start at Rs 10,000 (1st loan), progressing to Rs 20,000 (2nd loan) and Rs 50,000 (3rd loan) with 7% interest subsidy on digital cashback transactions.",
        "content_hi": "छोटे विक्रेताओं, रेहड़ी-पटरी वालों को बिना गारंटी का कार्यशील पूंजी ऋण। पहली बार ₹10,000, समय पर चुकाने पर ₹20,000 और फिर ₹50,000 तक का ऋण 7% ब्याज सब्सिडी और डिजिटल कैशबैक के साथ मिलता है।",
        "content_mr": "फेरीवाले व लहान दुकानदारांना विनातारण खेळते भांडवल कर्ज. सुरुवातीस ₹१०,०००, वेळेवर परतफेडीनंतर ₹२०,००० व ₹५०,००० पर्यंत कर्ज मिळते. सोबत ७% व्याज अनुदान व डिजिटल व्यवहारांवर कॅशबॅक मिळतो.",
        "route": "/schemes",
        "route_label": "Explore PM SVANidhi",
    },
    {
        "id": "pm_mudra",
        "category": "schemes",
        "keywords": "pm mudra yojana shishu kishore tarun msme business enterprise collateral free loan",
        "title_en": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "title_hi": "प्रधानमंत्री मुद्रा योजना (PMMY)",
        "title_mr": "प्रधानमंत्री मुद्रा योजना (PMMY)",
        "content_en": "Provides loans for small enterprises in 3 tiers: Shishu (up to Rs 50,000 for seed stage), Kishore (Rs 50,000 to Rs 5 Lakh for equipment/working capital), and Tarun (Rs 5 Lakh to Rs 10 Lakh for growth). No collateral required.",
        "content_hi": "छोटे व्यवसायों के लिए 3 श्रेणियों में ऋण: शिशु (₹50,000 तक नए काम के लिए), किशोर (₹50,000 से ₹5 लाख तक विस्तार के लिए), और तरुण (₹5 लाख से ₹10 लाख तक)। किसी बैंक गारंटी की आवश्यकता नहीं है।",
        "content_mr": "लघु उद्योगांसाठी ३ टप्प्यांत कर्ज: शिशु (₹५०,००० पर्यंत), किशोर (₹५०,००० ते ₹५ लाख), आणि तरुण (₹५ लाख ते ₹१० लाख). कोणत्याही मालमत्तेचे तारण देण्याची गरज नाही.",
        "route": "/schemes",
        "route_label": "Check MUDRA Eligibility",
    },
    {
        "id": "emergency_fund",
        "category": "savings",
        "keywords": "emergency fund buffer savings target reserve medical family crisis hospital cushion",
        "title_en": "Emergency Reserve Fund (3-6 Months Buffer)",
        "title_hi": "आपातकालीन सुरक्षा कोष (3-6 महीने का खर्च)",
        "title_mr": "आपत्कालीन राखीव निधी (३-६ महिन्यांचा खर्च)",
        "content_en": "An institutional emergency fund holds 3 to 6 months of essential household expenses in a liquid savings account or SHG thrift pool. This shields families from turning to high-interest moneylenders during sudden illness, crop failure, or tractor breakdown.",
        "content_hi": "आपातकालीन निधि में कम से कम 3 से 6 महीने के अनिवार्य पारिवारिक खर्च की राशि सुरक्षित बचत खाते या SHG में रखनी चाहिए। इससे अचानक बीमारी या फसल खराबी के समय साहूकार के पास जाने की आवश्यकता नहीं पड़ती।",
        "content_mr": "कौटुंबिक गरजेसाठी किमान ३ ते ६ महिन्यांचा घरखर्च सुरक्षित बचत खात्यात किंवा बचत गटामध्ये राखीव ठेवणे आवश्यक आहे. यामुळे अचानक आजारपण किंवा संकट आल्यास खाजगी सावकाराकडून कर्ज घेण्याची वेळ येत नाही.",
        "route": "/tools?calc=emergency",
        "route_label": "Calculate Emergency Fund",
    },
    {
        "id": "lakhpati_didi",
        "category": "schemes",
        "keywords": "lakhpati didi nrlm women entrepreneur shg sustainable livelihood poultry dairy tailoring",
        "title_en": "Lakhpati Didi Initiative (NRLM)",
        "title_hi": "लखपति दीदी योजना (NRLM)",
        "title_mr": "लखपती दीदी योजना (NRLM)",
        "content_en": "Government initiative aiming to empower 3 crore SHG women members to earn a sustainable annual income of at least Rs 1 Lakh (Rs 8,300+/month) through skill training, micro-enterprises (dairy, poultry, mushroom cultivation, tailoring), and digital market access.",
        "content_hi": "SHG की महिला सदस्यों को कम से कम ₹1 लाख वार्षिक (₹8,300+/माह) की स्थायी आय अर्जित करने हेतु कौशल विकास, सूक्ष्म व्यवसाय (डेयरी, मुर्गी पालन, सिलाई) और वित्तीय सहयोग प्रदान करने वाली योजना।",
        "content_mr": "बचत गटातील महिलांना किमान ₹१ लाख वार्षिक (₹८,३००+/महिना) शाश्वत उत्पन्न मिळवून देण्यासाठी कौशल्य प्रशिक्षण, दुग्धव्यवसाय, कुक्कुटपालन, शेळीपालन व बाजारपेठ जोडणी देणारी योजना.",
        "route": "/schemes",
        "route_label": "View Lakhpati Didi Details",
    },
]


def _build_tfidf_index():
    corpus = []
    for item in KNOWLEDGE_ITEMS:
        text = f"{item['keywords']} {item['title_en']} {item['content_en']} {item['title_hi']} {item['content_hi']} {item['title_mr']} {item['content_mr']}"
        corpus.append(text)
    vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    matrix = vec.fit_transform(corpus)
    return vec, matrix


_VECTORIZER, _TFIDF_MATRIX = _build_tfidf_index()


def retrieve_context(query: str, language: str = "en", top_k: int = 2) -> List[Dict[str, Any]]:
    """Retrieves top matching knowledge items using offline TF-IDF."""
    if not query.strip():
        return []
    try:
        q_vec = _VECTORIZER.transform([query.lower()])
        sims = cosine_similarity(q_vec, _TFIDF_MATRIX)[0]
        ranked_indices = sims.argsort()[::-1]

        results = []
        for idx in ranked_indices[:top_k]:
            if sims[idx] > 0.05:
                item = KNOWLEDGE_ITEMS[idx]
                title = item.get(f"title_{language}") or item["title_en"]
                content = item.get(f"content_{language}") or item["content_en"]
                results.append({
                    "id": item["id"],
                    "category": item["category"],
                    "title": title,
                    "content": content,
                    "similarity": round(float(sims[idx]), 3),
                    "route": item["route"],
                    "route_label": item["route_label"],
                })
        return results
    except Exception:
        return []


def _extract_amount(text: str, default: float = 20000.0) -> float:
    devanagari = "०१२३४५६७८९"
    t = text
    for i, d in enumerate(devanagari):
        t = t.replace(d, str(i))

    m_lakh = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|लाख)", t, re.IGNORECASE)
    if m_lakh:
        try:
            return float(m_lakh.group(1)) * 100000.0
        except ValueError:
            pass

    m_hazar = re.search(r"(\d+(?:\.\d+)?)\s*(?:hazar|हजार|हज़ार)", t, re.IGNORECASE)
    if m_hazar:
        try:
            return float(m_hazar.group(1)) * 1000.0
        except ValueError:
            pass

    words_map = {
        "एक": 1, "दोन": 2, "दो": 2, "तीन": 3, "चार": 4, "पाच": 5, "पांच": 5,
        "दहा": 10, "दस": 10, "वीस": 20, "बीस": 20, "तीस": 30, "चाळीस": 40, "चालीस": 40,
        "पन्नास": 50, "पचास": 50, "शंभर": 100, "सौ": 100,
    }
    for w, val in words_map.items():
        if re.search(rf"{w}\s*(?:हजार|हज़ार|hazar)", t, re.IGNORECASE):
            return float(val * 1000)

    m = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,8})", t, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            pass
    return default


def get_saathi_answer(message: str, language: str = "en", user: Optional[Any] = None, db: Optional[Any] = None) -> Dict[str, Any]:
    """Generates an honest, structured Saathi AI response grounded in retrieved financial domain context."""
    from .. import finance

    msg_lower = message.lower().strip()
    user_name = user.name if user else ("मित्रा" if language == "mr" else "दोस्त" if language == "hi" else "Friend")

    # 1. Loan EMI calculation query
    is_loan_q = any(w in msg_lower for w in ["कर्ज", "हप्ता", "loan", "emi", "व्याज", "interest", "व्याजा", "हप्ते", "किस्त"])
    if is_loan_q or any(w in msg_lower for w in ["२०,०००", "20,000", "20000", "५०,०००", "50000"]):
        amt = _extract_amount(message, default=20000.0)
        rate = 12.0
        tenure = 12
        emi_val = finance.emi(amt, rate, tenure)
        total_repay = round(emi_val * tenure, 2)
        total_interest = round(total_repay - amt, 2)

        if language == "mr":
            greeting = f"नमस्ते {user_name}! तुमच्या बचत गटाच्या किंवा सूक्ष्मवित्त मानकांनुसार ({int(rate)}% वार्षिक घटते व्याज, {tenure} महिने):"
            content = f"₹{amt:,.0f} च्या कर्जासाठी अंदाजे मासिक हप्ता ₹{emi_val:,.0f} येईल. एकूण व्याज ₹{total_interest:,.0f} आणि एकूण परतफेड ₹{total_repay:,.0f} असेल."
            tip = "टीप: हे शैक्षणिक मार्गदर्शन आहे. प्रत्यक्ष हप्ता तुमच्या गटाच्या ठरावानुसार निश्चित होईल."
            lbl_emi = "अंदाजे मासिक हप्ता"
            lbl_int = "एकूण व्याज"
            lbl_tot = "एकूण परतफेड"
            suggestions = ["Emergency Fund Calculator", "PM Mudra Loan", "सायबर सुरक्षा", "साहूकार सापळा"]
        elif language == "hi":
            greeting = f"नमस्ते {user_name}! स्वयं सहायता समूह (SHG) या बैंक सूक्ष्मवित्त नियमों के अनुसार ({int(rate)}% वार्षिक घटता ब्याज, {tenure} माह):"
            content = f"₹{amt:,.0f} के ऋण पर अनुमानित मासिक किस्त ₹{emi_val:,.0f} होगी। कुल ब्याज ₹{total_interest:,.0f} और कुल पुनर्भुगतान ₹{total_repay:,.0f} होगा।"
            tip = "सुझाव: यह केवल शैक्षणिक अनुमान है। वास्तविक किस्त समूह के निर्णय पर निर्भर करेगी।"
            lbl_emi = "अनुमानित मासिक किस्त (EMI)"
            lbl_int = "कुल ब्याज"
            lbl_tot = "कुल पुनर्भुगतान"
            suggestions = ["Emergency Fund Calculator", "PM Mudra Loan", "साइबर सुरक्षा", "साहूकार से बचाव"]
        else:
            greeting = f"Hello {user_name}! Based on standard SHG microfinance terms ({int(rate)}% annual reducing balance, {tenure} months):"
            content = f"For a loan of ₹{amt:,.0f}, the estimated monthly EMI is ₹{emi_val:,.0f}. Total interest is ₹{total_interest:,.0f} and total repayment is ₹{total_repay:,.0f}."
            tip = "Note: This is an educational estimate. Actual terms depend on group resolution and reducing balance amortization."
            lbl_emi = "Estimated Monthly EMI"
            lbl_int = "Total Interest"
            lbl_tot = "Total Repayment"
            suggestions = ["Emergency Fund Calculator", "PM Mudra Loan Eligibility", "Cyber Safety Quiz", "Sahukar Trap Calculator"]

        return {
            "content": f"{greeting}\n\n{content}\n\n{tip}",
            "card_type": "emi_breakdown",
            "card_data": {
                "amount": amt,
                "annual_rate": rate,
                "tenure_months": tenure,
                "emi": emi_val,
                "total_interest": total_interest,
                "total_repayment": total_repay,
                "labels": {"emi": lbl_emi, "interest": lbl_int, "repayment": lbl_tot},
            },
            "actions": [
                {"id": "open_emi_calc", "label": "Open EMI Calculator 🧮", "type": "route", "target": "/tools?calc=emi"},
                {"id": "view_loans", "label": "Browse Loan Products 📋", "type": "route", "target": "/loans"},
            ],
            "suggestions": suggestions,
            "sources": ["RBI Master Direction - Microfinance Loans, 2022"],
        }

    # 2. Retrieve offline RAG knowledge
    rag_results = retrieve_context(message, language=language, top_k=2)

    if rag_results:
        top_match = rag_results[0]
        title = top_match["title"]
        body_text = top_match["content"]

        if language == "mr":
            greeting = f"नमस्ते {user_name}! तुमच्या प्रश्नासंदर्भात अधिकृत वित्तीय माहिती खालीलप्रमाणे आहे:"
            suggestions = ["माझ्या बचत गटातून कर्ज", "Emergency Fund Calculator", "सायबर फसवणूक सुरक्षा", "शासकीय योजना"]
        elif language == "hi":
            greeting = f"नमस्ते {user_name}! आपके प्रश्न के संबंध में प्रामाणिक वित्तीय जानकारी निम्नलिखित है:"
            suggestions = ["SHG से ऋण EMI", "Emergency Fund Calculator", "साइबर फ्रॉड से सुरक्षा", "सरकारी योजनाएँ"]
        else:
            greeting = f"Hello {user_name}! Here is verified financial guidance regarding your query:"
            suggestions = ["Calculate SHG Loan EMI", "Emergency Buffer Plan", "Protect Against UPI Scams", "Government Schemes"]

        actions = [
            {"id": "rag_action", "label": top_match["route_label"], "type": "route", "target": top_match["route"]},
            {"id": "view_all_tools", "label": "All Financial Tools 🛠️", "type": "route", "target": "/tools"},
        ]

        full_text = f"{greeting}\n\n### {title}\n{body_text}"

        return {
            "content": full_text,
            "card_type": "knowledge_card",
            "card_data": {
                "title": title,
                "summary": body_text,
                "category": top_match["category"],
            },
            "actions": actions,
            "suggestions": suggestions,
            "sources": [title],
        }

    # 3. Empathetic conversational fallback
    if language == "mr":
        fallback = f"नमस्ते {user_name}! मी तुमची **साथी AI (Saathi AI)** वित्तीय मार्गदर्शक आहे. मी तुम्हाला बचत गट (SHG) कर्ज, मासिक हप्ता (EMI) गणित, शासकीय योजना, कौटुंबिक आपत्कालीन बचत आणि डिजिटल UPI सायबर सुरक्षेबाबत संपूर्ण मार्गदर्शन करू शकते. तुम्ही वर दिलेल्या पर्यायांमधून निवडू शकता किंवा प्रश्न विचारू शकता."
        suggestions = ["माझ्या बचत गटातून ₹२०,००० कर्ज", "Emergency Fund Calculator", "मला सायबर फसवणुकीपासून कसे सुरक्षित ठेवावे?", "PM Awas Yojana"]
    elif language == "hi":
        fallback = f"नमस्ते {user_name}! मैं आपकी **साथी AI (Saathi AI)** वित्तीय मार्गदर्शक हूँ। मैं आपको SHG ऋण, EMI गणना, सरकारी योजनाओं, पारिवारिक आपातकालीन बजट और डिजिटल UPI सुरक्षा के बारे में पूरी सहायता दे सकती हूँ। आप ऊपर दिए गए सुझावों में से चुन सकते हैं या अपना प्रश्न पूछ सकते हैं।"
        suggestions = ["SHG से ₹20,000 ऋण का हफ्ता", "Emergency Fund Calculator", "साइबर फ्रॉड से कैसे सुरक्षित रहें?", "PM Awas Yojana"]
    else:
        fallback = f"Hello {user_name}! I am your **Saathi AI** financial companion. I can help calculate SHG loan EMIs, plan emergency savings buffers, explore government welfare schemes, and protect against online UPI scams. Feel free to ask a question or select from the quick options below."
        suggestions = ["SHG ₹20,000 Loan EMI", "Emergency Fund Calculator", "How to stay safe from UPI fraud?", "PM Mudra Yojana"]

    return {
        "content": fallback,
        "card_type": "general",
        "card_data": None,
        "actions": [
            {"id": "open_calc", "label": "Open Financial Calculators 🧮", "type": "route", "target": "/tools"},
            {"id": "open_learn", "label": "Explore Financial Academy 🎓", "type": "route", "target": "/learn"},
            {"id": "open_schemes", "label": "Government Schemes 🏛️", "type": "route", "target": "/schemes"},
        ],
        "suggestions": suggestions,
        "sources": ["National Centre for Financial Education (NCFE)", "NABARD SHG-BLP"],
    }
