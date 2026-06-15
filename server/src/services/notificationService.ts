import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export type I18nText = { ar: string; fr: string; en: string };

export async function findEmployeeUser(idOrEmployeeId: string) {
  const key = idOrEmployeeId.trim();
  if (!key) return null;
  return prisma.user.findFirst({
    where: {
      role: "EMPLOYEE",
      OR: [{ id: key }, { employeeId: key }],
    },
  });
}

export async function createEmployeeNotification(
  userId: string,
  title: I18nText,
  message: I18nText
) {
  return prisma.notification.create({
    data: {
      userId,
      title: title as unknown as object,
      message: message as unknown as object,
    },
  });
}

export function assessmentReminderContent(): { title: I18nText; message: I18nText } {
  return {
    title: {
      ar: "🔔 تذكير: اختبار التقييم الأولي",
      fr: "🔔 Rappel : évaluation initiale",
      en: "🔔 Reminder: baseline assessment",
    },
    message: {
      ar: "يرجى إكمال اختبار التقييم الأولي في أقرب وقت للوصول إلى دورات التدريب.",
      fr: "Veuillez compléter l'évaluation initiale pour accéder aux formations.",
      en: "Please complete the baseline assessment to access your training courses.",
    },
  };
}

export function epiReminderContent(): { title: I18nText; message: I18nText } {
  return {
    title: {
      ar: "🦺 تذكير معدات الحماية (EPI)",
      fr: "🦺 Rappel équipements EPI",
      en: "🦺 PPE (EPI) reminder",
    },
    message: {
      ar: "لديك معدات أو طلبات EPI تحتاج متابعة. يرجى مراجعة قسم المعدات في التطبيق.",
      fr: "Vous avez des équipements ou demandes EPI à traiter. Consultez la section équipements.",
      en: "You have PPE items or EPI requests that need attention. Please check the equipment section.",
    },
  };
}

/** Sent when admin issues new / re-issued EPI (status « في الانتظار » until employee confirms). */
export function epiIssuanceNotificationContent(itemLabels: {
  ar: string;
  fr?: string;
  en?: string;
}[]): { title: I18nText; message: I18nText } {
  const listAr = itemLabels.map((x) => x.ar).join("، ");
  const listFr = itemLabels.map((x) => x.fr ?? x.ar).join(", ");
  const listEn = itemLabels.map((x) => x.en ?? x.ar).join(", ");
  return {
    title: {
      ar: "🦺 معدات جديدة في الطريق",
      fr: "🦺 Nouveaux équipements EPI",
      en: "🦺 New PPE on the way",
    },
    message: {
      ar: `تم إرسال معدات جديدة لك: ${listAr}. افتح قسم المعدات لتأكيد الاستلام عند وصولها.`,
      fr: `De nouveaux équipements vous ont été assignés : ${listFr}. Ouvrez la section équipements pour confirmer la réception.`,
      en: `New equipment has been assigned to you: ${listEn}. Open the equipment section to confirm receipt when it arrives.`,
    },
  };
}

const ASSESSMENT_REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function findRecentAssessmentReminder(userId: string) {
  const since = new Date(Date.now() - ASSESSMENT_REMINDER_COOLDOWN_MS);
  const titleAr = assessmentReminderContent().title.ar;
  return prisma.notification.findFirst({
    where: {
      userId,
      createdAt: { gte: since },
      title: { path: ["ar"], equals: titleAr },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function sendAssessmentReminder(userId: string) {
  const recent = await findRecentAssessmentReminder(userId);
  if (recent) {
    throw new AppError(429, "Assessment reminder already sent within the last 24 hours");
  }
  const { title, message } = assessmentReminderContent();
  return createEmployeeNotification(userId, title, message);
}

export async function sendEpiReminder(userId: string) {
  const { title, message } = epiReminderContent();
  return createEmployeeNotification(userId, title, message);
}

export async function sendAdminNotify(
  idOrEmployeeId: string,
  type: "assessment" | "epi" | "custom",
  custom?: { title: I18nText; message: I18nText }
) {
  const user = await findEmployeeUser(idOrEmployeeId);
  if (!user) throw new AppError(404, "Employee not found");

  if (type === "assessment") {
    return sendAssessmentReminder(user.id);
  }
  if (type === "epi") {
    return sendEpiReminder(user.id);
  }
  if (!custom?.title || !custom?.message) {
    throw new AppError(400, "Custom notifications require title and message");
  }
  return createEmployeeNotification(user.id, custom.title, custom.message);
}
