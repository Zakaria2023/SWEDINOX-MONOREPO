import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname);
const srcRoot = path.join(appRoot, "src");

const INCLUDED_ROOTS = ["app", "components", "lib"];
const USER_FACING_PROPERTIES = new Set([
  "aria-label",
  "buttonLabel",
  "cancelLabel",
  "confirmLabel",
  "description",
  "emptyMessage",
  "error",
  "heading",
  "label",
  "message",
  "placeholder",
  "searchPlaceholder",
  "submitLabel",
  "successMessage",
  "title",
  "tooltip",
]);
const MESSAGE_CALLS = new Set([
  "Error",
  "email",
  "endsWith",
  "includes",
  "length",
  "max",
  "min",
  "nonempty",
  "regex",
  "refine",
  "startsWith",
  "url",
]);
const ALWAYS_SCAN_FILES = new Set(["labels.ts"]);

const walkFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });

const normalize = (value) => value.replace(/\s+/g, " ").trim();

const looksUserFacing = (value) => {
  const text = normalize(value);
  if (text.length < 2 || text.length > 240) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^[,;:{}=]/.test(text)) return false;
  if (
    /\b(?:const|export|return|Promise|Record|NonNullable|FieldPath|UseFormReturn)\b/.test(
      text,
    )
  ) {
    return false;
  }
  if (/^(?:https?:|mailto:|\/|@\/|\.\/|\.\.\/)/.test(text)) return false;
  if (/^[.?\\&]/.test(text)) return false;
  if (/^[a-z0-9_-]+\.(?:tsx?|jsx?|json|csv|xlsx|pdf)$/i.test(text))
    return false;
  if (/^[a-z][A-Za-z0-9_-]*$/.test(text)) return false;
  if (/^[a-z0-9_./-]+$/.test(text)) return false;
  if (/^[A-Z0-9_./-]+$/.test(text)) return false;
  if (
    /===|!==|&&|\?\?|\.filter\(|\bas\s+(?:Pick|Record|[A-Z])|React\./.test(text)
  ) {
    return false;
  }
  if (text.includes("${")) {
    const visibleTemplateText = text
      .replace(/\$\{[^{}]*\}/g, " ")
      .replace(/[^A-Za-z]+/g, " ")
      .trim();
    if (!/[A-Za-z]{2}/.test(visibleTemplateText)) return false;
    if (/^(?:rem|px|mm|kg)$/i.test(visibleTemplateText)) return false;
    if (/\?\s*$/.test(text)) return false;
  }
  const tokens = text.split(/\s+/);
  if (
    tokens.length >= 3 &&
    tokens.every((token) => /^[a-z0-9_:[\]()./%#-]+$/i.test(token))
  ) {
    return false;
  }
  return true;
};

const add = (set, value) => {
  const text = normalize(value);
  if (looksUserFacing(text)) set.add(text);
};

const quotedValues = (value) => {
  const values = [];
  for (const match of value.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g)) {
    values.push(match[2]);
  }
  return values;
};

const collectFromFile = (filePath, phrases) => {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const scanEveryString = ALWAYS_SCAN_FILES.has(path.basename(filePath));

  const capture = (pattern) => {
    for (const match of sourceText.matchAll(pattern)) add(phrases, match[1]);
  };

  capture(/>([^<>{}\r\n]+)</g);

  const propertyPattern = [...USER_FACING_PROPERTIES]
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  capture(new RegExp(`(?:${propertyPattern})\\s*=\\s*["']([^"']+)["']`, "g"));
  capture(
    new RegExp(`(?:${propertyPattern})\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, "g"),
  );

  const callPattern = new RegExp(`(?:${[...MESSAGE_CALLS].join("|")})\\s*\\(`);
  for (const line of sourceText.split(/\r?\n/)) {
    if (!callPattern.test(line)) continue;
    for (const value of quotedValues(line)) add(phrases, value);
  }

  // Quoted conditional branches, for example
  // `{isPending ? "Saving..." : "Save"}`.
  for (const line of sourceText.split(/\r?\n/)) {
    if (!line.includes("?") && !line.includes("&&")) continue;
    for (const value of quotedValues(line)) add(phrases, value);
  }

  if (scanEveryString) {
    for (const line of sourceText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (
        !trimmed.startsWith('"') &&
        !trimmed.startsWith("'") &&
        !trimmed.startsWith("`")
      ) {
        const colon = line.indexOf(":");
        if (colon < 0) continue;
        for (const value of quotedValues(line.slice(colon + 1)))
          add(phrases, value);
        continue;
      }
      for (const value of quotedValues(trimmed)) add(phrases, value);
    }
  }
};

const flattenValues = (value) => {
  if (typeof value === "string") return [normalize(value)];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(flattenValues);
};

const phrases = new Set();
for (const root of INCLUDED_ROOTS) {
  for (const filePath of walkFiles(path.join(srcRoot, root))) {
    collectFromFile(filePath, phrases);
  }
}

const english = JSON.parse(
  fs.readFileSync(path.join(srcRoot, "lang", "en.json"), "utf8"),
);
const englishPhrases = JSON.parse(
  fs.readFileSync(path.join(srcRoot, "lang", "phrases", "en.json"), "utf8"),
);
const translated = new Set([
  ...flattenValues(english),
  ...Object.keys(englishPhrases).map(normalize),
]);
const all = [...phrases].sort((left, right) => left.localeCompare(right));
const missing = all.filter((phrase) => !translated.has(phrase));
const report = {
  scanned: all.length,
  translated: all.length - missing.length,
  missing,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(
    `i18n audit: ${report.translated}/${report.scanned} phrases translated; ${missing.length} missing\n`,
  );
  for (const phrase of missing) process.stdout.write(`- ${phrase}\n`);
}

process.exitCode = missing.length === 0 ? 0 : 1;
