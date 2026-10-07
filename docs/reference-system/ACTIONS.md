# Action buttons — every one seen so far

An inventory of every button, menu and grid affordance captured in the
reference system, because we have to build them. Names are **verbatim**,
including the reference's own typos and untranslated Dutch, with the English we
will use beside them.

Nothing here is built yet unless a row says so.

---

## Grid affordances — every overview has these

These are not per-screen buttons; they are how the reference's grid works, and
every one of the twelve Purchase overviews has all of them.

| Affordance | What it does | Ours |
|---|---|---|
| `Drag a column header here to group by that column` | drag-to-group, with collapsible groups | not built |
| `Enter text to search…` + `Find` | free-text search across the grid | **built** (server-side search) |
| `View` dropdown + save / save-as / delete icons | named layouts: columns, sort, grouping **and** a filter | not built |
| `Translate View…` | translate a saved view's captions | out of scope (we are English-only) |
| Per-column filter row | an operator per column — `=`, `>`, `ABC` (text) — under the header | **built** (per-column filters) |
| Bottom filter bar | the composed filter as chips, with an enable checkbox, `x` to clear, and `Edit Filter` | not built |
| Footer aggregates | `TOTAAL=` · `Som=` · `SUM=` · `AVG=` per column | partly — see the warning below |
| Row-count box | the number of rows returned, bottom centre | **built** |
| `Save as Excel` · `Show in Excel` | export; `Save as Excel` is **blocked** on this install, `Show in Excel` works | **built** (Excel export) |
| `Print` | print the grid | not built |

⚠️ **Do not copy two footer habits.** Purchase lines sums `Net Purchase Price`
— adding €/tonne across 544 lines — and the labels mix languages (`SUM=` three
times, `Som=` once). Stock on location's `AVG=` is an unweighted average.

## The `Nieuw` (New) menu — every document type

Top-left, and it is the system's whole creatable inventory:

`Action` · `Company` · `Complaint` · `Contract` · `Contract group` ·
`Counter order` · `Invoice` · `Location` · `Machine` · `Order` · `Product` ·
`Product group` · **`Purchase invoice`** · **`Purchase order`** ·
**`Purchase quote`** · **`Purchase request`** · **`Purchase return order`** ·
`Quote` · `Return order` · `Visit report` · `Warehouse section` ·
`Warehouse subsection`

**`Purchase request`** and **`Purchase return order`** have never been opened —
see [MANAGER-QUESTIONS.md](MANAGER-QUESTIONS.md) §8.

## Top-level menus

`Bestand` (File) · `Beeld` (View) · `Logistiek` (Logistics) · `Financiën`
(Finances) · **`Batch Taken`** (Batch Tasks) · `Acties` (Actions) · `Extra` ·
`Help`, plus `Nieuw` (New) · `Bewaar` (Save) · `Vernieuw` (Refresh) ·
`Terug` (Back).

`Batch Taken` is where a StockOp recalculation would live — see
[TIER1-RECIPES.md](TIER1-RECIPES.md) §3.

---

## Cross-screen navigation buttons

The same set appears on almost every screen, and they are all "open the related
thing":

| Button | Opens |
|---|---|
| `Show Product` | the product master |
| `Show Company` / `Show company` | the company master |
| `Show Purchase order` / `Show order` | the purchase order detail |
| `Show Purchase quote` | the quote detail |
| `Show Purchase invoice` | the invoice detail |
| `Show product group` | the product group |
| `Show…` / `Quotes…` | a further picker |
| `Purchase lines` | the Purchase lines overview, filtered |
| `Warehouse workorders` · `Production workorders` · `Transport workorders` | the work-order overviews |
| `Orders and Quotes` · `Order lines` | the sales side |
| `Stock on location` | the stock overview, filtered to the product |

They grey out until a row is selected. **This is a pattern worth copying** — a
consistent "related records" bar rather than ad-hoc links.

---

## Purchase quote — detail screen

**Toolbar**: `Print…` · **`Purchase order`** · `Show company` · `Show order` ·
`Options…` · `Prices…` | `Order lines` · `Orders and Quotes` ·
`Stock on location` | `Afhalen` · `Hego Prod - Lossen`

| Button | What it does | Notes |
|---|---|---|
| **`Purchase order`** | **converts the whole quote into an order** | confirms with *"This converts the entire purchase quote into a purchase order. Choose Cancel if this is not the intention."* → produced order `401154`, status `Provisional` |
| `Options…` | opens the option picker | fills the `Options` panel |
| `Prices…` | price maintenance | never opened |
| `Afhalen` | *collect* | warehouse action on a purchase document — [manager question 6](MANAGER-QUESTIONS.md) |
| `Hego Prod - Lossen` | *unload*, at Hego Production | same |

**Lines panel**: `New` · `Delete` · `Sawing specifications` · *(cube icon)* ·
*(boxes icon)* · **`Bev. Nettoprijs`** · `Purchase order` · `View` ·
`Translate Views` · *(Excel icon)*

`Bev. Nettoprijs` = *confirm net price* (Dutch **Bev**estigde **Netto**prijs).
It appears once a line exists and matches the `Bev. Nettop…` column, so a
quote's net price is **explicitly confirmed**, not derived.

**Options panel**: `New` · `Delete` · `View` · `Translate Views`

**Option quick buttons** — on both the Lines and Options toolbars:
`DUPK320` · `NG` · `K320` · `BF` · `F` · `L` · `K` · `LSR`

One click adds that option. `K320` added a `Grinding` row with
`Specificatie = K320`. `BF` is Blue Foil, `L`/`LSR` Laser, `K` *Knippen*,
`DUPK320` presumably Duplo + K320. `NG` and `F` are unidentified.

---

## Purchase order — detail screen

**The toolbar changes with the order's status.** That is the most important
thing on this page.

| Status | Toolbar |
|---|---|
| `Provisional` (`401154`) | **`Make final`** · `Print…` · `Send…` · `Return` · `Par. return` · **`Confirm`** · `Pre-notifiy` · `Show company` · `Copy` · `Workorder` · `Options…` |
| `Released` (`400253`) | `Print…` · `Send…` · `Return` · `Par. return` · `Confirm` · `Pre-notifiy` · `Show company` · `Copy` · `Workorder` · `Options…` · **`Relocate`** |

| Button | What it does | Notes |
|---|---|---|
| **`Make final`** | Provisional → definitive | **only on a provisional order** |
| **`Confirm`** | records the supplier's confirmation | almost certainly what sets [`Qty confirmed`](purchase/purchase-lines.md#-qty-ordered-and-qty-confirmed-are-process-flags) |
| `Pre-notifiy` | pre-advise a delivery | **misspelled in the reference**; ours says *Pre-notify*. Fills `Pre-announced delivery` on the receipt |
| `Send…` | e-mail / fax the order | sets the `Mailed` / `Faxed` flags, which render **red** when ticked |
| `Print…` | print it | sets `Printed` |
| `Return` · `Par. return` | full and **partial** return to supplier | greyed on both orders seen — only legal in some states. Presumably raises a `Purchase return order` |
| `Copy` | duplicate the order | feeds the `Copied from` column |
| `Workorder` | raise a warehouse/production work order | |
| `Options…` | the option picker | |
| `Relocate` | move stock between locations | **only on the released order** |

**Lines panel**: `New` · `Delete` · `Sawing specifications` · **`Calculate`** ·
`Pre-notify` · `View` · `Translate Views` + the option quick buttons

`Calculate` recomputes the line — weights, amounts, surcharges.

**Receipts panel**: `New` · `Delete` · **`Split`** · `Batch registration` ·
`Charge aanpassen…` · `View` · `Translate Views`

| Button | What it does |
|---|---|
| **`Split`** | splits a reception into instalments — **this is the mechanism** behind one purchase line showing several rows on [Purchase receivals](purchase/purchase-receivals.md) |
| `Batch registration` | register many receipts at once |
| `Charge aanpassen…` | *adjust heat number* (Dutch) |

⚠️ On a **provisional** order every one of these is greyed except `Delete`, and
`Kg(a)`/`Qty(a)` cannot be filled. **Receiving requires a final order.**

**Stock panel**: `Article` · `Group` · `Alternative` — three scopes for the
stock list beside the order.

**Previous orders panel**: `Show order`

---

## Purchase invoice — detail screen

**Toolbar**: **`Final`** · `Show company` · `Show purchase order` ·
`Unblock` *(greyed)*

`Unblock` pairs with the header's `Blocked` ☐ + `Blocking reason`, which are
separate from the invoice's status. The status carries an audit line — *"Invoice
status was last changed by Raymond Wattez on 22-1-2025 at 12:08."*

---

## Company master

**Toolbar**: `Show Word File` · `Activate` *(greyed)* | `Purchase lines` ·
`Warehouse workorders` · `Orders and Quotes` · `Production workorders` ·
`Transport workorders`

The `Debtor` panel has its own **`Update`** button beside `Open orders` /
`Open entrees`, so credit exposure is **recalculated on demand**, not live.

---

## Product master

**Toolbar**: `Save` · `Refresh` · `Back` | `Show product group` ·
`Correct products and stock` · `Activate` *(greyed)* ·
`Production workorder for stock` *(greyed)* · `Copy product (group) and…` |
`Purchase lines`

| Button | What it does |
|---|---|
| `Correct products and stock` | ✅ **opened 2-10-2026 — it is not a stock correction.** `Corrigeren lengte artikel en voorraad`: changes a product's **length / over-length** or its **stock unit**, with a `Reden` enum and a `Simuleer` dry run. The per-lot `Correction…` on the `Stock` panel is the quantity tool |
| `Production workorder for stock` | make-to-stock production |
| `Copy product (group) and…` | duplicate a product or a whole group |
| `Activate` | greyed — so a product can be inactive |

The `Descriptions` block has **`T`** and **`W`** buttons beside the three
description fields; unidentified.

---

## Stock on location

**Toolbar**: `Save as Excel` · `Show in Excel` · `Print` · `Show Product` ·
**`Change APP…`** · **`Toon reserveringen…`** | `Purchase lines` ·
`Warehouse workorders` · `Orders and Quotes`

| Button | What it does |
|---|---|
| `Change APP…` | **a price change.** The product-search dialog shows `APP` as a per-tonne price (`2050 / TN`), beside a `Purchase price` column reading the same |
| `Toon reserveringen…` | *show reservations* — never opened |

---

## The product-search dialog

Reached from any line's product picker.

**Buttons**: `Search` · `Use selected product` · `Reset dialog` ·
`Restore default settings` · **`Reserveringen…`** *(show reservations)* ·
`Cancel`

**Controls**: `Search with margin` ☑ with a **5 %** tolerance per dimension ·
`Only products with available stock` ☐ · **`1e keus`** / **`2e keus`** ☐
(*first / second choice*) · tabs **`Stock` | `Purchase` |
`Internal production`**.

`Reset dialog` and `Restore default settings` are two different resets — worth
noting, since we would normally build one.

---

## 🔴 Buttons never opened

Worth one screenshot each if the screen they sit on ever comes into scope:

| Button | Screen |
|---|---|
| `Prices…` | purchase quote detail |
| `Afhalen` · `Hego Prod - Lossen` | purchase quote detail |
| `Toon reserveringen…` · `Change APP…` | stock on location |
| `Reserveringen…` | product-search dialog |
| `Return` · `Par. return` · `Relocate` · `Workorder` | purchase order detail |
| `Batch registration` · `Charge aanpassen…` | receipts panel |
| `Correct products and stock` · `Copy product (group) and…` | product master |
| `Show Word File` | company master |
| `T` / `W` | product master descriptions |
| `NG` · `F` · `DUPK320` | option quick buttons — unidentified |
| `Print` | every overview |


---

## ✅ A6 — the two never-opened forms, 7-10-2026

Both opened from `Nieuw`, photographed empty, closed without saving.

### `Purchase request`

Banner on open: ⚠️ *"Supplier is required"*. *"Creation date: 7-10-2026"*.

| Block | Fields — and what a new one defaults to |
|---|---|
| Header | `Supplier` (…) · `Agent` (…) · `Contact` · `Reference` · `Purchaser` · `Order category` `-leeg-` |
| `Finances` | `Payment terms` — **greyed until a supplier is chosen** |
| `Delivery` | `Delivery terms` · **`Delivery address` prefilled `Bolderweg 10, 1332AT, Almere`** (our own yard) · `Arrange transport` ☐ · `Pick up/Drop-off CD-purchases` greyed until transport is arranged · `Supplier address` greyed · ⦿ `Date` **`1-1-0001`** (the null sentinel) / ○ `Week` `41` `Year` `2026` · `Rem` |
| Right | `Purchase order type` **`Materials`** · second type `-leeg-` · **`Overlength` ☑ by default** · `Printed` · `Mailed` · `Faxed` · `Message sent via StaalWeb` greyed |
| `Follow-up` | **`Deadline` `8-10-2026`** — creation date + 1 day |
| Panels | `Lines` (0) · `Texts` · `Documents` (0) · `PDF Files` |
| Toolbar | `Make final · Print… · Send… · Purchase quote · Purchase order · Show company · Copy · Options…` |

🔑 **A request converts two ways** — `Purchase quote` and `Purchase order`
are both on its toolbar. It is the step *before* buying: ask a supplier,
then either collect a quote or order outright.

### `Purchase return order`

No creation-date line; the document is dated by its `Return date`.

| Block | Fields — and defaults |
|---|---|
| Header | `Supplier` (…) · **`Purchase order`** greyed · **`Complaint`** greyed · `Contact` · `Purchaser` |
| `Invoicing` | `Payment terms` |
| `Delivery` | **`Return date` `7-10-2026`** (today) · **`Return reason`** dropdown · **`Drop-off` ☐** · `Delivery address` greyed until drop-off is ticked · **`Pick-up`** (…) |
| Right | `Purchase order type` `Materials`, greyed · `Printed` / `Mailed` / `Faxed` greyed · Summary (Materials · Options · Surcharges · excl. · VAT · incl. · `Total weight` `0 Kg`) |
| Panels | `Workorders` · `Lines` (0) · `Surcharges` · `Invoice lines` · **`Complaints`** · `Logistics` · `Texts` · `Documents` (0) · `PDF Files` |
| Toolbar | `Make final · Print… · Send… · Show company · Show purchase order · Show complaint` |

🔑 **A purchase return hangs off a purchase order and, optionally, a
complaint** — both fields greyed on a blank form, so they are filled by
raising the return *from* the order or complaint, not typed. It has its own
`Workorders` (the warehouse picks the metal to send back), `Surcharges` and
`Invoice lines` (the credit), and the supplier either collects (`Pick-up`)
or we deliver (`Drop-off`).

✅ **Our schema already matches both** — `PurchaseRequests` has `deadline`,
`isOverlength`, `deliveryAddressUuid`, `arrangeTransport`;
`PurchaseReturnOrders` has `complaintRef`, `returnDate`, `returnReason`,
`isDropOff`, `pickupAddress`, `purchaseOrderUuid`. Two defaults differ —
queued as PLANNED-CODE-CHANGES-7 §18.


**`Return reason`, opened 7-10-2026:** `Damaged` · `Wrong quantity` ·
`Wrong material delivered` · `Delivered too late` · `Not delivered` ·
`Transport damage` · `Incorrect delivery address` — seven, plus a clear
button. ✅ **Identical, value for value and in order, to our
`purchaseReturnOrderReasons`.** Nothing to change.


---

## ✅ J8 — `Par. return` pressed, 7-10-2026, on purchase order `404102`

**Where the return buttons wake.** On `401466` (every line `Invoiced`)
`Return`, `Par. return`, `Confirm` and `Pre-notify` are all greyed. On
**`404102`** — Albko Metallhandel, header `Released`, 31 lines: 4
`Expired`, 18 `Received`, 8 `Invoiced`, 4 `Released` — **`Par. return` is
live, `Return` is greyed**, and `Confirm`, `Pre-notify`, `Workorder`,
`Options…` are live. So a partial return needs at least one line still
`Received`; a full return evidently needs every line received, which this
order is not.

**What `Par. return` does: it creates the return at once.** No dialog — the
tab opens already saved (no `*`), headed *"Purchase return order 950034,
Albko Metallhandel GmbH & Co. KG … - Provisional"*:

| Field | Filled with |
|---|---|
| number | **`950034`** — the next in the `IR950xxx` series after `IR950033` |
| `Supplier` | `13684` Albko Metallhandel GmbH Co. KG |
| **`Purchase order`** | **`404102`**, greyed |
| **`Complaint`** | **`40412`**, greyed — **a complaint is raised with the return** |
| `Contact` | Joris Hezemans — the order's contact |
| **`Purchaser`** | **Ayam Kalash — the user who pressed the button**, not the order's buyer (Arian Bloks) |
| `Payment terms` | `Within 30 days from date of invoice` — the order's |
| **`Return date`** | **`8-10-2026` — tomorrow** |
| `Return reason` | blank |
| `Drop-off` | ☐ |
| `Delivery address` | **`Am Rennfeuer 2, D-27777, Ganderkesee`** — the supplier's, greyed |
| `Pick-up` | **`Bolderweg 10, 1332AT, Almere`** — our yard |
| `Purchase order type` | `Materials`, greyed |
| Summary | all € 0,00, `0 Kg` |
| Toolbar | `Make final` live; `Print… · Send… · Show company · Show purchase order · Show complaint` greyed until final |
| `Lines` | **0** — the line selected on the order was *not* copied |

Lines grid columns: `Code · Order line · Product · Description · Qty(p) ·
Qty(a) · U · Length · Delivery date · Kg(p) · Kg(a) · Gross Pri… · U · Line
Discount · U · Group Disco… · U · Amount · Status`. **`Order line` is the
link from each return line back to the purchase line it returns.**

🔑🔑 **What this settles about returns:**

- A purchase return is **raised from its order**, never typed from blank —
  that is why `Purchase order` and `Complaint` are greyed on `Nieuw →
  Purchase return order`.
- **Every return opens a complaint.** `Complaint 40412` exists the moment the
  return does; the `Complaints` panel and `Show complaint` button hang off it.
- Direction is fixed: **pick-up at our yard, delivery to the supplier**.
- It starts empty and **`Provisional`**; lines are added afterwards, each
  pointing at an order line.

⚠️ **Test-data left behind on HEGO TEST:** provisional return `950034` and
complaint `40412`, both against `404102`. Not made final. A blank line `320`
was also added to `404102` by pressing `New` on the order's own grid and
removed again.

**Also seen on `404102`:** lines `10`–`40` carry **`For line` `O107757/10`
… `/40`** — purchase lines raised *for* sales order lines — and are
`Expired` at `Qty(p) 0`; the lines that actually arrived (`50`–`210`,
26-8-2026) have no `For line`. The header's `Reference` reads `107757 EU
+3.1 - 2026-402702 +402703`. `New` on the order's line grid adds an
inline row — code `320`, the next ten; status `Provisional`; delivery date
the order's (`10-9-2026`); category `Standaard`; product picked through the
cell's `…` button.


### `Lines → New` on the return — `Create Purchase Return order lines`, 7-10-2026

A picker, not a blank row. Title **`Create Purchase Return order lines`**,
buttons **`All receipts` · `OK`** (greyed until a row is ticked) **·
`Cancel`**. Columns:

`Is Sele…` ☐ · `Line num…` · `Receipt date` · **`Bill of lad…`** · `Qty` ·
`U` · `Product` · `Length` · `Width` · **`Charge`**

| Line | Receipt date | Bill of lading | Qty | Width | Charge |
|---|---|---|---|---|---|
| 220 | 8-9-2026 | `060523` | 1 ST | 350 | `25036/122` |
| 220 | 8-9-2026 | `060523` | 2 ST | 350 | `25036/122` |
| 230 | 8-9-2026 | `060523` | 2 ST | 300 | `25036/122` (×3 rows) |
| 240 | 8-9-2026 | `060523` | 2 / 2 / 1 ST | 175 | `25036/122` |
| 250 | 8-9-2026 | `060523` | 3 ST | 150 | **`25020/292`** |
| 250 | 8-9-2026 | `060523` | 1 ST | 150 | `25036/122` |

All `Aluminium coils A…`, length `999999`.

🔑🔑 **A return line is picked per *receipt*, not per order line.** Line
`220` appears twice and `230` three times — one row for each parcel that
came in against it, each with its quantity, the **bill of lading** it
arrived on and its **charge** (heat number). Line `250` holds two heats.
So what goes back is a specific parcel of a specific heat on a specific
delivery note, which is what a supplier needs to credit it.

🔑 **The default list is one delivery, not the whole order.** Every row is
bill of lading `060523` of 8-9-2026 — lines 220–250, the ones invoiced that
day — though the order's `Received` lines 50–210 (26-8-2026) are also
returnable. **`All receipts`** widens it. So the dialog opens on the latest
delivery, which is the usual one to send back.

⚠️ Context for that delivery: `IR950033` (17 lines, −8 752 kg, 8-9-2026)
returned against this same order, and lines 260–290, ordered for
10-9-2026, repeat 220–250's widths and quantities. Likely: the 8-9 delivery
went back and was re-ordered. Not proved from these screens — why those
receipts are still offered after a return is open.

Cancelled; nothing added to `950034`.


---

## ✅ J8 — `Change APP…`, 7-10-2026, and K5 answered

Right-click on a lot in `Stock on location` → **`Change APP…`**. The dialog
that opens is in Dutch, and **its price block is headed `Gip`**:

| Block | Fields |
|---|---|
| `Artikel` (selection, greyed when opened from one lot) | `Gipgroep` · `Naam` · `Artikelgroep` · `Kwaliteit` · `Voorraadcategorie` · `Opties` · `Lengte` / `T/m` · `Breedte` / `T/m` · `Dikte` / `T/m` · **`Check`** |
| **`Gip`** | **`Huidig`** `€ 0,00` *One hund…* · **`Nieuw`** `€ 0,00` *One hund…* (editable) · **`Wijzig`** (greyed until a new value is typed) |
| Grid | `Artikel · Lengte · Breedte · Dikte (mm) · Voorraad… · Kwaliteit · Opties · Opmerking · Hvh Eh · Hvh · Gewicht · Totale len… · Waarde · Nieuwe w…`, with totals |
| Footer | `Sluit` |

The one row: `2009100`, 1273 × 1100 × 1, `S235`, `1 ST`, **11,2024 kg**,
total length 1,273 m, **`Waarde` € 0,00 → `Nieuwe waarde` € 0,00**.

🔑🔑 **K5: `Gip` is APP.** The toolbar button says `Change APP…` and the
dialog it opens calls the same price `Gip` — *Gemiddelde inkoopprijs*,
average purchase price. Every `Gip` in the reference (`Gipgroep` on stock,
`Gip → Artikelgroep` on the product, `GIP groepen` under `Financiën`) is the
APP grouping.

🔑 **What the button does:** it **revalues stock in bulk by APP**. The
`Artikel` block selects lots — by APP group, article group, quality, stock
category, options and dimension ranges — `Check` lists them, `Nieuw` takes a
new APP, and the grid shows each lot's value before and after (`Waarde` →
`Nieuwe waarde`); `Wijzig` applies it. Opened from a single lot, the
selection is fixed to that lot and greyed.

The APP is quoted per *One hund…* — the unit caption is cut off; most
likely **per hundred kilos**. ⚠️ Not confirmed.

✅ **It ties back to G9.** `2009100` 1273 × 1100 is the same piece the
stock-mutations export books as a `Rest production` offcut at **€ 0** (work
order `300513`). This dialog shows it still carries APP € 0 and value
€ 0,00 — the offcut valuation gap, seen on the live lot.

Cancelled with `Sluit`; nothing changed.
