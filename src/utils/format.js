export function calculateBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { label: "Underweight", tone: "clay" };
  if (bmi < 25) return { label: "Normal", tone: "clinic" };
  if (bmi < 30) return { label: "Overweight", tone: "clay" };
  return { label: "Obese", tone: "clay" };
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  const d = formatDate(dateStr);
  return timeStr ? `${d}, ${timeStr.slice(0, 5)}` : d;
}

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
