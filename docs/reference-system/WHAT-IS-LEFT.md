# What is left in the old system

**This is the one list.** Everything still to be taken out of easy2trade, with
the exact clicks for each item. No time estimates anywhere — the order is by
what a wrong answer costs, not by how long it takes.

Every item has a **number**. When you send something, send the number with it.
"Item B4, here it is" is enough. If an item turns out to be impossible, greyed
out, or returns nothing — **that is still an answer.** Say which number and what
happened, and it comes off the list.

> Where this sits: [COVERAGE.md](COVERAGE.md) says how much is built.
> **This file says what is still unknown.** When this list is empty, there is
> nothing left to discover — only code to write.
>
> **To actually do the work, use [CAPTURE-RUNSHEET.md](CAPTURE-RUNSHEET.md)** —
> the same items, everything still open, reordered into seven sittings with the
> clicks spelled out. This file stays the record of *why* each one matters.
>
> **Part H has its own runsheet: [FLOWS.md](FLOWS.md)** — the twelve write-flows,
> each with the record codes picked out of the exports so the flow starts from a
> record already in the right state, and what changes in the code when it lands.

---

## ✅ Answered 21-9-2026 — live is the same as test

**Swedinox confirms the live system is exactly the same as `HEGO TEST`** — same
ledger, same batch jobs.

This was the last open qualifier on the whole project, and it is a good answer:
every finding taken off `HEGO TEST` — ~130 000 exported rows, the AFAS sync, the
eight batch jobs, the security profiles, the error log — now describes the
**live** system too. **No capture needs repeating against a second environment.**

It also removes an excuse. `Batchscheduler is not active` had been set aside as
an artefact of a test copy; it is the live configuration, so the overdue-posts
rule may genuinely be running on frozen open posts. See K10 and K12.

---

## Re-captured 18-9-2026 — three Finance screens, verified again

Not new screens: `Credit information customers`, `Financially blocked quotes and
orders` and `Control Stock increase due to external processing` had all been
captured before. Re-exported and re-read on 18-9-2026, they still **changed the
code**, which is the argument for re-exporting a screen you think you know.

| Screen | Rows | What it changed |
| --- | --- | --- |
| `Credit information customers` | 2 593 × 35 | Every credit rule re-proved (2 593/2 593). Gave the **age-of-debt column**, and four more switched-off features. See [credit-and-blocking.md](credit-and-blocking.md) |
| `Financially blocked quotes and orders` | 31 × 13 | All three blocking rules re-proved. 18/18 held orders have an oldest-due date |
| `Control Stock increase ext. processing` | 483 × 16 | 🔴 Found our screen reading the **wrong movement reason**, joining the **wrong document**, and hiding **167 of 483 rows**. See [external-processing.md](external-processing.md) |

---

## The score

The `Overviews` tree has **116 screens** across nine groups (112 until 16-9-2026, when the `Other` group was photographed open and turned out to hold 9, not 5).

| | Screens | State |
|---|---|---|
| Purchase | 11 | ✅ all captured |
| Logistics | 32 | ✅ all captured |
| Finance | 14 | ✅ all captured |
| Suppliers | 5 | ✅ all captured |
| Sales | 19 | ✅ all captured |
| **Customers** | 15 | ✅ all captured |
| **Companies** | 6 | ✅ all captured |
| **Batch registration** | 5 | ✅ all captured |
| **Other** | 9 | ✅ all captured |

🎉 **116 captured. 0 left** (18-9-2026). **Every screen in the `Overviews` tree has now been seen.** What remains is not screens: records to open (Part G), flows to watch (Part H), retries (Part I), small items (Part J) and questions for a person (Part K).

### ⚠️ "But I sent you the Sales sheets"

The 19 workbooks captured on 10-9-2026 were read in full — and **not one of them
was a Sales screen.** Checked against each file's own header row:

| Group | Files | Screens |
|---|---|---|
| Finance | **10** | Journal entries · Cost price for selling of invoices to be sent · Purchase invoices to be received · Purchase orders to be received · Credit information customers · Financially blocked quotes and orders · CD-deliveries in progress · Control stock increase ext. processing · Control sawing waste · CBS Documentatie |
| Suppliers | **4** | Suppliers · Supplier revenue · Supplier revenue per revenue group · Contact persons suppliers |
| Logistics | **5** | Customer stock on location · Revenue per product · Reservations · Production capacity · Production capacity details |
| **Sales** | **0** | — |

From the Sales menu itself came **four screenshots**: `Contracts` and
`Contractgroups` (both ✅ done — `Contracts` proved that a contract declares
what it adjusts), plus `SFN statistics` and `Revenue w.r.t. Budget`, whose grids
were empty because `Year`/`Month` was blank. ✅ **Both re-run 18-9-2026 with
`2025` / `1` and both have data** → [sales-statistics.md](sales-statistics.md),
which closes the Sales group at 19.

**Three of those files look like sales screens and are not.** `Revenue per
product`, `CD-deliveries in progress` and `Credit information customers` carry
revenue, profit margin, order types and customer credit — but they live in the
Logistics and Finance menus, and they are **reports about** selling, not the
documents that do it. No order, order line, quote line, invoice, invoice line,
delivery or price row has ever been exported.

That gap is exactly the one that has bitten this project twice: `Profit margin`
was proved across **2 702** rows of a report, while **discounts cascading was
proved on one quote line.** The reports are dense; the documents are unseen.

And one whole dimension has never been touched at all: **the menus above
`Overviews`.** `Bestand`, `Beeld`, `Logistiek`, `Financiën`, `Batch Taken`,
`Acties`, `Extra` — we know their names and nothing else. Settings live in
there, and so does the answer to the one red question in the code.

---

## The recipe — read this once, use it for every screen

Every screen in Parts B–F is the same five moves.

1. Open the screen from `Overviews`.
2. **Set `View` to `-empty-`.** This is not optional. The export carries the
   *current* view's columns, so a column hidden in the view is **missing from
   the file**, not blank in it. `Trip data` gave 7 columns on its own view and
   20 on `-empty-`, and the 13 missing ones were every cost column.
3. **Widen every filter — but never blank a `from` box.** Blanking `from` voids
   the filter and returns **zero rows**. Type a real date: `1-1-2024`. Text
   filters already hold `zzzzzzzzzzzzzzz` as their no-upper-bound sentinel —
   leave that alone.
4. Press `Show Data`. 📸 **screenshot the filter block and the grid together**
   — the filter block is half the evidence.
5. `Show in Excel`, **leave the workbook open**, and tell me. I read it straight
   out of the running Excel. (`Save as Excel` is blocked on this install.)

### ⚠️ The filter that lies

If a screen filters on **`Year` / `Month`** instead of a date range, it will say
*"leave blank for current"*. **Blank means September 2026, not "all time".** An
empty grid from a blank `Year`/`Month` proves nothing — it cost us a whole wrong
conclusion once, published and retracted.

**On any `Year`/`Month` screen: type `Year` = `2025`, `Month` = `1`.** The
database is dense January–May 2025 and nearly empty after, so January 2025 is
where the rows are.

### ⚠️ When `-empty-` itself breaks the screen

`Customers and Prospects` (C1) answers `View` = `-empty-` with a **Database
error**:

> The column "DeliveryTerm" was expected but did not occur in
> "GetReportData_CustomerAndProspect".

That is a bug in the reference, not a mistake in the capture: the `-empty-` view
asks for a column the report procedure does not return. **Fall back to any other
view**, export it, and say which view it was — a short column list is worth more
than an error box. If the screen has two views, export both and the hidden
columns can be recovered by diffing them.

---

### ⚠️ Two date filters

Some screens have two (`Deviations in count lists` does). They `AND` together,
so a row must satisfy both. If a screen comes back empty and it has two date
filters, that is usually why — try again with only one widened.

---

# Part A — The menus nobody has opened

🔴 **Highest value on the whole list**, and none of it needs data. Just open
each menu and photograph it open. Where a menu item opens a window, open it and
photograph that too.

| # | Menu | Why it matters |
|---|---|---|
| **A1** | **`Extra`** | 🟡 **opened 14-9-2026 — no settings in it.** Four items only: `Optimalisatie per zaagmachine…` (optimisation per saw machine), `Telopdracht artikelen…` (stock-count assignment for articles), `Import ▸`, `Export ▸`. The overdue-days number is **not** here, and G12 proved it is not on the customer either — it is a system setting in some other menu. **Submenus photographed:** `Import ▸` = `Import artikelprijzen…` (article prices), `Import artikel instellingen…` (article settings), `Import op- en afboekingen…` (stock postings in/out), `Import orderbericht…` (order message — an EDI-style order import), `Import bedrijf instellingen` (company settings). `Export ▸` = `Exporteer producten` only. **Five bulk imports exist** — prices, product settings, stock postings, incoming orders, company settings; our app has none |
| ~~**A2**~~ | ~~`Acties` (Actions)~~ | ✅ **14-9-2026** — two items only: `Show Word File`, `Activate` (greyed). Nothing else |
| ~~**A3**~~ | ~~`Batch Taken` (Batch Tasks)~~ | ✅ **14-9-2026** — 🔴 **eight jobs, three of them sync with AFAS**: `Aanmaken facturen` (create invoices), **`AFAS Synchroniseer openstaande posten`** (open posts), **`AFAS Synchroniseer bedrijven`** (companies), **`AFAS Synchroniseer journaalposten`** (journal entries), `Bijwerken Inkoopordersamenvattingen` / `Bijwerken Ordersamenvattingen` (refresh purchase / sales order summaries), `Maand statistiek`, `Statistiek`. See **"The ledger is AFAS"** below |
| ~~**A4**~~ | ~~`Logistiek` and `Financiën`~~ | ✅ **14-9-2026** — `Logistiek`: `Magazijn opdrachten`, `Productie opdrachten`, `Transport opdrachten` (warehouse / production / transport work orders), `Productieschema Leveranciers` (supplier production schedule). `Financiën`: **`GIP groepen` only** |
| ~~**A5**~~ | ~~`Bestand` and `Beeld`~~ | ✅ **14-9-2026** — `Bestand`: `Nieuw ▸` (22 document types, below), `Bewaar`, `Vernieuw`, `Delete`, `Sluit Werkpaneel`, `Wachtwoord wijzigen…`, `Afsluiten`. `Beeld`: `Terug`, `Alles Dichtklappen`, panels (`Zoekpaneel`, `Takenpaneel`, `Overzichten`, `Magazijn`, `Assortiment`, `Website`), `Werkbalken ▸`, `Herstellen`. **No settings screen in either** |
| **A6** | `Nieuw` → `Purchase request`, and `Nieuw` → `Purchase return order` | The two document types in the New menu that no screen has ever shown. Open each, photograph the empty form, close without saving |

## ✅ Every menu is now open — 14-9-2026

The menu bar is `Bestand · Beeld · Logistiek · Financiën · Batch Taken · Acties
· Extra · Help`, and every one has been photographed. Three conclusions:

### 1. There is no settings screen in the menu bar

Not in `Bestand`, `Beeld`, `Extra`, `Financiën` or `Acties`, and not on the
customer's `Debtor` panel (G12). **The overdue-days threshold cannot be read
from the application.** K1 now needs a person — most likely INAD (K11), not
Swedinox.

> ⚠️ **Correction 15-9-2026:** the left tree has a **`System info`** group that
> was never opened — `Database tables`, `Errors`, `Geopende werkpanelen`,
> `Active Logins`, `Security profiles`, `Task profiles`, `EDI`,
> `Stock value check`. `Database tables` is now captured
> ([database-schema.md](database-schema.md)): the threshold is **stored as data**,
> almost certainly in `TASK_PARAMETER` (an int per stored procedure). One SQL
> query by someone with database access answers K1.
> `Errors` is captured too ([error-log.md](error-log.md)): it answers K11 and
> reshapes K10/K12 — the ledger during live use was **Multivers**, and the
> database is a copy frozen around **mid-May 2025**.
> The other six System info screens are captured too ([system-info.md](system-info.md)).
> 🔴 **The security profiles prove the settings screens exist:**
> `Vestigingsgegevens` → `Instellingen Verkoop` (`Klant instellingen`,
> `Order Instellingen`) / `Instellingen Financiën` / … — never opened. **K1 is
> almost certainly there.** `Stock value check` must be redone with
> `Year` = `2025`, `Month` = `5`.

### 2. 🔴 The ledger is AFAS

Three batch jobs synchronise with **AFAS** — a Dutch accounting package:
**open posts**, **companies** and **journal entries**. So:

- **easy2trade is not the books.** Invoices are raised here; receivables, payments
  and the general ledger live in AFAS, and the open posts come *back* from it.
- **`Open entrees`, `Oldest due date open entrees` and the whole
  `Post(s) outstanding for too long` rule run on AFAS data.**
- And the status bar has said **`Batchscheduler is not active`** on every
  screenshot. If the AFAS sync is not running, open posts are **frozen at the
  last sync** — payments made since never arrive. That would explain why
  **every** order held for overdue posts is 496–614 days overdue: the posts may
  be paid in AFAS and still open here. ⚠️ **Hypothesis, not proved** — but it
  makes K10 (is the scheduler meant to be off?) a blocking question.

Nothing in `apps/dashboard` knows AFAS exists. Whether the rebuild replaces
AFAS or syncs with it is a decision, and it decides how `Journal entries`,
payments and credit control are built.

### 3. The statistics are batch-built

`Maand statistiek`, `Statistiek`, `Bijwerken Ordersamenvattingen` and
`Bijwerken Inkoopordersamenvattingen` are jobs. Summary and statistics tables
are **filled by a batch, not live** — which is the likeliest reason the
`… last month` columns of Customer revenue are `0`
([customers-and-prospects.md](customers-and-prospects.md) §35) while the live
invoice-based columns beside them are exact. Also a hypothesis.

### `Bestand → Nieuw` — the 22 things a user can create

Action, Company, Complaint, Contract, Contract group, Counter order, Invoice,
Location, Machine, Order, Product, Product group, Purchase invoice, Purchase
order, Purchase quote, **Purchase request**, **Purchase return order**, Quote,
Return order, Visit report, Warehouse section, Warehouse subsection.

`Purchase request` and `Purchase return order` **appear greyed** in the
screenshot — possibly not available to this login. A6 is still worth one try.

## 🔴 A1 in detail — the one red unknown in the code

Right now `apps/dashboard` holds this line:

```ts
export const OVERDUE_POST_BLOCK_DAYS = 30;
```

It is **an assumption**, marked as one. The reference blocks 18 of 31 held
orders with `Post(s) outstanding for too long`, and **17 of those 18 pass the
credit check** — so it is purely an age-of-debt rule. Every blocked example is
496+ days overdue, which means any number from 1 to 496 reproduces all of them.
The real number is a setting on a screen nobody has captured.

**Steps:**

1. Open **`Extra`** from the top menu bar.
2. Photograph the menu open.
3. Open anything that reads like settings, options, parameters, `Instellingen`,
   `Opties`, or `Bedrijfsgegevens`.
4. Look for a debtor/credit block — words like `dagen`, `days`, `vervallen`,
   `overdue`, `blokkeren`.
5. 📸 that block.

**If `Extra` has nothing:** open one company that is currently blocked
(`Overviews → Finance → Financially blocked quotes and orders` names them),
press `Show Company`, and open the **`Debtor`** panel. A per-customer day
setting would live there.

---

# Part B — Sales · 4 screens left

🟡 **Was the biggest hole in the whole rebuild; now mostly filled.** On
13-9-2026 twelve Sales exports were taken in one sitting — **~43 000 rows** —
covering the whole order-to-cash chain: orders, quotes, lines, deliveries,
invoices, invoice lines, returns, charges and options. What is left is five
screens, and two of them are statistics.

Standard recipe. Filters below are the ones to set; everything else stays.

| # | Screen | Filter |
|---|---|---|
| ~~**B1**~~ | ~~**Orders and Quotes**~~ | ✅ **captured 13-9-2026** — 2 091 rows × 40 columns → [orders-and-quotes.md](orders-and-quotes.md), queued in [PLANNED-CODE-CHANGES-3.md](PLANNED-CODE-CHANGES-3.md) |
| ~~**B2**~~ | ~~**Order lines**~~ | ✅ 4 975 × 54 → [order-lines.md](order-lines.md) |
| ~~**B3**~~ | ~~**Invoices**~~ | ✅ 1 683 × 27 → [invoice-lines.md](invoice-lines.md) Part 2 — **VAT settled** |
| ~~**B4**~~ | ~~**Invoice lines**~~ | ✅ 5 650 × 43 → [invoice-lines.md](invoice-lines.md) |
| ~~**B5**~~ | ~~**Deliveries**~~ | ✅ 6 134 × 54 → [deliveries.md](deliveries.md) |
| ~~**B6**~~ | ~~Quote lines~~ | ✅ 9 × 46 → [order-lines.md](order-lines.md) §10 — discount **shape** proved, every value `0 %` |
| ~~**B7**~~ | ~~Return lines~~ | ✅ 88 × 64 → [returns-and-complaints.md](returns-and-complaints.md) |
| ~~**B8**~~ | ~~Charges~~ | ✅ 1 504 × 24 → [charges.md](charges.md) — names the `B` series |
| ~~**B9**~~ | ~~Options~~ | ✅ 2 890 × 31 → [sales-options-and-calloff.md](sales-options-and-calloff.md) |
| ~~**B10**~~ | ~~Option prices per product~~ | ✅ 54 × 16 → [product-prices.md](product-prices.md) §3 |
| ~~**B11**~~ | ~~**Product prices**~~ | ✅ **re-run 14-9-2026 with `Price date` = today** → [product-prices.md](product-prices.md) §1 — **still no sales price on any of 19 383 products** (gross, markup, A–D all 0). Only `APP`/`LPP` purchase costs appear (451/366), and `APP` is dirty (negatives) |
| ~~**B12**~~ | ~~Net prices~~ | ✅ **proved empty 13-9-2026** — filter block photographed, all sentinels correct, 1-1-2024→13-9-2026, zero rows. No contract is typed `Net prices` either. See [product-prices.md](product-prices.md) |
| ~~**B13**~~ | ~~Order lines still to be called~~ | ✅ 55 × 26 → [sales-options-and-calloff.md](sales-options-and-calloff.md) §6 |
| ~~**B14**~~ | ~~Orders still to be called~~ | ✅ 691 × 49 → [sales-options-and-calloff.md](sales-options-and-calloff.md) §6 |
| ~~**B15**~~ | ~~Order lines capacity overflow~~ | 🟡 **columns captured, no rows, 14-9-2026** → [capacity-overflow.md](capacity-overflow.md) — **crashes**: `Thickness` missing from `GetReportData_CapacityOverrides` (same bug class as C1). 8 override + 46 order-line columns photographed; our `OrderLineCapacityOverflows` already has the override's shape |
| ~~**B16**~~ | ~~SFN statistics Product-Market combinations~~ | ✅ **826 × 7, 18-9-2026** → [sales-statistics.md](sales-statistics.md) — 🔴 **it was wrongly called dead; it has data.** A **CBS statistics return**: weight by commodity code by 2-digit postal district. `sfn_no` = `0` and `SBI code` = `Unknown SBI` on **all 826 rows**, so the two classifying columns are never filled |
| ~~**B17**~~ | ~~Revenue w.r.t. Budget~~ | ✅ **109 × 15, 18-9-2026** → [sales-statistics.md](sales-statistics.md) — 🔴 **all five budget columns are `0` on all 109 rows: no budget has ever been set.** Gives the complete **17 revenue groups** (1xxx–2xxx material, 3xxx processing, 8xxx charges) and €9 042 028,23, matching its sibling. Second view no longer needed |

Already done: `Contracts` and `Contractgroups` ✅.

## What B1–B5 unlock

These five are the whole order-to-cash chain, and each one settles something
that is guessed today:

- ~~**B1**~~ ✅ **answered.** No — there are **four** series, not one:
  `O` orders, `R` **return orders** (this is the `29xxxx` series of item G11),
  `Q` quotes and one stray `B`. A quote's `Status` comes from the **same
  ten-value ladder** as an order's, and our four-value `orderStatuses` matches
  none of it. `orderType` survives and gains a fourth value, `Ex works`.
  `Order method` is nullable and uses four of our eight values.
- **B2** — the sales equivalent of the purchase-lines export that proved six
  formulas. This is where the price build-up, the discounts and the `Stk`/`CD`
  split get proved on the selling side. **We proved discounts cascade from a
  single quote line.** One line.
- **B3 / B4** — VAT scenarios are stored in our code and **drive nothing**. The
  invoice header/line pair is what says which scenario applies when, and how the
  line totals roll into the header.
- **B5** — a delivery is the document that consumes the reservation and moves
  the stock. We model the movement; we have never seen the delivery.

---

# Part C — Customers · 15 screens

🔴 **Nothing in this group has ever been opened.** Visits, prospects, revenue by
customer — fifteen screens built from menu names alone.

| # | Screen | Filter |
|---|---|---|
| ~~**C1**~~ | ~~**Customers and Prospects**~~ | 🟡 **columns captured 13-9-2026, no rows** — `-empty-` triggers a reference bug (`DeliveryTerm` missing from `GetReportData_CustomerAndProspect`). 44 columns + toolbar photographed → [customers-and-prospects.md](customers-and-prospects.md). **A prospect is a checkbox, not a table.** ✅ **closed 14-9-2026** — the `Standard` view breaks the same way, so rows cannot be had from this screen. Not needed: C2 already carries every customer row, and C3/C4 carry the prospects' contacts and addresses |
| ~~**C2**~~ | ~~**Customer overview**~~ | ✅ **1 679 × 47, 13-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 2 — the whole document family counted per customer, complaints included |
| ~~**C3**~~ | ~~Contact persons Customers and Prospects~~ | ✅ **6 796 × 48, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 4 — customer **xor** prospect proved; the contact row carries the company |
| ~~**C4**~~ | ~~Addresses~~ | ✅ **4 739 × 33, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 5 — exactly one visiting and one correspondence address per company |
| ~~**C5**~~ | ~~Remarks per company~~ | ✅ **14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 6 — a **Report**, not a grid; Excel gets one column, pairs rebuilt: 985 remarks on 2 531 companies |
| ~~**C6**~~ | ~~Contracts per Customer / Prospect~~ | ✅ **173 × 18, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 9 — `Link to new customer` copies the two charge contracts onto every new company |
| ~~**C7**~~ | ~~**Unblocked orders**~~ | ✅ **571 × 14, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 3 — **two** types (financial, commercial), no reason stored, and a block can come back |
| ~~**C8**~~ | ~~Customer revenue~~ | ✅ **1 724 × 75, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 10 — `Company code` from `0`, **Year `2025`, Month `5`**. "This year" = the selected month; material/options exact on 90 of 90 customers |
| ~~**C9**~~ | ~~Customer revenue per product group~~ | ✅ **2 241 × 25, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 7 — **product revenue only**, reconciles to B4 to the cent |
| ~~**C10**~~ | ~~Customer revenue per revenue group~~ | ✅ **1 720 × 26, 14-9-2026** → Part 7 — splits each line into product and **option** groups, and charges get their own rows. Our screen does neither |
| ~~**C11**~~ | ~~Customer revenue per revenue group with split order types~~ | ✅ **1 778 × 27, 14-9-2026** → Part 8 — splits on **`orderType`** (Normal/Call-off/Rush) *and* `Stk`/`CD`; reconciles to C10 cell for cell |
| ~~**C12**~~ | ~~Customerrevenue, -sales and -visits~~ | ✅ **809 × 21, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 11 — `Current year` = 2025 (no month); **809 of 809 cells equal C10**. Visits all `0`. `Company code` ≠ `Debtor number` |
| ~~**C13**~~ | ~~Visit schedule~~ | ✅ **2 531 × 25, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) Part 12 — C14 plus `Month`/`Call`/`Visit`; **nothing planned**. 🔨 **Built 19-9-2026** (§43) |
| ~~**C14**~~ | ~~To visit/call~~ | ✅ **2 531 × 22, 14-9-2026** → Part 12 — `Revenue last 12 months` is live and exact. 🔨 **Built 19-9-2026** (§43) |
| ~~**C15**~~ | ~~Change visit schedule~~ | ✅ **2 531 × 24, 14-9-2026** → [customers-and-prospects.md](customers-and-prospects.md) §42 — the editable form of C13 (`Call`/`Visit` tick boxes), identical data, nothing ticked. 🔨 **Built 19-9-2026** (§43) — the plan now has a table |

**C7 matters more than its position suggests.** We built three blocking reasons
and a rule for each. Nothing in the code knows how a block is *lifted*, who may
lift it, or whether lifting it is recorded. This screen is the record.

---

# Part D — Companies · 6 screens

| # | Screen | Filter |
|---|---|---|
| ~~**D1**~~ | ~~Inactive companies~~ | ✅ **93 × 16, 16-9-2026** → [companies-group.md](companies-group.md) — **a manual flag, on every role**, not an order-age rule; 54 came in switched off at go-live |
| ~~**D2**~~ | ~~Texts~~ | ✅ **259 × 29, 17-9-2026** → [companies-group.md](companies-group.md) — a note stuck to a **company** with a tick per document it prints on; `Categories` is those ticks written out, proved 258/259. Only 8 of 18 documents ever ticked. ✅ our `/texts` already matches |
| ~~**D3**~~ | ~~Communication settings~~ | ✅ **3 rows × 11 columns, 17-9-2026** → [companies-group.md](companies-group.md) — an **override**, not the sending rule: two real rows in three years, both mailing a copy to a `@hego.nl` address. `Shape` is the payload (`PDF`, **`SCSN`**); the recipient is a **contact or a typed address**, which our schema did not separate — ✅ built 17-9-2026 |
| ~~**D4**~~ | ~~Visits made~~ | ✅ **166 × 16, 17-9-2026** → [companies-group.md](companies-group.md) — 🔴 **the visit side is alive** (C13/C14's zeros are stale batch statistics); 154 calls to 12 visits; `Bezoekredenen` is **multi-valued** with a 7th value we lacked; 16 rows did not take place and are listed anyway — ✅ built 17-9-2026 |
| ~~**D5**~~ | ~~Visit reports~~ | ✅ **17-9-2026** → [companies-group.md](companies-group.md) — a **Report**, not a grid: the same 166 visits printed four lines each, reconciled to D4 block for block. Adds the **time**; carries **none of the free text** |
| ~~**D6**~~ | ~~Address distances~~ | ✅ **481 × 5, 17-9-2026** → [companies-group.md](companies-group.md) — 🔴 **not** between two addresses: the distance **from our depot** (proved by 13 zero rows, all `Bolderweg 10 Almere`), fetched **from Google one row at a time by hand**. It feeds `TransporterCosts.fromKm`/`untilKm` — a chain nothing in our app closes. ✅ screen built 17-9-2026; the costing chain waits on a decision |

---

# Part E — Batch registration · 5 screens

The certificate chain. A steel batch carries a mill certificate, and the
certificate has to follow the metal to the customer. We store `charge` and
`internalBatch` on a lot and **nothing else in this chain exists**.

| # | Screen | Filter |
|---|---|---|
| ~~**E1**~~ | ~~**Batches**~~ | ✅ **2 910 × 23, 16-9-2026** → [batch-registration.md](batch-registration.md) Part 2 — a batch row is also written for **processing output**; opening stock came in on 13 empty `1000xx` orders; `Adjust charge…` photographed |
| ~~**E2**~~ | ~~Certificates received~~ | ✅ **2 540 × 27, 14-9-2026** → [batch-registration.md](batch-registration.md) — internal charge `25ACRT` on every row; **no certificate document ever attached** |
| ~~**E3**~~ | ~~Certificates to be linked~~ | ✅ **empty, columns photographed** → §6 — an electronic certificate-exchange **message log**, nothing ever received |
| ~~**E4**~~ | ~~Sending certificates~~ | ✅ **3 271 × 35** → §3 — every sold charge traces to its receipt, **1 662 of 1 662** (heat, PO, receipt date); never sent |
| ~~**E5**~~ | ~~Deliveries from the missing batch~~ | ✅ **empty, columns photographed** → §7 — correctly empty: no delivered line lacks a batch |

Also: **📸 one batch opened**, every tab. See item G6.

---

# Part F — Other · 9 screens

The tree, photographed 16-9-2026: `Complaints`, `Complaint lines`, **`External documents`**, **`Read external documents`**, **`Actions`**, `Balanced Scorecard`, `Transport by region`, `SigmaNest geblokkeerde orders`, **`Scanners purchase and sales`**. The four in bold were not on this list before, and our sidebar has none of them.

| # | Screen | Filter |
|---|---|---|
| ~~**F1**~~ | ~~**Complaints**~~ | ✅ **74 × 29, 16-9-2026** → [complaints.md](complaints.md) — resolution time proved 74/74; the complaint type decides which document it names |
| ~~**F2**~~ | ~~Complaint lines~~ | ✅ **34 × 30, 16-9-2026** → [complaints.md](complaints.md) §5d — a line names an **order line** (and on the record, its delivery); every other column is the complaint's |
| ~~**F3**~~ | ~~Balanced Scorecard~~ | ✅ **16-9-2026** → [other-group.md](other-group.md) — 9 KPIs in 3 categories, no filter, target and history dialogs; **never measured, no target ever set** |
| ~~**F4**~~ | ~~Transport by region~~ | ✅ **1 439 × 13, 16-9-2026** → [other-group.md](other-group.md) — one row per **transport**, not per trip; region is the address's field; ours has the wrong grain |
| ~~**F5**~~ | ~~SigmaNest geblokkeerde orders~~ | ✅ **empty, no filter, 16-9-2026** → [other-group.md](other-group.md) — work order / customer / delivery date / purchase order / sales order; read live from SigmaNest |
| ~~**F6**~~ | ~~External documents~~ | ✅ **empty, no filter exists, 16-9-2026** → [other-group.md](other-group.md) — `Sequence`, `Code`, `Description`, `Filename`, `Read`, `Last read`; never used |
| ~~**F7**~~ | ~~Read external documents~~ | ✅ **empty, no filter exists, 16-9-2026** → [other-group.md](other-group.md) — `User`, `Document`, `Code`, `Read`, `Last read`: who has read which F6 document; never used |
| ~~**F8**~~ | ~~Actions~~ | ✅ **empty, 16-9-2026** (Deadline 1-1-2024 → 16-9-2026) → [other-group.md](other-group.md) — a typed to-do with deadline and completion; schema has `ACTION`, `ACTION_TYPE`, auto-assignment per type; never used |
| ~~**F9**~~ | ~~Scanners purchase and sales~~ | ✅ **empty, 90 columns, 16-9-2026** → [other-group.md](other-group.md) — Order advice + the sales/purchase line a warehouse scan created; never used |

---

# Part G — Records to open

A grid gives columns. **A record gives structure** — which fields are grouped
together, which are greyed, which panels exist. Every one of these is
screenshots only: open it, and photograph **every tab and every panel expanded**.

| # | Open this | What it settles |
|---|---|---|
| ~~**G1**~~ | ~~🔴 **One sales order, every tab and panel**~~ | ✅ **18-9-2026, order `100742`, all twelve panels** → [order-detail.md](order-detail.md) Part 2. 🔴 **The lower panels are scoped to the *selected line*, not the order.** `Workorders` is three panels and a warehouse WO line names its **order line** (`From` a bin, `To` `Laad`); a transport WO carries `Direction`, `Qty(loaded)` and a bill of lading that **groups lines onto a trip** (bears on G7). `Pricing` shows the whole build-up (base + qty + colour + length surcharges → gross; line + extra + group discounts → net) — 5 of those columns are missing from `OrderItems`. The invoice line carries `Charge`, a `Debit`/`Credit` type, `RdU`/`GdU` discount units and its own mail timestamp. Still open: the cascade is **numerically** unproved (all zeros), and no option has yet been seen on a real line |
| **G2** | 🔴 **One sales invoice, every panel** | Nothing posts to the ledger yet. The invoice is where the posting is decided |
| **G3** | **One delivery**, every panel | The document between an order line and a stock movement |
| **G4** | One quote that became an order | Does the order keep the quote's number? Its prices? Its discounts? |
| ~~**G5**~~ | ~~One complaint, every tab~~ | ✅ **40055, 16-9-2026** → [complaints.md](complaints.md) §2 |
| ~~**G6**~~ | ~~One batch, every tab~~ | ✅ **16-9-2026 — a batch has no record of its own.** The Batches row menu offers `Show Product`, `Show Company`, `Show Purchase order`, `Show File`, `Open file location`, `Adjust charge…`, `Stock label` — no `Show Batch` → [batch-registration.md](batch-registration.md) §11 |
| **G7** | **One trip** — bill of lading `300813` against trip number `600249` | Two numbers, two documents, one delivery, and the pair is unexplained. 438 trips are captured and not one has been opened |
| **G8** | One production batch, every tab | |
| **G9** | **One remnant lot** (an offcut the saw made) — and read its **`Supplier`** | Us, or the original mill? It decides whether a remnant traces back to the heat it was cut from |
| **G10** | **One `Bewerker` lot** — any lot at an external-processor location | All 36 are blocked. Which screen set that, and can it be lifted by hand? |
| **G11** | An order from the **`29xxxx`** series | ⚠️ **half answered by B1** — it is a **sales return order** (`R290000`–`R290051`, 43 of them), negative revenue and weight, in the same grid as the orders. Still worth opening **one** to see its lines |
| ~~**G12**~~ | ~~One customer company, **`Debtor`** panel fully expanded~~ | ✅ **Mercainox, 14-9-2026** → [credit-and-blocking.md](credit-and-blocking.md) — credit space exact on the record; `Credit limit insurance` is a **policy number**; **no overdue-days setting on the customer**, so it is system-wide (A1) |

---

# Part H — How the work is actually done

🔴 **This is the two thirds that is unbuilt.** 126 screens exist in our app and
**42 of them write**. The rest list. In the reference, somebody *does* things on
these screens, and we have never watched it happen.

For each: **do it on a test record, and photograph every single step** —
including the dialog that opens, what it asks, and what the screen looks like
afterwards. A short screen recording is better than screenshots if that is
easier.

> 🔵 **21-9-2026 — [FLOWS.md](FLOWS.md) is the runsheet for this part.** Every
> flow now names the **record code to use**, picked out of the exports so it
> starts from a record already in the state the flow needs (`IO400118` still to
> be received, `PK304L200315` with 23 free at `9B`, `O102167` blocked,
> `IO400151` a processing order, complaint `K40055`). It also lists, per flow,
> **what changes in the code when the screens land** — so a flow that arrives
> and moves nothing gets struck rather than chased.

| # | The flow | Why |
|---|---|---|
| ~~**H1**~~ | ~~**A lorry arrives → the goods become stock**~~ ✅ **ANSWERED 21-9-2026** → [receipt-chain.md](receipt-chain.md) §H1.1 + §H1.2. **Reporting the unloading work order creates the stock** — order `401141`, work order `306675`, five lots `389823`–`389827`, 100 pieces / 10 597,5 kg, 90 of them arriving already reserved. **No invoice in the chain.** Release prints labels and creates nothing; reporting self-approves. 🔴 **Every bundle must carry a `Charge` before `OK` will enable** — a heat number per lot is mandatory before metal may become stock. 🔴 **`Internal charge` identifies the receipt (one code for all five lots, system-assigned); the six-digit running number identifies the lot.** 🔴 **A lot is valued at the product's carried price (2 058,8151), not the € 2 000,00 paid for it.** Only gap left: whether the work order was raised by the `Workorder` button or automatically by `Confirm`/`Pre-notifiy` |
| ~~**H2**~~ | ~~**Create a reservation by hand**~~ ✅ **ANSWERED 5-10-2026** → [stock-lot-dialogs.md](stock-lot-dialogs.md) §1. 🔴 **The answer is that you cannot.** `Reserveringen…` on the lot opens a grid whose entire toolbar is **`Order` · `Verwijder`** — there is **no `New`**. A reservation is *made by a sales order* and the only manual act is deleting one. The single row read `Sale · Definitive · 25 ST · O107163/20 · Sigaltec s.l. · 10-8-2026`, so `Type` has at least `Sale` (and `Purchase`, which H9 inferred from 23 rows) and `Status` has at least `Definitive`. `Order/R…` carries order **and** line in one column. **Build consequence:** drop "create reservation"; build **delete** and **open the owning order** instead |
| ~~**H3**~~ | ~~**Adjust a lot by hand**~~ ✅ **ANSWERED 5-10-2026** → [stock-lot-dialogs.md](stock-lot-dialogs.md) §2. `Correctie…` opens `Corrigeren voorraad`: **two independent halves, each behind its own tickbox** — `Voorraad hoeveelheid correctie` (quantity + quality + category + thickness + **all four weights**) and `Voorraad kenmerk correctie` (the remark). 🔑 **A `Reden` is mandatory** — `OK` stays greyed without one — and the enum has **8** members: `Rejected material · Inventory rejection · Stock difference · Stock correction · Transfer length · Internal damage · Scrap · Opmerking voorraad toevoegen/aanpassen`. 🔑 **`Zaagopdracht` (saw order) is a field on a correction** — the missing link to H10: a cut's loss is written off against the job that caused it. 🔑 `Categorie` is a **5**-value enum (`Standaard · Scrap · 2nd choice · Remaining · 3rd party inventory`), set per lot by hand — which is how K2's customer-owned stock gets its flag. 🔑 `Kwaliteit` is **code + norm** (`304L2B` → `EN 1.4307 2B`), the finish being a suffix on the code, and **the list is filtered to the alloy family** — 304 can never become 316 |
| **H4** | **Plan a trip** — from deliveries waiting to a trip with a bill of lading | The whole transport side is read-only in ours |
| **H5** | 🟡 **Take an order from entry to delivery**, one line, every button | **Captured 21-9-2026 on order `102191`** → [order-to-delivery.md](order-to-delivery.md). Entry → priced → blocked → unblocked → `Make final` → picked to `Laad`, drawing on the very lots H1 created ninety minutes earlier. 🔴 **Revenue is billed on trade weight (540 kg) and cost taken on theoretical weight (529,9 kg)** — every margin we show on a trade-weight order is wrong. 🔴 A line is entered through a **stock search** with `Stock` / `Purchase` / `Internal production` tabs, so goods are sold before they arrive. 🔴 `Make final` prints the confirmation and raises the **warehouse and transport work orders** itself. 🔴 The confirmation's footer shows the receivables are **factored to Boozt24 Finance**. ⚠️ The pricing cascade reads zeros because the product has no sales price — the answer, not a failed capture. 🔴 **Still owed:** trip, delivery note, invoice, payment |
| **H6** | **Send an invoice** — from an order delivered to an invoice sent | |
| **H7** | **Take a payment** against an invoice | |
| ~~**H8**~~ | ~~**Block, then unblock, one order**~~ ✅ **ANSWERED 21-9-2026** → [order-to-delivery.md](order-to-delivery.md) §4, on a block we caused ourselves. Order `102191` saved as `Provisional, Blocked`, reason **`Post(s) outstanding for too long`**. **Unticking `Financial blockage` lifts it** — no confirmation, no reason asked, reason clears to `-empty-`, and it **survived a close and reopen**. `Blocking reason` is **disabled**: system-set, never chosen — so the audit trail is whoever saved the record, which is exactly why 63 releases carry only the vendor's login. 🔴 A second independent **`Invoice blockage`** flag exists. ⚠️ The margin warning does **not** block; it only ticks `Profit too low`. ✅ **The 5-10-2026 `Batchscheduler is actief.` reading was a misread — corrected 6-10-2026.** The status bar says `Batchscheduler is **niet** actief.`; the negation was missed. The scheduler is off, as every earlier capture said, so nothing concluded from it being off needs re-checking and K10 is unchanged |
| **H9** | **Send material out for external processing, and take it back** | Purchase reservations are this flow, inferred from 23 rows |
| **H10** | **Report a saw cut** — the two report dialogs, and the kilos balancing | Modelled from a screenshot; never watched |
| ~~**H11**~~ | ~~**Link a certificate to a batch**~~ ✅ **ANSWERED 5-10-2026** → [stock-lot-dialogs.md](stock-lot-dialogs.md) §5, from the **stock** door (`Partijregistratie…` on the lot) rather than the purchase one. 🔴 **There is no certificate field on it** — which independently confirms `batch-registration.md` §1, where all 2 540 received and 3 271 sent rows had every certificate column empty. The certificate turns up instead as a **stock option**, `2.1 Certificate` (see J5). What `Voorraad partij correctie` actually does is **attach the mill's heat number to a lot by pointing at the purchase delivery it arrived on**: you pick the `Leverancier`, the grid lists that supplier's deliveries, and **only `Charge` and `Fabrieksnummer` are editable** — order, line, dates, dimensions and weight are all read off the purchase line. 🔑 **`Charge` (112770, the mill's) and `interne charge` (26AOSG, ours) are two different identities.** 🔑 The delivery grid showed **one line `403773/10` arriving as two instalments** (23 pcs/1 610 kg and 25 pcs/1 754 kg, same heat) — the receival grain proved from a third direction, and `kg(w)` is what lands on the lot as `Gewogen gewicht`. ⚠️ **Sitting 2h is now optional** — it would only confirm the same dialog opens from `Receipts` |
| **H12** | **Raise a credit note / return** | `Return order` and `Return lines` exist as menu items and nothing else |
| **H13** | 🔴 **Split a reception into instalments** — what the `Split` button actually opens | **Asked 4-10-2026.** The button is on the order's `Receipts` panel toolbar, beside `New` · `Delete` · `Batch registration` · `Charge aanpassen…`. We know splitting is real and we know what it *produces* — one purchase line showing several rows on Purchase receivals, with only `Kg(p)`, `Kg(a)`, `Delivery date (a)` and `Receipt status` differing between them, the `Kg(p)` summing back to the line (101 of 107 lines in the export). **We have never seen the dialog.** Every attempt found `Split` greyed out, on a released order with an open reception. So ours was built from the result alone: a weight box that divides the reception in two and shares the quantity out in proportion. That interface is a guess. ⚠️ **Until this is captured, do not test ours against it** — it would only be testing our own invention | 🟡 **5-10-2026 — shape evidence, not the answer.** The **lot** `Splits` was captured (`Splits voorraad`, [stock-lot-dialogs.md](stock-lot-dialogs.md) §6) and it **has a `Gewogen gewicht` box**, which vindicates the weight box we invented. Its layout is a movable/splittable ledger on top, then `Hoeveelheid` + `Gewogen gewicht` + `Naar locatie`, with **no `Reden` and no `Uitvoerdatum`** — so a split is immediate, not planned work. ⚠️ That is a **different dialog on a different object**: it splits a lot, H13 splits a reception. **Still open** — but **5-10-2026 narrowed the condition sharply**: on live line `404150/10`, genuinely `Partially received` with one reception `Received` and one `Released`, **`Split` was still greyed** with the **`Received`** row selected. 🔴 **6-10-2026 — tried, and the guess was wrong.** With the **`Released`** reception selected `Split` is **still greyed**. But the toolbar is demonstrably reading the selection, because four other buttons flip: `Delete` wakes on `Released`, while `Batch registration` and `Charge aanpassen…` wake on `Received`. So the rule is “a reception that has arrived can be stamped but not deleted; one that has not can be deleted but not stamped” — and **neither can be split**. `Split` is therefore gated on the **order**, not the reception, and this order is `Partially received`. **Next and last place to try: an order where nothing has been received at all** — `Released`/`Confirmed`, `Kg(a)` = 0 on every reception, holding a reception with `Qty(p) > 1`. ✅ **The rest of that capture is built** (6-10-2026): the reception toolbar, `Charge aanpassen…` and `Partijregistratie instellingen`, with `Split` rendered disabled and its reason stated on screen so this gap is visible to whoever next opens the page. If it is greyed there too, splitting is not reachable from this screen and H13 closes negatively → [purchase-order-detail.md](purchase/purchase-order-detail.md) |

### H13 in detail — exactly what to photograph

1. Open a purchase order whose reception has **not** arrived (`Kg(a)` = 0).
2. Expand the **`Receipts`** panel and select the reception row.
3. Press **`Split`**.
   - **If it is greyed**, that is the answer — say which order and what state its
     reception was in, and we stop guessing and ask what enables it.
   - **If a dialog opens**, photograph it: every field, every caption, and what
     it offers by default.
4. Split it, then photograph the `Receipts` panel afterwards — **both rows**,
   scrolled right, so we can see which columns changed and which repeated.

The one question behind all of it: **is a split entered as a weight, as a
quantity, or as a number of parts?** Ours assumes a weight and derives the
quantity from it. If the reference asks for pieces instead, our arithmetic runs
backwards.

**Start with H1.** It is the oldest open question in the project and everything
in the warehouse hangs off it.

---

# Part I — Screens that came back empty and should not be trusted

Each of these returned nothing, but the filter that produced the nothing was not
captured — so it is unknown whether the screen is genuinely unused or was simply
asked about the wrong month.

> ✅ **Six of seven settled 18-9-2026.** **Two of them had data** — `Stock
> history` (33 211 rows) and `Freight flow (SFN)` (390) — and three are
> confirmed empty with the filter captured. **Only I6 is left**, and it is in
> `Overviews → Finance`, not Sales. The rule has now been paid for twice on this
> list: an empty grid is a claim about the filter until the filter is read.

**The rule:** a column blank on every row of a **full** export is evidence. An
empty grid is not.

| # | Screen | Run it again with |
|---|---|---|
| ~~**I1**~~ | ~~Stock history~~ | 🔴 **33 211 × 55, 18-9-2026** → [stock-history.md](stock-history.md) — **it had data all along.** Fifteen monthly snapshots of every lot; ~2 400 t / €5,03 M / 2 230 lots per snapshot. `Stk-general ledger account` = **`3000 Stock`** on every row, which answers S8's missing column. ⚠️ snapshots run to **2026-06** on a database said to be frozen at mid-May 2025 — new doubt on K10 |
| ~~**I2**~~ | ~~Production batches~~ | ✅ **genuinely empty, 18-9-2026**, filter photographed (`1-1-2024` → `18-9-2026`, `-empty-`) → [empty-screens.md](empty-screens.md) — 4 columns, still Dutch: `Code`, `Aangemaakt`, `Machine`, `Naar Locatie`. **Leaves scope** |
| ~~**I3**~~ | ~~Freight movement~~ | ✅ **genuinely empty, 34 columns captured, 18-9-2026** → [stock-history.md](stock-history.md) §3 — ⚠️ it is a **stock-mutation** screen, not a transport one, and nearly duplicates `Stock mutations` (13 562 rows). **Leaves scope** |
| ~~**I4**~~ | ~~Freight flow (SFN)~~ | 🔴 **390 × 16, 18-9-2026** → [stock-history.md](stock-history.md) §2 — **it had data too.** A monthly **tonnage balance** per revenue group, 15 months × 26 groups exactly. `Ending → next Starting` closes **338/338**; `Stock difference = (start + receipts − supplies) − ending` proved **390/390**. 🔴 the revenue-group master is **26, not 17**. `Supplied SFN` = `0` on all 390 rows |
| ~~**I5**~~ | ~~Sawing layouts~~ | ✅ **genuinely empty, 43 columns captured, 18-9-2026** → [stock-history.md](stock-history.md) §3 — ten `Qty n`/`Length n` pairs hold the cutting pattern. **Third confirmation that sawing planning is switched off** (K3). **Leaves scope** |
| **I6** | Purchases and sales per revenue group — **`Overviews → Finance`**, 7th item | ⚠️ `Year` = `2025`, `Month` = `1`. **18-9-2026: the filter is a *from*, not an equals** (proved on B16/B17), so 2025/1 returns January onwards. B17 returned €9 042 028,23 from that window, so expect data |
| **I7** | Deviations in count lists | ⚠️ it has **two** date filters that `AND` together. Widen one at a time |

If a screen still returns nothing **with a photographed filter block over
1-1-2024 → today**, it is confirmed unused and it leaves scope for good.

---

# Part J — Older items still standing

Carried over from the Purchase rounds. Smaller, but each one is a real gap.

| # | Item | Steps |
|---|---|---|
| **J1** | **Consignment stock — finish it** | Order `401154` exists, `Provisional`, reception created. Three clicks: press **`Make final`** → fill `Kg(a)`=314 / `Qty(a)`=10 on the reception → read that lot's `Stock (€)` on `Stock on location`. **€0,00 means consignment is excluded from stock value** |
| ~~**J2**~~ | ~~**The `Pricing` panel on purchase order `400650`**~~ ✅ **ALREADY ANSWERED — this row was stale, caught 5-10-2026.** The panel was opened on `401156` and `401157` → [purchase-order-detail.md](purchase/purchase-order-detail.md#-the-pricing-panel--opened-at-last). It carries **three surcharges** (`Quantity`, `Color`, `Lengtetoeslag`) building to `Gross Price`, then **four discounts** (`Line`, `Extra`, the derived `Line discount tot.`, `Group`) down to `Net price`; two ticked checkboxes, `Transfer price setting to order line` and `Transfer pricing determination to order line`, push the result down — which is why a line's `Net Price` is a result and not something typed. The right half repeats the whole chain **per option** (`Option · Base price · Surcharge · Gross price · U · Qty Discount · Extra Discount · Reference factor · Net price · Contract`). 🔑 **And the 94,2 kg → 100 kg question it was really asking is answered too, elsewhere:** the purchase order's own printed terms say *only the weighed weight is accepted as the basis for invoicing*. The extra weight is not a surcharge and not an option — it is the scale. `400656/10` was billed **under** theoretical (1 438,0 against 1 475,8) and `400474/30` **over** (5 825,8 against 5 809,0), which no surcharge could do | — |
| **J3** | 🟡 **Is StockOp used at all?** — **1 of 4 checked, 2-10-2026.** On `PK44115025125` the whole `StockOp Parameters` column is greyed and zero, `Use StockOp for this product?` is **unticked**, and the panel states *"StockOp parameters zijn nog nooit berekend"*. `PAC-classification` and `Order advice code` are both blank. **Three products left to confirm, then `StockOn advice` leaves scope.** | `Purchase lines` → any row → `Show Product` → find *"Use StockOp for this product?"*. Check `PK304L20021`, `PK316L40021`, `SC304`, `CK3040010`. **All four unticked = the whole `StockOn advice` screen leaves scope and gets deleted** |
| **J4** | **A purchase line received in two goes** | `Purchase lines`, creation date from `1-1-2024`, find a line where `Qty(a)` is above 0 but below `Qty(p)` → `Show Purchase order` → expand `Receipts`. 📸 — two instalments on one line, one `Received`, one `Released`. 🟡 **21-9-2026 (H1.1):** the mechanism is found — a **`Split`** button on the Receipts toolbar, with `New` and `Delete` greyed beside it. So a part-receipt is made by **splitting the existing reception**, never by adding a second one. What is left is watching `Split` open | 🟡 **5-10-2026:** the *instalment* half is now proved independently — [stock-lot-dialogs.md](stock-lot-dialogs.md) §5 shows line `403773/10` arriving as **23 pcs/1 610 kg and 25 pcs/1 754 kg**, both carrying heat `112770`. What is still unwatched is the `Split` button itself (H13). ⚠️ The `Splits` captured that day is the **lot** split, a different dialog on a different object |
| ~~**J5**~~ | ✅ **CLOSED 6-10-2026 — the whole list read, 27 members, and the Status model corrected** → [stock-lot-dialogs.md](stock-lot-dialogs.md). Nine were missing from our enum, **`3.1 Certificate` among them** — so there are two grades of certificate and both are options on a lot, which is why every certificate column on the batch screens is empty. 🔴 **`Status` is derived, not chosen:** a freshly added row reads **`Toevoegen`**, and the add block has no Status field, so the grid is an edit buffer and the column reports the pending edit rather than the state of the metal. Our `possible`/`requested`/`done` guess is replaced by `possible`/`to_add`/`to_remove`/`applied`. `Specificatie` is a **dropdown**, empty for `Remove Foil`, with `K320` known against Grinding — so it is per option. ⚠️ **One thing still owed:** press `Opslaan`, reopen, and read the Status of a **saved** row — that settles `applied` and `to_remove`, the two inferred members. ⚠️ The **product's** list is still unread past six entries | ~~The 21-9 answer counted **six** from the *product* panel The 21-9 answer counted **six** from the *product* panel (`Duplo · Decoilen · Grinding · Brushing · ShearCut · Laser Foil`). `Opties bewerken` on a **lot** offers **fourteen more**, barely overlapping — `UV Foil · Brushing · Punching · Embossing · Papier verwijderen · **2.1 Certificate** · Coating · Pickling · Remove Foil · Kanten · Duplo · Slitting · Stempelen · Laser` — **and both dropdowns were still scrolling**. So there are **two lists**: the product's (what this article *can* have done, each row a status) and the lot's (what has *been* done, each row an `Optie` + `Specificatie` + `Status`). **Nineteen members known, neither list complete.** 🔴 **Our model is wrong** — we hold options as a column; they are **rows on a lot**. 🔑🔑 **`2.1 Certificate` being an option resolves the certificate contradiction** that 4b was going to chase across 2 910 batch rows: the batch columns are empty because certificates were never recorded there. → [stock-lot-dialogs.md](stock-lot-dialogs.md) §7 | Scroll **both** dropdowns to the end — on a lot and on a product — and open one lot row's `Specificatie` and `Status` dropdowns |
| **J6** | **Value lists — drag the header into the grey bar** | The bar reading *"Drag a column header here to group by that column"*. It lists every value with counts. Do it for: ~~`Purchase invoices → Status`~~ ✅ **7-10-2026: `Provisional` · `Released` — final; the series starts in 2025, so a wider window finds nothing more** → [purchase-invoices.md](purchase/purchase-invoices.md); ~~`Orders and quotes → Status`~~ ✅ **7-10-2026: ten shown incl. two new ones — `Converted` (quotes only, holds the order number) and `Delivered` (orders only, nothing invoiced); below `Provisional` still unscrolled** → [orders-and-quotes.md](orders-and-quotes.md) *Step 7*; ~~`Purchase lines → Line type`~~ ✅ **struck 7-10-2026 — three groups, `CD` · `EXW` · `Stk`, no counts on the headers.** `EXW` is one row and it is a toll-processing return, not a purchase — [purchase-lines.md](purchase/purchase-lines.md) *Step 6 answered*. Built as `PurchaseOrderItems.sourceType` (`067f4cbe`). **Step 6c done:** the type is **`Ex works Processor`**, delivery address is the processor's own, and `Purchase reference` / `For line` point at `IO400142` — the return leg of external processing (H9). **Step 6d**: open `400142` |
| **J7** | **Dropdowns — open and photograph the list** | ~~`Orders and quotes → Order method`~~ ✅ **struck 6-10-2026 — answered on 5-10:** grouping by it over a 2¾-year window produced **one blank group holding every order**, so the column is never filled. ~~Product → `Price`~~ ✅ **struck 6-10-2026 — it cannot be opened.** The field is **greyed on every product** (checked on scrap `SC304` and on a non-scrap plate, so `Schroot ☑` is not the cause), which makes it derived or fixed rather than picked. Its Dutch caption is **`Prijsstructuur`**, not `Price` — and it is *not* the `Prijsstructuur` panel on the same record. `Products.priceGroup` stays a `varchar` with no picker. **Three left:** `Orders and quotes → Classification code` · Company → `Journal code` (`0` and `11` seen) · `Net prices → Net priceU` |
| **J8** | **Buttons nobody has pressed** | On a **test** record: Purchase order → `Return`, `Par. return`, `Relocate`, `Workorder`, and the `Workorders` / `Product Receipt Documents` panels · Stock on location → `Change APP…` · Product → `Correct products and stock` · Company → `Show Word File`. 📸 what each opens. **A button that does nothing is an answer** |

---

# Part K — Only a person can answer these

No screen shows them. They need somebody who knows how Swedinox runs, not
somebody clicking.

| # | Question | Why it matters |
|---|---|---|
| **K1** | 🔴 **How many days overdue is "too long"?** | The one assumption sitting in shipped code. **18-9-2026: the `Vestigingsgegevens` settings tree cannot be found in the application either** — the security profiles name its 72 rights, so it exists and this login cannot reach it. 🔴 **No screen route to K1 remains. It is now the SQL query or a person.** **14-9-2026: every menu and the Debtor panel have been opened and no screen holds the setting** — ask INAD (K11) or Swedinox's administrator. And see K10: if the AFAS sync is off, the overdue days themselves may be stale. **15-9-2026 lead:** the schema has no column for it, so it is data — most likely `TASK_PARAMETER`. Whoever has database access runs `SELECT Task_StoredProc, Parameter, Value FROM TASK_PARAMETER` ([database-schema.md](database-schema.md) §1) |
| **K2** | **Should customer-owned stock carry value?** ✅ **The system half is ANSWERED — and was answered on 10-9-2026** → [customer-stock.md](customer-stock.md). Do not go looking again. | 🔴 **The reference is inconsistent, so there is no rule to copy.** `Klant voorraad op locatie` exported 94 rows: of the **70** carrying `Stock category` = `3rd party inventory`, **40 are valued at zero and 30 carry value, €40 833 in total** — while all **24** rows that are *not* 3rd-party are valued at **zero**. The flag and the valuation disagree in both directions. ⚠️ **€40 833 is the reference's figure, not ours** — ours sums every lot, which is the same policy. The reference even has the tool to zero them (`Change APP…`, seen with `Huidig € 5,22` → `Nieuw € 0,00` on a 3rd-party row), and has not used it consistently. **Only the policy call is left, and only Swedinox can make it.** `STOCK_CATEGORY_META.ownStock` is in the code waiting for the answer; applying it is a one-line `WHERE` |
| **K3** | **Are these eight features wanted at all?** | The reference ships them and does not use them: transport costing, `Resource`, `Pickvolgorde`, `Zelfbeoordeling`, FSP revaluation, sawing planning, **the Balanced Scorecard** (F3 — 9 KPIs, no target ever set) and **budgets** (B17, 18-9-2026 — all five budget columns `0` on all 109 rows). **Eight features we can decline to build** |
| **K4** | What does `FSP` stand for, and what does `LIP` stand for? | FSP's *behaviour* is established — the price stock is carried at, versioned, revalued through two GL accounts. Only the letters are unknown |
| **K5** | What is `Gip`? | The product has `Gip → Artikelgroep`, stock has `Gipgroup`. Believed to be average purchase price. Not confirmed |
| **K6** | Does the business raise **purchase quotes** at all? | One exists in three years and it is a test entry |
| **K7** | Are `Purchase request` and `Purchase return order` used? | Two document types in the `Nieuw` menu that no screen has shown |
| **K8** | Are any companies `Processor` or `Transporter`? ✅ **yes (D1, 16-9-2026)** — 2 processors and 8 transporters among the inactive companies alone | Would change how work orders are assigned |
| **K9** | What does ticking `Consignatie` change commercially? | J1 answers the accounting half; this is the business half |
| **K10** | Is the batch scheduler meant to be switched off? ⚠️ **New doubt 18-9-2026:** `Stock history` holds a monthly snapshot for **every month from 2025-05 to 2026-06** on a database said to be frozen at mid-May 2025, so something has kept running. The `Batchtaken` last-run column (S7) settles it | Needs an administrator. 🔴 **Now blocking (14-9-2026):** three of the batch jobs sync open posts, companies and journal entries with **AFAS**. If the scheduler is off, the overdue-posts rule runs on frozen data. **15-9-2026 lead:** `SCHEDULED_TASK.LAST_EXECUTED` on the three AFAS jobs, and `SCHEDULED_TASK_LOG.FAILED`, answer this from the database ([database-schema.md](database-schema.md) §2). **15-9-2026, error log:** jobs run as user `BATCH`, which logs nothing after **13-5-2025** — the date the test copy was taken. The scheduler being off on `HEGO TEST` is expected; ask about the **live** system instead ([error-log.md](error-log.md) §2). 🔴 **21-9-2026 — that escape is gone. Live is the same as test**, so `Batchscheduler is not active` is the live configuration, not a copy artefact. Either the scheduler is deliberately off and the AFAS open posts are stale — which would explain every held order reading 496–614 days overdue — or it runs somewhere the status bar does not report. **This is now the question to ask an administrator, and it is blocking K1** |
| **K13** | **Does Swedinox file CBS statistics returns out of easy2trade, or from somewhere else?** | New 18-9-2026. B16 computes a real CBS return — weight by commodity code by postal district, 826 rows — but `sfn_no` is `0` and `SBI code` is `Unknown SBI` on **every** row, so the two classifying fields are never filled. Building it needs a CN commodity code per product and an SBI code per company, neither of which we have. **Ask before building**. 🟡 **21-9-2026 — half of the obstacle is gone.** The **CN commodity code is a field on the product record** (`Commodity` = `72193310` on `PK304L300315`) and has been all along; the claim that we do not have it was wrong. What is still missing is the **SBI code per company**. K13 moves from "cannot build" to "one field short" — the question is now only whether Swedinox wants it |
| **K12** | **Does the rebuild replace AFAS, or sync with it?** | AFAS holds the ledger, receivables and payments (A3). This decides how journal entries, payments and credit control are built in `apps/dashboard`. **15-9-2026, error log:** during live use (Jan–May 2025) the batch sync went to **Multivers**; the AFAS jobs and a cloud "tenant id" set-up appear only afterwards. Ask which ledger the **live** system posts to today ([error-log.md](error-log.md) §2). ✅ **21-9-2026 — half answered. Live is the same as test**, so live posts to **AFAS**, and the Multivers entries are simply the older configuration the log caught mid-migration. What is left is no longer a fact about the system: it is the **decision** — does the rebuild replace AFAS, or sync with it? Nothing else can be discovered by looking; it needs Swedinox |
| **K11** | Is **`INAD`** a real person, or a shared or system account? | **Half answered:** INAD is the software vendor — `INAD Industrie Software B.V.` is a company in the C4 address file and the test company's contact is `@inad.nl`. What is left: do their support staff lift blocks on request, or does a job run under that login? It lifted **63 of 571** order blocks in the C7 `Unblocked orders` export (62 financial, 1 commercial), spread over 2025–2026. Every other unblock carries a person's name. If it is a system account, some blocks are lifted **automatically**, and that rule exists nowhere in our code. If it is a shared login, the audit trail cannot say who did it. **15-9-2026 lead:** `USERS.ISBATCH` marks a batch account — one look at the `INAD` user record settles it ([database-schema.md](database-schema.md) §3). ✅ **Answered 15-9-2026 by the error log:** jobs run as a separate `BATCH` user; `INAD`'s entries are interactive (deleting unload lines, overriding warnings, printing, changing dates) plus one migration script on 25-9-2024. **INAD is the vendor's support login used by people — the 63 unblocks were manual.** Only "on whose request" is left ([error-log.md](error-log.md) §3) |

---

# What each part unlocks

So the order makes sense:

| Do this | And this becomes buildable |
|---|---|
| **A1** | The credit block stops being an assumption |
| **B1–B5** | The whole selling side gets proved the way Purchase was — and the ledger posting becomes possible, because invoices are where posting is decided |
| **H1** | Receiving goods gets rebuilt at the right moment in the chain |
| **G1, G2** | Order and invoice detail screens get built from fact instead of one screenshot each |
| **C7, H8** | Blocking gets its missing half — how a hold is released |
| **E1–E5, G6, H11** | The certificate chain exists at all |
| **I1–I7** | Seven screens either come into scope or leave it for good |
| **K3** | Six features get declined, on purpose, in writing |

---

# When can testing start?

**Testing the parts already proved can start now.** Purchase, stock, logistics
and the credit rules are checked by **123 automated cases** against ~130 000 real
exported rows, and every money rule in them has been proved rather than assumed.
Put real work through those screens today.

**Testing the selling side should wait for Part B.** Not because the screens are
missing — they exist — but because their arithmetic has been proved on single
lines from single screenshots, and single lines are exactly how the two wrong
conclusions in this project got made.

**Part H is not testing, it is discovery.** Until a lorry arriving has been
watched end to end, the warehouse write paths cannot be built, and what cannot
be built cannot be tested. It has a runsheet of its own now: [FLOWS.md](FLOWS.md).

✅ **21-9-2026 — nothing needs re-checking against live.** Live is the same as
test, so every proved rule in this file is proved about the system that is
actually running. There is no second environment to re-capture, and no finding
carries an "on the test copy" qualifier any more.

---

## How to send it

One screenshot per numbered item, with the number. For an export: `Show in
Excel`, **leave the workbook open**, and say which number it is — I read it out
of the running Excel.

Anything impossible, greyed out, or empty is still an answer. Say the number and
what happened.
