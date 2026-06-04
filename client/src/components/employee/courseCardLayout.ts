import type { CSSProperties } from "react";

export const courseCardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
  gap: "16px",
  alignItems: "stretch",
};

export const courseCardGridMdStyle: CSSProperties = {
  gridTemplateColumns: "repeat(3, 1fr)",
};

/** Card wrapper — fixed total height for every course card */
export const courseCardWrapperStyle: CSSProperties = {
  borderRadius: "16px",
  overflow: "hidden",
  background: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  cursor: "pointer",
};

/** @deprecated use courseCardWrapperStyle */
export const courseCardShellStyle = courseCardWrapperStyle;

/** Colored thumbnail */
export const courseCardThumbnailStyle: CSSProperties = {
  height: "120px",
  minHeight: "120px",
  maxHeight: "120px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

/** Content section */
export const courseCardContentStyle: CSSProperties = {
  flexShrink: 0,
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const courseCardTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  textAlign: "right",
  lineHeight: 1.4,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  margin: 0,
  color: "#1C1917",
};

export const courseCardMetaRowStyle: CSSProperties = {
  minHeight: "18px",
  fontSize: "12px",
  color: "#9ca3af",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

export const courseCardStatusStyle: CSSProperties = {
  alignSelf: "flex-end",
  marginTop: "auto",
  paddingTop: "8px",
};

export const courseCardHsseqSlotStyle: CSSProperties = {
  minHeight: 0,
  flexShrink: 0,
};
