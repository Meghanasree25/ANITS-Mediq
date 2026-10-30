/* ==========================================================================
   MEDIQ — EMERGENCY RED-FLAG ESCALATION MODAL
   Immediate clinical short-circuit when life-threatening symptoms are detected.
   Bypasses routine registration to prevent delay in emergency care.
   Palette: Soft Rose (#D96B83), Charcoal (#34434A), White (#FFFFFF)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34434A]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border-4 border-[#D96B83] shadow-2xl flex flex-col items-center text-center animate-scaleUp">
        {/* Pulsing Emergency Alarm Icon */}
        <div className="w-20 h-20 rounded-full bg-[#FAEEF1] flex items-center justify-center text-[#D96B83] mb-4 animate-bounce">
          <Siren size={44} />
        </div>

        {/* Big Alert Banner */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAEEF1] text-[#D96B83] text-xs font-black uppercase tracking-wider mb-2 border border-[#D96B83]/30">
          <AlertTriangle size={14} />
          <span>
            {language === "te"
              ? "అత్యవసర హెచ్చరిక — తక్షణ సహాయం"
              : language === "hi"
              ? "आपातकालीन चेतावनी — तत्काल देखभाल"
              : "Emergency Escalation Active"}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#34434A] leading-tight">
          {language === "te"
            ? "దయచేసి వెంటనే అత్యవసర విభాగానికి వెళ్ళండి!"
            : language === "hi"
            ? "कृपया तुरंत इमरजेंसी वार्ड / कैजुअल्टी में जाएं!"
            : "Immediate Emergency Care Required!"}
        </h2>

        <p className="text-sm font-semibold text-[#D96B83] mt-2">
          {language === "te"
            ? "మీరు ఎంచుకున్న లక్షణం అత్యవసరమైనది. సాధారణ నమోదు పూర్తి చేయడానికి వేచి ఉండకండి."
            : language === "hi"
            ? "आपने जो लक्षण चुना है वह गंभीर है। नियमित फॉर्म भरने में समय न लगाएं।"
            : "A high-risk warning sign was detected. Routine registration has been suspended for your safety."}
        </p>

        {/* Identified Emergency Symptoms List */}
        <div className="w-full bg-[#FAEEF1]/60 border border-[#D96B83]/30 rounded-2xl p-4 my-5 text-left">
          <div className="text-xs font-bold text-[#D96B83] uppercase tracking-wider mb-2 flex items-center gap-1">
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
                className="flex items-center gap-2 text-sm font-bold text-[#34434A]"
              >
                <span className="w-2 h-2 rounded-full bg-[#D96B83]" />
                <span>{symp.label[language]}</span>
                <span className="text-xs text-[#D96B83] font-mono">
                  ({symp.redFlagCode || "EMERGENCY_SIGN"})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Action Instructions */}
        <div className="w-full p-4 bg-[#F7F4EF] border border-[#E5E1D8] rounded-2xl text-xs text-[#5C6E78] text-left mb-6 space-y-1">
          <p className="font-bold text-[#34434A]">
            {language === "te"
              ? "తక్షణ చర్యలు:"
              : language === "hi"
              ? "तत्काल कदम:"
              : "Immediate Hospital Instructions:"}
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>
              {language === "te"
                ? "ఆసుపత్రి ఎమర్జెన్సీ / క్యాజువాలిటీ బోర్డు వైపు నడవండి"
                : language === "hi"
                ? "अस्पताल के इमरजेंसी / कैजुअल्टी बोर्ड की ओर जाएं"
                : "Proceed directly to Casualty / Red-Zone Trauma Counter"}
            </li>
            <li>
              {language === "te"
                ? "డ్యూటీ నర్సుకు ఈ స్క్రీన్ చూపించండి"
                : language === "hi"
                ? "ड्यूटी नर्स को यह स्क्रीन दिखाएं"
                : "Show this alert badge to the duty triage nursing officer"}
            </li>
          </ul>
        </div>

        {/* Acknowledge Action Button */}
        <button
          type="button"
          onClick={onAcknowledge}
          className="w-full py-4 px-6 bg-[#D96B83] hover:bg-[#C5536D] active:scale-95 text-white font-black text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>
            {language === "te"
              ? "నేను అర్థం చేసుకున్నాను — ఎమర్జెన్సీ కౌంటర్‌కు వెళ్లండి"
              : language === "hi"
              ? "मुझे समझ आ गया — इमरजेंसी काउंटर पर जाएं"
              : "I Understand — Proceed to Emergency Care"}
          </span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
