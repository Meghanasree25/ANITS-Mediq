
/* ==========================================
   MEDIQ H1 — SAFETY RULE ENGINE
   Prototype only — fictional patient data.

   This module does NOT make validated
   clinical triage decisions.

   All recommendations require nurse review.
========================================== */

export type TriageInput = {
  age: number | null;
  complaint: string;
  complaintLanguage?: string;
  systolicBP: number | null;
  diastolicBP: number | null;
  pulseRate: number | null;
  temperatureC: number | null;
  spo2: number | null;
  existingConditions?: string;
  medications?: string;
};

export type TriageDecision =
  | "ESCALATE_NOW"
  | "CANNOT_ASSESS"
  | "NURSE_REVIEW";

export type TriageResult = {
  decision: TriageDecision;
  triageLevel: number | null;
  recommendedDepartment: string;
  redFlags: string[];
  triggeredRules: string[];
  validationIssues: string[];
  reasons: string[];
  requiresNurseReview: boolean;
  modelUsed: boolean;
  version: string;
};

type RedFlagRule = {
  id: string;
  label: string;
  patterns: RegExp[];
  department: string;
};

type RedFlagDetection = {
  confirmed: RedFlagRule[];
  uncertain: string[];
};

const ENGINE_VERSION =
  "MEDIQ-H1-SAFETY-PROTOTYPE-2";

/* ==========================================
   DEMONSTRATION RED-FLAG DICTIONARY

   Phrase matching is intentionally limited.
   No phrase match does NOT imply safety.

   Telugu/Hindi phrases are illustrative,
   not validated clinical translations.
========================================== */

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "RF_CHEST_PAIN",
    label: "Reported chest pain",
    patterns: [
      /\bchest pain\b/i,
      /\bchest pressure\b/i,
      /\bchest tightness\b/i,
      /ఛాతీ నొప్పి/,
      /ఛాతి నొప్పి/,
      /\bchati noppi\b/i,
      /\bseene mein dard\b/i,
      /सीने में दर्द/,
    ],
    department: "Emergency / Cardiology Review",
  },
  {
    id: "RF_BREATHING",
    label: "Reported breathing difficulty",
    patterns: [
      /\bshortness of breath\b/i,
      /\bdifficulty breathing\b/i,
      /\bcannot breathe\b/i,
      /\bcan't breathe\b/i,
      /\bstruggling to breathe\b/i,
      /శ్వాస తీసుకోవడం కష్టం/,
      /\bswasa.*kastam\b/i,
      /सांस लेने में दिक्कत/,
    ],
    department: "Emergency / General Medicine Review",
  },
  {
    id: "RF_STROKE",
    label: "Possible neurological warning symptoms",
    patterns: [
      /\bface drooping\b/i,
      /\bslurred speech\b/i,
      /\bsudden weakness\b/i,
      /\bone.side weakness\b/i,
      /\bsudden loss of speech\b/i,
      /\bsudden paralysis\b/i,
    ],
    department: "Emergency / Neurology Review",
  },
  {
    id: "RF_UNCONSCIOUS",
    label: "Reported loss of consciousness",
    patterns: [
      /\bunconscious\b/i,
      /\bunresponsive\b/i,
      /\bnot responding\b/i,
      /\bloss of consciousness\b/i,
      /\bpassed out\b/i,
      /స్పృహ లేదు/,
      /बेहोश/,
    ],
    department: "Emergency Review",
  },
  {
    id: "RF_BLEEDING",
    label: "Reported severe bleeding",
    patterns: [
      /\bsevere bleeding\b/i,
      /\bheavy bleeding\b/i,
      /\buncontrolled bleeding\b/i,
      /\bbleeding won't stop\b/i,
    ],
    department: "Emergency / Surgery Review",
  },
  {
    id: "RF_SEIZURE",
    label: "Reported seizure",
    patterns: [
      /\bseizure\b/i,
      /\bconvulsions\b/i,
      /\bfit attack\b/i,
      /\bepileptic fit\b/i,
    ],
    department: "Emergency / Neurology Review",
  },
];

/* ==========================================
   TECHNICAL MEASUREMENT VALIDATION

   These broad bounds identify implausible
   entered values. They are not clinical
   safety ranges.
========================================== */

function checkMeasurement(
  name: string,
  value: number | null,
  min: number,
  max: number,
  issues: string[]
): void {
  if (value === null || value === undefined) {
    issues.push(`${name} is missing.`);
    return;
  }

  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    issues.push(
      `${name} is invalid or implausible: ${value}.`
    );
  }
}

function validateInput(
  input: TriageInput
): string[] {
  const issues: string[] = [];

  if (
    input.age === null ||
    !Number.isInteger(input.age) ||
    input.age < 0 ||
    input.age > 120
  ) {
    issues.push("Age is missing or invalid.");
  }

  if (!input.complaint.trim()) {
    issues.push("Chief complaint is missing.");
  }

  checkMeasurement(
    "Systolic BP",
    input.systolicBP,
    30,
    300,
    issues
  );

  checkMeasurement(
    "Diastolic BP",
    input.diastolicBP,
    10,
    200,
    issues
  );

  checkMeasurement(
    "Pulse",
    input.pulseRate,
    20,
    300,
    issues
  );

  checkMeasurement(
    "Temperature",
    input.temperatureC,
    25,
    45,
    issues
  );

  checkMeasurement(
    "SpO2",
    input.spo2,
    1,
    100,
    issues
  );

  if (
    input.systolicBP !== null &&
    input.diastolicBP !== null &&
    Number.isFinite(input.systolicBP) &&
    Number.isFinite(input.diastolicBP) &&
    input.systolicBP <= input.diastolicBP
  ) {
    issues.push(
      "Blood pressure readings are inconsistent."
    );
  }

  return issues;
}

/* ==========================================
   COMPLAINT LANGUAGE VALIDATION

   The dictionary has limited examples
   for English, Telugu and Hindi.

   Even these languages are not comprehensively
   supported or clinically validated.
========================================== */

function validateComplaintLanguage(
  input: TriageInput
): string[] {
  const issues: string[] = [];

  const language = (
    input.complaintLanguage ?? "English"
  )
    .trim()
    .toLowerCase();

  const supportedLanguages = [
    "english",
    "telugu",
    "hindi",
  ];

  if (!supportedLanguages.includes(language)) {
    issues.push(
      "Complaint language requires manual interpretation."
    );
  }

  return issues;
}

/* ==========================================
   NEGATION-AWARE RED-FLAG DETECTION

   Conservative prototype approach:
   - Positive matched symptoms trigger escalation.
   - Possible negation becomes uncertain.
   - Uncertain cases require nurse assessment.

   This is not clinical NLP.
========================================== */

function detectRedFlags(
  complaint: string
): RedFlagDetection {
  const confirmed: RedFlagRule[] = [];
  const uncertain: string[] = [];

  const sentences = complaint
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const negationPattern =
    /\b(no|not|without|denies|denied|never)\b/i;

  for (const sentence of sentences) {
    for (const rule of RED_FLAG_RULES) {
      const matches = rule.patterns.some(
        (pattern) => pattern.test(sentence)
      );

      if (!matches) {
        continue;
      }

      if (negationPattern.test(sentence)) {
        uncertain.push(
          `${rule.label}: possible negation or ambiguous wording.`
        );
      } else {
        confirmed.push(rule);
      }
    }
  }

  const uniqueConfirmed = Array.from(
    new Map(
      confirmed.map((rule) => [
        rule.id,
        rule,
      ])
    ).values()
  );

  return {
    confirmed: uniqueConfirmed,
    uncertain: [...new Set(uncertain)],
  };
}

/* ==========================================
   DEMONSTRATION VITAL ESCALATION RULES

   The thresholds are illustrative
   software-test values, not an approved
   clinical triage protocol.
========================================== */

function detectCriticalVitals(
  input: TriageInput
): string[] {
  const rules: string[] = [];

  if (
    input.spo2 !== null &&
    Number.isFinite(input.spo2) &&
    input.spo2 > 0 &&
    input.spo2 < 90
  ) {
    rules.push(
      "DEMO_VITAL_SPO2: SpO2 below prototype escalation threshold."
    );
  }

  if (
    input.systolicBP !== null &&
    Number.isFinite(input.systolicBP) &&
    input.systolicBP > 0 &&
    input.systolicBP < 90
  ) {
    rules.push(
      "DEMO_VITAL_BP: Systolic BP below prototype escalation threshold."
    );
  }

  if (
    input.pulseRate !== null &&
    Number.isFinite(input.pulseRate) &&
    (
      input.pulseRate < 40 ||
      input.pulseRate > 150
    )
  ) {
    rules.push(
      "DEMO_VITAL_PULSE: Pulse outside prototype escalation range."
    );
  }

  return rules;
}

/* ==========================================
   DEPARTMENT SUGGESTION

   Suggests a review destination only.
   Does not determine final specialty.
========================================== */

function suggestDepartment(
  flags: RedFlagRule[]
): string {
  if (flags.length === 0) {
    return "General Medicine / Nurse Review";
  }

  if (flags.length > 1) {
    return "Emergency Review";
  }

  return flags[0].department;
}

/* ==========================================
   MAIN SAFETY ENGINE
========================================== */

export function evaluateTriageSafety(
  input: TriageInput
): TriageResult {
  const validationIssues = [
    ...validateInput(input),
    ...validateComplaintLanguage(input),
  ];

  const detection = detectRedFlags(
    input.complaint
  );

  const detectedFlags = detection.confirmed;

  validationIssues.push(
    ...detection.uncertain
  );

  const criticalVitalRules =
    detectCriticalVitals(input);

  const triggeredRules = [
    ...detectedFlags.map((flag) => flag.id),
    ...criticalVitalRules,
  ];

  const redFlags = detectedFlags.map(
    (flag) => flag.label
  );

  const recommendedDepartment =
    suggestDepartment(detectedFlags);

  /* ======================================
     PRIORITY 1 — ESCALATE NOW

     Escalation takes precedence over
     missing or inconsistent information.
  ====================================== */

  if (triggeredRules.length > 0) {
    return {
      decision: "ESCALATE_NOW",
      triageLevel: null,

      recommendedDepartment:
        criticalVitalRules.length > 0
          ? "Emergency Review"
          : recommendedDepartment,

      redFlags,
      triggeredRules,
      validationIssues,

      reasons: [
        "A demonstration escalation rule was triggered.",
        "Immediate qualified staff assessment is required.",
        "No automatic five-level triage score has been assigned.",
      ],

      requiresNurseReview: true,
      modelUsed: false,
      version: ENGINE_VERSION,
    };
  }

  /* ======================================
     PRIORITY 2 — CANNOT ASSESS

     Missing measurements, invalid data,
     unsupported languages, or uncertain
     symptom descriptions.
  ====================================== */

  if (validationIssues.length > 0) {
    return {
      decision: "CANNOT_ASSESS",
      triageLevel: null,

      recommendedDepartment:
        "Nurse Assessment Required",

      redFlags: [],
      triggeredRules: [
        "INPUT_VALIDATION_ABSTAIN",
      ],

      validationIssues,

      reasons: [
        "Required information is missing, inconsistent, or uncertain.",
        "Cannot assess — send to nurse now.",
        "No automatic low-priority classification is permitted.",
      ],

      requiresNurseReview: true,
      modelUsed: false,
      version: ENGINE_VERSION,
    };
  }

  /* ======================================
     PRIORITY 3 — NURSE REVIEW

     No supported prototype escalation
     rule was detected.

     This does not imply clinical safety.
  ====================================== */

  return {
    decision: "NURSE_REVIEW",
    triageLevel: null,

    recommendedDepartment,

    redFlags: [],
    triggeredRules: [],
    validationIssues: [],

    reasons: [
      "No supported demonstration rule was triggered.",
      "This does not exclude an emergency.",
      "Independent nurse assessment is still required.",
    ],

    requiresNurseReview: true,
    modelUsed: false,
    version: ENGINE_VERSION,
  };
}
