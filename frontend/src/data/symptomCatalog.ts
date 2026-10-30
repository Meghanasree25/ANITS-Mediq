/* ==========================================================================
   MEDIQ SYMPTOM & ANATOMICAL CATALOG
   Clinically reviewed mapping for Indian OPD Triage (ESI v4 & District Hospital)
   Trilingual: English, Telugu (తెలుగు), Hindi (हिंदी)
   ========================================================================== */

import type { BodyRegionInfo, SymptomOption } from "../types/triage";

export const BODY_REGIONS: BodyRegionInfo[] = [
  {
    id: "head",
    view: "both",
    label: {
      en: "Head & Face",
      te: "తల మరియు ముఖం",
      hi: "सिर और चेहरा",
    },
    description: {
      en: "Headache, dizziness, confusion, eye or face issues",
      te: "తల నొప్పి, తల తిరగడం, గాయం",
      hi: "सिरदर्द, चक्कर, चोट या भ्रम",
    },
  },
  {
    id: "eyes",
    view: "front",
    label: {
      en: "Eyes & Vision",
      te: "కళ్ళు",
      hi: "आँखें और दृष्टि",
    },
    description: {
      en: "Eye redness, pain, sudden vision loss or injury",
      te: "కంటి నొప్పి, ఎరుపు, చూపు మందగించడం",
      hi: "आँखों में दर्द, लालिमा या दृष्टि समस्या",
    },
  },
  {
    id: "ears",
    view: "both",
    label: {
      en: "Ears & Hearing",
      te: "చెవులు",
      hi: "कान और सुनना",
    },
    description: {
      en: "Ear pain, discharge, hearing loss or ringing",
      te: "చెవి నొప్పి, చీము కారడం",
      hi: "कान दर्द, मवाद या सुनने में कमी",
    },
  },
  {
    id: "throat",
    view: "front",
    label: {
      en: "Nose, Mouth & Throat",
      te: "ముక్కు, నోరు మరియు గొంతు",
      hi: "नाक, मुँह और गला",
    },
    description: {
      en: "Sore throat, difficulty swallowing, nosebleeds, toothache",
      te: "గొంతు నొప్పి, మింగలేకపోవడం, దంతాల నొప్పి",
      hi: "गले में दर्द, निगलने में दर्द, दाँत दर्द",
    },
  },
  {
    id: "neck",
    view: "both",
    label: {
      en: "Neck & Cervical",
      te: "మెడ",
      hi: "गर्दन",
    },
    description: {
      en: "Neck stiffness, swelling, severe pain",
      te: "మెడ పట్టేయడం, వాపు లేదా నొప్పి",
      hi: "गर्दन में अकड़न, दर्द या सूजन",
    },
  },
  {
    id: "chest",
    view: "front",
    label: {
      en: "Chest & Heart",
      te: "ఛాతీ మరియు గుండె",
      hi: "छाती और दिल",
    },
    description: {
      en: "Chest pain, heavy pressure, severe breathing difficulty, palpitations",
      te: "ఛాతీ నొప్పి, గుండె దడ, ఆయాసం",
      hi: "सीने में दर्द, भारीपन, सांस फूलना, बेचैनी",
    },
  },
  {
    id: "abdomen",
    view: "front",
    label: {
      en: "Stomach & Belly",
      te: "కడుపు",
      hi: "पेट और पाचन",
    },
    description: {
      en: "Severe stomach pain, vomiting, loose motions, blood in vomit or stools",
      te: "కడుపు నొప్పి, వాంతులు, విరేచనాలు",
      hi: "पेट में तेज दर्द, उल्टी, दस्त, जलन",
    },
  },
  {
    id: "pelvis",
    view: "front",
    label: {
      en: "Pelvic & Urinary Region",
      te: "కటి మరియు మూత్ర సంబంధిత",
      hi: "कमर और मूत्र संबंधी",
    },
    description: {
      en: "Urinary burning, bleeding during pregnancy, severe lower pelvic pain",
      te: "మూత్రంలో మంట, గర్భధారణ సమస్యలు",
      hi: "पेशाब में जलन, गर्भावस्था की समस्या",
    },
  },
  {
    id: "back",
    view: "back",
    label: {
      en: "Back & Spine",
      te: "వెనుకభాగం మరియు వెన్నెముక",
      hi: "पीठ और रीढ़",
    },
    description: {
      en: "Severe back pain, spinal injury, kidney pain radiating to back",
      te: "నడుము నొప్పి, వెన్నెముక నొప్పి",
      hi: "पीठ दर्द, कमर दर्द या रीढ़ की चोट",
    },
  },
  {
    id: "shoulders",
    view: "both",
    label: {
      en: "Shoulders",
      te: "భుజాలు",
      hi: "कंधे",
    },
    description: {
      en: "Shoulder pain, dislocation, inability to move arm",
      te: "భుజం నొప్పి, కదపలేకపోవడం",
      hi: "कंधे में दर्द या उठने में परेशानी",
    },
  },
  {
    id: "arms",
    view: "both",
    label: {
      en: "Arms & Hands",
      te: "చేతులు",
      hi: "हाथ और बाहें",
    },
    description: {
      en: "Arm fracture, hand wound, cut, numbness or sudden weakness",
      te: "చెయ్యి గాయం, నొప్పీ, చచ్చుబడటం",
      hi: "हाथ की चोट, कमजोरी या सुन्न होना",
    },
  },
  {
    id: "legs",
    view: "both",
    label: {
      en: "Legs & Thighs",
      te: "కాళ్ళు",
      hi: "पैर और जांघें",
    },
    description: {
      en: "Leg swelling, sudden weakness, deep pain, inability to walk",
      te: "కాళ్ళ వాపు, నడవలేకపోవడం",
      hi: "पैरों में सूजन, चलने में असमर्थता",
    },
  },
  {
    id: "knees",
    view: "both",
    label: {
      en: "Knees & Joints",
      te: "మోకాళ్ళు",
      hi: "घुटने और जोड़",
    },
    description: {
      en: "Severe knee pain, swelling, sprain or fracture",
      te: "మోకాళ్ళ నొప్పి, కీళ్ళ వాపు",
      hi: "घुटनों में दर्द, सूजन या चोट",
    },
  },
  {
    id: "feet",
    view: "both",
    label: {
      en: "Ankles & Feet",
      te: "పాదాలు మరియు చీలమండలు",
      hi: "पैर के पंजे और टखने",
    },
    description: {
      en: "Diabetic foot ulcer, foot swelling, sprain, cut or dog bite",
      te: "పాదాల పుండ్లు, వాపు, గాయం",
      hi: "पैर में छाला, सूजन या घाव",
    },
  },
];

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  // --- HEAD ---
  {
    id: "head_pain_severe",
    regionId: "head",
    label: {
      en: "Severe 'Worst-Ever' Headache",
      te: "తీవ్రమైన తల నొప్పి (Worst headache)",
      hi: "अचानक बहुत तेज सिरदर्द",
    },
    iconName: "Flame",
    isRedFlag: true,
    redFlagCode: "RF_THUNDERCLAP_HEADACHE",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Sudden worst-ever thunderclap headache with vomiting",
  },
  {
    id: "head_dizziness",
    regionId: "head",
    label: {
      en: "Dizziness & Giddiness",
      te: "తల తిరగడం (కళ్ళు తిరగడం)",
      hi: "चक्कर आना और कमजोरी",
    },
    iconName: "RotateCcw",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Feeling dizzy, lightheadedness and weakness",
  },
  {
    id: "head_stroke_signs",
    regionId: "head",
    label: {
      en: "Facial Droop or Slurred Speech",
      te: "ముఖం ఒకవైపు వాలడం లేదా మాట తడబడటం",
      hi: "चेहरे का टेढ़ापन या बोलने में लड़खड़ाहट",
    },
    iconName: "AlertTriangle",
    isRedFlag: true,
    redFlagCode: "RF_STROKE_SIGNS",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Sudden face drooping and slurred speech weakness",
  },
  {
    id: "head_convulsions",
    regionId: "head",
    label: {
      en: "Seizures / Fits / Convulsions",
      te: "ఫిట్స్ లేదా మూర్ఛ రావడం",
      hi: "दौरे पड़ना या बेहोशी (Fits)",
    },
    iconName: "Zap",
    isRedFlag: true,
    redFlagCode: "RF_SEIZURE",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Fits and convulsions with drowsiness",
  },
  {
    id: "head_routine_pain",
    regionId: "head",
    label: {
      en: "Mild to Moderate Headache",
      te: "సాధారణ తల నొప్పి",
      hi: "हल्का या मध्यम सिरदर्द",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Dull chronic headache without fever or vomiting",
  },

  // --- CHEST ---
  {
    id: "chest_pain_cardiac",
    regionId: "chest",
    label: {
      en: "Heavy Chest Pain & Pressure",
      te: "ఛాతీలో తీవ్రమైన నొప్పి లేదా ఒత్తిడి",
      hi: "सीने में तेज दर्द, भारीपन या दबाव",
    },
    iconName: "HeartPulse",
    isRedFlag: true,
    redFlagCode: "RF_CHEST_PAIN_CARDIAC",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt:
      "Severe chest pressure with sweating and shortness of breath",
  },
  {
    id: "chest_breathing_distress",
    regionId: "chest",
    label: {
      en: "Severe Breathlessness (Cannot Speak)",
      te: "తీవ్రమైన శ్వాస ఇబ్బంది (ఆయాసం)",
      hi: "सांस लेने में बहुत तकलीफ",
    },
    iconName: "Wind",
    isRedFlag: true,
    redFlagCode: "RF_RESP_DISTRESS",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt:
      "Severe breathing difficulty unable to speak full sentences",
  },
  {
    id: "chest_cough_persistent",
    regionId: "chest",
    label: {
      en: "Cough > 2 Weeks / Sputum",
      te: "రెండు వారాలకు పైగా దగ్గు",
      hi: "दो सप्ताह से अधिक समय से खांसी",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Pulmonology/Chest & TB",
    clinicalPrompt: "Chronic cough with phlegm for more than 2 weeks",
  },
  {
    id: "chest_palpitations",
    regionId: "chest",
    label: {
      en: "Fast Heartbeat / Palpitations",
      te: "గుండె దడ లేదా వేగంగా కొట్టుకోవడం",
      hi: "दिल की धड़कन तेज होना (घबराहट)",
    },
    iconName: "Heart",
    isRedFlag: false,
    typicalDepartment: "Cardiology",
    clinicalPrompt: "Recurrent fast heartbeat sensation and ghabrahat",
  },

  // --- ABDOMEN ---
  {
    id: "abdomen_severe_acute",
    regionId: "abdomen",
    label: {
      en: "Severe Sharp Abdominal Pain",
      te: "తీవ్రమైన కడుపు నొప్పి",
      hi: "पेट में असहनीय तेज दर्द",
    },
    iconName: "AlertCircle",
    isRedFlag: true,
    redFlagCode: "RF_ACUTE_ABDOMEN",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt:
      "Severe acute abdominal pain with rigid belly and no flatus",
  },
  {
    id: "abdomen_blood_vomit",
    regionId: "abdomen",
    label: {
      en: "Vomiting Blood / Black Stools",
      te: "రక్తం వాంతులు లేదా నల్లటి మలం",
      hi: "उल्टी में खून या काला शौच आना",
    },
    iconName: "Droplet",
    isRedFlag: true,
    redFlagCode: "RF_SEVERE_BLEEDING",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Vomiting blood and black tarry stools",
  },
  {
    id: "abdomen_loose_motions",
    regionId: "abdomen",
    label: {
      en: "Loose Motions / Diarrhoea & Vomiting",
      te: "విరేచనాలు మరియు వాంతులు",
      hi: "दस्त और लगातार उल्टियां",
    },
    iconName: "RefreshCw",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt:
      "Acute watery diarrhoea and mild vomiting for one day",
  },
  {
    id: "abdomen_acidity_burning",
    regionId: "abdomen",
    label: {
      en: "Acidity, Gas & Burning Sensation",
      te: "ఎసిడిటీ, గ్యాస్ మరియు కడుపులో మంట",
      hi: "पेट में जलन, गैस और बदहजमी",
    },
    iconName: "Flame",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Upper abdominal burning and acid regurgitation",
  },

  // --- THROAT & ENT ---
  {
    id: "throat_sore",
    regionId: "throat",
    label: {
      en: "Sore Throat & Pain Swallowing",
      te: "గొంతు నొప్పి, మింగడంలో నొప్పి",
      hi: "गले में दर्द और निगलने में तकलीफ",
    },
    iconName: "ShieldAlert",
    isRedFlag: false,
    typicalDepartment: "ENT",
    clinicalPrompt: "Sore throat, tonsil inflammation and painful swallowing",
  },
  {
    id: "throat_toothache",
    regionId: "throat",
    label: {
      en: "Severe Toothache or Gum Swelling",
      te: "దంతాల నొప్పి లేదా చిగుళ్ళ వాపు",
      hi: "दाँत में तेज दर्द या मसूड़ों में सूजन",
    },
    iconName: "Smile",
    isRedFlag: false,
    typicalDepartment: "Dental",
    clinicalPrompt: "Severe toothache and localized dental gum swelling",
  },

  // --- EYES ---
  {
    id: "eyes_redness",
    regionId: "eyes",
    label: {
      en: "Red Eye, Watery & Irritation",
      te: "కళ్ళు ఎర్రబడటం, నీరు కారడం",
      hi: "आँखें लाल होना और पानी बहना",
    },
    iconName: "Eye",
    isRedFlag: false,
    typicalDepartment: "Ophthalmology",
    clinicalPrompt: "Acute conjunctivitis with redness and irritation in eyes",
  },
  {
    id: "eyes_emergency_chemical",
    regionId: "eyes",
    label: {
      en: "Chemical Splash or Sudden Vision Loss",
      te: "కంటిలో రసాయనాలు పడటం లేదా దృష్టి పోవడం",
      hi: "आँख में केमिकल जाना या अचानक रोशनी जाना",
    },
    iconName: "AlertTriangle",
    isRedFlag: true,
    redFlagCode: "RF_EYE_EMERGENCY",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Sudden complete loss of vision in eye emergency",
  },

  // --- PELVIS & PREGNANCY ---
  {
    id: "pelvis_pregnancy_bleeding",
    regionId: "pelvis",
    label: {
      en: "Vaginal Bleeding in Pregnancy",
      te: "గర్భధారణ సమయంలో రక్తస్రావం",
      hi: "गर्भावस्था में रक्तस्राव (ब्लीडिंग)",
    },
    iconName: "Droplet",
    isRedFlag: true,
    redFlagCode: "RF_PREGNANCY_BLEEDING",
    typicalDepartment: "Emergency/Casualty",
    clinicalPrompt: "Vaginal bleeding during pregnancy emergency review",
  },
  {
    id: "pelvis_urine_burning",
    regionId: "pelvis",
    label: {
      en: "Burning Sensation While Urinating",
      te: "మూత్రం పోసేటప్పుడు మంట",
      hi: "पेशाब करते समय तेज जलन",
    },
    iconName: "Flame",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Dysuria with burning sensation on urination without fever",
  },

  // --- LEGS & ORTHOPAEDICS ---
  {
    id: "legs_swelling",
    regionId: "legs",
    label: {
      en: "Leg Swelling or Fluid Retention",
      te: "కాళ్ళ వాపు",
      hi: "पैरों में सूजन",
    },
    iconName: "ArrowDown",
    isRedFlag: false,
    typicalDepartment: "General Medicine",
    clinicalPrompt: "Bilateral leg swelling for a few days",
  },
  {
    id: "legs_fracture_injury",
    regionId: "legs",
    label: {
      en: "Suspected Fracture / Unable to Stand",
      te: "ఎముక విరగడం లేదా నిలబడలేకపోవడం",
      hi: "हड्डी में फ्रैक्चर या पैर पर खड़ा न हो पाना",
    },
    iconName: "ShieldAlert",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Suspected leg bone fracture after fall unable to bear weight",
  },
  {
    id: "knees_joint_pain",
    regionId: "knees",
    label: {
      en: "Severe Knee Joint Pain & Stiffness",
      te: "మోకాళ్ళ నొప్పులు, కీళ్ళు పట్టేయడం",
      hi: "घुटनों में दर्द और चलने में परेशानी",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Knee osteoarthritis with stiffness and pain on walking",
  },
  {
    id: "feet_diabetic_ulcer",
    regionId: "feet",
    label: {
      en: "Foot Wound, Ulcer or Dog Bite",
      te: "పాదంలో పుండు, గాయం లేదా కుక్క కాటు",
      hi: "पैर का घाव, छाला या कुत्ते का काटना",
    },
    iconName: "AlertCircle",
    isRedFlag: false,
    typicalDepartment: "General Surgery",
    clinicalPrompt: "Diabetic foot wound with ulcer and local redness",
  },
  {
    id: "back_pain",
    regionId: "back",
    label: {
      en: "Severe Lower Back Pain & Spasm",
      te: "తీవ్రమైన నడుము నొప్పి",
      hi: "कमर में तेज दर्द या अकड़न",
    },
    iconName: "Activity",
    isRedFlag: false,
    typicalDepartment: "Orthopaedics",
    clinicalPrompt: "Acute lower back muscle spasm unable to bend",
  },
];

export function getSymptomsForRegion(regionId: string): SymptomOption[] {
  return SYMPTOM_OPTIONS.filter((s) => s.regionId === regionId);
}

export function getRegionById(regionId: string): BodyRegionInfo | undefined {
  return BODY_REGIONS.find((r) => r.id === regionId);
}
