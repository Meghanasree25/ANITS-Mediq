/* ==========================================================================
   MEDIQ — TOUCH-TO-TRIAGE INTERACTIVE HUMAN BODY MAP
   Overlay of SVG hotspots over public/images/mediq-human.png
   Responsive, accessible, multilingual with Medical Teal hover & Warm Coral selection
   Palette: Warm Ivory (#F7F4EF), Medical Teal (#269C91), Coral (#F07868)
   ========================================================================== */

import { useState } from "react";
import {
  RotateCcw,
  Volume2,
  Sparkles,
  Check,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { BodyRegionId, LanguageCode } from "../types/triage";
import { getRegionById } from "../data/symptomCatalog";
import { audioService } from "../lib/audioService";

interface InteractiveBodyMapProps {
  selectedRegions: BodyRegionId[];
  onToggleRegion: (regionId: BodyRegionId) => void;
  onClearSelection: () => void;
  language: LanguageCode;
  selectedRegion?: BodyRegionId | null;
  onSelectRegion?: (regionId: BodyRegionId) => void;
}

interface RegionHotspotDef {
  id: BodyRegionId;
  points: string;
  center: [number, number];
  name: Record<LanguageCode, string>;
  sideLabel?: Record<LanguageCode, string>;
}

export default function InteractiveBodyMap({
  selectedRegions = [],
  onToggleRegion,
  onClearSelection,
  language,
  selectedRegion,
  onSelectRegion,
}: InteractiveBodyMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegionId | null>(null);

  // Active regions array combining multi-select with fallback to single selectedRegion
  const activeRegionList: BodyRegionId[] =
    selectedRegions && selectedRegions.length > 0
      ? selectedRegions
      : selectedRegion
      ? [selectedRegion]
      : [];

  const isSelected = (id: BodyRegionId) => {
    const idLower = id.toLowerCase();
    return activeRegionList.some(
      (r) => r === id || r.toLowerCase() === idLower
    );
  };

  const isHovered = (id: BodyRegionId) => hoveredRegion === id;

  // 8 Required Anatomical Regions mapped to mediq-human.png (1408x768)
  const hotspots: RegionHotspotDef[] = [
    {
      id: "Head",
      points:
        "662,75 670,42 704,32 738,42 746,75 744,110 730,138 704,142 678,138 664,110",
      center: [704, 85],
      name: { en: "Head", te: "తల", hi: "सिर" },
    },
    {
      id: "Neck",
      points: "678,138 704,142 730,138 738,178 704,182 670,178",
      center: [704, 160],
      name: { en: "Neck", te: "మెడ", hi: "गर्दन" },
    },
    {
      id: "Chest",
      points:
        "670,178 704,182 738,178 768,185 785,215 772,290 704,295 636,290 623,215 640,185",
      center: [704, 235],
      name: { en: "Chest", te: "ఛాతీ", hi: "छाती" },
    },
    {
      id: "Abdomen",
      points:
        "636,290 704,295 772,290 774,360 768,420 736,426 704,432 672,426 640,420 634,360",
      center: [704, 355],
      name: { en: "Abdomen", te: "కడుపు", hi: "पेट" },
    },
    {
      id: "RightArm",
      points:
        "640,185 623,215 595,225 572,305 562,395 568,465 592,465 598,400 615,310 636,255 636,220",
      center: [590, 320],
      name: { en: "Right Arm", te: "కుడి చెయ్యి", hi: "दायाँ हाथ" },
      sideLabel: { en: "Right", te: "కుడి", hi: "दायाँ" },
    },
    {
      id: "LeftArm",
      points:
        "768,185 785,215 813,225 836,305 846,395 840,465 816,465 810,400 793,310 772,255 772,220",
      center: [818, 320],
      name: { en: "Left Arm", te: "ఎడమ చెయ్యి", hi: "बायाँ हाथ" },
      sideLabel: { en: "Left", te: "ఎడమ", hi: "बायाँ" },
    },
    {
      id: "RightLeg",
      points:
        "640,420 672,426 704,432 696,510 693,590 690,680 684,746 628,746 650,680 652,590 642,510",
      center: [665, 580],
      name: { en: "Right Leg", te: "కుడి కాలు", hi: "दायाँ पैर" },
      sideLabel: { en: "Right", te: "కుడి", hi: "दायाँ" },
    },
    {
      id: "LeftLeg",
      points:
        "768,420 736,426 704,432 712,510 715,590 718,680 724,746 780,746 758,680 756,590 766,510",
      center: [743, 580],
      name: { en: "Left Leg", te: "ఎడమ కాలు", hi: "बायाँ पैर" },
      sideLabel: { en: "Left", te: "ఎడమ", hi: "बायाँ" },
    },
  ];

  const handleRegionClick = (id: BodyRegionId) => {
    if (onToggleRegion) {
      onToggleRegion(id);
    }
    if (onSelectRegion) {
      onSelectRegion(id);
    }

    const reg = hotspots.find((h) => h.id === id);
    if (reg) {
      void audioService.speakRegion(reg.name[language], language);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: BodyRegionId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRegionClick(id);
    }
  };

  return (
    <div className="relative flex flex-col items-center bg-[#F7F4EF] rounded-3xl p-4 sm:p-6 border border-[#E5E1D8] shadow-sm select-none w-full max-w-xl mx-auto">
      {/* Top Header / Kiosk Instructions */}
      <div className="w-full flex items-center justify-between mb-3 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E8F5F3] text-[#269C91] flex items-center justify-center font-bold">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#34434A]">
              {language === "te"
                ? "శరీర భాగం ఎంపిక"
                : language === "hi"
                ? "दर्द वाले अंग को स्पर्श करें"
                : "Touch Affected Body Part"}
            </h3>
            <p className="text-[11px] text-[#5C6E78] font-medium">
              {language === "te"
                ? "ఒకటి కంటే ఎక్కువ భాగాలను కూడా ఎంచుకోవచ్చు"
                : language === "hi"
                ? "एक से अधिक अंग भी चुन सकते हैं"
                : "Select single or multiple affected regions"}
            </p>
          </div>
        </div>

        {/* Clear Selection Button */}
        {activeRegionList.length > 0 && (
          <button
            type="button"
            onClick={onClearSelection}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#5C6E78] hover:text-[#F07868] hover:bg-[#FDF1EF] border border-[#E5E1D8] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Clear all selections"
          >
            <RotateCcw size={13} />
            <span>
              {language === "te"
                ? "ఎంపికలను తొలగించండి"
                : language === "hi"
                ? "चयन साफ़ करें"
                : "Clear Selection"}
            </span>
          </button>
        )}
      </div>

      {/* Main Human Body Display Area */}
      {/* Preserves 1408/768 ratio with clean medical background */}
      <div className="relative w-full aspect-[1408/768] rounded-2xl bg-white border border-[#E5E1D8] shadow-inner overflow-hidden flex items-center justify-center">
        {/* Background Medical Subtle Grid */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* The Exact Provided Human Body Image */}
        <img
          src="/images/mediq-human.png"
          alt="Human Body Anatomical Model"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-0"
        />

        {/* Interactive SVG Overlay with Exact 1:1 Responsive Hotspots */}
        <svg
          viewBox="0 0 1408 768"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full z-10"
        >
          <defs>
            {/* Medical Teal Glow for Hover */}
            <filter id="tealHoverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="6"
                floodColor="#269C91"
                floodOpacity="0.75"
              />
            </filter>

            {/* Warm Coral Glow for Selection */}
            <filter id="coralActiveGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="8"
                floodColor="#F07868"
                floodOpacity="0.85"
              />
            </filter>
          </defs>

          {/* Render 8 Anatomical Polygon Hotspots */}
          {hotspots.map((region) => {
            const selected = isSelected(region.id);
            const hovered = isHovered(region.id);

            return (
              <g
                key={region.id}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${region.name[language]} ${
                  selected ? "selected" : ""
                }`}
                onClick={() => handleRegionClick(region.id)}
                onKeyDown={(e) => handleKeyDown(e, region.id)}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Visual Region Polygon with Smooth Transitions */}
                <polygon
                  points={region.points}
                  fill={
                    selected
                      ? "rgba(240, 120, 104, 0.45)" // Warm Coral Fill
                      : hovered
                      ? "rgba(38, 156, 145, 0.35)" // Medical Teal Hover Fill
                      : "transparent"
                  }
                  stroke={
                    selected
                      ? "#F07868" // Warm Coral Dark Stroke
                      : hovered
                      ? "#269C91" // Medical Teal Stroke
                      : "rgba(148, 163, 184, 0.2)"
                  }
                  strokeWidth={selected ? 3.5 : hovered ? 2.8 : 1}
                  filter={
                    selected
                      ? "url(#coralActiveGlow)"
                      : hovered
                      ? "url(#tealHoverGlow)"
                      : undefined
                  }
                  className={`transition-all duration-200 ${
                    selected ? "animate-coralPulse" : ""
                  }`}
                />

                {/* Pinpoint Checkmark Badge on Selected Region Center */}
                {selected && (
                  <g transform={`translate(${region.center[0] - 14}, ${region.center[1] - 14})`}>
                    <circle
                      cx="14"
                      cy="14"
                      r="14"
                      fill="#F07868"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <path
                      d="M 9 14 L 12 17 L 19 10"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Pulse Hint Overlay when no region is selected */}
        {activeRegionList.length === 0 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-[#34434A]/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full border border-white/20 shadow-xl flex items-center gap-2 pointer-events-none animate-pulse z-20">
            <Sparkles size={14} className="text-[#269C91]" />
            <span className="font-bold">
              {language === "te"
                ? "నొప్పి ఉన్న శరీర భాగాన్ని తాకండి"
                : language === "hi"
                ? "दर्द वाले अंग को स्पर्श करें"
                : "Touch affected body region"}
            </span>
          </div>
        )}
      </div>

      {/* Accessible Quick Region Selector Chips */}
      <div className="w-full mt-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#5C6E78] uppercase tracking-wider mb-1.5 px-1">
          <span className="flex items-center gap-1">
            <Layers size={12} className="text-[#269C91]" />
            {language === "te"
              ? "శరీర భాగాలు"
              : language === "hi"
              ? "शारीरिक अंग"
              : "Body Regions"}
          </span>
          <span>
            {activeRegionList.length}{" "}
            {language === "te"
              ? "ఎంచుకోబడ్డాయి"
              : language === "hi"
              ? "चुने गए"
              : "Selected"}
          </span>
        </div>

        {/* Grid of large touch chips for all 8 required regions */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
          {hotspots.map((h) => {
            const active = isSelected(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handleRegionClick(h.id)}
                className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border text-center cursor-pointer active:scale-95 ${
                  active
                    ? "bg-[#F07868] text-white border-[#D86354] shadow-sm shadow-[#F07868]/30 scale-[1.02]"
                    : "bg-white text-[#34434A] hover:bg-[#E8F5F3] hover:text-[#269C91] border-[#E5E1D8]"
                }`}
              >
                <span className="truncate w-full leading-tight font-extrabold">
                  {h.name[language]}
                </span>
                {h.sideLabel && (
                  <span
                    className={`text-[9px] font-normal ${
                      active ? "text-[#FDF1EF]" : "text-[#8E9EA7]"
                    }`}
                  >
                    ({h.sideLabel[language]})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Regions Status / Pronunciation Bar */}
      <div className="w-full mt-3">
        {activeRegionList.length > 0 ? (
          <div className="p-3 bg-gradient-to-r from-[#FDF1EF] via-[#E8F5F3] to-[#EEF5FB] border border-[#F07868]/30 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#F07868] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Check size={16} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-[#D86354] uppercase tracking-wider">
                  {language === "te"
                    ? "ఎంచుకున్న శరీర భాగాలు"
                    : language === "hi"
                    ? "चुने गए शारीरिक अंग"
                    : "Selected Body Parts"}
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-[#34434A] truncate">
                  {activeRegionList
                    .map((rId) => {
                      const found = getRegionById(rId);
                      return found ? found.label[language] : rId;
                    })
                    .join(", ")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const firstReg = getRegionById(activeRegionList[0]);
                  if (firstReg) {
                    void audioService.speakRegion(
                      firstReg.label[language],
                      language
                    );
                  }
                }}
                className="p-2 bg-white hover:bg-[#E8F5F3] border border-[#269C91]/30 text-[#269C91] rounded-xl transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                title="Pronounce in selected language"
              >
                <Volume2 size={16} className="text-[#269C91]" />
                <span className="text-xs font-bold hidden sm:inline">
                  {language === "te"
                    ? "వినండి"
                    : language === "hi"
                    ? "सुनें"
                    : "Listen"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 text-center text-xs text-[#5C6E78] bg-white rounded-2xl border border-[#E5E1D8] flex items-center justify-center gap-1.5">
            <HelpCircle size={14} className="text-[#8E9EA7]" />
            <span>
              {language === "te"
                ? "శరీరంపై తాకి లేదా బటన్లపై నొక్కి ఎంచుకోండి"
                : language === "hi"
                ? "शरीर पर छूकर या नीचे दिए बटनों से चुनें"
                : "Touch body region on image or select from chips"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
