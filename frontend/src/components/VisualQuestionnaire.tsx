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
  Zap,
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
        en: "How severe is the discomfort?",
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
        en: "How long have you experienced it?",
        te: "ఈ సమస్య ఎప్పుడు ప్రారంభమైంది?",
        hi: "यह समस्या कितने समय से है?",
      },
      subtitle: {
        en: "Tap the timeline card that best matches your situation",
        te: "మీరు మొదట ఎప్పుడు గమనించారో ఆ చిత్రాన్ని తాకండి",
        hi: "कार्ड को छूकर बताएं कि यह कब से हो रहा है",
      },
    },
    {
      title: {
        en: "When and how did it start?",
        te: "ఇది అకస్మాత్తుగా వచ్చిందా లేక క్రమంగా వచ్చిందా?",
        hi: "यह अचानक शुरू हुआ या धीरे-धीरे?",
      },
      subtitle: {
        en: "Did it come on all of a sudden or develop slowly?",
        te: "హఠాత్తుగా వచ్చిందా లేక నెమ్మదిగా మొదలైందా?",
        hi: "बताएं कि दर्द अचानक तेज हुआ या धीरे-धीरे बढ़ा",
      },
    },
    {
      title: {
        en: "Is the discomfort getting worse?",
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
        en: "Are you experiencing any other symptoms?",
        te: "మీకు ఇతర అనుబంధ లక్షణాలు ఏవైనా ఉన్నాయా?",
        hi: "क्या आपको कोई अन्य लक्षण भी महसूस हो रहे हैं?",
      },
      subtitle: {
        en: "Tap any accompanying signs that apply to you",
        te: "వర్తించే ఇతర లక్షణాలను తాకండి",
        hi: "लागू होने वाले अन्य लक्षणों को चुनें",
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
      const SpeechRec =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const recognition = new SpeechRec();
      recognition.lang =
        language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      setIsListening(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const transcript = (event.results[0][0].transcript as string).toLowerCase();
        setIsListening(false);

        if (currentStep === 3) {
          if (
            transcript.includes("yes") ||
            transcript.includes("అవును") ||
            transcript.includes("हाँ")
          ) {
            onChange({ isGettingWorse: true });
          } else if (
            transcript.includes("no") ||
            transcript.includes("కాదు") ||
            transcript.includes("नहीं")
          ) {
            onChange({ isGettingWorse: false });
          }
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      recognition.start();
    } else {
      alert("Voice input is not supported in this browser. Please tap the buttons.");
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
    <div className="flex flex-col bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xl w-full max-w-2xl mx-auto">
      {/* Progress Bar & Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 transition font-semibold text-sm"
        >
          <ArrowLeft size={18} />
          <span>
            {language === "te"
              ? "వెనుకకు"
              : language === "hi"
              ? "पीछे"
              : "Back"}
          </span>
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-8 bg-emerald-700 shadow-sm"
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
          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <Volume2 size={20} className="text-emerald-700" />
          <span className="text-xs font-bold hidden sm:inline">
            {language === "te"
              ? "వినండి"
              : language === "hi"
              ? "सुनें"
              : "Audio"}
          </span>
        </button>
      </div>

      {/* Main Question Display */}
      <div className="text-center mb-8">
        <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
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

      {/* ====================================================================
          STEP 1: HOW SEVERE IS THE DISCOMFORT? (Wong-Baker Face Scale)
         ==================================================================== */}
      {currentStep === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            {
              id: "mild",
              icon: <Smile className="w-12 h-12 text-emerald-600" />,
              label: {
                en: "Mild Discomfort",
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
                en: "Moderate Discomfort",
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
              icon: (
                <AlertOctagon className="w-12 h-12 text-rose-600 animate-bounce" />
              ),
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
                    ? `${level.bg} ${level.border} ring-4 ring-rose-500/20 shadow-lg scale-105`
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

      {/* ====================================================================
          STEP 2: HOW LONG HAVE YOU EXPERIENCED IT? (Duration)
         ==================================================================== */}
      {currentStep === 1 && (
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
                    ? "bg-rose-50 border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20"
                    : "bg-stone-50/70 border-stone-200 hover:border-emerald-300 hover:bg-white"
                }`}
              >
                <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs">
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

      {/* ====================================================================
          STEP 3: WHEN AND HOW DID IT START? (Sudden vs Gradual Onset)
         ==================================================================== */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-3">
          <button
            type="button"
            onClick={() => {
              onChange({ onsetTime: "sudden" });
              void audioService.speak(
                language === "te"
                  ? "అకస్మాత్తుగా మొదలైంది"
                  : language === "hi"
                  ? "अचानक शुरू हुआ"
                  : "Sudden onset",
                language
              );
            }}
            className={`p-7 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.onsetTime === "sudden"
                ? "bg-rose-50 border-rose-500 ring-4 ring-rose-500/20"
                : "bg-white border-stone-200 hover:border-rose-300 hover:bg-rose-50/20"
            }`}
          >
            <Zap size={44} className="text-rose-600" />
            <div className="text-xl font-black text-rose-950">
              {language === "te"
                ? "అకస్మాత్తుగా (Sudden)"
                : language === "hi"
                ? "अचानक (Sudden)"
                : "Sudden Onset"}
            </div>
            <div className="text-xs font-semibold text-rose-700 text-center">
              {language === "te"
                ? "ఒక్కసారిగా తీవ్రంగా మొదలైంది"
                : language === "hi"
                ? "अचानक तेजी से शुरू हुआ"
                : "Began abruptly with immediate intensity"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({ onsetTime: "gradual" });
              void audioService.speak(
                language === "te"
                  ? "క్రమంగా మొదలైంది"
                  : language === "hi"
                  ? "धीरे-धीरे शुरू हुआ"
                  : "Gradual onset",
                language
              );
            }}
            className={`p-7 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.onsetTime === "gradual"
                ? "bg-emerald-50 border-emerald-600 ring-4 ring-emerald-500/20"
                : "bg-white border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/20"
            }`}
          >
            <Clock size={44} className="text-emerald-700" />
            <div className="text-xl font-black text-emerald-950">
              {language === "te"
                ? "క్రమంగా (Gradual)"
                : language === "hi"
                ? "धीरे-धीरे (Gradual)"
                : "Gradual Development"}
            </div>
            <div className="text-xs font-semibold text-emerald-700 text-center">
              {language === "te"
                ? "నెమ్మదిగా మొదలై క్రమంగా పెరిగింది"
                : language === "hi"
                ? "हल्के दर्द से शुरू होकर धीरे-धीरे बढ़ा"
                : "Developed slowly over hours or days"}
            </div>
          </button>
        </div>
      )}

      {/* ====================================================================
          STEP 4: IS DISCOMFORT GETTING WORSE? (Rapidly Worsening)
         ==================================================================== */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-3">
          <button
            type="button"
            onClick={() => {
              onChange({ isGettingWorse: true });
              void audioService.speak(
                language === "te"
                  ? "అవును, పెరుగుతోంది"
                  : language === "hi"
                  ? "हाँ, बढ़ रहा है"
                  : "Yes, it is getting worse",
                language
              );
            }}
            className={`p-7 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.isGettingWorse === true
                ? "bg-rose-50 border-rose-500 ring-4 ring-rose-500/20"
                : "bg-white border-stone-200 hover:border-rose-400 hover:bg-rose-50/30"
            }`}
          >
            <AlertOctagon size={44} className="text-rose-600" />
            <div className="text-2xl font-black text-rose-950">
              {language === "te"
                ? "అవును (YES)"
                : language === "hi"
                ? "हाँ (YES)"
                : "YES, Worsening"}
            </div>
            <div className="text-xs font-semibold text-rose-700 text-center">
              {language === "te"
                ? "నొప్పి లేదా బాధ నిరంతరం పెరుగుతోంది"
                : language === "hi"
                ? "दर्द या समस्या बढ़ती जा रही है"
                : "Symptoms are intensifying rapidly"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({ isGettingWorse: false });
              void audioService.speak(
                language === "te"
                  ? "కాదు, స్థిరంగా ఉంది"
                  : language === "hi"
                  ? "नहीं, स्थिर है"
                  : "No, it is stable",
                language
              );
            }}
            className={`p-7 rounded-3xl border-3 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 shadow-md ${
              answers.isGettingWorse === false
                ? "bg-emerald-50 border-emerald-600 ring-4 ring-emerald-500/20"
                : "bg-white border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30"
            }`}
          >
            <CheckCircle size={44} className="text-emerald-700" />
            <div className="text-2xl font-black text-emerald-950">
              {language === "te"
                ? "కాదు (NO)"
                : language === "hi"
                ? "नहीं (NO)"
                : "NO, Stable"}
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

      {/* ====================================================================
          STEP 5: ARE YOU EXPERIENCING ANY OTHER SYMPTOMS?
         ==================================================================== */}
      {currentStep === 4 && (
        <div className="flex flex-col gap-3 py-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                id: "fever",
                icon: "🌡️",
                label: {
                  en: "Fever / Chills",
                  te: "జ్వరం / చలి",
                  hi: "बुखार या ठंड",
                },
              },
              {
                id: "nausea",
                icon: "🤢",
                label: {
                  en: "Nausea / Vomiting",
                  te: "వికారం / వాంతులు",
                  hi: "उल्टी या मतली",
                },
              },
              {
                id: "sweating",
                icon: "💦",
                label: {
                  en: "Cold Sweating",
                  te: "చెమటలు పట్టడం",
                  hi: "पसीना आना",
                },
              },
              {
                id: "weakness",
                icon: "🔋",
                label: {
                  en: "Severe Weakness",
                  te: "విపరీతమైన నీరసం",
                  hi: "अत्यधिक कमजोरी",
                },
              },
              {
                id: "dizziness",
                icon: "💫",
                label: {
                  en: "Dizziness",
                  te: "తల తిరగడం",
                  hi: "चक्कर आना",
                },
              },
              {
                id: "none",
                icon: "✨",
                label: {
                  en: "None of these",
                  te: "ఇవేవీ లేవు",
                  hi: "इनमें से कोई नहीं",
                },
              },
            ].map((item) => {
              const currentList = answers.otherSymptoms || [];
              const isSelected =
                item.id === "none"
                  ? currentList.length === 0 || currentList.includes("none")
                  : currentList.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    let updated: string[];
                    if (item.id === "none") {
                      updated = ["none"];
                    } else {
                      const withoutNone = currentList.filter(
                        (x) => x !== "none"
                      );
                      if (withoutNone.includes(item.id)) {
                        updated = withoutNone.filter((x) => x !== item.id);
                      } else {
                        updated = [...withoutNone, item.id];
                      }
                    }
                    onChange({ otherSymptoms: updated });
                    void audioService.speak(item.label[language], language);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center active:scale-95 ${
                    isSelected
                      ? "bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/20"
                      : "bg-stone-50 border-stone-200 hover:bg-white hover:border-emerald-300"
                  }`}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-extrabold text-stone-900 text-xs leading-tight">
                    {item.label[language]}
                  </span>
                </button>
              );
            })}
          </div>
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
          <Mic
            size={16}
            className={isListening ? "text-rose-600" : "text-stone-600"}
          />
          <span>
            {isListening
              ? language === "te"
                ? "వింటున్నాను..."
                : language === "hi"
                ? "सुन रहा हूँ..."
                : "Listening..."
              : language === "te"
              ? "నోటితో మాట్లాడి సమాధానం చెప్పండి"
              : language === "hi"
              ? "माइक से बोलकर उत्तर दें"
              : "Tap to Speak Answer"}
          </span>
        </button>

        {/* Continue / Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="ml-auto px-6 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition active:scale-95"
        >
          <span>
            {currentStep === totalSteps - 1
              ? language === "te"
                ? "సమర్పించి AI ఫలితం చూడండి"
                : language === "hi"
                ? "जमा करें और AI परिणाम देखें"
                : "Submit & Evaluate with AI"
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
