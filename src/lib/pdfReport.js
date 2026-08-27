import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatDateTime, calculateAge, calculateBmi } from "../utils/format";

const CLINIC_TEAL = [15, 107, 92]; // matches tailwind clinic-500
const TEXT_DARK = [7, 55, 49];
const TEXT_MUTED = [110, 130, 126];

/**
 * Shared header/footer used by every report — school identity, clinic
 * name, report title, and the "Date Generated" the spec requires.
 */
function drawHeader(doc, reportTitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo placeholder — swap the rect for doc.addImage(logoDataUrl, ...) once
  // the actual AAUA/clinic logo is available.
  doc.setFillColor(...CLINIC_TEAL);
  doc.roundedRect(15, 12, 14, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AA", 22, 20.5, { align: "center" });

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Adekunle Ajasin University, Ibadan Campus", 33, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("University Health Clinic", 33, 23.5);

  doc.setDrawColor(...CLINIC_TEAL);
  doc.setLineWidth(0.6);
  doc.line(15, 30, pageWidth - 15, 30);

  doc.setTextColor(...TEXT_DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(reportTitle, pageWidth / 2, 40, { align: "center" });

  return 48; // y-cursor after header
}

function drawFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 38;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);

  // Doctor's signature + hospital stamp area, per spec
  doc.text("Doctor's Signature: ______________________________", 15, y + 10);
  doc.text("Hospital Stamp:", 15, y + 22);
  doc.rect(45, y + 14, 35, 14); // stamp box

  doc.text(`Date generated: ${formatDate(new Date().toISOString())}`, pageWidth - 15, y + 10, { align: "right" });
  doc.setFontSize(7.5);
  doc.text("This document is confidential and intended solely for the named patient and authorized clinic staff.", pageWidth - 15, y + 22, {
    align: "right",
    maxWidth: 90,
  });
}

function sectionTitle(doc, y, title) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...CLINIC_TEAL);
  doc.text(title.toUpperCase(), 15, y);
  doc.setDrawColor(...CLINIC_TEAL);
  doc.setLineWidth(0.3);
  doc.line(15, y + 1.5, 60, y + 1.5);
  return y + 7;
}

function keyValueGrid(doc, y, pairs, colWidth = 90) {
  doc.setFontSize(9.5);
  let col = 0;
  let rowY = y;
  pairs.forEach(([label, value], i) => {
    const x = 15 + col * colWidth;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${label}:`, x, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_DARK);
    doc.text(String(value ?? "—"), x, rowY + 4.5);

    col++;
    if (col === 2) {
      col = 0;
      rowY += 12;
    }
  });
  return col === 0 ? rowY : rowY + 12;
}

function paragraph(doc, y, label, text) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(label, 15, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_DARK);
  const lines = doc.splitTextToSize(text || "Not recorded", 180);
  doc.text(lines, 15, y + 4.5);
  return y + 4.5 + lines.length * 4.2 + 3;
}

/**
 * Single clinic-visit report — the spec's core PDF deliverable.
 * `patient` is the merged profile+details object from usePatientProfile.
 */
export function generateVisitReportPdf({ patient, patientType, visit, medications = [], labRequests = [], feedback = [] }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, "Clinic Consultation Report");

  const age = calculateAge(patient.details?.date_of_birth);
  const bmi = calculateBmi(patient.details?.height_cm, patient.details?.weight_kg);

  y = sectionTitle(doc, y, "Patient Information");
  y = keyValueGrid(doc, y, [
    ["Full Name", patient.profile.full_name],
    [patientType === "student" ? "Matric Number" : "Staff Number", patient.details?.matric_number || patient.details?.staff_number],
    ["Department", patient.details?.departments?.name],
    [patientType === "student" ? "Level" : "Role", patient.details?.level ? `${patient.details.level} Level` : "Lecturer"],
    ["Gender", patient.details?.gender],
    ["Age", age ? `${age} years` : null],
    ["Blood Group", patient.details?.blood_group],
    ["Genotype", patient.details?.genotype],
    ["BMI", bmi],
    ["Email", patient.profile.email],
  ]);

  y += 2;
  y = sectionTitle(doc, y, "Consultation Details");
  y = keyValueGrid(doc, y, [
    ["Date & Time", formatDateTime(visit.visit_date, visit.visit_time)],
    ["Attending Staff", visit.attending_staff?.full_name],
    ["Blood Pressure", visit.blood_pressure],
    ["Temperature", visit.temperature_c ? `${visit.temperature_c}°C` : null],
    ["Pulse Rate", visit.pulse_rate ? `${visit.pulse_rate} bpm` : null],
    ["Oxygen Saturation", visit.oxygen_saturation ? `${visit.oxygen_saturation}%` : null],
  ]);

  y += 2;
  y = paragraph(doc, y, "Reason for Visit / Symptoms", `${visit.reason_for_visit}${visit.symptoms ? " — " + visit.symptoms : ""}`);
  y = paragraph(doc, y, "Diagnosis", visit.diagnosis);
  y = paragraph(doc, y, "Treatment Administered", visit.treatment_administered);

  if (medications.length > 0) {
    y += 2;
    y = sectionTitle(doc, y, "Prescriptions");
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [["Medicine", "Dosage", "Frequency", "Duration", "Route"]],
      body: medications.map((m) => [m.medicine_name, m.dosage, m.frequency, m.duration, m.administration_route || "—"]),
      styles: { fontSize: 8.5, textColor: TEXT_DARK },
      headStyles: { fillColor: CLINIC_TEAL, textColor: 255 },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (labRequests.length > 0) {
    y = sectionTitle(doc, y, "Laboratory Results");
    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      head: [["Test", "Category", "Status", "Result"]],
      body: labRequests.map((l) => [l.test_name, l.test_category, l.status.replace("_", " "), l.result_summary || "Pending"]),
      styles: { fontSize: 8.5, textColor: TEXT_DARK },
      headStyles: { fillColor: CLINIC_TEAL, textColor: 255 },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (feedback.length > 0) {
    y = sectionTitle(doc, y, "Medical Feedback");
    const f = feedback[0];
    y = paragraph(doc, y, "Progress / Recommendations", [
      f.progress_notes, f.lifestyle_recommendations, f.dietary_recommendations, f.exercise_recommendations,
    ].filter(Boolean).join(" "));
    if (f.follow_up_instructions) y = paragraph(doc, y, "Follow-up Instructions", f.follow_up_instructions);
  }

  drawFooter(doc);
  return doc;
}

export function downloadVisitReport(args) {
  const doc = generateVisitReportPdf(args);
  const safeName = args.patient.profile.full_name.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`AAUA-Clinic-Report-${safeName}-${args.visit.visit_date}.pdf`);
}

/**
 * Full medical history summary — patient info, allergies/conditions/
 * vaccinations, and every clinic visit on record, one row each. Used from
 * the Patient Profile page for staff/admin ("Generate Reports" in the spec).
 */
export function generatePatientSummaryPdf({ patient, patientType, visits = [] }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = drawHeader(doc, "Patient Medical History Summary");

  const age = calculateAge(patient.details?.date_of_birth);
  const bmi = calculateBmi(patient.details?.height_cm, patient.details?.weight_kg);

  y = sectionTitle(doc, y, "Patient Information");
  y = keyValueGrid(doc, y, [
    ["Full Name", patient.profile.full_name],
    [patientType === "student" ? "Matric Number" : "Staff Number", patient.details?.matric_number || patient.details?.staff_number],
    ["Department", patient.details?.departments?.name],
    ["Gender", patient.details?.gender],
    ["Age", age ? `${age} years` : null],
    ["Blood Group", patient.details?.blood_group],
    ["Genotype", patient.details?.genotype],
    ["BMI", bmi],
  ]);

  if (patient.allergies?.length) {
    y += 2;
    y = paragraph(doc, y, "Allergies", patient.allergies.map((a) => a.allergen).join(", "));
  }
  if (patient.conditions?.length) {
    y = paragraph(doc, y, "Chronic Conditions", patient.conditions.map((c) => c.condition_name).join(", "));
  }

  y += 2;
  y = sectionTitle(doc, y, "Clinic Visit History");
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [["Date", "Reason", "Diagnosis", "Attending Staff", "Status"]],
    body: visits.map((v) => [
      formatDate(v.visit_date),
      v.reason_for_visit,
      v.diagnosis || "—",
      v.attending_staff?.full_name || "—",
      v.status.replace("_", " "),
    ]),
    styles: { fontSize: 8.5, textColor: TEXT_DARK },
    headStyles: { fillColor: CLINIC_TEAL, textColor: 255 },
    theme: "grid",
  });

  drawFooter(doc);
  return doc;
}

export function downloadPatientSummary(args) {
  const doc = generatePatientSummaryPdf(args);
  const safeName = args.patient.profile.full_name.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`AAUA-Clinic-Summary-${safeName}.pdf`);
}
