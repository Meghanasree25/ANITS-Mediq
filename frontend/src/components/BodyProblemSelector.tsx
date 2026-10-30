/* ==========================================================================
   MEDIQ — BODY-PART-BASED PROBLEM SELECTOR
   Illustrated cards with audio pronunciation, selected state & multi-select
   Palette: Warm Ivory, Medical Teal (#269C91), Coral (#F07868), Rose (#D96B83)
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
  const [activeTabRegion, setActiveTabRegion] = useState<BodyRegionId>(
    regionId || (selectedRegions.length > 0 ? selectedRegions[0] : "Chest")
  );

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
        return <HeartPulse className="w-7 h-7 text-[#D96B83]" />;
      case "Flame":
        return <Flame className="w-7 h-7 text-[#E8AC48]" />;
      case "Wind":
        return <Wind className="w-7 h-7 text-[#69A9DC]" />;
      case "Droplet":
        return <Droplet className="w-7 h-7 text-[#D96B83]" />;
      case "Zap":
        return <Zap className="w-7 h-7 text-[#9584D8]" />;
      case "RotateCcw":
        return <RotateCcw className="w-7 h-7 text-[#269C91]" />;
      case "Eye":
        return <Eye className="w-7 h-7 text-[#269C91]" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-7 h-7 text-[#9584D8]" />;
      case "AlertTriangle":
        return <AlertTriangle className="w-7 h-7 text-[#D96B83] animate-pulse" />;
      default:
        return <Activity className="w-7 h-7 text-[#269C91]" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* If multiple regions selected, show tabs to switch between them */}
      {selectedRegions.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5E1D8]">
          <span className="text-[11px] font-bold text-[#5C6E78] uppercase tracking-wider shrink-0 mr-1">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isCurrent
                    ? "bg-[#F07868] text-white shadow-sm shadow-[#F07868]/30 scale-105"
                    : "bg-[#F7F4EF] text-[#34434A] hover:bg-[#E5E1D8] border border-[#E5E1D8]"
                }`}
              >
                <span>{reg ? reg.label[language] : rId}</span>
                {regionSympCount > 0 && (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                      isCurrent
                        ? "bg-white text-[#F07868]"
                        : "bg-[#F07868] text-white"
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
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8] flex-wrap gap-2">
        <div>
          <span className="text-xs font-bold text-[#269C91] uppercase tracking-wider">
            {language === "te"
              ? "లక్షణాల జాబితా"
              : language === "hi"
              ? "लक्षण चुनें"
              : "Select Symptoms"}
          </span>
          <h3 className="text-xl font-extrabold text-[#34434A] flex items-center gap-2">
            <span>{regionInfo?.label[language] || "Selected Region"}</span>
            {language !== "en" && regionInfo?.label.en && (
              <span className="text-xs text-[#8E9EA7] font-normal">
                ({regionInfo.label.en})
              </span>
            )}
          </h3>
        </div>

        <div className="text-xs text-[#34434A] font-semibold bg-[#E8F5F3] px-3.5 py-1.5 rounded-full border border-[#269C91]/25">
          {selectedSymptoms.length > 0 ? (
            <span className="text-[#269C91] font-bold">
              ✓ {selectedSymptoms.length}{" "}
              {language === "te"
                ? "ఎంచుకోబడింది"
                : language === "hi"
                ? "चुना गया"
                : "Selected"}
            </span>
          ) : (
            <span className="text-[#5C6E78]">
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
                  ? "bg-[#FDF1EF] border-[#F07868] shadow-md shadow-[#F07868]/10 ring-2 ring-[#F07868]/20"
                  : "bg-white border-[#E5E1D8] hover:border-[#269C91]/50 hover:bg-[#F7F4EF]/50 shadow-2xs"
              }`}
            >
              {/* Left Icon Graphic */}
              <div
                className={`p-3 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? "bg-[#FDF1EF]"
                    : symptom.isRedFlag
                    ? "bg-[#FAEEF1]"
                    : "bg-[#F7F4EF]"
                }`}
              >
                {getSymptomIcon(symptom.iconName)}
              </div>

              {/* Text Description */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-[#34434A] text-sm sm:text-base leading-snug">
                    {symptom.label[language]}
                  </h4>
                  {symptom.isRedFlag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAEEF1] text-[#D96B83] border border-[#D96B83]/30">
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
                  <p className="text-xs text-[#5C6E78] font-medium mt-0.5">
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
                  className="p-1.5 hover:bg-[#E8F5F3] rounded-lg text-[#269C91] transition cursor-pointer"
                >
                  <Volume2 size={16} />
                </button>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    active
                      ? "bg-[#F07868] border-[#F07868] text-white"
                      : "border-[#D5CFBF] bg-white"
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
              ? "bg-[#FDF1EF] border-[#F07868]"
              : "border-[#D5CFBF] hover:border-[#269C91] bg-[#F7F4EF]/50"
          }`}
        >
          <div className="p-3 bg-white rounded-2xl text-[#5C6E78] border border-[#E5E1D8] shrink-0">
            <PlusCircle size={22} className="text-[#269C91]" />
          </div>
          <div>
            <div className="font-bold text-[#34434A] text-sm">
              {language === "te"
                ? "ఇతర సమస్య (జాబితాలో లేదు)"
                : language === "hi"
                ? "अन्य समस्या (सूची में नहीं है)"
                : "Other problem (not listed)"}
            </div>
            <div className="text-xs text-[#5C6E78]">
              {language === "te"
                ? "వైద్యుడితో నేరుగా మాట్లాడండి"
                : language === "hi"
                ? "डॉक्टर से सीधे बात करें"
                : "Clinical staff will assess in detail"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
