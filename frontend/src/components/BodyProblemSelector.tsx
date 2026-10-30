/* ==========================================================================
   MEDIQ — BODY-PART-BASED PROBLEM SELECTOR
   Illustrated cards with audio pronunciation, selected state & multi-select
   ========================================================================== */

import {
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  HeartPulse,
  Wind,
  Droplet,
  Zap,
  RotateCcw,
  PlusCircle,
} from "lucide-react";
import type { BodyRegionId, LanguageCode, SymptomOption } from "../types/triage";
import { getRegionById, getSymptomsForRegion } from "../data/symptomCatalog";
import { audioService } from "../lib/audioService";

interface BodyProblemSelectorProps {
  regionId: BodyRegionId;
  selectedSymptoms: SymptomOption[];
  onToggleSymptom: (symptom: SymptomOption) => void;
  language: LanguageCode;
}

export default function BodyProblemSelector({
  regionId,
  selectedSymptoms,
  onToggleSymptom,
  language,
}: BodyProblemSelectorProps) {
  const regionInfo = getRegionById(regionId);
  const symptoms = getSymptomsForRegion(regionId);

  const isSelected = (id: string) =>
    selectedSymptoms.some((s) => s.id === id);

  const handleAudioClick = (
    e: React.MouseEvent,
    symptom: SymptomOption
  ) => {
    e.stopPropagation();
    void audioService.speakSymptom(symptom.label[language], language);
  };

  const getSymptomIcon = (iconName: string) => {
    switch (iconName) {
      case "HeartPulse":
        return <HeartPulse className="w-8 h-8 text-rose-600" />;
      case "Flame":
        return <Flame className="w-8 h-8 text-amber-600" />;
      case "Wind":
        return <Wind className="w-8 h-8 text-sky-600" />;
      case "Droplet":
        return <Droplet className="w-8 h-8 text-red-600" />;
      case "Zap":
        return <Zap className="w-8 h-8 text-yellow-600" />;
      case "RotateCcw":
        return <RotateCcw className="w-8 h-8 text-indigo-600" />;
      case "AlertTriangle":
        return <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />;
      default:
        return <Activity className="w-8 h-8 text-emerald-700" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Region Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {language === "te" ? "సమస్యల జాబితా" : language === "hi" ? "लक्षण चुनें" : "Select Symptoms"}
          </span>
          <h3 className="text-xl font-extrabold text-stone-900">
            {regionInfo?.label[language] || "Selected Region"}
          </h3>
        </div>

        <div className="text-xs text-stone-500 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          {selectedSymptoms.length > 0 ? (
            <span className="text-emerald-800 font-bold">
              {selectedSymptoms.length} {language === "te" ? "ఎంచుకోబడింది" : language === "hi" ? "चुना गया" : "Selected"}
            </span>
          ) : (
            <span>{language === "te" ? "ఒకటి కంటే ఎక్కువ ఎంచుకోవచ్చు" : language === "hi" ? "एक से अधिक चुन सकते हैं" : "Multiple allowed"}</span>
          )}
        </div>
      </div>

      {/* Symptom Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {symptoms.map((symptom) => {
          const active = isSelected(symptom.id);

          return (
            <div
              key={symptom.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggleSymptom(symptom)}
              className={`relative p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-left cursor-pointer active:scale-[0.98] ${
                active
                  ? "bg-emerald-50/80 border-emerald-600 shadow-md shadow-emerald-700/10"
                  : "bg-white border-stone-200/90 hover:border-emerald-300 hover:bg-stone-50/70 shadow-sm"
              }`}
            >
              {/* Left Icon Graphic */}
              <div
                className={`p-3 rounded-2xl flex items-center justify-center transition-colors ${
                  active
                    ? "bg-emerald-600/15"
                    : symptom.isRedFlag
                    ? "bg-rose-50"
                    : "bg-stone-100"
                }`}
              >
                {getSymptomIcon(symptom.iconName)}
              </div>

              {/* Text Description */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-stone-900 text-base leading-snug">
                    {symptom.label[language]}
                  </h4>
                  {symptom.isRedFlag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle size={11} />
                      {language === "te" ? "అత్యవసరం" : language === "hi" ? "आपातकालीन" : "Urgent"}
                    </span>
                  )}
                </div>

                {language !== "en" && (
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {symptom.label.en}
                  </p>
                )}
              </div>

              {/* Top Right Checkmark Indicator */}
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleAudioClick(e, symptom)}
                  title="Listen"
                  className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-800 transition"
                >
                  <Volume2 size={18} />
                </button>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  {active && <CheckCircle2 size={16} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Fallback "Other problem in this region" card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            const fallbackOption: SymptomOption = {
              id: `${regionId}_other`,
              regionId,
              label: {
                en: `Other issue in ${regionInfo?.label.en || regionId}`,
                te: `${regionInfo?.label.te || regionId} లో ఇతర సమస్య`,
                hi: `${regionInfo?.label.hi || regionId} में अन्य समस्या`,
              },
              iconName: "HelpCircle",
              isRedFlag: false,
              typicalDepartment: "General Medicine",
              clinicalPrompt: `Other medical issue in ${regionInfo?.label.en || regionId}`,
            };
            onToggleSymptom(fallbackOption);
          }}
          className={`p-4 rounded-2xl border-2 border-dashed transition-all flex items-center gap-3.5 cursor-pointer ${
            isSelected(`${regionId}_other`)
              ? "bg-emerald-50 border-emerald-600"
              : "border-stone-300 hover:border-emerald-400 bg-stone-50/50"
          }`}
        >
          <div className="p-3 bg-stone-200/80 rounded-2xl text-stone-700">
            <PlusCircle size={24} />
          </div>
          <div>
            <div className="font-bold text-stone-900 text-sm">
              {language === "te"
                ? "ఇతర సమస్య (జాబితాలో లేదు)"
                : language === "hi"
                ? "अन्य समस्या (सूची में नहीं है)"
                : "Other problem (not listed)"}
            </div>
            <div className="text-xs text-stone-500">
              {language === "te"
                ? "వైద్యుడితో నేరుగా మాట్లాడండి"
                : language === "hi"
                ? "डॉक्टर से सीधे बात करें"
                : "Staff will review in detail"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
