import {
  CalendarCheck, CalendarClock, FlaskConical, Bell, Syringe, Megaphone, Pill,
} from "lucide-react";

export const NOTIFICATION_META = {
  appointment_confirmation: { icon: CalendarCheck, tone: "clinic" },
  appointment_reminder: { icon: CalendarClock, tone: "clay" },
  lab_result: { icon: FlaskConical, tone: "clinic" },
  follow_up_reminder: { icon: Bell, tone: "clay" },
  vaccination_reminder: { icon: Syringe, tone: "clay" },
  medical_announcement: { icon: Megaphone, tone: "clinic" },
  prescription_available: { icon: Pill, tone: "clinic" },
};

export function notificationMeta(type) {
  return NOTIFICATION_META[type] || { icon: Bell, tone: "clinic" };
}
