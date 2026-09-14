# Batch registration (items E2–E5)

`Overviews → Batch registration`, 14-9-2026.

| # | Screen | Result | File |
| --- | --- | --- | --- |
| E1 | Batches | **not captured yet** | — |
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
  rows, and on **82 of 82** those rows share the same purchase order line and
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
