# English-only — Dutch text still in the app

**Rule:** every word the app shows is English. Dutch labels from easy2trade
screenshots are translated when a screen is built, never copied.

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
