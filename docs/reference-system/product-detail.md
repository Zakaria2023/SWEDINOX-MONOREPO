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
