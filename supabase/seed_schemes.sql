-- ============================================================
-- MediGuide AI — Government Healthcare Schemes Seed Data
-- Run AFTER schema.sql
-- Covers: All-India + Maharashtra-specific schemes
-- UUID pattern: schemes = 20000000-0000-0000-0000-00000000000x
-- ============================================================

INSERT INTO schemes (
    id, name, name_hi, name_mr,
    description, description_hi, description_mr,
    eligibility_states,
    max_annual_income,
    applicable_genders,
    min_age, max_age,
    applicable_conditions,
    benefit_amount,
    scheme_url, helpline,
    is_active
) VALUES

-- ── 1. Ayushman Bharat PM-JAY (All India) ────────────────────
(
    '20000000-0000-0000-0000-000000000001',
    'Ayushman Bharat PM-JAY',
    'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    'आयुष्मान भारत पंतप्रधान जन आरोग्य योजना',

    'Provides health coverage of ₹5 lakh per family per year for secondary and tertiary hospitalisation. Covers over 1,500 medical procedures at empanelled government and private hospitals across India.',
    '₹5 लाख प्रति परिवार प्रति वर्ष की स्वास्थ्य कवरेज प्रदान करती है। 1500 से अधिक चिकित्सा प्रक्रियाओं के लिए सरकारी और निजी अस्पतालों में कैशलेस उपचार उपलब्ध।',
    '₹5 लाख प्रति कुटुंब प्रति वर्ष आरोग्य संरक्षण. सरकारी व खाजगी रुग्णालयांत 1500 पेक्षा अधिक वैद्यकीय उपचारांसाठी कॅशलेस सेवा.',

    NULL,                  -- all India
    500000,                -- income up to ₹5 lakh/year (SECC-based, but this is a proxy)
    NULL,                  -- all genders
    0, 120,
    NULL,                  -- all conditions covered
    500000,
    'https://pmjay.gov.in',
    '14555',
    TRUE
),

-- ── 2. Mahatma Jyotirao Phule Jan Arogya Yojana (Maharashtra) ─
(
    '20000000-0000-0000-0000-000000000002',
    'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    'महात्मा जोतीराव फुले जन आरोग्य योजना',
    'महात्मा जोतीराव फुले जन आरोग्य योजना',

    'Maharashtra state scheme providing free treatment for 996 medical procedures at empanelled hospitals. Covers surgery, therapies and follow-up care. Beneficiaries include farmers, BPL families, and specific occupational groups.',
    'महाराष्ट्र सरकार की योजना जो 996 चिकित्सा प्रक्रियाओं के लिए मुफ्त इलाज देती है। किसान, BPL परिवार और अन्य श्रेणियां पात्र हैं।',
    'महाराष्ट्र सरकारची योजना. 996 वैद्यकीय उपचारांसाठी मोफत उपचार. शेतकरी, दारिद्र्यरेषेखालील कुटुंबे व इतर श्रेणी पात्र.',

    ARRAY['Maharashtra'],
    100000,
    NULL,
    0, 120,
    NULL,
    150000,
    'https://www.jeevandayee.gov.in',
    '155388',
    TRUE
),

-- ── 3. Pradhan Mantri Matru Vandana Yojana — PMMVY (All India) ─
(
    '20000000-0000-0000-0000-000000000003',
    'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    'प्रधानमंत्री मातृ वंदना योजना',
    'प्रधानमंत्री मातृ वंदना योजना',

    'Maternity benefit scheme providing ₹5,000 cash incentive in three instalments to pregnant and lactating women for their first live birth, to compensate for wage loss and improve health & nutrition.',
    'गर्भवती और स्तनपान कराने वाली महिलाओं को पहले जीवित बच्चे पर ₹5,000 तीन किश्तों में नकद प्रोत्साहन। मजदूरी हानि की भरपाई और पोषण सुधार के लिए।',
    'पहिल्या जिवंत बाळाच्या जन्मावेळी गर्भवती व स्तनदा मातांना तीन हप्त्यांत ₹5,000 रोख प्रोत्साहन.',

    NULL,
    NULL,
    ARRAY['female']::gender_type[],
    18, 45,
    ARRAY['pregnancy', 'maternity'],
    5000,
    'https://pmmvy.wcd.gov.in',
    '7998799804',
    TRUE
),

-- ── 4. Rashtriya Bal Swasthya Karyakram — RBSK (All India) ────
(
    '20000000-0000-0000-0000-000000000004',
    'Rashtriya Bal Swasthya Karyakram (RBSK)',
    'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम',
    'राष्ट्रीय बालस्वास्थ्य कार्यक्रम',

    'Health screening and early intervention for children aged 0–18 years covering 4Ds — Defects at birth, Diseases, Deficiencies, and Developmental delays. Provides free treatment at District Early Intervention Centres.',
    '0 से 18 वर्ष के बच्चों की निःशुल्क जाँच और उपचार। जन्म दोष, बीमारियाँ, कमियाँ और विकासात्मक देरी की पहचान और इलाज।',
    '0 ते 18 वर्षांच्या मुलांची मोफत तपासणी आणि उपचार. जन्मजात दोष, आजार, कमतरता आणि विकासातील विलंब यावर मोफत उपचार.',

    NULL,
    NULL,
    NULL,
    0, 18,
    ARRAY['pediatrics', 'birth defects', 'developmental delay', 'malnutrition'],
    NULL,
    'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=819&lid=220',
    '104',
    TRUE
),

-- ── 5. PM National Dialysis Programme (All India) ─────────────
(
    '20000000-0000-0000-0000-000000000005',
    'PM National Dialysis Programme',
    'प्रधानमंत्री राष्ट्रीय डायलिसिस कार्यक्रम',
    'पंतप्रधान राष्ट्रीय डायलिसिस कार्यक्रम',

    'Provides free dialysis services to BPL patients with Chronic Kidney Disease at District Hospitals across India. Covers both haemodialysis and peritoneal dialysis sessions.',
    'पूरे भारत में जिला अस्पतालों में BPL मरीजों को किडनी की बीमारी के लिए निःशुल्क डायलिसिस सेवा। हेमोडायलिसिस और पेरिटोनियल डायलिसिस दोनों।',
    'भारतातील जिल्हा रुग्णालयांत दारिद्र्यरेषेखालील रुग्णांना मूत्रपिंड आजारासाठी मोफत डायलिसिस. हेमोडायलिसिस व पेरिटोनियल डायलिसिस दोन्ही.',

    NULL,
    NULL,
    NULL,
    0, 120,
    ARRAY['chronic kidney disease', 'nephrology', 'renal failure', 'dialysis'],
    NULL,
    'https://nhm.gov.in',
    '1800-180-1104',
    TRUE
),

-- ── 6. Janani Suraksha Yojana — JSY (All India) ──────────────
(
    '20000000-0000-0000-0000-000000000006',
    'Janani Suraksha Yojana (JSY)',
    'जननी सुरक्षा योजना',
    'जननी सुरक्षा योजना',

    'Cash assistance to pregnant women from BPL families to encourage institutional delivery. Provides ₹1,400 in rural areas and ₹1,000 in urban areas per delivery at government health facilities.',
    'BPL परिवारों की गर्भवती महिलाओं को संस्थागत प्रसव प्रोत्साहन हेतु नकद सहायता। ग्रामीण में ₹1,400 और शहरी में ₹1,000।',
    'BPL कुटुंबांतील गर्भवती महिलांना संस्थात्मक प्रसूतीसाठी प्रोत्साहन. ग्रामीण: ₹1,400, शहरी: ₹1,000.',

    NULL,
    120000,
    ARRAY['female']::gender_type[],
    18, 45,
    ARRAY['pregnancy', 'maternity', 'delivery'],
    1400,
    'https://nhm.gov.in/index1.php?lang=1&level=3&lid=309&sublinkid=841',
    '104',
    TRUE
),

-- ── 7. Senior Citizen Health Insurance Scheme — Maharashtra ───
(
    '20000000-0000-0000-0000-000000000007',
    'Maharashtra Senior Citizen Health Scheme',
    'महाराष्ट्र वरिष्ठ नागरिक स्वास्थ्य योजना',
    'महाराष्ट्र ज्येष्ठ नागरिक आरोग्य योजना',

    'Maharashtra state health insurance covering senior citizens above 60 years from economically weaker sections. Provides cashless treatment for major illnesses at empanelled hospitals.',
    '60 वर्ष से अधिक आयु के महाराष्ट्र के वरिष्ठ नागरिकों के लिए स्वास्थ्य बीमा। बड़ी बीमारियों के लिए कैशलेस उपचार।',
    '60 वर्षांवरील महाराष्ट्रातील ज्येष्ठ नागरिकांसाठी आरोग्य विमा. मोठ्या आजारांसाठी कॅशलेस उपचार.',

    ARRAY['Maharashtra'],
    300000,
    NULL,
    60, 120,
    NULL,
    200000,
    'https://www.maharashtra.gov.in',
    '155388',
    TRUE
),

-- ── 8. National Mental Health Programme (All India) ───────────
(
    '20000000-0000-0000-0000-000000000008',
    'National Mental Health Programme (NMHP)',
    'राष्ट्रीय मानसिक स्वास्थ्य कार्यक्रम',
    'राष्ट्रीय मानसिक आरोग्य कार्यक्रम',

    'Provides free mental health screening, treatment, and rehabilitation at District Mental Health Programme (DMHP) centres. Covers depression, schizophrenia, bipolar disorder, and other conditions.',
    'जिला मानसिक स्वास्थ्य कार्यक्रम केंद्रों पर निःशुल्क मानसिक स्वास्थ्य जाँच और उपचार। अवसाद, सिज़ोफ्रेनिया, बाइपोलर आदि शामिल।',
    'जिल्हा मानसिक आरोग्य कार्यक्रम केंद्रांवर मोफत मानसिक आरोग्य तपासणी व उपचार. नैराश्य, स्किझोफ्रेनिया व इतर आजार सामील.',

    NULL,
    NULL,
    NULL,
    0, 120,
    ARRAY['depression', 'anxiety', 'schizophrenia', 'bipolar', 'psychiatry', 'mental health'],
    NULL,
    'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1043&lid=359',
    'iCall: 9152987821',
    TRUE
);
