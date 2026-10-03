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
