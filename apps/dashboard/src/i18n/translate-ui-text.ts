import baseArabic from "@/lang/ar.json";
import baseEnglish from "@/lang/en.json";
import baseDutch from "@/lang/nl.json";
import arabicPhrases from "@/lang/phrases/ar.json";
import englishPhrases from "@/lang/phrases/en.json";
import dutchPhrases from "@/lang/phrases/nl.json";
import type { AppLanguage } from "@/i18n/config";

type CatalogValue = string | { [key: string]: CatalogValue };
type PhraseCatalog = Record<string, string>;

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const addBaseTranslations = (
  output: Map<string, string>,
  english: CatalogValue,
  translated: CatalogValue,
) => {
  if (typeof english === "string") {
    if (typeof translated === "string") {
      output.set(normalize(english), translated);
    }
    return;
  }

  if (!translated || typeof translated === "string") return;
  for (const [key, value] of Object.entries(english)) {
    if (key in translated) {
      addBaseTranslations(output, value, translated[key]);
    }
  }
};

const ARABIC_OVERRIDES: PhraseCatalog = {
  Save: "حفظ",
  Saving: "جارٍ الحفظ",
  "Saving...": "جارٍ الحفظ...",
  Add: "إضافة",
  Back: "رجوع",
  Cancel: "إلغاء",
  Close: "إغلاق",
  Delete: "حذف",
  Edit: "تعديل",
  Loading: "جارٍ التحميل",
  "Loading...": "جارٍ التحميل...",
  New: "جديد",
  No: "لا",
  Search: "بحث",
  Select: "اختيار",
  View: "عرض",
  Yes: "نعم",
};

const buildCatalog = (
  translatedBase: CatalogValue,
  phrases: PhraseCatalog,
  overrides: PhraseCatalog = {},
) => {
  const catalog = new Map<string, string>();
  addBaseTranslations(catalog, baseEnglish as CatalogValue, translatedBase);
  for (const [english, translated] of Object.entries(phrases)) {
    catalog.set(normalize(english), translated);
  }
  for (const [english, translated] of Object.entries(overrides)) {
    catalog.set(normalize(english), translated);
  }
  return catalog;
};

const catalogs: Record<AppLanguage, Map<string, string>> = {
  en: buildCatalog(baseEnglish as CatalogValue, englishPhrases),
  nl: buildCatalog(baseDutch as CatalogValue, dutchPhrases),
  ar: buildCatalog(baseArabic as CatalogValue, arabicPhrases, ARABIC_OVERRIDES),
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

type TemplateTranslation = {
  expressionOrder: string[];
  pattern: RegExp;
  translated: string;
};

const templateParts = (value: string) => value.split(/(\$\{.*?\})/g);

const buildTemplates = (phrases: PhraseCatalog): TemplateTranslation[] =>
  Object.entries(phrases)
    .filter(([english]) => english.includes("${"))
    .map(([english, translated]) => {
      const expressionOrder: string[] = [];
      const pattern = templateParts(normalize(english))
        .map((part) => {
          if (part.startsWith("${")) {
            expressionOrder.push(part);
            return "(.+?)";
          }
          return escapeRegExp(part);
        })
        .join("");

      return {
        expressionOrder,
        pattern: new RegExp(`^${pattern}$`, "u"),
        translated,
      };
    })
    .sort(
      (left, right) => right.pattern.source.length - left.pattern.source.length,
    );

const templates: Record<Exclude<AppLanguage, "en">, TemplateTranslation[]> = {
  ar: buildTemplates(arabicPhrases),
  nl: buildTemplates(dutchPhrases),
};

const translateTemplate = (
  value: string,
  language: Exclude<AppLanguage, "en">,
) => {
  for (const template of templates[language]) {
    const match = value.match(template.pattern);
    if (!match) continue;

    const values = new Map<string, string>();
    template.expressionOrder.forEach((expression, index) => {
      values.set(expression, match[index + 1]);
    });
    return template.translated.replace(
      /\$\{.*?\}/g,
      (expression, offset: number, translatedTemplate: string) => {
        const value = values.get(expression) ?? expression;
        const before = translatedTemplate[offset - 1] ?? "";
        const after = translatedTemplate[offset + expression.length] ?? "";
        const wordCharacter = /[\p{L}\p{N}]/u;
        const leadingSpace =
          wordCharacter.test(before) && wordCharacter.test(value[0] ?? "")
            ? " "
            : "";
        const trailingSpace =
          wordCharacter.test(value.at(-1) ?? "") && wordCharacter.test(after)
            ? " "
            : "";
        return `${leadingSpace}${value}${trailingSpace}`;
      },
    );
  }
  return null;
};

export const translateUiText = (value: string, language: AppLanguage) => {
  const normalized = normalize(value);
  if (!normalized || language === "en") return normalized;

  return (
    catalogs[language].get(normalized) ??
    translateTemplate(normalized, language) ??
    normalized
  );
};
