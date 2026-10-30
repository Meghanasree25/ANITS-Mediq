/* ==========================================================================
   MEDIQ — INTERACTIVE ANATOMICAL HUMAN BODY MAP
   Medical-grade SVG visualization with Front/Back Views, Anatomical Hotspots,
   Direct Region Pills, Zoom, and Multilingual Audio Narration.
   ========================================================================== */

import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Volume2,
  Sparkles,
} from "lucide-react";
import type { BodyRegionId, BodyView, LanguageCode } from "../types/triage";
import { BODY_REGIONS } from "../data/symptomCatalog";
import { audioService } from "../lib/audioService";

interface InteractiveBodyMapProps {
  selectedRegion: BodyRegionId | null;
  onSelectRegion: (regionId: BodyRegionId) => void;
  language: LanguageCode;
}

export default function InteractiveBodyMap({
  selectedRegion,
  onSelectRegion,
  language,
}: InteractiveBodyMapProps) {
  const [view, setView] = useState<BodyView>("front");
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegionId | null>(null);

  const activeRegionInfo = BODY_REGIONS.find((r) => r.id === selectedRegion);

  const handleRegionClick = (regionId: BodyRegionId) => {
    onSelectRegion(regionId);
    const regionInfo = BODY_REGIONS.find((r) => r.id === regionId);
    if (regionInfo) {
      void audioService.speakRegion(regionInfo.label[language], language);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.8));
  const handleReset = () => {
    setZoom(1);
    setView("front");
  };

  const isSelected = (id: BodyRegionId) => selectedRegion === id;
  const isHovered = (id: BodyRegionId) => hoveredRegion === id;

  const getRegionStyle = (id: BodyRegionId) => {
    const selected = isSelected(id);
    const hovered = isHovered(id);

    if (selected) {
      return {
        fill: "url(#activeNeonGradient)",
        stroke: "#0F382A",
        strokeWidth: 3.5,
        filter: "drop-shadow(0px 0px 10px rgba(16, 185, 129, 0.8))",
        cursor: "pointer",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      };
    }
    if (hovered) {
      return {
        fill: "url(#hoverGradient)",
        stroke: "#047857",
        strokeWidth: 2.5,
        filter: "drop-shadow(0px 0px 6px rgba(16, 185, 129, 0.5))",
        cursor: "pointer",
        transition: "all 0.2s ease",
      };
    }
    return {
      fill: "url(#neutralBodyGradient)",
      stroke: "#94A3B8",
      strokeWidth: 1.5,
      cursor: "pointer",
      transition: "all 0.2s ease",
    };
  };

  // Quick region chips for instant accessible selection
  const primaryRegions: { id: BodyRegionId; label: string; icon: string }[] = [
    { id: "head", label: language === "te" ? "తల" : language === "hi" ? "सिर" : "Head", icon: "🧠" },
    { id: "chest", label: language === "te" ? "ఛాతీ" : language === "hi" ? "छाती" : "Chest", icon: "🫀" },
    { id: "abdomen", label: language === "te" ? "కడుపు" : language === "hi" ? "पेट" : "Belly", icon: "🫄" },
    { id: "back", label: language === "te" ? "నడుము" : language === "hi" ? "पीठ" : "Back", icon: "🦴" },
    { id: "arms", label: language === "te" ? "చేతులు" : language === "hi" ? "हाथ" : "Arms", icon: "💪" },
    { id: "legs", label: language === "te" ? "కాళ్ళు" : language === "hi" ? "पैर" : "Legs", icon: "🦵" },
  ];

  return (
    <div className="relative flex flex-col items-center bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-emerald-100 shadow-xl overflow-hidden select-none w-full max-w-md mx-auto">
      {/* Top Header Controls: Front/Back Toggle & Zoom */}
      <div className="w-full flex items-center justify-between mb-3 z-10 flex-wrap gap-2">
        {/* Front / Back Toggle */}
        <div className="inline-flex p-1 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-xs">
          <button
            type="button"
            onClick={() => setView("front")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
              view === "front"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/20"
                : "text-emerald-900 hover:bg-emerald-100/60"
            }`}
          >
            <span>{language === "te" ? "ముందు భాగం" : language === "hi" ? "आगे का भाग" : "Front View"}</span>
          </button>
          <button
            type="button"
            onClick={() => setView("back")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
              view === "back"
                ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/20"
                : "text-emerald-900 hover:bg-emerald-100/60"
            }`}
          >
            <span>{language === "te" ? "వెనుక భాగం" : language === "hi" ? "पीछे का भाग" : "Back View"}</span>
          </button>
        </div>

        {/* Zoom & Reset Toolbar */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 hover:bg-white rounded-xl text-stone-700 transition"
          >
            <ZoomIn size={17} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 hover:bg-white rounded-xl text-stone-700 transition"
          >
            <ZoomOut size={17} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset View"
            className="p-2 hover:bg-white rounded-xl text-stone-700 transition"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      {/* Interactive Anatomical SVG Container with Guaranteed Visible Dimensions */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden my-1 bg-gradient-to-b from-emerald-50/20 to-teal-50/20 rounded-2xl border border-emerald-50"
        style={{ minHeight: "500px", height: "520px" }}
      >
        <svg
          viewBox="0 0 320 620"
          className="w-full h-full transition-transform duration-300 origin-center filter drop-shadow-md"
          style={{
            transform: `scale(${zoom})`,
            maxHeight: "510px",
            display: "block",
          }}
        >
          <defs>
            {/* Active Selected Region Neon Gradient */}
            <linearGradient id="activeNeonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Hover State Gradient */}
            <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            {/* Neutral Body Base Gradient */}
            <linearGradient id="neutralBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Grid Pattern Background for Medical Kiosk Feel */}
            <pattern id="medicalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.6" opacity="0.6" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="320" height="620" fill="url(#medicalGrid)" rx="16" />

          {/* Neutral Anatomical Ghost Silhouette (Background Silhouette) */}
          <g opacity="0.18">
            <ellipse cx="160" cy="55" rx="36" ry="46" fill="#0F382A" />
            <path d="M140 100 L180 100 L195 130 L125 130 Z" fill="#0F382A" />
            <path d="M125 130 C125 130 90 145 90 220 L108 340 L122 340 L115 220 L130 145 Z" fill="#0F382A" />
            <path d="M195 130 C195 130 230 145 230 220 L212 340 L198 340 L205 220 L190 145 Z" fill="#0F382A" />
            <rect x="126" y="130" width="68" height="160" rx="18" fill="#0F382A" />
            <path d="M126 280 L194 280 L186 350 L134 350 Z" fill="#0F382A" />
            <path d="M132 350 L156 350 L152 480 L130 480 Z" fill="#0F382A" />
            <path d="M164 350 L188 350 L190 480 L168 480 Z" fill="#0F382A" />
            <rect x="128" y="480" width="24" height="95" rx="8" fill="#0F382A" />
            <rect x="168" y="480" width="24" height="95" rx="8" fill="#0F382A" />
          </g>

          {/* =========================================================
              FRONT VIEW INTERACTIVE ANATOMICAL REGIONS
             ========================================================= */}
          {view === "front" && (
            <g id="front-interactive-mesh">
              {/* Head & Cranium */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Head and Face"
                onClick={() => handleRegionClick("head")}
                onMouseEnter={() => setHoveredRegion("head")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M160 14 C132 14 122 32 122 55 C122 75 136 94 160 98 C184 94 198 75 198 55 C198 32 188 14 160 14 Z"
                  style={getRegionStyle("head")}
                />
                {/* Facial Features Indication */}
                <path d="M148 42 Q154 40 158 42" stroke="#64748B" strokeWidth="1.2" fill="none" opacity="0.6" />
                <path d="M162 42 Q166 40 172 42" stroke="#64748B" strokeWidth="1.2" fill="none" opacity="0.6" />
                <path d="M160 48 L158 60 L162 60" stroke="#64748B" strokeWidth="1.2" fill="none" opacity="0.6" />
                <path d="M152 74 Q160 78 168 74" stroke="#64748B" strokeWidth="1.2" fill="none" opacity="0.6" />
              </g>

              {/* Eyes Region */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Eyes"
                onClick={() => handleRegionClick("eyes")}
                onMouseEnter={() => setHoveredRegion("eyes")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <rect x="136" y="42" width="48" height="15" rx="7" style={getRegionStyle("eyes")} />
              </g>

              {/* Ears */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Ears"
                onClick={() => handleRegionClick("ears")}
                onMouseEnter={() => setHoveredRegion("ears")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M117 48 C114 48 112 55 112 62 C112 68 115 72 118 72 Z" style={getRegionStyle("ears")} />
                <path d="M203 48 C206 48 208 55 208 62 C208 68 205 72 202 72 Z" style={getRegionStyle("ears")} />
              </g>

              {/* Nose, Mouth & Throat */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Nose, Mouth and Throat"
                onClick={() => handleRegionClick("throat")}
                onMouseEnter={() => setHoveredRegion("throat")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M148 64 L172 64 L168 88 L152 88 Z" style={getRegionStyle("throat")} />
              </g>

              {/* Neck & Cervical */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Neck"
                onClick={() => handleRegionClick("neck")}
                onMouseEnter={() => setHoveredRegion("neck")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <rect x="146" y="98" width="28" height="22" rx="4" style={getRegionStyle("neck")} />
              </g>

              {/* Shoulders */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Shoulders"
                onClick={() => handleRegionClick("shoulders")}
                onMouseEnter={() => setHoveredRegion("shoulders")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M112 120 C125 115 142 118 146 122 L142 142 L106 148 C104 135 106 124 112 120 Z"
                  style={getRegionStyle("shoulders")}
                />
                <path
                  d="M208 120 C195 115 178 118 174 122 L178 142 L214 148 C216 135 214 124 208 120 Z"
                  style={getRegionStyle("shoulders")}
                />
              </g>

              {/* Chest & Heart */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Chest"
                onClick={() => handleRegionClick("chest")}
                onMouseEnter={() => setHoveredRegion("chest")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M128 125 L192 125 C202 125 208 135 208 152 L206 195 C195 205 178 208 160 208 C142 208 125 205 114 195 L112 152 C112 135 118 125 128 125 Z"
                  style={getRegionStyle("chest")}
                />
                {/* Sternum / Pectoral line contour */}
                <path d="M160 135 L160 190" stroke="#64748B" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.5" />
                <circle cx="152" cy="165" r="4" fill="#EF4444" opacity="0.75" />
              </g>

              {/* Abdomen / Belly */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Abdomen"
                onClick={() => handleRegionClick("abdomen")}
                onMouseEnter={() => setHoveredRegion("abdomen")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M115 202 C128 212 145 214 160 214 C175 214 192 212 205 202 L202 278 C190 286 175 288 160 288 C145 288 130 286 118 278 Z"
                  style={getRegionStyle("abdomen")}
                />
                {/* Navel contour */}
                <circle cx="160" cy="245" r="2.5" fill="#64748B" opacity="0.6" />
              </g>

              {/* Pelvis & Groin */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Pelvis and Groin"
                onClick={() => handleRegionClick("pelvis")}
                onMouseEnter={() => setHoveredRegion("pelvis")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M118 284 C132 292 148 294 160 294 C172 294 188 292 202 284 L196 342 C180 348 166 350 160 350 C154 350 140 348 124 342 Z"
                  style={getRegionStyle("pelvis")}
                />
              </g>

              {/* Arms & Hands (Front) */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Arms and Hands"
                onClick={() => handleRegionClick("arms")}
                onMouseEnter={() => setHoveredRegion("arms")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M104 150 L114 150 L104 250 L92 250 Z" style={getRegionStyle("arms")} />
                <path d="M92 254 L104 254 L94 330 L80 330 Z" style={getRegionStyle("arms")} />
                <ellipse cx="85" cy="344" rx="9" ry="14" style={getRegionStyle("arms")} />

                <path d="M216 150 L206 150 L216 250 L228 250 Z" style={getRegionStyle("arms")} />
                <path d="M228 254 L216 254 L226 330 L240 330 Z" style={getRegionStyle("arms")} />
                <ellipse cx="235" cy="344" rx="9" ry="14" style={getRegionStyle("arms")} />
              </g>

              {/* Legs & Thighs */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Legs and Thighs"
                onClick={() => handleRegionClick("legs")}
                onMouseEnter={() => setHoveredRegion("legs")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M125 348 L155 352 L152 440 L126 440 Z" style={getRegionStyle("legs")} />
                <path d="M165 352 L195 348 L194 440 L168 440 Z" style={getRegionStyle("legs")} />
              </g>

              {/* Knees */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Knees"
                onClick={() => handleRegionClick("knees")}
                onMouseEnter={() => setHoveredRegion("knees")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <ellipse cx="139" cy="452" rx="14" ry="12" style={getRegionStyle("knees")} />
                <ellipse cx="181" cy="452" rx="14" ry="12" style={getRegionStyle("knees")} />
              </g>

              {/* Calves & Shins */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Calves"
                onClick={() => handleRegionClick("legs")}
                onMouseEnter={() => setHoveredRegion("legs")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M127 466 L151 466 L148 554 L132 554 Z" style={getRegionStyle("legs")} />
                <path d="M169 466 L193 466 L188 554 L172 554 Z" style={getRegionStyle("legs")} />
              </g>

              {/* Feet & Ankles */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Feet"
                onClick={() => handleRegionClick("feet")}
                onMouseEnter={() => setHoveredRegion("feet")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M130 556 L150 556 L156 585 C156 592 142 596 126 594 L126 580 Z" style={getRegionStyle("feet")} />
                <path d="M170 556 L190 556 L194 580 L194 594 C178 596 164 592 164 585 Z" style={getRegionStyle("feet")} />
              </g>
            </g>
          )}

          {/* =========================================================
              BACK VIEW INTERACTIVE ANATOMICAL REGIONS
             ========================================================= */}
          {view === "back" && (
            <g id="back-interactive-mesh">
              {/* Back of Head */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Back of Head"
                onClick={() => handleRegionClick("head")}
                onMouseEnter={() => setHoveredRegion("head")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M160 14 C132 14 120 32 120 55 C120 78 136 96 160 98 C184 96 200 78 200 55 C200 32 188 14 160 14 Z"
                  style={getRegionStyle("head")}
                />
              </g>

              {/* Posterior Neck & Cervical */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Back of Neck"
                onClick={() => handleRegionClick("neck")}
                onMouseEnter={() => setHoveredRegion("neck")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <rect x="144" y="98" width="32" height="26" rx="5" style={getRegionStyle("neck")} />
              </g>

              {/* Upper Back & Scapula */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Upper Back"
                onClick={() => handleRegionClick("back")}
                onMouseEnter={() => setHoveredRegion("back")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M120 124 L200 124 C208 124 212 136 210 160 L204 220 C188 226 172 228 160 228 C148 228 132 226 116 220 L110 160 C108 136 112 124 120 124 Z"
                  style={getRegionStyle("back")}
                />
                {/* Spine midline contour */}
                <path d="M160 125 L160 225" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
              </g>

              {/* Lower Back & Lumbar Spine */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Lower Back"
                onClick={() => handleRegionClick("back")}
                onMouseEnter={() => setHoveredRegion("back")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M116 224 C130 230 148 232 160 232 C172 232 190 230 204 224 L202 290 C188 296 174 298 160 298 C146 298 132 296 118 290 Z"
                  style={getRegionStyle("back")}
                />
                <path d="M160 232 L160 295" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
              </g>

              {/* Gluteal / Pelvic Back */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Gluteal Region"
                onClick={() => handleRegionClick("pelvis")}
                onMouseEnter={() => setHoveredRegion("pelvis")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path
                  d="M118 292 C132 298 146 300 160 300 C174 300 188 298 202 292 L196 348 C180 354 166 356 160 356 C154 356 140 354 124 348 Z"
                  style={getRegionStyle("pelvis")}
                />
              </g>

              {/* Posterior Legs & Hamstrings */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Back of Legs"
                onClick={() => handleRegionClick("legs")}
                onMouseEnter={() => setHoveredRegion("legs")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M125 352 L155 356 L152 448 L126 448 Z" style={getRegionStyle("legs")} />
                <path d="M165 356 L195 352 L194 448 L168 448 Z" style={getRegionStyle("legs")} />
              </g>

              {/* Popliteal / Back of Knees */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Back of Knees"
                onClick={() => handleRegionClick("knees")}
                onMouseEnter={() => setHoveredRegion("knees")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <rect x="126" y="450" width="26" height="16" rx="6" style={getRegionStyle("knees")} />
                <rect x="168" y="450" width="26" height="16" rx="6" style={getRegionStyle("knees")} />
              </g>

              {/* Calves & Achilles */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Calves"
                onClick={() => handleRegionClick("legs")}
                onMouseEnter={() => setHoveredRegion("legs")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M126 470 L152 470 L148 554 L132 554 Z" style={getRegionStyle("legs")} />
                <path d="M168 470 L194 470 L188 554 L172 554 Z" style={getRegionStyle("legs")} />
              </g>

              {/* Heels & Soles */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Heels and Soles"
                onClick={() => handleRegionClick("feet")}
                onMouseEnter={() => setHoveredRegion("feet")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <ellipse cx="140" cy="578" rx="14" ry="20" style={getRegionStyle("feet")} />
                <ellipse cx="180" cy="578" rx="14" ry="20" style={getRegionStyle("feet")} />
              </g>

              {/* Arms (Back View) */}
              <g
                tabIndex={0}
                role="button"
                aria-label="Arms"
                onClick={() => handleRegionClick("arms")}
                onMouseEnter={() => setHoveredRegion("arms")}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <path d="M104 150 L114 150 L102 330 L86 330 Z" style={getRegionStyle("arms")} />
                <ellipse cx="88" cy="344" rx="9" ry="14" style={getRegionStyle("arms")} />
                <path d="M216 150 L206 150 L218 330 L234 330 Z" style={getRegionStyle("arms")} />
                <ellipse cx="232" cy="344" rx="9" ry="14" style={getRegionStyle("arms")} />
              </g>
            </g>
          )}
        </svg>

        {/* Pulse Hint Overlay when no region is selected */}
        {!selectedRegion && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-950/90 backdrop-blur-md text-emerald-100 text-xs px-4 py-2 rounded-full border border-emerald-500/40 shadow-xl flex items-center gap-2 pointer-events-none animate-pulse">
            <Sparkles size={14} className="text-emerald-400" />
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

      {/* Quick Accessible Region Pills */}
      <div className="w-full mt-3 flex items-center justify-between gap-1.5 overflow-x-auto pb-1 pt-1">
        {primaryRegions.map((chip) => {
          const isCurr = isSelected(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleRegionClick(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                isCurr
                  ? "bg-emerald-700 text-white shadow-md shadow-emerald-800/20 scale-105"
                  : "bg-stone-100 text-stone-700 hover:bg-emerald-100 hover:text-emerald-900 border border-stone-200"
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Region Feedback Bar */}
      {activeRegionInfo ? (
        <div className="w-full mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              ✓
            </div>
            <div>
              <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                {language === "te" ? "ఎంచుకున్న భాగం" : language === "hi" ? "चुना गया अंग" : "Selected Region"}
              </div>
              <div className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                <span>{activeRegionInfo.label[language]}</span>
                {language !== "en" && (
                  <span className="text-[11px] text-stone-500 font-normal">
                    ({activeRegionInfo.label.en})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void audioService.speakRegion(activeRegionInfo.label[language], language)}
            title="Listen in selected language"
            className="p-2 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl transition flex items-center gap-1 shadow-xs active:scale-95"
          >
            <Volume2 size={16} className="text-emerald-700" />
            <span className="text-xs font-bold hidden sm:inline">
              {language === "te" ? "వినండి" : language === "hi" ? "सुनें" : "Listen"}
            </span>
          </button>
        </div>
      ) : (
        <div className="w-full mt-3 p-2.5 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
          {language === "te"
            ? "శరీరం ముందు లేదా వెనుక భాగాన్ని తిప్పి ఎంచుకోవచ్చు"
            : language === "hi"
            ? "शरीर के आगे या पीछे के हिस्से को छूकर चुनें"
            : "Tap any body region to view symptoms"}
        </div>
      )}
    </div>
  );
}
