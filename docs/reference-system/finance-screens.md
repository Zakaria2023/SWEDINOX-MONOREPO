# The Finance group

`Overviews → Finance`, captured 10-9-2026. The full menu, in its own order:

```
Journal entries
Cost price for selling of invoices to be sent
Purchase invoices to be received
Purchase orders to be received
Revenue per revenue group (month)
Revenue per revenue group (period)
Purchases and sales per revenue group
Credit information customers
Financially blocked quotes and orders
CD-deliveries in progress
Control Stock increase due to external processing
Control Revaluation of stock due to FSP-changes
Control sawing waste
CBS Documentatie
```

Also captured: the **Overviews tree itself** — `Purchase`, `Customers`,
`Companies`, `Finance`, `Suppliers`, `Logistics`, `System info`, `Sales`,
`Website`, `Batch registration`, `Other`. Eleven groups; we had been treating
Logistics and Purchase as the whole system.

## Journal entries — 34 826 rows

`Journal`, `Period`, `Financial year`, `Booking date`, `Deb/Creditor`,
`Document`, `Document date`, `Reference`, `Explanation`, `Amount`, `VAT`,
`Account`, `Description`, `Cost centre`, `Transmission date`, `Cause of
transmission failure`, `External account`, `VAT scenario`, `Created on`.

**Three journals only**, and the split is lopsided:

| Journal | Rows | What its documents look like |
| ------- | ---- | ---------------------------- |
| `80` | 32 223 | the bulk |
| `70` | 1 823 | |
| `10` | 780 | documents numbered `6xxxxx` — **trip numbers** |

Journal 10 keying on the trip number is the accounting side of the finding in
[stock-mutations.md](stock-mutations.md): goods leave on a **trip**, and the
trip is what the books are keyed to.

⚠️ **Only 2 986 of 5 275 documents balance to the cent, and the file's own total
is −2 563 727.** So this export is a *selection*, not a complete ledger — the
counter-legs live outside it. Do not use it to test double-entry.

`Cost centre` is `0` on all 34 826 rows. `Transmission date` and `Cause of
transmission failure` say the ledger is pushed to an external accounting
package, and `External account` is the account number over there.

### VAT scenarios — a real enum

Six values appear, each with its own number in brackets:

```
(1) Purchase domestically                        282
(3) Purchase within EU with reverse charge       503
(4) Purchase outside the EU with reverse charge    3
(6) Domestic sales                              1 749
(7) Sales within EU with reverse charge           20
(8) Sales outside the EU with a reverse charge    34
```

Numbers 2 and 5 are missing from the data, and the numbering is plainly
symmetric — purchase 1/3/4 against sales 6/7/8 — so **2 and 5 exist and are
unused here**, presumably the domestic/EU/outside triple completed on each side.
32 235 rows carry no scenario at all: only the VAT-bearing legs get one.

## Control sawing waste — 2 168 rows

The production movement reasons, with counts:

```
Origin of production  1 200      Consumed      513
Scrap production        264      Rest production  191
```

Four reasons, and they are the two halves of a cut seen from the books:
material `Consumed`, and what comes out as `Origin of production` (the piece),
`Rest production` (the offcut) and `Scrap production` (the waste).

Every row posts to **GLA `7005`** — one account for sawing waste. `GLA Price
difference. Sawing` is blank on all 2 168, so the price-difference half is not
in use. `StkU` is `ST` on 1 904 and `KG` on 264 — the scrap is weighed, the
pieces counted.

## Control stock increase due to external processing — 483 rows

Every row posts to **GLA `3100`**, and `Company` is the **processor**:

```
Hego Production 455 · Metalfinish Group 14 · Helaxa 6 · Burger & Althoff 2 ...
```

455 of 483 are Hego Production — the group's own processing arm. This is the
accounting side of the `Bewerker` location type, whose 36 lots are blocked
because the metal is off the premises ([stock-on-location.md](stock-on-location.md)).

## CBS Documentatie — 7 129 rows

The Dutch statistics office (CBS) goods-flow return, and the only screen that
looks outward.

`Date`, `Invoice Nr`, `Rubric`, `Intrastatcode`, `Invoice amount`,
`Factuurvaluta`, `Weight(kg's)`, `Company`, `Origin`, `Container`, `Ordertype`,
`Ordercode`, `Orderline nr`, `Stat`, `Transactioncode`, `Transportcode`,
`Partner Id`, `Deliveryterm Code`, plus two computed EU flags.

- **`Ordertype` is `V` (5 124) or `I` (2 005)** — *verkoop* and *inkoop*, sales
  and purchase. `Rubric` tracks it exactly: 7 for V, 6 for I.
- **`Transactioncode` is `11` on all 7 129 rows** and `Transportcode` is `3` on
  all but one. Constants, not dimensions.
- `Deliveryterm Code`: `CPT` 3 154, `FCA` 293, `DAP` 101, `EXW` 23, `CIF` 21,
  blank 3 521 — Incoterms, and the same `(CPT) Carriage paid to` seen on the
  order header.
- `Origin`: `NL` 3 072, `DE` 1 072, `SWE` 688, `IT` 665, `TR` 421, `KOR` 328 —
  country of origin per line, which a steel merchant needs for duty and for the
  mill certificate.
- `CBSDocument_IsCompanyCountryEU` reads `yes` / `no` / **`Unkown`** (2 841
  rows, and that is the reference's own spelling). A three-valued flag, not a
  boolean.

## The two screens that only look empty

Both filter on **`Year` / `Month` with "leave blank for current"**, and both
were captured blank — so they are asking about September 2026 and prove
nothing. See [empty-screens.md](empty-screens.md).

- **`SFN statistics Product-Market`** — `sfn_no`, `Year`, `Month`,
  `cbs_statnr.`, `SBI code`, `Postal code`, `Weight (kg)`. SFN is the steel
  federation return; `SBI` is the Dutch industry classification. It reports
  **weight by customer industry and postcode**, which is a market-share return,
  not an accounting one.
- **`Revenue w.r.t. Budget`** — every revenue figure paired with its budget:
  `Weight` / `Weight Budget`, `Revenue` / `Revenue Budget`, `Profit` / `Profit
  budget`, `Profit %` / `Profit % Budget`, `Avg. Sales Price/Kg` / `… Budget`.
  A second view drops the revenue-group columns and reports by month alone.

## Smaller screens, captured

- **`Cost price for selling of invoices to be sent`** — 52 rows.
  `Account`, `Amount`, `Order`, `Line`, `Goods issue date`, `Cost centre`. The
  COGS accrual for goods gone out but not yet billed.
- **`Purchase invoices to be received`** — 416 rows, with the Dutch
  `Resterend inkooporderbedrag` (remaining purchase-order amount), `Te ontvangen
  facturen` (invoices to be received) and `Te ontvangen goederen` (goods to be
  received) against **GLA 3170**.
- **`Purchase orders to be received`** — 219 rows, `Amount(p)` against `Amount
  yet to be received`, `Kg(pur)` / `Kg(a)` / `Kg. still to be received`.
- **`CD-deliveries in progress`** — 115 rows. `Order`, `Line`, `Product`,
  `Delivery date`, `Quantity`, `Weight (kg)`, **`Stock value`**, **`Purchase
  value`**, **`Purchase value - Stock value`**, `Purchase order`, `Purchase
  order line`. Every row names a purchase order **and** a sales order line — a
  **CD delivery is bought against a specific sale**, which is what makes it a
  cross-dock. See [order-types.md](order-types.md).
