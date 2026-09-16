# Batch registration (items E2–E5)

`Overviews → Batch registration`, 14-9-2026.

| # | Screen | Result | File |
| --- | --- | --- | --- |
| E1 | Batches | **2 910 × 23**, 16-9-2026 | `exports/e1-batches.tsv` (`Batches 1.xlsx`) |
| E2 | Certificates received | **2 540 × 27** | `exports/e2-certificates-received.tsv` (`Certifcates recevied.xlsx`) |
| E3 | Certificates to be linked | **empty** — columns photographed | — |
| E4 | Sending certificates | **3 271 × 35** | `exports/e4-sending-certificates.tsv` (`Sending certificates.xlsx`) |
| E5 | Deliveries from the missing batch | **empty** — columns photographed | — |

Filters: `Creation date` / `Delivery dates` 1-1-2024 → 14-9-2026, codes open;
E3 with `All certificates not yet linked` ticked.

---

## 1. 🔴 No certificate has ever been attached or sent

On **all 2 540** received rows and **all 3 271** sent rows:
`Document code`, `Filename`, `Document certificate`, `Sheet number`,
`Requested certificate` and `Internal reference` are **empty**, and
`Document sent on` is **0**. `Sending to` is filled on 12 rows, all
`certificaten@alinco.be` for one customer. `Mand. ign. doc.` is `False`
everywhere.

So the *certificate* half of this module is unused. What **is** used, on every
row, is the **batch** half: which heat and which internal batch a sheet came
from, and which customer it went to. The screens are named for certificates and
work as a **traceability register**.

## 2. 🔴 The internal charge — the batch identity

`Internal charge` is filled on **2 540 of 2 540** received rows and **3 271 of
3 271** sent rows, always in one format:

```
25ACRT   =   2-digit year  +  4 capital letters, counted up
```

- `25` on 2 514 rows, `26` on 26 — **the year the goods were received**, and the
  letters run on (`25AAAM`, `25AAIW`, … `25ADPY`).
- **One internal charge can cover several receipt rows** — 82 charges span 2–5
  rows (⚠️ **inflated**: 16-9-2026 the E2 file turned out to carry **314 exact
  duplicate rows**, a join doubling in the reference report; 2 226 distinct rows), and on **82 of 82** those rows share the same purchase order line and
  product. It is a number per *receipt of one purchase line*, not per sheet.
- `Charge` is the **mill's heat number**, typed from the paperwork. It is junk on
  about a fifth of rows: `nvt` 233, `-` 109, `NL` 55, `DE` 37, `ntv` 36, `BE` 18,
  `r`, `x`, `2`. The internal charge is the only reliable key.

## 3. 🔴 Every sheet sold traces back to its receipt — proved

Joining E4 to E2 on `Internal charge`:

| Check, per internal charge | Holds on |
| --- | --- |
| the charge shipped exists in the received register | **1 662 of 1 662** |
| same **heat number** | **1 662 / 1 662** |
| same **purchase order** | **1 662 / 1 662** |
| same **receipt date** | **1 662 / 1 662** |
| same **quality code** | 1 660 / 1 662 |
| same **product** | **1 570 / 1 662** |

- The chain *customer delivery → internal charge → heat → purchase order →
  receipt* is **complete and consistent**. That is what E5, *Deliveries from the
  missing batch*, being **empty** means: no delivered line is without one.
- **92 charges were sold as a different product than they were received as.**
  The batch identity **survives processing** — a coil decoiled into sheets, a
  plate cut to size, keeps its internal charge and heat.
- ⚠️ Kilos do not conserve per charge: on 563 of 1 662 charges more kg was sent
  than E2 shows received. Consistent with processing (a charge's output rows are
  different products) but not proved.

## 4. A sales line can ship from several batches

Of 1 831 sales lines in E4: 1 686 from **one** internal charge, **145 from two
to five**. One row per line *per batch*.

## 5. Small things

- **`Length` = `999999`** on 736 received rows — 670 coils and 66 aluminium. The
  "no length" sentinel for material sold off a roll.
- **`Hego Voorraadcorrecties`** (*stock corrections*) is a **supplier** with 157
  received rows, bills of lading `Gevonden loc 6` (*found at location 6*) 90,
  `intern` 36. Stock found in the warehouse is booked **as a purchase** so it
  gets an internal charge.
- All purchase orders are the `IO4xxxxx` series.
- `Stock Category` = `2nd choice` on 826 received / 725 sent rows; `Scrap` and
  `Remaining` once each.
- `Options` are carried on the batch (`Laser Folie`, `Slijpen, Laser Folie`) —
  118 received rows.
- E4 `Bill of lading` is the **sales** bill of lading (`301005`, `300924` — the
  `30xxxx` series of the trips), blank on 302 rows; E2's is the **supplier's**
  (`SGN2566950`, `VZ-2500242`).
- `Delivery status` in E4: `Invoiced` 3 240, `Partially delivered` 31.
- `Producer` filled 3 / 15 times (`Innomet B.V.`, `Holland Stainless Int`).

## 6. E3 — Certificates to be linked is a message log

Empty, but the columns say what it is:

`Created on`, `Adjusted on`, `Adjusted by`, `Final destination`,
`Specification`, `Lowest purchase…`, `Role`, `Supplier`, `Receipt status`,
`Highest purchase…`, `Work panel`, `Receive data storage`, `Receive data`,
`Data sent storage`, `Data sent`, `Invoked method`, `Retry possible`,
`Last error message`, `Error message`, `User interaction required`.

**It is the inbox of an electronic certificate exchange** — messages received
from suppliers, the method invoked, retries and errors. Nothing has ever
arrived. It is not "certificates without a received date".

## 7. E5 — Deliveries from the missing batch

Empty (filter `Delivery dates`, `Company code`, `Product code`). Columns are E4's:
`Sales order`, `Sales line`, `Customer code`, `Customer`, `Customer reference`,
`Product code`, `Product`, `Delivery date`, `Bill of lading`, `Length`, `Width`,
`Qty(a)`, `Qty U`, `Kg(a)`, `Internal reference`, `Charge`, `Internal charge`,
`Sheet number`, `Purchase order`, `Receipt date`, `Document code`, `Filename`,
`Requested certificate`, `Sending to`, `Document sent on`, `Mand. ign. doc.`,
`Delivery status`, `Options`, `Thickness`, `Stock Category`, `Quality Code`,
`Document certificate`, `Producer`. Empty is the correct answer — §3.

---

# Part 2 — E1 Batches, the master (16-9-2026)

`Overviews → Batch registration → Batches`. **2 910 rows × 23 columns**, receipt
dates 6-1-2025 → 1-9-2026. Columns:

`Purchase order`, `Supplier code`, `Supplier`, `Product code`, `Product`,
`Length`, `Width`, `Qty(a)`, `Qty U`, `Kg(a)`, `Charge`, `Internal charge`,
`Sheet number`, `Document code`, `Filename`, `Mand. ign. doc.`, `Receipt date`,
`Thickness`, `Stock Category`, `Quality Code`, `Document certificate`,
`Producer`, `Options`.

It is E2 without `Purchase line`, `Bill of lading`, `Internal reference` and
`Regel referentie` — and with **more rows**.

## 8. 🔴 A batch row is written on receipt *and on every processing output*

Every one of E2's 2 172 internal charges is in E1 (none missing). E1 adds
**487 rows / 291 charges** E2 does not have, and 192 extra rows on charges E2
does have. They come from three places:

| Source | Rows | How to recognise it |
| --- | --- | --- |
| **Processing output on a received charge** | 192 | Same PO, product and heat as the receipt, **a later date** (177 of 192), sheet dimensions, `Options` = `Decoilen` on 157. Example `25AAOJ`: coil `CK3040015` 1 ST / 3 750 kg received 30-1-2025, then **121 ST 2000×1280 / 3 674 kg** on 14-2-2025 — the coil decoiled into sheets, still the same batch |
| **`Hego Production` as supplier** | 125 rows, 47 POs | Sheets (`PK…`) decoiled in-house, `Options` `Decoilen` on 119, mill heats carried over (`SD71644_4`). Production output is booked as a **purchase from ourselves**, so it gets a batch row |
| **External processors** | 76 rows (`Krogman Metals`, `H. Schrijver Construktiebedrijf`, JetLaser, …) | Their POs are in no E2 row at all (0 of 94). `Producer` names the processor on 17 |

So the reference does **not** stop registering a batch at the goods receipt.
Whenever material comes back into stock under a charge — decoiled, cut,
processed outside — a new batch row with that day's date, dimensions, pieces and
kilos is written against the **same internal charge and heat**. That is how §3's
92 charges could be sold as a different product than they were received as.

Kilos per charge against E2: equal on 2 049, lower on 82, higher on 41 — the
processing rows.

## 9. 🔴 Opening stock came in on 13 empty purchase orders

**257 rows** sit on purchase orders `100020`–`100083` (13 orders, the `1xxxxx`
range, not `4xxxxx`). Purchase order `100020` opened:

- Creation date **31-12-2024**, purchaser **INAD**, status **Gefactureerd**
  (invoiced), type `Materials`, delivery date **1-1-0001**, week 53 / 2024
- **0 lines**, every total € 0,00, 0 kg

Their internal charges are **old**: `23…` 218, `22…` 37, `18…` 2 — issued by
the previous system. This is the **stock take-over at go-live**: every lot on
the shelf on 31-12-2024 was loaded against a dummy order per supplier (Swedinox
110, Hyundai 70, Dabbagh 21, Aperam 19, …), keeping its original charge.

**`Mand. ign. doc.` is `True` on exactly these 257 rows and `False` on all 2 653
others** — the take-over batches were excused from the certificate requirement.
That is the one use the flag has ever had.

## 10. Certificates: still nothing, and the folder proves it

`Sheet number`, `Document code`, `Filename` and `Document certificate` are empty
on **all 2 910** rows. `Open file location` opens **`T:\Test\Certificaten`** — a
network share — which holds two unrelated files (`factuur.pdf` 12-12-2023,
`Order - emballagekosten.prnx` 4-2-2024). The file store exists; nothing was
ever filed in it.

17 rows have `Kg(a)` 0 and no `Qty U`. `Stock Category`: `2nd choice` 938,
`Scrap` 4, `Remaining` 3.

## 11. Row menu and `Adjust charge…`

Right-click on a batch row:

`Show Product` · `Show Company` · `Show Purchase order` · `Show File` ·
`Open file location` · **`Adjust charge…`** · **`Stock label`**

`Adjust charge…` (*Charge aanpassen*) opens:

| Current (read-only) | New |
| --- | --- |
| Current charge `70764 5` | New charge — text, prefilled with the current |
| Current sheet number | New sheet number — text |
| Current internal charge `23EFFG` | New internal charge — **not typed**: a `Select` button picks an **existing** internal charge |

Buttons `Reset` · `OK` · `Cancel`.

So a batch's **heat number and sheet number are correctable after receipt**, and
a batch can be **moved under another internal charge** (merging two batches —
e.g. two receipts that are really one heat). The internal charge itself is never
free text.

`Stock label` prints the label for the batch's stock.

## 12. What this changes in `apps/dashboard`

Ours (`/batches`, `Batches` + `StockBatches`) registers a batch only from a goods
receipt, and only when someone presses **Generate batches**. Against E1:

1. A batch must be written **automatically** when goods are received, not by a
   button.
2. A batch row must also be written when **processing output** comes back into
   stock (production work order reported, external processing received),
   carrying the **source lot's internal charge and heat**, with the output's date,
   dimensions, pieces and kilos.
3. Opening stock / stock corrections need a batch with an internal charge given
   by hand or kept from before, with `Mandatory, ignore document` on.
4. **Adjust charge** is missing: edit heat and sheet number, or re-point to an
   existing internal charge.
5. Row actions `Show Purchase order`, `Show Product`, `Show Company`, `Stock
   label` are missing; `Show File` / `Open file location` belong with the
   certificate upload.
6. The overview should carry exactly the 23 columns above.
