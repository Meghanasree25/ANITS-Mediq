/* ==========================================================================
   MEDIQ SYMPTOM & ANATOMICAL CATALOG
   Clinically reviewed mapping for Indian OPD Triage (ESI v4 & District Hospital)
   Trilingual: English, Telugu (తెలుగు), Hindi (हिंदी)
   ========================================================================== */

import type { BodyRegionId, BodyRegionInfo, SymptomOption } from "../types/triage";

export const BODY_REGIONS: BodyRegionInfo[] = [
  // Core Required Regions
  {
    id: "Head",
    view: "front",
    label: {
      en: "Head",
      te: "తల",
      hi: "सिर",
    },
    description: {
      en: "Headache, dizziness, fever or eye discomfort",
      te: "తల నొప్పి, తల తిరగడం, జ్వరం లేదా కంటి అసౌకర్యం",
      hi: "सिरदर्द, चक्कर, बुखार या आँखों में परेशानी",
    },
  },
  {
    id: "Neck",
    view: "front",
    label: {
      en: "Neck",
      te: "మెడ",
      hi: "गर्दन",
    },
    description: {
      en: "Neck pain, stiffness or swelling",
      te: "మెడ నొప్పి, పట్టేయడం లేదా వాపు",
      hi: "गर्दन में दर्द, अकड़न या सूजन",
    },
  },
  {
    id: "Chest",
    view: "front",
    label: {
      en: "Chest",
      te: "ఛాతీ",
      hi: "छाती",
    },
    description: {
      en: "Chest pain, breathing difficulty, cough or palpitations",
      te: "ఛాతీ నొప్పి, శ్వాస ఇబ్బంది, దగ్గు లేదా గుండె దడ",
      hi: "सीने में दर्द, सांस लेने में तकलीफ, खांसी या घबराहట్",
    },
  },
  {
    id: "Abdomen",
    view: "front",
    label: {
      en: "Abdomen",
      te: "కడుపు",
      hi: "पेट",
    },
    description: {
      en: "Stomach pain, vomiting, nausea or burning sensation",
      te: "కడుపు నొప్పి, వాంతులు, వికారం లేదా మంట",
      hi: "पेट दर्द, उल्टी, मतली या जलन",
    },
  },
  {
    id: "LeftArm",
    view: "front",
    label: {
      en: "Left Arm",
      te: "ఎడమ చెయ్యి",
      hi: "बायाँ हाथ",
    },
    description: {
      en: "Arm pain, joint pain, swelling or numbness",
      te: "చెయ్యి నొప్పి, కీళ్ళ నొప్పి, వాపు లేదా తిమ్మిరి",
      hi: "हाथ दर्द, जोड़ों का दर्द, सूजन या सुन्न होना",
    },
  },
  {
    id: "RightArm",
    view: "front",
    label: {
      en: "Right Arm",
      te: "కుడి చెయ్యి",
      hi: "दायाँ हाथ",
    },
    description: {
      en: "Arm pain, joint pain, swelling or numbness",
      te: "చెయ్యి నొప్పి, కీళ్ళ నొప్పి, వాపు లేదా తిమ్మిరి",
      hi: "हाथ दर्द, जोड़ों का दर्द, सूजन या सुन्न होना",
    },
  },
  {
    id: "LeftLeg",
    view: "front",
    label: {
      en: "Left Leg",
      te: "ఎడమ కాలు",
      hi: "बायाँ पैर",
    },
    description: {
      en: "Leg pain, knee pain, swelling or difficulty walking",
      te: "కాలు నొప్పి, మోకాలి నొప్పి, వాపు లేదా నడవలేకపోవడం",
      hi: "पैर दर्द, घुटने का दर्द, सूजन या चलने में कठिनाई",
    },
  },
  {
    id: "RightLeg",
    view: "front",
    label: {
      en: "Right Leg",
      te: "కుడి కాలు",
      hi: "दायाँ पैर",
    },
    description: {
      en: "Leg pain, knee pain, swelling or difficulty walking",
      te: "కాలు నొప్పి, మోకాలి నొప్పి, వాపు లేదా నడవలేకపోవడం",
      hi: "पैर दर्द, घुटने का दर्द, सूजन या चलने में कठिनाई",
    },
  },

  // Backward compatibility alias definitions
  {
    id: "head",
    view: "both",
    label: { en: "Head", te: "తల", hi: "सिर" },
    description: { en: "Headache, dizziness, fever", te: "తల నొప్పి, జ్వరం", hi: "सिरदर्द, बुखार" },
  },
  {
    id: "neck",
    view: "both",
    label: { en: "Neck", te: "మెడ", hi: "गर्दन" },
    description: { en: "Neck pain or stiffness", te: "మెడ నొప్పి", hi: "गर्दन दर्द" },
  },
  {
    id: "chest",
    view: "front",
    label: { en: "Chest", te: "ఛాతీ", hi: "छाती" },
    description: { en: "Chest discomfort", te: "ఛాతీ సమస్య", hi: "छाती की परेशानी" },
  },
  {
    id: "abdomen",
    view: "front",
    label: { en: "Abdomen", te: "కడుపు", hi: "पेट" },
    description: { en: "Stomach issues", te: "కడుపు సమస్య", hi: "पेट की समस्या" },
  },
  {
    id: "arms",
    view: "both",
    label: { en: "Arms", te: "చేతులు", hi: "हाथ" },
    description: { en: "Arm pain or weakness", te: "చేతుల నొప్పి", hi: "हाथ में दर्द" },
  },
  {
    id: "legs",
    view: "both",
    label: { en: "Legs", te: "కాళ్ళు", hi: "पैर" },
    description: { en: "Leg pain or swelling", te: "కాళ్ళ నొప్పి", hi: "पैरों में दर्द" },
  },
];

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  // ==========================================
  // HEAD SYMPTOMS (Headache, Dizziness, Fever, Eye discomfort)
  // ==========================================
  {
    id: "head_headache",
    regionId: "Head",
    label: {
      en: "Headache",
      te: "తల నొప్పి",
      hi: "सिरदर्द",
    },
    iconName: "Flame",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Moderate to severe persistent headache with tension",
  },
  {
    id: "head_dizziness",
    regionId: "Head",
    label: {
      en: "Dizziness & Vertigo",
      te: "తల తిరగడం (కళ్ళు తిరగడం)",
      hi: "चक्कर आना (घूमना)",
    },
    iconName: "RotateCcw",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Feeling dizzy, lightheadedness and vertigo on standing",
  },
  {
    id: "head_fever",
    regionId: "Head",
    label: {
      en: "Fever & Chills",
      te: "జ్వరం మరియు చలి",
      hi: "बुखार और ठंड लगना",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "High body temperature, febrile chills and body aches",
  },
  {
    id: "head_eye_discomfort",
    regionId: "Head",
    label: {
      en: "Eye Discomfort / Redness",
      te: "కంటి అసౌకర్యం లేదా ఎర్రబడటం",
      hi: "आँखों में जलन या लालिमा",
    },
    iconName: "Eye",
    isRedFlag: false,
    typicalDepartment: "Ophthalmology",
    clinicalPrompt: "Eye irritation, conjunctival redness and light sensitivity",
  },
  {
    id: "head_worst_headache_rf",
    regionId: "Head",
    label: {
      en: "Sudden Severe 'Thunderclap' Headache",
      te: "అత్యంత తీవ్రమైన తల నొప్పి (Worst headache)",
      hi: "अचानक बहुत तेज असहनीय सिरदर्द",
    },
    iconName: "AlertTriangle",
    isRedFlag: true,
    redFlagCode: "RF_THUNDERCLAP_HEADACHE",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Sudden worst-ever thunderclap headache with vomiting",
  },

  // ==========================================
  // NECK SYMPTOMS (Neck pain, Stiffness, Swelling)
  // ==========================================
  {
    id: "neck_pain",
    regionId: "Neck",
    label: {
      en: "Neck Pain",
      te: "మెడ నొప్పి",
      hi: "गर्दन में दर्द",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Cervical neck pain radiating to shoulders",
  },
  {
    id: "neck_stiffness",
    regionId: "Neck",
    label: {
      en: "Neck Stiffness / Inability to Move",
      te: "మెడ పట్టేయడం (కదపలేకపోవడం)",
      hi: "गर्दन में अकड़न (हिलने में असमर्थ)",
    },
    iconName: "ShieldAlert",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Marked neck stiffness and restricted cervical motion",
  },
  {
    id: "neck_swelling",
    regionId: "Neck",
    label: {
      en: "Neck Swelling or Gland Lump",
      te: "మెడ వాపు లేదా గడ్డ",
      hi: "गर्दन में सूजन या गांठ",
    },
    iconName: "Droplet",
    isRedFlag: false,
    typicalDepartment: "ENT",
    clinicalPrompt: "Visible neck swelling or tender lymph node enlargement",
  },

  // ==========================================
  // CHEST SYMPTOMS (Chest pain, Breathing difficulty, Cough, Palpitations)
  // ==========================================
  {
    id: "chest_pain",
    regionId: "Chest",
    label: {
      en: "Chest Pain / Pressure",
      te: "ఛాతీ నొప్పి లేదా ఒత్తిడి",
      hi: "सीने में दर्द या भारीपन",
    },
    iconName: "HeartPulse",
    isRedFlag: true,
    redFlagCode: "RF_CHEST_PAIN_CARDIAC",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Acute substernal chest pressure with diaphoresis and radiation",
  },
  {
    id: "chest_breathing_difficulty",
    regionId: "Chest",
    label: {
      en: "Breathing Difficulty / Shortness of Breath",
      te: "శ్వాస తీసుకోవడంలో ఇబ్బంది (ఆయాసం)",
      hi: "सांस लेने में तकलीफ या घबराहट",
    },
    iconName: "Wind",
    isRedFlag: true,
    redFlagCode: "RF_RESP_DISTRESS",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Severe acute dyspnea and shortness of breath at rest",
  },
  {
    id: "chest_cough",
    regionId: "Chest",
    label: {
      en: "Persistent Cough / Phlegm",
      te: "దగ్గు లేదా కఫం",
      hi: "लगातार खांसी या कफ",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Pulmonology/Chest & TB",
    clinicalPrompt: "Chronic cough with expectoration and wheezing",
  },
  {
    id: "chest_palpitations",
    regionId: "Chest",
    label: {
      en: "Palpitations / Fast Heartbeat",
      te: "గుండె దడ లేదా వేగంగా కొట్టుకోవడం",
      hi: "दिल की धड़कन तेज होना",
    },
    iconName: "HeartPulse",
    isRedFlag: false,
    typicalDepartment: "Cardiology",
    clinicalPrompt: "Frequent palpitations and tachycardia sensation",
  },

  // ==========================================
  // ABDOMEN SYMPTOMS (Stomach pain, Vomiting, Nausea, Burning sensation)
  // ==========================================
  {
    id: "abdomen_stomach_pain",
    regionId: "Abdomen",
    label: {
      en: "Stomach Pain / Cramping",
      te: "కడుపు నొప్పి",
      hi: "पेट में तेज दर्द या मरोड़",
    },
    iconName: "AlertTriangle",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Generalized abdominal cramping and discomfort",
  },
  {
    id: "abdomen_vomiting",
    regionId: "Abdomen",
    label: {
      en: "Persistent Vomiting",
      te: "వాంతులు",
      hi: "लगातार उल्टियां आना",
    },
    iconName: "RotateCcw",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Frequent vomiting and inability to retain fluids",
  },
  {
    id: "abdomen_nausea",
    regionId: "Abdomen",
    label: {
      en: "Nausea & Queasiness",
      te: "వికారం లేదా వికారంగా ఉండటం",
      hi: "जी मिचलाना (मतली)",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Nausea, loss of appetite and dyspepsia",
  },
  {
    id: "abdomen_burning",
    regionId: "Abdomen",
    label: {
      en: "Burning Sensation / Acidity",
      te: "కడుపులో మంట లేదా ఎసిడిటీ",
      hi: "पेट या सीने में जलन (एसिडिटी)",
    },
    iconName: "Flame",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Epigastric burning sensation, acid regurgitation and sour belching",
  },
  {
    id: "abdomen_acute_blood_rf",
    regionId: "Abdomen",
    label: {
      en: "Vomiting Blood or Rigid Belly",
      te: "రక్తం వాంతులు లేదా కడుపు గట్టిగా బిగుసుకుపోవడం",
      hi: "खून की उल्टी या पेट का कड़ा होना",
    },
    iconName: "AlertTriangle",
    isRedFlag: true,
    redFlagCode: "RF_ACUTE_ABDOMEN",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Hematemesis with acute severe abdominal guarding and rigidity",
  },

  // ==========================================
  // ARMS SYMPTOMS (Arm pain, Joint pain, Swelling, Numbness)
  // Shared between LeftArm & RightArm
  // ==========================================
  {
    id: "arm_pain",
    regionId: "LeftArm",
    label: {
      en: "Arm Pain / Muscle Ache",
      te: "చెయ్యి నొప్పి",
      hi: "हाथ में दर्द या मांसपेशियों का खिंचाव",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Aching pain in upper limb with restricted movement",
  },
  {
    id: "arm_joint_pain",
    regionId: "LeftArm",
    label: {
      en: "Joint Pain (Shoulder, Elbow, Wrist)",
      te: "కీళ్ళ నొప్పి (భుజం, మోచేయి, మణికట్టు)",
      hi: "जोड़ों का दर्द (कंधा, कोहनी, कलाई)",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Joint stiffness and arthritis pain in arm joints",
  },
  {
    id: "arm_swelling",
    regionId: "LeftArm",
    label: {
      en: "Swelling in Arm or Hand",
      te: "చెయ్యి లేదా చేతి వాపు",
      hi: "हाथ या बांह में सूजन",
    },
    iconName: "Droplet",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Unilateral or bilateral upper limb edema and swelling",
  },
  {
    id: "arm_numbness",
    regionId: "LeftArm",
    label: {
      en: "Numbness / Tingling ('Pins & Needles')",
      te: "తిమ్మిరి లేదా సూదులు గుచ్చినట్లు ఉండటం",
      hi: "हाथ सुन्न होना या झनझनाहट",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Neurology/Medicine",
    clinicalPrompt: "Peripheral paresthesia, tingling and numbness in hand",
  },

  // Duplicate for RightArm
  {
    id: "r_arm_pain",
    regionId: "RightArm",
    label: {
      en: "Arm Pain / Muscle Ache",
      te: "కుడి చెయ్యి నొప్పి",
      hi: "दाहिने हाथ में दर्द",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Aching pain in right upper limb with muscle soreness",
  },
  {
    id: "r_arm_joint_pain",
    regionId: "RightArm",
    label: {
      en: "Joint Pain (Shoulder, Elbow, Wrist)",
      te: "కుడి కీళ్ళ నొప్పి (భుజం, మోచేయి, మణికట్టు)",
      hi: "दाहिने जोड़ों का दर्द (कंधा, कोहनी, कलाई)",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Joint stiffness and pain in right arm joints",
  },
  {
    id: "r_arm_swelling",
    regionId: "RightArm",
    label: {
      en: "Swelling in Arm or Hand",
      te: "కుడి చెయ్యి వాపు",
      hi: "दाहिने हाथ में सूजन",
    },
    iconName: "Droplet",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Right arm edema and inflammatory swelling",
  },
  {
    id: "r_arm_numbness",
    regionId: "RightArm",
    label: {
      en: "Numbness / Tingling ('Pins & Needles')",
      te: "కుడి చెయ్యి తిమ్మిరి",
      hi: "दाहिना हाथ सुन्न होना",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Neurology/Medicine",
    clinicalPrompt: "Paresthesia, tingling and numbness in right hand fingers",
  },

  // ==========================================
  // LEGS SYMPTOMS (Leg pain, Knee pain, Swelling, Difficulty walking)
  // Shared between LeftLeg & RightLeg
  // ==========================================
  {
    id: "leg_pain",
    regionId: "LeftLeg",
    label: {
      en: "Leg Pain / Thigh / Calf Ache",
      te: "కాలు నొప్పి (తొడ లేదా పిక్క నొప్పి)",
      hi: "पैर में दर्द (जांघ या पिंडली)",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Leg pain and calf muscle cramp soreness",
  },
  {
    id: "leg_knee_pain",
    regionId: "LeftLeg",
    label: {
      en: "Knee Pain & Stiffness",
      te: "మోకాలి నొప్పి మరియు బిగుతు",
      hi: "घुटने में दर्द और अकड़न",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Knee osteoarthritis with stiffness and pain on flexion",
  },
  {
    id: "leg_swelling",
    regionId: "LeftLeg",
    label: {
      en: "Swelling in Leg, Ankle or Foot",
      te: "కాలు, చీలమండ లేదా పాదం వాపు",
      hi: "पैर, टखने या पंजे में सूजन",
    },
    iconName: "Droplet",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Lower extremity pedal edema and swelling",
  },
  {
    id: "leg_difficulty_walking",
    regionId: "LeftLeg",
    label: {
      en: "Difficulty Walking / Limping",
      te: "నడవలేకపోవడం లేదా కుంటడం",
      hi: "चलने में परेशानी या लंगड़ाना",
    },
    iconName: "AlertTriangle",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Unable to bear weight on lower limb with acute antalgic gait",
  },

  // Duplicate for RightLeg
  {
    id: "r_leg_pain",
    regionId: "RightLeg",
    label: {
      en: "Leg Pain / Thigh / Calf Ache",
      te: "కుడి కాలు నొప్పి",
      hi: "दाहिने पैर में दर्द",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Right leg aching and calf muscle cramp",
  },
  {
    id: "r_leg_knee_pain",
    regionId: "RightLeg",
    label: {
      en: "Knee Pain & Stiffness",
      te: "కుడి మోకాలి నొప్పి",
      hi: "दाहिने घुटने में दर्द",
    },
    iconName: "Zap",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Right knee joint pain and restricted weight bearing",
  },
  {
    id: "r_leg_swelling",
    regionId: "RightLeg",
    label: {
      en: "Swelling in Leg, Ankle or Foot",
      te: "కుడి కాలు వాపు",
      hi: "दाहिने पैर में सूजन",
    },
    iconName: "Droplet",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Right lower limb edema and localized ankle swelling",
  },
  {
    id: "r_leg_difficulty_walking",
    regionId: "RightLeg",
    label: {
      en: "Difficulty Walking / Limping",
      te: "కుడి కాలితో నడవలేకపోవడం",
      hi: "दाहिने पैर से चलने में कठिनाई",
    },
    iconName: "AlertTriangle",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Right leg limping and acute difficulty in walking",
  },
];

/**
 * Normalizes region queries so that case variations ("Head" / "head", "LeftArm" / "arms")
 * return the clinically appropriate symptoms.
 */
export function getSymptomsForRegion(regionId: BodyRegionId | string): SymptomOption[] {
  const norm = regionId.toLowerCase();

  if (norm === "head") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "Head");
  }
  if (norm === "neck") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "Neck");
  }
  if (norm === "chest") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "Chest");
  }
  if (norm === "abdomen") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "Abdomen");
  }
  if (norm === "leftarm" || norm === "arms") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "LeftArm");
  }
  if (norm === "rightarm") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "RightArm");
  }
  if (norm === "leftleg" || norm === "legs") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "LeftLeg");
  }
  if (norm === "rightleg") {
    return SYMPTOM_OPTIONS.filter((s) => s.regionId === "RightLeg");
  }

  // Exact match fallback
  const direct = SYMPTOM_OPTIONS.filter((s) => s.regionId === regionId);
  if (direct.length > 0) return direct;

  // General fallback to Head if unknown
  return SYMPTOM_OPTIONS.filter((s) => s.regionId === "Head");
}

export function getRegionById(regionId: BodyRegionId | string): BodyRegionInfo | undefined {
  const norm = regionId.toLowerCase();
  return (
    BODY_REGIONS.find((r) => r.id === regionId) ||
    BODY_REGIONS.find((r) => r.id.toLowerCase() === norm)
  );
}
