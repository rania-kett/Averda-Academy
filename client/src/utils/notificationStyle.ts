export type NotifVisual = { icon: string; color: string; bg: string };

export function getNotifStyle(type: string | undefined, title: string): NotifVisual {
  const blob = `${type ?? ""} ${title}`.toLowerCase();
  if (blob.includes("badge") || title.includes("شارة")) {
    return { icon: "🏅", color: "#f59e0b", bg: "#fef3c7" };
  }
  if (blob.includes("challenge") || blob.includes("défi") || blob.includes("تحدي")) {
    return { icon: "🎯", color: "#7c3aed", bg: "#ede9fe" };
  }
  if (blob.includes("quiz") || blob.includes("اختبار")) {
    return { icon: "📝", color: "#2563eb", bg: "#dbeafe" };
  }
  if (blob.includes("epi") || title.includes("معدات")) {
    return { icon: "🦺", color: "#ea580c", bg: "#ffedd5" };
  }
  return { icon: "🔔", color: "#6b7280", bg: "#f3f4f6" };
}

export function inferNotifType(n: {
  type?: string;
  title: Record<string, string>;
  message: Record<string, string>;
}): string {
  if (n.type?.trim()) return n.type.trim();
  const parts = [
    n.title?.en,
    n.title?.fr,
    n.title?.ar,
    n.message?.en,
    n.message?.fr,
    n.message?.ar,
  ]
    .filter(Boolean)
    .join(" ");
  return parts;
}
