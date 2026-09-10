# Trip data

`Overviews → Logistics → Trip data`. A **trip** is the document that takes goods
out of the building: the mutations ledger shows **4 189 customer deliveries
caused by a `6xxxxx` trip** against 854 by a warehouse work order, so this is the
main door metal leaves through. See
[stock-mutations.md](stock-mutations.md#-a-delivery-to-a-customer-is-caused-by-a-trip-not-a-work-order).

**9-9-2026 exports**, both in `exports/`:

| File                     | Rows × cols  | View                   |
| ------------------------ | ------------ | ---------------------- |
| `trip-data.tsv`          | 438 × 7      | the default summary    |
| **`trip-data-full.tsv`** | **438 × 20** | **`View` = `-empty-`** |

---

## 🔴 Transport costing is not in use — seven empty columns

The `-empty-` view adds exactly the columns I was hoping for, and **every one of
them is empty on all 438 trips**:

| Column                | Non-zero rows |
| --------------------- | ------------- |
| `Driver`              | **0 / 438**   |
| `Km`                  | **0 / 438**   |
| `Hours`               | **0 / 438**   |
| `Cost price`          | **0 / 438**   |
| `Cost price per stop` | **0 / 438**   |
| `Cost price per Km`   | **0 / 438**   |
| `Cost price per Kg`   | **0 / 438**   |

> **The reference can cost a trip and nobody does.** No driver is ever named, no
> distance recorded, no cost booked.

This is the same shape of answer as _"six machines and no rate on any of them"_
and _"`Pickvolgorde` is 0 on all 1 940 locations"_: the field exists, the feature
does not. 🚫 **Do not build transport costing.** It is a column set, not a
process.

There is also **no status column at all** in the `-empty-` view, so the
seven-state trip ladder still comes only from
[transport-status-adjustments.md](transport-status-adjustments.md).

---

## `Vehicle` appears twice, and the pair is the model

Two columns both called `Vehicle` — position 5 and position 9. They are not a
duplicate:

| Position 5             | Position 9    | Trips |
| ---------------------- | ------------- | ----- |
| `ADO NL`               | `ADO NL`      | 154   |
| **`AFHAAL`**           | **‹blank›**   | 83    |
| `ADO BE`               | `ADO BE`      | 53    |
| `CUVELJE`              | `CUVELJE`     | 35    |
| `JONKER DE`            | `JONKER DE`   | 33    |
| **`VERVALLEN ORDERS`** | **‹blank›**   | 29    |
| `ERC`                  | `ERC`         | 13    |
| `INCIDENTEEL`          | `INCIDENTEEL` | 9     |
| `ADO DE`               | `ADO DE`      | 9     |
| `JONKER NL`            | `JONKER NL`   | 8     |
| …                      | …             |       |
| **`INCIDENTEEL`**      | **`ADO NL`**  | **2** |
| **`AFHAAL`**           | **`ADO NL`**  | **1** |
| **`VERVALLEN ORDERS`** | **`ADO NL`**  | **1** |

Position 9 is filled on **326 of 438** — blank on exactly the `AFHAAL` and
`VERVALLEN ORDERS` trips, _except_ four where it names `ADO NL`.

> **Position 5 is the shipping method. Position 9 is the carrier that actually
> hauled it.** They agree whenever the method _is_ a carrier, and position 9 is
> empty when nobody hauled anything — a customer collected, or the trip lapsed.
> The four exceptions are the giveaway: a trip booked as ad-hoc or as a pick-up
> that a real haulier ended up running.

That corrects what the summary view suggested. `Vehicle` position 9 **is** a
foreign key to a carrier company; position 5 is a shipping-method enum whose
values include three dispositions:

| Method                                   | Trips |                                                                                                                 |
| ---------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| **`AFHAAL`** _(pick-up)_                 | 84    | the customer collects — matches the `Afhaal` **location** and location type                                     |
| **`VERVALLEN ORDERS`** _(lapsed orders)_ | 30    | **23 carry zero kg.** Planned, never ran, kept rather than deleted — the same idea as `Receipt status: Expired` |
| **`INCIDENTEEL`** _(ad-hoc)_             | 11    | a one-off hire rather than a standing lane                                                                      |

## The carriers are lanes, and they are also locations

Fifteen values, and the pattern is carrier × destination country —
**`ADO NL` / `ADO BE` / `ADO DE`** and **`JONKER NL` / `JONKER BE` /
`JONKER DE`** are two hauliers split three ways each.

| Vehicle                                                                                | Trips | Total kg  | kg/trip    | kg/stop |
| -------------------------------------------------------------------------------------- | ----- | --------- | ---------- | ------- |
| `ADO NL`                                                                               | 154   | 1 188 240 | 7 716      | 1 671   |
| `AFHAAL`                                                                               | 84    | 576 166   | 6 859      | 6 129   |
| `ADO BE`                                                                               | 53    | 216 127   | 4 078      | 1 801   |
| `CUVELJE`                                                                              | 35    | 225 189   | 6 434      | 3 632   |
| `JONKER DE`                                                                            | 33    | 347 640   | 10 535     | 3 863   |
| `ERC`                                                                                  | 13    | 252 687   | **19 437** | 6 479   |
| `INCIDENTEEL`                                                                          | 11    | 120 428   | 10 948     | 10 948  |
| `JONKER NL`                                                                            | 8     | 189 665   | **23 708** | 17 242  |
| `INOX TRANSPORT sp. z o.o.` · `COMBILOG` · `LANKVELD` · `JONKER BE` · `FERCAM AUSTRIA` | 8     | 156 648   |            |         |

`ERC` and `JONKER NL` are the full-load lanes at 19 t and 24 t a trip; `ADO NL`
is the milk round — 711 stops across 154 trips.

`ADO`, `CUVELJE` and `JONKER` also appear in [locations.md](locations.md) as the
three children of the **`Transporteur`** section, so stock can physically sit on
a haulier's yard. That explains the saved view `Location = CUVELJE` returning
**0 rows** on `Stock on location`: it is a carrier's location, empty because
nothing is on their yard today.

## The per-stop columns are derived — and rounded two different ways

| Column            | Rule                          | Exact on      |
| ----------------- | ----------------------------- | ------------- |
| `Kg. per stop`    | **round**(`Kg.` / `Stops`)    | **437 / 438** |
| `Orders per stop` | **floor**(`Orders` / `Stops`) | **438 / 438** |
| `Colli per stop`  | **floor**(`Colli` / `Stops`)  | **438 / 438** |

So the reference rounds a weight and truncates a count, in adjacent columns of
the same grid. Both are exact, so it is deliberate rather than sloppy — a
fractional order or package is meaningless, a fractional kilo is not.

⚠️ `Orders per stop` in the _summary_ view looked broken (`≥ Stops` on 282 of
438). It was not: the summary omits the `Orders` column it divides by. With
`Orders` present, `Orders ≥ Stops` on 422 of 438 and the division is exact.

## The trip series starts at exactly `600000`

`Trip` is filled on **375 of 438** rows, all `6xxxxx`, from **`600000`** to
**`600408`**. That confirms `6xxxxx` as the trip series — the same one the
mutations export carries in `Workorder#`, which is how a delivery movement names
the trip that shipped it.

63 trips have no number: 29 `VERVALLEN ORDERS`, but also 16 `ADO NL`, 7
`AFHAAL`, 5 `CUVELJE` and one each for four other real carriers. The `-empty-`
view did not explain it, so it stands as unresolved.

## ⚠️ The reference database is dense Jan–May 2025 and sparse afterwards

| Month             | Trips           |
| ----------------- | --------------- |
| 2025-01           | 74              |
| 2025-02           | 118             |
| 2025-03           | 99              |
| 2025-04           | 89              |
| 2025-05           | 45              |
| 2025-07 … 2026-05 | **13 in total** |

**425 of 438 trips fall in five months.** My first reading was that trips were
abandoned — they were not. The mutations ledger shows the _same_ cliff for
deliveries caused by warehouse work orders:

| Month   | via a `6xxxxx` trip | via a `3xxxxx` work order |
| ------- | ------------------- | ------------------------- |
| 2025-01 | 802                 | 184                       |
| 2025-02 | 932                 | 276                       |
| 2025-03 | 998                 | 178                       |
| 2025-04 | 1 000               | 160                       |
| 2025-05 | 456                 | 50                        |
| after   | **2**               | **6**                     |

Both channels stop together, so **this is the shape of the reference database
itself**, not a change in how the business ships. It is a snapshot that was
loaded with about five months of real trading.

🚩 **This caveat applies to every row count in every doc here.** Ratios and
formulas proved against these exports are sound — they are arithmetic. Volumes
are not: "6 trips a week" is wrong, "about 20 trips a week during the five live
months" is right.

## Shape of a trip

- **`Stops`**: 1 on **267** trips, 2 on 50, then a tail to 20. Most trips are a
  single drop.
- **`Orders`**: 0 to 26, and `≥ Stops` on 422 of 438 — several order lines can
  ride to the same address.
- **`Colli`** _(packages)_: 0 on 161 trips, long tail to **533**.
- **`Kg.`**: **3 326 865 kg**, biggest single trip **51 758 kg**, 25 at zero.
- **`Year (Trip date)` / `Month (Trip date)`** are materialised as their own
  columns, as on every other overview here.

## The working day starts at seven

`Trip date` is a **datetime** and the time is the departure slot: **180 of 438
leave at 07:00**, then 08:00 (67), 10:00 (36), 09:00 (32), 13:00 (29), and a
tail from 05:00 to 16:00. All on the hour.

So trips are booked into **whole-hour** slots, where
[warehouse-and-production-workorders.md](warehouse-and-production-workorders.md)
found work orders released into **half-hour** slots.

---

## Still needed

1. **One trip opened** — its header, its stops/lines, its toolbar. The overview
   has no status column, so the seven-state ladder cannot be tied to real rows
   from either export.
2. **`Bill of lading` vs `Trip number`.** A delivery carries both a `300xxx`
   bill of lading and a `6xxxxx` trip number. A trip with several stops would
   show whether the bill of lading is per stop or per trip.
3. **Why 63 trips have no number**, if it turns out to matter.
