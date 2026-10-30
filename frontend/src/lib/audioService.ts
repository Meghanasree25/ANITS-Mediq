/* ==========================================================================
   MEDIQ AUDIO & SPEECH ACCESSIBILITY SERVICE
   Multilingual Text-to-Speech (Telugu, Hindi, English) & Speech Recognition
   ========================================================================== */

import type { LanguageCode } from "../types/triage";

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;
  private listeners: ((isSpeaking: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(callback: (isSpeaking: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(isSpeaking: boolean) {
    this.isSpeakingState = isSpeaking;
    this.listeners.forEach((cb) => cb(isSpeaking));
  }

  public get isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public get activeUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
    }
  }

  public speak(
    text: string,
    language: LanguageCode = "en",
    rate = 0.95
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || !text.trim()) {
        resolve();
        return;
      }

      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Select voice based on language code
      const langMap: Record<LanguageCode, string> = {
        en: "en-IN",
        te: "te-IN",
        hi: "hi-IN",
      };

      utterance.lang = langMap[language] || "en-IN";
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Try to find native regional voices if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase())
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.notify(true);
      };

      utterance.onend = () => {
        this.notify(false);
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn("Speech synthesis notice:", e);
        this.notify(false);
        resolve();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis speak error:", err);
        this.notify(false);
        resolve();
      }
    });
  }

  // Pre-configured spoken prompts for key interactions
  public speakRegion(
    regionName: string,
    lang: LanguageCode = "en"
  ): Promise<void> {
    const prefixes: Record<LanguageCode, string> = {
      en: "Selected area: ",
      te: "ఎంచుకున్న భాగం: ",
      hi: "चुना गया अंग: ",
    };
    return this.speak(`${prefixes[lang]}${regionName}`, lang);
  }

  public speakSymptom(
    symptomName: string,
    lang: LanguageCode = "en"
  ): Promise<void> {
    return new Promise((resolve) => {
      void this.speak(symptomName, lang).then(resolve);
    });
  }

  public speakEmergencyAlert(lang: LanguageCode = "en"): Promise<void> {
    const alerts: Record<LanguageCode, string> = {
      en: "Warning! Critical emergency sign detected. Please alert hospital staff immediately and proceed to emergency room.",
      te: "హెచ్చరిక! అత్యవసర లక్షణం గుర్తించబడింది. దయచేసి వెంటనే అత్యవసర విభాగానికి వెళ్ళండి.",
      hi: "चेतावनी! गंभीर आपातकालीन लक्षण पाया गया है। कृपया तुरंत इमरजेंसी वार्ड में जाएं।",
    };
    return this.speak(alerts[lang], lang, 0.9);
  }
}

export const audioService = new AudioService();
