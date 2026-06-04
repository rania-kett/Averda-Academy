import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Recycle, Truck, Leaf, Users, Sparkles } from "lucide-react";
import AverdaLogoImg from "@/assets/averda_logo.png";

const translations = {
  en: {
    welcome: "Welcome to Averda",
    subtitle: "A world without waste starts with you.",
    tagline: "Making Tomorrow Cleaner",
    slides: [
      {
        title: "We Move Cities",
        text: "Every day, Averda manages waste for millions of people across the Middle East and Africa.",
        stat: "50M+",
        statLabel: "People served daily",
        icon: "truck",
        accent: "#3B9FD4",
      },
      {
        title: "We Turn Waste Into Value",
        text: "We give materials a second life through recovery and recycling — creating a circular economy.",
        stat: "80%",
        statLabel: "Recovery target",
        icon: "recycle",
        accent: "#2080B8",
      },
      {
        title: "Driven by Purpose",
        text: "We aim to recover more than 80% of the waste we collect — a bold mission that changes lives.",
        stat: "15+",
        statLabel: "Countries of operation",
        icon: "leaf",
        accent: "#3B9FD4",
      },
      {
        title: "Your Role Matters",
        text: "Your work directly contributes to cleaner cities and better lives across our communities.",
        stat: "Day 1",
        statLabel: "Impact starts now",
        icon: "users",
        accent: "#1A6FA8",
      },
    ],
    values: "Deliver. Care. Inspire.",
    valuesTitle: "Our Values Drive Us",
    valuesSubtitle: "These aren't just words — they're how we show up every day.",
    cta: "Start Your Journey",
    skip: "Skip",
  },
  fr: {
    welcome: "Bienvenue chez Averda",
    subtitle: "Un monde sans déchets commence avec vous.",
    tagline: "Construire un demain plus propre",
    slides: [
      {
        title: "Nous faisons vivre les villes",
        text: "Averda gère les déchets de millions de personnes chaque jour au Moyen-Orient et en Afrique.",
        stat: "50M+",
        statLabel: "Personnes desservies",
        icon: "truck",
        accent: "#3B9FD4",
      },
      {
        title: "Nous transformons les déchets",
        text: "Nous donnons une seconde vie aux matériaux grâce à la valorisation et au recyclage.",
        stat: "80%",
        statLabel: "Objectif de valorisation",
        icon: "recycle",
        accent: "#2080B8",
      },
      {
        title: "Une mission claire",
        text: "Recycler plus de 80% des déchets collectés — une ambition qui change des vies.",
        stat: "15+",
        statLabel: "Pays d'opération",
        icon: "leaf",
        accent: "#3B9FD4",
      },
      {
        title: "Votre rôle compte",
        text: "Votre travail améliore directement la vie de millions de personnes dans nos communautés.",
        stat: "Jour 1",
        statLabel: "L'impact commence maintenant",
        icon: "users",
        accent: "#1A6FA8",
      },
    ],
    values: "Deliver. Care. Inspire.",
    valuesTitle: "Nos Valeurs Nous Guident",
    valuesSubtitle: "Ce ne sont pas que des mots — c'est notre façon d'agir chaque jour.",
    cta: "Commencer",
    skip: "Passer",
  },
  ar: {
    welcome: "مرحباً بك في أفيردا",
    subtitle: "نفتخر بانضمامك إلى فريقنا",
    tagline: "نبني غداً أنظف",
    slides: [
      {
        title: "في أفيردا، نخدم ملايين المواطنين يومياً",
        text: "نعمل باستمرار لضمان نظافة الشوارع واستمرارية الخدمة، وأثر عملنا يظهر في كل شارع وكل حي.",
        stat: "+50M",
        statLabel: "شخص نخدمه يومياً",
        icon: "truck",
        accent: "#3B9FD4",
      },
      {
        title: "نحرص على نظافة المدن الكبرى",
        text: "نقوم بجمع النفايات ونضمن بيئة نظيفة وآمنة، مما يساهم في راحة وصحة المواطنين يومياً.",
        stat: "80%",
        statLabel: "هدف الاسترداد",
        icon: "recycle",
        accent: "#2080B8",
      },
      {
        title: "وجودك معنا له قيمة كبيرة",
        text: "من خلال عملك، تبقى الشوارع نظيفة والحياة تسير بشكل طبيعي، وكل جهد تقوم به يُحدث فرقاً واضحاً.",
        stat: "اليوم 1",
        statLabel: "التأثير يبدأ الآن",
        icon: "users",
        accent: "#1A6FA8",
      },
    ],
    values: "ننجز. نهتم. نلهم.",
    valuesTitle: "قيمنا في العمل",
    valuesSubtitle: "نحن فخورون بك منذ اليوم الأول\nومساهمتك معنا تُحدث فرقاً كل يوم",
    cta: "ابدأ رحلتك معنا",
    skip: "تخطي",
  },

};

const IconMap = {
  truck: Truck,
  recycle: Recycle,
  leaf: Leaf,
  users: Users,
};

const AverdaLogo = ({ size = 48 }: { size?: number }) => (
  <img
    src={AverdaLogoImg}
    alt="Averda"
    style={{ width: size, height: size }}
    className="shrink-0 object-contain"
    loading="eager"
    draggable={false}
  />
);

// ─── Particle dots background ────────────────────────────────────────────────
const ParticleField = () => {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 4 + 3,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, opacity: 0.2 }}
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

interface Props {
  userId: string;
  lang: "en" | "fr" | "ar";
  onClose: () => void;
}

export default function AverdaOnboarding({ userId, lang, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const t = translations[lang];
  const isRTL = lang === "ar";

  const backgrounds = [
    "/images/averda1.png",
    "/images/averda2.png",
    "/images/averda5.jpg",
    "/images/averda4.png",
    "/images/averda6.png",
  ];

  const gradientFallbacks = [
    "linear-gradient(135deg, #0a2540 0%, #1a4a7a 50%, #0d1f3c 100%)",
    "linear-gradient(135deg, #0a2540 0%, #3B9FD4 100%)",
    "linear-gradient(135deg, #071a30 0%, #2080B8 100%)",
    "linear-gradient(135deg, #071a30 0%, #3B9FD4 100%)",
    "linear-gradient(135deg, #071a30 0%, #1A6FA8 100%)",
  ];

  const total = 1 + t.slides.length + 1; // welcome + slides + values

  const finish = () => {
    localStorage.setItem(`averda_onboarding_seen_${userId}`, "true");
    onClose();
  };

  const next = () => {
    if (step < total - 1) { setDirection(1); setStep(step + 1); }
    else finish();
  };
  const prev = () => {
    if (step > 0) { setDirection(-1); setStep(step - 1); }
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 40 : -40, scale: 0.97 }),
    center: { opacity: 1, y: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -40 : 40, scale: 0.97 }),
  };

  const currentSlide = step > 0 && step <= t.slides.length ? t.slides[step - 1] : null;
  const currentAccent = currentSlide?.accent ?? "#3B9FD4";
  const CurrentIcon = currentSlide ? IconMap[currentSlide.icon as keyof typeof IconMap] : null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* ── Background image + gradient fallback ── */}
        <motion.div
          key={`bg-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgrounds[step]}), ${gradientFallbacks[step]}`,
          }}
        />

        {/* ── Readability overlays (keep image crisp) ── */}
        {/* Top fade for navbar */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
        {/* Bottom fade for center card + controls */}
        <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

        {/* ── Animated color accent glow (matches current slide) ── */}
        {currentSlide && (
          <motion.div
            key={`glow-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 80%, ${currentAccent} 0%, transparent 60%)` }}
          />
        )}

        <ParticleField />

        {/* ── Top bar: Logo + Skip ── */}
        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-safe pt-6 pb-3 z-10`}
             style={{ paddingTop: "max(24px, env(safe-area-inset-top))" }}>
          {/* Logo mark */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-md shadow-[0_10px_26px_-18px_rgba(0,0,0,0.7)]">
            <div className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.55)]">
              <AverdaLogo size={36} />
            </div>
            <span className="text-white font-semibold tracking-wider text-sm uppercase opacity-95">
              Averda Academy
            </span>
          </div>

          {/* Skip button */}
          {step < total - 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={finish}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm border border-white/25 px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10"
            >
              <X size={13} />
              {t.skip}
            </motion.button>
          )}
        </div>

        {/* ── Main content area ── */}
        <div className="relative h-full flex flex-col justify-between"
             style={{ paddingTop: "max(80px, env(safe-area-inset-top) + 60px)" }}>

          {/* Center card */}
          <div className="flex-1 flex items-center justify-center px-4 py-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-sm"
              >
                {/* ── STEP 0: Welcome ── */}
                {step === 0 && (
                  <div className="text-center">
                    {/* Large logo on welcome */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="flex justify-center mb-6"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-50"
                             style={{ background: "#2080B8", transform: "scale(1.3)" }} />
                        <AverdaLogo size={80} />
                      </div>
                    </motion.div>

                    <div className="backdrop-blur-xl rounded-3xl px-6 py-8"
                         style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
                           style={{ background: "rgba(59,159,212,0.2)", color: "#3B9FD4", border: "1px solid rgba(59,159,212,0.35)" }}>
                        <Sparkles size={11} />
                        {t.tagline}
                      </div>
                      <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{ letterSpacing: "-0.5px" }}>
                        {t.welcome}
                      </h1>
                      <p className="text-base text-white/70 leading-relaxed">{t.subtitle}</p>
                    </div>
                  </div>
                )}

                {/* ── STEPS 1–4: Content slides ── */}
                {step > 0 && step <= t.slides.length && currentSlide && (
                  <div>
                    {/* Icon + stat pill */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 250 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                        style={{ background: `${currentAccent}22`, border: `1.5px solid ${currentAccent}55` }}
                      >
                        {CurrentIcon && <CurrentIcon size={26} style={{ color: currentAccent }} />}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="text-right"
                      >
                        <div className="text-3xl font-bold text-white" style={{ letterSpacing: "-1px" }}>
                          {currentSlide.stat}
                        </div>
                        <div className="text-xs text-white/55 mt-0.5">{currentSlide.statLabel}</div>
                      </motion.div>
                    </div>

                    {/* Card */}
                    <div className="rounded-3xl px-6 py-6 backdrop-blur-xl"
                         style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {/* Colored top accent line */}
                      <div className="h-0.5 w-12 rounded-full mb-5" style={{ background: currentAccent }} />
                      <h2 className="text-2xl font-bold text-white mb-3 leading-tight" style={{ letterSpacing: "-0.3px" }}>
                        {currentSlide.title}
                      </h2>

                      <p className="text-sm text-white/70 leading-relaxed">{currentSlide.text}</p>
                    </div>

                    {/* Progress indicator inside slide */}
                    <div className="flex justify-center gap-1.5 mt-4">
                      {t.slides.map((_, i) => (
                        <div
                          key={i}
                          className="h-1 rounded-full transition-all duration-300"
                          style={{
                            width: i === step - 1 ? 24 : 6,
                            background: i === step - 1 ? currentAccent : "rgba(255,255,255,0.3)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── LAST STEP: Values ── */}
                {step === total - 1 && (
                  <div className="text-center">
                    {/* Logo above the card, centered with glow */}
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="flex justify-center mb-5"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                             style={{ background: "#2080B8", transform: "scale(1.8)" }} />
                        <AverdaLogo size={64} />
                      </div>
                    </motion.div>

                    <div className="backdrop-blur-xl rounded-3xl px-6 py-7"
                         style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.15)" }}>

                      {/* Title */}
                      <div className="h-0.5 w-10 rounded-full mb-4 mx-auto" style={{ background: "#3B9FD4" }} />
                      <h2 className="text-2xl font-bold text-white mb-2 leading-tight" style={{ letterSpacing: "-0.3px" }}>
                        {t.valuesTitle}
                      </h2>
                      <p className="text-sm text-white/55 mb-6 leading-relaxed">{t.valuesSubtitle}</p>

                      {/* Three value blocks — stacked rows, full width */}
                      <div className="flex flex-col gap-3 mb-7">
                        {(lang === "ar"
                          ? [
                            { label: "الالتزام", desc: "نحافظ على استمرارية الخدمة لأن المدينة تعتمد علينا" },
                            { label: "السلامة", desc: "نحرص على أنفسنا وعلى من يعمل معنا" },
                            { label: "الاحترام", desc: "نحترم العمل، الفريق، والمدينة" },
                            ]
                          : lang === "fr"
                          ? [
                              { label: "Deliver", desc: "Nous tenons nos engagements" },
                              { label: "Care", desc: "Pour les gens et la planète" },
                              { label: "Inspire", desc: "Le changement dans tout ce que nous faisons" },
                            ]
                          : [
                              { label: "Deliver", desc: "We follow through on every commitment" },
                              { label: "Care", desc: "For people and the planet" },
                              { label: "Inspire", desc: "Change in everything we do" },
                            ]
                        ).map((v, i) => (
                          <motion.div
                            key={v.label}
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                            style={{
                              background: "rgba(59,159,212,0.1)",
                              border: "1px solid rgba(59,159,212,0.2)",
                            }}
                          >
                            {/* Number badge */}
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                 style={{ background: ["#3B9FD4", "#2080B8", "#1A6FA8"][i], color: "white" }}>
                              {i + 1}
                            </div>
                            <div className={isRTL ? "text-right" : "text-left"}>
                              <div className="text-white font-semibold text-sm leading-none mb-0.5">{v.label}</div>
                              <div className="text-white/50 text-xs">{v.desc}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={finish}
                        className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all"
                        style={{
                          background: "linear-gradient(135deg, #3B9FD4 0%, #1A6FA8 100%)",
                          boxShadow: "0 8px 32px rgba(32,128,184,0.4)",
                        }}
                      >
                        {t.cta} {isRTL ? "←" : "→"}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom Nav ── */}
          {step < total - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-5 pb-8"
              style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom))" }}
            >
              {/* Prev */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={prev}
                className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all"
                style={{
                  opacity: step === 0 ? 0 : 1,
                  pointerEvents: step === 0 ? "none" : "auto",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {isRTL ? <ChevronRight size={20} color="white" /> : <ChevronLeft size={20} color="white" />}
              </motion.button>

              {/* Step dots */}
              <div className="flex gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                    className="h-2 rounded-full cursor-pointer transition-all duration-300"
                    style={{
                      width: i === step ? 28 : 8,
                      background: i === step ? "#3B9FD4" : "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>

              {/* Next */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={next}
                className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all"
                style={{
                  background: "rgba(59,159,212,0.25)",
                  border: "1px solid rgba(59,159,212,0.45)",
                }}
              >
                {isRTL ? <ChevronLeft size={20} color="white" /> : <ChevronRight size={20} color="white" />}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
