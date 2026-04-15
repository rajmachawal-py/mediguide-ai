/**
 * MediGuide AI — FHIR Export Service
 * Exports triage results in HL7 FHIR R4 format (JSON).
 *
 * Resources generated:
 * - Patient (demographics)
 * - Encounter (triage visit)
 * - Condition (chief complaint + urgency)
 * - Observation (AI triage assessment)
 *
 * Ref: https://hl7.org/fhir/R4/
 */

/**
 * Generate a FHIR R4 Bundle from triage data.
 *
 * @param {Object} params
 * @param {string} params.patientName
 * @param {string} params.age
 * @param {string} params.gender     - "Male" | "Female" | "Other"
 * @param {string} params.language   - "hi" | "mr" | "en"
 * @param {string} params.urgency    - "mild" | "moderate" | "emergency"
 * @param {Object} params.urgencyData - Full triage response
 * @param {Array}  params.messages   - Chat messages
 * @param {Object} params.summary    - Doctor summary
 * @returns {Object} FHIR R4 Bundle
 */
export function generateFHIRBundle({
  patientName = 'Patient',
  age = '',
  gender = '',
  language = 'en',
  urgency = 'mild',
  urgencyData = {},
  messages = [],
  summary = {},
}) {
  const now = new Date().toISOString()
  const patientId = `patient-${Date.now()}`
  const encounterId = `encounter-${Date.now()}`
  const conditionId = `condition-${Date.now()}`
  const observationId = `observation-${Date.now()}`

  // Map urgency to FHIR triage priority codes
  // Ref: https://hl7.org/fhir/R4/valueset-encounter-priority.html
  const triagePriority = {
    mild: { code: 'non-urgent', display: 'Non-urgent' },
    moderate: { code: 'urgent', display: 'Urgent' },
    emergency: { code: 'emergency', display: 'Emergency' },
  }

  // Map gender to FHIR codes
  const fhirGender = {
    Male: 'male', male: 'male', M: 'male',
    Female: 'female', female: 'female', F: 'female',
    Other: 'other', other: 'other',
    पुरुष: 'male', महिला: 'female', अन्य: 'other',
  }

  // Estimate birth year from age
  const birthYear = age ? new Date().getFullYear() - parseInt(age) : undefined

  // Build FHIR Bundle
  const bundle = {
    resourceType: 'Bundle',
    id: `mediguide-bundle-${Date.now()}`,
    type: 'document',
    timestamp: now,
    meta: {
      lastUpdated: now,
      profile: ['http://hl7.org/fhir/R4/bundle.html'],
      tag: [
        {
          system: 'http://mediguide-ai.in/fhir/tags',
          code: 'ai-triage',
          display: 'AI-Assisted Triage Report',
        },
      ],
    },
    entry: [
      // ── Patient Resource ────────────────────────────
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: 'Patient',
          id: patientId,
          name: [
            {
              use: 'official',
              text: patientName,
            },
          ],
          gender: fhirGender[gender] || 'unknown',
          ...(birthYear && {
            birthDate: `${birthYear}-01-01`,
          }),
          communication: [
            {
              language: {
                coding: [
                  {
                    system: 'urn:ietf:bcp:47',
                    code: language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en',
                    display: language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English',
                  },
                ],
              },
              preferred: true,
            },
          ],
        },
      },

      // ── Encounter Resource (Triage Visit) ───────────
      {
        fullUrl: `urn:uuid:${encounterId}`,
        resource: {
          resourceType: 'Encounter',
          id: encounterId,
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory',
          },
          type: [
            {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '225390008',
                  display: 'Triage',
                },
              ],
            },
          ],
          priority: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
                code: triagePriority[urgency]?.code || 'non-urgent',
                display: triagePriority[urgency]?.display || 'Non-urgent',
              },
            ],
          },
          subject: {
            reference: `urn:uuid:${patientId}`,
          },
          period: {
            start: now,
            end: now,
          },
          reasonCode: [
            {
              text: summary?.chief_complaint || messages.find(m => m.role === 'user')?.content || 'Symptom assessment',
            },
          ],
        },
      },

      // ── Condition Resource (Chief Complaint) ────────
      {
        fullUrl: `urn:uuid:${conditionId}`,
        resource: {
          resourceType: 'Condition',
          id: conditionId,
          clinicalStatus: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active',
              },
            ],
          },
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                  code: 'encounter-diagnosis',
                  display: 'Encounter Diagnosis',
                },
              ],
            },
          ],
          severity: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: urgency === 'emergency' ? '24484000' : urgency === 'moderate' ? '6736007' : '255604002',
                display: urgency === 'emergency' ? 'Severe' : urgency === 'moderate' ? 'Moderate' : 'Mild',
              },
            ],
          },
          code: {
            text: summary?.chief_complaint || 'Reported symptoms — see notes',
          },
          subject: {
            reference: `urn:uuid:${patientId}`,
          },
          encounter: {
            reference: `urn:uuid:${encounterId}`,
          },
          recordedDate: now,
          note: summary?.associated_symptoms
            ? [{ text: `Associated symptoms: ${summary.associated_symptoms.join(', ')}` }]
            : [],
        },
      },

      // ── Observation Resource (AI Triage Assessment) ─
      {
        fullUrl: `urn:uuid:${observationId}`,
        resource: {
          resourceType: 'Observation',
          id: observationId,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'survey',
                  display: 'Survey',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '11283-9',
                display: 'Triage note',
              },
            ],
            text: 'AI Triage Assessment',
          },
          subject: {
            reference: `urn:uuid:${patientId}`,
          },
          encounter: {
            reference: `urn:uuid:${encounterId}`,
          },
          effectiveDateTime: now,
          valueString: summary?.full_summary || urgencyData?.summary_for_doctor || 'AI triage assessment completed',
          interpretation: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: urgency === 'emergency' ? 'AA' : urgency === 'moderate' ? 'A' : 'N',
                  display: urgency === 'emergency' ? 'Critical abnormal' : urgency === 'moderate' ? 'Abnormal' : 'Normal',
                },
              ],
            },
          ],
          component: [
            {
              code: { text: 'Urgency Level' },
              valueString: urgency,
            },
            {
              code: { text: 'Recommended Specialty' },
              valueString: urgencyData?.recommend_specialty || summary?.recommend_specialty || 'General',
            },
            {
              code: { text: 'Go to Hospital Now' },
              valueBoolean: urgencyData?.go_to_hospital_now || false,
            },
            {
              code: { text: 'Call Ambulance' },
              valueBoolean: urgencyData?.call_ambulance || false,
            },
          ],
          note: [
            {
              text: '⚠️ This is an AI-assisted triage assessment, not a medical diagnosis. Generated by MediGuide AI.',
            },
          ],
        },
      },
    ],
  }

  return bundle
}

/**
 * Download the FHIR Bundle as a JSON file.
 */
export function downloadFHIRBundle(params) {
  const bundle = generateFHIRBundle(params)
  const jsonStr = JSON.stringify(bundle, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/fhir+json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `MediGuide_FHIR_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 100)

  return bundle
}
