
/* ==========================================
   MEDIQ — DEMO PATIENT REGISTRATION STORAGE
   Uses browser localStorage
   Fictional test data only
========================================== */

export type PatientRegistration = {
  id: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  department: string;
  visitReason: string;
  symptoms: string;
  duration: string;
  existingConditions: string;
  medications: string;
  allergies: string;
  status: "Waiting" | "In Consultation" | "Completed";
  priority: "Pending Review" | "Routine" | "Urgent";
  registeredAt: string;
};

const STORAGE_KEY = "mediq_demo_registrations";

/* Generate a unique demo registration ID */

export function generateRegistrationId(): string {
  const uniquePart = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `MEDIQ-${uniquePart}`;
}

/* Get all stored patient registrations */

export function getPatientRegistrations(): PatientRegistration[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed)
      ? (parsed as PatientRegistration[])
      : [];
  } catch (error) {
    console.error("Unable to read demo registrations:", error);
    return [];
  }
}

/* Save a new patient registration */

export function savePatientRegistration(
  patient: Omit<PatientRegistration, "id" | "registeredAt" | "status" | "priority">
): PatientRegistration {
  const newRegistration: PatientRegistration = {
    ...patient,
    id: generateRegistrationId(),
    registeredAt: new Date().toISOString(),
    status: "Waiting",
    priority: "Pending Review",
  };

  const registrations = getPatientRegistrations();

  registrations.unshift(newRegistration);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(registrations)
  );

  return newRegistration;
}

/* Find a registration by ID */

export function getRegistrationById(
  id: string
): PatientRegistration | undefined {
  return getPatientRegistrations().find(
    (registration) => registration.id === id
  );
}

/* Update registration status */

export function updateRegistrationStatus(
  id: string,
  status: PatientRegistration["status"]
): boolean {
  const registrations = getPatientRegistrations();

  const registration = registrations.find(
    (patient) => patient.id === id
  );

  if (!registration) {
    return false;
  }

  registration.status = status;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(registrations)
  );

  return true;
}

/* Update priority after staff review */

export function updateRegistrationPriority(
  id: string,
  priority: PatientRegistration["priority"]
): boolean {
  const registrations = getPatientRegistrations();

  const registration = registrations.find(
    (patient) => patient.id === id
  );

  if (!registration) {
    return false;
  }

  registration.priority = priority;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(registrations)
  );

  return true;
}
