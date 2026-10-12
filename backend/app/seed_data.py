"""Starter content. Review with your faculty / a domain expert before presenting as authoritative."""

# course slug -> language -> (title, summary, content, [(question, options, answer_index, explanation)])
COURSES = {
    "emi-and-loans": {
        "en": ("Understanding EMI and Loans",
               "What EMI means, how interest works and how much you can safely borrow.",
               "## What is an EMI?\nEMI (Equated Monthly Instalment) is the fixed amount you pay every month to repay a loan. "
               "Each EMI has two parts: part repays the loan amount (principal) and part is the interest.\n\n"
               "## Interest rate matters\nA loan at 36% a year costs far more than a loan at 12%. Always compare the total interest, "
               "not only the monthly amount.\n\n"
               "## How much can you borrow?\nA good rule: all your EMIs together should be 40% or less of your monthly income, "
               "and you should still have money left for food, school and emergencies.",
               [("What does EMI stand for?", ["Equated Monthly Instalment", "Easy Money Interest", "Early Monthly Income"], 0,
                 "EMI is the fixed monthly payment for a loan."),
                ("As a safe rule, all EMIs together should be at most about what share of your income?",
                 ["10%", "40%", "80%"], 1, "Keeping EMIs near 40% of income leaves room for daily needs.")]),
        "hi": ("ईएमआई और ऋण को समझें",
               "ईएमआई क्या है, ब्याज कैसे काम करता है और कितना कर्ज़ लेना सुरक्षित है।",
               "## ईएमआई क्या है?\nईएमआई (समान मासिक किस्त) वह तय रकम है जो आप हर महीने कर्ज़ चुकाने के लिए देते हैं। "
               "हर किस्त में दो हिस्से होते हैं: एक हिस्सा मूलधन चुकाता है और दूसरा ब्याज होता है।\n\n"
               "## ब्याज दर मायने रखती है\nसालाना 36% ब्याज वाला कर्ज़ 12% वाले कर्ज़ से बहुत महँगा पड़ता है। "
               "केवल मासिक किस्त नहीं, कुल ब्याज की तुलना करें।\n\n"
               "## कितना कर्ज़ लें?\nअच्छा नियम: आपकी सभी किस्तें मिलाकर मासिक आय के 40% या उससे कम हों, "
               "ताकि खाने, पढ़ाई और आपात खर्च के लिए पैसे बचे रहें।",
               [("ईएमआई का क्या मतलब है?", ["समान मासिक किस्त", "आसान मासिक ब्याज", "शुरुआती मासिक आय"], 0,
                 "ईएमआई कर्ज़ की तय मासिक किस्त है।"),
                ("सुरक्षित नियम के अनुसार सभी किस्तें आय के लगभग कितने हिस्से तक होनी चाहिए?",
                 ["10%", "40%", "80%"], 1, "आय का लगभग 40% तक किस्तें रखने से रोज़ के खर्च के लिए जगह रहती है।")]),
        "mr": ("ईएमआय आणि कर्ज समजून घ्या",
               "ईएमआय म्हणजे काय, व्याज कसे काम करते आणि किती कर्ज घेणे सुरक्षित आहे.",
               "## ईएमआय म्हणजे काय?\nईएमआय (समान मासिक हप्ता) म्हणजे कर्ज फेडण्यासाठी तुम्ही दर महिन्याला भरत असलेली ठरलेली रक्कम. "
               "प्रत्येक हप्त्यात दोन भाग असतात: एक भाग मुद्दल फेडतो आणि दुसरा व्याज असतो.\n\n"
               "## व्याजदर महत्त्वाचा आहे\nवार्षिक 36% व्याजाचे कर्ज 12% च्या कर्जापेक्षा खूप महाग पडते. "
               "फक्त मासिक हप्ता नाही, एकूण व्याजाची तुलना करा.\n\n"
               "## किती कर्ज घ्यावे?\nचांगला नियम: तुमचे सर्व हप्ते मिळून मासिक उत्पन्नाच्या 40% किंवा त्यापेक्षा कमी असावेत, "
               "म्हणजे जेवण, शिक्षण आणि आणीबाणीसाठी पैसे उरतात.",
               [("ईएमआय म्हणजे काय?", ["समान मासिक हप्ता", "सोपे मासिक व्याज", "सुरुवातीचे मासिक उत्पन्न"], 0,
                 "ईएमआय म्हणजे कर्जाचा ठरलेला मासिक हप्ता."),
                ("सुरक्षित नियमानुसार सर्व हप्ते उत्पन्नाच्या साधारण किती टक्क्यांपर्यंत असावेत?",
                 ["10%", "40%", "80%"], 1, "उत्पन्नाच्या सुमारे 40% पर्यंत हप्ते ठेवल्यास रोजच्या खर्चासाठी जागा राहते.")]),
    },
    "saving-habits": {
        "en": ("Building a Saving Habit",
               "Simple ways to save regularly, even with irregular income.",
               "## Pay yourself first\nWhen money comes in, set aside a small fixed amount before spending. Even Rs 100 a week adds up.\n\n"
               "## Emergency fund\nTry to build savings equal to 3 months of expenses. This stops you from borrowing at high rates "
               "when something unexpected happens.\n\n"
               "## Seasonal income\nIf your income comes after harvest, save more in good months and use that for lean months.",
               [("What is the best time to save?", ["When money comes in, before spending", "Only at year end", "Never, if income is low"], 0,
                 "Saving first makes it a habit."),
                ("An emergency fund should ideally cover about how many months of expenses?", ["1 week", "3 months", "10 years"], 1,
                 "Around 3 months of expenses is a common first target.")]),
        "hi": ("बचत की आदत बनाएँ",
               "अनियमित आय में भी नियमित बचत के आसान तरीके।",
               "## पहले खुद के लिए बचाएँ\nपैसा आते ही खर्च से पहले एक छोटी तय रकम अलग रख दें। हफ़्ते में सिर्फ़ 100 रुपये भी समय के साथ बढ़ते हैं।\n\n"
               "## आपातकालीन निधि\nकम से कम 3 महीने के खर्च के बराबर बचत बनाने की कोशिश करें। इससे अचानक ज़रूरत पर महँगा कर्ज़ नहीं लेना पड़ता।\n\n"
               "## मौसमी आय\nअगर आय फसल के बाद आती है तो अच्छे महीनों में ज़्यादा बचाएँ और कम आय वाले महीनों में उसका उपयोग करें।",
               [("बचत करने का सबसे अच्छा समय कब है?", ["पैसा आते ही, खर्च से पहले", "सिर्फ़ साल के अंत में", "आय कम हो तो कभी नहीं"], 0,
                 "पहले बचत करने से यह आदत बन जाती है।"),
                ("आपातकालीन निधि लगभग कितने महीनों के खर्च के बराबर होनी चाहिए?", ["1 हफ़्ता", "3 महीने", "10 साल"], 1,
                 "लगभग 3 महीने का खर्च एक अच्छा पहला लक्ष्य है।")]),
        "mr": ("बचतीची सवय लावा",
               "अनियमित उत्पन्नातही नियमित बचत करण्याचे सोपे मार्ग.",
               "## आधी स्वतःसाठी बचत करा\nपैसे हातात येताच खर्चाआधी ठरावीक छोटी रक्कम बाजूला ठेवा. आठवड्याला फक्त 100 रुपये देखील कालांतराने वाढतात.\n\n"
               "## आपत्कालीन निधी\nकिमान 3 महिन्यांच्या खर्चाइतकी बचत करण्याचा प्रयत्न करा. त्यामुळे अचानक गरज पडल्यास महागडे कर्ज घ्यावे लागत नाही.\n\n"
               "## हंगामी उत्पन्न\nउत्पन्न पीक आल्यानंतर मिळत असेल तर चांगल्या महिन्यांत जास्त बचत करा आणि कमी उत्पन्नाच्या महिन्यांत ती वापरा.",
               [("बचत करण्याची सर्वोत्तम वेळ कोणती?", ["पैसे हातात येताच, खर्चाआधी", "फक्त वर्षाच्या शेवटी", "उत्पन्न कमी असेल तर कधीच नाही"], 0,
                 "आधी बचत केल्याने सवय लागते."),
                ("आपत्कालीन निधी साधारण किती महिन्यांच्या खर्चाइतका असावा?", ["1 आठवडा", "3 महिने", "10 वर्षे"], 1,
                 "सुमारे 3 महिन्यांचा खर्च हे चांगले पहिले उद्दिष्ट आहे.")]),
    },
    "avoid-fraud": {
        "en": ("Avoiding Loan Fraud and Moneylender Traps",
               "How to spot fake loan offers and understand the true cost of informal loans.",
               "## Warning signs\nBe careful if someone asks for money before giving a loan, asks for your OTP or PIN, "
               "or pressures you to decide immediately.\n\n"
               "## Informal moneylenders\nSome charge 3% to 5% per month, which is 36% to 60% per year. Compare this with an SHG or a bank loan.\n\n"
               "## Stay safe\nNever share your OTP, PIN or password. Use only registered banks, SHG federations and known institutions.",
               [("Should you ever share your OTP with a loan agent?", ["Yes, if they are polite", "Never", "Only on weekends"], 1,
                 "OTPs and PINs are private. Genuine lenders never ask for them."),
                ("A moneylender charging 3% per month is about what yearly rate?", ["3%", "12%", "36%"], 2,
                 "3% x 12 months = 36% a year, before compounding.")]),
        "hi": ("ऋण धोखाधड़ी और साहूकार के जाल से बचें",
               "फ़र्ज़ी ऋण ऑफ़र पहचानें और अनौपचारिक कर्ज़ की असली लागत समझें।",
               "## चेतावनी के संकेत\nअगर कोई कर्ज़ देने से पहले पैसे माँगे, आपका ओटीपी या पिन पूछे, या तुरंत फ़ैसला करने का दबाव डाले तो सावधान रहें।\n\n"
               "## अनौपचारिक साहूकार\nकुछ साहूकार महीने में 3% से 5% ब्याज लेते हैं, यानी साल में 36% से 60%। इसकी तुलना स्वयं सहायता समूह या बैंक के कर्ज़ से करें।\n\n"
               "## सुरक्षित रहें\nअपना ओटीपी, पिन या पासवर्ड कभी साझा न करें। केवल पंजीकृत बैंक, एसएचजी संघ और जाने-माने संस्थानों का उपयोग करें।",
               [("क्या आपको किसी ऋण एजेंट को अपना ओटीपी देना चाहिए?", ["हाँ, अगर वह विनम्र हो", "कभी नहीं", "केवल सप्ताहांत में"], 1,
                 "ओटीपी और पिन निजी होते हैं। असली ऋणदाता इन्हें कभी नहीं माँगते।"),
                ("महीने में 3% ब्याज लेने वाला साहूकार सालाना लगभग कितना ब्याज लेता है?", ["3%", "12%", "36%"], 2,
                 "3% x 12 महीने = साल का 36%, चक्रवृद्धि से पहले।")]),
        "mr": ("कर्ज फसवणूक आणि सावकाराच्या सापळ्यापासून सावध राहा",
               "बनावट कर्ज ऑफर ओळखा आणि अनौपचारिक कर्जाची खरी किंमत समजून घ्या.",
               "## धोक्याची चिन्हे\nकर्ज देण्याआधी कोणी पैसे मागत असेल, तुमचा ओटीपी किंवा पिन विचारत असेल, किंवा लगेच निर्णय घेण्यासाठी दबाव आणत असेल तर सावध राहा.\n\n"
               "## अनौपचारिक सावकार\nकाही सावकार दरमहा 3% ते 5% व्याज घेतात, म्हणजे वर्षाला 36% ते 60%. याची तुलना बचत गट किंवा बँकेच्या कर्जाशी करा.\n\n"
               "## सुरक्षित राहा\nतुमचा ओटीपी, पिन किंवा पासवर्ड कधीही कोणाला देऊ नका. फक्त नोंदणीकृत बँका, बचत गट महासंघ आणि ओळखीच्या संस्थांचाच वापर करा.",
               [("कर्ज एजंटला तुम्ही ओटीपी द्यावा का?", ["हो, तो नम्र असेल तर", "कधीच नाही", "फक्त आठवड्याच्या शेवटी"], 1,
                 "ओटीपी आणि पिन खाजगी असतात. खरे कर्जदाते ते कधीच मागत नाहीत."),
                ("दरमहा 3% व्याज घेणारा सावकार वार्षिक साधारण किती व्याज घेतो?", ["3%", "12%", "36%"], 2,
                 "3% x 12 महिने = वर्षाला 36%, चक्रवाढीआधी.")]),
    },
}

# Verify current terms on the official portals before relying on these summaries.
SCHEMES = {
    "en": [
        ("PMJDY (Pradhan Mantri Jan Dhan Yojana)",
         "Basic bank account with no minimum balance requirement, a RuPay debit card and accident insurance cover. "
         "Helps families enter the formal banking system.",
         "Any Indian citizen without a bank account.", "https://pmjdy.gov.in"),
        ("DAY-NRLM (Deendayal Antyodaya Yojana - National Rural Livelihoods Mission)",
         "Forms and strengthens women's Self-Help Groups, supports bank linkage and low-cost credit for SHG members.",
         "Rural poor households, mainly women organised into SHGs.", "https://aajeevika.gov.in"),
        ("PMMY (Pradhan Mantri MUDRA Yojana)",
         "Collateral-free loans for small non-farm businesses, in Shishu, Kishor and Tarun categories. "
         "Loan limits have been revised over time, so confirm current limits.",
         "Small business owners and micro enterprises.", "https://www.mudra.org.in"),
    ],
    "hi": [
        ("पीएमजेडीवाई (प्रधानमंत्री जन धन योजना)",
         "न्यूनतम शेष राशि की शर्त के बिना बुनियादी बैंक खाता, रुपे डेबिट कार्ड और दुर्घटना बीमा कवर। परिवारों को औपचारिक बैंकिंग से जोड़ती है।",
         "कोई भी भारतीय नागरिक जिसके पास बैंक खाता नहीं है।", "https://pmjdy.gov.in"),
        ("दीनदयाल अंत्योदय योजना - राष्ट्रीय ग्रामीण आजीविका मिशन (डे-एनआरएलएम)",
         "महिलाओं के स्वयं सहायता समूह बनाती और मज़बूत करती है, बैंक लिंकेज और कम लागत वाले ऋण में मदद करती है।",
         "ग्रामीण गरीब परिवार, मुख्यतः एसएचजी से जुड़ी महिलाएँ।", "https://aajeevika.gov.in"),
        ("पीएमएमवाई (प्रधानमंत्री मुद्रा योजना)",
         "छोटे गैर-कृषि व्यवसायों के लिए बिना गारंटी ऋण: शिशु, किशोर और तरुण श्रेणियाँ। सीमाएँ समय-समय पर बदली हैं, इसलिए वर्तमान सीमा जाँच लें।",
         "छोटे व्यवसायी और सूक्ष्म उद्यम।", "https://www.mudra.org.in"),
    ],
    "mr": [
        ("पीएमजेडीवाय (प्रधानमंत्री जन धन योजना)",
         "किमान शिल्लक अटीशिवाय मूलभूत बँक खाते, रूपे डेबिट कार्ड आणि अपघात विमा संरक्षण. कुटुंबांना औपचारिक बँकिंगशी जोडते.",
         "बँक खाते नसलेला कोणताही भारतीय नागरिक.", "https://pmjdy.gov.in"),
        ("दीनदयाळ अंत्योदय योजना - राष्ट्रीय ग्रामीण उपजीविका अभियान (डे-एनआरएलएम)",
         "महिलांचे स्वयंसहाय्यता गट स्थापन करते व बळकट करते, बँक जोडणी आणि कमी खर्चाच्या कर्जासाठी मदत करते.",
         "ग्रामीण गरीब कुटुंबे, मुख्यतः बचत गटांशी जोडलेल्या महिला.", "https://aajeevika.gov.in"),
        ("पीएमएमवाय (प्रधानमंत्री मुद्रा योजना)",
         "लहान बिगर-शेती व्यवसायांसाठी तारणाशिवाय कर्ज: शिशू, किशोर आणि तरुण गट. मर्यादा वेळोवेळी बदलल्या आहेत, त्यामुळे सध्याची मर्यादा तपासा.",
         "लहान व्यावसायिक आणि सूक्ष्म उद्योग.", "https://www.mudra.org.in"),
    ],
}
