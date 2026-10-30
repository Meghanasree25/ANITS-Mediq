/* ==========================================================================
   MEDIQ — BODY-PART-BASED PROBLEM SELECTOR
   Illustrated cards with audio pronunciation, selected state & multi-select
   Trilingual: Telugu, Hindi, English
   ========================================================================== */

import { useState } from "react";
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
  Eye,
  ShieldAlert,
} from "lucide-react";
import type { BodyRegionId, LanguageCode, SymptomOption } from "../types/triage";
import { getRegionById, getSymptomsForRegion } from "../data/symptomCatalog";
import { audioService } from "../lib/audioService";

interface BodyProblemSelectorProps {
  regionId?: BodyRegionId | null;
  selectedRegions?: BodyRegionId[];
  selectedSymptoms: SymptomOption[];
  onToggleSymptom: (symptom: SymptomOption) => void;
  language: LanguageCode;
  onSelectRegionTab?: (regionId: BodyRegionId) => void;
}

export default function BodyProblemSelector({
  regionId = "Chest",
  selectedRegions = [],
  selectedSymptoms,
  onToggleSymptom,
  language,
  onSelectRegionTab,
}: BodyProblemSelectorProps) {
  // If multiple regions are selected, track active tab (defaulting to the first or current regionId)
  const [activeTabRegion, setActiveTabRegion] = useState<BodyRegionId>(
    regionId || (selectedRegions.length > 0 ? selectedRegions[0] : "Chest")
  );

  // Sync tab with external regionId if provided
  const currentViewingRegion: BodyRegionId =
    regionId || activeTabRegion || (selectedRegions[0] ?? "Chest");

  const regionInfo = getRegionById(currentViewingRegion);
  const symptoms = getSymptomsForRegion(currentViewingRegion);

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
      case "Eye":
        return <Eye className="w-8 h-8 text-teal-600" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-8 h-8 text-purple-600" />;
      case "AlertTriangle":
        return <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />;
      default:
        return <Activity className="w-8 h-8 text-emerald-700" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* If multiple regions selected, show tabs to switch between them */}
      {selectedRegions.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider shrink-0 mr-1">
            {language === "te"
              ? "ఎంచుకున్నవి:"
              : language === "hi"
              ? "चुने गए अंग:"
              : "Selected Areas:"}
          </span>
          {selectedRegions.map((rId) => {
            const reg = getRegionById(rId);
            const isCurrent = rId === currentViewingRegion;
            const regionSympCount = selectedSymptoms.filter(
              (s) => s.regionId === rId
            ).length;

            return (
              <button
                key={rId}
                type="button"
                onClick={() => {
                  setActiveTabRegion(rId);
                  if (onSelectRegionTab) onSelectRegionTab(rId);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isCurrent
                    ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-105"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                }`}
              >
                <span>{reg ? reg.label[language] : rId}</span>
                {regionSympCount > 0 && (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isCurrent
                        ? "bg-white text-rose-600"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {regionSympCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Region Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 flex-wrap gap-2">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            {language === "te"
              ? "సమస్యల జాబితా"
              : language === "hi"
              ? "लक्षण चुनें"
              : "Select Symptoms"}
          </span>
          <h3 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
            <span>{regionInfo?.label[language] || "Selected Region"}</span>
            {language !== "en" && regionInfo?.label.en && (
              <span className="text-xs text-stone-400 font-normal">
                ({regionInfo.label.en})
              </span>
            )}
          </h3>
        </div>

        <div className="text-xs text-stone-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          {selectedSymptoms.length > 0 ? (
            <span className="text-emerald-800 font-bold">
              ✓ {selectedSymptoms.length}{" "}
              {language === "te"
                ? "ఎంచుకోబడింది"
                : language === "hi"
                ? "चुना गया"
                : "Selected"}
            </span>
          ) : (
            <span>
              {language === "te"
                ? "ఒకటి కంటే ఎక్కువ ఎంచుకోవచ్చు"
                : language === "hi"
                ? "एक से अधिक चुन सकते हैं"
                : "Multiple allowed"}
            </span>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleSymptom(symptom);
                }
              }}
              className={`relative p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 text-left cursor-pointer active:scale-[0.98] ${
                active
                  ? "bg-rose-50/70 border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/20"
                  : "bg-white border-stone-200/90 hover:border-emerald-300 hover:bg-stone-50/70 shadow-xs"
              }`}
            >
              {/* Left Icon Graphic */}
              <div
                className={`p-3 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? "bg-rose-100"
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
                  <h4 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug">
                    {symptom.label[language]}
                  </h4>
                  {symptom.isRedFlag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertTriangle size={11} />
                      {language === "te"
                        ? "అత్యవసరం"
                        : language === "hi"
                        ? "आपातकालीन"
                        : "Urgent"}
                    </span>
                  )}
                </div>

                {language !== "en" && (
                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {symptom.label.en}
                  </p>
                )}
              </div>

              {/* Top Right Checkmark and Pronounce Indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => handleAudioClick(e, symptom)}
                  title="Listen to symptom"
                  className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-800 transition"
                >
                  <Volume2 size={16} />
                </button>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? "bg-rose-500 border-rose-500 text-white"
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
              id: `${currentViewingRegion}_other`,
              regionId: currentViewingRegion,
              label: {
                en: `Other issue in ${regionInfo?.label.en || currentViewingRegion}`,
                te: `${regionInfo?.label.te || currentViewingRegion} లో ఇతర సమస్య`,
                hi: `${regionInfo?.label.hi || currentViewingRegion} में अन्य समस्या`,
              },
              iconName: "HelpCircle",
              isRedFlag: false,
              typicalDepartment: "General Medicine",
              clinicalPrompt: `Other medical issue in ${regionInfo?.label.en || currentViewingRegion}`,
            };
            onToggleSymptom(fallbackOption);
          }}
          className={`p-4 rounded-2xl border-2 border-dashed transition-all flex items-center gap-3.5 cursor-pointer ${
            isSelected(`${currentViewingRegion}_other`)
              ? "bg-rose-50 border-rose-500"
              : "border-stone-300 hover:border-emerald-400 bg-stone-50/50"
          }`}
        >
          <div className="p-3 bg-stone-200/80 rounded-2xl text-stone-700 shrink-0">
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
