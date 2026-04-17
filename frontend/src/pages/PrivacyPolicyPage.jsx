/**
 * MediGuide AI — Privacy Policy Page
 * Comprehensive privacy policy covering DPDPA, HIPAA, GDPR awareness.
 * Fully translated in Hindi, Marathi, and English.
 * Route: /privacy
 */

import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiShield } from 'react-icons/fi'
import { useLanguage } from '../contexts/LanguageContext'

const SECTIONS = {
  en: [
    {
      title: '1. Introduction',
      content: `MediGuide AI ("we", "our", "the app") is an AI-powered healthcare triage assistant designed for use in Indian hospitals. This Privacy Policy describes how we collect, use, store, and protect your personal and health-related data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA) of India.`,
    },
    {
      title: '2. Data We Collect',
      content: `We collect only the minimum data necessary to provide our services:
    
• **Health Symptoms** — Text or voice descriptions of your symptoms, shared voluntarily during triage conversations.
• **Images** — Optional photos of visible symptoms (e.g., skin conditions) that you choose to upload.
• **Location Data** — GPS coordinates (with your permission) to locate nearby hospitals.
• **Profile Information** — Name, age, gender, and language preference — used to personalize triage and generate Health Cards.
• **Authentication Data** — Email address and hashed password managed by Supabase Auth, or Google OAuth tokens.

We do NOT collect Aadhaar numbers, financial information, or any data beyond what is listed above.`,
    },
    {
      title: '3. How We Use Your Data',
      content: `Your data is used exclusively for:

• **AI Triage Assessment** — Your symptom text is sent to Google Gemini AI for urgency classification. The AI does NOT diagnose conditions or prescribe medications.
• **Voice Processing** — Voice recordings are sent to Sarvam AI for speech-to-text transcription only. Audio is not stored after transcription.
• **Health Card Generation** — Triage results are compiled into a downloadable PDF for sharing with your doctor.
• **Hospital Discovery** — Your location is used to find nearby hospitals via Google Maps API.
• **Caregiver Alerts** — If you link a caregiver, they receive push notifications about emergency triage results only.`,
    },
    {
      title: '4. Data Storage & Security',
      content: `• **Storage Location** — All user data is stored on Supabase servers. Database servers are configured with Row Level Security (RLS) policies ensuring users can only access their own data.
• **Encryption** — Data in transit is encrypted via TLS/HTTPS. Supabase provides encryption at rest for stored data.
• **Access Control** — API endpoints require JWT authentication. Service role keys are never exposed to the client.
• **Data Retention** — Chat history is retained for 90 days for continuity of care, after which it is automatically purged. You may request deletion at any time.
• **No Third-Party Sharing** — We do not sell, rent, or share your personal health data with third parties for marketing or any non-service purpose.`,
    },
    {
      title: '5. DPDPA Compliance (India)',
      content: `In compliance with the Digital Personal Data Protection Act, 2023:

• **Consent** — We obtain explicit consent before processing any personal health data via our consent modal.
• **Purpose Limitation** — Data is processed only for the purposes stated in this policy.
• **Data Minimization** — We collect only the minimum data necessary for service delivery.
• **Right to Access** — You may request a copy of all personal data we hold about you.
• **Right to Erasure** — You may request deletion of your data at any time by contacting us or through your profile settings.
• **Right to Correction** — You may update your profile information at any time.
• **Data Principal Rights** — As a Data Principal under DPDPA, you have the right to nominate another person to exercise your rights in case of incapacity.
• **Grievance Redressal** — For any privacy concerns, contact our Data Protection Officer (details below).`,
    },
    {
      title: '6. International Standards Awareness',
      content: `While MediGuide AI primarily operates under Indian law, we are aware of and align with international best practices:

• **HIPAA (USA)** — We follow HIPAA-aligned practices for health data security, including access controls, audit trails, and minimum necessary standards.
• **GDPR (EU)** — Our consent and data minimization practices are aligned with GDPR principles.
• **HL7 FHIR** — Health Card exports support HL7 FHIR (Fast Healthcare Interoperability Resources) format for interoperability with hospital systems.`,
    },
    {
      title: '7. Telemedicine Practice Guidelines',
      content: `MediGuide AI operates in compliance with the Telemedicine Practice Guidelines, 2020 (India):

• **No Diagnosis** — The AI assistant never provides medical diagnoses. It performs symptom triage only.
• **No Prescriptions** — The AI never prescribes medications or treatments.
• **Mandatory Disclaimer** — Every interaction displays: "This is not medical advice. Please consult a qualified doctor."
• **Doctor Referral** — The app always recommends consulting a qualified healthcare professional.`,
    },
    {
      title: '8. AI & Automated Decision-Making',
      content: `• The triage assessment is generated by Google Gemini AI and supplemented by rule-based safety checks.
• AI responses are NOT clinical decisions — they are guidance to help you understand urgency.
• Emergency keyword detection operates independently of AI to ensure critical cases are never missed.
• You have the right to not be subject to decisions based solely on automated processing that significantly affect you (DPDPA Section 11).`,
    },
    {
      title: '9. Children\'s Data',
      content: `• MediGuide AI may be used by parents/guardians to assess children's symptoms.
• We do not knowingly collect data from children under 18 without parental consent (DPDPA Section 9).
• A parent or guardian must provide consent and supervise usage for minors.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. Material changes will be communicated via in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.`,
    },
    {
      title: '11. Contact & Grievance Officer',
      content: `For privacy concerns, data access/deletion requests, or grievances:

• **Data Protection Officer**: MediGuide AI Team
• **Email**: privacy@mediguide-ai.in
• **Response Time**: Within 72 hours as required by DPDPA

Last Updated: April 15, 2026`,
    },
  ],

  hi: [
    {
      title: '1. परिचय',
      content: `MediGuide AI ("हम", "हमारा", "यह ऐप") भारतीय अस्पतालों में उपयोग के लिए डिज़ाइन किया गया एक AI-संचालित हेल्थकेयर ट्राइएज सहायक है। यह गोपनीयता नीति बताती है कि हम भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 (DPDPA) के अनुपालन में आपके व्यक्तिगत और स्वास्थ्य संबंधी डेटा को कैसे एकत्र, उपयोग, संग्रहीत और सुरक्षित करते हैं।`,
    },
    {
      title: '2. हम कौन सा डेटा एकत्र करते हैं',
      content: `हम अपनी सेवाएँ प्रदान करने के लिए केवल न्यूनतम आवश्यक डेटा एकत्र करते हैं:

• **स्वास्थ्य लक्षण** — ट्राइएज बातचीत के दौरान आपके द्वारा स्वेच्छा से साझा किए गए लक्षणों का टेक्स्ट या वॉइस विवरण।
• **चित्र** — दृश्य लक्षणों (जैसे, त्वचा की स्थिति) की वैकल्पिक तस्वीरें जो आप अपलोड करना चुनते हैं।
• **स्थान डेटा** — निकटतम अस्पतालों को खोजने के लिए GPS निर्देशांक (आपकी अनुमति से)।
• **प्रोफ़ाइल जानकारी** — नाम, आयु, लिंग और भाषा वरीयता — ट्राइएज को व्यक्तिगत बनाने और हेल्थ कार्ड बनाने के लिए उपयोग किया जाता है।
• **प्रमाणीकरण डेटा** — Supabase Auth द्वारा प्रबंधित ईमेल पता और हैश्ड पासवर्ड, या Google OAuth टोकन।

हम आधार नंबर, वित्तीय जानकारी, या ऊपर सूचीबद्ध के अलावा कोई अन्य डेटा एकत्र नहीं करते हैं।`,
    },
    {
      title: '3. हम आपके डेटा का उपयोग कैसे करते हैं',
      content: `आपके डेटा का उपयोग केवल इन उद्देश्यों के लिए किया जाता है:

• **AI ट्राइएज आकलन** — आपके लक्षण टेक्स्ट को तात्कालिकता वर्गीकरण के लिए Google Gemini AI को भेजा जाता है। AI रोग का निदान नहीं करता या दवाएँ नहीं लिखता।
• **वॉइस प्रोसेसिंग** — वॉइस रिकॉर्डिंग केवल स्पीच-टू-टेक्स्ट ट्रांसक्रिप्शन के लिए Sarvam AI को भेजी जाती है। ट्रांसक्रिप्शन के बाद ऑडियो संग्रहीत नहीं किया जाता।
• **हेल्थ कार्ड जनरेशन** — ट्राइएज परिणामों को आपके डॉक्टर के साथ साझा करने के लिए डाउनलोड करने योग्य PDF में संकलित किया जाता है।
• **अस्पताल खोज** — आपके स्थान का उपयोग Google Maps API के माध्यम से निकटतम अस्पतालों को खोजने के लिए किया जाता है।
• **केयरगिवर अलर्ट** — यदि आप किसी केयरगिवर को लिंक करते हैं, तो उन्हें केवल आपातकालीन ट्राइएज परिणामों के बारे में पुश नोटिफिकेशन मिलते हैं।`,
    },
    {
      title: '4. डेटा संग्रहण और सुरक्षा',
      content: `• **संग्रहण स्थान** — सभी उपयोगकर्ता डेटा Supabase सर्वर पर संग्रहीत है। डेटाबेस सर्वर Row Level Security (RLS) नीतियों के साथ कॉन्फ़िगर किए गए हैं जो सुनिश्चित करती हैं कि उपयोगकर्ता केवल अपने स्वयं के डेटा तक पहुँच सकें।
• **एन्क्रिप्शन** — ट्रांज़िट में डेटा TLS/HTTPS के माध्यम से एन्क्रिप्ट किया गया है। Supabase संग्रहीत डेटा के लिए रेस्ट पर एन्क्रिप्शन प्रदान करता है।
• **एक्सेस नियंत्रण** — API एंडपॉइंट्स के लिए JWT प्रमाणीकरण आवश्यक है। सर्विस रोल कीज़ क्लाइंट को कभी उजागर नहीं की जातीं।
• **डेटा प्रतिधारण** — चैट इतिहास देखभाल की निरंतरता के लिए 90 दिनों तक बनाए रखा जाता है, जिसके बाद इसे स्वचालित रूप से हटा दिया जाता है। आप किसी भी समय हटाने का अनुरोध कर सकते हैं।
• **कोई तृतीय-पक्ष साझाकरण नहीं** — हम विपणन या किसी गैर-सेवा उद्देश्य के लिए आपके व्यक्तिगत स्वास्थ्य डेटा को तृतीय पक्षों को बेचते, किराये पर देते या साझा नहीं करते हैं।`,
    },
    {
      title: '5. DPDPA अनुपालन (भारत)',
      content: `डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुपालन में:

• **सहमति** — हम अपने सहमति मॉडल के माध्यम से किसी भी व्यक्तिगत स्वास्थ्य डेटा को संसाधित करने से पहले स्पष्ट सहमति प्राप्त करते हैं।
• **उद्देश्य सीमा** — डेटा केवल इस नीति में बताए गए उद्देश्यों के लिए संसाधित किया जाता है।
• **डेटा न्यूनीकरण** — हम सेवा वितरण के लिए केवल न्यूनतम आवश्यक डेटा एकत्र करते हैं।
• **एक्सेस का अधिकार** — आप हमारे पास मौजूद अपने सभी व्यक्तिगत डेटा की एक प्रति का अनुरोध कर सकते हैं।
• **मिटाने का अधिकार** — आप हमसे संपर्क करके या अपनी प्रोफ़ाइल सेटिंग्स के माध्यम से किसी भी समय अपने डेटा को हटाने का अनुरोध कर सकते हैं।
• **सुधार का अधिकार** — आप किसी भी समय अपनी प्रोफ़ाइल जानकारी अपडेट कर सकते हैं।
• **डेटा प्रिंसिपल अधिकार** — DPDPA के तहत एक डेटा प्रिंसिपल के रूप में, आपको अक्षमता के मामले में अपने अधिकारों का प्रयोग करने के लिए किसी अन्य व्यक्ति को नामांकित करने का अधिकार है।
• **शिकायत निवारण** — किसी भी गोपनीयता संबंधी चिंता के लिए, हमारे डेटा सुरक्षा अधिकारी से संपर्क करें (विवरण नीचे)।`,
    },
    {
      title: '6. अंतर्राष्ट्रीय मानकों की जागरूकता',
      content: `जबकि MediGuide AI मुख्य रूप से भारतीय कानून के तहत संचालित होता है, हम अंतर्राष्ट्रीय सर्वोत्तम प्रथाओं से अवगत हैं और उनके अनुरूप हैं:

• **HIPAA (USA)** — हम एक्सेस नियंत्रण, ऑडिट ट्रेल और न्यूनतम आवश्यक मानकों सहित स्वास्थ्य डेटा सुरक्षा के लिए HIPAA-संरेखित प्रथाओं का पालन करते हैं।
• **GDPR (EU)** — हमारी सहमति और डेटा न्यूनीकरण प्रथाएँ GDPR सिद्धांतों के अनुरूप हैं।
• **HL7 FHIR** — हेल्थ कार्ड निर्यात अस्पताल प्रणालियों के साथ इंटरऑपरेबिलिटी के लिए HL7 FHIR प्रारूप का समर्थन करते हैं।`,
    },
    {
      title: '7. टेलीमेडिसिन प्रैक्टिस दिशानिर्देश',
      content: `MediGuide AI टेलीमेडिसिन प्रैक्टिस दिशानिर्देश, 2020 (भारत) के अनुपालन में संचालित होता है:

• **कोई निदान नहीं** — AI सहायक कभी चिकित्सा निदान प्रदान नहीं करता। यह केवल लक्षण ट्राइएज करता है।
• **कोई प्रिस्क्रिप्शन नहीं** — AI कभी दवाएँ या उपचार नहीं लिखता।
• **अनिवार्य अस्वीकरण** — हर बातचीत में प्रदर्शित होता है: "यह चिकित्सा सलाह नहीं है। कृपया एक योग्य डॉक्टर से परामर्श करें।"
• **डॉक्टर रेफ़रल** — ऐप हमेशा एक योग्य स्वास्थ्य पेशेवर से परामर्श करने की सिफारिश करता है।`,
    },
    {
      title: '8. AI और स्वचालित निर्णय-लेना',
      content: `• ट्राइएज आकलन Google Gemini AI द्वारा उत्पन्न किया जाता है और नियम-आधारित सुरक्षा जांचों द्वारा पूरक है।
• AI प्रतिक्रियाएँ नैदानिक निर्णय नहीं हैं — वे तात्कालिकता को समझने में आपकी मदद करने के लिए मार्गदर्शन हैं।
• आपातकालीन कीवर्ड डिटेक्शन AI से स्वतंत्र रूप से संचालित होता है ताकि यह सुनिश्चित हो सके कि गंभीर मामले कभी न छूटें।
• आपको केवल स्वचालित प्रसंस्करण पर आधारित ऐसे निर्णयों के अधीन न होने का अधिकार है जो आपको महत्वपूर्ण रूप से प्रभावित करते हैं (DPDPA धारा 11)।`,
    },
    {
      title: '9. बच्चों का डेटा',
      content: `• MediGuide AI का उपयोग माता-पिता/अभिभावकों द्वारा बच्चों के लक्षणों का आकलन करने के लिए किया जा सकता है।
• हम माता-पिता की सहमति के बिना 18 वर्ष से कम आयु के बच्चों से जानबूझकर डेटा एकत्र नहीं करते हैं (DPDPA धारा 9)।
• नाबालिगों के लिए माता-पिता या अभिभावक को सहमति प्रदान करनी चाहिए और उपयोग की निगरानी करनी चाहिए।`,
    },
    {
      title: '10. इस नीति में परिवर्तन',
      content: `हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। महत्वपूर्ण परिवर्तनों की सूचना इन-ऐप नोटिफिकेशन के माध्यम से दी जाएगी। परिवर्तनों के बाद ऐप का निरंतर उपयोग अपडेट की गई नीति की स्वीकृति माना जाएगा।`,
    },
    {
      title: '11. संपर्क और शिकायत अधिकारी',
      content: `गोपनीयता संबंधी चिंताओं, डेटा एक्सेस/डिलीशन अनुरोधों, या शिकायतों के लिए:

• **डेटा सुरक्षा अधिकारी**: MediGuide AI टीम
• **ईमेल**: privacy@mediguide-ai.in
• **प्रतिक्रिया समय**: DPDPA द्वारा आवश्यक 72 घंटों के भीतर

अंतिम अपडेट: 15 अप्रैल, 2026`,
    },
  ],

  mr: [
    {
      title: '1. प्रस्तावना',
      content: `MediGuide AI ("आम्ही", "आमचे", "हे ॲप") हे भारतीय रुग्णालयांमध्ये वापरण्यासाठी तयार केलेले AI-चालित आरोग्य सेवा ट्रायएज सहाय्यक आहे. ही गोपनीयता धोरण वर्णन करते की आम्ही भारताच्या डिजिटल वैयक्तिक डेटा संरक्षण कायदा, 2023 (DPDPA) च्या अनुपालनात तुमचा वैयक्तिक आणि आरोग्य-संबंधित डेटा कसा गोळा करतो, वापरतो, साठवतो आणि संरक्षित करतो.`,
    },
    {
      title: '2. आम्ही कोणता डेटा गोळा करतो',
      content: `आम्ही आमच्या सेवा प्रदान करण्यासाठी केवळ किमान आवश्यक डेटा गोळा करतो:

• **आरोग्य लक्षणे** — ट्रायएज संभाषणांदरम्यान तुम्ही स्वेच्छेने सामायिक केलेल्या तुमच्या लक्षणांचे मजकूर किंवा व्हॉइस वर्णन.
• **चित्रे** — तुम्ही अपलोड करण्यासाठी निवडलेली दृश्य लक्षणांची (जसे, त्वचा स्थिती) पर्यायी छायाचित्रे.
• **स्थान डेटा** — जवळपासची रुग्णालये शोधण्यासाठी GPS निर्देशांक (तुमच्या परवानगीने).
• **प्रोफाइल माहिती** — नाव, वय, लिंग आणि भाषा प्राधान्य — ट्रायएज वैयक्तिक करण्यासाठी आणि आरोग्य कार्ड तयार करण्यासाठी वापरले जाते.
• **प्रमाणीकरण डेटा** — Supabase Auth द्वारे व्यवस्थापित ईमेल पत्ता आणि हॅश केलेला पासवर्ड, किंवा Google OAuth टोकन.

आम्ही आधार क्रमांक, आर्थिक माहिती किंवा वर सूचीबद्ध केलेल्या बाहेरचा कोणताही डेटा गोळा करत नाही.`,
    },
    {
      title: '3. आम्ही तुमचा डेटा कसा वापरतो',
      content: `तुमचा डेटा केवळ यासाठी वापरला जातो:

• **AI ट्रायएज मूल्यांकन** — तुमचा लक्षण मजकूर तातडीच्या वर्गीकरणासाठी Google Gemini AI ला पाठवला जातो. AI रोगांचे निदान करत नाही किंवा औषधे लिहून देत नाही.
• **व्हॉइस प्रोसेसिंग** — व्हॉइस रेकॉर्डिंग केवळ स्पीच-टू-टेक्स्ट ट्रान्सक्रिप्शनसाठी Sarvam AI ला पाठवल्या जातात. ट्रान्सक्रिप्शननंतर ऑडिओ साठवला जात नाही.
• **आरोग्य कार्ड निर्मिती** — ट्रायएज निकाल तुमच्या डॉक्टरांशी सामायिक करण्यासाठी डाउनलोड करण्यायोग्य PDF मध्ये संकलित केले जातात.
• **रुग्णालय शोध** — तुमचे स्थान Google Maps API द्वारे जवळपासची रुग्णालये शोधण्यासाठी वापरले जाते.
• **केयरगिव्हर अलर्ट** — तुम्ही केयरगिव्हर लिंक केल्यास, त्यांना केवळ आपत्कालीन ट्रायएज निकालांबद्दल पुश सूचना मिळतात.`,
    },
    {
      title: '4. डेटा संचयन आणि सुरक्षा',
      content: `• **संचयन स्थान** — सर्व वापरकर्ता डेटा Supabase सर्व्हरवर साठवला जातो. डेटाबेस सर्व्हर Row Level Security (RLS) धोरणांसह कॉन्फिगर केलेले आहेत जे सुनिश्चित करतात की वापरकर्ते केवळ त्यांच्या स्वतःच्या डेटावर प्रवेश करू शकतात.
• **एन्क्रिप्शन** — ट्रान्झिटमधील डेटा TLS/HTTPS द्वारे एन्क्रिप्ट केलेला आहे. Supabase साठवलेल्या डेटासाठी रेस्ट एन्क्रिप्शन प्रदान करतो.
• **प्रवेश नियंत्रण** — API एंडपॉइंट्ससाठी JWT प्रमाणीकरण आवश्यक आहे. सर्व्हिस रोल कीज क्लायंटला कधीही उघड केल्या जात नाहीत.
• **डेटा धारणा** — चॅट इतिहास काळजीच्या सातत्यासाठी 90 दिवस ठेवला जातो, त्यानंतर तो स्वयंचलितपणे हटवला जातो. तुम्ही कधीही हटवण्याची विनंती करू शकता.
• **कोणतेही तृतीय-पक्ष सामायिकरण नाही** — आम्ही विपणन किंवा कोणत्याही गैर-सेवा उद्देशासाठी तुमचा वैयक्तिक आरोग्य डेटा तृतीय पक्षांना विकत, भाड्याने देत किंवा सामायिक करत नाही.`,
    },
    {
      title: '5. DPDPA अनुपालन (भारत)',
      content: `डिजिटल वैयक्तिक डेटा संरक्षण कायदा, 2023 च्या अनुपालनात:

• **संमती** — आम्ही आमच्या संमती मॉडेलद्वारे कोणताही वैयक्तिक आरोग्य डेटा प्रक्रिया करण्यापूर्वी स्पष्ट संमती प्राप्त करतो.
• **उद्देश मर्यादा** — डेटा केवळ या धोरणात नमूद केलेल्या उद्देशांसाठी प्रक्रिया केला जातो.
• **डेटा किमानीकरण** — आम्ही सेवा वितरणासाठी केवळ किमान आवश्यक डेटा गोळा करतो.
• **प्रवेशाचा अधिकार** — तुम्ही आमच्याकडे असलेल्या तुमच्या सर्व वैयक्तिक डेटाची प्रत मागू शकता.
• **मिटवण्याचा अधिकार** — तुम्ही आमच्याशी संपर्क साधून किंवा तुमच्या प्रोफाइल सेटिंग्जद्वारे कधीही तुमचा डेटा हटवण्याची विनंती करू शकता.
• **दुरुस्तीचा अधिकार** — तुम्ही कधीही तुमची प्रोफाइल माहिती अपडेट करू शकता.
• **डेटा प्रिन्सिपल अधिकार** — DPDPA अंतर्गत डेटा प्रिन्सिपल म्हणून, तुम्हाला अक्षमतेच्या बाबतीत तुमच्या अधिकारांचा वापर करण्यासाठी दुसऱ्या व्यक्तीला नामनिर्देशित करण्याचा अधिकार आहे.
• **तक्रार निवारण** — कोणत्याही गोपनीयता संबंधित चिंतांसाठी, आमच्या डेटा संरक्षण अधिकाऱ्याशी संपर्क साधा (तपशील खाली).`,
    },
    {
      title: '6. आंतरराष्ट्रीय मानकांची जागरूकता',
      content: `MediGuide AI मुख्यतः भारतीय कायद्यांतर्गत कार्य करत असताना, आम्ही आंतरराष्ट्रीय सर्वोत्तम पद्धतींबद्दल जागरूक आहोत आणि त्यांच्याशी सुसंगत आहोत:

• **HIPAA (USA)** — आम्ही प्रवेश नियंत्रण, ऑडिट ट्रेल आणि किमान आवश्यक मानकांसह आरोग्य डेटा सुरक्षिततेसाठी HIPAA-संरेखित पद्धतींचे पालन करतो.
• **GDPR (EU)** — आमच्या संमती आणि डेटा किमानीकरण पद्धती GDPR तत्त्वांशी सुसंगत आहेत.
• **HL7 FHIR** — आरोग्य कार्ड निर्यात रुग्णालय प्रणालींसह इंटरऑपरेबिलिटीसाठी HL7 FHIR स्वरूपाचे समर्थन करतात.`,
    },
    {
      title: '7. टेलिमेडिसिन प्रॅक्टिस मार्गदर्शक तत्त्वे',
      content: `MediGuide AI टेलिमेडिसिन प्रॅक्टिस मार्गदर्शक तत्त्वे, 2020 (भारत) च्या अनुपालनात कार्य करतो:

• **कोणतेही निदान नाही** — AI सहाय्यक कधीही वैद्यकीय निदान प्रदान करत नाही. तो केवळ लक्षण ट्रायएज करतो.
• **कोणतेही प्रिस्क्रिप्शन नाही** — AI कधीही औषधे किंवा उपचार लिहून देत नाही.
• **अनिवार्य अस्वीकरण** — प्रत्येक संवादात प्रदर्शित होते: "हा वैद्यकीय सल्ला नाही. कृपया पात्र डॉक्टरांचा सल्ला घ्या."
• **डॉक्टर रेफरल** — ॲप नेहमी पात्र आरोग्यसेवा व्यावसायिकांचा सल्ला घेण्याची शिफारस करतो.`,
    },
    {
      title: '8. AI आणि स्वयंचलित निर्णय-प्रक्रिया',
      content: `• ट्रायएज मूल्यांकन Google Gemini AI द्वारे तयार केले जाते आणि नियम-आधारित सुरक्षा तपासणीद्वारे पूरक आहे.
• AI प्रतिसाद क्लिनिकल निर्णय नाहीत — ते तातडी समजून घेण्यात तुम्हाला मदत करण्यासाठी मार्गदर्शन आहेत.
• आपत्कालीन कीवर्ड शोध AI पासून स्वतंत्रपणे कार्य करतो जेणेकरून गंभीर प्रकरणे कधीही चुकणार नाहीत.
• तुम्हाला केवळ स्वयंचलित प्रक्रियेवर आधारित अशा निर्णयांच्या अधीन न राहण्याचा अधिकार आहे जे तुम्हाला लक्षणीयरीत्या प्रभावित करतात (DPDPA कलम 11).`,
    },
    {
      title: '9. मुलांचा डेटा',
      content: `• MediGuide AI चा वापर पालक/पालकांद्वारे मुलांच्या लक्षणांचे मूल्यांकन करण्यासाठी केला जाऊ शकतो.
• आम्ही पालकांच्या संमतीशिवाय 18 वर्षांखालील मुलांचा जाणूनबुजून डेटा गोळा करत नाही (DPDPA कलम 9).
• अल्पवयीनांसाठी पालक किंवा पालकांनी संमती देणे आणि वापराचे पर्यवेक्षण करणे आवश्यक आहे.`,
    },
    {
      title: '10. या धोरणातील बदल',
      content: `आम्ही वेळोवेळी हे गोपनीयता धोरण अपडेट करू शकतो. महत्त्वपूर्ण बदलांची माहिती इन-ॲप सूचनेद्वारे दिली जाईल. बदलांनंतर ॲपचा सतत वापर हा अपडेट केलेल्या धोरणाची स्वीकृती मानला जाईल.`,
    },
    {
      title: '11. संपर्क आणि तक्रार अधिकारी',
      content: `गोपनीयता संबंधित चिंता, डेटा प्रवेश/हटवण्याच्या विनंत्या किंवा तक्रारींसाठी:

• **डेटा संरक्षण अधिकारी**: MediGuide AI टीम
• **ईमेल**: privacy@mediguide-ai.in
• **प्रतिसाद वेळ**: DPDPA द्वारे आवश्यक 72 तासांच्या आत

अंतिम अपडेट: 15 एप्रिल, 2026`,
    },
  ],
}

const HEADER_TEXT = {
  en: { title: 'Privacy Policy', subtitle: 'गोपनीयता नीति · गोपनीयता धोरण', dpdpa: 'MediGuide AI — Digital Personal Data Protection Act, 2023 Compliant' },
  hi: { title: 'गोपनीयता नीति', subtitle: 'Privacy Policy · गोपनीयता धोरण', dpdpa: 'MediGuide AI — डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 अनुपालित' },
  mr: { title: 'गोपनीयता धोरण', subtitle: 'Privacy Policy · गोपनीयता नीति', dpdpa: 'MediGuide AI — डिजिटल वैयक्तिक डेटा संरक्षण कायदा, 2023 अनुपालित' },
}

const BADGE_TEXT = {
  en: ['DPDPA 2023', 'HIPAA Aligned', 'GDPR Aware', 'HL7 FHIR'],
  hi: ['DPDPA 2023', 'HIPAA अनुरूप', 'GDPR जागरूक', 'HL7 FHIR'],
  mr: ['DPDPA 2023', 'HIPAA अनुरूप', 'GDPR जागरूक', 'HL7 FHIR'],
}

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()

  const sections = SECTIONS[language] || SECTIONS.en
  const header = HEADER_TEXT[language] || HEADER_TEXT.en
  const badges = BADGE_TEXT[language] || BADGE_TEXT.en

  return (
    <div className="min-h-screen bg-surface pb-12">
      {/* Header */}
      <div
        className="relative px-6 py-8 text-center bg-primary-fixed/30"
      >
        <button
          onClick={() => navigate('/chat')}
          className="absolute left-4 top-6 w-9 h-9 rounded-clinical bg-white/80 flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white transition-all shadow-clinical"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 mx-auto mb-3 rounded-clinical-xl bg-primary/10 flex items-center justify-center">
          <FiShield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-display text-on-surface">{header.title}</h1>
        <p className="text-xs text-on-surface-variant mt-1">{header.subtitle}</p>
        <p className="text-[10px] text-outline mt-2">
          {header.dpdpa}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="clinical-card rounded-clinical p-5 space-y-3">
            <h2 className="text-sm font-bold font-display text-on-surface flex items-center gap-2">
              <div className="w-6 h-6 rounded-clinical bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {i + 1}
              </div>
              {section.title.replace(/^\d+\.\s*/, '')}
            </h2>
            <div className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
              {section.content.split('**').map((part, j) =>
                j % 2 === 1
                  ? <strong key={j} className="text-on-surface">{part}</strong>
                  : <span key={j}>{part}</span>
              )}
            </div>
          </div>
        ))}

        {/* Compliance Badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {badges.map(badge => (
            <div
              key={badge}
              className="px-3 py-1.5 rounded-full bg-primary/8 text-[10px] font-semibold text-primary"
            >
              ✓ {badge}
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-outline pt-2">
          © 2026 MediGuide AI. {language === 'hi' ? 'सर्वाधिकार सुरक्षित।' : language === 'mr' ? 'सर्व हक्क राखीव.' : 'All rights reserved.'}
        </p>
      </div>
    </div>
  )
}
