/* ==========================================================================
   MEDIQ — EMERGENCY RED-FLAG ESCALATION MODAL
   Immediate clinical short-circuit when life-threatening symptoms are detected.
   Bypasses routine registration to prevent delay in emergency care.
   ========================================================================== */

import { useEffect } from "react";
import {
  AlertTriangle,
  Siren,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type { LanguageCode, SymptomOption } from "../types/triage";
import { audioService } from "../lib/audioService";

interface EmergencyEscalationModalProps {
  isOpen: boolean;
  emergencySymptoms: SymptomOption[];
  onAcknowledge: () => void;
  language: LanguageCode;
}

export default function EmergencyEscalationModal({
  isOpen,
  emergencySymptoms,
  onAcknowledge,
  language,
}: EmergencyEscalationModalProps) {
  useEffect(() => {
    if (isOpen) {
      void audioService.speakEmergencyAlert(language);
    }
  }, [isOpen, language]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border-4 border-rose-600 shadow-2xl flex flex-col items-center text-center animate-scaleUp">
        {/* Pulsing Emergency Alarm Icon */}
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <Siren size={44} />
        </div>

        {/* Big Alert Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider mb-2">
          <AlertTriangle size={14} />
          <span>
            {language === "te"
              ? "అత్యవసర హెచ్చరిక — తక్షణ సహాయం"
              : language === "hi"
              ? "आपातकालीन चेतावनी — तत्काल देखभाल"
              : "Emergency Escalation Active"}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-rose-950 leading-tight">
          {language === "te"
            ? "దయచేసి వెంటనే అత్యవసర విభాగానికి వెళ్ళండి!"
            : language === "hi"
            ? "कृपया तुरंत इमरजेंसी वार्ड / कैजुअल्टी में जाएं!"
            : "Immediate Emergency Care Required!"}
        </h2>

        <p className="text-sm font-semibold text-rose-800 mt-2">
          {language === "te"
            ? "మీరు ఎంచుకున్న లక్షణం అత్యవసరమైనది. సాధారణ నమోదు పూర్తి చేయడానికి వేచి ఉండకండి."
            : language === "hi"
            ? "आपने जो लक्षण चुना है वह गंभीर है। नियमित फॉर्म भरने में समय न लगाएं।"
            : "A high-risk warning sign was detected. Routine registration has been suspended for your safety."}
        </p>

        {/* Identified Emergency Symptoms List */}
        <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 my-5 text-left">
          <div className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldAlert size={14} />
            <span>
              {language === "te"
                ? "గుర్తించబడిన అత్యవసర లక్షణాలు:"
                : language === "hi"
                ? "पाए गए गंभीर लक्षण:"
                : "Identified Critical Red Flags:"}
            </span>
          </div>

          <div className="space-y-1.5">
            {emergencySymptoms.map((symp) => (
              <div
                key={symp.id}
                className="flex items-center gap-2 text-sm font-bold text-rose-950"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>{symp.label[language]}</span>
                <span className="text-xs text-rose-700 font-mono">
                  ({symp.redFlagCode || "EMERGENCY_SIGN"})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Immediate Instructions */}
        <div className="w-full bg-stone-100 rounded-2xl p-4 mb-6 text-stone-800 text-xs text-left space-y-1.5">
          <div className="font-extrabold text-stone-900">
            {language === "te"
              ? "ఆసుపత్రి సిబ్బంది మార్గదర్శకాలు:"
              : language === "hi"
              ? "अस्पताल निर्देश:"
              : "Next Step Instructions:"}
          </div>
          <div>
            1. <strong>Casualty / Emergency Room 1</strong> is 30 meters to the left of the reception desk.
          </div>
          <div>
            2. High-priority audio alarm dispatched to triage nursing station.
          </div>
        </div>

        {/* Action Button: Staff Acknowledged / Patient Proceed */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full py-4 px-6 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl shadow-rose-700/30 flex items-center justify-center gap-2 transition"
        >
          <span>
            {language === "te"
              ? "అత్యవసర విభాగం వైపు వెళ్ళండి (Proceed to Casualty)"
              : language === "hi"
              ? "इमरजेंसी में जाएं (Proceed to Casualty)"
              : "Proceed to Emergency Casualty Now"}
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
