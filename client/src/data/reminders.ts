export type ReminderLang = "ar" | "fr" | "en";

type PoolKey =
  | "general"
  | "driver"
  | "sweeper"
  | "chargeur"
  | "agent_parc"
  | "maintenance"
  | "team_leader";

const POOLS: Record<PoolKey, Record<ReminderLang, string[]>> = {
  general: {
    ar: [
      "🦺 تأكد من معدات السلامة قبل أن تبدأ.",
      "👀 خذ لحظة لملاحظة محيطك… السلامة تبدأ بالانتباه.",
      "📍 اعرف مكانك وخطتك قبل الانطلاق.",
      "⚠️ خليك مركز… أغلب الحوادث تقع عند فقدان الانتباه.",
      "💧 شربت ماء؟ لا تنسى نفسك.",
      "🧼 اغسل يديك ونظّف معداتك.",
      "✅ يوم آخر بدون حوادث… عمل رائع.",
      "🧘 خذ وقتك للراحة، جسمك يحتاجها.",
      "💡 دقيقة تعلم اليوم قد تمنع حادث غدًا.",
      "📈 التقدم الصغير يصنع فرقًا كبيرًا.",
    ],
    en: [
      "🦺 Check your safety gear before you start.",
      "👀 Take a moment to scan your surroundings — safety starts with awareness.",
      "📍 Know your position and plan before you move.",
      "⚠️ Stay focused — most incidents happen when attention slips.",
      "💧 Had some water? Don’t forget yourself.",
      "🧼 Wash your hands and keep your equipment clean.",
      "✅ Another day without incidents — great work.",
      "🧘 Take a break — your body needs it.",
      "💡 One minute of learning today can prevent an incident tomorrow.",
      "📈 Small progress makes a big difference.",
    ],
    fr: [
      "🦺 Vérifiez votre équipement de sécurité avant de commencer.",
      "👀 Prenez un instant pour observer — la sécurité commence par l’attention.",
      "📍 Sachez où vous êtes et ce que vous faites avant d’agir.",
      "⚠️ Restez concentré — la plupart des incidents viennent d’un relâchement.",
      "💧 Vous avez bu ? Pensez à vous hydrater.",
      "🧼 Lavez-vous les mains et gardez le matériel propre.",
      "✅ Encore une journée sans incident — bravo.",
      "🧘 Accordez-vous une pause — votre corps en a besoin.",
      "💡 Une minute d’apprentissage aujourd’hui peut éviter un accident demain.",
      "📈 Les petits progrès font de grands résultats.",
    ],
  },
  driver: {
    ar: [
      "🔙 وضع الرجوع للخلف: مرايا + محيط + تركيز.",
      "👀 الزوايا العمياء لا ترحم… تأكد مرتين.",
      "🛑 إذا شكّيت، توقّف فورًا.",
      "🚨 ثانية إضافية أفضل من حادث.",
      "🧍 ممكن يكون شخص خلفك الآن… تأكد.",
    ],
    en: [
      "🔙 Reversing: mirrors + surroundings + focus.",
      "👀 Blind spots are unforgiving — check twice.",
      "🛑 If in doubt, stop immediately.",
      "🚨 An extra second beats an incident.",
      "🧍 Someone could be behind you right now — verify.",
    ],
    fr: [
      "🔙 Marche arrière : rétros + environnement + concentration.",
      "👀 Les angles morts sont impitoyables — vérifiez deux fois.",
      "🛑 En cas de doute, arrêtez-vous tout de suite.",
      "🚨 Une seconde de plus vaut mieux qu’un accident.",
      "🧍 Quelqu’un peut être derrière vous — vérifiez.",
    ],
  },
  sweeper: {
    ar: [
      "🦺 كن مرئيًا دائمًا… سلامتك أولًا.",
      "🚧 انتبه لحركة المرور قبل أي خطوة.",
      "👀 لا تعتمد على العادة… انتبه لكل لحظة.",
      "⚠️ لحظة غفلة قد تكون خطيرة.",
      "🧹 عملك مهم… وسلامتك أهم.",
    ],
    en: [
      "🦺 Stay visible — your safety comes first.",
      "🚧 Watch traffic before every move.",
      "👀 Don’t rely on habit — stay alert every moment.",
      "⚠️ A moment of distraction can be dangerous.",
      "🧹 Your work matters — your safety matters more.",
    ],
    fr: [
      "🦺 Restez visible — votre sécurité d’abord.",
      "🚧 Surveillez la circulation avant chaque mouvement.",
      "👀 Ne vous fiez pas à l’habitude — restez attentif.",
      "⚠️ Un instant d’inattention peut être dangereux.",
      "🧹 Votre travail compte — votre sécurité encore plus.",
    ],
  },
  chargeur: {
    ar: [
      "📦 ارفع بذكاء، ليس بسرعة.",
      "🤝 تواصل مع فريقك قبل أي حركة.",
      "⚠️ احمِ يديك… الخطر قريب دائمًا.",
      "👀 تأكد قبل أن تتحرك للخلف.",
      "🛑 السرعة = خطر.",
    ],
    en: [
      "📦 Lift smart, not just fast.",
      "🤝 Coordinate with your team before moving.",
      "⚠️ Protect your hands — hazards are always close.",
      "👀 Check before you move backwards.",
      "🛑 Speed = risk.",
    ],
    fr: [
      "📦 Soulevez intelligemment, pas seulement vite.",
      "🤝 Coordonnez-vous avec l’équipe avant de bouger.",
      "⚠️ Protégez vos mains — le danger est proche.",
      "👀 Vérifiez avant de reculer.",
      "🛑 Vitesse = risque.",
    ],
  },
  agent_parc: {
    ar: [
      "🚶 المركبات حولك تتحرك… كن يقظًا.",
      "👀 المكان المألوف ليس دائمًا آمنًا.",
      "🚛 تأكد أن السائق يراك.",
      "📍 اعرف موقعك في كل لحظة.",
      "⚠️ لا تفترض، تأكد.",
    ],
    en: [
      "🚶 Vehicles around you are moving — stay alert.",
      "👀 Familiar places aren’t always safe.",
      "🚛 Make sure drivers can see you.",
      "📍 Know your position at all times.",
      "⚠️ Don’t assume — verify.",
    ],
    fr: [
      "🚶 Les véhicules bougent autour de vous — restez vigilant.",
      "👀 Un lieu familier n’est pas toujours sûr.",
      "🚛 Assurez-vous que les conducteurs vous voient.",
      "📍 Sachez où vous êtes en permanence.",
      "⚠️ Ne supposez pas — vérifiez.",
    ],
  },
  maintenance: {
    ar: [
      "🔧 تحقق من أدواتك قبل البدء.",
      "⚠️ أوقف التشغيل قبل التدخل.",
      "🧤 معدات الحماية ضرورية.",
      "👀 راجع عملك قبل الانتهاء.",
      "🔥 الخطر غير المرئي هو الأخطر.",
    ],
    en: [
      "🔧 Check your tools before starting.",
      "⚠️ Shut down before servicing.",
      "🧤 PPE is essential.",
      "👀 Review your work before finishing.",
      "🔥 Hidden hazards are the worst kind.",
    ],
    fr: [
      "🔧 Vérifiez vos outils avant de commencer.",
      "⚠️ Coupez l’alimentation avant d’intervenir.",
      "🧤 L’EPI est indispensable.",
      "👀 Contrôlez votre travail avant de terminer.",
      "🔥 Les dangers invisibles sont les plus graves.",
    ],
  },
  team_leader: {
    ar: [
      "👀 فريقك يعتمد على انتباهك.",
      "🗣️ وضّح التعليمات لتفادي الأخطاء.",
      "⚠️ الضغط يولد الأخطاء… خفّف السرعة.",
      "📊 راقب السلامة، ليس فقط الأداء.",
      "🤝 كن قدوة في السلامة.",
    ],
    en: [
      "👀 Your team relies on your attention.",
      "🗣️ Clear instructions prevent mistakes.",
      "⚠️ Pressure creates errors — slow down.",
      "📊 Watch safety, not just performance.",
      "🤝 Lead by example on safety.",
    ],
    fr: [
      "👀 Votre équipe compte sur votre vigilance.",
      "🗣️ Des consignes claires évitent les erreurs.",
      "⚠️ La pression génère des erreurs — ralentissez.",
      "📊 Surveillez la sécurité, pas seulement la performance.",
      "🤝 Montrez l’exemple en matière de sécurité.",
    ],
  },
};

export function reminderPoolFor(
  kind: "chauffeur" | "balayeur" | "chargeur" | "parc" | "maintenance" | "manager" | "unknown",
  lang: ReminderLang
): { pool: { text: string; tone: "general" | "safety" }[]; kind: typeof kind } {
  const key: PoolKey =
    kind === "chauffeur"
      ? "driver"
      : kind === "balayeur"
        ? "sweeper"
        : kind === "chargeur"
          ? "chargeur"
          : kind === "parc"
            ? "agent_parc"
            : kind === "maintenance"
              ? "maintenance"
              : kind === "manager"
                ? "team_leader"
                : "general";

  const roleLines = POOLS[key][lang].map((text) => ({ text, tone: "safety" as const }));
  const generalLines = POOLS.general[lang].map((text) => ({ text, tone: "general" as const }));
  return { pool: [...generalLines, ...roleLines], kind };
}
