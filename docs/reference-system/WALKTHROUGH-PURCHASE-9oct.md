# Purchase walkthrough, 9-10-2026 — step by step against easy2trade

The method: one step in easy2trade (HEGO TEST), a screenshot, the same step in
our app, compare, fix, next. Reference order **404355**, supplier **11692
Holland Stainless Int**, article **PK304L20021**, 10 ST at € 2.500/TN. Our
counterpart: order **#478**.

Nothing was printed, mailed or sent to the supplier. `Make final` offered to
e-mail `ron.bongers@hollandstainless.com` — **`Don't send` → OK** every time.

## What the reference does, step by step

| Step | easy2trade | What we had to change (commit) |
|---|---|---|
| 1 Blank order | `Materials`, weight type `-leeg-`, `Overlength` ☑, four sent-stamps greyed, delivery address our yard, Date `1-1-0001`, week 41 greyed, purchaser = signed-in user. Choosing the supplier fills contact, `Prepayment`, `(CPT)`, Date = next working day (Fri 9-10 → Mon 12-10, week 42); banner `Purchase order 404355, Holland Stainless Int, Tel …, Fax: - Provisional` | defaults, supplier defaults, banner, searchable supplier with code (e9638236) |
| 2 Lines | `0 lines`; `New` adds `10 · 12-10-2026 · Provisional · Standaard`; product via the `Voorraad` window, which opens **empty**, From/To per dimension with 5 % each, Productgroep/Kwaliteit/Bewerking dropdowns, `Alleen artikelen met technische voorraad`, article grid above, `Voorraad / Inkoop / Interne productie` tabs below, first article pre-selected, footer Charge · Interne charge · Locatie · Inkoop · options | the window rebuilt; lines as a grid with the reference's toolbar; Quality dropdown code + EN (ee43175f) |
| 3 Pick article | line takes the **article's** quality `304L`, `2000x1000x2mm` appended to the description, `ST`, price per `TN`, Qty(p) `0` | article unit on the line, quality read off name/code when the record is blank (0 of 5 626 products carry one), dims fallback (ee43175f) |
| 4 Qty 10, price 2500 | Kg(p) 314, M1(p) 20, Amount € 785,00; Summary € 785 / VAT € 164,85 / € 949,85 / 314 Kg; supplier, type, weight type, Overlength and the date block **grey once a line exists** | header in two columns, locked fields, VAT 21 % (ee43175f) |
| Save | stays on the same screen, panels filled, reception `New`, line `Provisional` | save lands on the order page; order page = the form + toolbar + panels in the reference order; every panel from Options to PDF Files (cd6196ee) |
| 5 Make final | releases; opens the **print preview** (INKOOPORDER); asks `Versturen`: Don't send / send e-mail to contact, fax + StaalWeb greyed, `Open met mailprogramma`; banner `Released, Printed` | Printed stamp, print page, send dialog, Mailed stamp on send (cd6196ee) |
| 6 Confirm | `HSI-1001`, 14-10-2026 → **header Date → 14-10**, reception Delivery date + Pre-announced → 14-10, line keeps 12-10, Released | (1e5cac4f) |
| 7 Pre-notify | `VZ-2600101`, 14-10 → reception **`Workorders created`**, ✓ `Pre-notified`, **unloading work order 327402 raised by itself**; line date → 14-10; `Workorder` button then raises nothing (one open slip at a time); a text "Please note that this position was changed" appears on the order | (438a12b1, 26c24a9c) |
| 8 Work panel | `Magazijn opdrachten` tree Day → Type → Order → Line; footer tabs Voorraad / Order / Opties / Teksten; toolbar Alles Selecteren · Details · Vrijgeven · Vrijgeven zonder voorraadlabels · Voorbereiden · Gereedmelden… · Goedkeuren | footer, Select all, Prepare, columns in the reference order (c7b53397) |
| 9 Vrijgeven | acts on the **order node**; opens Windows' print dialog for the slip; then `Gereedmelden…` wakes on the **line** | release still required before reporting (ffe4df22) |
| 10 Gereedmelden losopdracht | title `… 327402/1, 10 ST Cold-rolled plate 304L 2000x1000x2mm`; Uitgevoerd op (datetime), Door; **one row per piece**, first row carries the full 10 / 314 kg; **internal charge `26AQWF` already on every row**; Naar `Ontvangst`; columns Voor order · Hvh · Lengte · Breedte · Dikte · Gewicht · Gewicht bruto · Gewogen gewicht · Meters · Naar · Interne charge · Interne partij · Charge · Partij · Plaatnummer; totals Hvh · Lengte · Gewicht; OK greyed | dialog rebuilt (ffe4df22) |

## Not done yet on this chain

- Step 11: fill the dialog (Door, Charge, Gewogen gewicht) → OK → the stock
  lot. **Resume here.** Then compare the lot on both sides (Stock panel on the
  order, location `Ontvangst`, value, charge `26AQWF`), certificates, return.
- Lines on a **saved** order: New / Delete (greyed on ours).
- Work panel filters Sectie / Subsectie / Naar and the `1 2 3 4` level buttons.
- Report dialog: Batch and Plate number are shown, not taken.
- The printed order is an HTML page, not a PDF.
- The auto text on the order when a position changes.
- Stock labels on release.
- Payment terms editable on ours; greyed on the reference (Creditor panel rule).

## Data notes

- Our Holland Stainless Int (`11692`) was given a contact Ron Bongers (no
  e-mail), `Prepayment`, `CPT`, telephone `06 5065 6338`; our own company
  `HEGO TEST Stainless Steel & Aluminium` (role `internal`) with the yard
  address Bolderweg 10, 1332AT Almere — the blank order's delivery address.
- `PK304L20021` exists six times in our catalogue; only one copy carries
  dimensions. The reference's article weighs 31,4 kg/piece (density 7,85);
  our test lot gave the same figure, so the summary matched exactly.
- Order #478 was created before the create action was fixed, so it started
  `Released` with its line `In progress`; a new order starts `Provisional`.
