import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, CheckCircle2, HeartPulse, LogOut, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getMEDIQPrediction, type MEDIQPrediction } from "../lib/mediqAI";
import { saveMEDIQPrediction } from "../lib/mediqAIStorage";
import "../PatientDashboard.css";
import "../NurseDashboard.css";

type Priority = "Pending Review" | "Routine" | "Urgent";
type VitalKey = "systolicBP" | "diastolicBP" | "pulseRate" | "temperatureC" | "spo2";
type Vitals = Record<VitalKey, string>;
type Row = Record<string, unknown>;
type Assessment = {
  id: string; patient_registration_id: string; decision: string;
  recommended_department: string | null; red_flags: unknown[];
  triggered_rules: unknown[]; validation_issues: unknown[];
  engine_version: string; assessed_at: string;
};
type Patient = {
  id: string; fullName: string; age: string; gender: string; phone: string;
  department: string; queueToken: string; visitReason: string; symptoms: string;
  duration: string; complaintLanguage: string; existingConditions: string;
  medications: string; allergies: string; registeredAt: string;
  priority: Priority; status: string; vitalsReviewRequired: boolean;
  systolicBP: number | null; diastolicBP: number | null;
  pulseRate: number | null; temperatureC: number | null; spo2: number | null;
};
const purple = "#7c3aed";
const card: CSSProperties = { background: "#fff", padding: 20, borderRadius: 14, border: "1px solid #e9d5ff", marginBottom: 16 };
const btn: CSSProperties = { background: purple, color: "#fff", border: 0, borderRadius: 9, padding: "10px 15px", cursor: "pointer", fontWeight: 600 };
const input: CSSProperties = { padding: 10, borderRadius: 8, border: "1px solid #c4b5fd", width: "100%", boxSizing: "border-box" };
const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14 };
const vitals: { key: VitalKey; column: string; label: string; min: number; max: number }[] = [
  { key: "systolicBP", column: "systolic_bp", label: "Systolic BP (mmHg)", min: 30, max: 300 },
  { key: "diastolicBP", column: "diastolic_bp", label: "Diastolic BP (mmHg)", min: 10, max: 200 },
  { key: "pulseRate", column: "pulse_rate", label: "Pulse Rate (bpm)", min: 20, max: 300 },
  { key: "temperatureC", column: "temperature_c", label: "Temperature (°C)", min: 25, max: 45 },
  { key: "spo2", column: "spo2", label: "SpO₂ (%)", min: 1, max: 100 },
];

const text = (v: unknown) => v == null ? "" : String(v);
const num = (v: unknown): number | null => v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
const dateText = (v: string) => v && !Number.isNaN(Date.parse(v)) ? new Date(v).toLocaleString("en-IN") : "Not recorded";
const listText = (v: unknown) => typeof v === "string" ? v : JSON.stringify(v);

function fromRow(r: Row): Patient {
  return {
    id: text(r.id), fullName: text(r.full_name) || "Unnamed Patient", age: text(r.age), gender: text(r.gender),
    phone: text(r.phone), department: text(r.department), queueToken: text(r.queue_token) || "Not assigned",
    visitReason: text(r.visit_reason), symptoms: text(r.symptoms), duration: text(r.duration),
    complaintLanguage: text(r.complaint_language), existingConditions: text(r.existing_conditions),
    medications: text(r.medications), allergies: text(r.allergies), registeredAt: text(r.registered_at),
    priority: r.priority === "Routine" || r.priority === "Urgent" ? r.priority : "Pending Review",
    status: text(r.status) || "Waiting", vitalsReviewRequired: r.vitals_review_required === true,
    systolicBP: num(r.systolic_bp), diastolicBP: num(r.diastolic_bp), pulseRate: num(r.pulse_rate),
    temperatureC: num(r.temperature_c), spo2: num(r.spo2),
  };
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return <div><div style={{ color: "#64748b", fontSize: 12 }}>{label}</div><strong style={{ overflowWrap: "anywhere" }}>{value == null || value === "" ? "Not provided" : text(value)}</strong></div>;
}

function Warning({ children }: { children: React.ReactNode }) {
  return <div role="alert" style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: 13, borderRadius: 10, margin: "12px 0" }}>{children}</div>;
}

function Items({ title, items }: { title: string; items?: unknown[] | null }) {
  return <div style={{ marginTop: 12 }}><strong>{title}</strong>{items?.length ? <ul>{items.map((item, i) => <li key={i}>{listText(item)}</li>)}</ul> : <p style={{ color: "#64748b" }}>None recorded.</p>}</div>;
}

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("Nurse");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Vitals>({ systolicBP: "", diastolicBP: "", pulseRate: "", temperatureC: "", spo2: "" });
  const [dirty, setDirty] = useState(false);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentError, setAssessmentError] = useState("");
  const [prediction, setPrediction] = useState<MEDIQPrediction | null>(null);
  const [synthetic, setSynthetic] = useState(false);
  const [priority, setPriority] = useState<Priority>("Pending Review");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState("");
  const [modalError, setModalError] = useState("");
  const selected = patients.find(p => p.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Please sign in with a nurse account.");
      const { data: profile, error: profileError } = await supabase.from("user_profiles").select("full_name, role").eq("id", auth.user.id).single();
      if (profileError || profile?.role !== "nurse") throw new Error("Nurse access required.");
      setName(profile.full_name || "Nurse");
      const rows: Row[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: fetchError } = await supabase.from("patient_registrations").select("*").order("registered_at", { ascending: false }).range(offset, offset + 499);
        if (fetchError) throw fetchError;
        const page = (data ?? []) as Row[];
        rows.push(...page);
        if (page.length < 500) break;
      }
      setPatients(rows.map(fromRow)); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load patients."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000); return () => window.clearInterval(timer); }, [refresh]);

  async function fetchAssessment(id: string) {
    setAssessment(null); setAssessmentError("");
    const { data, error: e } = await supabase.from("triage_assessments")
      .select("id,patient_registration_id,decision,recommended_department,red_flags,triggered_rules,validation_issues,engine_version,assessed_at")
      .eq("patient_registration_id", id).order("assessed_at", { ascending: false }).limit(1).maybeSingle();
    if (e) { setAssessmentError(e.message); return; }
    setAssessment((data as Assessment | null) ?? null);
  }

  function open(patient: Patient) {
    setSelectedId(patient.id); setDraft({ systolicBP: text(patient.systolicBP), diastolicBP: text(patient.diastolicBP), pulseRate: text(patient.pulseRate), temperatureC: text(patient.temperatureC), spo2: text(patient.spo2) });
    setPriority(patient.priority); setDirty(false); setNeedsAssessment(false); setPrediction(null); setSynthetic(false); setAcknowledged(false); setModalError(""); setAssessment(null);
    void fetchAssessment(patient.id);
  }

  function close() { if (busy) return; setSelectedId(null); setPrediction(null); setAssessment(null); setModalError(""); }

  async function saveVitals() {
    if (!selected || busy) return;
    setBusy("vitals"); setModalError("");
    try {
      const values: Record<string, number | null> = {};
      const raw: Record<string, string> = {};
      const missing: string[] = [];
      for (const field of vitals) {
        const s = draft[field.key].trim(); raw[field.column] = s;
        if (!s) { values[field.column] = null; missing.push(field.label); continue; }
        const n = Number(s);
        if (!Number.isFinite(n) || n < field.min || n > field.max) throw new Error(`Check ${field.label}: invalid measurement.`);
        values[field.column] = n;
      }
      if (values.systolic_bp !== null && values.diastolic_bp !== null && values.systolic_bp <= values.diastolic_bp) throw new Error("Systolic BP must exceed diastolic BP.");
      const { data, error: e } = await supabase.from("patient_registrations").update({ ...values, raw_vitals: raw, vitals_review_required: missing.length > 0, vitals_review_reason: missing.length ? `Missing: ${missing.join(", ")}. Clinical review required.` : "Measurements recorded; clinical review required." }).eq("id", selected.id).select("id");
      if (e) throw e;
      if (!data?.length) throw new Error("No record updated. Check nurse UPDATE permissions.");
      setPatients(old => old.map(p => p.id !== selected.id ? p : { ...p, systolicBP: values.systolic_bp, diastolicBP: values.diastolic_bp, pulseRate: values.pulse_rate, temperatureC: values.temperature_c, spo2: values.spo2, vitalsReviewRequired: missing.length > 0 }));
      setDirty(false); setNeedsAssessment(true); setAssessment(null); setPrediction(null); setAcknowledged(false);
      setNotice("Vitals saved. Run a new server assessment.");
    } catch (e) { setModalError(e instanceof Error ? e.message : "Could not save vitals."); }
    finally { setBusy(""); }
  }

  async function runAssessment() {
    if (!selected || busy || dirty) return;
    setBusy("assessment"); setAssessmentError(""); setAssessment(null);
    try {
      const started = Date.now();
      const { data, error: e } = await supabase.functions.invoke("record-triage-assessment", { body: { patient_registration_id: selected.id } });
      if (e) throw e;
      if (data?.error) throw new Error(String(data.error));
      const { data: latest, error: lookupError } = await supabase.from("triage_assessments")
        .select("id,patient_registration_id,decision,recommended_department,red_flags,triggered_rules,validation_issues,engine_version,assessed_at")
        .eq("patient_registration_id", selected.id).order("assessed_at", { ascending: false }).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      if (!latest || !latest.assessed_at || Date.parse(latest.assessed_at) < started - 10000) throw new Error("No fresh assessment was saved. Please check the server function.");
      setAssessment(latest as Assessment); setNeedsAssessment(false); setAcknowledged(false); setPrediction(null);
      setNotice("New server assessment saved.");
    } catch (e) { setAssessmentError(e instanceof Error ? e.message : "Assessment failed."); }
    finally { setBusy(""); }
  }

  async function runAI() {
    if (!selected || busy) return;
    if (!synthetic) { setModalError("Confirm this is a synthetic demo record."); return; }
    if (dirty || needsAssessment || !assessment) { setModalError("Save vitals and run a fresh server assessment first."); return; }
    const age = Number(selected.age);
    if (!selected.age.trim() || !Number.isInteger(age) || age < 0 || age > 120) { setModalError("Valid patient age required."); return; }
    const complaint = [selected.visitReason, selected.symptoms].filter(Boolean).join(". ");
    if (!complaint) { setModalError("Symptoms or visit reason required."); return; }
    setBusy("ai"); setModalError(""); setPrediction(null);
    try {
      const result = await getMEDIQPrediction({
        age_years: age, age_months: null, sex: selected.gender, pregnant: null, arrival_mode: "Walk-in",
        bp_systolic: selected.systolicBP, bp_diastolic: selected.diastolicBP, pulse_bpm: selected.pulseRate,
        temp_c: selected.temperatureC, spo2_pct: selected.spo2, chief_complaint: complaint,
        known_conditions: selected.existingConditions, current_medications: selected.medications,
      });
      await saveMEDIQPrediction(selected.id, result);
      setPrediction(result);
    } catch (e) { setModalError(e instanceof Error ? e.message : "AI request failed."); }
    finally { setBusy(""); }
  }

  async function saveReview() {
    if (!selected || busy) return;
    setModalError("");
    if (priority === "Pending Review") { setModalError("Choose Routine or Urgent."); return; }
    if (dirty || needsAssessment || !assessment || assessment.patient_registration_id !== selected.id) { setModalError("A fresh server assessment is required."); return; }
    if (priority === "Routine" && (assessment.decision === "ESCALATE_NOW" || assessment.decision === "CANNOT_ASSESS")) { setModalError("Routine is blocked by server safety assessment."); return; }
    if (priority === "Routine" && (selected.vitalsReviewRequired || vitals.some(f => selected[f.key] === null))) { setModalError("Routine is blocked with incomplete vitals."); return; }
    if (priority === "Routine" && prediction?.review_status === "URGENT_CLINICIAN_REVIEW") { setModalError("AI flagged urgent clinician review."); return; }
    if (priority === "Routine" && (assessment.validation_issues?.length ?? 0) > 0 && !acknowledged) { setModalError("Acknowledge validation issues first."); return; }
    setBusy("review");
    try {
      const { error: e } = await supabase.rpc("save_nurse_review", { p_patient_registration_id: selected.id, p_selected_priority: priority, p_verification_acknowledged: acknowledged });
      if (e) throw e;
      setNotice(`Review saved for ${selected.fullName}.`); closeAfterSave(); await refresh();
    } catch (e) { setModalError(e instanceof Error ? e.message : "Review failed."); }
    finally { setBusy(""); }
  }

  function closeAfterSave() { setSelectedId(null); setAssessment(null); setPrediction(null); }

  async function logout() { const { error: e } = await supabase.auth.signOut(); if (e) setError(e.message); else navigate("/login"); }

  const visible = patients.filter(p => (statusFilter === "All" || p.status === statusFilter) && [p.fullName, p.id, p.queueToken, p.department, p.phone].some(s => s.toLowerCase().includes(query.toLowerCase())));
  const incomplete = (p: Patient) => p.vitalsReviewRequired || vitals.some(f => p[f.key] === null);

  return <div className="nurse-dashboard" style={{ background: "#f8f7ff", minHeight: "100vh", color: "#312e81" }}>
    <header style={{ background: "white", padding: 20, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <h2 style={{ margin: 0 }}><HeartPulse size={24} style={{ verticalAlign: "middle", marginRight: 8 }} />MEDIQCare · Nurse Dashboard</h2>
      <div>Welcome, <strong>{name}</strong> <button type="button" style={{ ...btn, marginLeft: 12 }} onClick={() => void refresh()}><RefreshCw size={14} /> Refresh</button> <button type="button" style={btn} onClick={() => void logout()}><LogOut size={14} /> Logout</button></div>
    </header>
    <main style={{ maxWidth: 1400, padding: 24, margin: "auto" }}>
      <h1>Nurse Dashboard</h1><p>Review registrations, record measured vitals, and complete clinical safety review.</p>
      {error && <Warning>{error}</Warning>}{notice && <div role="status" style={card}>{notice}</div>}
      <div style={grid}>{[
        { label: "Total Patients", n: patients.length, icon: <Users /> },
        { label: "Waiting", n: patients.filter(p => p.status === "Waiting").length, icon: <Activity /> },
        { label: "Pending Review", n: patients.filter(p => p.priority === "Pending Review").length, icon: <ShieldCheck /> },
        { label: "Urgent", n: patients.filter(p => p.priority === "Urgent").length, icon: <AlertTriangle /> },
        { label: "Incomplete Vitals", n: patients.filter(incomplete).length, icon: <HeartPulse /> },
      ].map(s => <div key={s.label} style={card}><div style={{ display: "flex", justifyContent: "space-between" }}>{s.icon}<span>{s.label}</span></div><h2>{s.n}</h2></div>)}</div>
      <section style={card}><div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", marginBottom: 18 }}><h2>Patient Registrations</h2><div style={{ display: "flex", gap: 10 }}><label><Search size={14} /> <input style={{ ...input, width: 230 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search patients" /></label><select style={{ ...input, width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Waiting</option><option>In Consultation</option><option>Completed</option></select></div></div>
        {loading ? <p>Loading patients...</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}><thead><tr>{["Patient", "Age / Gender", "Department", "Vitals", "Priority", "Status", "Action"].map(s => <th key={s} style={{ padding: 12, textAlign: "left", background: "#f5f3ff" }}>{s}</th>)}</tr></thead><tbody>{visible.map(p => <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: 12 }}><strong>{p.fullName}</strong><div style={{ fontSize: 12 }}>{p.id}</div><small>{p.queueToken}</small></td><td>{p.age} / {p.gender}</td><td>{p.department || "Not assigned"}</td><td>{incomplete(p) ? "Incomplete" : "Recorded"}</td><td>{p.priority}</td><td>{p.status}</td><td><button type="button" style={btn} onClick={() => open(p)} disabled={p.status === "Completed"}>Review</button></td></tr>)}</tbody></table>{visible.length === 0 && <p>No matching patients.</p>}</div>}
      </section>
      <p style={{ fontSize: 12, color: "#64748b" }}>Demonstration system only. Predictions are not clinical diagnoses or validated decision support.</p>
    </main>
    {selected && <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0f172acc", overflowY: "auto", padding: "24px 12px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}><div role="dialog" aria-modal="true" aria-label="Patient triage review" style={{ background: "white", width: "100%", maxWidth: 980, padding: 24, borderRadius: 16, margin: "auto 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2>Patient Triage Review</h2><p>{selected.fullName} · {selected.id}</p></div><button type="button" style={btn} onClick={close} disabled={!!busy}><X size={18} /></button></div>
      <section style={card}><h3>Patient Information</h3><div style={grid}><Detail label="Full Name" value={selected.fullName} /><Detail label="Age" value={selected.age} /><Detail label="Gender" value={selected.gender} /><Detail label="Phone" value={selected.phone} /><Detail label="Department" value={selected.department} /><Detail label="Queue Token" value={selected.queueToken} /><Detail label="Registered" value={dateText(selected.registeredAt)} /><Detail label="Status" value={selected.status} /></div></section>
      <section style={card}><h3>Symptoms & Visit Details</h3><div style={grid}><Detail label="Visit Reason" value={selected.visitReason} /><Detail label="Symptoms" value={selected.symptoms} /><Detail label="Duration" value={selected.duration} /><Detail label="Complaint Language" value={selected.complaintLanguage} /></div></section>
      <section style={card}><h3><HeartPulse size={18} /> Nurse Vital Signs Assessment</h3><p>Enter measured values only. Leave unavailable measurements blank; they are stored as NULL.</p><div style={grid}>{vitals.map(f => <label key={f.key}>{f.label}<input style={input} type="number" step="any" min={f.min} max={f.max} placeholder="Not measured" value={draft[f.key]} onChange={e => { setDraft(d => ({ ...d, [f.key]: e.target.value })); setDirty(true); setNeedsAssessment(true); setAssessment(null); setPrediction(null); }} disabled={!!busy} /></label>)}</div><div style={{ textAlign: "right", marginTop: 15 }}><button type="button" style={btn} disabled={!!busy} onClick={() => void saveVitals()}>{busy === "vitals" ? "Saving..." : "Save Vital Signs"}</button></div></section>
      <section style={card}><h3><ShieldCheck size={18} /> Server Safety Assessment</h3><p>Save changed measurements, then run a fresh server assessment.</p><button type="button" style={btn} disabled={!!busy || dirty} onClick={() => void runAssessment()}>{busy === "assessment" ? "Assessing..." : "Run Server Assessment"}</button>{needsAssessment && <Warning>Measurements changed. Save them and run a new assessment.</Warning>}{assessmentError && <Warning>{assessmentError}</Warning>}{assessment && !needsAssessment && <div style={{ marginTop: 16 }}><div style={grid}><Detail label="Server Decision" value={assessment.decision} /><Detail label="Recommended Department" value={assessment.recommended_department} /><Detail label="Engine Version" value={assessment.engine_version} /><Detail label="Assessment Time" value={dateText(assessment.assessed_at)} /></div>{assessment.decision === "ESCALATE_NOW" && <Warning>Immediate qualified clinical escalation required. Do not delay emergency care.</Warning>}{assessment.decision === "CANNOT_ASSESS" && <Warning>Cannot safely assess. Qualified clinical review is required.</Warning>}<Items title="Red Flags" items={assessment.red_flags} /><Items title="Triggered Rules" items={assessment.triggered_rules} /><Items title="Validation Issues" items={assessment.validation_issues} /></div>}</section>
      <section style={card}><h3>MEDIQ AI — Five-Level Triage</h3><div style={grid}>{["Immediate", "Emergent", "Urgent", "Less Urgent", "Non-Urgent"].map((s, i) => <div key={s} style={{ padding: 12, background: "#f5f3ff", borderRadius: 8, textAlign: "center" }}><strong>Level {i + 1}</strong><div>{s}</div></div>)}</div><p style={{ fontSize: 12 }}>Confirm that your trained model uses this level mapping before relying on labels.</p><label style={{ display: "flex", gap: 8, margin: "15px 0" }}><input type="checkbox" checked={synthetic} onChange={e => setSynthetic(e.target.checked)} /> I confirm this is a synthetic demonstration record, not a real clinical case.</label><button type="button" style={btn} disabled={!!busy || !synthetic || dirty || needsAssessment || !assessment} onClick={() => void runAI()}>{busy === "ai" ? "Running MEDIQ AI..." : "Run MEDIQ AI"}</button>{prediction && <div style={{ ...card, marginTop: 16 }}><h3>AI Prediction Results</h3>{prediction.review_status === "URGENT_CLINICIAN_REVIEW" && <Warning>Urgent clinician review required. Do not downgrade based on AI output.</Warning>}<div style={grid}><Detail label="Predicted Level" value={prediction.triage_level} /><Detail label="Suggested Level" value={prediction.suggested_triage_level} /><Detail label="Department" value={prediction.department} /><Detail label="Confidence" value={Number.isFinite(prediction.confidence) ? `${(prediction.confidence * 100).toFixed(2)}%` : "Not available"} /><Detail label="Emergency Probability" value={Number.isFinite(prediction.emergency_probability) ? `${(prediction.emergency_probability * 100).toFixed(2)}%` : "Not available"} /><Detail label="Review Status" value={prediction.review_status} /></div><Items title="Safety Reasons" items={prediction.safety_reasons} /><p style={{ fontSize: 12 }}>AI output is advisory and not validated clinical certainty.</p></div>}</section>
      <section style={card}><h3>Medical History</h3><div style={grid}><Detail label="Existing Conditions" value={selected.existingConditions} /><Detail label="Medications" value={selected.medications} /><Detail label="Allergies" value={selected.allergies} /></div></section>
      <section style={card}><h3>Final Nurse Review</h3><p>Save nurse-reviewed priority. This does not automatically assign a doctor's queue token.</p><div style={{ display: "flex", gap: 20 }}>{(["Routine", "Urgent"] as const).map(p => <label key={p}><input type="radio" name="priority" checked={priority === p} onChange={() => setPriority(p)} /> {p}</label>)}</div><label style={{ display: "flex", gap: 10, marginTop: 16 }}><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} /> I reviewed measurements, missing data, and server safety warnings.</label>{incomplete(selected) && <Warning>Vitals are incomplete. Routine priority is blocked in this demo workflow.</Warning>}{modalError && <Warning>{modalError}</Warning>}<div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}><button type="button" style={{ ...btn, background: "#ede9fe", color: "#5b21b6" }} onClick={close} disabled={!!busy}>Cancel</button><button type="button" style={btn} disabled={!!busy || dirty || needsAssessment || !assessment || priority === "Pending Review"} onClick={() => void saveReview()}><CheckCircle2 size={15} /> {busy === "review" ? "Saving..." : "Done Reviewing"}</button></div></section>
    </div></div>}
  </div>;
}