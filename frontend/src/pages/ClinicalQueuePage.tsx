/* ==========================================================================
   MEDIQ — CLINICAL PRIORITY QUEUE & STAFF COMMAND HUB
   Acuity-sorted patient management (ESI Level 1-5), Staff Vitals & Overcrowding Analytics
   ========================================================================== */

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock,
  HeartPulse,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type {
  ClinicalVitals,
  ESILevel,
  PatientTriageRecord,
} from "../types/triage";
import StaffVitalsModal from "../components/StaffVitalsModal";
import TriageResultCard from "../components/TriageResultCard";
import {
  getPatientRegistrations,
  type PatientRegistration,
  updateRegistrationStatus,
} from "../lib/patientStorage";

export default function ClinicalQueuePage() {
  const [patients, setPatients] = useState<PatientRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("All");

  // Active modal targets
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<PatientRegistration | null>(null);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<PatientTriageRecord | null>(null);

  // Load existing records on mount
  const refreshPatients = () => {
    const list = getPatientRegistrations();
    if (list.length === 0) {
      // Seed initial clinical demonstration patients if empty
      const samplePatients: PatientRegistration[] = [
        {
          id: "demo-1",
          fullName: "Ramesh Naidu (62y)",
          age: "62",
          gender: "M",
          phone: "9848012345",
          department: "Emergency/Casualty",
          visitReason: "Heavy chest pain and sweating, started 40 mins ago",
          symptoms: "Chest pressure, ghabrahat, pain radiating to left shoulder",
          duration: "just_started",
          existingConditions: "Diabetes Mellitus, Hypertension",
          medications: "Metformin, Amlodipine",
          allergies: "None",
          status: "Waiting",
          priority: "Urgent",
          registeredAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        },
        {
          id: "demo-2",
          fullName: "Lakshmi Devi (27y)",
          age: "27",
          gender: "F",
          phone: "9848056789",
          department: "Emergency/Casualty",
          visitReason: "Pregnancy bleeding with severe abdominal cramps",
          symptoms: "Vaginal bleeding, acute lower pelvic pain, weakness",
          duration: "just_started",
          existingConditions: "28 Weeks Pregnant",
          medications: "Folic Acid, Iron",
          allergies: "Penicillin",
          status: "Waiting",
          priority: "Urgent",
          registeredAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        },
        {
          id: "demo-3",
          fullName: "Srinivas Rao (45y)",
          age: "45",
          gender: "M",
          phone: "9440011223",
          department: "Pulmonology/Chest & TB",
          visitReason: "Persistent cough with phlegm for 3 weeks",
          symptoms: "Chronic cough, evening fever, mild weight loss",
          duration: "several_days",
          existingConditions: "None",
          medications: "",
          allergies: "",
          status: "Waiting",
          priority: "Pending Review",
          registeredAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        },
        {
          id: "demo-4",
          fullName: "Ananya Reddy (7y)",
          age: "7",
          gender: "F",
          phone: "9123456780",
          department: "Paediatrics",
          visitReason: "High fever 39.2 C and vomiting since yesterday",
          symptoms: "High fever, loose motions, refusal to drink fluids",
          duration: "yesterday",
          existingConditions: "None",
          medications: "Paracetamol syrup",
          allergies: "",
          status: "Waiting",
          priority: "Pending Review",
          registeredAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
        },
        {
          id: "demo-5",
          fullName: "Venkata Raman (54y)",
          age: "54",
          gender: "M",
          phone: "9988776655",
          department: "Orthopaedics",
          visitReason: "Fell from scooter, suspected right ankle fracture",
          symptoms: "Severe right ankle swelling, unable to bear weight",
          duration: "just_started",
          existingConditions: "Hypertension",
          medications: "Telmisartan",
          allergies: "",
          status: "Waiting",
          priority: "Pending Review",
          registeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          id: "demo-6",
          fullName: "K. Satyanarayana (38y)",
          age: "38",
          gender: "M",
          phone: "9876543210",
          department: "General Medicine",
          visitReason: "Mild viral fever and body aches for two days",
          symptoms: "Mild fever, running nose, body pain, stable vitals",
          duration: "several_days",
          existingConditions: "None",
          medications: "",
          allergies: "",
          status: "In Consultation",
          priority: "Routine",
          registeredAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        },
      ];
      localStorage.setItem("mediq_demo_registrations", JSON.stringify(samplePatients));
      setPatients(samplePatients);
    } else {
      setPatients(list);
    }
  };

  useEffect(() => {
    refreshPatients();
  }, []);

  // Compute Clinical Urgency Level for Queue Sorting
  const getPatientAcuity = (patient: PatientRegistration): { level: ESILevel; label: string; badgeClass: string } => {
    const text = `${patient.visitReason} ${patient.symptoms}`.toLowerCase();
    
    // ESI Level 1 (Resuscitation)
    if (
      text.includes("unresponsive") ||
      text.includes("convulsion") ||
      text.includes("severe breathlessness") ||
      text.includes("spo2 < 85")
    ) {
      return {
        level: 1,
        label: "L1: Resuscitation",
        badgeClass: "bg-rose-600 text-white border-rose-700 animate-pulse",
      };
    }

    // ESI Level 2 (Emergent)
    if (
      patient.priority === "Urgent" ||
      patient.department === "Emergency/Casualty" ||
      text.includes("chest pain") ||
      text.includes("bleeding") ||
      text.includes("worst-ever") ||
      text.includes("stroke")
    ) {
      return {
        level: 2,
        label: "L2: Emergent",
        badgeClass: "bg-orange-600 text-white border-orange-700",
      };
    }

    // ESI Level 3 (Urgent)
    if (
      patient.department === "Paediatrics" ||
      text.includes("fracture") ||
      text.includes("high fever") ||
      text.includes("vomiting")
    ) {
      return {
        level: 3,
        label: "L3: Urgent",
        badgeClass: "bg-amber-500 text-white border-amber-600",
      };
    }

    // ESI Level 4 (Less urgent)
    if (patient.department === "Orthopaedics" || patient.department === "ENT" || patient.department === "Dental") {
      return {
        level: 4,
        label: "L4: Less Urgent",
        badgeClass: "bg-emerald-600 text-white border-emerald-700",
      };
    }

    // ESI Level 5 (Non-urgent / Routine)
    return {
      level: 5,
      label: "L5: Routine",
      badgeClass: "bg-slate-600 text-white border-slate-700",
    };
  };

  // Filter & Acuity-Sorted Queue (Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5)
  const sortedAndFilteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Search query filter
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const match =
            p.fullName.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.department.toLowerCase().includes(q) ||
            p.visitReason.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Department filter
        if (selectedDeptFilter !== "All" && p.department !== selectedDeptFilter) {
          return false;
        }

        // Level filter
        if (selectedLevelFilter !== "All") {
          const acuity = getPatientAcuity(p);
          if (String(acuity.level) !== selectedLevelFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Clinical priority sorting first (Level 1 before Level 5)
        const acuityA = getPatientAcuity(a).level;
        const acuityB = getPatientAcuity(b).level;
        if (acuityA !== acuityB) {
          return acuityA - acuityB;
        }
        // Then by wait time (earliest registered first)
        return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
      });
  }, [patients, searchQuery, selectedDeptFilter, selectedLevelFilter]);

  // Aggregate KPI Statistics
  const totalAssessed = patients.length;
  const waitingCount = patients.filter((p) => p.status === "Waiting").length;
  const highPriorityCount = patients.filter((p) => getPatientAcuity(p).level <= 2).length;
  const inConsultCount = patients.filter((p) => p.status === "In Consultation").length;

  // Department Workload Distribution Data for Recharts
  const departmentWorkloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p) => {
      counts[p.department] = (counts[p.department] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "..." : name,
      fullName: name,
      patients: count,
    }));
  }, [patients]);

  // Acuity Level Breakdown Data for Recharts
  const acuityDistributionData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    patients.forEach((p) => {
      const lvl = getPatientAcuity(p).level;
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return [
      { name: "L1: Resus", count: counts[1], fill: "#DC2626" },
      { name: "L2: Emergent", count: counts[2], fill: "#EA580C" },
      { name: "L3: Urgent", count: counts[3], fill: "#D97706" },
      { name: "L4: Semi-Urgent", count: counts[4], fill: "#16A34A" },
      { name: "L5: Routine", count: counts[5], fill: "#475569" },
    ];
  }, [patients]);

  const handleStatusChange = (id: string, newStatus: PatientRegistration["status"]) => {
    updateRegistrationStatus(id, newStatus);
    refreshPatients();
  };

  const handleOpenVitals = (patient: PatientRegistration) => {
    setSelectedPatientForVitals(patient);
  };

  const handleSaveVitals = (vitals: ClinicalVitals) => {
    if (!selectedPatientForVitals) return;
    // Update local record symptoms with vitals
    const vitalsStr = `Vitals: BP ${vitals.bpSystolic || '--'}/${vitals.bpDiastolic || '--'} mmHg, Pulse ${vitals.pulseBpm || '--'} bpm, SpO2 ${vitals.spo2Pct || '--'}%`;
    const updated = patients.map((p) => {
      if (p.id === selectedPatientForVitals.id) {
        return {
          ...p,
          symptoms: `${p.symptoms} | ${vitalsStr}`,
          priority: (vitals.spo2Pct && vitals.spo2Pct < 92) || (vitals.bpSystolic && vitals.bpSystolic <= 90) ? ("Urgent" as const) : p.priority,
        };
      }
      return p;
    });
    localStorage.setItem("mediq_demo_registrations", JSON.stringify(updated));
    setPatients(updated);
  };

  const handleViewAssessmentDetail = (patient: PatientRegistration) => {
    const acuity = getPatientAcuity(patient);
    const mockRecord: PatientTriageRecord = {
      id: patient.id,
      token: patient.id.startsWith("MEDIQ-") ? patient.id : `MEDIQ-${patient.id.slice(0, 4)}`,
      demographics: {
        fullName: patient.fullName,
        ageYears: parseInt(patient.age) || 35,
        gender: (patient.gender as "M" | "F") || "M",
        isPregnant: patient.existingConditions.includes("Pregnant"),
        arrivalMode: "Walk-in",
      },
      selectedRegion: "chest",
      selectedSymptoms: [
        {
          id: "symp-1",
          regionId: "chest",
          label: { en: patient.visitReason, te: patient.visitReason, hi: patient.visitReason },
          iconName: "Activity",
          isRedFlag: acuity.level <= 2,
          redFlagCode: acuity.level <= 2 ? "RF_CARDIO_RESP" : undefined,
          typicalDepartment: patient.department,
          clinicalPrompt: patient.visitReason,
        },
      ],
      questionnaire: {
        duration: "just_started",
        severity: acuity.level <= 2 ? "unbearable" : "moderate",
        isGettingWorse: acuity.level <= 2,
        hasOccurredBefore: false,
      },
      aiEvaluation: {
        triageLevel: acuity.level <= 2 ? "ABSTAIN" : acuity.level,
        suggestedTriageLevel: acuity.level,
        department: patient.department,
        confidence: 0.89,
        emergencyProbability: acuity.level <= 2 ? 0.92 : 0.08,
        reviewStatus: acuity.level <= 2 ? "URGENT_CLINICIAN_REVIEW" : "STANDARD_CLINICIAN_CONFIRMATION",
        safetyReasons: acuity.level <= 2 ? ["Clinical Red Flag Identified", "Target Consultation Time ≤ 15 min"] : [],
        isEmergencyEscalated: acuity.level <= 2,
        timestamp: patient.registeredAt,
        source: "MEDIQ_ML_BACKEND",
      },
      status: patient.status,
      createdAt: patient.registeredAt,
      languageUsed: "en",
    };
    setSelectedPatientForDetail(mockRecord);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-stone-900 flex flex-col font-sans select-none">
      {/* Top Clinical Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/20">
            <Stethoscope size={22} className="text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-emerald-950">
                MEDIQ Staff Hub
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Clinical Priority Queue
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Chandrapuri District Hospital • OPD Command Centre
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshPatients}
            title="Refresh patient queue"
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={15} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Switch to Patient Mode Kiosk */}
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-900/20 transition active:scale-95"
          >
            <PlusCircle size={16} />
            <span>Open Patient Touch Kiosk</span>
          </Link>
        </div>
      </header>

      {/* Main Clinical Hub Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
                Total Assessed Today
              </div>
              <div className="text-2xl font-black text-stone-900 mt-0.5">
                {totalAssessed}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
                Awaiting Clinician
              </div>
              <div className="text-2xl font-black text-amber-900 mt-0.5">
                {waitingCount}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
                High Priority (L1/L2)
              </div>
              <div className="text-2xl font-black text-rose-700 mt-0.5">
                {highPriorityCount}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-teal-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">
                In Active Consult
              </div>
              <div className="text-2xl font-black text-teal-900 mt-0.5">
                {inConsultCount}
              </div>
            </div>
          </div>
        </div>

        {/* Overcrowding Analytics Charts (Recharts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Workload Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  OPD Overcrowding Analytics
                </span>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Department Workload Distribution
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">Real-time OPD Intake</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #CBD5E1",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar dataKey="patients" fill="#0F382A" radius={[8, 8, 0, 0]}>
                    {departmentWorkloadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fullName.includes("Emergency") ? "#DC2626" : "#0F382A"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acuity Distribution Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Clinical Acuity
              </span>
              <h3 className="font-extrabold text-stone-900 text-lg mb-2">
                ESI Urgency Breakdown
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Prioritizes clinical urgency over arrival order (ESI Levels 1–5).
              </p>
            </div>

            <div className="space-y-2.5">
              {acuityDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.fill }} />
                    <span className="text-stone-700">{item.name}</span>
                  </div>
                  <span className="font-mono bg-stone-100 px-2 py-0.5 rounded-md text-stone-900">
                    {item.count} patients
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 text-xs text-stone-500 text-center">
              Target Time: L1 (Immediate) • L2 (≤15m) • L3 (≤60m)
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="py-2 px-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Emergency/Casualty">Emergency/Casualty</option>
              <option value="Cardiology">Cardiology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Paediatrics">Paediatrics</option>
              <option value="Pulmonology/Chest & TB">Pulmonology</option>
              <option value="Orthopaedics">Orthopaedics</option>
              <option value="General Surgery">General Surgery</option>
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="py-2 px-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">All Urgency Levels</option>
              <option value="1">Level 1 (Resuscitation)</option>
              <option value="2">Level 2 (Emergent)</option>
              <option value="3">Level 3 (Urgent)</option>
              <option value="4">Level 4 (Semi-urgent)</option>
              <option value="5">Level 5 (Routine)</option>
            </select>
          </div>
        </div>

        {/* CLINICAL PRIORITY QUEUE PATIENT CARDS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-extrabold text-stone-900 text-lg flex items-center gap-2">
              <span>Patient Queue</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {sortedAndFilteredPatients.length} Active Cases
              </span>
            </h3>
            <span className="text-xs text-stone-500 font-semibold">
              Prioritized by ESI Clinical Acuity (Level 1 → 5)
            </span>
          </div>

          {sortedAndFilteredPatients.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 text-stone-500 space-y-2">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
              <div className="font-bold text-base text-stone-900">Queue is Clear</div>
              <p className="text-xs">No pending patients match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {sortedAndFilteredPatients.map((patient) => {
                const acuity = getPatientAcuity(patient);
                const waitMinutes = Math.floor(
                  (Date.now() - new Date(patient.registeredAt).getTime()) / 60000
                );

                return (
                  <div
                    key={patient.id}
                    className={`bg-white rounded-3xl p-5 border-2 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      acuity.level === 1
                        ? "border-rose-500 bg-rose-50/20 shadow-rose-200/50"
                        : acuity.level === 2
                        ? "border-orange-400 bg-orange-50/15"
                        : "border-stone-200 hover:border-emerald-300"
                    }`}
                  >
                    {/* Patient Info Column */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Acuity Level Badge */}
                      <div
                        className={`px-3 py-2 rounded-2xl border text-xs font-black text-center shrink-0 shadow-xs ${acuity.badgeClass}`}
                      >
                        {acuity.label}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-stone-900 text-base">
                            {patient.fullName}
                          </h4>
                          <span className="font-mono text-xs text-stone-500 font-bold bg-stone-100 px-2 py-0.5 rounded-md border">
                            {patient.id}
                          </span>
                          <span className="text-xs text-emerald-900 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <Building2 size={12} />
                            {patient.department}
                          </span>
                        </div>

                        <p className="text-xs text-stone-700 font-medium line-clamp-1">
                          <strong className="text-stone-900">Complaint:</strong> {patient.visitReason}
                        </p>

                        <div className="text-[11px] text-stone-500 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Waiting:{" "}
                            <strong className={waitMinutes > 30 ? "text-rose-600 font-bold" : "text-stone-700"}>
                              {waitMinutes} mins
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Registered: {new Date(patient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {patient.existingConditions && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-semibold">
                                History: {patient.existingConditions}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Actions Column */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                      {/* Record Vitals Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenVitals(patient)}
                        className="px-3 py-2 bg-stone-100 hover:bg-emerald-50 text-emerald-900 border border-stone-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <HeartPulse size={14} className="text-emerald-700" />
                        <span>Vitals</span>
                      </button>

                      {/* View AI Assessment Detail */}
                      <button
                        type="button"
                        onClick={() => handleViewAssessmentDetail(patient)}
                        className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <BrainCircuit size={14} className="text-stone-600" />
                        <span>Review AI</span>
                      </button>

                      {/* Status Dropdown */}
                      <select
                        value={patient.status}
                        onChange={(e) =>
                          handleStatusChange(
                            patient.id,
                            e.target.value as PatientRegistration["status"]
                          )
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                          patient.status === "In Consultation"
                            ? "bg-teal-50 border-teal-500 text-teal-900"
                            : patient.status === "Completed"
                            ? "bg-stone-100 border-stone-300 text-stone-500"
                            : "bg-emerald-700 text-white border-emerald-700"
                        }`}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="In Consultation">In Consultation</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* STAFF VITALS MODAL */}
      {selectedPatientForVitals && (
        <StaffVitalsModal
          isOpen={Boolean(selectedPatientForVitals)}
          onClose={() => setSelectedPatientForVitals(null)}
          onSave={handleSaveVitals}
          patientName={selectedPatientForVitals.fullName}
          patientToken={selectedPatientForVitals.id}
        />
      )}

      {/* AI ASSESSMENT DETAIL MODAL */}
      {selectedPatientForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-stone-900 text-lg">
                Clinical AI Assessment Summary
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPatientForDetail(null)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <TriageResultCard
              record={selectedPatientForDetail}
              onConfirm={(lvl) => {
                setSelectedPatientForDetail((prev) =>
                  prev
                    ? {
                        ...prev,
                        clinicianReview: {
                          isConfirmed: true,
                          isOverridden: false,
                          confirmedLevel: lvl,
                          reviewedAt: new Date().toISOString(),
                          reviewedBy: "Dr. On Duty",
                        },
                      }
                    : null
                );
              }}
              onOverride={(lvl, reason) => {
                setSelectedPatientForDetail((prev) =>
                  prev
                    ? {
                        ...prev,
                        clinicianReview: {
                          isConfirmed: false,
                          isOverridden: true,
                          confirmedLevel: lvl,
                          overrideReason: reason,
                          reviewedAt: new Date().toISOString(),
                          reviewedBy: "Dr. On Duty",
                        },
                      }
                    : null
                );
              }}
              language="en"
              isStaffMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
