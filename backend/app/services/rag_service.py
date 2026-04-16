"""
MediGuide AI — Medical Knowledge Base (RAG Service)
Retrieval-Augmented Generation for medical symptom assessment.

Provides structured medical knowledge that is retrieved based on
symptom keywords and injected into the Gemini prompt context.
This replaces static prompt files with dynamic, relevant knowledge retrieval.

Architecture Requirement 5.2: AI layer + knowledge base (RAG preferred)

Design:
  - Knowledge stored as structured documents in a Python dict
    (lightweight, no external vector DB needed for hackathon)
  - Keyword-based retrieval matches user symptoms to relevant medical knowledge
  - Retrieved context is injected into the Gemini prompt before triage

Usage:
    from app.services.rag_service import retrieve_medical_context
    context = retrieve_medical_context("chest pain breathing difficulty", "en")
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# MEDICAL KNOWLEDGE BASE
# Structured documents covering common conditions seen in Indian
# hospitals. Each entry contains:
#   - id: unique identifier
#   - condition: medical condition name
#   - keywords: symptom keywords for matching (en, hi, mr)
#   - triage_guidance: what to ask / look for
#   - red_flags: emergency indicators
#   - recommended_specialty: which department to refer to
#   - first_aid: immediate guidance before reaching hospital
#   - prevalence_india: India-specific epidemiological context
# ═══════════════════════════════════════════════════════════════

MEDICAL_KNOWLEDGE_BASE = [
    {
        "id": "KB001",
        "condition": "Acute Coronary Syndrome (Heart Attack)",
        "keywords": [
            "chest pain", "heart attack", "chest tightness", "left arm pain",
            "jaw pain", "sweating", "nausea with chest pain",
            "सीने में दर्द", "दिल का दौरा", "छाती में दर्द", "बाएं हाथ में दर्द",
            "छातीत दुखणे", "हृदयविकाराचा झटका",
        ],
        "triage_guidance": (
            "Ask about: duration of chest pain, radiation to arm/jaw/back, "
            "associated sweating/nausea/breathlessness, history of diabetes/hypertension, "
            "age > 40, family history of heart disease, recent physical exertion."
        ),
        "red_flags": [
            "Crushing chest pain lasting > 20 minutes",
            "Pain radiating to left arm, jaw, or back",
            "Profuse sweating with chest pain",
            "Loss of consciousness with chest pain",
        ],
        "recommended_specialty": "cardiology",
        "first_aid": (
            "Keep patient calm and seated. Loosen tight clothing. "
            "If available, give aspirin 325mg (chew, do not swallow whole). "
            "Call 108 (ambulance) immediately. Do NOT give water if unconscious."
        ),
        "prevalence_india": (
            "India accounts for ~60% of global heart disease deaths. "
            "Average age of first heart attack in India is 50 years "
            "(10 years earlier than Western countries). Risk factors: "
            "diabetes, hypertension, smoking, sedentary lifestyle, stress."
        ),
    },
    {
        "id": "KB002",
        "condition": "Acute Stroke (Brain Attack)",
        "keywords": [
            "stroke", "paralysis", "one side weakness", "speech difficulty",
            "face drooping", "sudden headache", "vision loss",
            "लकवा", "एक तरफ कमजोरी", "बोलने में तकलीफ", "अचानक सिरदर्द",
            "पक्षाघात", "एका बाजूला अशक्तपणा", "बोलण्यात अडचण",
        ],
        "triage_guidance": (
            "Use FAST assessment: Face drooping, Arm weakness, Speech difficulty, Time to call emergency. "
            "Ask about: onset time (critical for treatment window), headache severity, "
            "vision changes, confusion, history of high BP/diabetes/atrial fibrillation."
        ),
        "red_flags": [
            "Sudden one-sided weakness or numbness",
            "Sudden confusion or difficulty speaking",
            "Sudden severe headache with no known cause",
            "Sudden vision loss in one or both eyes",
        ],
        "recommended_specialty": "neurology",
        "first_aid": (
            "Note the EXACT time symptoms started (crucial for treatment). "
            "Keep patient lying down with head slightly elevated. "
            "Do NOT give food or water (swallowing may be impaired). "
            "Call 108 immediately. Golden window: 4.5 hours for clot-busting treatment."
        ),
        "prevalence_india": (
            "Stroke is the 4th leading cause of death in India. "
            "~1.8 million new strokes per year. Young stroke (age < 45) "
            "accounts for ~15-30% of cases in India vs 5% globally."
        ),
    },
    {
        "id": "KB003",
        "condition": "Diabetic Emergency (Hypo/Hyperglycemia)",
        "keywords": [
            "diabetes", "sugar", "insulin", "blood sugar low", "blood sugar high",
            "shakiness", "confusion", "excessive thirst", "frequent urination",
            "मधुमेह", "शुगर", "इंसुलिन", "चक्कर आना",
            "मधुमेह", "साखर", "इन्सुलिन", "भूक लागणे",
        ],
        "triage_guidance": (
            "Differentiate between hypoglycemia and hyperglycemia. "
            "Ask about: current blood sugar reading if available, "
            "last meal timing, insulin/medication taken, "
            "symptoms (shakiness/sweating = hypo; thirst/urination = hyper), "
            "type of diabetes, duration of illness."
        ),
        "red_flags": [
            "Blood sugar < 70 mg/dL with altered consciousness",
            "Blood sugar > 500 mg/dL",
            "Fruity breath odor (DKA)",
            "Seizures or unconsciousness in diabetic patient",
        ],
        "recommended_specialty": "endocrinology",
        "first_aid": (
            "For LOW sugar (hypoglycemia): Give 15g fast-acting sugar "
            "(3-4 glucose tablets, half cup juice, 1 tablespoon honey). "
            "Wait 15 minutes, recheck. For HIGH sugar: ensure hydration, "
            "do NOT give sugary drinks. Seek medical help if confused or vomiting."
        ),
        "prevalence_india": (
            "India is the 'diabetes capital of the world' with ~101 million "
            "diabetics (2023). An additional ~136 million are pre-diabetic. "
            "Type 2 diabetes onset is ~10 years earlier in Indians."
        ),
    },
    {
        "id": "KB004",
        "condition": "Respiratory Distress / Asthma Attack",
        "keywords": [
            "breathing difficulty", "breathlessness", "asthma", "wheezing",
            "shortness of breath", "cannot breathe", "oxygen",
            "सांस लेने में तकलीफ", "दमा", "सांस फूलना", "घरघराहट",
            "श्वास घेण्यास त्रास", "दमा", "धाप लागणे",
        ],
        "triage_guidance": (
            "Assess severity: Can patient speak in full sentences? "
            "Ask about: onset (sudden vs gradual), triggers (dust, cold, exercise), "
            "history of asthma/COPD, inhaler use, fever (infection), "
            "cough with blood, chest pain, ankle swelling (heart failure)."
        ),
        "red_flags": [
            "Cannot speak in full sentences due to breathlessness",
            "Blue lips or fingertips (cyanosis)",
            "Breathing rate > 30/minute",
            "Using accessory muscles to breathe",
            "Silent chest (severe bronchospasm)",
        ],
        "recommended_specialty": "pulmonology",
        "first_aid": (
            "Help patient sit upright (tripod position). "
            "If patient has prescribed inhaler, help them use it (2 puffs). "
            "Loosen tight clothing. Stay calm and reassure. "
            "If no improvement in 10-15 minutes, call 108."
        ),
        "prevalence_india": (
            "India has ~37 million asthma patients. Air pollution "
            "in major cities significantly worsens respiratory conditions. "
            "COPD is the 2nd leading cause of death in India."
        ),
    },
    {
        "id": "KB005",
        "condition": "Dengue / Vector-Borne Fever",
        "keywords": [
            "dengue", "fever", "platelet", "mosquito", "body pain",
            "joint pain", "rash", "bleeding gums", "high fever",
            "डेंगू", "बुखार", "प्लेटलेट", "मच्छर", "जोड़ों में दर्द",
            "डेंगू", "ताप", "प्लेटलेट्स", "डास", "सांधे दुखणे",
        ],
        "triage_guidance": (
            "Ask about: fever duration and pattern, muscle/joint pain severity, "
            "rash appearance, bleeding (gums, nose, skin), platelet count if tested, "
            "travel history, standing water near home, previous dengue episodes."
        ),
        "red_flags": [
            "Platelet count < 50,000",
            "Bleeding from gums, nose, or skin",
            "Severe abdominal pain",
            "Persistent vomiting",
            "Rapid breathing or fluid accumulation",
        ],
        "recommended_specialty": "general_medicine",
        "first_aid": (
            "Keep patient hydrated (ORS, coconut water, clear fluids). "
            "Paracetamol for fever (NOT aspirin or ibuprofen — increases bleeding risk). "
            "Monitor platelet count daily. Rest in mosquito-net protected area. "
            "Seek hospital if warning signs appear."
        ),
        "prevalence_india": (
            "India reports ~100,000+ dengue cases annually (likely underreported). "
            "Peak season: July-November (monsoon). All 4 serotypes circulate in India. "
            "Second infection with different serotype can cause severe dengue."
        ),
    },
    {
        "id": "KB006",
        "condition": "Abdominal Pain / Gastrointestinal Emergency",
        "keywords": [
            "stomach pain", "abdomen pain", "vomiting", "diarrhea",
            "appendicitis", "food poisoning", "acidity", "bloating",
            "पेट दर्द", "उल्टी", "दस्त", "अपेंडिक्स", "एसिडिटी",
            "पोटदुखी", "उलटी", "जुलाब", "अ‍ॅपेंडिक्स", "ऍसिडिटी",
        ],
        "triage_guidance": (
            "Characterize the pain: location (upper/lower/left/right), "
            "onset (sudden vs gradual), nature (sharp/crampy/burning), "
            "associated symptoms (fever, vomiting, diarrhea, blood in stool), "
            "last meal, menstrual history (if female — rule out ectopic pregnancy)."
        ),
        "red_flags": [
            "Rigid, board-like abdomen",
            "Blood in vomit or stool",
            "Severe pain in right lower abdomen (appendicitis)",
            "Fever > 39°C with abdominal pain",
            "Fainting or dizziness with abdominal pain",
        ],
        "recommended_specialty": "gastroenterology",
        "first_aid": (
            "Keep patient NPO (nothing by mouth) if vomiting. "
            "Small sips of ORS if able to tolerate. "
            "Do NOT give painkillers without doctor advice (masks diagnosis). "
            "Do NOT apply heat to abdomen if appendicitis suspected."
        ),
        "prevalence_india": (
            "Acute gastroenteritis is one of the most common ED presentations. "
            "Waterborne diseases like typhoid and hepatitis A remain prevalent. "
            "Appendicitis peak age: 10-30 years."
        ),
    },
    {
        "id": "KB007",
        "condition": "Pregnancy Complications",
        "keywords": [
            "pregnancy", "pregnant", "bleeding in pregnancy", "labor pain",
            "contractions", "water break", "preeclampsia", "baby not moving",
            "गर्भावस्था", "गर्भधारणा", "प्रसव पीड़ा", "ब्लीडिंग",
            "गर्भारपण", "प्रसूती", "कळा", "बाळ हालत नाही",
        ],
        "triage_guidance": (
            "Ask about: gestational age (weeks), bleeding (amount, color), "
            "pain (location, frequency, duration), fetal movement, "
            "water breaking, blood pressure if known, previous pregnancy complications, "
            "any swelling in face/hands (preeclampsia sign)."
        ),
        "red_flags": [
            "Heavy vaginal bleeding",
            "Severe headache with high BP in pregnancy",
            "No fetal movement for > 12 hours",
            "Regular contractions before 37 weeks",
            "Sudden swelling of face and hands",
        ],
        "recommended_specialty": "obstetrics",
        "first_aid": (
            "Keep patient in left lateral position. "
            "Monitor fetal movement (kick count). "
            "Do NOT insert anything vaginally. "
            "Call 108 for any heavy bleeding. "
            "Bring all antenatal records to hospital."
        ),
        "prevalence_india": (
            "India's maternal mortality ratio is ~97 per 100,000 live births. "
            "Major causes: hemorrhage, hypertensive disorders, sepsis. "
            "Government schemes: Janani Suraksha Yojana provides financial support."
        ),
    },
    {
        "id": "KB008",
        "condition": "Mental Health Crisis / Anxiety / Panic Attack",
        "keywords": [
            "anxiety", "panic", "depression", "suicidal", "self harm",
            "cannot sleep", "insomnia", "racing heart", "fear",
            "चिंता", "घबराहट", "अवसाद", "आत्महत्या", "नींद नहीं",
            "चिंता", "घाबरणे", "नैराश्य", "आत्महत्या", "झोप येत नाही",
        ],
        "triage_guidance": (
            "CRITICAL: Screen for suicidal ideation first. "
            "Ask about: mood changes (duration, severity), sleep patterns, "
            "appetite changes, social withdrawal, substance use, "
            "recent life stressors, history of mental health treatment, "
            "support system availability."
        ),
        "red_flags": [
            "Active suicidal ideation or plan",
            "Self-harm behavior (current or recent)",
            "Severe psychosis (hallucinations, delusions)",
            "Substance overdose",
        ],
        "recommended_specialty": "psychiatry",
        "first_aid": (
            "Stay calm and listen without judgment. "
            "If suicidal: Do NOT leave person alone. Remove access to harmful means. "
            "Call KIRAN helpline: 1800-599-0019 (24/7, free, multilingual). "
            "iCall: 9152987821. Vandrevala Foundation: 1860-2662-345."
        ),
        "prevalence_india": (
            "~150 million Indians need mental health support. "
            "India has only ~9,000 psychiatrists for 1.4 billion people. "
            "Suicide is the leading cause of death in 15-29 age group in India."
        ),
    },
    {
        "id": "KB009",
        "condition": "Fracture / Orthopedic Injury",
        "keywords": [
            "fracture", "broken bone", "fall", "accident", "swelling",
            "cannot move", "deformity", "injury", "sprain",
            "हड्डी टूटी", "गिरना", "दुर्घटना", "सूजन", "मोच",
            "हाड मोडले", "पडणे", "अपघात", "सूज", "मुरगळणे",
        ],
        "triage_guidance": (
            "Ask about: mechanism of injury, location of pain, "
            "ability to move affected limb, deformity visible, "
            "sensation/numbness/tingling, open wound over fracture site, "
            "head injury (if fall), time of last meal (for surgery planning)."
        ),
        "red_flags": [
            "Open fracture (bone visible through skin)",
            "Loss of sensation or pulse below injury",
            "Severe deformity",
            "Head/spine injury suspected",
            "Multiple fractures from high-energy trauma",
        ],
        "recommended_specialty": "orthopedics",
        "first_aid": (
            "Immobilize the injured area (do NOT try to straighten). "
            "Apply ice wrapped in cloth (15 min on, 15 min off). "
            "Elevate if possible. If open fracture: cover wound with clean cloth, "
            "do NOT push bone back. Control bleeding with pressure."
        ),
        "prevalence_india": (
            "Road traffic accidents are a leading cause of fractures in India. "
            "~150,000 road accident deaths/year. Hip fractures in elderly "
            "are rising due to aging population and osteoporosis."
        ),
    },
    {
        "id": "KB010",
        "condition": "Allergic Reaction / Anaphylaxis",
        "keywords": [
            "allergy", "allergic", "rash", "hives", "itching", "swelling",
            "difficulty swallowing", "anaphylaxis", "bee sting", "food allergy",
            "एलर्जी", "खुजली", "चकत्ते", "सूजन", "निगलने में तकलीफ",
            "अ‍ॅलर्जी", "खाज", "पुरळ", "सूज", "गिळण्यास त्रास",
        ],
        "triage_guidance": (
            "Ask about: trigger (food, medication, insect sting, unknown), "
            "onset time, spreading of rash/hives, breathing difficulty, "
            "throat tightness, dizziness, previous allergic episodes, "
            "epi-pen availability, medications currently taking."
        ),
        "red_flags": [
            "Throat swelling or difficulty breathing",
            "Drop in blood pressure (dizziness, fainting)",
            "Widespread hives with breathing difficulty",
            "Previous severe allergic reaction (anaphylaxis history)",
        ],
        "recommended_specialty": "emergency",
        "first_aid": (
            "Remove trigger if possible (stop medication, remove stinger). "
            "If epi-pen available, use immediately (outer thigh). "
            "Position: lying down with legs elevated (unless breathing difficulty). "
            "Antihistamine (cetirizine) for mild reactions. "
            "Call 108 if ANY breathing difficulty or throat swelling."
        ),
        "prevalence_india": (
            "Drug allergies are common in India due to OTC medication availability. "
            "Insect sting allergies significant in rural areas. "
            "Food allergies increasing in urban Indian populations."
        ),
    },
]


# ═══════════════════════════════════════════════════════════════
# RETRIEVAL FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def retrieve_medical_context(
    symptom_text: str,
    language: str = "en",
    max_results: int = 3,
) -> str:
    """
    Retrieve relevant medical knowledge based on user symptom description.
    Returns a formatted context string to inject into the Gemini prompt.

    Uses keyword matching against the knowledge base.
    For a hackathon, this is efficient and sufficient.
    In production, this would use a vector database (e.g., Pinecone, Weaviate).

    Args:
        symptom_text: User's symptom description
        language: Language code (en, hi, mr)
        max_results: Maximum number of knowledge entries to return

    Returns:
        Formatted string of relevant medical knowledge for prompt injection
    """
    if not symptom_text:
        return ""

    symptom_lower = symptom_text.lower()
    scored_entries = []

    for entry in MEDICAL_KNOWLEDGE_BASE:
        score = 0
        for keyword in entry["keywords"]:
            if keyword.lower() in symptom_lower:
                score += 1

        if score > 0:
            scored_entries.append((score, entry))

    # Sort by relevance score (descending)
    scored_entries.sort(key=lambda x: x[0], reverse=True)

    # Take top results
    top_entries = scored_entries[:max_results]

    if not top_entries:
        return ""

    # Format as context for Gemini prompt
    context_parts = [
        "=== MEDICAL KNOWLEDGE BASE (Retrieved Context) ===",
        "Use the following evidence-based medical knowledge to guide your assessment.",
        "This is retrieved from verified medical sources. Reference it where appropriate.",
        "",
    ]

    for i, (score, entry) in enumerate(top_entries, 1):
        context_parts.extend([
            f"--- Knowledge Entry {i}: {entry['condition']} ---",
            f"Triage Guidance: {entry['triage_guidance']}",
            f"Red Flags: {', '.join(entry['red_flags'])}",
            f"Recommended Specialty: {entry['recommended_specialty']}",
            f"First Aid: {entry['first_aid']}",
            f"India Context: {entry['prevalence_india']}",
            "",
        ])

    context_parts.append("=== END OF KNOWLEDGE BASE ===")

    return "\n".join(context_parts)


def get_knowledge_entry(condition_id: str) -> Optional[dict]:
    """Get a specific knowledge base entry by ID."""
    for entry in MEDICAL_KNOWLEDGE_BASE:
        if entry["id"] == condition_id:
            return entry
    return None


def list_conditions() -> List[dict]:
    """Return a summary list of all conditions in the knowledge base."""
    return [
        {
            "id": entry["id"],
            "condition": entry["condition"],
            "specialty": entry["recommended_specialty"],
        }
        for entry in MEDICAL_KNOWLEDGE_BASE
    ]
