# Planned code changes — 4 (captures of 14-9-2026)

What the 14-9-2026 captures change in `apps/dashboard`. **No code has been
changed yet.** Every item names the evidence, the code it touches (checked
against the code on 14-9-2026) and how to verify it.

Evidence lives in:

- [customers-and-prospects.md](customers-and-prospects.md) Parts 3–12 (C3–C15)
- [credit-and-blocking.md](credit-and-blocking.md) — re-capture and the Debtor panel (G12)
- [product-prices.md](product-prices.md) §1 — B11 re-run
- [capacity-overflow.md](capacity-overflow.md) — B15
- [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md) — the menus (A1–A5) and questions K1, K10–K12

Items are in the order they should be built. Group A changes behaviour that is
wrong today; B fixes reports that show wrong numbers; C adds rules and missing
columns; D is confirmed and needs nothing.

---

## A. Credit and blocking

### A1. 🔴 Hold prepayment customers and customers with no limit

**Evidence.** Financially blocked queue, 31 rows (10-9 and again 14-9): **8 of
the 11 `Credit limit exceeded` rows are `Prepayment` customers, and 9 of the 10
prepayment rows have `Credit limit` = 0.** They are held. In the reference a
zero limit means *no credit*, and a prepayment order waits for the money — the
block **is** the prepayment mechanism.

**Code today.** `assessCredit` in `lib/helpers.ts` has two "deliberate
refusals to block": a debtor with no limit recorded is never blocked, and an
order on a prepayment term adds nothing to exposure
(`exposure = owed + (extendsCredit ? orderAmount : 0)`) and returns
`blocked: false` via `!extendsCredit || totalCreditLimit <= 0 || …`.

**Change.**

- `lib/helpers.ts` → `assessCredit`: remove both refusals. A prepayment term
  counts the order in full; a total limit of `0` is a limit of `0`.
- Rewrite the JSDoc above `assessCredit` — it currently argues for the opposite.
- Keep the order of tests: blocked customer → overdue posts → limit.
- ⚠️ This **reverses** a decision recorded in PLANNED-CODE-CHANGES-2. Note the
  reversal there.

**Verify.** `scripts/verify-logistics.ts`, block `assessCredit`: add
`prepayment with limit 0 is held` and `no limit recorded is held`, and a
queue-level check: every `Prepayment` row of `financially-blocked-2026-09-14.tsv`
with limit 0 comes back `blocked: true` with reason `Credit limit exceeded`.

### A2. 🔴 Test the credit limit on the order's amount **excluding** VAT

**Evidence.** The creditspace formula holds only on excl.-VAT amounts (315 rows
fail with incl. VAT, [credit-and-blocking.md](credit-and-blocking.md)); C7's
`Order amount` equals B1's revenue excl. VAT on 436 of 436 orders.

**Code today.** `app/(dashboard)/orders/actions.ts`, `createOrder` →
`checkCredit(tx, { orderAmount: Number(summary.totalInclVat), … })`.

**Change.** Pass the excl.-VAT total from `buildOrderSummary`. Check that
`getOpenReceivables` and `getCommittedOrderValue` in
`lib/server/credit-control.ts` are also excl. VAT — the formula mixes them.

**Verify.** Harness: creditspace of a customer with one open order equals
limit − open entrees (excl.) − open orders (excl.).

### A3. 🔴 Run the credit check again after an order is let go

**Evidence.** **3 of the 29 orders held on 14-9 were unblocked before**
(`O102168`, `O101985`, `O102150`). In C7, 78 of 451 orders were unblocked more
than once, the repeats mostly **more than a week** after the first. The queue
is **one row per delivery** (`O102167`/`O102168` twice, per delivery date).

**Code today.** `checkCredit` has exactly **one** call site:
`createOrder` in `orders/actions.ts`. The comment there says "A block is only
ever added here, never lifted". Nothing re-evaluates a released order.

**Change.**

- Call `checkCredit` again when an order is **updated** (amount or lines
  change — the reference's `Order changed?` column) and when a **delivery is
  created** for it (`app/(dashboard)/deliveries/actions.ts`).
- When the re-check blocks, set `Orders.financialBlockage = true` and
  `blockingReason` again, even if an `OrderDeblocks` row exists. An unblock
  covers the situation it was given for, not every later one.
- `financially-blocked/actions.ts` (the queue): list **per planned delivery**
  once deliveries exist — add `Delivery date 1st delivery` and `Order changed?`.

**Verify.** Live walkthrough: create → block → unblock → add a line that
exceeds the limit → blocked again, with two `OrderDeblocks`-relevant states.

### A4. Two unblock types: `financial` and `commercial`

**Evidence.** C7: `Financiële deblokkering` 544, `Commerciële deblokkering` 27 —
nothing else, on 571 unblocks.

**Code today.** `lib/enums.ts` `orderDeblockTypes` =
`financial, invoice, transport, handling`. Used by `db/schema/order-deblocks.ts`,
`lib/labels.ts` `ORDER_DEBLOCK_TYPE_LABELS`, `orderDeblockTypeLabel` in
`lib/helpers.ts`, `unblocked-orders` screen, and one writer —
`financially-blocked/actions.ts` (`deblockType: "financial"`).

**Change.**

- `orderDeblockTypes` → `financial, commercial`. Labels `Financial unblock`,
  `Commercial unblock`.
- Add the commercial unblock action beside the financial one. The commercial
  block already has a policy (`orderBlockingPolicy().commercialBlockingWaived`
  in `lib/helpers.ts`); **check first** whether `Orders` has a flag that a
  commercial block sets. If not, that flag is part of this item.
- **Migration.** Enum narrowing: report `SELECT deblock_type, COUNT(*)` first.
  Any `invoice`/`transport`/`handling` rows must be remapped (to `financial`)
  before the narrow. Use the widen → update → narrow pattern of
  `scripts/migrate-sales-statuses.mjs`, then `pnpm db:push`. **Never
  `--force`.**

### A5. `Credit limit insurance` is a policy number, not an amount

**Evidence.** Mercainox Debtor panel: `Credit limit insurance` =
**`0016184861`** (leading zeros), beside `Insurance valid until` 31-12-9999.

**Code today.** `db/schema/companies.ts`: `creditLimitInsurance: decimal(15,2)`.
Forms already treat it as a string (`z.string().optional()` in
`companies/validation.ts` and `companies/[uuid]/edit/debtor/validation.ts`), but
`components/companies/company-detail.tsx` (~line 483) and
`credit-information-customers/actions.ts` (`creditInsurance`) treat it as money.

**Change.**

- Schema: `varchar("credit_limit_insurance", { length: 50 })`.
- `company-detail.tsx`: show as plain text, not formatted currency.
- `credit-information-customers`: the column is the policy number.
- `use-company-submit.ts` (~line 1914): drop the `String(…)` number coercion.
- **Migration.** Report existing non-null values first. decimal → varchar keeps
  the digits but not leading zeros that were never stored; nothing to recover.

### A6. A debtor number that is not the company code

**Evidence.** Mercainox: `Company code 12368`, `Debtor number 10059`. Dutch
Blower: `11163` / `12494`. B4 maps the two one-to-one. C8/C12 key by company
code; C9/C10/C11, C7 and the blocked queue key by debtor number.

**Code today.** No debtor-number column. `unblocked-orders/actions.ts` returns
`debtorNumber: Companies.id`; the revenue screens do the same.

**Change.**

- `db/schema/companies.ts`: add `debtorNumber: varchar("debtor_number", { length: 20 })`,
  nullable, unique. Show it read-only on the Debtor section.
- Screens that print "Debtor number" read the new column:
  `unblocked-orders`, `financially-blocked`, `customer-revenue-per-product-group`,
  `customer-revenue-per-revenue-group`, `customer-revenue-per-revenue-group-split`.
- Screens that print "Company code" / "Customer code" keep `Companies.id`.

### A7. Debtor section shows what the reference shows

**Evidence.** Debtor panel header: `Credit limit: € 1.000.000,00, Credit limit:
€ 215.952,53` = **total limit** and **credit space**. Read-only fields
`Oldest invoice date open entrees`, `Oldest due date open entrees`.

**Change.** `components/companies/sections/debtor-section.tsx` and
`company-detail.tsx`: show total limit (`effectiveCreditLimit`), credit space,
open orders / open entrees excl. and incl. VAT, and the two oldest dates
(`getOldestOpenDueDate` exists in `lib/server/credit-control.ts`; the oldest
invoice date needs the same query on invoice date).

### A8. The overdue-days threshold stays an assumption

**Evidence.** Every menu and the Debtor panel have been opened; **no screen
holds the setting**. **No code change.** `OVERDUE_POST_BLOCK_DAYS = 30` in
`lib/helpers.ts` stays, with its WARNING comment updated to say the screens are
exhausted and K1 must be answered by INAD or an administrator.

---

## B. Revenue reports that show the wrong numbers

All four reconcile against the reference to the cent (C8–C12 against B4), so
each gets a harness block that loads its export and checks our arithmetic on
the same split.

### B1. Customer revenue per product group — product half only

**Evidence.** C9 revenue = B4 `Revenue products` **9 032 601.62** exactly;
profit = products profit; options and charges are not in it.

**Code today.** `customer-revenue-per-product-group/actions.ts` sums
`InvoiceItems.amount` and `costAmount` (the whole line).

**Change.**

- Sum `InvoiceItems.revenueProducts`; profit = `InvoiceItems.profitProducts`
  (both added 13-9-2026).
- Add columns the reference groups by: `Subgroup1`, `Subgroup2` (product
  hierarchy), `Order type` = `OrderItems.sourceType` (`Stk`/`CD`), `PriceU`,
  `Sales (PriceU)` (kg ÷ 1000 for `TN`).
- `Option 1` / `Option 2`, `Transport region` and `Loading address`: deferred —
  no model for a transport region yet.

### B2. Customer revenue per revenue group — three sources, not one

**Evidence.** C10, exact on every group:

| Rows | Revenue group of | Amount |
| --- | --- | --- |
| product half of each invoice line | the **product** | `Revenue products` |
| option half of each invoice line | the **option** (`Slijpen/Folien` 3010, `Laseren` 3030, `Knippen` 3020) | `Revenue options` = 11 236.90 |
| charge lines | the **charge** (`Vrachtkosten` 8100, `Overige toeslagen` 8900, `Prijsverschillen` 8600, `Decoilen` 3000) | 18 855.71 |

**Code today.** `customer-revenue-per-revenue-group/actions.ts` sums
`InvoiceItems.amount` under `Products.revenueGroupUuid` and `innerJoin`s
`Products` — options land in the product's group and **every charge is
dropped**.

**Change.**

- Build the grid as a `UNION ALL` of three selects:
  1. `InvoiceItems.revenueProducts` → product's revenue group;
  2. `OrderItemOptions.amount` of the invoiced order line → `OrderItemOptions.revenueGroupUuid`;
  3. `InvoiceSurcharges.amount` → the charge's revenue group.
- `InvoiceSurcharges` (in `db/schema/invoices.ts`) and `OrderSurcharges`
  (`db/schema/orders.ts`) have **no revenue group**, only a `description` enum.
  Add `revenueGroupUuid` (nullable FK to `RevenueGroups`) to both, filled from a
  description → group map in `lib/constants.ts` (`transport_costs` → 8100,
  `price_differences` → 8600, `decoil_surcharge` → 3000, the rest → 8900 unless
  the charges export says otherwise — confirm against B8's `Revenue group`).
- Charge rows have no `Order type` and no `PriceU`.
- ⚠️ **Decision needed — kilos.** The reference repeats the line's weight on
  every option row, so its kg total is 34 % too high (4 527 322 vs 3 373 330).
  Recommendation: put weight on the product row only and leave option/charge
  rows at 0 — revenue and profit still match the reference exactly.
- **Migration.** Two new nullable columns, then a one-off backfill script from
  the description map. `pnpm db:push` for the columns.

### B3. Split order types — split on `orderType`, beside `Stk`/`CD`

**Evidence.** C11 has two `Order type` columns: `Stk`/`CD` and
`Normal`/`Call-off`/`Rush`. Call-off 165 672.26 and Rush 29 026.99 exact; charges
always `Normal`; C11 sums to C10 cell for cell.

**Code today.** `customer-revenue-per-revenue-group-split/actions.ts` builds
"order type" from boolean flags (`isConsignment`, `isIncidental`,
`isInternalProduction`, `isCustomerMaterial`, `isPickup`) and inherits both B2
bugs.

**Change.** Reuse B2's three-source query; group additionally by
`Orders.orderType` (labels from `ORDER_TYPE_LABELS`) and `OrderItems.sourceType`.
Charge rows: `orderType` of their order, else `normal`; `sourceType` blank.
Delete the `orderTypeLabel` CASE.

### B4. Customer revenue — material / options / surcharges

**Evidence.** C8 with Year 2025 / Month 5: `Revenue of material`, `Revenue
options`, `Revenue surcharges` and their profits, exact on 90 of 90 customers;
`#Invoice lines` counts **order lines only**; kilos **rounded to whole kg**;
an `Active` column.

**Code today.** `customer-revenue/actions.ts` returns one `revenue`, profit as
`amount − costAmount` over every line, no line count, no active flag.

**Change.**

- Columns: material = `SUM(revenueProducts)`, options = `SUM(revenueOptions)`,
  surcharges = `SUM(InvoiceSurcharges.amount)`, the three profits, total,
  `#Invoices`, `#Invoice lines` (order lines), kg rounded, margin per part.
- `Active` = `NOT Companies.isInactive`.
- Filter by one year + one month, as the reference does.
- ⚠️ Open: a **header-only surcharge invoice** (Dutch Blower, −250.00, dated
  8-8-2025) is counted in May by the reference. Do not copy that until the
  dating rule is known — note it in the action's comment.

### B5. Customerrevenue, -sales and -visits — whole year per revenue group

**Evidence.** C12: `Current year` only, no month; **809 of 809 customer ×
revenue-group cells equal C10** summed over 2025, revenue and kg.

**Change.** `customer-revenue-sales-and-visits/actions.ts`: reuse B2's
three-source query grouped by year; keep the visit columns (they read the
visit reports that exist).

### B6. Harness

`scripts/verify-logistics.ts`: one block per export (C8, C9, C10, C11, C12)
that re-derives the reference totals from B4 with the same split rules and
checks the helper we use. Numeric checks use `near()` — `next build`
type-checks `scripts/`.

---

## C. Rules and columns on companies, addresses and contracts

### C1. A company is a customer **or** a prospect, never both

**Evidence.** C3: `Customer` xor `Prospect` on 6 796 of 6 796 rows.

**Code.** `companies/validation.ts`: `roles: z.array(z.enum(companyRoles)).min(1)`.

**Change.** Add a refinement: `customer` and `prospect` cannot both be selected
(message: "A company is either a customer or a prospect"). Same rule in the
server action of `companies/[uuid]/edit/roles/actions.ts`. Converting a
prospect means replacing one role with the other.

**Migration.** Report companies holding both roles before shipping; decide per
row.

### C2. Address rules

**Evidence.** C4 on 3 414 companies: **exactly one** visiting address,
**exactly one** correspondence address, **at most one** invoice address, any
number of delivery addresses; a **PO box is correspondence-only** (744 of 745).

**Code.** `companies/[uuid]/edit/addresses/actions.ts` saves
`category: parsed.data.category` with no cross-row check.

**Change.**

- Server-side check over all of a company's addresses before saving: one
  `visit`, one `correspondence`, ≤ one `invoice`.
- Row check: `poBox = true` ⇒ `category` is exactly `["correspondence"]`.
- Same checks in the address form's zod schema for immediate feedback.
- The reference's `Categories` text mislabels delivery as `Bezoek` — our
  `category` array is already the flags. ✅

**Migration.** Report violating companies first; do not block editing of
existing bad data, only saving a new violation.

### C3. Contacts stop carrying copies of the company

**Evidence.** C3: 17 company-level columns identical across every contact of a
company (2 188 of 2 188), and the address columns equal the C4 rows.

**Code.** `db/schema/contacts.ts` has its own `isCustomer`…`isOther`, address,
region, credit-limit and revenue columns. **33 reads in 18 action files**
(`customers-and-prospects`, `unblocked-orders`, `customer-revenue*`,
`remarks-per-company`, `visit-schedule`, `suppliers`, …) take city, country or
region from the first contact.

**Change — phase 1 (this round).** Every one of those reads takes city/country
from the **visiting** `CompanyAddresses` row and roles/region from `Companies`.
A shared subquery in each action (or one helper in `lib/server/`) replaces the
`MIN(Contacts.id)` join.

**Phase 2 (later, separate commit).** Stop writing the copied columns in
`use-company-submit.ts`, then drop them with a migration.

### C4. `Link to new customer` does what it says

**Evidence.** C6: `PACKAGING COSTS` + `PALLET COSTS` on 82 companies, **same
starting date on all 82**, dates only since go-live. B8: the contract is a
default, not the rule behind every charge (52 charged without it).

**Code.** `Contracts.linkToNewCustomer` is stored, shown and copied between
forms — nothing acts on it.

**Change.** In `createCompany` (`companies/actions.ts`), when the new company is
a customer or prospect: find the contracts flagged `linkToNewCustomer`, insert
a copy for the new company with `startingDate` = today and `endDate`
`9999-12-31`. **Check first** how a template contract is stored (company-less,
or on one company) before choosing the source query.

**Verify.** Create a customer → both charge contracts appear under Contracts.

### C5. Contracts per customer — duplicate rows

**Evidence.** C4: one visiting address per company. C6 columns.

**Code.** `contracts/actions.ts` → `getContractsPerCustomer` `leftJoin`s
**every** `CompanyAddresses` row, so each contract repeats once per address.
`getContractsPerSupplier` has the same join.

**Change.** Join only the address whose `category` contains `visit`. Add
`Representative`, `Customer group`, `Starting date`, `End date`, `Region`.

### C6. Remarks per company — list every company

**Evidence.** C5 prints 2 531 companies, 985 with a remark.

**Code.** `remarks-per-company/actions.ts` filters to non-empty remarks.

**✅ Decided 14-9-2026: no change.** Keep the list to companies **with** a
remark (985), as `/remarks-per-company` does today. A deliberate difference
from the reference, which prints all 2 531.

---

## G. Batch registration and certificates (E2–E5, added 14-9-2026)

Evidence: [batch-registration.md](batch-registration.md).

### G1. 🔴 Sending certificates lists every delivered line with a batch

**Evidence.** E4 has 3 271 rows and **not one** has a certificate document —
the reference lists delivered lines by batch whether or not a certificate
exists.

**Code today.** `sending-certificates/actions.ts` →
`getDeliveryCertificateRows("certificate-received")` filters on
`isNotNull(BatchCertificates.receivedDate)`. With no certificates recorded, the
screen is empty where the reference shows 3 271 rows.

**Change.** Mode `certificate-received` filters on *delivered line with a
batch*; certificate columns become plain left-joined values.

### G2. 🔴 One row per batch per sales line

**Evidence.** 145 of 1 831 sales lines shipped from 2–5 internal charges.

**Code today.** The same action joins
`Batches.stockUuid = OrderItems.stockUuid` — one lot per line, so a line picked
from several lots shows only the lot it was reserved against.

**Change.** Join through the lots actually **picked** for the line (the
warehouse work-order picks, which already carry `internalCharge` —
`warehouse-work-orders/actions.ts`), one row per picked lot. Qty and kg come
from the pick, not the line.

### G3. Bill of lading on the delivery side

**Evidence.** E4's `Bill of lading` is the sales series (`301005`); E2's is the
supplier's (`SGN2566950`).

**Code today.** `getDeliveryCertificateRows` returns
`billOfLading: BatchCertificates.billOfLading` — the purchase side.

**Change.** Take the delivery's bill of lading for E4/E5; keep
`BatchCertificates.billOfLading` for E2.

### G4. The internal charge is generated at receipt

**Evidence.** `YY` + four letters, counted up per year, on 2 540 of 2 540 rows;
one charge per receipt of one purchase line (82 of 82 multi-row charges share PO
line and product).

**Code today.** `internalCharge` exists on `Stock` and `Batches` and is copied
through warehouse and production work orders, but it is **typed or edited by
hand** (`batches/actions.ts` `chargeUpdates`, the work-order forms). Nothing
assigns one.

**Change.**

- `lib/helpers.ts`: `nextInternalCharge(year, lastCharge)` — `25AAAZ` → `25AABA`,
  and `26AAAA` when the year turns.
- Assign it when a purchase line is **received**
  (`purchase-line-receivals` flow), once per receipt line, onto every lot that
  receipt creates. A hand-typed value still wins (imported history).
- Stock found in the warehouse (the reference books it through the
  `Hego Voorraadcorrecties` pseudo-supplier) gets one too — on our stock
  correction, not as a fake purchase.

**Verify.** Harness: the format regex matches all 2 540 E2 rows; the
generator's successor of each charge is lexically next.

### G5. The batch survives processing — confirmed, keep it

**Evidence.** 92 of 1 662 charges sold as a different product than received,
same heat and PO on 1 662 of 1 662.

**Code.** `production-workorders/actions.ts` already copies `internalCharge`
to output and remnant lots. ✅ Add a harness check that a cut's outputs carry
the source's `charge` **and** `internalCharge`.

### G6. Certificates to be linked is not "certificates without a date"

**Evidence.** E3's columns are an electronic certificate-exchange message log
(`Invoked method`, `Retry possible`, `Last error message`,
`User interaction required`); empty.

**Code today.** `certificates-to-be-linked/actions.ts` lists `BatchCertificates`
rows with `receivedDate IS NULL`.

**Change.** ⚠️ **Decision E3 below.** Either show the screen empty with a note
that no exchange is connected, or remove it from the sidebar until one is.
Do not repurpose `receivedDate` for it.

### G7. Import notes (no code)

- `Charge` values `nvt`, `ntv`, `-`, `x`, `r`, and two-letter country codes are
  "no heat number" → import as null.
- `Length` `999999` → null (coil / off-the-roll).
- Rows from supplier `Hego Voorraadcorrecties` are stock corrections, not
  purchases.

---

## D. Confirmed — no change

| What | Evidence |
| --- | --- |
| `companyRoles` (nine roles) | Company window tick boxes (G12) |
| `contactCategories` (six) | `TESTBEDRIJF BV` contact, C3 §16 |
| `OrderDeblocks` shape (who, when, type — no reason) | C7 §13 |
| `Companies.remarks` one text per company | C5 §24 |
| `CompanyAddresses.availableAt` single choice | crane and forklift never both, C4 §22 |
| `blockedByUserId` + `blockedByNote` | Debtor panel `Blocked by` + note |
| `OrderLineCapacityOverflows` | B15 procedure name `…CapacityOverrides` |
| `Batches` columns (charge, internal charge, sheet number, stock category, quality code, producer, options, document fields) | E2 / E4 column lists |
| Deliveries from the missing batch = delivered line with no batch | E5 empty, E4 complete |
| No product price list; price typed on the line | B11 re-run: gross, markup, A–D all 0 |
| Visit/call planning | C13–C15: nothing planned, 3 visits ever — do not build more |
| `profitMarginPercent` returns 0 on zero revenue | C9–C11 `#DIV/0!` code `-2146826252` |

Import notes (not code): `APP` has negative values — clean before using as cost
(B11); contact categories need an alias map (C3 §16); Excel's `-2146826252` is
an error value, not a number.

---

## E. Decisions and questions before building

| # | Question | Blocks |
| --- | --- | --- |
| E1 | **Kilos on option and charge rows** — copy the reference's double count, or weight on product rows only? (recommendation: product rows only) | B2, B3, B5 |
| ~~E2~~ | ~~**Remarks per company**~~ | ✅ **only companies with a remark** — C6 needs no change |
| E3 | **Certificates to be linked** — keep the screen (empty, "no exchange connected") or hide it until an integration exists? | G6 |
| K1 | Overdue days before `Post(s) outstanding for too long` | A8 |
| K10 | Is the batch scheduler / AFAS sync meant to be off? | A-group data |
| K12 | Replace AFAS, or sync with it? | future finance posting |

---

## F. Order of work and checks

1. **A1, A2, A4, A5** — small, behavioural; one migration script for A4 + A5.
2. **A3** — the re-check at update and delivery.
3. **A6, A7** — debtor number column and the Debtor section.
4. **B2** first (adds the surcharge revenue group), then **B1, B3, B4, B5**, then **B6**.
5. **C1, C2, C5, C4**, then **C3 phase 1**. (C6 decided: no change.)
6. **G1–G3** together (one action), then **G4**, **G5**'s harness check, **G6** after decision E3.

After each group:

- `node scripts/<migration>.mjs` (report) → `--apply` → `pnpm db:push` — **never `--force`**
- `pnpm build` (type-checks `scripts/` too) and `npx eslint .`
- `npx jiti scripts/verify-logistics.ts` — all checks pass, new ones included
- commit only when asked
