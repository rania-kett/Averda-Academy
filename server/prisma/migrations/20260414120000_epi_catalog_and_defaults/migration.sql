-- Employee categories used by training assignments and EPI defaults.
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "idPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

ALTER TABLE "User" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "User_categoryId_idx" ON "User"("categoryId");
ALTER TABLE "User" ADD CONSTRAINT "User_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EPI catalog and category defaults
CREATE TABLE "EpiItemCatalog" (
    "code" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelFr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "emoji" TEXT,
    "defaultLifetimeDays" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EpiItemCatalog_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "EpiItemCatalog_active_sortOrder_idx" ON "EpiItemCatalog"("active", "sortOrder");

CREATE TABLE "EpiCategoryDefaultItem" (
    "categoryId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "lifetimeDaysOverride" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EpiCategoryDefaultItem_pkey" PRIMARY KEY ("categoryId","itemCode")
);

CREATE INDEX "EpiCategoryDefaultItem_categoryId_sortOrder_idx" ON "EpiCategoryDefaultItem"("categoryId", "sortOrder");
CREATE INDEX "EpiCategoryDefaultItem_itemCode_idx" ON "EpiCategoryDefaultItem"("itemCode");

ALTER TABLE "EpiCategoryDefaultItem" ADD CONSTRAINT "EpiCategoryDefaultItem_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EpiCategoryDefaultItem" ADD CONSTRAINT "EpiCategoryDefaultItem_itemCode_fkey"
  FOREIGN KEY ("itemCode") REFERENCES "EpiItemCatalog"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed catalog (includes legacy codes for backward compatibility)
INSERT INTO "EpiItemCatalog" ("code","labelAr","labelFr","labelEn","emoji","defaultLifetimeDays","sortOrder","active","updatedAt")
VALUES
  ('helmet','خوذة','Casque','Helmet','🪖',730,900,false,CURRENT_TIMESTAMP),
  ('vest','سترة عاكسة','Gilet haute visibilité','High-visibility vest','🦺',365,901,false,CURRENT_TIMESTAMP),
  ('gloves','قفازات','Gants','Gloves','🧤',180,902,false,CURRENT_TIMESTAMP),
  ('shoes','حذاء سلامة','Chaussures de sécurité','Safety shoes','🥾',365,903,false,CURRENT_TIMESTAMP),
  ('shirt','قميص عمل','Chemise de travail','Work shirt','👕',365,904,false,CURRENT_TIMESTAMP),

  ('leather_gloves','قفازات جلدية','Gants en cuir','Leather gloves','🧤',180,10,true,CURRENT_TIMESTAMP),
  ('safety_shoes','حذاء سلامة','Chaussures de sécurité','Safety shoes','🥾',365,20,true,CURRENT_TIMESTAMP),
  ('hi_vis_jacket','سترة عالية الرؤية','Veste haute visibilité','High-visibility jacket','🦺',365,30,true,CURRENT_TIMESTAMP),
  ('nitrile_cotton_gloves','قفازات (قطن/نيتريل)','Gants (coton nitrile)','Cotton nitrile gloves','🧤',180,40,true,CURRENT_TIMESTAMP),
  ('helmet_visor','خوذة مع واقي وجه','Casque + visière','Helmet + visor','🪖',730,50,true,CURRENT_TIMESTAMP),
  ('bump_cap','قبعة أمان (مضادة للصدمات)','Casquette de sécurité (anti-heurt)','Safety bump cap','🧢',730,60,true,CURRENT_TIMESTAMP),
  ('acid_wash_gloves','قفازات غسيل (مضادة للأحماض)','Gants de lavage (anti-acide)','Acid-resistant washing gloves','🧤',180,70,true,CURRENT_TIMESTAMP),
  ('rubber_safety_boots','أحذية أمان (مطاط)','Bottes de sécurité (caoutchouc)','Rubber safety boots','🥾',365,80,true,CURRENT_TIMESTAMP),
  ('anti_fog_goggles','نظارات (مضادة للضباب)','Lunettes (anti-buée)','Anti-fog goggles','🥽',365,90,true,CURRENT_TIMESTAMP),
  ('acid_rain_suit','بدلة مقاومة للماء (مضادة للأحماض)','Combinaison imperméable (anti-acide)','Waterproof suit (acid-resistant)','🧥',365,100,true,CURRENT_TIMESTAMP),
  ('acid_apron','مريلة (مضادة للأحماض)','Tablier (anti-acide)','Apron (acid-resistant)','🧑‍🍳',365,110,true,CURRENT_TIMESTAMP),
  ('hearing_protection','حماية سمعية','Protection auditive','Hearing protection','🎧',730,120,true,CURRENT_TIMESTAMP),
  ('dust_mask','قناع (مضاد للغبار)','Masque (anti-poussière)','Dust mask','😷',90,130,true,CURRENT_TIMESTAMP);

-- Migrate EpiIssuance.itemType -> itemCode
ALTER TABLE "EpiIssuance" ADD COLUMN "itemCode" TEXT;
UPDATE "EpiIssuance" SET "itemCode" = "itemType" WHERE "itemCode" IS NULL;
UPDATE "EpiIssuance" SET "itemCode" = 'helmet_visor' WHERE "itemCode" = 'helmet';
UPDATE "EpiIssuance" SET "itemCode" = 'hi_vis_jacket' WHERE "itemCode" = 'vest';
UPDATE "EpiIssuance" SET "itemCode" = 'leather_gloves' WHERE "itemCode" = 'gloves';
UPDATE "EpiIssuance" SET "itemCode" = 'safety_shoes' WHERE "itemCode" = 'shoes';
-- 'shirt' kept as legacy; no direct mapping to new list

ALTER TABLE "EpiIssuance" ALTER COLUMN "itemCode" SET NOT NULL;
CREATE INDEX "EpiIssuance_itemCode_idx" ON "EpiIssuance"("itemCode");
ALTER TABLE "EpiIssuance" ADD CONSTRAINT "EpiIssuance_itemCode_fkey"
  FOREIGN KEY ("itemCode") REFERENCES "EpiItemCatalog"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EpiIssuance" DROP COLUMN "itemType";

-- Migrate EpiReplacementRequest.itemType -> itemCode
ALTER TABLE "EpiReplacementRequest" ADD COLUMN "itemCode" TEXT;
UPDATE "EpiReplacementRequest" SET "itemCode" = "itemType" WHERE "itemCode" IS NULL;
UPDATE "EpiReplacementRequest" SET "itemCode" = 'helmet_visor' WHERE "itemCode" = 'helmet';
UPDATE "EpiReplacementRequest" SET "itemCode" = 'hi_vis_jacket' WHERE "itemCode" = 'vest';
UPDATE "EpiReplacementRequest" SET "itemCode" = 'leather_gloves' WHERE "itemCode" = 'gloves';
UPDATE "EpiReplacementRequest" SET "itemCode" = 'safety_shoes' WHERE "itemCode" = 'shoes';

ALTER TABLE "EpiReplacementRequest" ALTER COLUMN "itemCode" SET NOT NULL;
CREATE INDEX "EpiReplacementRequest_itemCode_status_createdAt_idx" ON "EpiReplacementRequest"("itemCode", "status", "createdAt");
ALTER TABLE "EpiReplacementRequest" ADD CONSTRAINT "EpiReplacementRequest_itemCode_fkey"
  FOREIGN KEY ("itemCode") REFERENCES "EpiItemCatalog"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EpiReplacementRequest" DROP COLUMN "itemType";

