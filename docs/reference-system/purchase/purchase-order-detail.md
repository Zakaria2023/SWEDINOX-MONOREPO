# Purchase order — the detail screen

Reached by opening a row from [Purchase receivals](purchase-receivals.md) (or
any purchase overview) with `Show Purchase order`. Ours: not yet built.

Captured from **order `400253`, Aperam Service & Solution Germany** — the same
order two of the receivals rows belong to, which is what makes it useful: its
figures cross-check against the export.

The window title carries the supplier and its contact details *and* the
document's flags: `Purchase order 400253, Aperam Service & Solution Germany,
Tel: 0049 2104 2829756, Fax: - Released, Printed, Mailed`.

**Toolbar**: Print… · Send… · Return · Par. return · Confirm · Pre-notifiy ·
Show company · Copy · Workorder · Options… · Relocate | Purchase lines

`Return` and `Par. return` (partial return) are greyed here — so a return is
only possible in some states. `Pre-notifiy` is misspelled in the reference; ours
spells it *Pre-notify*.

## Header

| Group | Fields |
|---|---|
| *(top left)* | `Creation date` · `Supplier` (code + name) · `Agent` · `Contact` · `Purchaser` · `Order category` · `Reference` · `Onze referentie` |
| Purchase order type | **two dropdowns under one caption** — see below |
| *(flags)* | `Overlength` ☑ greyed · `Printed` ☑ · `Mailed` ☑ · `Faxed` ☐ · `Message sent via StaalWeb` ☐ greyed · `Do not print prices` ☐ |
| Finances | `Payment terms` — e.g. *Within 14 days from date of invoice* |
| Delivery | `Delivery terms` (*(CPT) Carriage paid to*) · `Delivery address` · `Arrange transport` ☐ · `Pick up/Drop-off CD-purchases` ☐ · `Supplier address` · then **`Date` + `Rem` OR `Week` + `Year`**, as a radio pair |
| Summary | `Materials` · `Options` · `Surcharges` · `Tot. excl. VAT` · `VAT` · `Tot. incl. VAT` · `Total weight` |

Two things to copy:

- **`Onze referentie` is Dutch** ("our reference") and sits beside the English
  `Reference`. So one is the supplier's reference and the other ours. Both need
  English captions — *Supplier reference* and *Our reference*.
- **The delivery date is either an exact date or a week number.** A radio pair
  chooses: `Date` + a free-text `Rem`(ark), or `Week` + `Year`. Steel is often
  ordered to a week, not a day. Our schema needs both, plus the flag saying
  which one was entered.

`Printed` and `Mailed` render in **red** when ticked, which is how the screen
signals the document has already gone out.

### `Purchase order type` really is two fields

Earlier, from the overview alone, this was recorded as one field duplicated —
because both tooltips read the same. **The detail screen disproves that**:
there are two stacked dropdowns under the single `Purchase order type` caption,
the first reading `Materials` and the second `-empty-`.

And [Purchase lines' `-empty-` view](purchase-lines.md#columns--the-full-palette-from-view---empty-)
finishes the job, showing them as two distinct columns with two distinct value
sets: one holds the **document kind** (`Purchase order`), the other holds
`Materials` / `Processing`. Both are captioned `Purchase order type`, and the
filter bar uses that caption for either one.

## A freshly converted order — `401154`

Converting quote `900000` produced order **`401154`**, which fills two gaps in
the capture of `400253`:

- **Status `Provisional`**, where `400253` was `Released`. A converted order
  starts at the bottom of the lifecycle.
- **The toolbar is different in that state**: `Make final` · Print… · Send… ·
  Return · Par. return · **`Confirm`** · Pre-notifiy · Show company · Copy ·
  Workorder · Options… — so **`Make final`** and **`Confirm`** appear on a
  provisional order and not on a released one. `Confirm` is almost certainly
  what sets [`Qty confirmed`](purchase-lines.md#-qty-ordered-and-qty-confirmed-are-process-flags).
- **`Converted from quote 900000`** prints under the delivery block — the link
  back is a stored field.
- The line grid carries a **`Category`** column reading `Standaard`, and
  `M1(p)` = **20** for 10 pieces of 2 000 mm, confirming M1 is running metres.
- All five document flags (`Printed`, `Mailed`, `Faxed`,
  `Message sent via StaalWeb`) are **unticked and greyed** on a provisional
  order; only `Do not print prices` is editable.

⚠️ **There is no `Consignatie` checkbox on the order header**, though the quote
header has one. See
[purchase-quotes.md](purchase-quotes.md#-verified-live-by-creating-a-quote).

## The panels

In order down the screen: **Workorders · Lines · Options · Receipts · Pricing ·
Text lines · Stock · Stock other affiliates · Previous orders · Product Receipt
Documents.** Ten collapsible sections under the header.

### Lines

`5 lines` on this order. Columns: `Code` · `For line` · `Delivery date` ·
`Status` · `Product` · `Description` · `Category` · `Quality` · `Length` ·
`Width` · `Thickness` · `Qty(p)` · `U` · `Kg(p)` · `M1(p)` · `Net Price` · `U`

| Code | Delivery date | Status | Product | Thickness | Qty(p) | Kg(p) | M1(p) | Net Price |
|---|---|---|---|---|---|---|---|---|
| 10 | 27-3-2025 | Invoiced | PK304L15021 | 1,5 mm | 54 ST | 1 271,7 | 108 | € 1 980,00 / TN |
| 20 | 27-3-2025 | Invoiced | PK304L20021 | 2 mm | 27 ST | 847,8 | 54 | € 1 930,00 / TN |
| 30 | 27-3-2025 | Invoiced | CK304L0015 | 1,5 mm | 1 ST | 1 725 | 95,004 | € 2 000,00 / TN |
| 40 | 11-3-2026 | Partially rec… | PK304L20021 | 2 mm | 11 ST | 345,4 | 22 | € 1 930,00 / TN |
| 50 | 12-3-2026 | Released | PK304L20021 | 2 mm | 10 ST | 314 | 20 | € 1 930,00 / TN |

Line toolbar: New · Delete · Sawing specifications · Calculate · Pre-notify ·
`View` · Translate Views, plus quick buttons `DUPK320` · `NG` · `K320` ·
`BF F L K` — one-click processing options, and now readable: `BF` is Blue
Foil, `K320` a grinding grade, `L` Laser, `K` *Knippen*. They match the
option product codes on
[Purchase lines](purchase-lines.md#-processing-options-are-purchased-as-their-own-lines).

`For line` is blank on every row here, but it is the link an **option line**
uses to point at its parent — Purchase lines shows those option lines carrying
`Qty(p) = 0`, `Kg = 0` and a price per m² or per tonne.

**This panel closes three questions at once:**

1. **`Net Price` is quoted per tonne** — the unit is a column of its own,
   reading `TN`. That is the "gross price unit" from the receivals screen,
   stated outright.
2. **Line amount = net price per tonne × line weight in tonnes.** Lines 40 and
   50 also appear in the receivals export, and they reconcile to the cent:
   `1930 × 0,3454 = 666,62` and `1930 × 0,3140 = 606,02` — the export's
   `Line amount` on both.
3. **The receivals screen's `Kg(p)` is *not* the line's weight.** Line 40 here
   is 345,4 kg; the receivals row for `400253/40` shows `Kg(p) = 62,8`, which
   is 2 pieces of the 11. The line weight lives here; the receivals row holds
   the **instalment**. Which is exactly what the export's sums implied.

Also confirmed: `Length = 999999` belongs to the coil line (`CK304L0015`,
`Coil Cold-rolled …`), so the sentinel means *coil* — not a 999 m bar.

`M1(p)` is the running metre count: 54 pieces × 2 000 mm = 108 m, 11 × 2 m = 22.
The coil's 95,004 m is its real coil length.

⚠️ **Two totals do not reconcile and I cannot yet say why.** The five `Kg(p)`
sum to 4 503,9 but the header `Total weight` reads **4 501,4 Kg** (2,5 kg out),
and net price × weight over the five lines sums to €8 876,86 against a header
`Tot. excl. VAT` of **€8 872,25** (€4,61 out). Lines 40 and 50 are exact, so
the drift is in lines 10/20/30 — all three `Invoiced`, so most likely the header
restates them at **invoiced** weight rather than ordered weight.
→ *In the old system:* open the `Pricing` panel on this order, which was never
expanded, and compare its figures against the line grid.

### Receipts — this is the receivals table

`1 reception` for the selected line. Columns: `Status` · `Delivery date` ·
`Delivery dat…`(actual) · `Bill of lading` · `Product` · `Length` · `Width` ·
`Dikte` · `Kg(p)` · `Qty(p)` · `U(p)` · `Kg(a)` · `Qty(a)` · `U(a)` ·
`Transfer address`

Toolbar: New · Delete · **Split** · Batch registration · Charge aanpassen… ·
`View`

| Status | Delivery date | Bill of lading | Kg(p) | Qty(p) | U(p) | Kg(a) | Qty(a) | U(a) |
|---|---|---|---|---|---|---|---|---|
| Invoiced | 27-3-2025 | 400253 | 1 271,7 | 54 | ST | **1 276** | 54 | Pieces |

Three things worth having:

- **`Split` is the mechanism** behind a line showing several rows on the
  receivals overview. A reception is created for the line and then split into
  instalments — which is why only `Kg(p)`, `Kg(a)`, `Delivery date (a)` and the
  status vary between those rows.
- **The reception carries its own `Qty(p)`/`Qty(a)` as well as its weights**,
  even though the receivals overview only exposes the weights per instalment
  and shows the *line's* quantities instead.
- **Actual weight really does differ from planned**: 1 276 kg received against
  1 271,7 ordered, same 54 pieces. That is the mechanism behind
  `Price quantity` being restated once a line is fully received.

`Dikte` is Dutch for thickness, and `U(a)` spells out `Pieces` where `U(p)`
uses the code `ST` — two inconsistencies to fix rather than copy.

### The reception's full column list

Order `401154` gave the panel scrolled all the way right. Beyond the columns
above it carries:

`Transfer address` · `Transfer qty` · **`Pre-announced delivery`** ·
`Pre-notify code` · `Pre-reported by` · `Charge` · `Internal charge` ·
**`Sheet number`** · **`EDI Charge`** · **`EDI Bundels`** ·
**`EDI Vrachtbrief`** *(EDI waybill)* · **`EDI Leverdatum`** *(EDI delivery
date)*

Three things worth having:

- **A reception is created automatically when a quote converts.** Order
  `401154`'s panel already read `1 reception`, status **`New`**, with
  `Kg(p)` = 314 and `Qty(p)` = 10 filled and the actuals at 0. Nobody pressed
  `New`.
- **It is read-only while the order is `Provisional`.** `New`, `Split`,
  `Batch registration` and `Charge aanpassen…` are all greyed and `Kg(a)`
  cannot be typed into — so **receiving requires a final order**, and
  `Make final` comes first.
- **Four `EDI …` columns**, and `EDI Leverdatum` reads the `1-1-0001` null
  sentinel. So receipts can arrive by EDI even though
  Import purchase invoices has left scope — the two are different channels, and
  this one is live enough to have columns for it.

`Pre-announced delivery` reads `8-9-2026` (the delivery date), which is what
the toolbar's `Pre-notifiy` action fills. The second `Delivery date` column
shows a red **✗ `Do not c…`** on an unconfirmed reception — a confirmation
state rendered as an icon, not a date.

`Sheet number` is unexplained.

### Text lines

Columns `Categorieën` / `Tekst` — Dutch; *Categories* / *Text*. The one row
reads category `InkoopOrder` (*Purchase order*) and text *"Please note that
this position was changed"*. So free-text notes are categorised by which
document they print on.

### Stock

Tabs `Stock` | `Purchase`. Toolbar: Article · Group · Alternative. Columns:
`Code` · `Article` · `Dimensions` · `Length` · `Width` · `Location` ·
`Location type` · `Blocked` · `Technical` · `Kg Technical` · `Reserved` ·
`Kg Reserved` · `Available` · `Kg Available`

Fourteen lots of the ordered article, so the buyer sees current stock while
looking at the order. **`Available = Technical − Reserved`, in both the unit
and in kilos**, on every row — an independent confirmation of the identity
already proved on [Order advice](order-advice.md):

| Technical | Reserved | Available |
|---|---|---|
| 17 ST / 400 kg | 17 ST / 400 kg | 0 ST / 0 kg |
| 4 ST / 188 kg | 4 ST / 188 kg | 0 ST |
| 8 ST / 377 kg | 0 | 8 ST / 377 kg |
| 15 ST / 353 kg | 15 ST / 353 kg | 0 ST |

`Location type` is `Pick` on all fourteen. Locations are short codes — `2U`,
`2T`, `2G`, `2Q`, `2N`, `2R`, `FOXS` — plus **`Ontvangst`** (Dutch for
*goods-in*), which is where the just-received lot sits. That goods-in location
is a real, named place in the location list, not a state.

### Stock other affiliates

Same shape with an `Affiliate` column in front and a `Charge` column at the
end. Empty on this order.

### Previous orders

The buyer's history for this article. Columns: `Order / Line` · `Qty` · `U` ·
`Dimensions` · `Weight` · `Gross price` · `Amount` · `Net price` ·
`Group discount` · `Line discount` · `Days in system`. Toolbar: Show order.

| Order / Line | Qty | Weight | Gross price | Amount | Net price |
|---|---|---|---|---|---|
| 400650/10 | 6 ST | 141,3 | **€ 1 950,00 per TN** | € 276,90 | € 1 950,00 |
| 400650/20 | 5 ST | 117,8 | € 1 950,00 per TN | € 290,55 | € 1 950,00 |
| 400650/30 | 4 ST | 94,2 | € 1 950,00 per TN | € 195,00 | € 1 950,00 |
| 400650/60 | 8 ST | 188,4 | € 1 950,00 per TN | € 386,10 | € 1 950,00 |

**`Gross price` prints its unit inside the cell** — `€ 1.950,00 per TN`. This is
the plainest statement anywhere that a purchase price carries its own weight
unit, and it is what the receivals column
`Price quantity (in gross price U.)` is measured in.

`Group discount` and `Line discount` are both `0 %` here, and `Net price`
equals `Gross price` as a result — so net is gross less those two discounts.

⚠️ `Amount` is **not** weight × price on these rows (94,2 kg at €1 950/t is
€183,69, but €195,00 is shown — which is exactly 100 kg's worth). Every row
bills more weight than the line carries, by an amount that is neither constant
nor proportional.

**Trade weight is ruled out** — at the product master's 8 000 kg/m³ those
4 pieces would be 96,0 kg, not 100,0. **The likely answer is options.**
[Purchase lines](purchase-lines.md#-processing-options-are-purchased-as-their-own-lines)
shows processing steps bought as their own service lines, priced **per m²**
(Blue Foil € 1,40, Grinding € 1,70) or **per tonne** (Decoilen € 110), both
proved to the cent. An option line's amount rolled into the parent would
inflate it by an amount that is neither constant nor proportional to weight —
exactly what is seen here.
→ *In the old system:* open `400650` and expand its `Pricing` and `Options`
panels to confirm the extra is an option and not a weight adjustment.

`Days in system` reads `542` on all six rows, so it belongs to the order, not
the line.

## ✅ The `Pricing` panel — opened at last

Two orders were built to get here (`401156` and `401157`, from quotes
`900001` and `900002`), and expanding `Pricing` shows the whole price
build-up. It is richer than the quote line's four columns suggested.

**Left — the money, in order:**

```
  Base price
+ Quantity surcharge
+ Color surcharge
+ Lengtetoeslag            (Dutch: length surcharge)
─────────────────────────
= Gross Price
− Line discount        %
− Extra discount       %
  Line discount tot.   %   (line + extra, computed)
− Group discount       %
─────────────────────────
= Net price
```

So there are **four discounts and three named surcharges**, where the quote
line grid shows only `Line Discount` and `Group Discount`. `Extra discount`
and the three surcharges are new, and `Line discount tot.` looks derived
rather than typed.

Two checkboxes head the panel: **`Transfer price setting to order line`** and
**`Transfer pricing determination to o[rder line]`**, both ticked. So the
build-up is computed here and pushed down to the line, which is why the line's
`Net Price` is a result rather than something anyone types.

**Right — the same again, per option**, in a grid: `Option` · `Base price` ·
`Surcharge` · `Gross price` · `U` · `Qty Discount` · `Extra Discount` ·
`Reference factor` · `Net price` · `Contract`. An option carries its own
gross-to-net chain, not just the `Per` basis already known.

## 🔑 Amounts are billed on the **weighed** weight

This is what [`Previous orders`](#previous-orders) never reconciled against,
and the answer was printed on the purchase order all along. Its standing terms
read:

> *"De door u geleverde materialen worden gecontroleerd met onze inkooporder.
> Uitsluitend het gewogen gewicht wordt ons als basis voor de facturering
> geaccepteerd, tenzij stuksprijzen of meterprijzen zijn afgesproken."*
>
> — Only the **weighed** weight is accepted as the basis for invoicing, unless
> piece prices or metre prices were agreed.

That explains the drift in both directions, which no surcharge could:

| Line | Theoretical kg | Billed kg (amount ÷ price) | |
|---|---|---|---|
| `400656/10` | 1 475,8 | **1 438,0** | billed **under** |
| `400474/30` | 5 809,0 | **5 825,8** | billed **over** |
| `401154/10` | 314,0 | **314,0** | exact — never weighed |

Our own `401154` reconciles perfectly (`314 kg × €1.930/TN = €606,02`)
precisely because nothing was ever put on a scale. So the theoretical weight is
what an order is *placed* on, and the weighed weight is what it is *billed* on.
A received lot needs both.

## 🔴 A reception cannot be filled in by hand

The whole point of the consignment test was to receive goods and read the lot's
value. It could not be done, and why is itself a finding.

On order `401157`, made final so the reception's status went `New` →
`Released`:

- **`Kg(a)` and `Qty(a)` are not editable.** Not a locked cell — the grid will
  not take focus there at all.
- **`New`, `Split`, `Batch registration` and `Charge aanpassen…` are all
  greyed**, on a released order with an open reception.
- **The `Warehouse workorders` button does nothing** when pressed from the
  order.
- **`Confirm` could not be completed.** Its dialog takes `Confirmation number`,
  `Confirmation date`, `Confirmed delivery date` and `Document supplier`, and
  copies them onto the selected lines. With all four filled and the line
  ticked, `OK` stayed greyed — the line's own `Conf. No.` never populated.

Put beside the 151-row export, where **53 of 151 receptions read
`Receipt status = Workorders created`** — the commonest status after
`Received` — the reading is that goods are booked in by a **warehouse work
order**, raised somewhere other than the purchase order, and that filling
`Kg(a)` is its consequence rather than a data-entry step.

⚠️ **That matters more than the flag we set out to test.** Ours creates the
stock lot when the *purchase invoice* arrives. If the reference books goods in
at receipt, from a work order, then in ours the goods exist too late and the
invoice is doing the warehouse's job — the same mistake already corrected on
the sales side, where work orders move stock and invoices no longer do.

## 🔴 What is still needed here

1. **The `Pricing` panel was never expanded** — it is the one that should
   explain both unreconciled totals above (the 2,5 kg and the €4,61) and the
   `Amount` puzzle on Previous orders.
   → *In the old system:* open order `400253`, expand `Pricing`, and screenshot
   it. Then do the same on `400650`.
2. **The `Options` and `Workorders` panels were never expanded.** `Options` is
   presumably where the processing steps seen in the receivals `Options` column
   (*Decoilen*, *Slijpen (K320)*, *Laser Folie*) are chosen, and `Workorders`
   is the link to the warehouse/production work orders the receipt raises.
   → *In the old system:* expand both on this order and screenshot them.
3. **`Product Receipt Documents`** — the last panel, name only, never opened.


---

## ✅ A split reception, live — 5-10-2026

Found by grouping `Purchase lines` on `Status` and opening **`Partially
received`**, which held exactly one line:

**`404150/10`** · `CK3040008` Coil Cold-rolled 304 · **Norder Band AG** ·
3 ST · `Kg(pur)` **151** · receipt date 8-9-2026 · width **19 mm**,
thickness **0,8 mm** (a narrow slit strip).

Its `Receipts` panel reads **`2 receipts`**:

| Status | Delivery date | | Bill of lading | Length | W | D | **Kg(p)** | **Qty(p)** | U(p) | **Kg(a)** | **Qty(a)** | U(a) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **`Received`** | 8-9-2026 | ✔ `Pre-notifi…` | `747313 2` | 999999 | 19 | 0,8 | **158** | **1** | ST | **158** | **1** | Pieces |
| **`Released`** | 8-9-2026 | ✘ `Do not c…` | — | 999999 | 19 | 0,8 | **101** | **2** | ST | 0 | 0 | — |

This is the thing we had only ever inferred from the export: **one purchase line
carried as two receptions, one already in, one still coming.** Only `Kg(p)`,
`Kg(a)`, `Qty(p)`, `Qty(a)`, `Status` and the bill of lading differ between
them; product, dimensions and delivery date are identical. The receival grain,
live.

### 🔴 But the weights do **not** sum back to the line

| | |
|---|---|
| `Qty(p)` | `1 + 2 = 3` ✅ **matches the line's 3 ST** |
| `Kg(p)` | `158 + 101 = 259` ❌ **the line says `Kg(pur)` 151** |

**One reception alone (158 kg) already exceeds the whole line's ordered 151 kg.**

That contradicts the rule recorded from the export — *"the `Kg(p)` sum back to
the line"* — which held on 101 of 107 lines there. Two readings, and we cannot
yet choose between them:

1. **The ordered weight is nominal for coil.** A mill coils whatever it coils;
   `Kg(pur)` is what was asked for and `Kg(p)` is what the supplier said they
   would actually send. The 999999 length sentinel marks every row here as
   coil, and this one is a 19 mm slit strip where piece weight is not fixed by
   geometry at all.
2. **Splitting restates the weights** rather than apportioning them, so the two
   receptions carry real figures that no longer relate to the original.

⚠️ **Our split apportions the weight in proportion to quantity.** On this
evidence that is wrong, or at least not always right. Do not treat the
apportioning as settled — it is the single assumption our split rests on.

### 🔴 `Split` is **still greyed**, even here

The toolbar reads `+ New`(grey) · `✕ Delete`(grey) · **`Split`(grey)** ·
`Batch registration` · `Charge aanpassen…` · `View:` · `Vertaal Weergaven`.

The **`Received`** row was the selected one. **Untried: selecting the
`Released` row first.** A reception that has already arrived cannot sensibly be
split, so the button very likely keys off the selected reception's status.

**H13 remains open**, but the condition is now much narrower than "find a
part-received line".

---

## ✅ O4 — the four EDI columns, found and empty

Scrolling the same `Receipts` panel right gives the rest of its columns:

`Kg(a)` · `Qty(a)` · `U(a)` · `Transfer address` · `Transfer q…` ·
`Pre-announced deli…` · `Pre-notify co…` · **`Pre-reported by`** ·
**`Charge`** · **`Internal charge`** · `Sheet number` · **`EDI Charge`** ·
**`EDI Bundels`** · **`EDI Vrachtbrief`** · **`EDI Leverdatum`**

| | Received row | Released row |
|---|---|---|
| `Pre-reported by` | **`RVS`** | — |
| `Charge` | **`110600`** | — |
| `Internal charge` | **`26AQPW`** | — |
| `Sheet number` | — | — |
| **`EDI Charge`** | **empty** | empty |
| **`EDI Bundels`** | **empty** | empty |
| **`EDI Vrachtbrief`** | **empty** | empty |
| **`EDI Leverdatum`** | **`1-1-0001`** | `1-1-0001` |

🔴 **All four EDI columns are empty on a live September-2026 reception**, and
`EDI Leverdatum` holds the `1-1-0001` null-date sentinel rather than a date.
Put beside the other half of O4 — **`Order method` is blank on every order in a
2¾-year window** — the conclusion is that **EDI is not in use**. Nothing sends
it, nothing fills it, and the bundle breakdown the hypothesis expected from the
mill never arrives.

**O4 closes: build nothing for EDI.** Keep the four columns out of our receipts
grid.

### Three confirmations in passing

- 🔑 **`Pre-reported by` holds a person's initials** (`RVS`, from the same
  initials set as the `Purchaser` column — `BV`, `AB`, `MB`, `AVD`, `AN`, `FJ`,
  `RVS`, `CVR`). A pre-notification is **somebody's act**, not a feed
- 🔑 **`Charge` `110600` and `Internal charge` `26AQPW` on the same row** — the
  mill's heat number and ours, side by side, exactly as the batch-registration
  dialog showed
- 🔑 **`1-1-0001` is live** as the null-date sentinel, and the **bill of
  lading** (`747313 2`) appears only on the reception that actually arrived

### One column we have no reading for

`Delivery dat…` (header truncated) shows **✔ `Pre-notifi…`** on the received
reception and **✘ `Do not c…`** on the released one — a tick/cross pair with
text. Widen it before building anything on it.
