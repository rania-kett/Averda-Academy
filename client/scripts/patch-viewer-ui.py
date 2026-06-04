from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/pages/employee/CourseViewerPage.tsx"
text = p.read_text(encoding="utf-8")
start = text.index("  const pdfRenderShell = !pdfUrl ? (")
end = text.index("  const courseQuizAvailable = course.hasQuiz;")

replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </div>
  ) : iframeError ? (
    <motion.div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

# Fix typos in script - use div not motion
replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </div>
  ) : iframeError ? (
    <div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

# Final clean version with only div
replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </motion.div>
  ) : iframeError ? (
    <motion.div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </motion.div>
  ) : iframeError ? (
    <motion.div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

# I'll just write the correct final string once
replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </motion.div>
  ) : iframeError ? (
    <motion.div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

# STOP - write clean file content only
replacement = """  const pdfRenderShell = !pdfUrl ? (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <FileText className="h-12 w-12 text-[#A8A29E]" />
      <p className="text-[#57534E] dark:text-stone-400">{t("course.pdfUnavailable")}</p>
    </motion.div>
  ) : iframeError ? (
    <motion.div className="px-4 py-10 text-center">
      <p className="text-[#57534E] dark:text-stone-400">
        {lang === "ar" ? "تعذّر تحميل الملف" : t("employee.viewer.pdfLoadError")}
      </p>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${navyActionClass} mt-4 inline-flex`}
      >
        {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
      </a>
    </motion.div>
  ) : (
    <motion.div className="w-full space-y-4">
      <motion.div
        style={{
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: isMobileLike ? "12px" : "24px",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {!iframeLoaded && (
          <motion.div
            className="flex items-center justify-center text-[#57534E] dark:text-stone-400"
            style={{ minHeight: isMobileLike ? "60vh" : "75vh" }}
          >
            {lang === "ar" ? "جاري التحميل..." : t("employee.viewer.pdfBlobLoading")}
          </motion.div>
        )}
        <iframe
          key={pdfIframeSrc}
          title={course.title[lang] || course.title.ar}
          src={pdfIframeSrc}
          style={{
            width: "100%",
            height: isMobileLike ? "70vh" : "75vh",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
            display: iframeLoaded ? "block" : "none",
            background: "white",
          }}
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
        />
      </motion.div>
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 sm:justify-start"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <a href={pdfUrl} download className={navyActionClass}>
          {lang === "ar" ? "تحميل PDF" : lang === "fr" ? "Télécharger le PDF" : "Download PDF"}
        </a>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={navyActionClass}>
          {lang === "ar" ? "فتح في نافذة جديدة" : t("employee.viewer.openPdfNewTab")}
        </a>
      </motion.div>
    </motion.div>
  );

"""

p.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
