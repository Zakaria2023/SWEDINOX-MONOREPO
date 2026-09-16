# Complaints (item F1, record G5)

`Overviews → Other → Complaints`, 16-9-2026. Ours: `/complaints`.

| What | Result | File |
| --- | --- | --- |
| Overview | **74 rows × 29 columns** (re-run with `Find` cleared) | `exports/f1-complaints.tsv` (`Complients 1.xlsx`) |
| Record | Complaint **40055** opened, every panel | screenshots |

---

## 1. The overview's 29 columns

`Year (Report date)`, `Month (Report date)`, `Report date`, `Complaint number`,
`Company code`, `Company`, `Customer group`, `Account manager`, `Category`,
`Status`, **`Resolution time (calendar days)`**, `Complaint description`,
`Cause`, `Explanation Cause`, `Solution`, `Explanation Solution`,
`Complaint type`, `Corresp. name:`, `Deadline`, `Order/quote`, `Product code`,
`Product description`, `Responsible`, **`Status date`**, `Captured by`,
`Purchaser/seller`, `Representative`, `Creation date`, **`Total costs`**.

Ours shows 7 (ID, company, contact, type, category, report date, product).

- `Resolution time` = **1** on 40055: report date 8-4-2025 → status `Done` on
  9-4-2025 11:29. Calendar days from report date to the status date of `Done`.
- `Status date` = the timestamp of the **latest** status-history row
  (9-4-2025 11:29:10.183).
- `Year` / `Month` are split out of `Report date` for grouping.
- `Customer group` (`HANDELAAR`, trader), `Account manager` and
  `Representative` come from the company.
- `Product description` is the **English** product name (`Cold-rolled plate
  304`) while the record shows the Dutch one (`Plaat Koudgewalst 304
  3000x1000x2mm`).
- `Total costs` = sum of the four cost amounts on the record.

## 2. The record — complaint 40055, J. op den Velde Staal B.V.

**Toolbar:** `Show company` · `Show product` | `Purchase lines` ·
`Warehouse workorders` · `Orders and Quotes` · `Pr…` (cut off).

**Header line:** *"Recorded by Adrie Noom on 08-04-2025 14:43; last changed by
Sharif Pasaribu on 09-04-2025 11:29"*.

**Top panel**

| Field | 40055 |
| --- | --- |
| Company | `13402` J. op den Velde Staal B.V. (greyed — fixed once created) |
| Account mgr / Representative | `Hego` / `Hego` — read-only, from the company |
| Complaint type | `General` |
| Contact | `-empty-` |
| Report date | 8-4-2025 |
| Category | `Wrong quantity` |
| Report (how it came in) | `E-Mail` |
| Description | *platen 3000 x 1000 x 2,0 mm. 6 stuks, gewicht is 288 kg. Er is gefaktureerd 360 kg. Prijs 2,78 p/kg. Crediteren 200,16 Euro. Order : 101365 / faktuur 501210* |
| Product | `PK30420031` Plaat Koudgewalst 304 3000x1000x2mm |
| Qty | `0` + **a unit dropdown** (empty) |
| Amount | € 200,16 |
| Weight | 72 Kg |

**Handling** (panel title shows `Status: Done`)

| Field | 40055 |
| --- | --- |
| Status | `Done` |
| Responsible | Sharif Pasaribu |
| Deadline | 8-4-2025 |
| Cause | `Production` |
| Explanation of cause | *platen geleverd op 3000 x 1000 x 2,0 mm. kwamen uit produktie order 3000 x 1250 x 2,0 mm. hierdoor zijn de kilo's lager dan inzet platen.* |
| Solution | `Price correction` |
| Explanation of solution | *Graag crediteren 360-288= 72 x 2,78 = 200,16 Euro. Credit note gemaakt 5001274* |
| Costs customer / Internal costs / Extra costs / To be reclaimed | each an amount **plus a free-text note**, all € 0,00 |
| Total costs | € 0,00 |

**Workorders** — sub-panels `Warehouse workorders` and `Transport workorders`:
a complaint can raise work orders (collect goods back, redeliver).

**Status history** — `Status`, `Status date`, `Assigned by`:

| Status | Date | By |
| --- | --- | --- |
| New | 08-04-2025 14:43 | Adrie Noom |
| In progress | 09-04-2025 11:19 | Sharif Pasaribu |
| Done | 09-04-2025 11:29 | Sharif Pasaribu |

**Documents** — `New` · `Delete` · `Open` · `Alles openen`; columns
`Description`, `File name`, `Type`, `Attached by`, `Attached`. Empty.

## 3. What the example teaches

- **The complaint names the order and invoice only in free text**
  (`Order : 101365 / faktuur 501210`); `Order/quote` in the grid is blank. The
  link is optional, not required.
- **The weight is the disputed difference, not the delivery**: 360 kg invoiced −
  288 kg real = **72 kg**, × € 2,78 = **€ 200,16** = `Amount`. Amount and Weight
  hold the claim.
- **The cost fields are not the claim** — € 200,16 was credited, yet every cost
  field is 0. Costs are what the complaint cost the business beyond the credit.
- **The credit note is a separate document** (`5001274`), mentioned in text.
  The complaint does not create it.
- Status moves **New → In progress → Done**, each step stamped with who and
  when; the grid's `Status date` and `Resolution time` read off that history.

## 4. ⚠️ The overview export is incomplete

The customer overview (C2) counts **50 complaints, 25 open**, and return lines
cite `K40000`–`K40069`. One row came back, so the filter was narrower than
intended.

**Cause found 16-9-2026:** the filter was right — `Report date` 1-1-2024 →
16-9-2026, view `-empty-` — but the grid's own **`Find` box held `velde`**, left
over from looking up the company. `Find` filters the rows on screen, and
`Show in Excel` exports only what is on screen. Redo with `Find` cleared.

The filter block has **one filter only**: `Report date` from / u/i. Toolbar:
`Save as Excel` · `Show in Excel` · `Print` · `Show Product` · `Show Company` ·
`Show Complaint` · `Show…` (greyed) | `Purchase lines` · `Warehouse workorders`.

## 5. The full export — 74 complaints, proved

Numbers **40000–40080** (7 numbers absent), every report date in **2025**
(Jan 12, Feb 9, Mar 24, Apr 20, May 5, Aug 3, Nov 1), 52 companies.

### Resolution time — proved on 74 of 74

```
Status = Done  →  Resolution time = Status date − Report date   (calendar days)
otherwise      →  0
```

43 of 43 `Done` rows match to the day (0 on 30 of them: closed the day they came
in). All 31 open rows read **0**, even where the status changed days later —
so it is *not* "days so far" for an open complaint.

### `Status date` = the timestamp of the latest status change

74 distinct values, time to the millisecond.

### The values actually used

| Field | Values (count) |
| --- | --- |
| Status | Done 43 · In progress 22 · New 9 — `On hold` never used |
| Complaint type | Order 61 · General 8 · Return Order 3 · Purchase order 2 |
| Category | Wrong material delivered 14 · Damaged 8 · Wrong quantity 8 · Wrong price calculated 5 · Incorrect delivery address 4 · Transport damage 2 · Delivered too late 1 — **blank on 32** (optional) |
| Cause | Sale 29 · Warehouse 20 · Transportation 6 · Production 6 · Supplier 6 · Customer 3 · Purchasing 1 — blank on 3 |
| Solution | Collect goods back + credit 28 · Price correction 28 · Return goods + credit + redeliver 8 — blank on 10 |

Every value is already in our enums; ours carry extra ones never used
(`On hold`, `Processor`, `Complaint rejected`, `Subsequent delivery`,
`Material retained, correct delivery`), which is fine — the reference list is
longer than its use.

### What links a complaint to a document

- **`Order/quote`** is filled on **60 of 74**: `O1xxxxx` on 58 (all type
  `Order`), `IO4xxxxx` on 2 (both type `Purchase order`). The **type decides
  which document** the complaint names. 3 `Order` complaints have no order.
- **`Purchaser/seller`** is filled on **exactly those 60** — it is the
  **seller of the linked order** (or the purchaser of the PO), read through the
  link, not typed.
- **`Product`** is filled on only **8** — the order carries the goods; the
  product field is for complaints without a document (General, Return Order).
- `Product description` is the English product name.

### Dates

- `Creation date` = `Report date` on 67; on 7 the report date is **earlier**
  (by 1–10 days) — the complaint was typed in after the customer rang.
- `Deadline` = `Report date` on 65 — the form defaults it; changed on 9.

### Costs

`Total costs` non-zero on 4: € 200 ×2, € 105,70 and **− € 955,90** — a cost
can be negative (money recovered).

### People

- `Captured by`: Marco Borsboom 26, Benno Vos 14, **INAD 9**, Arian Bloks 7, …
- `Responsible`: Sharif Pasaribu 46, Raymond Wattez 22, André van der Veen 5,
  Hamza Dabbagh 1.
- `Account manager` Hego on 71, `Representative` Hego on 72 — company fields.
- `Customer group` blank on 15 (codes like `HANDEL (E)`, `EINDGEBR` —
  stored data).

## 5b. Complaint 40025 — an `Order` complaint, with lines (16-9-2026)

Bemei B.V., *"9 platen teveel geleverd. Materiaal retour"* (9 plates too many
delivered, material returned). Recorded by André van der Veen 27-02-2025 10:10,
last changed by Sharif Pasaribu 27-02-2025 10:49, status `Done`.

**Toolbar:** `Show company` · `Show order` | `Purchase lines` ·
`Warehouse workorders` · `Orders and Quotes` · `Production workorders` ·
`Transport workorders`.

### The header grows an `Order` field

`Complaint type` = `Order` puts an **`Order:`** picker beside it — `100640`,
greyed once saved. On 40055 (`General`) the field is not there. So the type
picks **which kind of document** the header points at (sales order, purchase
order, return order, quote…), and `Order/quote` on the overview is this field.
Contact `Willian Beldman`; `Report` left `-empty-` (optional).

### The `Lines` panel — appears between the header and `Handling`

Toolbar: `New` · `Delete` · **`Shortfall`** · **`Commercial shortfall`** ·
**`Exchanging`** (greyed) · view controls.

| Column | 40025 line |
| --- | --- |
| Line | `20` — the **order line number** |
| Delivery date | 5-2-2025 |
| Product | Cold-rolled plate 304 3000x1500… |
| Dim. | 3000x1500… |
| Options | — |
| Qty(a) | **14** — delivered |
| U | ST |
| Bill of lading | **300302** — the delivery (the `30xxxx` trip series) |
| Qty(shortfall) | **9** — the quantity complained about |
| Location | **`Ontvangst`** (Receiving) — where returned goods go |
| Exchange product code / Exchange product | `-leeg-` (empty) |
| Days in system | **566** |

- **A complaint line is a delivered order line**: order line + the delivery
  (bill of lading) it went out on + delivered quantity. The line is picked, not
  typed.
- **`Qty(shortfall)` is the disputed part** of `Qty(a)` — 9 of 14 here, even
  though the complaint is *too many*: "shortfall" is the reference's word for
  the quantity in dispute either way.
- **`Location`** names where the goods come back to, which is what a
  return/collect work order needs.
- **`Exchange product`** exists for swapping a product (the `Exchanging` button).
- **`Days in system` = today − report date**: 27-2-2025 → 16-9-2026 = 566. It
  keeps counting on a `Done` complaint — unlike `Resolution time`.
- The three buttons are the actions a line leads to: **`Shortfall`** (goods
  physically short/back), **`Commercial shortfall`** (credit only, goods stay),
  **`Exchanging`** (swap for another product). What each creates is not yet
  seen — see WHAT-IS-LEFT H12.

### `Complaint lines` overview — row menu

`Show Product` (greyed on this row) · `Show Company` · `Show Complaint` ·
`Show Order`.

## 5c. Complaint 40043 — three lines, status `New`, and the status list

Konstruktie - Machinebouw Jochems B.V., order `101300`, *"adjustments to put
101300+100644 in 1 invoice"* — an invoicing complaint, not a goods one.
Recorded and last changed by Furkan Sadir 24-03-2025 13:23 / 13:30.
Category `Incorrect delivery address`, Report `E-Mail`, contact empty.

Lines 10, 20, 30 — all delivered 21-3-2025 on bill of lading **300755**, 8 / 28 /
42 ST, `Options` `Grinding (K320), Lase…` on two, **`Qty(shortfall)` 0** on all,
`Location` `Ontvangst`. So a line can be added with nothing disputed — it just
records *which* delivered lines the complaint is about.

**`Shortfall`, `Commercial shortfall` and `Exchanging` are all greyed** here,
while on 40025 (`Done`, shortfall 9) the first two were active. Either a
shortfall quantity or the handling state enables them — not settled.

Handling: `New`, Sharif Pasaribu, deadline 24-3-2025, cause `Customer`
(*"We would need to make a new order to have the 2 orders in the same invoice.
Therefore the klacht/retour"*), solution `Collect goods back + credit`, no
explanation, all costs € 0,00.

**Status dropdown:** `New` · `In progress` · `On hold` · `Done` — four values,
exactly our `complaintStatuses`.

## 5d. F2 — `Complaint lines` overview, 34 rows × 30 columns

`exports/f2-complaint-lines.tsv` (`Complient Lines.xlsx`), same filter.

Columns: the 29 of the Complaints overview (`Captured by` is called
`Created by`, `Order/quote` is `Order`, `Corresp. name:` is
`Correspondence Name`) **plus `Order line` and `Warehouse section`**.

| Check, joined to F1 on complaint number | Holds on |
| --- | --- |
| line's `Order` = the complaint header's order | **34 / 34** |
| status, resolution time, cause, solution, category, responsible, purchaser/seller | **34 / 34** each |

- **Every column except `Order line` and `Warehouse section` is the
  complaint's**, repeated on each line. The line itself contributes only *which
  order line*. That confirms our 15-9-2026 decision to keep handling on the
  complaint only.
- **Only `Order` complaints have lines**: 23 complaints, all type `Order` — 23 of
  the 61 `Order` complaints. 16 have one line, 5 two, one three, one five.
- **The same order line can appear twice on one complaint** (6 repeats — 40044
  lists lines 10 and 30 twice). The overview carries no bill of lading, but the
  record's `Lines` panel does, so most likely **one line per order line per
  delivery**.
- `Order line` values 10 / 20 / 30 / 40 / 90 — the order's own line numbers.
- `Warehouse section` = `00 Hego Almere` on all 34 — the branch, not a rack.
- `Product code` is the order line's product (filled 34 of 34), while the
  complaint header's own product is empty on 33 of those.
- Here `Report date` carries a time and equals the creation timestamp;
  `Status date` is date-only — the two overviews format differently.

## 6. Against `apps/dashboard`

The `Complaints` table already carries almost every field of the record — type,
report, report date, category, product, qty, amount, weight, status,
responsible, deadline, cause + explanation, solution + explanation, the four
costs with notes, status history and documents — and the enums match the
values seen. Gaps:

1. **Overview**: 7 columns against 29, no column picker; `Resolution time`
   (rule in §5), `Status date`, `Total costs`, `Customer group`,
   `Account manager`, `Representative`, `Captured by`, `Purchaser/seller`
   (from the linked order), `Order/quote`, `Year`/`Month` are not computed.
   The only filter is `Report date`.
2. **Qty unit** is missing on the complaint.
3. **Recorded by / last changed by** line.
4. **Workorders panel**: a complaint cannot yet raise or list warehouse and
   transport work orders.
5. Record toolbar links: company, product/order, purchase lines, warehouse /
   production / transport work orders, orders and quotes.
6. **The complaint header has no document link.** `Complaints` carries no
   order (or purchase order / return order) column; the reference's header
   `Order:` field, chosen by `Complaint type`, is missing. Today only lines
   carry `orderUuid`.
7. **Complaint lines lack the delivery facts**: bill of lading (the delivery),
   delivered `Qty(a)` beside the disputed `Qty(shortfall)`, exchange product,
   `Days in system`. `warehouseSectionUuid` is our `Location`.
8. **The line actions** `Shortfall`, `Commercial shortfall`, `Exchanging` do not
   exist.
9. **Complaint lines overview**: the 30 columns of §5d — the complaint's fields
   repeated, plus order line and warehouse section. Lines only for `Order`
   complaints.
