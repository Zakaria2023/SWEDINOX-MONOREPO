# Options, and the call-off screens

**Items B9, B13 and B14 of [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md), captured
13-9-2026.** Three exports:

| Item | Screen | File | Size |
| --- | --- | --- | --- |
| B9 | `Sales → Options` | `exports/b9-options.tsv` | 2 890 rows × 31 cols |
| B13 | `Sales → Order lines still to be called` | `exports/b13-order-lines-still-to-be-called.tsv` | 55 rows × 26 cols |
| B14 | `Sales → Orders still to be called` | `exports/b14-orders-still-to-be-called.tsv` | 691 rows × 49 cols |

---

## 1. The option catalogue — **13 codes**, and they are priced

| Code | Option | Rows | Revenue group |
| --- | --- | --- | --- |
| `L` | Laser Foil | 935 | Grinding/Foiling |
| `LSR` | Laser | 845 | Lasering |
| `SL` | Grinding | 630 | Grinding/Foiling |
| `BF` | Blue Foil | 128 | Grinding/Foiling |
| `NG` | Brushing | 100 | Grinding/Foiling |
| `K` | ShearCut | 88 | Cutting |
| `F` | UV Foil | 75 | Grinding/Foiling |
| `D` | Decoilen | 71 | Decoiling |
| `DUP` | Duplo | 5 | Grinding/Foiling |
| `STP` | Stempelen | 5 | Other processing |
| `FV` | Remove Foil | 5 | Other processing |
| `Pap` | Paper interleaving | 2 | Grinding/Foiling |
| `A21` | 2.1 Certificate | 1 | Other products |

The code → revenue group mapping is **1:1 with no exceptions** across 2 890 rows.

Two of the thirteen names are still Dutch in the reference's own English UI:
`Decoilen` (decoiling) and `Stempelen` (stamping). `A21` is not a treatment at
all — it is a **certificate**, sold as an option. That is the first hard link
between the option list and the certificate chain of Part E.

---

## 2. 🔴 Options have their **own revenue-group band**

| Number | Group | Rows |
| --- | --- | --- |
| 3000 | Decoiling | 71 |
| 3010 | Grinding/Foiling | 1 875 |
| 3020 | Cutting | 88 |
| 3030 | Lasering | 845 |
| 3090 | Other processing | 10 |
| 2900 | Other products | 1 |

Materials sit in the **1000** band ([order-lines.md](order-lines.md) §9),
processing in the **3000** band, and surcharges in the **8000** band
([invoice-lines.md](invoice-lines.md) §2). The revenue group is the reference's
P&L dimension, and it is banded by *kind of thing sold*.

---

## 3. 🔴 Option revenue — one formula per unit, **0 mismatches on 2 856 rows**

```
Revenue = round-half-up( basis × Net price (PriceU) , 2 )
```

| `PriceU` | basis | rows |
| --- | --- | --- |
| `M2` | `Quantity × (Length/1000) × (Width/1000)` | 1 873 |
| `ST` | `Quantity` | 907 |
| `TN` | `Weight (kg) / 1000` | 76 |

`M2` appears **only** on options — the line grid never uses it. 34 rows carry no
unit at all (33 `K`, 1 `A21`) and are excluded.

---

## 4. 🔴 An option is normally sold **at cost**

`Cost price == Net price` on **2 880 of 2 890 rows**, which is why `Profit` is
`0` on 2 882 of them. The option is a pass-through: the customer pays what the
treatment costs, and the margin is taken on the metal.

92 % of options are not charged at all — `Net price = 0` on 2 670 rows. Only 220
are priced, and 187 of those are `Laser`.

The ten exceptions are where somebody typed over it, and they prove the cost
field is real rather than a mirror:

| Order | Option | Price | Cost | Profit |
| --- | --- | --- | --- | --- |
| `O102185` | `F` UV Foil | €2.00/M2 | 0 | **+€40.00** |
| `O102181` | `D` Decoilen | 0 | €110/TN | **−€971.44** |
| `O102090` | `SL` + `L` | 0 | €25/M2 each | −€100 each |
| `O100950` | `STP` | €0.01/ST | 0 | +€0.49 |

**We already model this correctly** — `SalesOptions` has `basePrice` and
`costPrice`, `ProductOptionPrices` overrides per product, and `M2` is in
`salesUnitOptions`. Nothing to change; this is confirmation.

---

## 5. 🔴 The reference's **numeric line-status codes**

B13 and B14 print `Line status` as a **number** where
[order-lines.md](order-lines.md) prints a word. Joining the two exports on
`(Order, Order line)` decodes them:

| Code | Status |
| --- | --- |
| `010` | Provisional |
| `210` | Released |
| `310` | In progress |
| `610` | Partially delivered |
| `805` | Partially invoiced |
| `810` | Invoiced |
| `830` | **?** |

**Status `830` is a status the `Order lines` screen hides.** Two lines carry it
— `100633` lines 10 and 50 — and *neither appears in B2*, while lines 20, 30,
40, 60 and 70 of the same order do. So the reference has a terminal line state
that its main line grid filters out. Cancelled or deleted is the obvious
reading; **one screenshot of the line-status dropdown settles it**, and that is
worth asking for.

The gaps in the sequence (`110`, `410`, `510`, `710`, `820`…) are where
`Checked`, `Completed` and `Received` live. The ladder is numbered in hundreds
so states can be inserted between them.

---

## 6. The two call-off screens

Both are filtered to **call-off orders only** — 14 and 15 orders, which matches
the 16 `Call-off` orders the header export found.

- **B13 — `Order lines still to be called`**: 55 lines, statuses `010`, `210`,
  `310`, `610`, `805`. **Not yet invoiced.** This is the work list.
- **B14 — `Orders still to be called`**: 77 lines, the same 55 plus every `810`
  (Invoiced) and the two `830`. **The history.** It also carries 23 extra
  columns — the product's whole stock and purchasing block: consumption over
  1/3/12 months, stock on hand, on order, date of arrival, purchase price, sales
  price, minimum stock and its method.

Proved on B14:

```
Amount to be delivered = Amount × (Quantity not yet delivered / Quantity)
Weight to be delivered = Weight × (Quantity not yet delivered / Quantity)
```

674 of 691 rows each.

**Both screens carry `Earliest call-off date` and `Last call-off date`** — a
call-off line has a window, not a date. The two are equal on 42 of 55 (B13), so
most windows are a single day.

⚠️ **B14's grid double-counts.** 691 rows cover only 77 distinct
`(Order, Order line)` pairs, one repeats **40 times**, and **540 of the 691 rows
are byte-identical duplicates**. The repeats differ only in `Stock`,
`On order`, `Date of arrival` and `Purchase price` — it is joining each call-off
line to every open purchase line for that product. Do not sum a money column on
this screen.

`Min. Stk. Method` reads `0 (Factor x Avg.Mnt.Usg.)` on 681 of 691 rows — the
minimum-stock factor is set for ten products and left at zero for the rest.

---

## 7. B14's stock block — why these lines are waiting

The 23 extra columns, read on the **77 distinct lines** (not the 691 duplicated
rows):

| Column | Filled | Note |
| --- | --- | --- |
| `Purchase price` + `Purchase price U.` | **77 / 77** | always `TN` |
| `Sales price` + `Sales price U.` | 76 / 77 | always `TN` |
| `Reserved stock` | 75 / 77 | |
| `Stock` / `Stock (Kg)` | 20 / 77 | `Stock U.` is `ST` on all 77 |
| `Last order date` | 29 / 77 | |
| `On order` / `On order (kg)` | 13 / 77 | |
| `Date of arrival` | 17 / 77 | |
| `Consumption last year` (kg and units) | 10 / 77 | |
| `Consumption last 3 months` | 3 / 77 | |
| `Consumption last month` | **0 / 77** | |
| `Minimum stock` / `Minimum stock (Kg)` | 6 / 77 | |
| `Min. Stk. Fixed value` | **0 / 77** | |
| `Min. Stk. Factor Avg.Mon.Cons.` | `1` on all 77 | |

🔴 **`Reserved stock` exceeds `Stock` on 56 of the 77 lines.** Only 21 have
enough on hand to cover what is already reserved against them. That is the
screen's whole point: a call-off line sits here because the metal it is waiting
for is spoken for or not yet in. It is not a reporting curiosity — it is the
condition, and the reason 267 delivery lines read *"Purchased materials have not
yet been received"* ([deliveries.md](deliveries.md) §2).

⚠️ **These are product-level figures, not line-level.** They repeat unchanged
across every duplicate row of the same line, which is why summing anything on
this screen double-counts up to fortyfold.

**Interesting by its absence:** a product that sells has a purchase price and a
sales price on **every** line here — while the standing price list
([product-prices.md](product-prices.md)) has neither. So the prices exist
somewhere the `Product prices` screen did not show at the date it was asked
about. Another reason to re-run B11 with a current price date.
