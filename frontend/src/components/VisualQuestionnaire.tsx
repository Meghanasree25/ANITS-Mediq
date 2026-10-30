/* ==========================================================================
   MEDIQ — ACCESSIBLE GUIDED QUESTIONNAIRE
   One question at a time with picture-based answers, audio guidance & big controls
   Trilingual: Telugu, Hindi, English
   ========================================================================== */

import { useState, useEffect } from "react";
import {
  Volume2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  Smile,
  Meh,
  Frown,
  AlertOctagon,
  CheckCircle,
  Mic,
  RotateCcw,
} from "lucide-react";
import type {
  LanguageCode,
  PainSeverity,
  SymptomDuration,
  VisualQuestionnaireAnswers,
} from "../types/triage";
import { audioService } from "../lib/audioService";

interface VisualQuestionnaireProps {
  answers: VisualQuestionnaireAnswers;
  onChange: (updated: Partial<VisualQuestionnaireAnswers>) => void;
  onComplete: () => void;
  onBack: () => void;
  language: LanguageCode;
}

export default function VisualQuestionnaire({
  answers,
  onChange,
  onComplete,
  onBack,
  language,
}: VisualQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);

  // Question prompts in 3 languages
  const questions = [
    {
      title: {
        en: "When did this problem start?",
        te: "ఈ సమస్య ఎప్పుడు ప్రారంభమైంది?",
        hi: "यह समस्या कब शुरू हुई?",
      },
      subtitle: {
        en: "Tap the picture that best describes when you first felt it",
        te: "మీరు మొదట ఎప్పుడు గమనించారో ఆ చిత్రాన్ని తాకండి",
        hi: "चित्र को छूकर बताएं कि यह कब शुरू हुआ",
      },
    },
    {
      title: {
        en: "How severe is the pain or discomfort?",
        te: "నొప్పి లేదా అసౌకర్యం ఎంత తీవ్రంగా ఉంది?",
        hi: "दर्द या परेशानी कितनी अधिक है?",
      },
      subtitle: {
        en: "Choose the face that matches your feeling right now",
        te: "మీ బాధను తెలిపే ముఖ చిత్రాన్ని తాకండి",
        hi: "अपने दर्द के अनुसार चेहरे के भाव को चुनें",
      },
    },
    {
      title: {
        en: "Is the problem getting rapidly worse?",
        te: "సమస్య వేగంగా మరింత ఎక్కువవుతోందా?",
        hi: "क्या तकलीफ तेजी से बढ़ रही है?",
      },
      subtitle: {
        en: "Tell us if your symptoms are intensifying right now",
        te: "బాధ పెరుగుతోందో లేదో ఎంచుకోండి",
        hi: "बताएं कि क्या दर्द या परेशानी लगातार बढ़ रही है",
      },
    },
    {
      title: {
        en: "Has this happened to you before?",
        te: "గతంలో కూడా మీకు ఇలాగే జరిగిందా?",
        hi: "क्या यह पहले भी आपके साथ हुआ है?",
      },
      subtitle: {
        en: "Is this a new illness or an existing chronic issue?",
        te: "ఇది పాత సమస్యా లేక కొత్తగా వచ్చిందా?",
        hi: "क्या यह कोई पुरानी बीमारी है या पहली बार हुआ?",
      },
    },
  ];

  const totalSteps = questions.length;

  // Speak question automatically when step changes
  useEffect(() => {
    const q = questions[currentStep];
    if (q) {
      void audioService.speak(q.title[language], language);
    }
  }, [currentStep, language]);

  const handleSpeakCurrent = () => {
    const q = questions[currentStep];
    if (q) {
      void audioService.speak(q.title[language], language);
    }
  };

  const handleVoiceInput = () => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const recognition = new SpeechRec();
      recognition.lang = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const transcript = event.results[0][0].transcript.toLowerCase();
        setIsListening(false);

        // Simple keyword matching for voice response
        if (currentStep === 2) {
          if (transcript.includes("yes") || transcript.includes("అవును") || transcript.includes("हाँ")) {
            onChange({ isGettingWorse: true });
          } else if (transcript.includes("no") || transcript.includes("కాదు") || transcript.includes("नहीं")) {
            onChange({ isGettingWorse: false });
          }
        } else if (currentStep === 3) {
          if (transcript.includes("yes") || transcript.includes("అవును") || transcript.includes("हाँ")) {
            onChange({ hasOccurredBefore: true });
          } else if (transcript.includes("no") || transcript.includes("కాదు") || transcript.includes("नहीं")) {
            onChange({ hasOccurredBefore: false });
          }
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser version. Please tap the buttons.");
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl w-full max-w-2xl mx-auto">
      {/* Progress Bar & Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 transition font-semibold text-sm"
        >
          <ArrowLeft size={18} />
          <span>{language === "te" ? "వెనుకకు" : language === "hi" ? "पीछे" : "Back"}</span>
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-8 bg-emerald-600 shadow-sm"
                  : idx < currentStep
                  ? "w-2.5 bg-emerald-300"
                  : "w-2.5 bg-stone-200"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleSpeakCurrent}
          title="Listen again"
          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <Volume2 size={20} className="text-emerald-700" />
          <span className="text-xs font-bold hidden sm:inline">
            {language === "te" ? "వినండి" : language === "hi" ? "सुनें" : "Audio"}
          </span>
        </button>
      </div>

      {/* Main Question Display */}
      <div className="text-center mb-8">
        <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {language === "te"
            ? `ప్రశ్న ${currentStep + 1} / ${totalSteps}`
            : language === "hi"
            ? `प्रश्न ${currentStep + 1} / ${totalSteps}`
            : `Question ${currentStep + 1} of ${totalSteps}`}
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3 leading-tight">
          {questions[currentStep].title[language]}
        </h2>
        <p className="text-sm text-stone-600 mt-2">
          {questions[currentStep].subtitle[language]}
        </p>
      </div>

      {/* QUESTION 1: DURATION */}
      {currentStep === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: "just_started",
              icon: <Clock className="w-9 h-9 text-rose-600" />,
              title: {
                en: "Just Started Today",
                te: "ఈ రోజే ప్రారంభమైంది",
                hi: "आज ही शुरू हुआ",
              },
              desc: {
                en: "Within the last few hours",
                te: "కొన్ని గంటల క్రితం",
                hi: "कुछ घंटों के भीतर",
              },
            },
            {
              id: "yesterday",
              icon: <Calendar className="w-9 h-9 text-amber-600" />,
              title: {
                en: "Since Yesterday",
                te: "నిన్నటి నుండి",
                hi: "कल से हो रहा है",
              },
              desc: {
                en: "Around 24 hours ago",
                te: "ఒక రోజు క్రితం",
                hi: "लगभग एक दिन पहले",
              },
            },
            {
              id: "several_days",
              icon: <Calendar className="w-9 h-9 text-teal-600" />,
              title: {
                en: "Few Days (2 to 4 Days)",
                te: "కొన్ని రోజులుగా (2-4 రోజులు)",
                hi: "कुछ दिनों से (2-4 दिन)",
              },
              desc: {
                en: "Ongoing for a couple of days",
                te: "గత కొద్ది రోజులుగా ఉంది",
                hi: "कुछ दिनों से लगातार",
              },
            },
            {
              id: "over_a_week",
              icon: <Clock className="w-9 h-9 text-indigo-600" />,
              title: {
                en: "More Than a Week",
                te: "వారం కంటే ఎక్కువ రోజులు",
                hi: "एक सप्ताह से अधिक समय से",
              },
              desc: {
                en: "Chronic or long-standing problem",
                te: "చాలా కాలంగా ఉంది",
                hi: "लंबे समय से यह समस्या है",
              },
            },
          ].map((opt) => {
            const isSelected = answers.duration === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange({ duration: opt.id as SymptomDuration });
                  void audioService.speak(opt.title[language], language);
                }}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 text-left active:scale-[0.98] ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-600 shadow-md shadow-emerald-700/10"
                    : "bg-stone-50/70 border-stone-200 hover:border-emerald-300 hover:bg-white"
                }`}
              >
                <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  {opt.icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base leading-snug">
                    {opt.title[language]}
                  </h4>
                  <p className="text-xs text-stone-500 font-medium mt-1">
                    {opt.desc[language]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* QUESTION 2: VISUAL SEVERITY SCALE (Wong-Baker Face Scale) */}
      {currentStep === 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            {
              id: "mild",
              icon: <Smile className="w-12 h-12 text-emerald-600" />,
              label: {
                en: "Mild",
                te: "తేలికపాటి (తక్కువ)",
                hi: "हल्का दर्द",
              },
              score: "1 - 3",
              bg: "bg-emerald-50",
              border: "border-emerald-500",
            },
            {
              id: "moderate",
              icon: <Meh className="w-12 h-12 text-amber-500" />,
              label: {
                en: "Moderate",
                te: "మధ్యస్థ నొప్పి",
                hi: "मध्यम दर्द",
              },
              score: "4 - 6",
              bg: "bg-amber-50",
              border: "border-amber-500",
            },
            {
              id: "severe",
              icon: <Frown className="w-12 h-12 text-orange-600" />,
              label: {
                en: "Severe Pain",
                te: "తీవ్రమైన నొప్పి",
                hi: "बहुत तेज दर्द",
              },
              score: "7 - 8",
              bg: "bg-orange-50",
              border: "border-orange-500",
            },
            {
              id: "unbearable",
              icon: <AlertOctagon className="w-12 h-12 text-rose-600 animate-bounce" />,
              label: {
                en: "Unbearable / Emergency",
                te: "భరించలేని అత్యవసర నొప్పి",
                hi: "असहनीय दर्द",
              },
              score: "9 - 10",
              bg: "bg-rose-50",
              border: "border-rose-600",
            },
          ].map((level) => {
            const isSelected = answers.severity === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  onChange({ severity: level.id as PainSeverity });
                  void audioService.speak(level.label[language], language);
                }}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3 cursor-pointer active:scale-[0.96] ${
                  isSelected
                    ? `${level.bg} ${level.border} ring-4 ring-emerald-500/20 shadow-lg`
                    : "bg-stone-50 border-stone-200 hover:bg-white hover:border-emerald-300"
                }`}
              >
                <div className="p-2">{level.icon}</div>
                <div>
                  <div className="text-xs font-bold text-stone-500 mb-0.5">
                    Level {level.score}
                  </div>
                  <div className="font-extrabold text-stone-900 text-sm leading-tight">
                    {level.label[language]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* QUESTION 3: GETTING WORSE? (BIG YES / NO BUTTONS) */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
          <button
            type="button"
            onClick={() => {
              onChange({ isGettingWorse: true });
              void audioService.speak(language === "te" ? "అవును, పెరుగుతోంది" : language === "hi" ? "हाँ, दर्द बढ़ रहा है" : "Yes, it is worsening", language);
            }}
            className={`p-8 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.isGettingWorse === true
                ? "bg-rose-50 border-rose-600 ring-4 ring-rose-500/20"
                : "bg-white border-stone-200 hover:border-rose-400 hover:bg-rose-50/30"
            }`}
          >
            <AlertOctagon size={48} className="text-rose-600" />
            <div className="text-2xl font-black text-rose-900">
              {language === "te" ? "అవును (YES)" : language === "hi" ? "हाँ (YES)" : "YES"}
            </div>
            <div className="text-xs font-semibold text-rose-700 text-center">
              {language === "te"
                ? "నొప్పి లేదా బాధ నిరంతరం పెరుగుతోంది"
                : language === "hi"
                ? "दर्द या समस्या बढ़ती जा रही है"
                : "Symptoms are getting worse rapidly"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({ isGettingWorse: false });
              void audioService.speak(language === "te" ? "కాదు, స్థిరంగా ఉంది" : language === "hi" ? "नहीं, स्थिर है" : "No, it is stable", language);
            }}
            className={`p-8 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.isGettingWorse === false
                ? "bg-emerald-50 border-emerald-600 ring-4 ring-emerald-500/20"
                : "bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30"
            }`}
          >
            <CheckCircle size={48} className="text-emerald-600" />
            <div className="text-2xl font-black text-emerald-900">
              {language === "te" ? "కాదు (NO)" : language === "hi" ? "नहीं (NO)" : "NO"}
            </div>
            <div className="text-xs font-semibold text-emerald-700 text-center">
              {language === "te"
                ? "పరిస్థితి ఒకే విధంగా స్థిరంగా ఉంది"
                : language === "hi"
                ? "स्थिति सामान्य या स्थिर है"
                : "Stable or about the same"}
            </div>
          </button>
        </div>
      )}

      {/* QUESTION 4: HAPPENED BEFORE? (BIG YES / NO BUTTONS) */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-4">
          <button
            type="button"
            onClick={() => {
              onChange({ hasOccurredBefore: true });
              void audioService.speak(language === "te" ? "అవును, గతంలో కూడా వచ్చింది" : language === "hi" ? "हाँ, पहले भी हुआ था" : "Yes, happened before", language);
            }}
            className={`p-8 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.hasOccurredBefore === true
                ? "bg-amber-50 border-amber-600 ring-4 ring-amber-500/20"
                : "bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/30"
            }`}
          >
            <RotateCcw size={48} className="text-amber-600" />
            <div className="text-2xl font-black text-amber-900">
              {language === "te" ? "అవును (YES)" : language === "hi" ? "हाँ (YES)" : "YES"}
            </div>
            <div className="text-xs font-semibold text-amber-700 text-center">
              {language === "te"
                ? "గతంలో కూడా ఇదే సమస్యకు చికిత్స తీసుకున్నాను"
                : language === "hi"
                ? "पहले भी ऐसी समस्या हो चुकी है"
                : "I have had this problem in the past"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({ hasOccurredBefore: false });
              void audioService.speak(language === "te" ? "కాదు, ఇదే మొదటిసారి" : language === "hi" ? "नहीं, यह पहली बार है" : "No, this is first time", language);
            }}
            className={`p-8 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.hasOccurredBefore === false
                ? "bg-emerald-50 border-emerald-600 ring-4 ring-emerald-500/20"
                : "bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30"
            }`}
          >
            <CheckCircle size={48} className="text-emerald-600" />
            <div className="text-2xl font-black text-emerald-900">
              {language === "te" ? "కాదు (NO)" : language === "hi" ? "नहीं (NO)" : "NO"}
            </div>
            <div className="text-xs font-semibold text-emerald-700 text-center">
              {language === "te"
                ? "ఇది సరికొత్త సమస్య, మొదటిసారి వచ్చింది"
                : language === "hi"
                ? "यह बिल्कुल नया लक्षण है, पहली बार हुआ"
                : "This is completely new for me"}
            </div>
          </button>
        </div>
      )}

      {/* Voice Assistant / Microphone input helper */}
      <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition border ${
            isListening
              ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
              : "bg-stone-100 hover:bg-stone-200/80 text-stone-700 border-stone-200"
          }`}
        >
          <Mic size={16} className={isListening ? "text-rose-600" : "text-stone-600"} />
          <span>
            {isListening
              ? language === "te" ? "వింటున్నాను..." : language === "hi" ? "सुन रहा हूँ..." : "Listening..."
              : language === "te" ? "నోటితో మాట్లాడి సమాధానం చెప్పండి" : language === "hi" ? "माइक से बोलकर उत्तर दें" : "Tap to Speak Answer"}
          </span>
        </button>

        {/* Continue / Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="ml-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition active:scale-95"
        >
          <span>
            {currentStep === totalSteps - 1
              ? language === "te"
                ? "సమర్పించి ఫలితం చూడండి"
                : language === "hi"
                ? "जमा करें और मूल्यांकन देखें"
                : "Submit & Evaluate"
              : language === "te"
              ? "తదుపరి ప్రశ్న"
              : language === "hi"
              ? "अगला प्रश्न"
              : "Next Question"}
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
