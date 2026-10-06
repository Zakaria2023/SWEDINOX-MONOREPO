# Language policy — and the Dutch text still in the app

> ## 🔴 The English-only rule was reversed on 6-10-2026
>
> The app now ships **Dutch, English and Arabic**, with a header switcher, and
> **Dutch is the default**. Everything below §1–§2 still applies to *source*
> strings — the code is written in English and translated at runtime, never
> keyed in Dutch — but "the app shows English" is no longer true.
>
> ### Where the authoritative Dutch comes from
>
> **This directory.** `src/i18n/domain-terms.ts` holds the corrections to the
> machine-generated catalogues, and every Dutch value in it is either read off
> an easy2trade screenshot written up here, or deliberately left in English
> because easy2trade's own Dutch UI leaves it in English.
>
> Three rules, stated in full in that file's header:
>
> 1. **An identifier keeps its Latin form.** easy2trade's Dutch UI shows
>    `Charge` and `interne charge` unchanged, because a heat number is a code.
> 2. **A captured Dutch caption is used verbatim** — `Voorraad`,
>    `Technische voorraad`, `Overboeken`, `Verplaatsen`, `Splits voorraad`,
>    `Charge aanpassen`, `Consignatie`, `Gewogen gewicht`. Staff cross-read the
>    two systems; a synonym they have never seen costs more than English would.
> 3. **Where easy2trade's Dutch shows English, keep English** — its `Reden`
>    dropdown really reads `Rejected material` · `Transfer length`, and its
>    category dropdown really reads `2nd choice` · `3rd party inventory`.
>
> ⚠️ **Arabic follows a different policy on purpose.** There is no Arabic
> easy2trade to cross-read, so Arabic gets plain Arabic — except for codes and
> trade designations (`Charge`, `Mill finish`), which stay Latin.
>
> ### What the generated catalogues got wrong, for the record
>
> `Charge` — the mill's heat number, the most important identifier in the system
> — came out as `Laden` (to load), `Kosten` (costs), `heffing` (a levy),
> `Opladen` (charging a battery) and, for `Mill charge`, `Molenlading`, with
> "mill" read as a flour mill. In Arabic it was read as a **criminal** charge:
> `Mill charge` → `ميل تهمة` ("mile accusation"), `Adjust charge` → `التقاضي`
> ("litigation"). `Stock` → `Bestand` ("a file") then spread into
> `Stock options` → `Bestandsopties` and `Stock label` → `Bestandslabel`.
>
> Nine entries were not captions at all — SQL fragments and react-hook-form
> field paths the extractor scraped, with `COALESCE` becoming `KOLENCE`. Those
> are now mapped to themselves so nothing touches them; **the real fix is
> upstream in what `i18n-audit.mjs` feeds the translator.**
>
> Still outstanding on the catalogues: 215 Dutch and 354 Arabic phrases are
> identical to the English, and 77 Dutch phrases had a placeholder glued to a
> word (survivable only because `translateTemplate` repairs the spacing at
> runtime).

**Original rule, still true of source strings:** every word written in the code
is English. Dutch labels from easy2trade screenshots are translated when a
screen is built, never copied.

**Status:** ✅ §1 and §2 fixed 16-9-2026 — a rescan finds only a person's
name. §3 (stored data) is still open. Found the same day by scanning every
label, column header, sidebar entry, placeholder and label map in
`apps/dashboard/src` (4 338 strings).

---

## 1. Sidebar page names (`lib/constants.ts`)

| Line | Now | Must become |
| --- | --- | --- |
| 268 | `CBS Documentatie` | `CBS documentation` |
| 333 | `Nesten` | `Nesting` |
| 410 | `SigmaNest geblokkeerde orders` | `SigmaNest blocked orders` |

The navbar title reads the same entries, so fixing these fixes the page header
too.

Also copied from the reference with its broken English — tidy in the same pass:

| Line | Now | Must become |
| --- | --- | --- |
| 199 | `Customerrevenue, -sales and -visits` | `Customer revenue, sales and visits` |
| 365 | `Contractgroups` | `Contract groups` |

## 2. Column headers and form fields

| File | Line | Now | Must become |
| --- | --- | --- | --- |
| `components/nesting/nesting-table-content.tsx` | 59, 60 | `Dikte`, `Kwaliteit` | `Thickness`, `Quality` |
| `components/production-capacity-details/production-capacity-details-table-content.tsx` | 60, 61 | `Dikte`, `Kwaliteit` | `Thickness`, `Quality` |
| `components/reoptimize/reoptimize-table-content.tsx` | 59, 60 | `Dikte`, `Kwaliteit` | `Thickness`, `Quality` |
| `components/production-workorders/production-workorders-table-content.tsx` | 61 | `Dikte` | `Thickness` |
| `components/warehouse-work-orders/warehouse-work-orders-table-content.tsx` | 51 | `Dikte` | `Thickness` |
| `components/companies/dialogs/purchase-order-dialog.tsx` | 238 | `Inkoper` | `Purchaser` |
| `components/contacts/contact-detail.tsx` | 106 | `BTW number` | `VAT number` |

If any of these tables also has a column declaration or an export, the export
header must change with it, so the file and the screen say the same thing.

## 3. Not code — Dutch that comes from the data

These show in the app because they are **stored values** taken over from
easy2trade, not labels in our source. They need a data decision, not a string
change:

- Product names — `Plaat Koudgewalst 304 3000x1000x2mm`, `Coil Koudgewalst
  304L 1,5 mm`. The reference itself keeps an English name beside the Dutch one
  (`Cold-rolled plate 304` on the Complaints export).
- Option names on stock and batches — `Decoilen`, `Knippen`, `Slijpen`,
  `Laser Folie`, `Blauwe Folie`, `Stempelen`, `Borstelen`.
- Free text users typed — complaint descriptions, remarks.
- Codes kept as codes — `nvt`, `HANDELAAR` customer group.

## 4. How to check it is done

- Re-run the scan (`scratchpad/dutch_scan.py` pattern: label, header, title,
  placeholder, label maps, JSX text; comments and `db/schema` skipped) — it must
  print nothing but people's names.
- Open the sidebar and each page above.
- `tsc`, `eslint`, `pnpm build`.

---

# 🟡 Queued — the i18n layer's own clean-up

Not urgent and nothing is broken by it. Parked here deliberately on 6-10-2026 so
the ERP capture keeps the floor; pick it up when the capture work pauses.

| # | Item | Why it matters | Size |
|---|---|---|---|
| **T1** | **215 Dutch and 354 Arabic phrases are still identical to the English** in `src/lang/phrases/*.json` | They render as English inside an otherwise translated screen, which reads as a bug rather than as a gap | medium — it is a translation pass, not code |
| **T2** | **Drop `"use server"` from `src/i18n/getServerLang.ts` and `getTranslation.ts`** | They are render-time helpers, not mutations. The directive publishes both as Server Action HTTP endpoints, and `getTranslation` returns `t` — a function, which cannot cross that boundary. It works today only because its one caller is a Server Component | one line each |
| **T3** | **Rename the camelCase files to kebab-case** — `getServerLang.ts`, `getTranslation.ts`, `i18nextClient.ts`, `i18nextServer.ts`, `providers/I18NextProvider.tsx` | The repo rule in `CLAUDE.md` is kebab-case for every file, whatever it exports | mechanical, touches the importers |
| **T4** | **`i18nextServer.loadLocale` falls back to `ar.json`** where `defaultLanguage` is `nl` | Unreachable today, because `normalizeLanguage` guards it — but it is wrong the moment that guard changes | one line |
| **T5** | **Filter what `i18n-audit.mjs` feeds the translator** | It scraped SQL fragments and react-hook-form field paths as if they were captions, so `COALESCE` became `KOLENCE` and `picks.${index}.charge` became `keuzes.${index}.lading`. Nine of them are neutralised in `domain-terms.ts`; the extractor will re-introduce more on the next run | small, in the audit script |
| **T6** | **77 Dutch phrases have a placeholder glued to a word** (`heffing${line.charge}`) | Survivable only because `translateTemplate` repairs the spacing at runtime — so do not simplify that helper without fixing these first | fix in the catalogue, or leave the repair in place |

⚠️ **T2 and T4 are the only ones that are strictly wrong.** T1, T3, T5 and T6
are tidying.
