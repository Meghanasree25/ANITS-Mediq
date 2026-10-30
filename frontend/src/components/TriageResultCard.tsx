/* ==========================================================================
   MEDIQ — AI TRIAGE RESULT & CLINICAL DECISION SUPPORT CARD
   Clearly distinguishes model predictions from clinician confirmation.
   Supports clinician override with mandatory rationale.
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
          bg: "bg-rose-600 text-white",
          lightBg: "bg-rose-50 border-rose-200 text-rose-900",
          border: "border-rose-500",
          label: "Level 1: Resuscitation (Immediate)",
        };
      case 2:
        return {
          bg: "bg-orange-500 text-white",
          lightBg: "bg-orange-50 border-orange-200 text-orange-950",
          border: "border-orange-500",
          label: "Level 2: Emergent (≤ 15 min)",
        };
      case 3:
        return {
          bg: "bg-amber-500 text-white",
          lightBg: "bg-amber-50 border-amber-200 text-amber-950",
          border: "border-amber-400",
          label: "Level 3: Urgent (≤ 60 min)",
        };
      case 4:
        return {
          bg: "bg-emerald-600 text-white",
          lightBg: "bg-emerald-50 border-emerald-200 text-emerald-950",
          border: "border-emerald-400",
          label: "Level 4: Less Urgent (≤ 120 min)",
        };
      case 5:
        return {
          bg: "bg-slate-600 text-white",
          lightBg: "bg-slate-50 border-slate-200 text-slate-900",
          border: "border-slate-300",
          label: "Level 5: Non-urgent (Routine queue)",
        };
      case "ABSTAIN":
      default:
        return {
          bg: "bg-rose-700 text-white",
          lightBg: "bg-rose-50 border-rose-300 text-rose-950",
          border: "border-rose-600",
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
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Top Banner: AI Model Source & Token ID */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {aiEvaluation.source === "MEDIQ_ML_BACKEND"
                ? "AI Backend Prediction (Python scikit-learn)"
                : "Clinical Decision Engine"}
            </div>
            <div className="text-sm font-extrabold text-stone-900">
              Patient Token:{" "}
              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {record.token}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-stone-400 font-medium flex items-center gap-1">
          <Clock size={13} />
          <span>{new Date(aiEvaluation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Primary Triage Level Box */}
      <div
        className={`p-6 rounded-2xl border-2 ${levelColor.lightBg} ${levelColor.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider opacity-80">
              Predicted Urgency Acuity
            </span>
            {aiEvaluation.confidence > 0 && (
              <span className="text-[11px] font-bold bg-white/80 px-2 py-0.5 rounded-full border shadow-xs">
                {(aiEvaluation.confidence * 100).toFixed(1)}% Confidence
              </span>
            )}
          </div>

          <div className="text-2xl sm:text-3xl font-black flex items-center gap-2">
            <span>{levelColor.label}</span>
          </div>

          {aiEvaluation.triageLevel === "ABSTAIN" && (
            <p className="text-xs font-semibold mt-1 opacity-90">
              Automated score withheld by safety protocol. High clinical risk requires human evaluation.
            </p>
          )}
        </div>

        {/* Suggested Target OPD Department */}
        <div className="bg-white/90 p-4 rounded-xl border border-stone-200 shadow-sm sm:text-right">
          <div className="text-[11px] font-bold text-stone-500 uppercase flex items-center sm:justify-end gap-1">
            <Building2 size={13} />
            <span>Recommended OPD</span>
          </div>
          <div className="text-base font-extrabold text-emerald-950 mt-0.5">
            {aiEvaluation.department}
          </div>
        </div>
      </div>

      {/* Safety Reasons & Clinical Flags */}
      {aiEvaluation.safetyReasons.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <ShieldAlert size={15} />
            <span>Identified Clinical Factors & Safeguards</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {aiEvaluation.safetyReasons.map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs font-bold bg-white text-amber-950 border border-amber-300 px-3 py-1 rounded-xl shadow-xs"
              >
                <AlertTriangle size={12} className="text-amber-600" />
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clinician Review & Confirmation Status */}
      <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={16} className="text-emerald-700" />
            <span>Clinician Review Status</span>
          </span>

          {clinicianReview ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={13} />
              {clinicianReview.isOverridden
                ? `Confirmed Override (Level ${clinicianReview.confirmedLevel})`
                : `Confirmed Level ${clinicianReview.confirmedLevel}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Pending Clinician Confirmation
            </span>
          )}
        </div>

        {clinicianReview?.overrideReason && (
          <div className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200">
            <strong>Override Rationale:</strong> {clinicianReview.overrideReason}
          </div>
        )}

        {/* Staff Action Buttons (Only when in Staff Mode or allowed) */}
        {isStaffMode && !clinicianReview && (
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onConfirm(aiEvaluation.suggestedTriageLevel)}
              className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Confirm AI Assessment</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOverrideModal(true)}
              className="py-3 px-4 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 border border-stone-300 font-bold text-sm rounded-xl transition flex items-center gap-1.5"
            >
              <Edit3 size={16} />
              <span>Override</span>
            </button>
          </div>
        )}
      </div>

      {/* Clinician Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-700" />
                <span>Clinician Manual Override</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5">
                Assign Final ESI Urgency Level:
              </label>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as ESILevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setOverrideLevel(lvl)}
                    className={`py-2.5 rounded-xl font-black text-sm border-2 transition ${
                      overrideLevel === lvl
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-white"
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5">
                Mandatory Clinical Rationale:
              </label>
              <div className="space-y-1.5 mb-2">
                {[
                  "Atypical symptom presentation upon bedside exam",
                  "Discrepancy in recorded patient vitals",
                  "High-risk comorbidities / elderly vulnerability",
                  "Doctor clinical discretion based on physical exam",
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOverrideReason(reason)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-semibold border transition ${
                      overrideReason === reason
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-white"
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
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {reasonError && (
                <div className="text-rose-600 text-xs font-bold mt-1">
                  {reasonError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md"
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
