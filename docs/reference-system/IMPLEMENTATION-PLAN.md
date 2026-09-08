# Implementation plan

What is built, what is next, and what is waiting on an answer. Written so that
picking this up cold costs one read rather than a re-derivation.

The rule throughout: **a figure the reference derives, we derive.** Everything
below either has a proof against real exported rows or is marked as an
assumption with what would settle it.

---

## ✅ Built and verified

| Commit | |
|---|---|
| `6a5cf65` | price weight, not piece count, everywhere money is worked out |
| `a68bff6` | options charged on their own basis; sentinels stop being read as data |
| `a169aed` | Make final, Confirm, Split; the gross-to-net chain |
| `eaf5e49` | purchase line amount derived, not trusted |
| `361dc08` | the product's stored piece weight, not its dimensions |
| `5f3359d` | the chart bounded; a density per product |
| *(this one)* | Purchase results rebuilt at the right grain |

**The rules now in code**, each proved against the reference's own figures:

```
weight per piece = length × width × thickness × density
amount           = price × weight, in the price's own unit (TN divides by 1000)
option amount    = price × the measure its own Per column names (M2, TN, KG, M1, ST)
stock value      = kg × valuation price ÷ 1000
purchase line available = qty(p) − qty(a) − reserved, clamped
stock lot available     = quantity − reserved
VAT high         = 21 %
```

**Verification suites** live in the session scratchpad and are worth keeping:
`verify-all` (29), `verify-batch2` (27), `verify-batch3` (23),
`verify-density` (7), plus `seed-receivals` and `diff-lines`, which load the
real 151-row export and diff our screens against it — **151/151 and 107/107**.

They need three jiti stubs to run outside Next: `server-only`,
`@/emails/documents` and `next/cache`.

---

## 🔜 Next, in order

### 1. The receipt chain — **no longer blocked**

**The problem.** Ours creates the stock lot when the **purchase invoice**
arrives (`purchase-invoices/actions.ts`). The reference almost certainly books
goods in at **receipt**, via a warehouse work order — 53 of 151 receptions read
`Workorders created`, and a reception cannot be typed into by hand. If so, our
goods exist too late and the invoice is doing the warehouse's job — the same
mistake already corrected on the sales side.

**Answered by an 11 625-row export of
[Warehouse work orders](warehouse-workorders.md).** Goods are booked in by
approving a work order of type **`Unloading`** — the only type with no
`From-location` (3 179 of 3 179), against purchase orders (3 117) and never
against a sales order. `Kg(a)` is filled on 100 % of `Approved` rows and 5 %
of `New` ones, so **approving is the step that receives the goods**.

The chain:

```
purchase order
  → transport work order   Pick-up: fetch it from the supplier
  → warehouse work order   Unloading: no source, into Ontvangst or a rack
  → approve it             fills Kg(a); the goods now exist
  → purchase invoice       values what is already there
```

**Half of it is now answered.**
[Transport work orders](transport-workorders.md) shows inbound goods being
**collected**: a line's `Action` is `Pick-up` for a purchase and `Deliver`
for a sale, and the detail panel under a `Pick-up` line names the purchase
order it belongs to — `401059 HW-Inox GmbH`, status `Partially received`. So
a purchase order is planned onto a trip, the trip walks
`Loading list → Loading document → Loaded → departed`, and the lot is moved
to a real stock location (`Laad`, or `Bewerkers` when it goes out for
processing). What is still unknown is only the last link: whether completing a
pick-up is what fills a reception's `Kg(a)`.

**When answered, the shape is:**

- a released reception raises a `WarehouseWorkOrders` row, from `Ontvangst` to
  a location or machine
- booking that work order in fills the reception's `kgActual` / `qtyActual`
  **and** creates the `Stock` lot
- `purchase-invoices` stops creating stock and only values what is already
  there
- receipt status walks `New → Released → Workorders created → Received`

**Now buildable.** What is still unknown is narrow: whether approving an
`Unloading` also writes the reception's `Kg(a)` or whether the two are
independent, and what moves a work order `New → Released → Approved`. Both can
be settled from the export or by reading one work order, not by guessing.

### 2. The price build-up

The [`Pricing` panel](purchase/purchase-order-detail.md) holds more than we
model:

```
  Base price + Quantity surcharge + Color surcharge + Length surcharge
= Gross price
− Line discount % − Extra discount % − Group discount %
= Net price
```

Ours has `grossPrice`, `groupDiscountPercent`, `lineDiscountPercent` on
`PurchaseOrderItems` and `PurchaseQuoteItems`, and `netPriceAfterDiscounts`
applies two of the four. **To add:** the three surcharges, `extraDiscountPercent`,
and the two `Transfer … to order line` flags that say the build-up is computed
on the order and pushed to the line.

⚠️ **The discount order is an assumption.** Cascading, not additive — every
captured row had 0 % in both boxes, where the two agree. €1.000 at 5 % and 3 %
is €921,50 cascading and €920,00 additive. **One quote line with real figures
in both boxes settles it.**

### 3. Weighed weight beside theoretical

An order is *placed* on theoretical weight and *billed* on the **weighed**
weight — the purchase order's own printed terms say so, and it is why
`Previous orders` drifts in both directions.

**To add:** a weighed weight on the receipt, distinct from `kgPurchased`;
amounts on an invoice line taken from it when present, from theoretical when
not. Ours has one weight per line today, which is why our own orders reconcile
exactly and the reference's real ones do not.

### 4. ✅ Purchase results — done

It was built, but **aggregated**: a `GROUP BY` over group, product, year and
month, which the export disproves outright — 1 800 rows cover only 466
(subgroup, date) pairs and one subgroup on one day carries 29 rows with 29
different values. Now one row per receipt, ordered newest first, with `Year`
and `Month` derived from the receipt date and a `Subgroup` column it never
had.

`Purchase value` is that receipt's own weight at its line's price, so a line
received in instalments contributes once per instalment and the parts sum to
the line.

The three dead columns are **left out**: `Replacement value` is zero on all
1 800 rows, which makes both difference columns dead with it and the percentage
impossible to reconstruct. The old code computed a replacement value from the
last purchase price — inventing a number the reference does not have. Say the
word and they go back in.

Verified: 10 checks, including that the middle level of the hierarchy is
skipped and that the three dead columns are genuinely absent.

### 5. Smaller, unblocked

- **`densityKgDm3` needs a field on the product form.** The column and the
  logic exist; nothing can set it yet.
- **`extraDiscountPercent`** and the three surcharge columns (with §2).
- **The option enum** is at least ten members pooled across screens; ours is
  seeded from whatever `SalesOptions` holds. Reconcile them.
- **`Purchase results` and `Purchase quotes` columns** are matched in the docs
  but the screens do not show them all.

---

## 🚧 Assumptions to revisit

Each is in the code with a comment saying so.

| Assumption | Where | What settles it |
|---|---|---|
| Discounts cascade rather than add | `netPriceAfterDiscounts` | one quote line with both boxes filled |
| An unknown price unit means tonnes | `amountForWeight` | a line priced per 100 kg — three exist in the export |
| An unknown option basis means piece count | `optionAmount` | the full option list with each one's `Per` |
| `weightTheoretical` is a piece weight | `productPieceWeightKg` | proved for ours; the reference stores a density in the same-named field, so imported data needs care |

---

## 🩹 Known divergences, deliberately left

- **Density.** Ours comes from the grade table — 8,000 for 316 — where the
  reference stores 7,850 on the product, making a 2000×1000×4 plate 64,0 kg
  instead of 62,8. `Products.densityKgDm3` now overrides it, but nothing is
  backfilled: 5 625 products still derive from their grade. Changing the
  metallurgy table on one observed product would be worse than the gap.
- **`ImportedPurchaseInvoices`** still exists in `db/schema/integrations.ts`
  and nothing reads it. Dropping it needs a `db:push` that deletes a table.
  `integrations.ts` itself must stay — `sigmanest-blocked-orders` uses it.
- **`/purchase-quotes` stays** as a read-only table by explicit decision, even
  though at most one quote exists in three years and it is a test entry.

---

## ⚠️ Two operational notes

**Never run `drizzle-kit push --force` on this database.** It tried to
`TRUNCATE OrderItems` — 194 rows — merely to widen an enum, and only a foreign
key stopped it. Widen enums and add columns with plain `ALTER TABLE`, count
rows before and after, then run a normal `pnpm db:push` to confirm the schema
reports in sync.

**Three files were already prettier-unclean at HEAD** — `lib/helpers.ts`,
`purchase-quotes/actions.ts`, `purchase-requests/actions.ts`. Check each file's
HEAD state before formatting it, or the diff fills with unrelated churn.
