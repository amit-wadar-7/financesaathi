"""Script to build comprehensive seed_data.py with 6 rural microfinance courses (8+ questions each in EN, HI, MR) and 8 government schemes."""
import os

courses_code = '''"""Authoritative Rural Microfinance & Financial Literacy Starter Content.
Reviewed for Self-Help Groups (SHGs), Joint Liability Groups, and Rural Microenterprises.
"""

# course slug -> language -> (title, summary, content, [(question, options, answer_index, explanation)])
COURSES = {
    "emi-and-loans": {
        "en": (
            "Understanding EMI and Safe Debt Limits",
            "What EMI means, reducing-balance vs flat interest, and how to stay within safe borrowing limits.",
            "## What is an EMI?\\nEMI (Equated Monthly Instalment) is the fixed sum you pay every month to repay a loan. Each instalment contains two components: repayment of the borrowed principal, and interest for that month.\\n\\n## Reducing Balance vs Flat Rate\\nUnder the reducing balance method, interest is calculated only on the balance you still owe. As you pay back principal, interest goes down. Under a flat rate method, interest is calculated on the entire initial principal for the full duration, making the true effective cost nearly double! Always ask for the Reducing Balance Annual Percentage Rate (APR).\\n\\n## Safe Debt Limits (RBI 50% Rule)\\nAccording to RBI regulatory guidelines for microfinance loans, all your household debt obligations together must never exceed 50% of your total household monthly income. If your family earns Rs 20,000, your total monthly EMIs must stay below Rs 10,000 to keep food, healthcare, and children's education safe.\\n\\n## Prepayment & Foreclosure\\nUnder RBI rules, microfinance borrowers cannot be charged any prepayment penalties or foreclosure fees. If you have extra income after harvest or a good market week, paying early saves interest.",
            [
                ("What does EMI stand for?", ["Equated Monthly Instalment", "Easy Money Interest", "Early Monthly Income", "Estimated Market Index"], 0, "EMI stands for Equated Monthly Instalment, the fixed monthly payment towards a loan."),
                ("Why is reducing balance interest cheaper than a flat interest rate?", ["Interest is charged only on the unpaid remaining principal", "Flat interest is subsidized by banks", "Reducing balance requires daily payments", "Flat interest includes free insurance"], 0, "Under reducing balance, as you pay off principal, the interest charged in future months decreases."),
                ("Under RBI microfinance guidelines, total household EMIs should not exceed what share of monthly income?", ["20%", "50%", "75%", "90%"], 1, "RBI microfinance guidelines specify that total repayment obligations should stay within 50% of monthly household income."),
                ("What happens if you prepay or foreclose a regulated microfinance loan early?", ["You cannot be charged any prepayment penalty", "You must pay a 10% penalty fee", "Your bank account gets locked", "You lose your collateral"], 0, "RBI mandates zero prepayment penalties for microfinance borrowers."),
                ("If a family earns Rs 18,000 per month, what is their maximum safe monthly EMI limit?", ["Rs 5,000", "Rs 9,000", "Rs 15,000", "Rs 18,000"], 1, "50% of Rs 18,000 is Rs 9,000. Going above this risks severe financial stress."),
                ("What document must every lender provide disclosing the true interest rate and all fees?", ["Key Fact Statement (KFS)", "Blank cheque", "Promissory stamp paper", "Passbook only"], 0, "A Key Fact Statement (KFS) clearly summarizes the loan amount, APR, tenure, and total repayment amount."),
                ("Which component of an EMI reduces the actual loan debt you owe?", ["Principal part", "Interest part", "Processing fee", "GST tax"], 0, "The principal part reduces the outstanding balance you owe to the lender."),
                ("What should you do if an agent claims you can borrow 80% of your monthly income?", ["Refuse and seek advice from your SHG or officer", "Accept immediately", "Take two loans together", "Pay the agent a cash commission"], 0, "Borrowing 80% of income violates RBI affordability guidelines and causes a debt trap."),
            ]
        ),
        "hi": (
            "ईएमआई और सुरक्षित ऋण सीमा को समझें",
            "ईएमआई क्या है, घटता ब्याज (Reducing Balance) बनाम फ़्लैट ब्याज, और सुरक्षित ऋण सीमा में कैसे रहें।",
            "## ईएमआई क्या है?\\nईएमआई (समान मासिक किस्त) वह तय रकम है जो आप हर महीने ऋण चुकाने के लिए देते हैं। हर किस्त में दो हिस्से होते हैं: मूलधन की वापसी और उस महीने का ब्याज।\\n\\n## घटता ब्याज बनाम फ़्लैट ब्याज\\nघटते ब्याज (Reducing Balance) में ब्याज केवल बची हुई बकाया रकम पर लगता है। जैसे-जैसे मूलधन घटता है, ब्याज भी कम होता जाता है। फ़्लैट ब्याज में पूरे ऋण पर शुरू से अंत तक ब्याज जोड़ा जाता है, जिससे वास्तविक लागत दोगुनी हो जाती है। हमेशा 'घटता ब्याज APR' पूछें।\\n\\n## सुरक्षित ऋण सीमा (आरबीआई का 50% नियम)\\nआरबीआई के सूक्ष्म वित्त (माइक्रोफ़ाइनेंस) नियमों के अनुसार, परिवार की सभी मासिक किस्तें मिलकर कुल मासिक आय के 50% से अधिक नहीं होनी चाहिए। अगर परिवार की मासिक आय 20,000 रुपये है, तो सभी किस्तें 10,000 रुपये से कम होनी चाहिए ताकि भोजन, स्वास्थ्य और बच्चों की पढ़ाई प्रभावित न हो।\\n\\n## समय से पहले भुगतान (Prepayment)\\nआरबीआई नियमों के तहत माइक्रोफ़ाइनेंस ऋण पर कोई पूर्व-भुगतान जुर्माना (Foreclosure penalty) नहीं लगाया जा सकता। फसल बिक्री या अतिरिक्त आय होने पर पहले भुगतान करने से ब्याज की बचत होती है।",
            [
                ("ईएमआई (EMI) का पूरा नाम क्या है?", ["समान मासिक किस्त (Equated Monthly Instalment)", "आसान मासिक ब्याज (Easy Money Interest)", "शुरुआती मासिक आय", "अनुमानित बाज़ार सूचकांक"], 0, "ईएमआई का अर्थ Equated Monthly Instalment (समान मासिक किस्त) होता है।"),
                ("घटता ब्याज (Reducing Balance) फ़्लैट ब्याज से सस्ता क्यों होता है?", ["क्योंकि ब्याज केवल बची हुई मूल रकम पर लगता है", "क्योंकि यह बैंक द्वारा मुफ़्त दिया जाता है", "क्योंकि इसमें रोज़ पैसे देने होते हैं", "क्योंकि इसमें मुफ़्त बीमा होता है"], 0, "घटते ब्याज में जैसे-जैसे आप मूलधन चुकाते हैं, ब्याज की राशि घटती जाती है।"),
                ("आरबीआई के अनुसार परिवार की कुल किस्तें मासिक आय के कितने प्रतिशत से अधिक नहीं होनी चाहिए?", ["20%", "50%", "75%", "90%"], 1, "आरबीआई दिशानिर्देशों के अनुसार कुल ऋण देनदारी मासिक पारिवारिक आय के 50% से कम होनी चाहिए।"),
                ("माइक्रोफ़ाइनेंस ऋण को समय से पहले चुकाने पर क्या जुर्माना लगता है?", ["कोई जुर्माना नहीं लग सकता (शून्य)", "10% जुर्माना लगता है", "बैंक खाता बंद हो जाता है", "जमानत जब्त हो जाती है"], 0, "आरबीआई नियमों के अनुसार माइक्रोफ़ाइनेंस में प्रीपेमेंट पेनल्टी पूरी तरह प्रतिबंधित है।"),
                ("यदि परिवार की मासिक आय 18,000 रुपये है, तो अधिकतम सुरक्षित किस्त कितनी होनी चाहिए?", ["5,000 रुपये", "9,000 रुपये", "15,000 रुपये", "18,000 रुपये"], 1, "18,000 रुपये का 50% यानी अधिकतम 9,000 रुपये की किस्त ही सुरक्षित मानी जाती है।"),
                ("ऋण की वास्तविक ब्याज दर और सभी शुल्कों का ब्योरा देने वाला आधिकारिक दस्तावेज़ कौन-सा है?", ["मुख्य तथ्य विवरण (Key Fact Statement - KFS)", "कोरा चेक", "सादा स्टांप पेपर", "केवल पासबुक"], 0, "केएफएस (KFS) में ऋण की कुल लागत, ब्याज दर और सभी नियम स्पष्ट लिखे होते हैं।"),
                ("किस्त (EMI) का कौन-सा हिस्सा आपके वास्तविक कर्ज़ को कम करता है?", ["मूलधन (Principal)", "ब्याज (Interest)", "प्रोसेसिंग शुल्क", "जीएसटी कर"], 0, "मूलधन का हिस्सा सीधे आपके बकाया कर्ज़ की राशि को कम करता है।"),
                ("यदि कोई एजेंट आपको मासिक आय के 80% तक का कर्ज़ लेने का दबाव बनाए तो क्या करना चाहिए?", ["मना करें और अपने बचत गट या फील्ड ऑफिसर से सलाह लें", "तुरंत कर्ज़ ले लें", "दो कर्ज़ एक साथ लें", "एजेंट को नकद कमीशन दें"], 0, "आय के 80% का कर्ज़ लेना नियमों का उल्लंघन है और यह कर्ज़ के जाल में फँसाता है।"),
            ]
        ),
        "mr": (
            "ईएमआय आणि सुरक्षित कर्ज मर्यादा समजून घ्या",
            "ईएमआय म्हणजे काय, घटते व्याज (Reducing Balance) विरुद्ध फ्लॅट व्याज, आणि सुरक्षित कर्ज मर्यादेत कसे राहावे.",
            "## ईएमआय म्हणजे काय?\\nईएमआय (समान मासिक हप्ता) म्हणजे कर्ज परतफेडीसाठी दरमहा भरली जाणारी ठरलेली रक्कम. प्रत्येक हप्त्यात दोन भाग असतात: घेतलेल्या मुद्दलाची परतफेड आणि त्या महिन्याचे व्याज.\\n\\n## घटते व्याज विरुद्ध फ्लॅट व्याज\\nघटत्या व्याज पद्धतीमध्ये व्याज फक्त उरलेल्या शिल्लक मुद्दलावर आकारले जाते. मुद्दल कमी होताच व्याजही कमी होते. फ्लॅट पद्धतीमध्ये सुरुवातीपासून शेवटपर्यंत पूर्ण रकमेवर व्याज लावले जाते, ज्यामुळे कर्जाचा खरा खर्च दुप्पट होतो. नेहमी घटत्या दराचा वार्षिक व्याजदर (APR) विचारा.\\n\\n## सुरक्षित कर्ज मर्यादा (आरबीआयचा 50% नियम)\\nआरबीआयच्या मायक्रोफायनान्स नियमांनुसार, कुटुंबाचे सर्व मासिक हप्ते मिळून मासिक उत्पन्नाच्या 50% पेक्षा जास्त नसावेत. कुटुंबाचे उत्पन्न 20,000 रुपये असल्यास सर्व हप्ते 10,000 रुपयांच्या आतच असावेत, जेणेकरून अन्न, औषधोपचार व मुलांच्या शिक्षणावर परिणाम होणार नाही.\\n\\n## मुदतीपूर्व परतफेड (Prepayment)\\nआरबीआय नियमांनुसार मायक्रोफायनान्स कर्जावर मुदतीआधी पैसे फेडल्यास कोणताही दंड (Foreclosure fee) आकारता येत नाही. पीक विकल्यावर पैसे आल्यास आधी कर्ज फेडल्याने व्याजाची बचत होते.",
            [
                ("ईएमआय (EMI) चा पूर्ण अर्थ काय आहे?", ["समान मासिक हप्ता (Equated Monthly Instalment)", "सोपे मासिक व्याज", "सुरुवातीचे मासिक उत्पन्न", "अंदाजे बाजार निर्देशांक"], 0, "ईएमआय म्हणजे Equated Monthly Instalment (समान मासिक हप्ता)."),
                ("घटते व्याज (Reducing Balance) फ्लॅट व्याजापेक्षा स्वस्त का असते?", ["कारण व्याज फक्त उरलेल्या शिल्लक मुद्दलावर लागते", "कारण बँक ते मोफत देते", "कारण यात दररोज पैसे द्यावे लागतात", "कारण यात मोफत विमा असतो"], 0, "घटत्या व्याजात मुद्दल कमी होत गेल्यामुळे पुढील महिन्यांचे व्याज कमी होते."),
                ("आरबीआय नियमांनुसार सर्व हप्ते मिळून मासिक उत्पन्नाच्या किती टक्क्यांपेक्षा जास्त नसावेत?", ["20%", "50%", "75%", "90%"], 1, "आरबीआयच्या मार्गदर्शक तत्त्वांनुसार कौटुंबिक उत्पन्नाच्या 50% पेक्षा जास्त हप्ते असू नयेत."),
                ("मायक्रोफायनान्स कर्ज मुदतीपूर्वी फेडल्यास कोणता दंड लागतो?", ["कोणताही दंड लागत नाही (शून्य दंड)", "10% दंड लागतो", "बँक खाते बंद होते", "तारण जप्त होते"], 0, "आरबीआय नियमांनुसार मायक्रोफायनान्स कर्जावर प्रीपेमेंट दंड आकारण्यास बंदी आहे."),
                ("कुटुंबाचे मासिक उत्पन्न 18,000 रुपये असल्यास सुरक्षित मासिक हप्त्याची कमाल मर्यादा किती?", ["5,000 रुपये", "9,000 रुपये", "15,000 रुपये", "18,000 रुपये"], 1, "18,000 रुपयांच्या 50% म्हणजे कमाल 9,000 रुपयांपर्यंतच हप्ता सुरक्षित मानला जातो."),
                ("कर्जाचा खरा व्याजदर आणि सर्व खर्चांचा तपशील देणारा अधिकृत कागद कोणता?", ["की फॅक्ट स्टेटमेंट (KFS)", "कोरा धनादेश (Cheque)", "साधा स्टॅम्प पेपर", "फक्त पासबुक"], 0, "KFS मध्ये कर्जाची खरी किंमत, व्याजदर आणि अटी स्पष्टपणे लिहिलेल्या असतात."),
                ("हप्त्यातील कोणता भाग तुमच्या मूळ कर्जाची रक्कम कमी करतो?", ["मुद्दल (Principal)", "व्याज (Interest)", "प्रक्रिया शुल्क", "जीएसटी कर"], 0, "मुद्दलाचा भाग थेट तुमच्या थकबाकीतून कमी होतो."),
                ("एखाद्या एजंटने उत्पन्नाच्या 80% कर्ज घेण्यास सांगितल्यास काय करावे?", ["नकार द्यावा आणि बचत गट किंवा अधिकाऱ्यांचा सल्ला घ्यावा", "लगेच कर्ज घ्यावे", "एकाच वेळी दोन कर्जे घ्यावीत", "एजंटला रोख कमिशन द्यावे"], 0, "उत्पन्नाच्या 80% कर्ज घेतल्यास कर्जाचा मोठा सापळा तयार होतो, म्हणून नकार द्यावा."),
            ]
        ),
    },
    "saving-habits": {
        "en": (
            "Building Resilient Savings & Emergency Buffer",
            "Practical ways to save regularly, seasonal agricultural income budgeting, and building a 3-month safety jar.",
            "## Pay Yourself First\\nWhen harvest proceeds or daily trade income arrives, set aside a small fixed sum before spending on other items. Even Rs 50 or Rs 100 put into your SHG thrift savings every week builds a reliable foundation over time.\\n\\n## The 3-Month Emergency Cushion\\nLife brings unexpected events: cattle illness, borewell breakdown, or sudden family hospitalization. Without an emergency fund, families are forced to turn to informal moneylenders charging 5% per month. Aim to accumulate savings equal to at least 3 months of basic living expenses in your digital passbook or bank account.\\n\\n## Seasonal Income Management (Lean Months)\\nFarm families earn income only 2 to 3 times a year during harvest seasons (Kharif and Rabi). Divide the harvest surplus into two parts: immediate farm expenses, and a monthly reserve buffer to smooth family expenses across the 4 to 5 lean months.",
            [
                ("What does 'Pay Yourself First' mean in rural savings?", ["Save a fixed amount before spending when income arrives", "Spend all income on personal gifts", "Pay moneylenders first", "Wait until the year end to save"], 0, "Saving immediately upon receiving income ensures consistent discipline."),
                ("How large should an emergency savings cushion ideally be?", ["Equal to at least 3 months of essential family expenses", "Equal to 1 day's meals", "Equal to 10 years of income", "Zero, if you have a loan"], 0, "Three months of living expenses provides breathing space during medical or agricultural shocks."),
                ("Why do families without emergency savings often fall into moneylender debt?", ["Unexpected medical or farm crises force urgent borrowing at exorbitant rates", "They forget their bank branch", "They want to invest in gold", "Banks refuse cash withdrawals"], 0, "Without savings, urgent crises force households to accept high informal interest rates."),
                ("For farmers with seasonal income, how should harvest earnings be handled?", ["Set aside a reserve fund to cover expenses during lean non-harvest months", "Spend the entire sum within the first week", "Lend all of it to distant relatives", "Bury it in the farmland"], 0, "Harvest earnings must be smoothed across the months when no crops are being sold."),
                ("Which savings channel offers peer discipline, transparency, and internal credit access in rural villages?", ["Self-Help Group (SHG) Thrift Savings", "Unregistered local chit funds", "Cash hidden under mattresses", "Online lottery games"], 0, "SHG thrift provides transparent joint records and access to internal group loans."),
                ("What is the risk of keeping large amounts of cash at home?", ["Risk of theft, fire damage, and temptation to spend impulsively", "It earns too much interest", "The government seizes cash automatically", "It attracts rain"], 0, "Physical cash has no safety, earns zero interest, and gets spent quickly."),
                ("If your monthly living expense is Rs 8,000, what is your 3-month emergency fund target?", ["Rs 8,000", "Rs 16,000", "Rs 24,000", "Rs 48,000"], 2, "3 months x Rs 8,000 = Rs 24,000 emergency buffer."),
                ("How does opening a target savings goal on FinanceSaathi help you?", ["It tracks real progress towards a specific farm or family target", "It charges interest on your savings", "It forces immediate loan borrowing", "It locks your Aadhaar card"], 0, "Visualizing goals and tracking regular deposits builds long-term saving momentum."),
            ]
        ),
        "hi": (
            "मज़बूत बचत और आपातकालीन निधि का निर्माण",
            "नियमित बचत के व्यावहारिक तरीके, मौसमी कृषि आय का प्रबंधन, और 3 महीने की सुरक्षा निधि बनाना।",
            "## पहले खुद के लिए बचाएँ (Pay Yourself First)\\nजब फसल की बिक्री या दैनिक व्यापार से पैसा आए, तो अन्य खर्चों से पहले एक छोटी निश्चित रकम अलग रख दें। हर हफ़्ते बचत गट (SHG) में 50 या 100 रुपये जमा करना भी समय के साथ एक बड़ा संबल बन जाता है।\\n\\n## 3 महीने की आपातकालीन सुरक्षा निधि\\nजीवन में अप्रत्याशित घटनाएँ कभी भी हो सकती हैं: मवेशी की बीमारी, बोरवेल मोटर का जलना, या अचानक अस्पताल का खर्च। आपातकालीन बचत न होने पर परिवारों को 5% मासिक ब्याज वाले साहूकारों के पास जाना पड़ता है। कम से कम 3 महीने के बुनियादी पारिवारिक खर्च के बराबर बचत अपने पासबुक या बैंक खाते में ज़रूर रखें।\\n\\n## मौसमी आय का प्रबंधन (कमज़ोर महीने)\\nकिसान परिवारों को साल में केवल 2-3 बार (खरीफ और रबी फसल के समय) एकमुश्त आय होती है। फसल की कमाई को तुरंत पूरा खर्च करने के बजाय, अगले 4-5 कमज़ोर महीनों (Lean Months) के घरेलू खर्च के लिए एक सुरक्षित रिज़र्व बनाकर रखें।",
            [
                ("'पहले खुद के लिए बचाएँ' का क्या अर्थ है?", ["पैसा आते ही अन्य खर्चों से पहले एक तय बचत अलग रखना", "सारा पैसा खुद पर खर्च कर देना", "साहूकार को सबसे पहले देना", "साल के अंत तक इंतज़ार करना"], 0, "आय मिलते ही पहले बचत करने से बचत की पक्की आदत बनती है।"),
                ("आपातकालीन सुरक्षा निधि कम से कम कितनी होनी चाहिए?", ["कम से कम 3 महीने के अनिवार्य घरेलू खर्च के बराबर", "केवल 1 दिन के भोजन के बराबर", "10 साल की आय के बराबर", "शून्य, यदि कर्ज़ उपलब्ध हो"], 0, "3 महीने के खर्च की बचत बीमारी या फसल संकट के समय ढाल का काम करती है।"),
                ("आपातकालीन बचत न होने पर लोग साहूकार के जाल में क्यों फँसते हैं?", ["अचानक बीमारी या संकट आने पर महँगे ब्याज पर कर्ज़ लेना पड़ता है", "क्योंकि बैंक शाखा दूर होती है", "सोना खरीदने के लिए", "क्योंकि बैंक पैसे नहीं देता"], 0, "बचत का सहारा न होने पर लोग मजबूरी में महँगे अनौपचारिक ब्याज पर कर्ज़ लेते हैं।"),
                ("मौसमी फसल आय वाले किसानों को फसल की कमाई का प्रबंधन कैसे करना चाहिए?", ["कमज़ोर महीनों के खर्च के लिए एक अलग रिज़र्व बनाकर रखना", "पहले ही हफ़्ते में सारा पैसा खर्च कर देना", "दूर के रिश्तेदारों को बाँट देना", "खेत में दबाकर रखना"], 0, "फसल की आय को उन महीनों के लिए बचाकर रखना ज़रूरी है जब कोई फसल नहीं बिकती।"),
                ("गाँव में अनुशासन, पारदर्शिता और कम ब्याज पर आंतरिक कर्ज़ देने वाली बचत व्यवस्था कौन-सी है?", ["स्वयं सहायता समूह (SHG) नियमित बचत", "अवैध स्थानीय चिट फंड", "घर में बिस्तर के नीचे रखी नकदी", "ऑनलाइन लॉटरी"], 0, "बचत गट की नियमित बचत पारदर्शी होती है और ज़रूरत पड़ने पर आंतरिक कर्ज़ देती है।"),
                ("घर में बड़ी मात्रा में नकद रखने का क्या नुकसान है?", ["चोरी, नुकसान और अनाप-शनाप खर्च होने का ख़तरा", "इस पर बहुत ज़्यादा ब्याज मिलता है", "सरकार पैसे ले लेती है", "बारिश का ख़तरा"], 0, "घर में रखी नकदी पर कोई ब्याज नहीं मिलता और वह जल्दी खर्च हो जाती है।"),
                ("यदि आपका मासिक पारिवारिक खर्च 8,000 रुपये है, तो 3 महीने की आपात निधि कितनी होगी?", ["8,000 रुपये", "16,000 रुपये", "24,000 रुपये", "48,000 रुपये"], 2, "3 महीने x 8,000 = 24,000 रुपये की आपातकालीन निधि होनी चाहिए।"),
                ("फाइनेंस साथी पर बचत लक्ष्य (Savings Goal) सेट करने से क्या लाभ होता है?", ["यह तय लक्ष्य की ओर वास्तविक प्रगति को ट्रैक करने में मदद करता है", "यह बचत पर पेनल्टी लगाता है", "यह कर्ज़ लेने पर मजबूर करता है", "यह आधार लॉक कर देता है"], 0, "लक्ष्य निर्धारित करने से नियमित बचत का अनुशासन बना रहता है।"),
            ]
        ),
        "mr": (
            "भक्कम बचत आणि आपत्कालीन निधीची उभारणी",
            "नियमित बचतीचे मार्ग, हंगामी शेती उत्पन्नाचे नियोजन, आणि 3 महिन्यांचा सुरक्षा निधी तयार करणे.",
            "## आधी स्वतःसाठी बचत करा\\nपीक विकून किंवा दैनंदिन व्यवसायातून पैसे हातात येताच इतर खर्चांपूर्वी एक ठरावीक रक्कम बाजूला ठेवा. बचत गटात दर आठवड्याला फक्त 50 किंवा 100 रुपये जमा केले तरी काही महिन्यांत मोठी रक्कम उभी राहते.\\n## 3 महिन्यांचा आपत्कालीन सुरक्षा निधी\\nअचानक जनावरांचा आजार, बोअरवेल मोटर जळणे किंवा घरातील आजारपण कधीही येऊ शकते. आपत्कालीन बचत नसल्यास कुटुंबांना दरमहा 5% व्याज आकारणाऱ्या सावकारांकडे जावे लागते. किमान 3 महिन्यांच्या घरखर्चाएवढी बचत डिजिटल पासबुकमध्ये किंवा बँकेत नेहमी ठेवा.\\n## हंगामी उत्पन्नाचे व्यवस्थापन (टंचाईचे महिने)\\nशेतकऱ्यांना वर्षातून फक्त 2-3 वेळाच पिकाचे पैसे मिळतात. हे पैसे आल्यावर पुढील 4-5 टंचाईच्या महिन्यांच्या संसारासाठी बाजूला काढून ठेवणे गरजेचे आहे.",
            [
                ("'आधी स्वतःसाठी बचत करा' याचा अर्थ काय?", ["पैसे मिळताच खर्चाआधी ठरावीक बचत बाजूला ठेवणे", "सर्व पैसे स्वतःवरच खर्च करणे", "सावकाराला आधी देणे", "वर्षाच्या शेवटी विचार करणे"], 0, "उत्पन्न येताच बचत बाजूला काढल्याने बचतीची शिस्त लागते."),
                ("आपत्कालीन सुरक्षा निधी किमान किती असावा?", ["किमान 3 महिन्यांच्या जीवनावश्यक घरखर्चाएवढा", "फक्त एका दिवसाच्या जेवणाएवढा", "10 वर्षांच्या उत्पन्नाएवढा", "शून्य"], 0, "3 महिन्यांचा खर्च आजारपण किंवा शेती संकटात आधार देतो."),
                ("आपत्कालीन बचत नसल्यास कुटुंबे सावकाराच्या जाळ्यात का अडकतात?", ["अचानक आलेल्या संकटात नाईलाजाने जादा व्याजाने कर्ज घ्यावे लागते", "बँक विसरल्यामुळे", "सोने खरेदीसाठी", "बँक पैसे देत नाही म्हणून"], 0, "बचतीचा आधार नसल्यास तातडीने सावकाराचे महागडे कर्ज घ्यावे लागते."),
                ("शेतकऱ्यांनी पीक आल्यावर मिळालेल्या पैशांचे नियोजन कसे करावे?", ["पिके नसलेल्या टंचाईच्या महिन्यांसाठी बाजूला राखून ठेवणे", "पहिल्याच आठवड्यात सर्व खर्च करणे", "नातेवाईकांना वाटून टाकणे", "जमिनीत पुरून ठेवणे"], 0, "उत्पन्न नसलेल्या महिन्यांसाठी पैशांचे नियोजन करणे अत्यंत आवश्यक असते."),
                ("गावात पारदर्शकता, शिस्त आणि गरजेच्या वेळी अंतर्गत कर्ज देणारी यंत्रणा कोणती?", ["बचत गट (SHG) नियमित बचत", "नोंदणी नसलेले चिटफंड", "घरात लपवून ठेवलेली रोख रक्कम", "ऑनलाइन लॉटरी"], 0, "बचत गट पारदर्शक असतो आणि गरजेच्या वेळी कमी व्याजात अंतर्गत कर्ज देतो."),
                ("घरात जास्त रोख रक्कम ठेवण्याचा तोटा काय?", ["चोरीची भीती, नुकसान आणि नको तो खर्च होण्याचा धोका", "जास्त व्याज मिळते", "सरकार जप्त करते", "पावसाचा धोका"], 0, "घरातील रोख रकमेवर व्याज मिळत नाही आणि ती लवकर संपून जाते."),
                ("मासिक घरखर्च 8,000 रुपये असल्यास 3 महिन्यांचा आपत्कालीन निधी किती?", ["8,000 रुपये", "16,000 रुपये", "24,000 रुपये", "48,000 रुपये"], 2, "3 महिने x 8,000 = 24,000 रुपये आपत्कालीन निधी असावा."),
                ("फायनान्स साथीवर बचत उद्दिष्ट ठेवल्याने काय फायदा होतो?", ["नियमित बचतीची आणि उद्दिष्टाची खरी प्रगती समजते", "बचतीवर दंड लागतो", "कर्ज घ्यावेच लागते", "आधार लॉक होतो"], 0, "नियमित बचतीचा पाठपुरावा केल्याने ध्येय साध्य होते."),
            ]
        ),
    },
    "avoid-fraud": {
        "en": (
            "Avoiding Moneylender Traps & Cyber Fraud",
            "Exposing exorbitant monthly moneylender compounding, illegal recovery threats, and safeguarding UPI PINs & OTPs.",
            "## The 5% Per Month Sahukar Trap\\nInformal village moneylenders often say: 'Take Rs 10,000, interest is just 5 rupees per 100 per month.' That sounds small, but 5% per month equals 60% per year simple interest! If unpaid and compounded, a Rs 20,000 loan balloons into Rs 64,000 in just two years. Always compare with SHG internal credit (12% per year) or institutional bank credit (7% to 9% per year).\\n\\n## Illegal Coercion & RBI Protection\\nUnlicensed moneylenders and predatory digital loan apps use harassment, abusive calls, and public humiliation. Under Indian law and RBI Fair Practice Directives, lenders cannot call before 8 AM or after 7 PM, cannot intimidate family members, and must possess a valid NBFC or banking license.\\n\\n## Digital Safety: Never Share OTP or UPI PIN\\n1. A UPI PIN is required ONLY to SEND money, never to RECEIVE money or government subsidies.\\n2. Bank staff, SHG officers, and government agents will NEVER ask for your OTP or password.\\n3. Never install unknown APK file links sent over WhatsApp promising instant Rs 50,000 credit.",
            [
                ("A moneylender charging 5% per month is charging what yearly interest rate?", ["5%", "12%", "60%", "100%"], 2, "5% per month multiplied by 12 months equals 60% per year!"),
                ("When receiving money via UPI or DBT subsidy, do you need to enter your UPI PIN?", ["Never. A UPI PIN is only entered to send/deduct money", "Yes, always", "Only for amounts above Rs 500", "Yes, to verify identity"], 0, "Entering a UPI PIN authorizes a withdrawal from your account. You NEVER enter a PIN to receive money."),
                ("Can legitimate bank or SHG recovery agents call you late at night or harass family members?", ["No, strictly prohibited by RBI Fair Practice Code", "Yes, if payment is 1 day late", "Yes, at any hour", "Only on Sundays"], 0, "RBI regulations strictly prohibit harassment, abusive language, and late-night calls."),
                ("What should you do if an unknown caller promises an instant Rs 1 Lakh loan if you share an OTP?", ["Hang up immediately and never share the OTP", "Share the OTP quickly", "Give your ATM card details too", "Forward the SMS to friends"], 0, "Legitimate lenders never request OTPs. Sharing an OTP gives fraudsters access to your funds."),
                ("What makes informal moneylenders dangerous even if they are neighbors?", ["They charge compound interest reaching 36% to 120% without clear records", "They give too many receipts", "They report to RBI", "They give free tractors"], 0, "Informal moneylenders charge exorbitant unrecorded rates that create generational debt traps."),
                ("What is the official helpline number in India to report digital financial cyber fraud?", ["1930", "100", "108", "139"], 0, "1930 is the national cybercrime financial fraud reporting helpline in India."),
                ("Why should you never click on WhatsApp links downloading unknown '.apk' loan apps?", ["They install spyware that steals phone contacts and photos for blackmail", "They reduce phone battery life slightly", "They change your ringtone", "They delete your selfies"], 0, "Illegal loan apps steal contacts and pictures to blackmail borrowers."),
                ("If an informal lender demands your land papers or ration card as hostage, what does this violate?", ["Money Lending Act and RBI consumer protection directives", "Nothing, it is standard practice", "Traffic rules", "Crop insurance rules"], 0, "Taking government ration cards or unrecorded land documents hostage is illegal under state money lending regulations."),
            ]
        ),
        "hi": (
            "साहूकार के जाल और डिजिटल धोखाधड़ी से बचाव",
            "महीने के 5% ब्याज का असली सच, अवैध वसूली के विरुद्ध अधिकार, और यूपीआई पिन व ओटीपी की सुरक्षा।",
            "## महीने का 5% ब्याज (साहूकार का चक्रव्यूह)\\nगाँव में अक्सर कहा जाता है: '10,000 रुपये ले लो, ब्याज सिर्फ़ 5 रुपये सैकड़ा महीना है।' यह सुनने में कम लगता है, लेकिन महीने का 5% यानी साल का 60% ब्याज होता है! यदि ब्याज न चुकाया जाए, तो 20,000 रुपये का कर्ज़ 2 साल में बढ़कर 64,000 रुपये हो जाता है। हमेशा बचत गट (12% वार्षिक) या बैंक ऋण (7% से 9% वार्षिक) से तुलना करें।\\n\\n## अवैध दबाव और आरबीआई सुरक्षा\\nबिना लाइसेंस वाले साहूकार और फ़र्ज़ी लोन ऐप गाली-गलौज और अपमान का सहारा लेते हैं। कानून और आरबीआई फेयर प्रैक्टिस कोड के अनुसार, कोई भी ऋणदाता सुबह 8 बजे से पहले या शाम 7 बजे के बाद कॉल नहीं कर सकता और न ही परिवार को धमका सकता है।\\n\\n## डिजिटल सुरक्षा के नियम\\n1. यूपीआई पिन (UPI PIN) केवल पैसे भेजने के लिए दर्ज किया जाता है, पैसे या सरकारी सब्सिडी पाने के लिए कभी नहीं!\\n2. बैंक, बचत गट या सरकारी अधिकारी कभी आपका ओटीपी या पासवर्ड नहीं माँगते।\\n3. व्हाट्सएप पर बिना सोचे-समझे किसी अज्ञात लोन ऐप (APK) को डाउनलोड न करें।",
            [
                ("महीने में 5% ब्याज लेने वाला साहूकार साल में कितना ब्याज लेता है?", ["5%", "12%", "60%", "100%"], 2, "5% प्रति माह x 12 महीने = साल का 60% साधारण ब्याज!"),
                ("यूपीआई या सरकारी सब्सिडी का पैसा प्राप्त करते समय क्या आपको यूपीआई पिन डालना चाहिए?", ["कभी नहीं! पिन केवल पैसे भेजने (कटने) के लिए डाला जाता है", "हाँ, हमेशा", "केवल 500 रुपये से अधिक पर", "पहचान के लिए"], 0, "यूपीआई पिन डालने से आपके खाते से पैसे कटते हैं। पैसे प्राप्त करने के लिए पिन की ज़रूरत नहीं होती।"),
                ("क्या बैंक या रिकवरी एजेंट देर रात कॉल कर सकते हैं या परिवार को धमका सकते हैं?", ["नहीं, आरबीआई नियमों के तहत यह पूरी तरह गैर-कानूनी है", "हाँ, 1 दिन की देरी पर भी", "हाँ, किसी भी समय", "केवल रविवार को"], 0, "आरबीआई नियमों के अनुसार सुबह 8 से पहले और शाम 7 के बाद वसूली कॉल करना और धमकाना सख्त मना है।"),
                ("यदि कोई अनजान व्यक्ति ओटीपी माँगकर 1 लाख का लोन देने का वादा करे तो क्या करें?", ["तुरंत कॉल काटें और ओटीपी किसी को न दें", "जल्दी से ओटीपी बता दें", "एटीएम का पिन भी दे दें", "दोस्तों को मैसेज भेजें"], 0, "ओटीपी कभी किसी से साझा नहीं करना चाहिए। असली बैंक कभी ओटीपी नहीं माँगते।"),
                ("गाँव के साहूकार से कर्ज़ लेना ख़तरनाक क्यों होता है?", ["क्योंकि वे 36% से 120% तक चक्रवृद्धि ब्याज वसूलते हैं", "क्योंकि वे पक्की रसीद देते हैं", "क्योंकि वे आरबीआई को रिपोर्ट करते हैं", "क्योंकि वे मुफ़्त ट्रैक्टर देते हैं"], 0, "साहूकार का महँगा ब्याज पीढ़ियों तक चलने वाले कर्ज़ के जाल में फँसा देता है।"),
                ("भारत में डिजिटल वित्तीय धोखाधड़ी की शिकायत दर्ज करने का आधिकारिक साइबर हेल्पलाइन नंबर क्या है?", ["1930", "100", "108", "139"], 0, "1930 भारत सरकार का राष्ट्रीय साइबर वित्तीय अपराध हेल्पलाइन नंबर है।"),
                ("व्हाट्सएप पर आए अनजान लोन ऐप (APK) लिंक पर क्लिक क्यों नहीं करना चाहिए?", ["क्योंकि वे आपके फोन के कॉन्टैक्ट और फोटो चुराकर ब्लैकमेल करते हैं", "क्योंकि फोन की बैटरी कम होती है", "क्योंकि रिंगटोन बदल जाती है", "क्योंकि सेल्फी डिलीट होती है"], 0, "फ़र्ज़ी लोन ऐप आपके निजी डेटा की चोरी करके परिवार को परेशान करते हैं।"),
                ("यदि साहूकार राशन कार्ड या ज़मीन के कागज़ात गिरवी रखकर बंधक बनाए तो यह क्या है?", ["अवैध साहूकारी कानून का उल्लंघन", "सामान्य नियम", "यातायात नियम", "फसल बीमा नियम"], 0, "राशन कार्ड या बिना पंजीकरण ज़मीन के दस्तावेज़ ज़ब्त करना कानूनन अपराध है।"),
            ]
        ),
        "mr": (
            "सावकारी सापळा आणि सायबर फसवणुकीपासून सावध राहा",
            "दरमहा 5% व्याजाचे भयानक वास्तव, बेकायदेशीर वसुलीविरुद्ध अधिकार, आणि यूपीआय पिन व ओटीपीचे रक्षण.",
            "## दरमहा 5% सावकारी सापळा\\nगावात सावकार म्हणतात: '10,000 रुपये घ्या, व्याज फक्त दरमहा शेकडा 5 रुपये.' हे ऐकायला कमी वाटते, पण दरमहा 5% म्हणजे वर्षाला 60% व्याज होते! व्याज चक्रवाढ पद्धतीने वाढल्यास 20,000 रुपयांचे कर्ज दोन वर्षांत 64,000 रुपये होते. नेहमी बचत गट (12% वार्षिक) किंवा बँक कर्जाची (7% ते 9% वार्षिक) निवड करा.\\n## बेकायदेशीर वसुली आणि आरबीआय संरक्षण\\nपरवाना नसलेले सावकार आणि बनावट लोन ॲप्स कुटुंबाला धमकावतात. आरबीआयच्या नियमांनुसार सकाळी 8 च्या आधी आणि संध्याकाळी 7 च्या नंतर कोणालाही फोन करण्यास किंवा धमकावण्यास सक्त मनाई आहे.\\n## डिजिटल सुरक्षेचे तीन सुवर्णनियम\\n1. यूपीआय पिन (UPI PIN) फक्त पैसे पाठवण्यासाठी असतो, पैसे किंवा सबसिडी मिळवण्यासाठी कधीही पिन टाकावा लागत नाही!\\n2. बँकेचे किंवा बचत गटाचे अधिकारी कधीही तुमचा ओटीपी विचारत नाहीत.\\n3. व्हॉट्सॲपवर आलेल्या अनोळखी लोन ॲपच्या (APK) लिंकवर कधीही क्लिक करू नका.",
            [
                ("दरमहा 5% व्याज घेणारा सावकार वर्षाला किती व्याज आकारतो?", ["5%", "12%", "60%", "100%"], 2, "दरमहा 5% x 12 महिने = वर्षाला 60% व्याज होते!"),
                ("यूपीआय किंवा सरकारी सबसिडीचे पैसे खात्यात जमा होताना यूपीआय पिन टाकावा लागतो का?", ["कधीही नाही! पिन फक्त पैसे पाठवतानाच (खात्यातून जाताना) टाकावा लागतो", "हो, नेहमी", "फक्त 500 रुपयांपेक्षा जास्त रकमेवर", "ओळखीसाठी"], 0, "पैसे मिळवण्यासाठी कधीही यूपीआय पिन टाकावा लागत नाही."),
                ("बँकेचे किंवा वसुली एजंट रात्री फोन करून कुटुंबाला धमकावू शकतात का?", ["नाही, आरबीआय नियमांनुसार हे पूर्णपणे बेकायदेशीर आहे", "हो, 1 दिवस उशीर झाला तरी चालते", "कोणत्याही वेळी चालते", "फक्त रविवारी"], 0, "आरबीआय नियमांनुसार सकाळी 8 पूर्वी आणि संध्याकाळी 7 नंतर वसुली फोन करण्यास बंदी आहे."),
                ("अनोळखी व्यक्तीने ओटीपी दिल्यास 1 लाख कर्ज देण्याचे आमिष दाखवल्यास काय करावे?", ["फोन लगेच कट करावा आणि ओटीपी कोणालाही देऊ नये", "ओटीपी लगेच द्यावा", "एटीएम पिनही द्यावा", "मित्रांना मेसेज पाठवावा"], 0, "ओटीपी कधीही कोणाला सांगू नये, यामुळे बँक खात्यातील पैसे चोरीला जातात."),
                ("स्थानिक सावकाराकडून कर्ज घेणे धोकादायक का ठरते?", ["ते 36% ते 120% पर्यंत अवाजवी चक्रवाढ व्याज आकारतात", "ते पक्की पावती देतात म्हणून", "ते आरबीआयला कळवतात", "ते मोफत ट्रॅक्टर देतात"], 0, "सावकाराचे अवाजवी व्याज कुटुंबाला पिढ्यानपिढ्या कर्जाच्या सापळ्यात अडकवते."),
                ("भारतात डिजिटल सायबर फसवणुकीची तक्रार नोंदवण्यासाठी अधिकृत राष्ट्रीय क्रमांक कोणता?", ["1930", "100", "108", "139"], 0, "1930 हा सायबर वित्तीय गुन्ह्यांची तक्रार नोंदवण्याचा राष्ट्रीय हेल्पलाइन क्रमांक आहे."),
                ("व्हॉट्सॲपवर आलेल्या अनोळखी लोन ॲप (APK) वर क्लिक का करू नये?", ["ते फोनमधील संपर्क व फोटो चोरून ब्लॅकमेल करतात", "फोनची बॅटरी संपते", "रिंगटोन बदलते", "फोटो डिलीट होतात"], 0, "बनावट लोन ॲप्स खाजगी माहिती चोरून कुटुंबाला मानसिक त्रास देतात."),
                ("सावकाराने रेशन कार्ड किंवा जमिनीचे कागदपत्रे बेकायदेशीरपणे ताब्यात ठेवणे काय आहे?", ["सावकारी प्रतिबंधक कायद्यानुसार गुन्हा", "नेहमीचा नियम", "वाहतूक नियम", "विमा नियम"], 0, "रेशन कार्ड किंवा कागदपत्रे डांबून ठेवणे हा कायद्याने गुन्हा आहे."),
            ]
        ),
    },
    "shg-rules": {
        "en": (
            "Self-Help Groups (SHGs): Thrift, Meetings & Joint Liability",
            "How SHG-Bank linkage works, group consensus, recording thrift meetings, and joint liability guarantees.",
            "## The Core of an SHG: Trust and Thrift\\nA Self-Help Group (SHG) typically consists of 10 to 20 rural women from similar socio-economic backgrounds. The group meets weekly or monthly. At each meeting, every member contributes a mandatory small thrift saving (e.g., Rs 100). This collective pool forms the group corpus.\\n\\n## Internal Lending Before Bank Linkage\\nBefore approaching a commercial bank, the SHG lends money internally to its own members for urgent health, crop input, or school fees needs at low interest (usually 1% to 1.5% per month). The interest earned stays within the group and grows the corpus.\\n\\n## SHG-Bank Linkage (NABARD Model)\\nAfter maintaining spotless meeting attendance and disciplined repayment for 6 months, the SHG is graded by a bank or field officer. The bank sanctions a collateral-free group loan linked to the group's savings ratio (up to 4x to 8x of savings corpus). Members share joint liability, meaning all members collectively guarantee repayment.",
            [
                ("What is the typical size of a women's Self-Help Group (SHG)?", ["10 to 20 members", "2 members", "100 to 200 members", "500 members"], 0, "SHGs are small affinity groups of 10 to 20 members ensuring close mutual trust."),
                ("Where does the interest earned on SHG internal loans go?", ["It stays in the SHG corpus and increases group wealth", "The bank branch manager takes it", "The village head takes it", "It is paid to moneylenders"], 0, "All internal interest stays in the group savings pool and benefits all members equally."),
                ("What does 'Joint Liability' mean in an SHG loan?", ["All group members collectively guarantee and share responsibility for repayment", "Only the leader is responsible", "The bank pays if a member defaults", "No one needs to repay"], 0, "Joint liability means social peer support and collective group responsibility for full repayment."),
                ("What is the first step before an SHG can receive a bank linkage loan?", ["Regular meetings, thrift savings, and internal loans for at least 6 months", "Buying a commercial tractor", "Paying cash to a loan broker", "Filing a court case"], 0, "Banks require proof of 6 months of disciplined group meetings and savings before sanctioning linkage."),
                ("What key records must the SHG leader maintain during each meeting?", ["Attendance register, savings collection register, and loan ledger", "Personal grocery bills", "Voter list only", "Electricity bills"], 0, "Accurate registers of attendance, savings, and repayments are essential for institutional credibility."),
                ("Why are SHG loans collateral-free?", ["Social peer trust and group guarantee act as collateral", "The government gave the bank gold", "Because loans never have to be repaid", "Because land is transferred to the bank"], 0, "Social collateral (group mutual guarantee) replaces physical assets for rural women."),
                ("What happens if one member faces genuine crop failure and cannot pay her monthly share?", ["The group discusses, supports her temporarily from corpus, and reschedules", "She is sent to jail immediately", "Her house is seized", "The group is dissolved"], 0, "True SHGs practice mutual solidarity, offering restructuring and peer support during genuine distress."),
                ("How does using the FinanceSaathi Community Hub assist SHG leaders?", ["It records digital attendance, member thrift, and internal loans transparently", "It charges interest on attendance", "It locks the village bank", "It sells lottery tickets"], 0, "Digital record keeping ensures zero book-tampering and builds institutional bank readiness."),
            ]
        ),
        "hi": (
            "स्वयं सहायता समूह (SHG): बचत, बैठकें और संयुक्त देयता",
            "एसएचजी-बैंक लिंकेज कैसे काम करता है, समूह सहमति, नियमित बैठकें, और संयुक्त देयता गारंटी।",
            "## बचत गट की नींव: विश्वास और नियमित बचत\\nएक स्वयं सहायता समूह (SHG) में आमतौर पर 10 से 20 महिलाएँ शामिल होती हैं। समूह की हर हफ़्ते या महीने में नियमित बैठक होती है। बैठक में हर सदस्य तय बचत (जैसे 100 रुपये) जमा करता है, जिससे समूह का साझा कोष (Corpus) बनता है।\\n\\n## आंतरिक ऋण (Internal Lending)\\nबैंक से कर्ज़ लेने से पहले, समूह अपने कोष से ही सदस्यों को बीमारी, बीज-खाद या बच्चों की पढ़ाई के लिए कम ब्याज (1% प्रति माह) पर आंतरिक ऋण देता है। इस ब्याज की पूरी कमाई समूह के खाते में ही रहती है।\\n\\n## बैंक लिंकेज (नाबार्ड मॉडल)\\nकम से कम 6 महीने तक नियमित बैठकों और ईमानदारी से आंतरिक ऋण चुकाने के बाद, बैंक समूह को बचत के 4 से 8 गुना तक बिना गारंटी (Collateral-free) का ऋण देता है। इसमें संयुक्त देयता (Joint Liability) होती है, यानी पूरा समूह मिलकर ऋण वापसी की ज़िम्मेदारी लेता है।",
            [
                ("एक महिला स्वयं सहायता समूह में आमतौर पर कितने सदस्य होते हैं?", ["10 से 20 सदस्य", "2 सदस्य", "100 से 200 सदस्य", "500 सदस्य"], 0, "पारस्परिक विश्वास और अनुशासन बनाए रखने के लिए समूह में 10 से 20 सदस्य होते हैं।"),
                ("समूह द्वारा सदस्यों को दिए गए आंतरिक ऋण पर मिलने वाला ब्याज कहाँ जाता है?", ["वह समूह के कोष में रहता है और समूह की पूँजी बढ़ाता है", "बैंक मैनेजर ले लेता है", "ग्राम प्रधान ले लेता है", "साहूकार को जाता है"], 0, "आंतरिक ब्याज समूह के साझा कोष में जमा होता है और सभी सदस्यों का लाभ बढ़ाता है।"),
                ("एसएचजी ऋण में 'संयुक्त देयता' (Joint Liability) का क्या अर्थ है?", ["सभी सदस्य मिलकर ऋण चुकाने की सामूहिक ज़िम्मेदारी लेते हैं", "केवल समूह अध्यक्ष ज़िम्मेदार होता है", "बैंक खुद भरता है", "किसी को चुकाने की ज़रूरत नहीं होती"], 0, "संयुक्त देयता का अर्थ है सामाजिक एकजुटता और समय पर ऋण वापसी की सामूहिक गारंटी।"),
                ("बैंक से लिंकेज ऋण प्राप्त करने के लिए समूह को पहले क्या करना होता है?", ["कम से कम 6 महीने नियमित बैठक, बचत और आंतरिक लेन-देन", "नया ट्रैक्टर खरीदना", "दलाल को पैसे देना", "अदालत में मुक़दमा करना"], 0, "बैंक लिंकेज के लिए 6 महीने का अनुशासित और पारदर्शी रिकॉर्ड होना अनिवार्य है।"),
                ("हर बैठक में समूह अध्यक्ष को कौन-से मुख्य रजिस्टर अद्यतन रखने चाहिए?", ["उपस्थिति रजिस्टर, बचत रजिस्टर और ऋण बही-खाता", "घरेलू किराने का बिल", "केवल वोटर लिस्ट", "बिजली बिल"], 0, "उपस्थिति, बचत और ऋण का सही लिखित रिकॉर्ड ही बैंक में समूह की साख बनाता है।"),
                ("स्वयं सहायता समूहों को बिना ज़मीन या संपत्ति गिरवी रखे बैंक ऋण क्यों मिलता है?", ["क्योंकि सदस्यों का आपसी सामाजिक विश्वास ही गारंटी का काम करता है", "क्योंकि सरकार बैंक को सोना देती है", "क्योंकि ऋण वापस नहीं करना होता", "क्योंकि ज़मीन बैंक के नाम होती है"], 0, "समूह की सामाजिक गारंटी (Peer Collateral) भौतिक संपत्ति की जगह काम करती है।"),
                ("यदि किसी सदस्य की फसल नष्ट हो जाए और वह किस्त न दे पाए तो समूह को क्या करना चाहिए?", ["समूह बैठक में चर्चा कर राहत दे और किस्त की अवधि आगे बढ़ाए", "उसे तुरंत जेल भिजवाए", "उसका घर ज़ब्त करे", "समूह बंद कर दे"], 0, "सच्चा बचत गट संकट के समय सदस्य का साथ देता है और पुनर्भुगतान की नई योजना बनाता है।"),
                ("फाइनेंस साथी का 'कम्युनिटी हब' समूह अध्यक्षों की क्या मदद करता है?", ["बैठक उपस्थिति, नियमित बचत और आंतरिक ऋण का पारदर्शी डिजिटल रिकॉर्ड रखता है", "उपस्थिति पर जुर्माना लगाता है", "बैंक बंद कर देता है", "लॉटरी बेचता है"], 0, "डिजिटल लेजर से हेराफेरी की गुंजाइश खत्म होती है और बैंक लिंकेज आसान होता है।"),
            ]
        ),
        "mr": (
            "महिला बचत गट (SHG): बचत, बैठका आणि संयुक्त जबाबदारी",
            "बचत गट-बँक लिंकेज कसे चालते, समूहाची सहमती, बैठकांचे नियोजन, आणि संयुक्त हमीची ताकद.",
            "## बचत गटाचा गाभा: विश्वास आणि नियमित बचत\\nएका बचत गटात साधारणपणे 10 ते 20 महिला सदस्य असतात. गट दर आठवड्याला किंवा महिन्याला बैठक घेतो. बैठकीत प्रत्येक सदस्य ठरलेली बचत (उदा. 100 रुपये) जमा करतो. या पैशातून गटाचा स्वतःचा निधी (Corpus) तयार होतो.\\n## अंतर्गत कर्जवाटप\\nबँकेकडे जाण्यापूर्वी गट आपल्याच सदस्यांना आजारपण, खते-बियाणे किंवा मुलांच्या शिक्षणासाठी माफक व्याजाने (1% दरमहा) अंतर्गत कर्ज देतो. हे व्याज गटाच्याच खात्यात जमा राहून गटाचे भांडवल वाढवते.\\n## बँक लिंकेज (नाबार्ड पद्धत)\\nसलग 6 महिने नियमित बैठका आणि पारदर्शक व्यवहार राखल्यानंतर बँक गटाला बचतीच्या 4 ते 8 पट विनातारण कर्ज मंजूर करते. यात संयुक्त जबाबदारी (Joint Liability) असते, म्हणजेच कर्ज वेळेवर फेडण्याची जबाबदारी संपूर्ण गटाची असते.",
            [
                ("महिला बचत गटात साधारणपणे किती सदस्य असतात?", ["10 ते 20 सदस्य", "2 सदस्य", "100 ते 200 सदस्य", "500 सदस्य"], 0, "परस्पर विश्वास टिकवण्यासाठी बचत गटात 10 ते 20 सदस्य असतात."),
                ("बचत गटातील अंतर्गत कर्जावर मिळणारे व्याज कोणाकडे जाते?", ["ते गटाच्याच निधीत राहते आणि गटाचे भांडवल वाढवते", "बँक मॅनेजर घेतो", "सरपंच घेतो", "सावकाराला दिले जाते"], 0, "अंतर्गत कर्जाचे सर्व व्याज गटाच्याच खात्यात राहून सर्व महिलांचा फायदा करते."),
                ("बचत गटाच्या कर्जात 'संयुक्त जबाबदारी' म्हणजे काय?", ["कर्ज परतफेडीची सामूहिक जबाबदारी सर्व सदस्यांची मिळून असते", "फक्त अध्यक्षांची जबाबदारी असते", "बँक पैसे भरते", "कोणीही पैसे भरायचे नसतात"], 0, "संयुक्त जबाबदारी म्हणजे संपूर्ण गटाची सामाजिक हमी आणि एकत्र परतफेड."),
                ("बँकेकडून लिंकेज कर्ज मिळवण्यासाठी गटाने सुरुवातीला काय करणे आवश्यक आहे?", ["किमान 6 महिने नियमित बैठका, बचत आणि अंतर्गत व्यवहार", "ट्रॅक्टर खरेदी करणे", "दलालाला पैसे देणे", "न्यायालयात जाणे"], 0, "बँक लिंकेजसाठी किमान 6 महिन्यांचे शिस्तबद्ध कामकाज आवश्यक असते."),
                ("प्रत्येक बैठकीत कोणती नोंदवही अद्ययावत ठेवणे अत्यंत गरजेचे आहे?", ["हजेरी वही, बचत नोंदवही आणि कर्ज खातेवही", "घरगुती किराणा बिल", "फक्त मतदार यादी", "लाईट बिल"], 0, "हजेरी, बचत आणि कर्जाच्या नोंदी पारदर्शक असणे हाच बँकेचा विश्वास असतो."),
                ("बचत गटांना विनातारण (तारणाशिवाय) बँक कर्ज का मिळते?", ["गटातील महिलांचा सामाजिक विश्वास आणि हमी हीच तारण असते", "सरकार बँकेला सोने देते म्हणून", "कर्ज फेडायचे नसते म्हणून", "जमीन बँकेच्या नावावर होते म्हणून"], 0, "गटाची सामाजिक हमी भौतिक मालमत्तेची जागा घेते."),
                ("एखाद्या सदस्याचे पीक वाया गेल्याने हप्ता भरता न आल्यास गटाने काय करावे?", ["बैठकीत चर्चा करून मदत करावी आणि हप्त्याची मुदत वाढवून द्यावी", "तिला तुरुंगात पाठवावे", "घर जप्त करावे", "गट बंद करावा"], 0, "अडचणीच्या वेळी सदस्याला आधार देऊन फेरनियोजन करणे हेच बचत गटाचे ब्रीद आहे."),
                ("फायनान्स साथीच्या 'कम्युनिटी हब' मुळे बचत गट प्रमुखांना काय मदत होते?", ["हजेरी, बचत आणि अंतर्गत कर्जाच्या पारदर्शक डिजिटल नोंदी राहतात", "हजेरीवर दंड आकारला जातो", "बँक बंद होते", "लॉटरी विकली जाते"], 0, "डिजिटल नोंदीमुळे हिशेबात चूक होत नाही आणि बँक लिंकेज वेगाने होते."),
            ]
        ),
    },
    "kisan-credit": {
        "en": (
            "Kisan Credit, Crop Cycles & Agricultural Cashflows",
            "Kisan Credit Cards (KCC), interest subvention (4% net rate), harvest-linked repayments, and gestation periods.",
            "## What is Kisan Credit Card (KCC)?\\nThe Kisan Credit Card scheme provides timely short-term credit to farmers for crop cultivation, post-harvest expenses, and farm asset maintenance. Rather than taking multiple loans, farmers get a revolving credit facility based on their land holding and cropping pattern.\\n\\n## Interest Subvention: 7% down to 4%\\nThe headline agricultural lending rate is 7.0% per annum. However, the Government of India provides a 3.0% Prompt Repayment Incentive (Subvention). If a farmer repays their crop loan within the due date (usually after harvest mandi sale), the net effective interest rate drops to just 4.0% per annum!\\n\\n## Gestation & Harvest Bullet Amortization\\nUnlike monthly retail salaries, agricultural cash flows only arrive after harvest (Kharif in Oct-Nov, Rabi in Mar-Apr). A harvest-bullet repayment structure charges only nominal interest during the crop gestation period, with the principal repayment timed exactly with mandi sales.",
            [
                ("Under the Government Prompt Repayment Incentive, what is the net interest rate on KCC crop loans?", ["4.0% per annum", "12.0% per annum", "24.0% per annum", "0%"], 0, "With the 3% prompt repayment subvention, the net effective rate drops to 4% p.a."),
                ("How does a harvest-bullet repayment schedule match a farmer's real life?", ["Principal is repaid after harvest when crops are sold in the mandi", "Farmer pays equal cash daily", "Farmer pays all money during sowing", "No repayment is ever required"], 0, "Bullet repayments align debt discharge with actual mandi harvest cash inflow."),
                ("What does the 'crop gestation period' mean in agricultural lending?", ["The duration between seed sowing and crop harvest when no income exists", "The time a tractor is parked", "The monsoon holiday", "The winter season only"], 0, "Gestation is the growth period when crops require investment but generate no cash."),
                ("Why is taking an informal loan at 3% per month for crop seeds disastrous?", ["3% per month is 36% per year, which wipes out all farm profit", "Informal loans give bad seeds", "Banks don't allow fertilizers", "Seeds don't germinate with cash"], 0, "At 36% to 60% per year, informal interest eats up the entire crop revenue."),
                ("What documents are typically required to verify landholding for Kisan credit?", ["Land Revenue Record (7/12 Extract, Khasra/Khatauni) and Aadhaar", "Only a school certificate", "Only a driving license", "Railway ticket"], 0, "State land revenue records prove ownership or cultivation rights for agri credit."),
                ("Who is eligible for KCC animal husbandry and fisheries working capital?", ["Farmers rearing dairy cattle, poultry, sheep, or fish", "Only software engineers", "Only tractor showroom owners", "Foreign tourists"], 0, "KCC has been expanded to support dairy, livestock, and fishery working capital needs."),
                ("What should a farmer do immediately if an unseasonal hailstorm damages crops?", ["Notify crop insurance (PMFBY) and bank within 72 hours for claim appraisal", "Take an informal loan at 10% per month", "Abandon the farmland", "Sell all livestock secretly"], 0, "PMFBY rules require intimate notification within 72 hours of localized disaster."),
                ("How does the FinanceSaathi Harvest Planner help smallholder farmers?", ["It customizes repayment installments according to crop harvest months", "It predicts the weather with 100% certainty", "It forces daily bank visits", "It cancels land ownership"], 0, "Customized harvest schedules protect farmers from default during crop growth months."),
            ]
        ),
        "hi": (
            "किसान क्रेडिट, फसल चक्र और कृषि नकदी प्रवाह",
            "किसान क्रेडिट कार्ड (KCC), 4% शुद्ध ब्याज दर (ब्याज छूट), कटाई-आधारित भुगतान, और फसल रख-रखाव अवधि।",
            "## किसान क्रेडिट कार्ड (KCC) क्या है?\\nकिसान क्रेडिट कार्ड योजना किसानों को फसल बुवाई, कीटनाशक, खाद और कटाई के खर्च के लिए समय पर सस्ता ऋण उपलब्ध कराती है। इसमें ज़मीन के रकबे और फसल के प्रकार के अनुसार एक परिक्रामी (Revolving) ऋण सीमा मिलती है।\\n\\n## 3% ब्याज छूट: 7% से घटकर 4%\\nकृषि ऋण की मानक दर 7% प्रति वर्ष होती है। केंद्र सरकार समय पर भुगतान करने वाले किसानों को 3% का त्वरित पुनर्भुगतान प्रोत्साहन (Subvention) देती है। समय पर मंडी बिक्री के बाद भुगतान करने पर शुद्ध ब्याज केवल 4% वार्षिक रह जाता है!\\n\\n## फसल कटाई एकमुश्त भुगतान (Harvest Bullet)\\nकिसानों को हर महीने वेतन नहीं मिलता। उनकी आमदनी फसल कटने के बाद (खरीफ में अक्टूबर-नवंबर, रबी में मार्च-अप्रैल) होती है। फसल चक्र के दौरान केवल नाममात्र का ब्याज लिया जाता है और मूलधन मंडी में फसल बिकने पर एकमुश्त चुकाया जाता है।",
            [
                ("समय पर भुगतान करने पर किसान क्रेडिट कार्ड (KCC) पर शुद्ध प्रभावी ब्याज दर कितनी होती है?", ["4.0% प्रति वर्ष", "12.0% प्रति वर्ष", "24.0% प्रति वर्ष", "0%"], 0, "3% की सरकारी ब्याज छूट मिलने के बाद शुद्ध ब्याज केवल 4% वार्षिक रह जाता है।"),
                ("फसल कटाई आधारित भुगतान (Harvest Bullet) किसान के लिए क्यों बेहतर है?", ["क्योंकि मूलधन मंडी में फसल बिकने के बाद दिया जाता है जब हाथ में पैसे होते हैं", "क्योंकि रोज़ नकद देना पड़ता है", "क्योंकि बुवाई के समय सारा पैसा देना होता है", "क्योंकि कभी चुकाना नहीं होता"], 0, "यह व्यवस्था फसल बिक्री के समय पर आधारित होने से किसान पर दबाव नहीं डालती।"),
                ("कृषि ऋण में 'फसल रख-रखाव अवधि' (Crop Gestation Period) का क्या अर्थ है?", ["बुवाई से लेकर कटाई के बीच का समय जब खेत से कोई आमदनी नहीं होती", "ट्रैक्टर खड़े रहने का समय", "मानसून की छुट्टी", "केवल सर्दी का मौसम"], 0, "यह वह समय है जब फसल में खाद-पानी लगता है लेकिन फसल बिकने तक कोई आय नहीं होती।"),
                ("फसल के लिए साहूकार से महीने के 3% ब्याज पर कर्ज़ लेना क्यों ख़तरनाक है?", ["क्योंकि महीने का 3% यानी साल का 36% ब्याज पूरी फसल का मुनाफ़ा खा जाता है", "क्योंकि साहूकार ख़राब बीज देता है", "क्योंकि बैंक खाद नहीं देते", "क्योंकि फसल नहीं उगती"], 0, "साल का 36% ब्याज भरने पर किसान के पास फसल बेचने के बाद कुछ नहीं बचता।"),
                ("किसान क्रेडिट कार्ड के लिए ज़मीन के स्वामित्व का प्रमाण देने वाला मुख्य दस्तावेज़ कौन-सा है?", ["भू-राजस्व अभिलेख (7/12 खतौनी / खसरा) और आधार कार्ड", "केवल स्कूल का प्रमाण पत्र", "केवल ड्राइविंग लाइसेंस", "रेलवे टिकट"], 0, "7/12 या खसरा-खतौनी से ज़मीन पर खेती का वैध अधिकार सिद्ध होता है।"),
                ("पशुपालन और डेयरी के लिए KCC ऋण की सुविधा किसे मिल सकती है?", ["दुधारू पशु, बकरी या मुर्गी पालन करने वाले छोटे किसानों को", "केवल सॉफ्टवेयर इंजीनियरों को", "केवल ट्रैक्टर शोरूम मालिकों को", "विदेशी पर्यटकों को"], 0, "केसीसी अब पशुपालन और डेयरी किसानों को भी कार्यशील पूँजी उपलब्ध कराता है।"),
                ("अचानक ओलावृष्टि या बाढ़ से फसल बर्बाद होने पर किसान को सबसे पहले क्या करना चाहिए?", ["72 घंटे के भीतर फसल बीमा (PMFBY) और बैंक को सूचना देनी चाहिए", "10% ब्याज पर नया कर्ज़ लेना चाहिए", "खेत छोड़ देना चाहिए", "पशु बेच देने चाहिए"], 0, "स्थानीय आपदा में बीमा क्लेम के लिए 72 घंटे के भीतर सूचना देना अनिवार्य है।"),
                ("फाइनेंस साथी का 'किसान हार्वेस्ट प्लानर' किसानों की क्या मदद करता है?", ["फसल कटाई के महीनों के अनुसार किस्तों का लचीला शेड्यूल बनाता है", "मौसम की गारंटी देता है", "रोज़ बैंक जाने पर मजबूर करता है", "ज़मीन के कागज़ रद्द करता है"], 0, "यह फसल चक्र के अनुसार किस्तों की योजना बनाकर किसान को डिफ़ॉल्ट से बचाता है।"),
            ]
        ),
        "mr": (
            "किसान क्रेडिट, पीक चक्र आणि कृषी रोख प्रवाह",
            "किसान क्रेडिट कार्ड (KCC), 4% निव्वळ व्याजदर (व्याज सवलत), पीक कापणीनंतर परतफेड, आणि वाढीचा काळ.",
            "## किसान क्रेडिट कार्ड (KCC) म्हणजे काय?\\nकिसान क्रेडिट कार्ड शेतकऱ्यांना पीक मशागत, खते, औषधे आणि मजुरीच्या खर्चासाठी माफक दरात वेळेवर कर्ज उपलब्ध करून देते. शेतजमिनीच्या क्षेत्रफळानुसार आणि पिकांच्या प्रकारानुसार ही मर्यादा ठरवली जाते.\\n## 3% सरकारी व्याज सवलत: 7% वरून 4%\\nकृषी कर्जाचा मूळ व्याजदर 7% वार्षिक असतो. केंद्र सरकार वेळेवर परतफेड करणाऱ्या शेतकऱ्यांना 3% व्याज सवलत देते. पीक बाजारात विकून मुदतीत पैसे भरल्यास प्रत्यक्ष व्याज फक्त 4% वार्षिक लागते!\\n## पीक कापणी एकरकमी परतफेड (Harvest Bullet)\\nशेतकऱ्याला दरमहा पगार नसतो. शेतीचा पैसा पीक निघाल्यावरच (खरीप ऑक्टोबर-नोव्हेंबर, रब्बी मार्च-एप्रिल) येतो. पीक शेतात उभे असेपर्यंत फक्त नाममात्र व्याज आणि पीक विकल्यावर मूळ मुद्दल अशी रचना शेतकरी हिताची ठरते.",
            [
                ("वेळेवर कर्ज फेडल्यास किसान क्रेडिट कार्ड (KCC) वरील निव्वळ व्याजदर किती असतो?", ["4.0% प्रति वर्ष", "12.0% प्रति वर्ष", "24.0% प्रति वर्ष", "0%"], 0, "3% व्याज सवलतीमुळे निव्वळ व्याज फक्त 4% वार्षिक लागते."),
                ("पीक कापणीनंतर एकरकमी परतफेड (Harvest Bullet) पद्धत शेतकऱ्यासाठी फायदेशीर का आहे?", ["कारण पीक बाजारात विकून पैसे हातात आल्यावरच मुद्दल भरावे लागते", "कारण रोज पैसे भरावे लागतात", "कारण पेरणीच्या वेळी सर्व पैसे भरावे लागतात", "कारण कधीच पैसे भरायचे नसतात"], 0, "पिकाचे पैसे हातात येण्याच्या वेळेनुसार कर्ज परतफेड असल्यामुळे शेतकऱ्यावर ताण येत नाही."),
                ("कृषी कर्जात 'पीक वाढीचा काळ' (Crop Gestation Period) म्हणजे काय?", ["पेरणीपासून पीक निघेपर्यंतचा काळ ज्या काळात कोणतेही शेती उत्पन्न नसते", "ट्रॅक्टर उभ्या राहण्याचा काळ", "पावसाळ्याची सुट्टी", "फक्त हिवाळा"], 0, "या काळात शेतात खर्च सुरू असतो पण उत्पन्न पीक निघाल्यावरच मिळते."),
                ("पिकासाठी सावकाराकडून दरमहा 3% व्याजाने कर्ज घेणे का धोकादायक आहे?", ["दरमहा 3% म्हणजे वर्षाला 36% व्याज शेतीचा संपूर्ण नफा संपवून टाकते", "सावकार खराब बियाणे देतो म्हणून", "बँक खते देत नाही म्हणून", "पीक उगवत नाही म्हणून"], 0, "वार्षिक 36% व्याज भरल्यास शेतकऱ्याच्या हातात काहीच शिल्लक राहत नाही."),
                ("किसान क्रेडिट कार्डसाठी शेतजमिनीच्या मालकीचा कोणता पुरावा लागतो?", ["7/12 उतारा, 8-अ उतारा आणि आधार कार्ड", "फक्त शाळेचा दाखला", "फक्त ड्रायव्हिंग लायसन्स", "रेल्वे तिकीट"], 0, "7/12 आणि 8-अ उताऱ्यावरून शेतीचा कायदेशीर हक्क सिद्ध होतो."),
                ("दुग्धव्यवसाय आणि पशुपालनासाठी KCC कर्जाचा लाभ कोणाला मिळतो?", ["दुभती जनावरे, शेळीपालन किंवा कुक्कुटपालन करणाऱ्या शेतकऱ्यांना", "फक्त सॉफ्टवेअर अभियंत्यांना", "फक्त ट्रॅक्टर विक्रेत्यांना", "विदेशी पर्यटकांना"], 0, "पशुपालन आणि दुग्धव्यवसायासाठी खेळत्या भांडवलासाठी KCC कर्ज उपलब्ध आहे."),
                ("अवेळी गारपीट किंवा पावसामुळे पीक वाया गेल्यास शेतकऱ्याने त्वरित काय करावे?", ["72 तासांच्या आत पीक विमा (PMFBY) कंपनी आणि बँकेला लेखी कळवावे", "10% व्याजाने नवीन कर्ज घ्यावे", "शेत सोडून द्यावे", "जनावरे विकून टाकावीत"], 0, "नुकसानीची भरपाई मिळण्यासाठी 72 तासांत विमा कंपनीला कळवणे बंधनकारक आहे."),
                ("फायनान्स साथीचा 'हार्वेस्ट प्लॅनर' शेतकऱ्यांना कशी मदत करतो?", ["पिकाच्या हंगामानुसार कर्ज परतफेडीचे लवचिक वेळापत्रक आखून देतो", "हवामानाची खात्री देतो", "रोज बँकेत जाण्यास सांगतो", "जमिनीचे कागदपत्र रद्द करतो"], 0, "हंगामाशी सुसंगत हप्ते आखल्यामुळे शेतकरी थकबाकीदार होण्यापासून वाचतो."),
            ]
        ),
    },
    "gov-schemes-insurance": {
        "en": (
            "Government Subsidies, DBT & Micro-Insurance",
            "Unlocking PM-KISAN, PM MUDRA, Ayushman Bharat, PMJJBY life cover (Rs 2 Lakh), and PMSBY accidental cover.",
            "## Direct Benefit Transfer (DBT) and Jan Dhan (PMJDY)\\nUnder the Jan Dhan, Aadhaar, and Mobile (JAM) trinity, government welfare benefits (such as PM-KISAN Rs 6,000/year and LPG subsidies) are credited directly into your bank account. No middleman or agent can take a cut. Ensure your bank account is Aadhaar-seeded with active NPCI mapping.\\n\\n## Social Security Insurance at Nominal Cost\\nEvery rural family should enroll in these two sovereign micro-insurance schemes:\\n1. Pradhan Mantri Suraksha Bima Yojana (PMSBY): Accidental death/disability cover of Rs 2,00,000 for just Rs 20 per year!\\n2. Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY): Life insurance cover of Rs 2,00,000 for death due to any cause for Rs 436 per year.\\n\\n## Ayushman Bharat (PM-JAY)\\nProvides cashless secondary and tertiary hospitalization cover of up to Rs 5 Lakh per eligible family per year at empaneled public and private hospitals, shielding families from catastrophic health debt.",
            [
                ("What annual financial assistance is provided directly to eligible farmers under PM-KISAN?", ["Rs 6,000 in three installments of Rs 2,000", "Rs 1,000 once", "Rs 50,000 monthly", "Rs 100"], 0, "PM-KISAN provides Rs 6,000 annually credited directly in three equal tranches."),
                ("How much is the accidental death insurance cover under PMSBY for just Rs 20/year?", ["Rs 2,00,000", "Rs 10,000", "Rs 50,000", "Zero"], 0, "PMSBY offers Rs 2 Lakh accidental insurance cover at an annual premium of only Rs 20."),
                ("How much life insurance cover does PMJJBY provide for a premium of Rs 436/year?", ["Rs 2,00,000 for death due to any cause", "Rs 10,000", "Rs 50,000", "Free medicines only"], 0, "PMJJBY provides Rs 2 Lakh life cover for any cause of death."),
                ("Under Ayushman Bharat (PM-JAY), what is the annual family hospitalization cover?", ["Up to Rs 5,00,000 per family per year", "Rs 20,000", "Rs 50,000", "Rs 10,00,000 per month"], 0, "PM-JAY provides up to Rs 5 Lakh cashless hospital treatment coverage per year."),
                ("What must you do to ensure DBT government benefits reach your bank account without issues?", ["Seed your Aadhaar with your bank account and enable NPCI mapping", "Pay cash to local agents", "Close the bank account", "Change mobile number every week"], 0, "Aadhaar linking and NPCI mapper activation enables seamless Direct Benefit Transfers."),
                ("Can any middleman charge a commission for depositing your PM-KISAN or DBT subsidy?", ["No, zero intermediary fees are allowed under law", "Yes, standard 20%", "Yes, 50%", "Only on festival days"], 0, "DBT funds are transferred directly into beneficiary bank accounts with zero commission."),
                ("What is the collateral requirement for small loans under the PM MUDRA Yojana (Shishu tier)?", ["Zero collateral required", "Land title mortgage", "Gold jewellery", "House sale deed"], 0, "MUDRA loans up to specified limits are completely collateral-free."),
                ("How does FinanceSaathi's Scheme Matcher help you?", ["It automatically checks your profile to show eligible schemes with direct official links", "It charges a scheme registration fee", "It changes your caste status", "It sells lottery coupons"], 0, "The scheme matcher filters official government welfare programs tailored to your profile."),
            ]
        ),
        "hi": (
            "सरकारी योजनाएँ, डीबीटी सब्सिडी और सूक्ष्म बीमा",
            "पीएम-किसान, मुद्रा योजना, आयुष्मान भारत, पीएमजेजेबीवाई जीवन बीमा (2 लाख) और पीएमएसबीवाई दुर्घटना बीमा।",
            "## प्रत्यक्ष लाभ अंतरण (DBT) और जन-धन\\nजन-धन, आधार और मोबाइल के माध्यम से सरकारी योजनाओं की राशि (जैसे पीएम-किसान के 6,000 रुपये और गैस सब्सिडी) सीधे आपके बैंक खाते में भेजी जाती है। कोई बिचौलिया इसमें कमीशन नहीं ले सकता। सुनिश्चित करें कि आपका खाता एनपीसीआई (NPCI) से आधार-सीडेड हो।\\n\\n## मामूली खर्च पर सामाजिक सुरक्षा बीमा\\nहर ग्रामीण परिवार को इन दो सरकारी बीमा योजनाओं में ज़रूर जुड़ना चाहिए:\\n1. प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY): सिर्फ़ 20 रुपये सालाना में 2 लाख रुपये का दुर्घटना बीमा!\\n2. प्रधानमंत्री जीवन ज्योति बीमा योजना (PMJJBY): 436 रुपये सालाना में किसी भी कारण से मृत्यु पर 2 लाख रुपये का जीवन बीमा।\\n\\n## आयुष्मान भारत (PM-JAY)\\nयह योजना पात्र परिवारों को सूचीबद्ध सरकारी व निजी अस्पतालों में हर साल 5 लाख रुपये तक का मुफ़्त (कैशलेस) इलाज उपलब्ध कराती है, जिससे परिवार भारी क़र्ज़ से बचता है।",
            [
                ("पीएम-किसान सम्मान निधि के तहत पात्र किसानों को सालाना कितनी सीधी आर्थिक मदद मिलती है?", ["6,000 रुपये (2,000 रुपये की तीन किस्तों में)", "1,000 रुपये", "50,000 रुपये प्रति माह", "100 रुपये"], 0, "पीएम-किसान योजना के तहत साल में 6,000 रुपये सीधे बैंक खाते में भेजे जाते हैं।"),
                ("सालाना केवल 20 रुपये के प्रीमियम पर PMSBY के तहत कितना दुर्घटना बीमा मिलता है?", ["2,00,000 रुपये", "10,00,000 रुपये", "50,000 रुपये", "शून्य"], 0, "पीएमएसबीवाई में केवल 20 रुपये में 2 लाख रुपये का दुर्घटना बीमा कवर मिलता है।"),
                ("PMJJBY के तहत 436 रुपये सालाना प्रीमियम पर कितना जीवन बीमा कवर मिलता है?", ["किसी भी कारण से मृत्यु पर 2,00,000 रुपये", "10,000 रुपये", "50,000 रुपये", "केवल मुफ़्त दवाइयाँ"], 0, "पीएमजेजेबीवाई में किसी भी कारण से मृत्यु होने पर 2 लाख रुपये की आर्थिक सुरक्षा मिलती है।"),
                ("आयुष्मान भारत (PM-JAY) के तहत प्रति परिवार सालाना कितने रुपये तक का मुफ़्त इलाज मिलता है?", ["5,00,000 रुपये तक प्रति परिवार सालाना", "20,000 रुपये", "50,000 रुपये", "10,00,000 रुपये"], 0, "आयुष्मान भारत में प्रति वर्ष 5 लाख रुपये तक का कैशलेस इलाज मिलता है।"),
                ("सरकारी योजनाओं का डीबीटी (DBT) पैसा सीधे खाते में पाने के लिए क्या करना ज़रूरी है?", ["बैंक खाते को आधार से लिंक और एनपीसीआई (NPCI) मैपिंग सक्रिय करना", "दलाल को कमीशन देना", "खाता बंद करना", "हर हफ़्ते नंबर बदलना"], 0, "आधार सीडिंग और एनपीसीआई मैपिंग से सरकारी पैसा बिना रुकावट सीधे खाते में आता है।"),
                ("क्या कोई एजेंट या बिचौलिया आपकी डीबीटी सब्सिडी या पीएम-किसान राशि में से कमीशन काट सकता है?", ["नहीं, किसी भी प्रकार का कमीशन काटना पूरी तरह गैर-कानूनी है", "हाँ, 20%", "हाँ, 50%", "त्यौहारों पर"], 0, "डीबीटी का पूरा पैसा सीधे लाभार्थी के खाते में आता है, कोई कटौती नहीं हो सकती।"),
                ("पीएम मुद्रा योजना (शिशु श्रेणी) के तहत कर्ज़ लेने के लिए क्या गिरवी रखना पड़ता है?", ["कुछ भी नहीं (बिना गारंटी/Collateral-Free)", "ज़मीन के कागज़", "सोने के गहने", "मकान की रजिस्ट्री"], 0, "मुद्रा योजना के तहत छोटे व्यापारियों को बिना गारंटी का ऋण दिया जाता है।"),
                ("फाइनेंस साथी का 'योजना पोर्टल' आपकी क्या मदद करता है?", ["आपकी प्रोफ़ाइल के अनुसार पात्र सरकारी योजनाएँ और आधिकारिक लिंक दिखाता है", "योजना का फ़ॉर्म भरने की फ़ीस लेता है", "जाति प्रमाण पत्र बदलता है", "लॉटरी कूपन बेचता है"], 0, "यह आपकी आय और व्यवसाय के आधार पर लाभकारी सरकारी योजनाएँ ढूँढने में मदद करता है।"),
            ]
        ),
        "mr": (
            "शासकीय योजना, डीबीटी सबसिडी आणि सूक्ष्म विमा",
            "पीएम-किसान, मुद्रा योजना, आयुष्यमान भारत, पीएमजेजेबीवाय जीवन विमा (2 लाख) आणि सुरक्षा विमा.",
            "## थेट लाभ हस्तांतरण (DBT) आणि जन-धन\\nजन-धन, आधार आणि मोबाईलच्या माध्यमातून शासकीय योजनांचे पैसे (उदा. पीएम-किसानचे 6,000 रुपये व गॅस सबसिडी) थेट तुमच्या बँक खात्यात जमा होतात. यात कोणताही मध्यस्थ कमिशन घेऊ शकत नाही. बँक खाते आधारशी लिंक आणि एनपीसीआय (NPCI) मॅपिंग असणे आवश्यक आहे.\\n## अत्यंत कमी खर्चात सामाजिक सुरक्षा विमा\\nप्रत्येक ग्रामीण कुटुंबाने या दोन योजनांचा लाभ घेतलाच पाहिजे:\\n1. प्रधानमंत्री सुरक्षा विमा योजना (PMSBY): वर्षाला फक्त 20 रुपयांत 2 लाख रुपयांचा अपघात विमा!\\n2. प्रधानमंत्री जीवन ज्योती विमा योजना (PMJJBY): वर्षाला 436 रुपयांत कोणत्याही कारणाने मृत्यू झाल्यास 2 लाख रुपयांचा जीवन विमा.\\n## आयुष्यमान भारत (PM-JAY)\\nपात्र कुटुंबांना दरवर्षी 5 लाख रुपयांपर्यंत मोफत (कॅशलेस) उपचारांची सुविधा मिळते, ज्यामुळे अचानक उद्भवणाऱ्या वैद्यकीय खर्चाच्या कर्जापासून संरक्षण मिळते.",
            [
                ("पीएम-किसान योजनेअंतर्गत पात्र शेतकऱ्यांना दरवर्षी किती थेट आर्थिक मदत मिळते?", ["6,000 रुपये (2,000 रुपयांच्या तीन हप्त्यांत)", "1,000 रुपये", "दरमहा 50,000 रुपये", "100 रुपये"], 0, "पीएम-किसान योजनेतून वर्षाला 6,000 रुपये थेट बँक खात्यात जमा होतात."),
                ("वर्षाला फक्त 20 रुपये प्रीमियम भरून PMSBY अंतर्गत किती रकमेचा अपघात विमा मिळतो?", ["2,00,000 रुपये", "10,00,000 रुपये", "50,000 रुपये", "शून्य"], 0, "पीएमएसबीवाय मध्ये वर्षाला फक्त 20 रुपयांत 2 लाख रुपयांचा अपघात विमा मिळतो."),
                ("PMJJBY अंतर्गत वर्षाला 436 रुपये भरल्यास किती रकमेचे जीवन विमा संरक्षण मिळते?", ["कोणत्याही कारणाने मृत्यू झाल्यास 2,00,000 रुपये", "10,000 रुपये", "50,000 रुपये", "फक्त मोफत औषधे"], 0, "पीएमजेजेबीवाय मध्ये कोणत्याही कारणाने मृत्यू झाल्यास कुटुंबाला 2 लाख रुपये मिळतात."),
                ("आयुष्यमान भारत (PM-JAY) अंतर्गत प्रत्येक कुटुंबाला दरवर्षी किती रकमेपर्यंत मोफत उपचार मिळतात?", ["दरवर्षी 5,00,000 रुपयांपर्यंत मोफत उपचार", "20,000 रुपये", "50,000 रुपये", "10,00,000 रुपये"], 0, "आयुष्यमान भारत योजनेतून दरवर्षी 5 लाखांपर्यंत कॅशलेस उपचार मिळतात."),
                ("शासकीय सबसिडीचे पैसे थेट खात्यात विनाअडथळा येण्यासाठी काय करणे आवश्यक आहे?", ["बँक खाते आधारशी लिंक करणे आणि एनपीसीआय (NPCI) मॅपिंग सक्रिय असणे", "दलालाला पैसे देणे", "खाते बंद करणे", "दर आठवड्याला फोन नंबर बदलणे"], 0, "आधार सीडिंगमुळे शासकीय सबसिडी थेट बँक खात्यात जमा होते."),
                ("पीएम-किसान किंवा डीबीटीच्या पैशांतून कोणी एजंट कमिशन कापू शकतो का?", ["नाही, असा कोणताही कमिशन कापणे कायद्याने गुन्हा आहे", "हो, 20%", "हो, 50%", "सणासुदीला"], 0, "डीबीटीचे पैसे थेट लाभार्थीच्या खात्यात जमा होतात, कोणीही पैसे कापू शकत नाही."),
                ("पीएम मुद्रा योजनेअंतर्गत (शिशू गट) कर्ज घेण्यासाठी काय तारण ठेवावे लागते?", ["काहीही तारण ठेवावे लागत नाही (विनातारण/Collateral-Free)", "जमिनीचे कागदपत्र", "सोने", "घर"], 0, "मुद्रा योजनेतून लहान उद्योगांना विनातारण कर्ज मिळते."),
                ("फायनान्स साथीच्या 'शासकीय योजना' पोर्टलमुळे तुम्हाला काय फायदा होतो?", ["तुमच्या प्रोफाइलनुसार पात्र योजना आणि अधिकृत लिंक मिळतात", "अर्ज भरण्याची फी आकारली जाते", "जात बदलते", "लॉटरी विकली जाते"], 0, "हे पोर्टल शेती व व्यवसायानुसार योग्य शासकीय योजना शोधून देते."),
            ]
        ),
    },
}

# 8 Comprehensive Government Schemes
SCHEMES = {
    "en": [
        ("PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
         "Direct income support of Rs 6,000 per year transferred in 3 equal installments into Aadhaar-seeded bank accounts of landholding farmer families.",
         "Small and marginal landholding farmer families with valid land revenue records.", "https://pmkisan.gov.in"),
        ("PMMY (Pradhan Mantri MUDRA Yojana)",
         "Collateral-free micro loans up to Rs 10 Lakh for non-corporate, non-farm small and micro enterprises across Shishu, Kishor, and Tarun tiers.",
         "Micro entrepreneurs, small traders, artisans, food processors, and shopkeepers.", "https://www.mudra.org.in"),
        ("PM-SVANidhi (Street Vendor Financial Facility)",
         "Micro-credit working capital facility providing Rs 10,000, Rs 20,000, and Rs 50,000 credit tranches with a 7% interest rebate on timely digital repayment.",
         "Urban and peri-urban street vendors and hawkers with vending certificates.", "https://pmsvanidhi.mohua.gov.in"),
        ("DAY-NRLM (Deendayal Antyodaya Yojana - Ajeevika)",
         "National Rural Livelihoods Mission organizing rural women into Self-Help Groups, providing Revolving Funds, Community Investment Support, and bank linkage.",
         "Rural women from low-income households organized into active SHGs.", "https://aajeevika.gov.in"),
        ("PMJDY (Pradhan Mantri Jan Dhan Yojana)",
         "Universal zero-balance basic savings bank deposit account with free RuPay debit card, Rs 2 Lakh accidental insurance, and Rs 10,000 overdraft facility.",
         "Any unbanked Indian citizen aged 10+ with basic KYC proof.", "https://pmjdy.gov.in"),
        ("PM-KUSUM (Solar Agri Pump Subsidy)",
         "Subsidizes standalone solar-powered water irrigation pumps up to 7.5 HP with combined Central and State capital subsidies of up to 60%.",
         "Farmers, Farmer Producer Organizations (FPOs), and rural water user groups.", "https://pmkusum.mnre.gov.in"),
        ("PMAY-G (Pradhan Mantri Awas Yojana - Gramin)",
         "Financial grant assistance of Rs 1.20 Lakh in plains (Rs 1.30 Lakh in hilly/tribal states) plus 90 days MGNREGA wages for pucca house construction.",
         "Rural homeless or kutcha house households identified via SECC census.", "https://pmayg.nic.in"),
        ("Sukanya Samriddhi Yojana (SSY)",
         "Small deposit savings scheme for girl child education and marriage, offering 8.2% sovereign compounding interest with 100% tax exemption.",
         "Parents or legal guardians of a girl child from birth up to age 10.", "https://www.indiapost.gov.in"),
    ],
    "hi": [
        ("पीएम-किसान सम्मान निधि (PM-KISAN)",
         "ज़मीन धारक किसान परिवारों के आधार-लिंक्ड बैंक खातों में 2,000 रुपये की 3 समान किस्तों में प्रति वर्ष 6,000 रुपये की सीधी नकद आय सहायता।",
         "मान्य भू-राजस्व रिकॉर्ड वाले लघु एवं सीमांत किसान परिवार।", "https://pmkisan.gov.in"),
        ("प्रधानमंत्री मुद्रा योजना (PMMY)",
         "गैर-कॉर्पोरेट, गैर-कृषि छोटे और सूक्ष्म उद्यमों के लिए शिशु, किशोर और तरुण श्रेणियों में 10 लाख रुपये तक का बिना गारंटी का सूक्ष्म ऋण।",
         "छोटे दुकानदार, ग्रामीण कारीगर, फल-सब्ज़ी विक्रेता और सूक्ष्म विनिर्माण इकाइयाँ।", "https://www.mudra.org.in"),
        ("पीएम स्वनिधि (स्ट्रीट वेंडर आत्मनिर्भर निधि)",
         "शहरी और अर्ध-शहरी रेहड़ी-पटरी विक्रेताओं के लिए 10,000, 20,000 और 50,000 रुपये की कार्यशील पूँजी, डिजिटल भुगतान पर 7% ब्याज छूट के साथ।",
         "शहरी एवं अर्ध-शहरी रेहड़ी-पटरी वेंडर जिनके पास वेंडिंग प्रमाणपत्र या सिफ़ारिश पत्र हो।", "https://pmsvanidhi.mohua.gov.in"),
        ("दीनदयाल अंत्योदय योजना - आजीविका (DAY-NRLM)",
         "ग्रामीण महिलाओं को स्वयं सहायता समूहों (SHG) में संगठित कर रिवॉल्विंग फंड, सामुदायिक निवेश सहायता और रियायती बैंक लिंकेज ऋण प्रदान करना।",
         "स्वयं सहायता समूहों में संगठित ग्रामीण गरीब परिवार, विशेषकर महिलाएँ।", "https://aajeevika.gov.in"),
        ("प्रधानमंत्री जन धन योजना (PMJDY)",
         "शून्य शेष राशि वाला बुनियादी बैंक खाता, मुफ़्त रुपे डेबिट कार्ड, 2 लाख का दुर्घटना बीमा और 10,000 रुपये तक की ओवरड्राफ्ट सुविधा।",
         "10 वर्ष से अधिक आयु का कोई भी भारतीय नागरिक जिसके पास बैंक खाता न हो।", "https://pmjdy.gov.in"),
        ("पीएम-कुसुम (सौर ऊर्जा कृषि पंप योजना)",
         "कृषि सिंचाई के लिए 7.5 एचपी तक के स्टैंडअलोन सोलर वाटर पंप लगाने हेतु केंद्र और राज्य सरकार द्वारा 60% तक की भारी पूंजीगत सब्सिडी।",
         "कृषक, किसान उत्पादक संगठन (FPO) और जल उपभोक्ता समूह।", "https://pmkusum.mnre.gov.in"),
        ("प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
         "ग्रामीण बेघर परिवारों को पक्के मकान के निर्माण हेतु 1.20 लाख रुपये (पहाड़ी राज्यों में 1.30 लाख) की सीधी वित्तीय अनुदान सहायता और मनरेगा मजदूरी।",
         "कच्चे मकानों में रहने वाले या बेघर ग्रामीण परिवार।", "https://pmayg.nic.in"),
        ("सुकन्या समृद्धि योजना (SSY)",
         "बालिकाओं की उच्च शिक्षा और विवाह हेतु 8.2% वार्षिक चक्रवृद्धि ब्याज दर और पूर्ण कर-मुक्त लाभ देने वाली सुरक्षित सरकारी बचत योजना।",
         "10 वर्ष तक की आयु की बालिका के माता-पिता या कानूनी अभिभावक।", "https://www.indiapost.gov.in"),
    ],
    "mr": [
        ("पीएम-किसान सन्मान निधी (PM-KISAN)",
         "शेतकरी कुटुंबांच्या बँक खात्यात थेट 2,000 रुपयांच्या तीन हप्त्यांमध्ये दरवर्षी 6,000 रुपयांची थेट रोख आर्थिक मदत.",
         "वैध शेतजमीन असलेले लहान व सीमांत शेतकरी कुटुंब.", "https://pmkisan.gov.in"),
        ("प्रधानमंत्री मुद्रा योजना (PMMY)",
         "बिगर-शेती लहान व्यवसायांसाठी शिशू, किशोर आणि तरुण गटांतर्गत 10 लाख रुपयांपर्यंतचे विनातारण सूक्ष्म कर्ज.",
         "लहान व्यापारी, कारागीर, भाजीपाला विक्रेते आणि सूक्ष्म उद्योजक.", "https://www.mudra.org.in"),
        ("पीएम स्वनिधी (फेरीवाला आत्मनिर्भर निधी)",
         "फेरीवाले आणि हातगाडी चालकांसाठी 10,000, 20,000 आणि 50,000 रुपयांचे खेळते भांडवल कर्ज आणि डिजिटल व्यवहारावर 7% व्याज परतावा.",
         "शहरी व निमशहरी भागातील नोंदणीकृत फेरीवाले व हातगाडी चालक.", "https://pmsvanidhi.mohua.gov.in"),
        ("दीनदयाळ अंत्योदय योजना - आजीविका (DAY-NRLM)",
         "ग्रामीण महिलांचे बचत गट स्थापन करून फिरता निधी, समुदाय गुंतवणूक आणि कमी व्याजाचे बँक लिंकेज कर्ज देणे.",
         "बचत गटांशी जोडलेल्या ग्रामीण गरीब महिला व त्यांची कुटुंबे.", "https://aajeevika.gov.in"),
        ("प्रधानमंत्री जन धन योजना (PMJDY)",
         "शून्य शिलकीचे मूलभूत बँक खाते, मोफत रूपे डेबिट कार्ड, 2 लाख रुपयांचा अपघात विमा आणि 10,000 रुपयांपर्यंत ओव्हरड्राफ्ट सवलत.",
         "बँक खाते नसलेला 10 वर्षांवरील कोणताही भारतीय नागरिक.", "https://pmjdy.gov.in"),
        ("पीएम-कुसुम (सौर कृषी पंप योजना)",
         "शेती सिंचनासाठी 7.5 एचपी पर्यंतच्या सौर पंपासाठी केंद्र व राज्य शासनाकडून 60% पर्यंत थेट भांडवली सबसिडी.",
         "शेतकरी, शेतकरी उत्पादक कंपन्या (FPO) आणि पाणी वापर संस्था.", "https://pmkusum.mnre.gov.in"),
        ("प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
         "ग्रामीण भागातील बेघर कुटुंबांना पक्के घर बांधण्यासाठी 1.20 लाख रुपये (डोंगरी भागात 1.30 लाख) थेट अनुदान आणि मनरेगा मजुरी.",
         "कच्च्या घरात राहणारी किंवा बेघर ग्रामीण कुटुंबे.", "https://pmayg.nic.in"),
        ("सुकन्या समृद्धी योजना (SSY)",
         "मुलींचे उच्च शिक्षण आणि विवाहासाठी 8.2% सर्वाधिक चक्रवाढ व्याज देणारी आणि 100% करमुक्त सुरक्षित शासकीय बचत योजना.",
         "10 वर्षांपर्यंतच्या मुलींचे पालक किंवा कायदेशीर पालक.", "https://www.indiapost.gov.in"),
    ],
}
'''

with open('backend/app/seed_data.py', 'w', encoding='utf-8') as f:
    f.write(courses_code)

print("Successfully written backend/app/seed_data.py with 6 courses (8+ questions each in EN, HI, MR) and 8 schemes!")
