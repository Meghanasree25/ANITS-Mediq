
import { describe, expect, it } from "vitest";
import { evaluateTriageSafety } from "./triageEngine";
import type { TriageInput } from "./triageEngine";

/* ==========================================
   MEDIQ H1 — SAFETY ENGINE UNIT TESTS

   Prototype testing with fictional data.

   These tests verify software behavior,
   not clinical safety or triage accuracy.
========================================== */

const normalDemo: TriageInput = {
  age: 35,
  complaint: "Mild headache since yesterday",
  complaintLanguage: "English",
  systolicBP: 120,
  diastolicBP: 80,
  pulseRate: 75,
  temperatureC: 37,
  spo2: 98,
  existingConditions: "",
  medications: "",
};

describe("MEDIQ H1 Safety Engine", () => {
  /* ======================================
     TEST CASE 1
     Normal demonstration input
  ====================================== */

  it("requires nurse review for normal input", () => {
    const result = evaluateTriageSafety(normalDemo);

    expect(result.decision).toBe("NURSE_REVIEW");
    expect(result.triageLevel).toBeNull();
    expect(result.requiresNurseReview).toBe(true);
    expect(result.modelUsed).toBe(false);
    expect(result.triggeredRules).toHaveLength(0);
  });

  /* ======================================
     TEST CASE 2
     Reported chest pain
  ====================================== */

  it("escalates reported chest pain", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "I have chest pain",
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(result.redFlags).toContain(
      "Reported chest pain"
    );

    expect(result.triggeredRules).toContain(
      "RF_CHEST_PAIN"
    );

    expect(result.requiresNurseReview).toBe(true);
  });

  /* ======================================
     TEST CASE 3
     Low oxygen saturation
  ====================================== */

  it("escalates low SpO2 under prototype rules", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      spo2: 85,
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(
      result.triggeredRules.some((rule) =>
        rule.includes("DEMO_VITAL_SPO2")
      )
    ).toBe(true);

    expect(result.recommendedDepartment).toBe(
      "Emergency Review"
    );
  });

  /* ======================================
     TEST CASE 4
     Invalid temperature
  ====================================== */

  it("abstains for invalid temperature", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      temperatureC: 96,
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(
      result.validationIssues.length
    ).toBeGreaterThan(0);

    expect(result.triageLevel).toBeNull();
  });

  /* ======================================
     TEST CASE 5
     Missing blood pressure
  ====================================== */

  it("abstains when a measurement is missing", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      systolicBP: null,
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(result.validationIssues).toContain(
      "Systolic BP is missing."
    );

    expect(result.requiresNurseReview).toBe(true);
  });

  /* ======================================
     TEST CASE 6
     Emergency phrase with missing data
  ====================================== */

  it("escalates severe bleeding despite missing SpO2", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "Severe bleeding",
      spo2: null,
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(result.redFlags).toContain(
      "Reported severe bleeding"
    );

    expect(
      result.validationIssues.length
    ).toBeGreaterThan(0);
  });

  /* ======================================
     TEST CASE 7
     Inconsistent blood pressure
  ====================================== */

  it("escalates concerning BP while flagging inconsistent readings", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      systolicBP: 70,
      diastolicBP: 90,
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(
      result.triggeredRules.some((rule) =>
        rule.includes("DEMO_VITAL_BP")
      )
    ).toBe(true);

    expect(
      result.validationIssues.some((issue) =>
        issue.includes("inconsistent")
      )
    ).toBe(true);

    expect(result.requiresNurseReview).toBe(true);
  });

  /* ======================================
     TEST CASE 8
     Missing complaint
  ====================================== */

  it("abstains when complaint is empty", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "",
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(result.validationIssues).toContain(
      "Chief complaint is missing."
    );
  });

  /* ======================================
     TEST CASE 9
     Negated chest pain
  ====================================== */

  it("abstains when chest pain is negated", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "I have no chest pain",
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(result.redFlags).not.toContain(
      "Reported chest pain"
    );

    expect(
      result.validationIssues.some((issue) =>
        issue.includes("possible negation")
      )
    ).toBe(true);

    expect(result.requiresNurseReview).toBe(true);
  });

  /* ======================================
     TEST CASE 10
     Separate positive red flag
  ====================================== */

  it("escalates a separate positive red flag", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint:
        "No fever. I have severe chest pain.",
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(result.redFlags).toContain(
      "Reported chest pain"
    );

    expect(result.triggeredRules).toContain(
      "RF_CHEST_PAIN"
    );
  });

  /* ======================================
     TEST CASE 11
     Unsupported complaint language
  ====================================== */

  it("abstains for unsupported complaint language", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaintLanguage: "Tamil",
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(
      result.validationIssues.some((issue) =>
        issue.includes(
          "Complaint language requires manual interpretation"
        )
      )
    ).toBe(true);
  });

  /* ======================================
     TEST CASE 12
     Multiple positive warning symptoms
  ====================================== */

  it("detects multiple red flags", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint:
        "I have chest pain and difficulty breathing",
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(result.triggeredRules).toContain(
      "RF_CHEST_PAIN"
    );

    expect(result.triggeredRules).toContain(
      "RF_BREATHING"
    );

    expect(result.recommendedDepartment).toBe(
      "Emergency Review"
    );
  });

  /* ======================================
     TEST CASE 13
     Negation with missing measurement
  ====================================== */

  it("abstains for negated symptoms with missing measurements", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "No chest pain",
      spo2: null,
    });

    expect(result.decision).toBe("CANNOT_ASSESS");

    expect(result.validationIssues).toContain(
      "SpO2 is missing."
    );

    expect(
      result.validationIssues.some((issue) =>
        issue.includes("possible negation")
      )
    ).toBe(true);
  });

  /* ======================================
     TEST CASE 14
     Critical vital sign with negated symptom
  ====================================== */

  it("escalates critical vital rules despite negated symptoms", () => {
    const result = evaluateTriageSafety({
      ...normalDemo,
      complaint: "No chest pain",
      spo2: 85,
    });

    expect(result.decision).toBe("ESCALATE_NOW");

    expect(
      result.triggeredRules.some((rule) =>
        rule.includes("DEMO_VITAL_SPO2")
      )
    ).toBe(true);

    expect(result.requiresNurseReview).toBe(true);
  });

  /* ======================================
     TEST CASE 15
     Engine metadata and review requirement
  ====================================== */

  it("returns prototype metadata without an AI prediction", () => {
    const result = evaluateTriageSafety(normalDemo);

    expect(result.version).toBe(
      "MEDIQ-H1-SAFETY-PROTOTYPE-2"
    );

    expect(result.modelUsed).toBe(false);
    expect(result.triageLevel).toBeNull();
    expect(result.requiresNurseReview).toBe(true);
  });
});
