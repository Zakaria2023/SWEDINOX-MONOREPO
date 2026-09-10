# Purchase — the 10 % left

Everything in the Purchase group that is **not** finished, and why. Audited
against the code, not remembered.

The other 90 %: all twelve screens documented, two removed from scope, every
money formula proved against real exported rows, and 96 checks plus two export
diffs (151/151 receivals, 107/107 purchase lines) passing.

---

## ✅ Done — the four that were not blocking

All four are built and verified; 16 checks drive the real actions.

1. **`Qty ordered` and `Qty confirmed` reach the screen.** Purchase lines
   shows both, and both are export columns — hidden by default, since the
   reference keeps them off its own default view too.
2. **`Pre-notify` exists.** It stamps the advised date on every reception of
   an order that has **not** arrived yet and leaves the arrived ones alone,
   because pre-advising the past is nonsense. The order moves to
   `pre_notified`. `preAnnouncedDeliveryDate` is no longer a dead column.
3. **A density can be typed.** One field on the product form, above the three
   weights, with a note that it overrides the grade. Blank reaches the column
   as null rather than as an empty string, so leaving it alone still falls back
   to the grade — 31,6 kg for a 2 mm 304L plate from the table, 31,4 with the
   reference's own 7,850.
4. **The receivals table shows all 25 columns.** `Supplier code`,
   `Purchase order date`, `Price quantity (in gross price U.)`, `Initials`
   and `Length` were the five missing; length now renders the coil sentinel
   blank like everywhere else.

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

✅ **The order the discounts apply in is cascading, and no longer a guess.**
Every captured row had 0 % in both boxes, where the two readings agree, so it
took a line typed by hand on 10-9-2026: quote 900003 printed €921,50 on €1.000
at 5 % and 3 %, against €920,00 for additive. See
[discount-basis.md](discount-basis.md).

---

## 🟠 Unblocked — the answer arrived

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

**✅ Answered.** An 11 625-row export of
[Warehouse work orders](warehouse-workorders.md) shows goods being booked in by
approving a work order of type **`Unloading`** — the only type with no
`From-location`, always against a purchase order, never against a sale, and
with `Kg(a)` filled on 100 % of approved rows against 5 % of new ones.

So the chain is
`purchase order → transport pick-up → warehouse unloading → approve → invoice`,
and it can now be built rather than guessed at.

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
| **Now buildable** | items 6–7, the receipt chain — the answer arrived |

Items 1–4 are done. Item 5 waits on thirty seconds of typing. Items 6–7 are
the only reason Purchase is not finished, and both are now buildable — the
receipt chain is understood, and the weighed weight belongs with it because
that is where the weighing happens.
