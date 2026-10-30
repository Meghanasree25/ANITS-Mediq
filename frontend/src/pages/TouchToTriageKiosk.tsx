/* ==========================================================================
   MEDIQ — TOUCH-TO-TRIAGE PATIENT KIOSK
   Picture-based, accessible, multilingual self-triage for hospital OPDs
   Guided 4-Step Patient Journey: Profile -> Body Map -> Visual Questions -> AI Triage
   ========================================================================== */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Volume2,
} from "lucide-react";
import type {
  BodyRegionId,
  LanguageCode,
  PatientDemographics,
  PatientTriageRecord,
  SymptomOption,
  VisualQuestionnaireAnswers,
} from "../types/triage";
import InteractiveBodyMap from "../components/InteractiveBodyMap";
import BodyProblemSelector from "../components/BodyProblemSelector";
import VisualQuestionnaire from "../components/VisualQuestionnaire";
import EmergencyEscalationModal from "../components/EmergencyEscalationModal";
import TriageResultCard from "../components/TriageResultCard";
import { audioService } from "../lib/audioService";
import { evaluatePatientTriage } from "../lib/triageBridge";
import { savePatientRegistration } from "../lib/patientStorage";

type KioskStep = "demographics" | "anatomy" | "questionnaire" | "result";

export default function TouchToTriageKiosk() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [currentStep, setCurrentStep] = useState<KioskStep>("anatomy"); // Default directly to interactive anatomy for instant wow factor!

  // Patient Intake State
  const [demographics, setDemographics] = useState<PatientDemographics>({
    fullName: "Patient",
    ageYears: 35,
    gender: "M",
    isPregnant: false,
    arrivalMode: "Walk-in",
    knownConditions: [],
  });

  const [selectedRegions, setSelectedRegions] = useState<BodyRegionId[]>(["Chest"]);
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId>("Chest");
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomOption[]>([]);
  const [questionnaire, setQuestionnaire] = useState<VisualQuestionnaireAnswers>({
    duration: "just_started",
    severity: "moderate",
    isGettingWorse: false,
    hasOccurredBefore: false,
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<PatientTriageRecord | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Multi-region selection handlers
  const handleToggleRegion = (regionId: BodyRegionId) => {
    setSelectedRegions((prev) => {
      const exists = prev.includes(regionId);
      if (exists) {
        const remaining = prev.filter((r) => r !== regionId);
        if (selectedRegion === regionId && remaining.length > 0) {
          setSelectedRegion(remaining[remaining.length - 1]);
        }
        return remaining;
      } else {
        setSelectedRegion(regionId);
        return [...prev, regionId];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedRegions([]);
    setSelectedSymptoms([]);
  };

  // 4-Step Navigation Progress definition
  const journeySteps: { id: KioskStep; stepNum: number; label: Record<LanguageCode, string> }[] = [
    {
      id: "demographics",
      stepNum: 1,
      label: { en: "1. Profile", te: "1. ప్రొఫైల్", hi: "1. प्रोफाइल" },
    },
    {
      id: "anatomy",
      stepNum: 2,
      label: { en: "2. Body Anatomy", te: "2. శరీర భాగం", hi: "2. शरीर व लक्षण" },
    },
    {
      id: "questionnaire",
      stepNum: 3,
      label: { en: "3. Visual Questions", te: "3. ప్రశ్నలు", hi: "3. प्रश्न" },
    },
    {
      id: "result",
      stepNum: 4,
      label: { en: "4. AI Triage Result", te: "4. ఫలితం", hi: "4. परिणाम" },
    },
  ];

  // Audio helper for step navigation
  const announceStep = (stepName: KioskStep, lang: LanguageCode) => {
    const messages: Record<KioskStep, Record<LanguageCode, string>> = {
      demographics: {
        en: "Step 1: Patient Profile. Select approximate age and gender.",
        te: "దశ 1: రోగి వివరాలు. వయస్సు మరియు లింగం ఎంచుకోండి.",
        hi: "चरण 1: मरीज का विवरण। उम्र और लिंग चुनें।",
      },
      anatomy: {
        en: "Step 2: Interactive Anatomy. Please touch the affected body region to load symptoms.",
        te: "దశ 2: శరీర భాగం. దయచేసి మీకు సమస్య ఉన్న భాగాన్ని తాకండి.",
        hi: "चरण 2: शरीर का नक्शा। कृपया दर्द वाले अंग को स्पर्श करें।",
      },
      questionnaire: {
        en: "Step 3: Visual Questions. Answer simple questions about severity and timeline.",
        te: "దశ 3: ప్రశ్నలు. నొప్పి తీవ్రత మరియు సమయం గురించి సమాధానం ఇవ్వండి.",
        hi: "चरण 3: प्रश्न। अपनी परेशानी की गंभीरता और समय बताएं।",
      },
      result: {
        en: "Step 4: AI Triage Evaluation complete. Your OPD token is ready.",
        te: "దశ 4: కృత్రిమ మేధస్సు పరిశీలన పూర్తయింది. మీ టోకెన్ సిద్ధమైంది.",
        hi: "चरण 4: एआई मूल्यांकन पूरा हुआ। आपका टोकन तैयार है।",
      },
    };
    void audioService.speak(messages[stepName][lang], lang);
  };

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLanguage(newLang);
    announceStep(currentStep, newLang);
  };

  const handleToggleSymptom = (symptom: SymptomOption) => {
    const exists = selectedSymptoms.some((s) => s.id === symptom.id);
    let updated: SymptomOption[];

    if (exists) {
      updated = selectedSymptoms.filter((s) => s.id !== symptom.id);
    } else {
      updated = [...selectedSymptoms, symptom];
      // Check for immediate emergency red flag
      if (symptom.isRedFlag) {
        setIsEmergencyModalOpen(true);
      }
    }
    setSelectedSymptoms(updated);
  };

  const handleCompleteQuestionnaire = async () => {
    setIsEvaluating(true);
    try {
      const evaluation = await evaluatePatientTriage(
        demographics,
        selectedSymptoms,
        questionnaire
      );

      const tokenNumber = `MEDIQ-A${Math.floor(100 + Math.random() * 900)}`;
      const newRecord: PatientTriageRecord = {
        id: crypto.randomUUID(),
        token: tokenNumber,
        demographics,
        selectedRegion: selectedRegion || "chest",
        selectedSymptoms,
        questionnaire,
        aiEvaluation: evaluation,
        status: evaluation.isEmergencyEscalated ? "Emergency Casualty" : "Waiting",
        createdAt: new Date().toISOString(),
        languageUsed: language,
      };

      setCompletedRecord(newRecord);

      // Save to local demonstration queue
      savePatientRegistration({
        fullName: demographics.fullName || `Patient (${demographics.ageYears}y)`,
        age: String(demographics.ageYears),
        gender: demographics.gender,
        phone: demographics.phoneNumber || "Not provided",
        department: evaluation.department,
        visitReason: selectedSymptoms.map((s) => s.label.en).join(", "),
        symptoms: `${questionnaire.duration}, severity: ${questionnaire.severity}`,
        duration: questionnaire.duration,
        existingConditions: (demographics.knownConditions || []).join(", "),
        medications: "",
        allergies: "",
      });

      setCurrentStep("result");
      announceStep("result", language);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const emergencyFlags = selectedSymptoms.filter((s) => s.isRedFlag);

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#34434A] flex flex-col font-sans select-none">
      {/* Top Accessible Hospital Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8] shadow-2xs px-4 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-3">
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#269C91] to-[#1E7E75] flex items-center justify-center text-white shadow-md shadow-[#269C91]/20">
            <HeartPulse size={26} className="text-[#E8F5F3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#34434A]">
                MEDIQ
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#E8F5F3] text-[#269C91] px-2.5 py-0.5 rounded-full border border-[#269C91]/30">
                Touch-to-Triage
              </span>
            </div>
            <p className="text-xs text-[#5C6E78] font-medium">
              District Hospital OPD • Automated Self-Triage Kiosk
            </p>
          </div>
        </div>

        {/* Action Controls: Language Toggle & Staff Mode Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Trilingual Language Selector */}
          <div className="flex items-center bg-[#F7F4EF] p-1 rounded-2xl border border-[#E5E1D8]">
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                language === "en"
                  ? "bg-[#269C91] text-white shadow-xs"
                  : "text-[#5C6E78] hover:text-[#34434A]"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("te")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                language === "te"
                  ? "bg-[#269C91] text-white shadow-xs"
                  : "text-[#5C6E78] hover:text-[#34434A]"
              }`}
            >
              తెలుగు
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("hi")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                language === "hi"
                  ? "bg-[#269C91] text-white shadow-xs"
                  : "text-[#5C6E78] hover:text-[#34434A]"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Voice Prompt Repeat Button */}
          <button
            type="button"
            onClick={() => announceStep(currentStep, language)}
            title="Repeat instructions"
            className="p-2.5 bg-[#E8F5F3] hover:bg-[#269C91]/15 text-[#269C91] border border-[#269C91]/30 rounded-2xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 size={16} className="text-[#269C91]" />
            <span className="text-xs font-bold hidden md:inline">
              {language === "te" ? "సూచనలు వినండి" : language === "hi" ? "निर्देश सुनें" : "Voice Guide"}
            </span>
          </button>

          {/* Staff Mode Switcher */}
          <Link
            to="/staff"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F7F4EF] hover:bg-[#E8F5F3] text-[#34434A] hover:text-[#269C91] border border-[#E5E1D8] hover:border-[#269C91]/40 rounded-2xl text-xs font-bold transition shadow-2xs"
          >
            <Stethoscope size={16} className="text-[#269C91]" />
            <span className="hidden sm:inline">Staff Clinical Mode</span>
          </Link>
        </div>
      </header>

      {/* Guided 4-Step Patient Journey Navigation Bar */}
      <div className="w-full bg-white border-b border-[#E5E1D8] px-4 py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          {journeySteps.map((st) => {
            const isActive = currentStep === st.id;
            const isCompleted =
              (st.id === "demographics" && currentStep !== "demographics") ||
              (st.id === "anatomy" && (currentStep === "questionnaire" || currentStep === "result")) ||
              (st.id === "questionnaire" && currentStep === "result");

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (st.id === "result" && !completedRecord) return;
                  setCurrentStep(st.id);
                  announceStep(st.id, language);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#269C91] text-white shadow-xs"
                    : isCompleted
                    ? "bg-[#E8F5F3] text-[#1E7E75] hover:bg-[#E8F5F3]/80"
                    : "text-[#8E9EA7] hover:text-[#34434A]"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    isActive
                      ? "bg-white text-[#269C91]"
                      : isCompleted
                      ? "bg-[#269C91] text-white"
                      : "bg-[#E5E1D8] text-[#5C6E78]"
                  }`}
                >
                  {isCompleted ? "✓" : st.stepNum}
                </span>
                <span>{st.label[language]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Kiosk Journey Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
        {/* ====================================================================
            STEP 1: PATIENT PROFILE (AGE CATEGORY & GENDER)
           ==================================================================== */}
        {currentStep === "demographics" && (
          <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E1D8] shadow-xl flex flex-col gap-6 animate-fadeIn">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-[#269C91] bg-[#E8F5F3] px-3 py-1 rounded-full border border-[#269C91]/30">
                {language === "te" ? "దశ 1 — ప్రొఫైల్ వివరాలు" : language === "hi" ? "चरण 1 — मरीज का विवरण" : "Step 1: Patient Profile"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#34434A] mt-3">
                {language === "te"
                  ? "రోగి వయస్సు మరియు వివరాలు"
                  : language === "hi"
                  ? "मरीज की उम्र और विवरण"
                  : "Patient Age & Gender Selection"}
              </h1>
              <p className="text-xs sm:text-sm text-[#5C6E78] mt-1 font-medium">
                {language === "te"
                  ? "సరైన వైద్య విభాగాన్ని కేటాయించడానికి మీ వయస్సు వర్గాన్ని ఎంచుకోండి"
                  : language === "hi"
                  ? "सटीक ओपीडी विभाग चुनने के लिए अपनी आयु श्रेणी चुनें"
                  : "Large touch cards for quick selection without typing"}
              </p>
            </div>

            {/* Age Category Cards */}
            <div>
              <label className="text-xs font-bold text-[#5C6E78] uppercase tracking-wider block mb-2.5">
                {language === "te" ? "వయస్సు వర్గం:" : language === "hi" ? "आयु वर्ग:" : "Age Category:"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    years: 0.2,
                    label: { en: "Infant (< 1 yr)", te: "శిశువు (< 1 సం)", hi: "शिशु (< 1 वर्ष)" },
                    icon: "👶",
                  },
                  {
                    years: 6,
                    label: { en: "Child (1 - 12)", te: "పిల్లలు (1 - 12)", hi: "बच्चे (1 - 12)" },
                    icon: "🧒",
                  },
                  {
                    years: 32,
                    label: { en: "Adult (13 - 59)", te: "యువకులు (13 - 59)", hi: "वयस्क (13 - 59)" },
                    icon: "🧑",
                  },
                  {
                    years: 68,
                    label: { en: "Senior (60+)", te: "వృద్ధులు (60+)", hi: "बुजुर्ग (60+)" },
                    icon: "👴",
                  },
                ].map((cat, idx) => {
                  const isSelected =
                    (cat.years < 1 && demographics.ageYears < 1) ||
                    (cat.years === 6 && demographics.ageYears >= 1 && demographics.ageYears <= 12) ||
                    (cat.years === 32 && demographics.ageYears > 12 && demographics.ageYears < 60) ||
                    (cat.years === 68 && demographics.ageYears >= 60);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setDemographics((prev) => ({
                          ...prev,
                          ageYears: Math.round(cat.years),
                        }))
                      }
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isSelected
                          ? "bg-[#E8F5F3] border-[#269C91] shadow-md ring-4 ring-[#269C91]/20"
                          : "bg-[#F7F4EF] border-[#E5E1D8] hover:border-[#269C91]/40 hover:bg-white"
                      }`}
                    >
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="font-extrabold text-[#34434A] text-xs text-center leading-tight">
                        {cat.label[language]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Selection Cards */}
            <div>
              <label className="text-xs font-bold text-[#5C6E78] uppercase tracking-wider block mb-2.5">
                {language === "te" ? "లింగం:" : language === "hi" ? "लिंग:" : "Gender:"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDemographics((prev) => ({
                      ...prev,
                      gender: "M",
                      isPregnant: false,
                    }))
                  }
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer ${
                    demographics.gender === "M"
                      ? "bg-[#E8F5F3] border-[#269C91] text-[#1E7E75] shadow-xs"
                      : "bg-[#F7F4EF] border-[#E5E1D8] text-[#34434A] hover:bg-white"
                  }`}
                >
                  <span className="text-xl">👨</span>
                  <span>{language === "te" ? "పురుషుడు (Male)" : language === "hi" ? "पुरुष (Male)" : "Male"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDemographics((prev) => ({
                      ...prev,
                      gender: "F",
                    }))
                  }
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer ${
                    demographics.gender === "F"
                      ? "bg-[#E8F5F3] border-[#269C91] text-[#1E7E75] shadow-xs"
                      : "bg-[#F7F4EF] border-[#E5E1D8] text-[#34434A] hover:bg-white"
                  }`}
                >
                  <span className="text-xl">👩</span>
                  <span>{language === "te" ? "స్త్రీ (Female)" : language === "hi" ? "महिला (Female)" : "Female"}</span>
                </button>
              </div>

              {/* Maternal Health Pregnancy Guardrail */}
              {demographics.gender === "F" && demographics.ageYears >= 12 && (
                <div className="mt-3 p-3.5 bg-[#FDF2F4] border border-[#F3C5CE] rounded-2xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPregnant"
                    checked={demographics.isPregnant}
                    onChange={(e) =>
                      setDemographics((prev) => ({
                        ...prev,
                        isPregnant: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded text-[#D96B83] focus:ring-[#D96B83] accent-[#D96B83]"
                  />
                  <label
                    htmlFor="isPregnant"
                    className="text-xs font-black text-[#8C243B] cursor-pointer"
                  >
                    {language === "te"
                      ? "గర్భవతి (Currently Pregnant) — ప్రత్యేక మాతృత్వ రక్షణ నియమాలు వర్తిస్తాయి"
                      : language === "hi"
                      ? "गर्भवती (Currently Pregnant) — मातृत्व सुरक्षा नियम लागू होंगे"
                      : "Currently Pregnant (Applies maternal clinical thresholds)"}
                  </label>
                </div>
              )}
            </div>

            {/* Advance to Step 2 */}
            <button
              type="button"
              onClick={() => {
                setCurrentStep("anatomy");
                announceStep("anatomy", language);
              }}
              className="w-full py-4 px-6 bg-[#269C91] hover:bg-[#1E7E75] active:scale-98 text-white font-black text-base rounded-2xl shadow-xl shadow-[#269C91]/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>
                {language === "te"
                  ? "దశ 2: శరీర నమూనాను తాకండి (Next)"
                  : language === "hi"
                  ? "चरण 2: शरीर का नक्शा देखें (Next)"
                  : "Next: Touch Anatomical Body Map"}
              </span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* ====================================================================
            STEP 2: INTERACTIVE ANATOMICAL BODY MAP & PROBLEM CARDS
           ==================================================================== */}
        {currentStep === "anatomy" && (
          <div className="flex flex-col lg:flex-row items-start gap-6 w-full animate-fadeIn">
            {/* Left Column: Interactive Human Anatomical Silhouette */}
            <div className="w-full lg:w-5/12 flex flex-col items-center">
              <div className="w-full text-center lg:text-left mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-[#269C91] bg-[#E8F5F3] px-3 py-1 rounded-full border border-[#269C91]/30">
                  {language === "te" ? "దశ 2 — శరీర భాగం ఎంపిక" : language === "hi" ? "चरण 2 — अंग का चयन" : "Step 2: Anatomical Selection"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#34434A] mt-1">
                  {language === "te"
                    ? "శరీరంపై నొప్పి ఉన్న భాగాన్ని తాకండి"
                    : language === "hi"
                    ? "शरीर के प्रभावित अंग को स्पर्श करें"
                    : "Touch the Affected Body Region"}
                </h2>
              </div>

              <InteractiveBodyMap
                selectedRegions={selectedRegions}
                selectedRegion={selectedRegion}
                onToggleRegion={handleToggleRegion}
                onSelectRegion={(regId) => {
                  setSelectedRegion(regId);
                  if (!selectedRegions.includes(regId)) {
                    setSelectedRegions((prev) => [...prev, regId]);
                  }
                }}
                onClearSelection={handleClearSelection}
                language={language}
              />
            </div>

            {/* Right Column: Dynamic Symptom Problem Cards */}
            <div className="w-full lg:w-7/12 bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E1D8] shadow-xl flex flex-col gap-6">
              {selectedRegions.length > 0 || selectedRegion ? (
                <>
                  <BodyProblemSelector
                    regionId={selectedRegion}
                    selectedRegions={selectedRegions}
                    selectedSymptoms={selectedSymptoms}
                    onToggleSymptom={handleToggleSymptom}
                    onSelectRegionTab={(rId) => setSelectedRegion(rId)}
                    language={language}
                  />

                  {/* Navigation Buttons */}
                  <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep("demographics")}
                      className="px-4 py-2.5 rounded-xl text-[#5C6E78] hover:text-[#34434A] hover:bg-[#F7F4EF] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ArrowLeft size={16} />
                      <span>{language === "te" ? "వెనుకకు" : language === "hi" ? "पीछे" : "Back to Profile"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedSymptoms.length === 0}
                      onClick={() => {
                        setCurrentStep("questionnaire");
                        announceStep("questionnaire", language);
                      }}
                      className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 transition shadow-lg cursor-pointer ${
                        selectedSymptoms.length > 0
                          ? "bg-[#269C91] hover:bg-[#1E7E75] active:scale-95 text-white shadow-[#269C91]/25"
                          : "bg-[#E5E1D8] text-[#8E9EA7] cursor-not-allowed"
                      }`}
                    >
                      <span>
                        {language === "te"
                          ? `దశ 3 కి వెళ్ళండి (${selectedSymptoms.length} ఎంపికైంది)`
                          : language === "hi"
                          ? `चरण 3 पर जाएं (${selectedSymptoms.length} चुना गया)`
                          : `Step 3: Visual Questions (${selectedSymptoms.length} selected)`}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-[#5C6E78] gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#E8F5F3] flex items-center justify-center text-[#269C91]">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold max-w-xs text-[#34434A]">
                    {language === "te"
                      ? "దయచేసి ఎడమవైపు శరీర నమూనాపై ఒక భాగాన్ని తాకండి"
                      : language === "hi"
                      ? "कृपया बाईं ओर शरीर के किसी अंग को स्पर्श करें"
                      : "Please tap any body part on the anatomical model to view common symptoms"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            STEP 3: ACCESSIBLE GUIDED VISUAL QUESTIONNAIRE
           ==================================================================== */}
        {currentStep === "questionnaire" && (
          <VisualQuestionnaire
            answers={questionnaire}
            onChange={(updated) =>
              setQuestionnaire((prev) => ({ ...prev, ...updated }))
            }
            onComplete={handleCompleteQuestionnaire}
            onBack={() => setCurrentStep("anatomy")}
            language={language}
          />
        )}

        {/* ====================================================================
            STEP 4: AI EVALUATION RESULT & CLINICAL TOKEN
           ==================================================================== */}
        {currentStep === "result" && completedRecord && (
          <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
            {/* Header Token Alert */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8F5F3] text-[#269C91] flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#269C91]/15">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#34434A]">
                {language === "te"
                  ? "మీ ఓపీడీ టోకెన్ సిద్ధమైంది"
                  : language === "hi"
                  ? "आपका ओपीडी टोकन तैयार है"
                  : "OPD Triage Evaluation Ready"}
              </h1>
              <p className="text-xs sm:text-sm text-[#5C6E78] font-medium mt-1">
                {language === "te"
                  ? "దయచేసి కౌంటర్ వద్ద ఈ టోకెన్ నంబర్ చూపించండి"
                  : language === "hi"
                  ? "कृपया डॉक्टर या नर्स को यह टोकन दिखाएं"
                  : "Please proceed to your assigned OPD room or nursing counter"}
              </p>
            </div>

            {/* AI Decision Support Result Card */}
            <TriageResultCard
              record={completedRecord}
              onConfirm={(lvl) => {
                setCompletedRecord((prev) =>
                  prev
                    ? {
                        ...prev,
                        clinicianReview: {
                          isConfirmed: true,
                          isOverridden: false,
                          confirmedLevel: lvl,
                          reviewedAt: new Date().toISOString(),
                          reviewedBy: "Dr. On Duty",
                        },
                      }
                    : null
                );
              }}
              onOverride={(lvl, reason) => {
                setCompletedRecord((prev) =>
                  prev
                    ? {
                        ...prev,
                        clinicianReview: {
                          isConfirmed: false,
                          isOverridden: true,
                          confirmedLevel: lvl,
                          overrideReason: reason,
                          reviewedAt: new Date().toISOString(),
                          reviewedBy: "Dr. On Duty",
                        },
                      }
                    : null
                );
              }}
              language={language}
              isStaffMode={true}
            />

            {/* Bottom Actions: View in Staff Priority Queue or New Assessment */}
            <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSymptoms([]);
                  setCurrentStep("anatomy");
                  setCompletedRecord(null);
                }}
                className="px-5 py-3 rounded-2xl bg-[#F7F4EF] hover:bg-[#EAE6DD] text-[#34434A] font-bold text-xs flex items-center gap-2 transition border border-[#E5E1D8] cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>
                  {language === "te" ? "మరొక రోగిని పరిశీలించండి" : language === "hi" ? "नया मरीज जोड़ें" : "New Patient Assessment"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/staff")}
                className="px-6 py-3 rounded-2xl bg-[#269C91] hover:bg-[#1E7E75] text-white font-black text-xs shadow-lg shadow-[#269C91]/25 flex items-center gap-2 transition cursor-pointer"
              >
                <Stethoscope size={16} />
                <span>Open Clinical Priority Queue (/staff)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Medical Disclaimer */}
      <footer className="w-full py-3 px-4 text-center text-[11px] text-[#5C6E78] bg-white/80 border-t border-[#E5E1D8]">
        <p className="max-w-3xl mx-auto">
          <strong>Clinical Notice:</strong> MEDIQ Touch-to-Triage is an initial clinical decision support aid for OPD prioritization in government hospitals. It does not provide medical diagnoses or replace licensed clinical evaluation.
        </p>
      </footer>

      {/* EMERGENCY RED-FLAG ESCALATION MODAL */}
      <EmergencyEscalationModal
        isOpen={isEmergencyModalOpen}
        emergencySymptoms={emergencyFlags}
        onAcknowledge={() => {
          setIsEmergencyModalOpen(false);
          // Jump immediately to final triage result or emergency casualty
          void handleCompleteQuestionnaire();
        }}
        language={language}
      />

      {/* Evaluating with MEDIQ AI Loading Overlay */}
      {isEvaluating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34434A]/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 border border-[#E5E1D8]">
            <div className="w-12 h-12 border-4 border-[#269C91] border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-black text-[#34434A]">
              Evaluating with MEDIQ AI...
            </div>
            <p className="text-xs text-[#5C6E78]">
              Running triage classification & safety screening
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
