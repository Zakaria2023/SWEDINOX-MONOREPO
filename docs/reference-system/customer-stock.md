# Customer stock on location

`Overviews → Logistics → Klant voorraad op locatie`, exported 10-9-2026 —
**94 rows, 54 columns**. The last item on the list that could still add a column
to the schema, and it did not, because the column was already there.

## How the reference marks somebody else's metal

There is **no owner column**. All 54 columns are the ordinary stock ones —
product, location, quality, valuation, charge, supplier, receipt date. The
ownership is carried by two fields that already exist:

| Field | Value |
| ----- | ----- |
| `Stock category` | **`3rd party inventory`** — 70 of the 94 rows |
| `Supplier` | the **owning company**, not the mill it came from |

Seven distinct owners, led by *H. Schrijver Construktiebedrijf B.V.* with 54 of
the 70 rows — a company that also appears in `Financially blocked quotes and
orders` as a **debtor**. It is a customer whose material we are holding, and the
system files it under `Supplier` because `Supplier` is what the field is called,
not because they sold us anything.

The order side has the matching switch: the sales-order header carries a
**`Klant materiaal`** checkbox in its order-type block. See
[order-detail.md](order-detail.md).

## It looks exactly like our own stock

This is the point, and the reason it is dangerous:

- **85 of 94 sit on ordinary `Pick` locations** — the same racks as sellable
  metal (`Afhaal` 7, `Schroot` 2)
- **`Blocked` is `False` on all 94 rows**
- it has quantity, weight, a location, a quality, a charge and a valuation
- `Order advice code` is blank on all 94, so at least it never gets reordered

Nothing about the row says "do not sell this" except the stock category.

## 🔴 The bug it found

`getAvailableStockForSelect` — the query behind the stock picker on a sales
order — filtered on status, `blocked`, free quantity and location type. All four
pass for customer material. **A customer's own plate was sellable to a different
customer.**

Fixed: the picker now also requires `Stock.ownerCompanyUuid IS NULL`.

The column already existed and three screens already used it — order advice,
`sold-products-not-advised` and `stockon-advice` all exclude owned stock. The
one place it mattered most was the one place it was missing.

## ⚠️ Open question for Swedinox: it carries value

Third-party stock in the reference is **not** consistently valued at zero:

```
70 rows of 3rd party inventory
   40 valued at zero
   30 carrying a value, EUR 40.833 in total
```

Meanwhile all 24 rows that are *not* `3rd party inventory` are valued at zero.
So the flag and the valuation disagree, and €40 833 of other people's metal is
sitting inside the stock figure.

The reference has the tool to fix it — `Change APP` sets a new average purchase
price per tonne across a filtered selection, with a `Check` dry run before
`Wijzig` — and the example seen had `Huidig € 5,22` against `Nieuw € 0,00` on a
`3rd party inventory` row, which is exactly what zeroing customer stock would
look like.

**This is an accounting policy call, not a code fact, so nothing was changed.**
Our own stock total still sums every lot. If the answer is "customer material
should never be in our stock value", it is a one-line `WHERE` and it should be
made deliberately.

## Two smaller things the export settles

- **`PriceU` is `HK` on 52 rows and `TN` on 42.** `HK` is the metric quintal,
  a hundred kilograms. Both are weight bases, neither is per piece — more
  confirmation for `priceMeasureFor`.
- **`Theoretical thickness` is a column here too**, beside `Thickness`,
  confirming [stock-on-location.md](stock-on-location.md) on the rolled-versus-
  nominal weight basis.
