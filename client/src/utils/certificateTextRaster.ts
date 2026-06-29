/** Rasterize text to PNG for reliable certificate PDF export (especially Arabic). */

export type RasterResult = { src: string; w: number; h: number };

export type RasterTextOptions = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  color?: string;
  maxWidth?: number;
  lineHeight?: number;
  paddingX?: number;
  paddingY?: number;
  align?: "center" | "start" | "end";
  direction?: "rtl" | "ltr";
};

async function ensureFont(
  family: string,
  size: number,
  weight: number | string = 400
): Promise<void> {
  const fonts = document.fonts;
  if (!fonts?.load) return;
  await fonts.load(`${weight} ${size}px "${family}"`).catch(() => undefined);
  if (fonts.ready) await fonts.ready;
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [text];
  const lines: string[] = [];
  let line = words[0]!;
  for (let i = 1; i < words.length; i++) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else {
      lines.push(line);
      line = words[i]!;
    }
  }
  lines.push(line);
  return lines;
}

export async function rasterizeText(opts: RasterTextOptions): Promise<RasterResult> {
  const {
    text,
    fontFamily,
    fontSize,
    fontWeight = 400,
    color = "#111111",
    maxWidth,
    lineHeight = 1.5,
    paddingX = 12,
    paddingY = 8,
    align = "center",
    direction = "ltr",
  } = opts;

  if (!text.trim()) return { src: "", w: 0, h: 0 };

  await ensureFont(fontFamily, fontSize, fontWeight);

  const font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  const probe = document.createElement("canvas");
  const pctx = probe.getContext("2d")!;
  pctx.font = font;
  pctx.direction = direction;

  const wrapAt = maxWidth ?? Math.ceil(pctx.measureText(text).width) + paddingX * 2;
  const contentWidth = wrapAt - paddingX * 2;
  const lines = maxWidth ? wrapLines(pctx, text, contentWidth) : [text];
  const linePx = fontSize * lineHeight;
  const w = Math.max(wrapAt, 1);
  const h = Math.ceil(lines.length * linePx + paddingY * 2);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.direction = direction;
  ctx.textBaseline = "middle";
  ctx.textAlign = align === "end" ? "right" : align === "start" ? "left" : "center";

  const x =
    align === "center" ? w / 2 : align === "end" ? w - paddingX : paddingX;

  lines.forEach((line, i) => {
    ctx.fillText(line, x, paddingY + linePx * i + linePx / 2);
  });

  return { src: canvas.toDataURL("image/png"), w, h };
}

export type CertificateRasterSet = {
  title?: RasterResult;
  awarded?: RasterResult;
  name?: RasterResult;
  body?: RasterResult;
  date?: RasterResult;
  dateLabel?: RasterResult;
  director?: RasterResult;
  signatureLabel?: RasterResult;
  scoreLabel?: RasterResult;
};

export async function rasterizeArabicCertificate(copy: {
  title: string;
  awarded: string;
  name: string;
  body: string;
  date: string;
  dateLabel: string;
  director: string;
  signatureLabel: string;
  scoreLabel: string;
}): Promise<CertificateRasterSet> {
  const [title, awarded, name, body, date, dateLabel, director, signatureLabel, scoreLabel] =
    await Promise.all([
      rasterizeText({
        text: copy.title,
        fontFamily: "Amiri",
        fontSize: 51,
        fontWeight: 700,
        color: "#1b436f",
        direction: "rtl",
      }),
      rasterizeText({
        text: copy.awarded,
        fontFamily: "Cairo",
        fontSize: 19,
        fontWeight: 600,
        direction: "rtl",
        color: "#4a5568",
      }),
      rasterizeText({
        text: copy.name,
        fontFamily: "Amiri",
        fontSize: 56,
        fontWeight: 700,
        color: "#28609d",
        direction: "rtl",
        align: "center",
        paddingY: 10,
        paddingX: 24,
      }),
      rasterizeText({
        text: copy.body,
        fontFamily: "Cairo",
        fontSize: 17,
        fontWeight: 400,
        maxWidth: 720,
        lineHeight: 1.75,
        direction: "rtl",
        color: "#3d4a5c",
      }),
      rasterizeText({
        text: copy.date,
        fontFamily: "Amiri",
        fontSize: 20,
        fontWeight: 700,
        color: "#1b436f",
        direction: "rtl",
      }),
      rasterizeText({ text: copy.dateLabel, fontFamily: "Cairo", fontSize: 11, fontWeight: 700, direction: "rtl" }),
      rasterizeText({
        text: copy.director,
        fontFamily: "Amiri",
        fontSize: 22,
        fontWeight: 700,
        color: "#1b436f",
        direction: "rtl",
      }),
      rasterizeText({
        text: copy.signatureLabel,
        fontFamily: "Cairo",
        fontSize: 15,
        fontWeight: 700,
        color: "#28609d",
        direction: "rtl",
      }),
      rasterizeText({ text: copy.scoreLabel, fontFamily: "Noto Sans Arabic", fontSize: 11, fontWeight: 700, direction: "rtl" }),
    ]);
  return { title, awarded, name, body, date, dateLabel, director, signatureLabel, scoreLabel };
}
