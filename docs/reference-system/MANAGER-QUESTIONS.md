# Manager questions

Questions that **cannot be answered by clicking**. They need someone who knows
how the business actually works — what a field is *for*, whether a process is
still used, what should happen in a case the test system has no example of.

[STEPS.md](STEPS.md) holds things I can find out by looking.
[ANSWERED.md](ANSWERED.md) holds what is already settled. This file holds the
rest.

---

## Purchase quotes

**Decision taken:** the screen **stays** as a read-only table view. It is not
removed, and its actions do not matter for now. All of its open questions moved
here rather than staying in the step list.

### What we know

The screen has effectively no data. Filtered `7-9-2023 … 7-9-2026` it returned
**one line**, and that line is a mistake:

| Field | Value |
|---|---|
| Supplier | Holland Stainless Int (`11692`) |
| Purchase quote / Line | `900000` / `10` |
| Quote date / Valid u/i | 22-6-2026 / **22-6-2026** — same day |
| Status | `Expired` |
| Expiration reason | **`Incorrectly entered`** |
| Product | `Offerte` (Dutch for *quote*) / `Steel Offerte` |
| Quantity / Kg / Amount | 1 TN / 1 000 / **€ 0,00** |
| Consignation | ☐ |

⚠️ **A caveat on the count.** Re-running with `Quote date` **from** left blank
and **u/i** set to `31-12-2099` returned **zero** rows — *fewer* than the
narrower range did. So the blank `from` voided the filter rather than widening
it; it did not prove the table is empty. The honest statement is: **at most one
quote exists in the three years to September 2026, and it is a test entry.**

If you ever want the real total, set **from** to `1-1-2000` (a real date, not
blank) and **u/i** to `31-12-2099`.

### The questions

**1. Does the business raise purchase quotes at all?**
Formally asking suppliers to quote, recording their answer, then converting the
winner into an order. Or does buying happen by phone and e-mail, with the order
entered directly?
*Why it matters:* if quotes are never raised, the screen stays a stub forever
and nobody should spend time on its detail form, its conversion flow, or its
expiry handling.

**2. What is `Expiration reason` for?**
The one row reads `Incorrectly entered`, which is a data-cleanup value rather
than a business one. The real list is unread.
*Why it matters:* by our own rule an enum has to **decide** something, not just
be stored and labelled. If a reason triggers a re-quote, warns about a supplier,
or feeds a report, it is a real field. If it is only a note, it is a text column.

**3. How are goods actually booked in?**
A reception cannot be typed into: `Kg(a)` and `Qty(a)` will not take focus,
and `New`, `Split`, `Batch registration` and `Charge aanpassen…` are greyed
even on a released order. `Warehouse workorders` from the order does nothing.
Yet 53 of the 151 receptions in the export read `Workorders created`.

*Why it matters:* this is the biggest open question in the whole purchase
chain, bigger than consignment. Ours creates the stock lot when the purchase
invoice arrives. If the reference books goods in at receipt, from a warehouse
work order, our goods exist too late and the invoice is doing the warehouse's
job. Somebody who receives deliveries can answer it in one sentence: *when a
lorry arrives, which screen do you open?*

**4. What does ticking `Consignatie` change — and where does it go?**
It is a **header** checkbox on a quote, spelled `Consignatie` (Dutch,
untranslated) and sitting under `Overlength` — *not* a line field, as the
overview's `Consignation` column had suggested. A test quote was created with it
ticked and converted to order `401154`.

⚠️ **The order header has no `Consignatie` checkbox at all.** Its top-right
block holds `Overlength`, `Printed`, `Mailed`, `Faxed`,
`Message sent via StaalWeb` and `Do not print prices` — nothing about
consignment. So either it is a quote-only concept that the conversion drops, or
the flag lives somewhere on the order nobody has looked at yet.

*Why it matters:* this is the one Tier 1 question that changes the database. Our
`Stock.ownerCompanyUuid` models consignment by *whose* the stock is. If the
reference cannot even carry the flag onto an order, consignment purchasing may
not be a real process here — worth knowing before modelling it.

⚠️ **Could not be tested.** Two orders were built with `Consignatie` ticked
on the quote (`401156` and `401157`); neither could be received, because a
reception cannot be filled in by hand — see question 3. Until goods can be
booked in, no lot exists to read a value off.

**5. Three reference fields — which is which?**
`Quote nr. supplier`, `Onze referentie` (*our reference*) and
`Purchase Reference`. All three are blank on the only row. The quote header's
own `Quote No` is also blank while the overview shows `900000`, so I have
*inferred* that the header field is the supplier's number and `900000` is ours —
inferred, not proved.
*Why it matters:* three reference fields is either a real distinction worth
copying, or historical clutter worth collapsing into one.

**6. Is `Revenue group` chosen on the quote line, or inherited from the
product?**
The one row reads `2900 / Other products`. Revenue groups are a sales-and-finance
concept everywhere else in the system.
*Why it matters:* if a buyer can override it per line, purchases can be reported
against a different group than the product's own, and we need the column on the
line. If it is inherited, we join it.

**7. What are `Afhalen` and `Hego Prod - Lossen` for?**
Two toolbar buttons on the quote detail — *collect* and *unload* — that appear
on a purchase document. Warehouse actions on a quote is an odd pairing.
*Why it matters:* if they raise real warehouse movements, the quote is not
merely a request for a price and our model is wrong about what a quote is.

**8. Why does a quote have the same delivery block as an order?**
The quote header carries `Delivery terms`, `Delivery address`,
`Arrange transport`, `Pick up/Drop-off CD-purchases`, and the same
`Date` + `Rem` / `Week` + `Year` radio pair. A quote is a question about price,
yet it commits to a delivery arrangement.
*Why it matters:* it decides whether our quote table needs the whole delivery
shape or just a price and a validity date.

### What is already settled about this screen

Recorded in [purchase-quotes.md](purchase/purchase-quotes.md), and not in
question here:

- All **27 columns** are matched.
- **The discount model** — `Net = Gross − Group % − Line %`, then
  `Amount = Net × weight` in the price's own unit. Both discounts are
  percentages with their own `%` unit columns. This is the most valuable thing
  the screen gave us, and it applies to purchase **orders** too.
- **`Company code` is the supplier's**, not a branch.
- **`Length`/`Width` are millimetres.**
- **`Initials purchaser` and `Purchaser` agree**, so store one field.
- **The header is the same layout as a purchase order's**, plus a `Quote` block
  and a `Follow-up` block whose `Expired because` is the overview's
  `Expiration reason`.
- **`Purchase order type` is the same two-dropdown pair** as on the order.
- The quote's product `Offerte` is a **`Stuksartikel`** (piece article), which
  is what revealed that the product master's `Basis` panel changes shape by
  product type — no dimensions, and weight stored per piece instead of derived
  from a density. That qualifies the weight formula across the whole system.

## Purchase requests and purchase return orders

Two document types appear in the `Nieuw` menu that no captured screen has ever
shown: **`Purchase request`** and **`Purchase return order`**. The company
master has a `Purchase returns` panel, which is the return order's overview.

**9. Are either of these used?**
*Why it matters:* a purchase request is usually an internal "please buy this"
that becomes an order — a step before the quote. A return order sends goods back
to a supplier, which has to reverse stock and money. Neither is in scope, and
neither should be until someone says they are used.
