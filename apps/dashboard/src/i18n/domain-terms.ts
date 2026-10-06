import type { AppLanguage } from "@/i18n/config";

/**
 * The vocabulary a machine translator cannot get right, and we already own.
 *
 * 🔴 **Why this file exists.** The generated phrase catalogues read `Charge` as
 * an ordinary English word and produced, in Dutch, five different wrong things
 * for the single most important identifier in this ERP — the mill's heat number:
 *
 *   Charge          → `Laden`        (to load)
 *   Charge (mill)   → `Kosten`       (costs)
 *   Internal charge → `Interne heffing` (an internal levy)
 *   Charge #123     → `Opladen #123` (charging a battery)
 *   Mill charge     → `Molenlading`  ("mill" read as a flour mill)
 *
 * Arabic was worse, because there `charge` was read as a criminal charge:
 * `Mill charge` → `ميل تهمة` ("mile accusation") and `Adjust charge` →
 * `التقاضي` ("litigation"). `Stock` → `Bestand` ("a file") then propagated into
 * `Stock options` → `Bestandsopties` and `Stock label` → `Bestandslabel`.
 *
 * None of that is guesswork to fix. We hold roughly a hundred screenshots of
 * easy2trade itself, written up in `docs/reference-system`, and that capture is
 * the authority on what these words are in Dutch.
 *
 * ## The three rules this table follows
 *
 * 1. **An identifier keeps its Latin form.** easy2trade's *own Dutch UI* shows
 *    `Charge` and `interne charge` unchanged, because a heat number is a code
 *    rather than a word. So the correct Dutch for `Charge` is `Charge`.
 * 2. **Where the capture shows a Dutch caption, use it verbatim** — `Voorraad`,
 *    `Technische voorraad`, `Overboeken`, `Verplaatsen`, `Splits voorraad`,
 *    `Charge aanpassen`, `Consignatie`, `Gewogen gewicht`. Matching the
 *    reference word for word is the whole point: staff cross-read the two
 *    systems, and a synonym they have never seen costs them more than English
 *    would.
 * 3. **Where easy2trade's Dutch UI itself shows English, keep English.** Its
 *    `Reden` dropdown really does read `Rejected material` · `Stock difference`
 *    · `Transfer length`, and its category dropdown really does read
 *    `2nd choice` · `Remaining` · `3rd party inventory`. Translating those would
 *    make our dropdown stop matching theirs.
 *
 * ⚠️ **Dutch and Arabic follow different policies, deliberately.** Dutch is
 * pinned to the capture because users compare the two systems side by side.
 * There is no Arabic easy2trade to compare against, so Arabic gets plain
 * Arabic — except for codes and industry designations (`Charge`,
 * `Mill finish`), which stay Latin for the same reason they do in Dutch.
 *
 * Both languages are optional per entry: an omitted language keeps whatever the
 * generated catalogue said, so this file only ever states a correction.
 *
 * 🔑 **Ellipses disambiguate, exactly as they do in the reference.** `Transfer…`
 * is the toolbar verb (`Overboeken…`); bare `Transfer` is the one-member reason
 * enum, which the reference shows in English. Same English word, two meanings,
 * told apart by the character the reference itself uses to tell them apart.
 */
export type DomainTerm = {
  nl?: string;
  ar?: string;
};

export const DOMAIN_TERMS: Record<string, DomainTerm> = {
  // ── Charge: the mill's heat number ────────────────────────────────────────
  // The whole reason this file exists. Latin in both languages.
  Charge: { nl: "Charge", ar: "Charge" },
  Charges: { nl: "Charges", ar: "Charges" },
  "Charge (mill)": { nl: "Charge (fabriek)", ar: "Charge (المصنع)" },
  "Charge (mill) / Internal": {
    nl: "Charge (fabriek) / Interne",
    ar: "Charge (المصنع) / داخلي",
  },
  "Internal charge": { nl: "interne charge", ar: "Charge داخلي" },
  "Internal charge (ours)": {
    nl: "interne charge (van ons)",
    ar: "Charge داخلي (الخاص بنا)",
  },
  "Charge (the mill’s)": {
    nl: "Charge (van de fabriek)",
    ar: "Charge (الخاص بالمصنع)",
  },
  "Current charge": { nl: "Huidige charge", ar: "Charge الحالي" },
  "New charge": { nl: "Nieuwe charge", ar: "Charge جديد" },
  "Mill charge": { nl: "Fabriekscharge", ar: "Charge المصنع" },
  // `Charge aanpassen…` is the reference's own button caption.
  "Adjust charge": { nl: "Charge aanpassen", ar: "تعديل Charge" },
  // 🔑 In this app "no charge" means **no heat number**, never "free of
  // charge" — see the report-completion dialog, which falls back to it when a
  // bundle has no charge. Dutch had it as `gratis` (free) and Arabic as
  // `لا تهم` ("doesn't matter"), both of which invert the meaning.
  "no charge": { nl: "geen charge", ar: "بدون Charge" },
  "No charges": { nl: "Geen charges", ar: "لا توجد Charges" },
  "Search customer, product or charge…": {
    nl: "Zoek klant, product of charge…",
    ar: "ابحث عن عميل أو منتج أو Charge…",
  },
  "Search product or charge…": {
    nl: "Zoek product of charge…",
    ar: "ابحث عن منتج أو Charge…",
  },
  "· charge ${line.charge}": {
    nl: "· charge ${line.charge}",
    ar: "· Charge ${line.charge}",
  },
  "Charge #${charge.id}": {
    nl: "Charge #${charge.id}",
    ar: "Charge رقم ${charge.id}",
  },

  // ── Stock, and everything the `Bestand` mistranslation infected ──────────
  Stock: { nl: "Voorraad", ar: "المخزون" },
  "Technical stock": { nl: "Technische voorraad", ar: "المخزون التقني" },
  "Technical Stock": { nl: "Technische voorraad", ar: "المخزون التقني" },
  "Stock lot": { nl: "Voorraadpartij", ar: "دفعة المخزون" },
  "Stock Lot": { nl: "Voorraadpartij", ar: "دفعة المخزون" },
  "Stock options": { nl: "Voorraad opties", ar: "خيارات المخزون" },
  "Stock label": { nl: "Voorraadlabel", ar: "ملصق المخزون" },
  "Stock remark": { nl: "Voorraad opmerking", ar: "ملاحظة المخزون" },
  "Correct stock": { nl: "Corrigeren voorraad", ar: "تصحيح المخزون" },
  "Split stock": { nl: "Splits voorraad", ar: "تقسيم المخزون" },
  "Reserved stock": { nl: "Gereserveerde voorraad", ar: "المخزون المحجوز" },

  // ── The lot ledger, read straight off `Aanmaken verplaatsopdracht` ───────
  Reserved: { nl: "Gereserveerd", ar: "محجوز" },
  Available: { nl: "Beschikbaar", ar: "متاح" },
  Technical: { nl: "Technisch", ar: "تقني" },
  "Available and movable": {
    nl: "Beschikbaar en verplaatsbaar",
    ar: "متاح وقابل للنقل",
  },
  "Reserved and movable": {
    nl: "Gereserveerd en verplaatsbaar",
    ar: "محجوز وقابل للنقل",
  },
  "On open work orders": {
    nl: "Met onderhanden opdrachten",
    ar: "على أوامر عمل مفتوحة",
  },
  "Planned relocations": {
    nl: "Geplande verplaatsingen",
    ar: "عمليات النقل المخططة",
  },
  "Total movable": { nl: "Totaal verplaatsbaar", ar: "إجمالي القابل للنقل" },
  "Total splittable": {
    nl: "Totaal splitsbaar",
    ar: "إجمالي القابل للتقسيم",
  },
  "Total correctable": {
    nl: "Totaal corrigeerbaar",
    ar: "إجمالي القابل للتصحيح",
  },

  // ── The four weights ─────────────────────────────────────────────────────
  Weighed: { nl: "Gewogen", ar: "موزون" },
  "Weighed weight": { nl: "Gewogen gewicht", ar: "الوزن الموزون" },
  "Gross weight": { nl: "Brutogewicht", ar: "الوزن القائم" },
  "Net weight": { nl: "Nettogewicht", ar: "الوزن الصافي" },
  Theoretical: { nl: "Theoretisch", ar: "نظري" },

  // ── The toolbar verbs. The ellipsis is what tells a verb from an enum ────
  "Relocate…": { nl: "Verplaatsen…", ar: "نقل…" },
  "Transfer…": { nl: "Overboeken…", ar: "ترحيل…" },
  "Correct…": { nl: "Correctie…", ar: "تصحيح…" },
  "Batch registration…": { nl: "Partijregistratie…", ar: "تسجيل الدفعة…" },
  "Reservations…": { nl: "Reserveringen…", ar: "الحجوزات…" },
  Split: { nl: "Splits", ar: "تقسيم" },
  Relocate: { nl: "Verplaatsen", ar: "نقل" },
  "Edit options": { nl: "Opties bewerken", ar: "تعديل الخيارات" },
  Reservations: { nl: "Reserveringen", ar: "الحجوزات" },
  "Batch registration": { nl: "Partijregistratie", ar: "تسجيل الدفعة" },

  // Dialog titles, verbatim from the capture.
  "Create relocation order": {
    nl: "Aanmaken verplaatsopdracht",
    ar: "إنشاء أمر نقل",
  },
  "Create transfer order": {
    nl: "Aanmaken overboekingsopdracht",
    ar: "إنشاء أمر ترحيل",
  },
  "Find location": { nl: "Locatie zoeken", ar: "البحث عن موقع" },

  // ── The dialog fields ────────────────────────────────────────────────────
  Reason: { nl: "Reden", ar: "السبب" },
  Quantity: { nl: "Hoeveelheid", ar: "الكمية" },
  "New quantity": { nl: "Nieuwe hoeveelheid", ar: "الكمية الجديدة" },
  "Current quantity": { nl: "Huidige hoeveelheid", ar: "الكمية الحالية" },
  "Execution date": { nl: "Uitvoerdatum", ar: "تاريخ التنفيذ" },
  "Include reservations": {
    nl: "Ind. reserveringen",
    ar: "تضمين الحجوزات",
  },
  "To location": { nl: "Naar locatie", ar: "إلى الموقع" },
  "To location (optional)": {
    nl: "Naar locatie (optioneel)",
    ar: "إلى الموقع (اختياري)",
  },
  "To article": { nl: "Naar Artikel", ar: "إلى المادة" },
  "From location": { nl: "Van locatie", ar: "من الموقع" },
  "From article": { nl: "Van artikel", ar: "من المادة" },
  "Movement description": {
    nl: "Voorraadmutatie omschrijving",
    ar: "وصف حركة المخزون",
  },
  "Saw order": { nl: "Zaagopdracht", ar: "أمر النشر" },
  "Saw order (optional)": {
    nl: "Zaagopdracht (optioneel)",
    ar: "أمر النشر (اختياري)",
  },
  Category: { nl: "Categorie", ar: "الفئة" },
  Quality: { nl: "Kwaliteit", ar: "الجودة" },
  Thickness: { nl: "Dikte", ar: "السماكة" },
  Length: { nl: "Lengte", ar: "الطول" },
  Width: { nl: "Breedte", ar: "العرض" },
  Bundle: { nl: "Bundel", ar: "رزمة" },
  Unopened: { nl: "Ongeopend", ar: "غير مفتوحة" },
  "Factory number": { nl: "Fabrieksnummer", ar: "رقم المصنع" },
  "Purchase deliveries": { nl: "Inkoopleveringen", ar: "توريدات الشراء" },
  "Article / stock": { nl: "Artikel / Voorraad", ar: "المادة / المخزون" },
  "Batch characteristics": { nl: "Partijkenmerken", ar: "خصائص الدفعة" },
  "Purchase order": { nl: "Inkooporder", ar: "أمر الشراء" },
  "Receipt date": { nl: "Ontvangstdatum", ar: "تاريخ الاستلام" },
  Supplier: { nl: "Leverancier", ar: "المورد" },
  Location: { nl: "Locatie", ar: "الموقع" },
  Warehouse: { nl: "Magazijn", ar: "المخزن" },

  // ── Enum values the reference's own Dutch UI leaves in English ───────────
  // Rule 3. Translating these would stop our dropdown matching theirs.
  // Arabic gets real Arabic, because there is no Arabic reference to match.
  "2nd choice": { nl: "2nd choice", ar: "الخيار الثاني" },
  Remaining: { nl: "Remaining", ar: "المتبقي" },
  "3rd party inventory": { nl: "3rd party inventory", ar: "مخزون طرف ثالث" },
  Standard: { nl: "Standaard", ar: "قياسي" },
  Scrap: { nl: "Scrap", ar: "سكراب" },
  "Rejected material": { nl: "Rejected material", ar: "مادة مرفوضة" },
  "Inventory rejection": { nl: "Inventory rejection", ar: "رفض الجرد" },
  "Stock difference": { nl: "Stock difference", ar: "فرق المخزون" },
  "Stock correction": { nl: "Stock correction", ar: "تصحيح المخزون" },
  "Transfer length": { nl: "Transfer length", ar: "طول الترحيل" },
  "Internal damage": { nl: "Internal damage", ar: "تلف داخلي" },
  Conversion: { nl: "Conversion", ar: "تحويل" },
  "To another location": { nl: "To another location", ar: "إلى موقع آخر" },
  "From another branch": { nl: "From another branch", ar: "من فرع آخر" },
  Moved: { nl: "Moved", ar: "تم النقل" },
  // The one-member reason enum, as against the toolbar verb `Transfer…`.
  Transfer: { nl: "Transfer", ar: "ترحيل" },

  // ── Consignment. `Verzending` means dispatch, which is a different thing ─
  // `Consignatie` is the reference's word, in 24 places across the captures.
  Consignment: { nl: "Consignatie", ar: "الأمانة" },
  "Consignment customer": { nl: "Consignatieklant", ar: "عميل الأمانة" },
  "Consignment duration": { nl: "Consignatieduur", ar: "مدة الأمانة" },
  "Print consignment": { nl: "Consignatie afdrukken", ar: "طباعة الأمانة" },

  // ── Metallurgy that the translator read as something else entirely ───────
  // A surface-finish designation, used in English across the trade.
  "Mill finish": { nl: "Mill finish", ar: "Mill finish" },
  // Was the noun `Warmtebehandeling` where an adjective is needed.
  "Heat treated": { nl: "Warmtebehandeld", ar: "معالج حرارياً" },
  // Arabic had `المنتج الفاسد` — "the rotten product", as of food.
  "Scrap product": { nl: "Schrootartikel", ar: "منتج سكراب" },
  // `pakhuis` for a steel warehouse, and the wrong noun for the move.
  "Warehouse Transfer": { nl: "Magazijnverplaatsing", ar: "نقل داخل المخزن" },
  // ── Charge in running prose, where the word is load-bearing ─────────────
  // Dutch for a heat number is `smeltnummer`; `lading` is a lorry's load.
  "Every bundle needs its charge — the heat number from the certificate — before these goods can become stock.":
    {
      nl: "Elke bundel heeft zijn charge nodig — het smeltnummer van het certificaat — voordat deze goederen voorraad kunnen worden.",
      ar: "كل رزمة تحتاج إلى Charge الخاص بها — رقم الصبة من الشهادة — قبل أن تصبح هذه المواد مخزوناً.",
    },
  "No internal charge left after ${lastCharge} in ${year}": {
    nl: "Geen interne charge meer beschikbaar na ${lastCharge} in ${year}",
    ar: "لا يوجد Charge داخلي متاح بعد ${lastCharge} في ${year}",
  },
  // Was `Zoekkosten` — "search costs". The translator read `Search charge` as
  // one noun phrase and billed the user for the search.
  "Search charge, purchase order, product or supplier…": {
    nl: "Zoek charge, inkooporder, product of leverancier…",
    ar: "ابحث عن Charge أو أمر شراء أو منتج أو مورد…",
  },

  // ── Two messages that lost their second half ─────────────────────────────
  // The instruction is the useful part of these, and both languages dropped it.
  "Invalid counter order data — check the fields and try again": {
    nl: "Ongeldige balieordergegevens — controleer de velden en probeer het opnieuw",
    ar: "بيانات أمر البيع المباشر غير صالحة — تحقق من الحقول وحاول مرة أخرى",
  },
  "Invalid purchase order data — check the fields and try again": {
    nl: "Ongeldige inkoopordergegevens — controleer de velden en probeer het opnieuw",
    ar: "بيانات أمر الشراء غير صالحة — تحقق من الحقول وحاول مرة أخرى",
  },

  // ── Not captions at all: code the extractor scraped by mistake ───────────
  //
  // 🔴 These are SQL fragments and react-hook-form field paths. They were
  // being "translated" — `COALESCE` became `KOLENCE`, `picks.${index}.charge`
  // became `keuzes.${index}.lading` — which is meaningless at best. Mapped to
  // themselves so the DOM bridge and the template matcher both leave them
  // exactly as they are.
  //
  // The real fix is upstream, in what `i18n-audit.mjs` feeds the translator;
  // these entries make them inert in the meantime.
  "COALESCE(${date}, DATE(${createdAt}))": {
    nl: "COALESCE(${date}, DATE(${createdAt}))",
    ar: "COALESCE(${date}, DATE(${createdAt}))",
  },
  "COALESCE(${PurchaseLineReceivals.kgActual}, 0) > 0": {
    nl: "COALESCE(${PurchaseLineReceivals.kgActual}, 0) > 0",
    ar: "COALESCE(${PurchaseLineReceivals.kgActual}, 0) > 0",
  },
  "items.${index}.qualityCode": {
    nl: "items.${index}.qualityCode",
    ar: "items.${index}.qualityCode",
  },
  "items.${index}.thicknessMm": {
    nl: "items.${index}.thicknessMm",
    ar: "items.${index}.thicknessMm",
  },
  "picks.${index}.charge": {
    nl: "picks.${index}.charge",
    ar: "picks.${index}.charge",
  },
  "picks.${index}.internalBatch": {
    nl: "picks.${index}.internalBatch",
    ar: "picks.${index}.internalBatch",
  },
  "picks.${index}.internalCharge": {
    nl: "picks.${index}.internalCharge",
    ar: "picks.${index}.internalCharge",
  },
  "picks.${index}.qtyPlanned": {
    nl: "picks.${index}.qtyPlanned",
    ar: "picks.${index}.qtyPlanned",
  },
  "picks.${index}.stockUuid": {
    nl: "picks.${index}.stockUuid",
    ar: "picks.${index}.stockUuid",
  },
  "suppliers.${i}.preferred": {
    nl: "suppliers.${i}.preferred",
    ar: "suppliers.${i}.preferred",
  },
};

/**
 * The corrections for one language, as a flat phrase map.
 *
 * Shaped to drop straight into the generated phrase catalogue, so the overrides
 * reach the **template** matcher as well as the exact-phrase one — otherwise
 * `· charge ${line.charge}` would stay wrong, since templates are compiled from
 * the phrase map rather than from the catalogue.
 *
 * English returns nothing: it is the source language, and `translateUiText`
 * short-circuits before any lookup.
 */
export const domainOverridesFor = (
  language: AppLanguage,
): Record<string, string> => {
  if (language === "en") {
    return {};
  }

  const overrides: Record<string, string> = {};
  for (const [english, term] of Object.entries(DOMAIN_TERMS)) {
    const translated = term[language];
    if (translated) {
      overrides[english] = translated;
    }
  }
  return overrides;
};
