/* ==========================================================================
   MEDIQ — STAFF VITALS & CLINICAL SCREENING MODAL
   Enables triage nurses to record vitals with real-time early-warning alerts.
   Allows unavailable vitals to remain explicitly omitted.
   ========================================================================== */

import { useState } from "react";
import {
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";
import type { ClinicalVitals } from "../types/triage";

interface StaffVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vitals: ClinicalVitals) => void;
  initialVitals?: ClinicalVitals;
  patientName?: string;
  patientToken?: string;
}

export default function StaffVitalsModal({
  isOpen,
  onClose,
  onSave,
  initialVitals,
  patientName = "Patient",
  patientToken = "MEDIQ-001",
}: StaffVitalsModalProps) {
  const [systolic, setSystolic] = useState<string>(
    initialVitals?.bpSystolic?.toString() || ""
  );
  const [diastolic, setDiastolic] = useState<string>(
    initialVitals?.bpDiastolic?.toString() || ""
  );
  const [pulse, setPulse] = useState<string>(
    initialVitals?.pulseBpm?.toString() || ""
  );
  const [temp, setTemp] = useState<string>(
    initialVitals?.tempC?.toString() || ""
  );
  const [spo2, setSpo2] = useState<string>(
    initialVitals?.spo2Pct?.toString() || ""
  );
  const [respRate, setRespRate] = useState<string>(
    initialVitals?.respRate?.toString() || ""
  );

  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  const validateAndSave = () => {
    const alertList: string[] = [];

    const numSystolic = systolic ? parseFloat(systolic) : null;
    const numDiastolic = diastolic ? parseFloat(diastolic) : null;
    const numPulse = pulse ? parseFloat(pulse) : null;
    let numTemp = temp ? parseFloat(temp) : null;
    const numSpo2 = spo2 ? parseFloat(spo2) : null;
    const numResp = respRate ? parseFloat(respRate) : null;

    // Convert Fahrenheit if entered (e.g., > 80°F)
    if (numTemp && numTemp >= 86 && numTemp <= 113) {
      numTemp = parseFloat((((numTemp - 32) * 5) / 9).toFixed(1));
    }

    // Clinical Early-Warning Thresholds (from triage_primer.md)
    if (numSpo2 !== null) {
      if (numSpo2 < 85) {
        alertList.push("CRITICAL: SpO2 < 85% requires immediate oxygen & resuscitation!");
      } else if (numSpo2 < 92) {
        alertList.push("WARNING: SpO2 < 92% is in the clinical danger zone.");
      }
    }

    if (numPulse !== null) {
      if (numPulse <= 40 || numPulse >= 131) {
        alertList.push("WARNING: Pulse is abnormal (≤40 or ≥131 bpm).");
      }
    }

    if (numSystolic !== null) {
      if (numSystolic <= 90) {
        alertList.push("WARNING: Systolic BP ≤ 90 mmHg indicates possible shock/hypotension.");
      } else if (numSystolic >= 220) {
        alertList.push("WARNING: Severe hypertension (Systolic BP ≥ 220 mmHg).");
      }
    }

    if (numTemp !== null) {
      if (numTemp <= 35.0) {
        alertList.push("WARNING: Danger-zone hypothermia (≤ 35.0°C).");
      } else if (numTemp >= 39.1) {
        alertList.push("WARNING: High fever (≥ 39.1°C).");
      }
    }

    setWarnings(alertList);

    const vitalsResult: ClinicalVitals = {
      bpSystolic: numSystolic,
      bpDiastolic: numDiastolic,
      pulseBpm: numPulse,
      tempC: numTemp,
      spo2Pct: numSpo2,
      respRate: numResp,
    };

    onSave(vitalsResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <HeartPulse size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-lg leading-snug">
                Clinical Vitals Intake
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {patientName} • Token: <span className="font-mono text-emerald-700 font-bold">{patientToken}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informational Guidance */}
        <div className="text-xs text-stone-600 bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl flex items-start gap-2">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <span>
            Measurements not yet recorded may be left empty. Any abnormal values trigger automatic priority escalation.
          </span>
        </div>

        {/* Vitals Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Blood Pressure */}
          <div className="col-span-full bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2">
              <Gauge size={16} className="text-rose-600" />
              <span>Blood Pressure (mmHg)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Systolic (e.g. 120)"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-1/2 p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-stone-400 font-bold">/</span>
              <input
                type="number"
                placeholder="Diastolic (e.g. 80)"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-1/2 p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Oxygen Saturation (SpO2) */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2">
              <Activity size={16} className="text-sky-600" />
              <span>SpO2 Saturation (%)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 98"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Warning threshold: &lt; 92%
            </span>
          </div>

          {/* Pulse / Heart Rate */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2">
              <HeartPulse size={16} className="text-rose-600" />
              <span>Pulse Rate (bpm)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 76"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Danger band: &le; 40 or &ge; 131 bpm
            </span>
          </div>

          {/* Temperature */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2">
              <Thermometer size={16} className="text-amber-600" />
              <span>Temperature (°C or °F)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 37.0 or 98.6"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Fahrenheit values convert automatically
            </span>
          </div>

          {/* Respiratory Rate */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-2">
              <Wind size={16} className="text-teal-600" />
              <span>Respiratory Rate (/min)</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 18"
              value={respRate}
              onChange={(e) => setRespRate(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Adult normal: 12 - 20 /min
            </span>
          </div>
        </div>

        {/* Active Warning Preview */}
        {warnings.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-stone-300 hover:bg-stone-50 rounded-2xl text-stone-700 font-bold text-sm transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={validateAndSave}
            className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Save & Update Triage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
