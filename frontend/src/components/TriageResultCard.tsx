/* ==========================================================================
   MEDIQ — AI TRIAGE RESULT & CLINICAL DECISION SUPPORT CARD
   Clearly distinguishes model predictions from clinician confirmation.
   Supports clinician override with mandatory rationale.
   Palette: Warm Ivory, Medical Teal (#269C91), Lavender (#9584D8), Coral (#F07868), Amber (#E8AC48), Rose (#D96B83)
   ========================================================================== */

import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  UserCheck,
  Edit3,
  BrainCircuit,
  Info,
} from "lucide-react";
import type {
  ESILevel,
  LanguageCode,
  PatientTriageRecord,
} from "../types/triage";

interface TriageResultCardProps {
  record: PatientTriageRecord;
  onConfirm: (level: ESILevel) => void;
  onOverride: (level: ESILevel, reason: string) => void;
  language?: LanguageCode;
  isStaffMode?: boolean;
}

export default function TriageResultCard({
  record,
  onConfirm,
  onOverride,
  isStaffMode = false,
}: TriageResultCardProps) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState<ESILevel>(3);
  const [overrideReason, setOverrideReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const { aiEvaluation, clinicianReview } = record;

  const getAcuityColor = (level: ESILevel | "ABSTAIN") => {
    switch (level) {
      case 1:
        return {
          bg: "bg-[#D96B83] text-white",
          lightBg: "bg-[#FAEEF1] border-[#D96B83]/30 text-[#D96B83]",
          border: "border-[#D96B83]",
          label: "Level 1: Resuscitation (Immediate)",
        };
      case 2:
        return {
          bg: "bg-[#F07868] text-white",
          lightBg: "bg-[#FDF1EF] border-[#F07868]/30 text-[#D86354]",
          border: "border-[#F07868]",
          label: "Level 2: Emergent (≤ 15 min)",
        };
      case 3:
        return {
          bg: "bg-[#E8AC48] text-white",
          lightBg: "bg-[#FDF6EB] border-[#E8AC48]/30 text-[#D49631]",
          border: "border-[#E8AC48]",
          label: "Level 3: Urgent (≤ 60 min)",
        };
      case 4:
        return {
          bg: "bg-[#269C91] text-white",
          lightBg: "bg-[#E8F5F3] border-[#269C91]/30 text-[#1E7E75]",
          border: "border-[#269C91]",
          label: "Level 4: Less Urgent (≤ 120 min)",
        };
      case 5:
        return {
          bg: "bg-[#69A9DC] text-white",
          lightBg: "bg-[#EEF5FB] border-[#69A9DC]/30 text-[#4F94CD]",
          border: "border-[#69A9DC]",
          label: "Level 5: Non-urgent (Routine queue)",
        };
      case "ABSTAIN":
      default:
        return {
          bg: "bg-[#9584D8] text-white",
          lightBg: "bg-[#F3F1FA] border-[#9584D8]/30 text-[#7F6DC7]",
          border: "border-[#9584D8]",
          label: "ABSTAIN: Clinician Review Mandated",
        };
    }
  };

  const levelColor = getAcuityColor(aiEvaluation.triageLevel);

  const handleApplyOverride = () => {
    if (!overrideReason.trim()) {
      setReasonError("Mandatory: Please select or enter a clinical justification.");
      return;
    }
    setReasonError("");
    onOverride(overrideLevel, overrideReason);
    setShowOverrideModal(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E1D8] shadow-sm w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Banner: AI Model Source & Token ID (Lavender AI Insight Accent) */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8] flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#F3F1FA] text-[#9584D8] rounded-xl border border-[#9584D8]/20">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#9584D8] uppercase tracking-wider">
              {aiEvaluation.source === "MEDIQ_ML_BACKEND"
                ? "AI Backend Prediction (Python scikit-learn)"
                : "Clinical Decision Engine"}
            </div>
            <div className="text-sm font-extrabold text-[#34434A]">
              Patient Token:{" "}
              <span className="font-mono text-[#269C91] bg-[#E8F5F3] px-2.5 py-0.5 rounded-lg border border-[#269C91]/30 font-bold">
                {record.token}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#8E9EA7] font-medium flex items-center gap-1">
          <Clock size={13} />
          <span>
            {new Date(aiEvaluation.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Primary Triage Level Box */}
      <div
        className={`p-6 rounded-2xl border-2 ${levelColor.lightBg} ${levelColor.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider opacity-85">
              Predicted Acuity Level
            </span>
            {aiEvaluation.confidence > 0 && (
              <span className="text-[11px] font-bold bg-white/90 text-[#34434A] px-2.5 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                {(aiEvaluation.confidence * 100).toFixed(1)}% Confidence
              </span>
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-black flex items-center gap-2">
            <span>{levelColor.label}</span>
          </div>

          {aiEvaluation.triageLevel === "ABSTAIN" && (
            <p className="text-xs font-semibold mt-1 opacity-90 text-[#5C6E78]">
              Automated score withheld by safety protocol. High clinical risk requires human evaluation.
            </p>
          )}
        </div>

        {/* Suggested Target OPD Department */}
        <div className="bg-white/95 p-4 rounded-xl border border-[#E5E1D8] shadow-2xs sm:text-right">
          <div className="text-[11px] font-bold text-[#5C6E78] uppercase flex items-center sm:justify-end gap-1">
            <Building2 size={13} className="text-[#269C91]" />
            <span>Assigned OPD</span>
          </div>
          <div className="text-base font-extrabold text-[#34434A] mt-0.5">
            {aiEvaluation.department}
          </div>
        </div>
      </div>

      {/* Safety Reasons & Clinical Flags (Amber / Attention) */}
      {aiEvaluation.safetyReasons.length > 0 && (
        <div className="bg-[#FDF6EB] border border-[#E8AC48]/30 rounded-2xl p-4">
          <div className="text-xs font-extrabold text-[#D49631] uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <ShieldAlert size={15} />
            <span>Identified Clinical Factors & Safeguards</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiEvaluation.safetyReasons.map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white text-[#34434A] border border-[#E8AC48]/40 px-3 py-1 rounded-xl shadow-2xs"
              >
                <AlertTriangle size={12} className="text-[#E8AC48]" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clinician Review & Confirmation Status */}
      <div className="p-5 bg-[#F7F4EF] rounded-2xl border border-[#E5E1D8] flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-extrabold text-[#5C6E78] uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={16} className="text-[#269C91]" />
            <span>Clinician Review Status</span>
          </span>

          {clinicianReview ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#E8F5F3] text-[#269C91] border border-[#269C91]/30">
              <CheckCircle2 size={13} />
              {clinicianReview.isOverridden
                ? `Confirmed Override (Level ${clinicianReview.confirmedLevel})`
                : `Confirmed Level ${clinicianReview.confirmedLevel}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF6EB] text-[#D49631] border border-[#E8AC48]/40">
              Pending Clinician Confirmation
            </span>
          )}
        </div>

        {clinicianReview?.overrideReason && (
          <div className="text-xs text-[#34434A] bg-white p-2.5 rounded-xl border border-[#E5E1D8]">
            <strong>Override Rationale:</strong> {clinicianReview.overrideReason}
          </div>
        )}

        {/* Staff Action Buttons (Only when in Staff Mode) */}
        {isStaffMode && !clinicianReview && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onConfirm(aiEvaluation.suggestedTriageLevel)}
              className="flex-1 py-3 px-4 bg-[#269C91] hover:bg-[#1E7E75] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Confirm Assessment</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOverrideModal(true)}
              className="py-3 px-4 bg-white hover:bg-[#F7F4EF] active:scale-95 text-[#34434A] border border-[#E5E1D8] font-bold text-sm rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={16} className="text-[#5C6E78]" />
              <span>Override</span>
            </button>
          </div>
        )}
      </div>

      {/* Clinical Disclaimer Notice */}
      <div className="p-3 bg-[#EEF5FB] border border-[#69A9DC]/30 rounded-xl flex items-start gap-2 text-[11px] text-[#4F94CD]">
        <Info size={14} className="shrink-0 mt-0.5 text-[#69A9DC]" />
        <span>
          <strong>Triage Decision Support:</strong> This recommendation is generated from visual symptom indicators and vital parameters. Final patient routing remains under the clinical authority of the attending healthcare team.
        </span>
      </div>

      {/* Clinician Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E5E1D8] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
              <h3 className="font-extrabold text-base text-[#34434A]">
                Clinical Acuity Override
              </h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-[#8E9EA7] hover:text-[#34434A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5C6E78]">
              Select the adjusted ESI Acuity level and provide clinical justification.
            </p>

            {/* Level selection chips */}
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setOverrideLevel(lvl as ESILevel)}
                  className={`p-2.5 rounded-xl font-black text-xs transition border cursor-pointer ${
                    overrideLevel === lvl
                      ? "bg-[#269C91] text-white border-[#269C91] shadow-xs"
                      : "bg-[#F7F4EF] text-[#34434A] border-[#E5E1D8] hover:bg-white"
                  }`}
                >
                  Lvl {lvl}
                </button>
              ))}
            </div>

            {/* Common Reasons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5C6E78]">
                Select Rationale:
              </label>
              {[
                "Vital signs indicate higher hemodynamic risk",
                "Severe respiratory distress observed directly",
                "Patient altered mental status / lethargy",
                "Known severe immunocompromised status",
                "Disproportionate acute pain presentation",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setOverrideReason(reason)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    overrideReason === reason
                      ? "bg-[#E8F5F3] border-[#269C91] text-[#1E7E75]"
                      : "bg-[#F7F4EF]/60 border-[#E5E1D8] text-[#34434A] hover:bg-white"
                  }`}
                >
                  • {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Or type specific clinical reason..."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E5E1D8] text-xs focus:ring-2 focus:ring-[#269C91] focus:outline-none"
            />
            {reasonError && (
              <div className="text-[#D96B83] text-xs font-bold mt-0.5">
                {reasonError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E1D8] text-[#5C6E78] font-bold text-xs hover:bg-[#F7F4EF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                className="flex-1 py-2.5 bg-[#269C91] hover:bg-[#1E7E75] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
