# Product — the master screen

Reached with `Show Product` from any purchase overview. Ours: the product form
under `/products`.

Captured from **`PK316L40021`**, titled in Dutch:
`Plaat Koudgewalst 316L 2000x1000x4mm` (*Cold-rolled plate 316L*).

**Toolbar**: Show product group · Correct products and stock · Activate
(greyed) · Production workorder for stock (greyed) · Copy product (group)
and… | Purchase lines

## 🔑 The weight formula, proved

The `Basis` panel gives dimensions and a density:

| | |
|---|---|
| `Length` | 2.000 mm |
| `Width` | 1.000,0 mm |
| `Thickness` | 4,00 mm |
| `Weight` | **7.850,000 KG/M3** |

`2 m × 1 m × 0,004 m × 7 850 = ` **62,800 kg per piece**.

That single formula reproduces **every per-piece weight derived anywhere else**,
to three decimals:

| Product | Thickness | Calculated | Observed | Source |
|---|---|---|---|---|
| `PK304L20021` | 2,00 mm | **31,400** | 31,400 | `Price quantity ÷ Qty(p)`, receivals export |
| `PK304L15021` | 1,50 mm | **23,550** | 23,550 | `Kg(p) ÷ Qty(p)`, order `400253` line 10 |
| `PK304L15021` | 1,50 mm | **23,550** | 23,550 | all four `Previous orders` lines |

So for a **dimensioned** product weight is **derived, not stored**:
`length × width × thickness × density`. Everything upstream — the receivals
`Kg(p)`, the order's `Kg(p)`, the invoice's `Kg`, `Price quantity` — is that
number times a quantity. Our `theoreticalWeight` / `weightPerM1` columns are
this same idea pre-computed.

⚠️ **But not every product is dimensioned.** A `Stuksartikel` (*piece article*)
has no length, width or thickness at all, and its `Weight` field holds
**Kg/Psc** rather than KG/M3 — a weight per piece, entered directly. See
[the two Basis layouts](purchase/purchase-quotes.md#-the-product-master-looks-different-for-a-non-material-product).
So our schema needs both paths: derive for plate and coil, store for piece
articles.

### Three weights, not one

The `Weights` sub-block carries **`Theoretically` 7.850,000**, **`Trade`
8.000,000** and **`German` 0,000**. Three densities for one product.

`Trade` is 1,91 % heavier than theoretical — a commercial rounding of the
density, which is normal in steel. ⚠️ But it does **not** explain the
over-billing seen on the order's
[`Previous orders`](purchase/purchase-order-detail.md#previous-orders) panel:
4 pieces of the 1,5 mm plate would be 96,0 kg at trade density, and the invoice
bills **100,0**. Trade weight is ruled out, which narrows that open question to
surcharges.

`German` is 0 here, so its purpose is unknown — presumably a DIN-standard
density used when buying from German mills.

## The `Product` shape decides the whole screen

The header's second `Product` field is the shape, and it changes which fields
the `Basis` panel even has. Two values are known so far:

| Shape | Basis panel |
|---|---|
| `Plaat` (plate) | dimensions, density, three weights, quality, standards, classification features |
| `Stuksartikel` (piece article) | **no dimensions**, `Weight` in Kg/Psc, `Color`, `Kwaliteit`, free-text `Description` |

Both keep the `Options` list and the `Processed → Option / Source product`
pair. Everything below describes the **plate** layout.

## Header

| Field | Value | Note |
|---|---|---|
| `Product` | `PK316L40021` | the code |
| `Product` | `Plaat` | **a second field with the same caption** — the shape |
| `Price` | `Algemeen` | Dutch, *General* — a price group |
| `EAN` | blank | |
| `Material group` | `Cold-rolled plate 316L` | **greyed** — the hierarchy link |
| `Commodity` | `72193210` | the customs/HS commodity code |
| `Scrap` ☐ · `Packaging` ☐ | | two product-kind flags |
| `Description sales/purchase can be overwritten` ☐ | | |
| `Search codes` | `PK316L`, blank, `PK316` | **three** search-code slots |
| `Gip → Artikelgroep` | `PK316` | Dutch, *article group* |

**`Material group` is greyed and reads `Cold-rolled plate 316L`** — confirming
again that the hierarchy is linked by this field, and that a product's parent
group is derived rather than picked here.

**`Classification features → Product group` reads `Plaat`, greyed** — the third
independent confirmation that this "product group" is the product's **shape**,
not its place in the hierarchy. Note the header *also* has a `Product` dropdown
reading `Plaat`, so the shape appears twice on one screen.

### Descriptions

`Group long` (*Cold-rolled plate 316 series*) · `Group short` (*Cold-rolled
plate 316L*) · `Product short` (*2000x1000x4mm*), with `T` and `W` buttons
beside them.

So a product's display name is **assembled**: the group's short description
plus the product's own dimension string. That is exactly why the purchase
exports print `Cold-rolled plate 304L` as the `Product` and carry the dimensions
in separate columns.

## `Basis` panel

| Block | Fields |
|---|---|
| Dimensions | `Length` · `Width` · `Thickness`, all mm, plus **`Fixed dimensions` ☑** |
| Other features | `Number of decimal places weight` = 1 · `Print dimensions` ☐ |
| Features | `Weight` (KG/M3) · `Paint surface` (M2/M1) · `Quality` = `316L` |
| Weights | `Theoretically` · `Trade` · `German` |
| Standards | `Quality` · `Tolerance` · `CE` — all `-empty-` |
| Processed | `Option` · `Source product` — both `-empty-` |
| Options | a **list with a state per row** — see below |
| Industry number | blank |
| Classification features | `Product group` (greyed) · `Material` · `Quality group` · `Main shape` · `Sub shape` · `Procedure` · `Appearance` · `Performance` |

`Fixed dimensions` ☑ is the flag that says this product is a stocked standard
size rather than cut-to-order — worth having, since it decides whether length
and width are editable on an order line.

`Processed → Source product` is the link that makes a processed product point at
the raw one it is cut from. Empty here, but it is the production lineage.

### `Options` — the processing enum, with per-product availability

| Option | State |
|---|---|
| `Duplo` | Possible |
| `Decoilen` | Possible |
| `Grinding` | Possible |
| `Brushing` | Possible |
| `ShearCut` | Possible |
| `Laser Foil` | Possible |

**This is the list behind the `Options` column on
[Purchase receivals](purchase-receivals.md#two-small-things-worth-copying)** —
where the values seen were `Decoilen`, `Slijpen (K320)`, `Laser Folie`,
`Borstelen`, `Knippen` and `ShearCut`. So options are a fixed enum, and each
product says whether each one is `Possible`.

The reference is inconsistent with itself here: this screen lists `Grinding`
and `Brushing` in English while the receivals column prints the same two as
`Slijpen` and `Borstelen`, and `Laser Foil` here is `Laser Folie` there. Ours
uses one English name per option throughout.

`Duplo` and `Knippen` (*Cutting*) round out the list — six on this product, and
`Knippen` appeared on receivals but not here, so the enum is larger than what
one product shows.

Pooling every screen, the option enum has **at least ten** members: `Duplo` ·
`Decoilen` · `Grinding (K320)` · `Brushing` · `ShearCut` · `Laser Foil` ·
**`UV Foil`** (from [Stock on location](stock-on-location.md)) · `Blue Foil` ·
`Knippen` · `Laser` (both from
[Purchase lines](purchase/purchase-lines.md#-processing-options-are-purchased-as-their-own-lines)).

### `Classification features`

`Material` = `STAINLESS ST…`, `Procedure` = `Cold-rolled`, and five more all
`-empty-`: `Quality group`, `Main shape`, `Sub shape`, `Appearance`,
`Performance`. Together with `Product group` = `Plaat` that is an eight-facet
classification sitting **beside** the hierarchy, not inside it.

Only three of the eight are populated on this product, so most are optional.

## `Selectioncodes` and `Alternatives`

`Selectioncodes` — its own panel, empty here.
`Alternatives` — **`0 products`**, so a product can carry a list of substitutes.
The `Basis` panel's `Alternative` button on other screens' stock grids is the
same idea.

## 🔴 What is still needed here

1. **The `Options` enum's full membership and its states.** Six rows are
   visible and all read `Possible`; the list scrolls, and `Knippen` is missing
   from it though it appears on receivals.
   → *In the old system:* scroll the `Options` list to the bottom on this
   product, and open its dropdown on one row to see what states exist besides
   `Possible`.
2. **What `German` weight is for**, given it is 0 here.
   → *In the old system:* find a product bought from a German mill and see
   whether it is populated.
3. **`Price = Algemeen`** — a price group, but its other values are unknown.
   → *In the old system:* open that dropdown and read the list.

---

# The panels below `Basis` — captured 2-10-2026 on `PK44115025125`

`Plaat Koudgewalst 441 2500x1250x1.5mm`, reached by `Stock on location` → select
a row → `Show Product`. The 21-9-2026 capture stopped at `Basis`; this one runs
to the bottom of the record. **Eleven panels, none of them seen before.**

Everything below is from that one screen. Where a figure is quoted it has been
checked against the product's own stock rows on the same screen.

## 🔑 Which density drives what — O11, answered

The product carries two live densities, already recorded above:

```
Theoretically:  7.850,000     ← Features → Weight: 7.850,000 KG/M3
Trade:          8.000,000
```

One plate is `2,5 × 1,25 × 0,0015 m` = **0,0046875 m³**, so:

| Density | Per plate | × 50 |
|---|---|---|
| Theoretical 7 850 | 36,796875 kg | **1 839,84375** |
| Trade 8 000 | 37,500000 kg | **1 875,00000** |

**Every stock row on this product is theoretical, to the gram:**

| Qty | `Kg (t.)` on screen | 7 850 gives |
|---|---|---|
| 50 | 1.840 | 1 839,844 ✓ |
| 29 | 1.067 | 1 067,109 ✓ |
| 24 | 883 | 883,125 ✓ |
| 3 | 110 | 110,391 ✓ |
| 4 | 147 | 147,188 ✓ |

and the `Stock mutations` panel agrees without rounding — a receipt of 24 pieces
is stored as **`883,125`**.

**The `Orders` panel on the same screen shows both bases at once:**

| Order | Customer | Qty | `Kg` | Basis |
|---|---|---|---|---|
| `O106146` | Bergen Stainless & Steel | 150 | 5 625 | **trade** |
| `O106578` | Bergen Stainless & Steel | 29 | 1 087,5 | **trade** |
| `O106570` | KeyBAKE Bakeware | 22 | 825 | **trade** |
| `O107645` | Thermo Products BV | 14 | 515,2 | **theoretical** |
| `O107969` | MATINA EXIM S.R.L. | 51 | 1 876,7 | **theoretical** |

Seventeen order lines, no exceptions: the basis follows the **customer**, never
the product and never the date. That is the per-order `weight type` already
described in
[PLANNED-CODE-CHANGES-6 item 1](PLANNED-CODE-CHANGES-6.md), confirmed here from
the other direction.

> ### So the 1 875 on work order `323526` is not a bug
>
> `Make final` copies the **order line's** `Kg(p)` onto the warehouse work
> order. Bergen Stainless is a trade-weight customer, so the line carries
> 1 875 and the shelf it will be picked from carries 1 839,84. The two
> disagree by 8 000 ÷ 7 850 = **1,911 %**, permanently and on purpose.
>
> The reference does not reconcile them. It **tolerates** them — see the
> tolerance table below, which allows a picking to be reported 5 % off plan.
> 1,911 % sits comfortably inside that.
>
> **What we do:** keep `Kg(p)` as the order line's figure, compute `Kg(a)` from
> the lot at theoretical density, and check the difference against the
> product's tolerance instead of demanding they match.

## 🔴 `Warehouse control` — the tolerance table

The panel that says how far a report may stray from its plan, **per product**:

| Workorder type | Qty | Kg |
|---|---|---|
| Unloading wo | 5 % | 5 % |
| Count workorder | **0 %** | **0 %** |
| Picking workorder | 5 % | 5 % |
| Production workorder | — | **0 %** |

Four rows, three different rules, and they answer two standing questions:

- **A production work order must close its kilo balance exactly.** G9 and half
  of H10 are settled without running a saw cut: `0 %` is not a suggestion.
- **A count must be exact**, which is what makes a count a count.
- **A picking or an unloading may be 5 % out** either way, which is how the
  trade/theoretical gap above survives unnoticed.

Nothing in our `reportCompletion` checks any of this today. It accepts whatever
is typed.

### `Always approve manually` — both unchecked

```
Warehouse workorder line   ☐
Production workorder line  ☐
```

**This is why `Approve` is never pressed.** Approval is automatic on report
unless a product opts into manual approval. The state machine we built —
`New → Release → report every line → Approved` — is right, and the missing
button was never missing.

### The rest of the panel

| Field | Value |
|---|---|
| `Packaging mandatory when reporting completion of pick- or last` | ☐ |
| `Unloading workorder in stock unit` | ☑ |
| `Receipt in locations with limited dimensions` | ☐ |
| `Goods receipt term` | 0 business days |
| `Include in CSV file for stock labels when printing unloading workorder` | ☐ |
| `Suggest last used charge in scanner` | ☐ |
| `Stock label type` | `Label` (greyed), **`Per line/bundle`**, 1 piece |
| Customer labels — picking / sawing / surf. treat. slip | `CSV file` ×3 |

`Suggest last used charge in scanner` confirms there is a **barcode scanner
client** against this system that we have never seen.

## 🔴 `Valuation` — O10, answered

```
APP = € 1.587,63
```

Printed in green at the panel head, with `New` · `Delete` · `Update`.

| Field | Value |
|---|---|
| `Fixed Settlement` | 0 Per TN |
| `Replacement price` | 0 Per TN |
| `Internal surcharge` / `External surcharge` | 0,00 |
| `Current average purchase` | blank, `Per U` |
| `New average purchase price` | **€ 0,00000** Per TN |
| `Last purchase price` / `Purchase order` / `Order date` / `Supplier` | all blank |

Two things matter here.

**APP is per tonne and carries five decimals.** `€ 0,00000` is the input mask.
That is the third independent confirmation that `Stock.valuation_price` must be
`decimal(15,5)` — the lot export showed `1 537,61789`, and the history below
shows `107,20071`. The widening already queued for `pnpm db:push` is correct.

**APP is maintained, not derived on demand.** The `History APP` panel keeps a
dated row per change:

| Start | End | APP | Reference |
|---|---|---|---|
| 06-04-2023 | 31-12-9999 | 2.000,84… | `Conversie` |
| 12-01-2024 | 24-12-2025 01:48 | 1.679,11… | `Conversie` |
| 04-12-2024 | 31-12-9999 | 1.582,33… | `Conversie` |
| 04-02-2025 11:38 | 31-12-9999 | **107,20071** | **`Inslag inkooporder IO400201`** |
| 04-02-2025 11:50 | 31-12-9999 | 108,16136 | `Inslag inkooporder IO400202` |
| 24-03-2025 10:00 | 24-03-2025 10:02 | 1.299,99… | `Inslag inkooporder IO400549` |

> **Every goods receipt rewrites the APP and stamps the purchase order that
> caused it.** `Inslag` is Dutch for *putting into stock*. `Conversie` rows are
> the data migration.

So the answer to O10 is **yes in kind, no in mechanism**: it is the same average
we compute, but the reference recalculates it **at receipt time** and keeps the
history, where ours recomputes from purchase invoices on read. Two consequences:

- A lot's `valuation_price` is the APP **as it stood the moment that lot
  arrived**, which is why two bundles under one internal charge can hold
  € 1 537,61789 and € 1 345,19975.
- Recomputing an average from today's invoices will **not** reproduce a historic
  lot's value. The history is the record.

⚠️ The five `107,xx` rows of 4-2-2025 are two orders of magnitude below every
other figure on the same product. They are inside the frozen migration window
and look like bad data rather than a rule — **do not let an importer trust
them**.

`End = 31-12-9999` is the open-ended sentinel this system uses throughout.

## 🔴 `Stock control` — and a dispatch strategy nobody had seen

| Field | Value |
|---|---|
| `Stock unit` | `ST` |
| `Scrap product` | **`SC430`** |
| `Transfer product` | `-leeg-` |
| `CD Location` | `-leeg-` |
| `Stock product` | ☑ since **1-1-2024** |
| `Standard product` | ☑ greyed |
| `Batch registration` | ☐ |
| `Length` / `Width` minimum + interval | ☐, all 0 |
| **`Charge`** | ☑ **greyed — mandatory** |
| **`Dispatch strategy`** | **`LIFO`** |
| `Do not split stock per batch` | ☐ |
| `Plate number` | ☐ |
| `Per piece` | ☐ |
| `Batch number` | ☑ |


**`Dispatch strategy: LIFO` is the rule that orders the lot picker.** Our
`getPickableLotsForLine` sorts the line's own location first and says nothing
about age. The reference has a per-product strategy, and this product is
**last in, first out** — the newest bundle goes first.

That is unusual enough to be deliberate: stainless does not perish, and the
newest lot is the one still reachable rather than buried at the back.

`Charge` ☑ **greyed** is the fourth confirmation that a charge is mandatory on
every lot — it cannot even be switched off here.

`Scrap product SC430` is where offcuts go. It is a **different product code**,
so scrapping converts between products rather than reducing a quantity.

### `Count settings`

| Field | Value |
|---|---|
| `Count frequency` | 1 |
| `Counted this` | 0 |
| `Count as the` | ● **Technical stock** ○ Available stock |
| `below` | **1.000 KG** |
| `Last count` / `Target date next` | blank |
| `Count now` | a button |
| `Open count workorder available` | ☐ |

So a count is raised against **technical** stock, below a kilo threshold, on a
frequency — and `Count now` raises one on demand. Counting is the one flow with
a 0 % tolerance.

### `Preferred location(s)`

| Preference | Location | Type | RestockLevel | RestockLocation | RestockQty |
|---|---|---|---|---|---|
| 1 | **`Ontvangst`** | **`Pick`** | 0 ST | `-leeg-` | 0 ST |

*Ontvangst* is Dutch for *receipt*. **This is where an unloading puts goods when
nobody says otherwise**, and the `Type` column means the location is a picking
face rather than bulk. The restock columns are the automatic-replenishment pair
that goes with the greyed-out `Restocking…` button — the feature is off.

## `Stock policy` — the order-advice formula, stated

> `Min. stock: 1 times the avg. monthly consumption;`
> `Max. stock: 3 times the avg. monthly consumption`

| | Rule | Alternative |
|---|---|---|
| Minimum | ● **1,00** × average monthly consumption, but at least `Fixed value` | ○ Fixed value, 0 ST |
| Maximum | ● **3,00** × average monthly consumption, capped by `Fixed value` if > 0 | ○ Fixed value, 0 ST |

The whole `StockOp Parameters` column — lead time, review period, order costs
A1/A2, order series, minimum order quantity — is **greyed and zero**, and the
right-hand side says it plainly:

```
Use StockOp for this product?  ☐
StockOp parameters zijn nog nooit berekend.
```

*"StockOp parameters have never been calculated."* Likewise every simulation
parameter (capital cost r1, warehouse cost r2, stock-out percentages, handling,
transport) is 0,0000.

> **The advanced replenishment engine was bought and never switched on.** Order
> advice runs on the plain min/max multiples above. We do not need to build
> StockOp, and `PAC-classification` and `Order advice code` are both blank.

`StockOn ordering/evaluation` ticks **Monday–Friday**, so advice is generated on
weekdays only.

## `Sales`

| Field | Value |
|---|---|
| `Revenue Group` | `SS 430` |
| `Sales unit` | `ST` |
| `Unit price` | **`TN`** |
| `VAT code` | `VAT High 2…` |
| `Always reserve stock` | ☑ |
| `Max. line Qty` | 9.999 ST |
| `Max. net price` | € 9.999,00 per TN |
| `Handling costs` | € 0,00 |
| `Minimum profit margins` | **Stock 7,00 % · Ex works 7,00 % · Cross Docking 7,00 %** |

Two findings.

**`Always reserve stock` ☑ is a product flag**, and it is why every order line on
this product reserves a lot the moment it is created. We had treated automatic
reservation as system behaviour; it is per product.

**There are three minimum margins, not one.** Item 16 recorded a single
"minimum profit margin per product". It is one per **delivery mode** — stock,
ex works, cross docking — and all three happen to be 7,00 % here.

The website block (`Export`, `Blocked for sales`, `Price on request`,
`Mark product (group)`, `Gewicht per Stuk vermelden`) is all unticked, as are
`Vehicle with crane required` and `Vehicle with canopy required` — two
transport requirements that belong on the product, not the order.

## `Purchase`

| Field | Value |
|---|---|
| `Purchasing unit` | `ST` |
| `Unit price` | `TN` |
| `Delivery time` | 0 Working days |
| `Order series` | 0 ST |
| `Making order advices` | ☑ |
| `Blocked for Purchasing` | ☐ |
| `Ordering advice notes` | blank |
| `Max. LineQty` / `Max. Net price` | 0 ST / € 0,00 |

Note the asymmetry worth copying: **bought and sold in `ST`, priced in `TN`** on
both sides. The unit the metal moves in and the unit it costs in are different
fields, and we have conflated them in places.

## 🔴 `Purchase orders` — external processing, visible without running it

The panel lists every purchase line for this product, and it carries a column we
have never had a value for:

| `Purchase type` | Supplier | Price |
|---|---|---|
| **`Processing`** | **`Hego Production`** | **€ 0,00** |
| `Materials` | `APERAM Stainless Services &` | € 1 505,00 / TN |

Sixteen of the seventeen visible lines are `Processing` to `Hego Production` at
**zero price**; one is `Materials` from APERAM at a real price.

> **This is flow H9 — external processing — sitting in plain sight.** Metal is
> sent to a related company (`Hego Production`) on a purchase order whose
> **type is `Processing` and whose price is € 0,00**. The material keeps its
> value; the purchase order is the vehicle for the round trip, not a cost.

`IO404206` is open right now — 26-8-2026, 24 pieces, status `In progress`.

The quantity columns finally disambiguate themselves by comparison:

| | `Qty(p)` | `Hvh (geres…)` | `Qty(r)` | `Qty(a)` |
|---|---|---|---|---|
| `IO404206` — In progress | 24 | 24,00 | **24** | **0** |
| `IO403683` — Invoiced | 6 | 0,00 | **0** | **6** |

So **`Qty(r)` is what is still to come** (*rest*) and **`Qty(a)` is what
arrived**. `Hvh (gereserveerd)` is the reserved quantity, which drops to zero
once the goods land.

The panel also carries `Kwaliteit` (`4412B`, `441BA`, `441`) and
`Voorraadcategorie` (`2nd choice` or blank) **per purchase line** — quality and
stock category are chosen when buying, not derived from the product.

Toolbar: `Show purchase order` · `Show supplier` · `Show order` (greyed) ·
**`Toon reserveringen`** (*show reservations*).

## `Stock mutations` — the movement carries its own origin

Columns: `Mutation date` · `Mutation time` · `Mutation type` · `Mutation reason`
· `Company` · `Qty` · `U` · `Len` · `Wid` · `Kg` · `M1` · `Amount` · `User` ·
`Supplier` · `Internal charge` · `Internal batch` · `Purchase order` ·
`Days in system`.

Toolbar: `Show company` · `Show order` · `Show purchase order`.

`Mutation type` is `Levering` (*delivery*) or `Ontvangst` (*receipt*);
`Mutation reason` is `To customer` or `From supplier`.

> **An outbound delivery row still names the supplier and the purchase order the
> metal originally came in on** — a delivery to Bergen Stainless on 14-8-2026
> carries `Supplier: Swedinox` and `Purchase order: IO403283`.

That is full origin traceability denormalised onto the movement, and it is how
the reference answers "where did this plate come from" without walking a chain.
Our `StockMovements` carries the lot, not the lot's birth certificate.

`M1` is metres — `-125` for 50 plates of 2,5 m.

## The `Stock` panel toolbar, confirmed on a second product

```
New · Relocating… · Restocking… (greyed) · Correction… · Scrapping… ·
Transfering… · Batch registration… · Reservations… · Stock label ·
Opties bewerken · Splits
```

Identical to the list recorded on `PK304L300315`, so this is the toolbar and not
a per-product variation. **`Batch registration…` is reachable from here as well
as from the purchase order's `Receipts` panel**, which gives flow H11 a second
entry point, and `Reservations…` is the H2 entry point.

## Fourteen lots, and the 30-9 pick still reconciles

The `Stock` panel lists **14 rows** for this product across `Laad`, `2C3`, `4A7`,
`4A5`, `2C7`, `4A3` and `2C4` — the same 14 the 30-9-2026 export showed both
before and after the relocation, which is the evidence that a relocation moves
the row rather than minting a new one.

Two rows carry a `Remark` beginning `Slechte…` (*bad*) and show `Reserved 0`
against `Available 1` and `4`. They are the only unreserved lots on the product,
and both are flagged as poor quality — which is consistent with
`Always reserve stock` ☑: everything saleable is already committed.
