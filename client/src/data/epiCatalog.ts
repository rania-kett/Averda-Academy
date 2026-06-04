/**
 * Client EPI catalog helpers. Canonical rows live in `epiCatalogData.ts`.
 */

import type { EpiCatalogItem } from "@/api/api";
import { EPI_CATALOG_ROWS } from "./epiCatalogData";

export type { EpiCatalogRow } from "./epiCatalogData";
export {
  EPI_CATALOG_ROWS,
  EPI_CATEGORY_CODES_ORDER,
  EPI_CATEGORY_DEFAULT_ITEM_CODES,
  EPI_LABEL_FR_BY_CODE,
} from "./epiCatalogData";

export function epiCatalogToClientItems(): EpiCatalogItem[] {
  return EPI_CATALOG_ROWS.map((r) => ({
    code: r.code,
    labelFr: r.labelFr,
    labelAr: r.labelAr,
    labelEn: r.labelEn,
    emoji: r.emoji,
    defaultLifetimeDays: null,
    sortOrder: r.sortOrder,
    active: true,
  }));
}
