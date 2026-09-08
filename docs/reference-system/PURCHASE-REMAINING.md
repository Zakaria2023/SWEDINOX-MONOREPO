# Purchase — the 10 % left

Everything in the Purchase group that is **not** finished, and why. Audited
against the code, not remembered.

The other 90 %: all twelve screens documented, two removed from scope, every
money formula proved against real exported rows, and 96 checks plus two export
diffs (151/151 receivals, 107/107 purchase lines) passing.

---

## 🟢 Can be done now — nothing is blocking these

### 1. Two columns are computed and then never shown

`Confirm` fills `qtyOrdered` and `qtyConfirmed` on every line of an order, and
`Make final` fills `qtyOrdered`. Both are written, both are correct, and
**neither appears on any screen**. The reference shows them on Purchase lines
as `Qty ordered` and `Qty confirmed`.

*Fix:* two columns on the Purchase lines table and its export. Half an hour.

### 2. `preAnnouncedDeliveryDate` is dead

Added to `PurchaseLineReceivals` because the reference's reception carries it
and `Pre-notify` is what fills it. **Nothing reads or writes it.**

*Fix:* either build the `Pre-notify` action that stamps it, or drop the column.
Building it is the better half-hour — it is a real step in the reference's
chain, between confirming an order and receiving it.

### 3. A density can be stored but not typed

`Products.densityKgDm3` exists, `weightPerMetreOf` honours it, and it is proved
to reproduce the reference's 62,800 kg exactly. **The product form has no field
for it**, so no product can ever have one.

*Fix:* one field on the product form, beside the existing weights.

### 4. The receivals screen shows 20 of 25 columns

Matched in the docs but missing from the table: `Company code`,
`Purchase order date`, `Price quantity (in gross price U.)`, `Initials`,
`Length`. The action already returns the first three.

*Fix:* five columns. An hour, including the export.

---

## 🟡 Needs one answer first — small once it arrives

### 5. Three surcharges and a fourth discount

The [`Pricing` panel](purchase/purchase-order-detail.md) builds a price like
this:

```
  Base price + Quantity surcharge + Color surcharge + Length surcharge
= Gross price
− Line discount % − Extra discount % − Group discount %
= Net price
```

Ours has `grossPrice`, `groupDiscountPercent` and `lineDiscountPercent` —
**three of the seven**. Missing: the three surcharges and `extraDiscountPercent`.

⚠️ **And the order the discounts apply in is a guess.** Cascading, not
additive. Every captured row had 0 % in both boxes, where the two agree.
€1.000 at 5 % and 3 % is €921,50 cascading against €920,00 additive.

*Blocked on:* one quote line with real figures typed into both discount boxes.
See [WHAT-I-NEED-FROM-YOU.md](WHAT-I-NEED-FROM-YOU.md) item 2 — it takes thirty
seconds and settles the whole thing.

---

## 🔴 Blocked properly — do not build on a guess

### 6. Goods are received too late

**This is the one that matters.**

Ours creates the stock lot when the **purchase invoice** is posted. The
reference does not:

- a reception's `Kg(a)` cannot be typed into at all
- `Batch registration` and `Split` stay greyed even on a released order
- 53 of 151 receptions in the export read `Workorders created`
- inbound lines sit in the transport plan with `Action = Pick-up` against a
  purchase order, and the trip moves the lot to a real stock location

So the chain is almost certainly
`purchase order → transport pick-up → warehouse work order → stock`, and ours
skips all three middle steps.

*Blocked on:* [manager question 4](MANAGER-QUESTIONS.md) — *when a lorry
arrives, which screen do you open?* Nothing could be received on the test
install, most likely because `Batchscheduler is not active`.

**Do not start this before the answer.** Every transition in it is a guess, and
guessing is how the weight bug got in.

### 7. Weighed weight beside theoretical

An order is *placed* on theoretical weight and *billed* on the **weighed**
weight. The purchase order's own printed terms say so:

> *Uitsluitend het gewogen gewicht wordt ons als basis voor de facturering
> geaccepteerd* — only the weighed weight is accepted as the basis for
> invoicing.

It shows up three times: `Previous orders` billing 1.438 kg against a
theoretical 1.475,8 on one line and 5.825,8 against 5.809 on another, and the
transport plan carrying `Planned 305 kg` beside `Ready 316 kg` on nine coils.

Ours has **one** weight per line, which is why our own orders reconcile exactly
and the reference's real ones never do.

*Fix, once §6 is settled:* a weighed weight on the receipt, and invoice
amounts taken from it when present. It belongs with the receipt chain because
that is where the weighing happens.

---

## ⚪ Deliberately not done

- **The three dead columns on Purchase results.** `Replacement value` is zero
  on all 1 800 rows, so both difference columns are dead with it. The old code
  faked a replacement value from the last purchase price. Say the word and they
  go back in as zeros.
- **`/purchase-quotes` stays** a read-only table, by your decision, though at
  most one quote exists in three years and it is a test entry.
- **`ImportedPurchaseInvoices`** still sits in the schema with nothing reading
  it. Dropping it needs a `db:push` that deletes a table.
- **Backfilling densities.** 5 625 products still derive weight from the grade
  table. Changing a metallurgy table on one observed product would be worse
  than the gap.

---

## In short

| | |
|---|---|
| **Can do now** | items 1–4 — about half a day |
| **One 30-second answer away** | item 5 |
| **Properly blocked** | items 6–7, the receipt chain |

Items 1–4 are worth doing whenever there is a gap. Items 6–7 are the only
reason Purchase is not finished, and neither can be started honestly until
somebody says how goods arrive.
