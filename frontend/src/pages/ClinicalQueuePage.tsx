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
        badgeClass: "bg-[#D96B83] text-white border-[#B24860] animate-pulse",
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
        badgeClass: "bg-[#F07868] text-white border-[#D65948]",
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
        badgeClass: "bg-[#E8AC48] text-white border-[#C98E2A]",
      };
    }

    // ESI Level 4 (Less urgent)
    if (patient.department === "Orthopaedics" || patient.department === "ENT" || patient.department === "Dental") {
      return {
        level: 4,
        label: "L4: Less Urgent",
        badgeClass: "bg-[#269C91] text-white border-[#1E7E75]",
      };
    }

    // ESI Level 5 (Non-urgent / Routine)
    return {
      level: 5,
      label: "L5: Routine",
      badgeClass: "bg-[#69A9DC] text-white border-[#4D8FBF]",
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
      { name: "L1: Resus", count: counts[1], fill: "#D96B83" },
      { name: "L2: Emergent", count: counts[2], fill: "#F07868" },
      { name: "L3: Urgent", count: counts[3], fill: "#E8AC48" },
      { name: "L4: Semi-Urgent", count: counts[4], fill: "#269C91" },
      { name: "L5: Routine", count: counts[5], fill: "#69A9DC" },
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
    <div className="min-h-screen bg-[#F7F4EF] text-[#34434A] flex flex-col font-sans select-none">
      {/* Top Clinical Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8] shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#269C91] text-white flex items-center justify-center shadow-md shadow-[#269C91]/25">
            <Stethoscope size={22} className="text-[#E8F5F3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#34434A]">
                MEDIQ Staff Hub
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#E8F5F3] text-[#269C91] px-2.5 py-0.5 rounded-full border border-[#269C91]/30">
                Clinical Priority Queue
              </span>
            </div>
            <p className="text-xs text-[#5C6E78] font-medium">
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
            className="p-2.5 bg-[#F7F4EF] hover:bg-[#EAE6DD] text-[#34434A] border border-[#E5E1D8] rounded-2xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={15} className="text-[#269C91]" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Switch to Patient Mode Kiosk */}
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#269C91] hover:bg-[#1E7E75] text-white rounded-2xl text-xs font-black shadow-md shadow-[#269C91]/25 transition active:scale-95 cursor-pointer"
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
          <div className="bg-white p-5 rounded-3xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F3] text-[#269C91] flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#5C6E78] uppercase tracking-wider">
                Total Assessed Today
              </div>
              <div className="text-2xl font-black text-[#34434A] mt-0.5">
                {totalAssessed}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF9EE] text-[#E8AC48] flex items-center justify-center font-bold">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#5C6E78] uppercase tracking-wider">
                Awaiting Clinician
              </div>
              <div className="text-2xl font-black text-[#34434A] mt-0.5">
                {waitingCount}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F4] text-[#D96B83] flex items-center justify-center font-bold">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#5C6E78] uppercase tracking-wider">
                High Priority (L1/L2)
              </div>
              <div className="text-2xl font-black text-[#D96B83] mt-0.5">
                {highPriorityCount}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E5E1D8] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FC] text-[#69A9DC] flex items-center justify-center font-bold">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#5C6E78] uppercase tracking-wider">
                In Active Consult
              </div>
              <div className="text-2xl font-black text-[#34434A] mt-0.5">
                {inConsultCount}
              </div>
            </div>
          </div>
        </div>

        {/* Overcrowding Analytics Charts (Recharts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Workload Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E5E1D8] shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-[#269C91] uppercase tracking-wider">
                  OPD Overcrowding Analytics
                </span>
                <h3 className="font-extrabold text-[#34434A] text-lg">
                  Department Workload Distribution
                </h3>
              </div>
              <span className="text-xs text-[#5C6E78] font-medium">Real-time OPD Intake</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#5C6E78" }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#5C6E78" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid #E5E1D8",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#34434A",
                    }}
                  />
                  <Bar dataKey="patients" fill="#269C91" radius={[8, 8, 0, 0]}>
                    {departmentWorkloadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fullName.includes("Emergency") ? "#D96B83" : "#269C91"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acuity Distribution Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E1D8] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#269C91] uppercase tracking-wider">
                Clinical Acuity
              </span>
              <h3 className="font-extrabold text-[#34434A] text-lg mb-2">
                ESI Urgency Breakdown
              </h3>
              <p className="text-xs text-[#5C6E78] mb-4">
                Prioritizes clinical urgency over arrival order (ESI Levels 1–5).
              </p>
            </div>

            <div className="space-y-2.5">
              {acuityDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.fill }} />
                    <span className="text-[#34434A]">{item.name}</span>
                  </div>
                  <span className="font-mono bg-[#F7F4EF] px-2.5 py-0.5 rounded-lg text-[#34434A] border border-[#E5E1D8]">
                    {item.count} patients
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E1D8] text-xs text-[#5C6E78] text-center font-medium">
              Target Time: L1 (Immediate) • L2 (≤15m) • L3 (≤60m)
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E5E1D8] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 text-[#5C6E78]" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F4EF] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#34434A] focus:ring-2 focus:ring-[#269C91] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="py-2 px-3 bg-[#F7F4EF] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#34434A] focus:ring-2 focus:ring-[#269C91] focus:outline-none"
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
              className="py-2 px-3 bg-[#F7F4EF] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#34434A] focus:ring-2 focus:ring-[#269C91] focus:outline-none"
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
            <h3 className="font-extrabold text-[#34434A] text-lg flex items-center gap-2">
              <span>Patient Queue</span>
              <span className="text-xs bg-[#E8F5F3] text-[#269C91] px-2.5 py-0.5 rounded-full font-bold border border-[#269C91]/30">
                {sortedAndFilteredPatients.length} Active Cases
              </span>
            </h3>
            <span className="text-xs text-[#5C6E78] font-semibold">
              Prioritized by ESI Clinical Acuity (Level 1 → 5)
            </span>
          </div>

          {sortedAndFilteredPatients.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E1D8] text-[#5C6E78] space-y-2">
              <CheckCircle2 size={40} className="text-[#269C91] mx-auto" />
              <div className="font-bold text-base text-[#34434A]">Queue is Clear</div>
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
                        ? "border-[#D96B83] bg-[#FDF2F4]/40 shadow-xs shadow-[#D96B83]/15"
                        : acuity.level === 2
                        ? "border-[#F07868] bg-[#FFF5F4]/40"
                        : acuity.level === 3
                        ? "border-[#E8AC48]/80 bg-[#FEF9EE]/30"
                        : "border-[#E5E1D8] hover:border-[#269C91]/50"
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
                          <h4 className="font-black text-[#34434A] text-base">
                            {patient.fullName}
                          </h4>
                          <span className="font-mono text-xs text-[#5C6E78] font-bold bg-[#F7F4EF] px-2 py-0.5 rounded-md border border-[#E5E1D8]">
                            {patient.id}
                          </span>
                          <span className="text-xs text-[#269C91] font-bold bg-[#E8F5F3] px-2.5 py-0.5 rounded-md border border-[#269C91]/30 flex items-center gap-1">
                            <Building2 size={12} />
                            {patient.department}
                          </span>
                        </div>

                        <p className="text-xs text-[#34434A] font-medium line-clamp-1">
                          <strong className="text-[#34434A]">Complaint:</strong> {patient.visitReason}
                        </p>

                        <div className="text-[11px] text-[#5C6E78] flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Waiting:{" "}
                            <strong className={waitMinutes > 30 ? "text-[#D96B83] font-bold" : "text-[#34434A]"}>
                              {waitMinutes} mins
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Registered: {new Date(patient.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {patient.existingConditions && (
                            <>
                              <span>•</span>
                              <span className="text-[#E8AC48] font-bold">
                                History: {patient.existingConditions}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Staff Actions Column */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E1D8]">
                      {/* Record Vitals Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenVitals(patient)}
                        className="px-3 py-2 bg-[#E8F5F3] hover:bg-[#269C91]/15 text-[#269C91] border border-[#269C91]/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <HeartPulse size={14} className="text-[#269C91]" />
                        <span>Vitals</span>
                      </button>

                      {/* View AI Assessment Detail */}
                      <button
                        type="button"
                        onClick={() => handleViewAssessmentDetail(patient)}
                        className="px-3 py-2 bg-[#F3F0FA] hover:bg-[#9584D8]/20 text-[#6B5BAE] border border-[#9584D8]/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <BrainCircuit size={14} className="text-[#9584D8]" />
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
                        className={`py-2 px-3 rounded-xl text-xs font-black border transition cursor-pointer ${
                          patient.status === "In Consultation"
                            ? "bg-[#EFF6FC] border-[#69A9DC] text-[#22649B]"
                            : patient.status === "Completed"
                            ? "bg-[#F7F4EF] border-[#E5E1D8] text-[#8E9EA7]"
                            : "bg-[#269C91] text-white border-[#269C91]"
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
