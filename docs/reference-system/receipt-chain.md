# The receipt chain, traced end to end

Captured **9-9-2026** by walking single orders through five screens rather than
reading any one screen's columns. It answers the question that had been open
since the purchase group was built: **when does a stock lot come into
existence?**

> **The lot exists before the invoice.** Purchase order `400130` is
> `Receipt status: Received`, still owes **€ 0,11**, and already has a lot of
> **1 ST / 11 kg** at location `Fox`. Nothing has been invoiced, and the
> material is on the shelf.

That closes follow-up 3 of [LOGISTICS-BUILT.md](LOGISTICS-BUILT.md), and it
closes it in our favour: `warehouse-work-orders/actions.ts` already creates the
lot when an `Unloading` work order is approved. The reference agrees. What is
_wrong_ is that `purchase-invoices/actions.ts` creates one **as well** — see
[PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md).

---

## The chain, as the reference draws it

```
purchase order line  ──▶  reception            ──▶  warehouse work order  ──▶  stock lot
     400130/20             Kg(p) 11, Kg(a) 11        307873/2  Unloading         2009100
                           charge YU102842           From ‹empty›  To Fox        Fox · Pick
                           interne charge 25AAWO     status Approved            11 kg · S235
```

Four documents, one parcel of metal. Each step keeps the identity of the last.

### The purchase order carries its work orders on its own screen

`Purchase order 401259` has a **`Workorders → Warehouse workorders`** panel
listing work order `307873`, lines 1 and 2, `Type: Unloading`,
`Status: Approved`. The header toolbar has a **`Workorder`** button, so the work
order is raised _from_ the order.

The work order line holds `Qty(p)/Kg(p)` against `Qty(a)/Kg(a)` plus
`Qty Changed` and `Kg Changed` checkboxes — so a deviation is recorded as a flag
and a reason (`Deviation reason`), not inferred by comparing the two numbers.

**A warehouse work order has a `From` and a `To`.** On an `Unloading` the `From`
is empty — goods-in has no origin inside the warehouse — and the `To` is the
location the metal lands on. Both were `Fox`.

### `Ontvangst` is a real location

Work order `306693` (`Type: Fetching`) runs `From: Ontvangst` `To: Decoiler`.
So goods-in is not a virtual state; it is a named location material is moved
_off_. Two work orders in sequence:

|                       | Type        | From        | To                             |
| --------------------- | ----------- | ----------- | ------------------------------ |
| goods arrive          | `Unloading` | ‹empty›     | `Ontvangst` or a pick location |
| goods go to be worked | `Fetching`  | `Ontvangst` | `Decoiler`, `Laser 1`, …       |

That same work order hangs off **order `102189` — a `1xxxxx` sales order**, not a
purchase order, and its `Company` is `Hego Production, ALMERE` (an internal
affiliate). So a warehouse work order's parent document can be either series.

---

## The lot's identity is a triple, not a pair

`Charge aanpassen…` on the reception exposes three fields, and the dialog for
changing them shows all three current values:

| Field            | Example                      | What it is                           |
| ---------------- | ---------------------------- | ------------------------------------ |
| `Charge`         | `YU102842`                   | the **supplier's** melt/heat number  |
| `Plaatnummer`    | ‹blank›                      | plate / sheet number within the heat |
| `Interne charge` | `25AAWO`, `25AELU`, `25ACKT` | **our own** code                     |

The new internal charge is chosen with a **`Selecteer`** button, not typed — so
internal charges come from a registry, and the format is the year plus a
four-character sequence (`25` + `AAWO`).

⚠️ `Charge` is dirty free text. Across 2 247 lots: 607 blank, **`nvt`** 145
(Dutch _n/a_), **`-`** 33, **`ntv`** 32 (a transposition of `nvt`). Any importer
has to fold all four into NULL.

## A reception can be held hostage by its certificate

`Batch registration` opens **`Partijregistratie instellingen`**, which shows the
reception (`Order 400348/10`, `Afmetingen / gewicht 4000 / 3,9 KG(w)`,
`Ontvangst datum 11-2-2025`, `Interne charge 25AAWO`, `Charge YU102842`) and
offers exactly one setting:

> ☐ **`Document verplichtigingen negeren op bovenstaande ontvangst.`**
> _If this is set it will no longer be mandatory to link a document to this
> receipt. As a result the line may disappear from view._

So: **goods-in requires a document — a mill certificate — to be linked**, the
obligation is enforced per reception, and there is a per-reception waiver. That
is the mechanism behind the `documents` block reason, and it explains why a
receipt line stays in somebody's to-do list after the metal has physically
arrived.

We model none of it. `PurchaseLineReceivals` has no `charge`, no
`internalCharge`, no plate number and no document obligation.

---

## Number series

| Series   | Document                          |
| -------- | --------------------------------- |
| `1xxxxx` | sales order                       |
| `29xxxx` | **return** — see below            |
| `3xxxxx` | warehouse / production work order |
| `4xxxxx` | purchase order                    |
| `6xxxxx` | trip                              |
| `300xxx` | bill of lading                    |

### RETRACTED: there is no `2xxxxxx` lot series

I recorded `2009100` here as _"a lot has its own number — a `2xxxxxx` series,
an eighth one"_. **That was wrong.** `2009100` is a **product code**:

- it is in `exports/stock-on-location-Sheet1.tsv` under **`Product code`**, at
  location `Fox`, `1273 x 1100`, `11.2024 kg` — the very same lot
- it appears three times in `exports/stock-mutations.tsv`, again as a product
  code
- it is in `exports/pick-statistic.tsv`'s `Product code` column beside
  `201003315` and `20100425125`, part of a numeric aluminium range **28 of whose
  codes carry no description at all** — which is what made a bare number look
  like an internal id

The `Code` column on a purchase order's `Stock` panel is the **product** code.

> **A lot has no number of its own.** Its identity is the tuple — product +
> location + **`Internal charge`** (`25AAWO`, `21GFFI`, `23EHGI`) +
> **`Internal Bundle`** (`366558`, `389755`) — plus the supplier's `Charge`
> where there is one. Those two internal codes _are_ the lot identity.

### And the density rule, to four decimals

The same row is the most precise confirmation of the weight rule in these notes.
`1 273 x 1 100 x 1 mm` at **8 000 kg/m3**:

```
1,273 x 1,1 x 0,001 = 0,0014003 m3   ->   x 8 000 = 11,2024 kg
```

The export reads **`11.2024`**. The same digits, not rounded. The screen prints
`11` because that product's `decimal places` is 0.

### `29xxxx` is `Return` — the series is no longer a mystery

Every `29xxxx` row in the Receipts grid reads **`Order type: Return`**: 290144,
290099, 290208, 290009, 290125, 290035, 290210. They behaved like purchase
orders because a return _is_ goods-in — a customer's metal coming back through
the receipts door. All of them carry `Qty 0 / Kg 0` and
`Receipt status: Expired`: a return that was announced and never came back.

That was open since the purchase group. Closed.

---

## `Customer Materials` is a purchase order that owns nothing

`Purchase order 401259` has `Purchase order type: Customer Materials`, every
price € 0,00, and a `Total weight` of 28 Kg. Its product is `PCDIVS001` — a
catch-all article (`Length 0`, `Width 0,0`, `Fixed dimensions` unticked,
search code `PCDIV`) whose whole description is _"Snijwerk 1mm"_.

**Its lot carries no origin document, no supplier, no charge and no internal
charge**, and its `Receipt date` reads `1-1-0001`. Customer metal is anonymous:
it comes in, it gets worked, it goes out, and the system does not pretend to own
it. Two products' `Stock` panels were empty for exactly this reason before a
third one landed.

`purchaseOrderTypes` already carries `customer_materials`, so nothing changes —
but the _lot_ needs to tolerate having no origin at all.

⚠️ **`1-1-0001` is this system's null-date sentinel.** It also appears as
`EDI Leverdatum 1-1-0001`. Read as a date it is the year 1; it means _unset_.

---

## The density rule, confirmed to the gram — three times

`PCDIVS001` (the product screen) holds two different weight fields, and telling
them apart is the whole game:

| Block      | Field           | Value                 | What it is                |
| ---------- | --------------- | --------------------- | ------------------------- |
| `Features` | `Weight`        | **`8.000,000 KG/M3`** | a **density**             |
| `Weights`  | `Theoretically` | `0,000`               | per-piece, **empty here** |

With no per-piece figure, `Kg(p)` must be derived — and it is, exactly:

| Line | Size               | 8 000 kg/m³ × volume | Screen |
| ---- | ------------------ | -------------------- | ------ |
| 10   | 2000 × 1000 × 1 mm | **16,00**            | `16`   |
| 20   | 2000 × 740 × 1 mm  | **11,84**            | `12`   |

Order header `Total weight: 28 Kg` = 16 + 12, so the header sums the **rounded**
line weights. The rounding is the product's own
`Number of decimal places weight = 0`, which our schema already has as
`Products.decimalPlaces`.

Two more, from other screens:

- `400130/20`, `1273 × 1100 × 1 mm` at 8 000 → **11,2** → lot reads `11 kg`
- `PK30430021`, `2000 × 1000 × 3 mm` at 7 850 → **47,1** → lot reads `47.1 kg`

**This is precisely the chain `productPieceWeightKg` implements** — prefer the
stored per-piece weight, fall back to density × volume — and it had never had a
clean confirmation before. See
[stock-on-location.md](stock-on-location.md#the-2-247-lot-export) for the same
rule checked across 1 929 lots at once.

### And it settles the `weight_unit` question for good

`Theor. Wt. U.` is **`M3` on 2 238 of 2 247 lots**. So on the reference that
column really does say _density_ almost everywhere.

🚫 It still must not be backfilled to `M3` on our data. Our
`Products.theoretical_weight` holds a **per-piece weight** on 3 570 rows and has
**zero** rows in the 6 000–9 000 band. The reference keeps a density in that
column and we keep a weight; the unit beside it is the only thing that says
which. What this export does reveal is that our _import_ filled the wrong field
— the density belongs in `theoretical_weight` + `weight_unit = M3`, and the
per-piece figure in `weight_theoretical`. That is an import defect to record,
not to silently correct.

---

## 🔴 H1.1 — watched live, 21-9-2026. The documents exist before the goods do

**Purchase order `401141`, Holland Stainless Int, `Released`, created 6-8-2026.**
Thirteen screenshots, the first half of flow H1 ([FLOWS.md](FLOWS.md)). Nothing
has been received: `Kg(a)` and `Qty(a)` are **0** on every panel.

And yet the order already carries **both** downstream documents:

| Document | State | Actuals |
|---|---|---|
| **Reception** — `Receipts`, "1 reception" | status `Workor…` (`workorders_created`), ✅ pre-notified, bill of lading **`324234`** | `Kg(p)` 10 598 / `Qty(p)` 100 · **`Kg(a)` 0 / `Qty(a)` 0** |
| **Warehouse work order** — `306675` line `1` | Type **`Unloading`**, Status **`New`**, `From` ‹blank› → `To` **`Ontvangst`** | `Kg(p)` 10 598 · **`Kg(a)` 0 / `Qty(a)` 0** |
| **Stock lot** | — | **does not exist** |

> **The reception and the work order are planning documents. The lot is not.**
> Releasing the order, confirming it and pre-notifying it create the paperwork
> for goods that have not moved. Nothing becomes stock.

That is the answer H1 was asked for, and **it is the answer our code already
implements**: the lot is created when the unloading work order is *reported*,
not before. Three moments are now ruled out — order release, pre-notify, and
raising the work order.

### What this makes definitively wrong

`purchase-invoices/actions.ts` creates a lot of its own when a purchase invoice
arrives. The reference has a complete receipt chain standing here with **no
invoice anywhere in it**, and will have a lot before one is ever raised. That
second creation is a duplicate and comes out.

⚠️ **Still owed by H1.2:** the reporting step itself — `New` → `Approved`, where
`Kg(a)` is filled and the lot appears. Until that is watched, *which* click
creates the lot is inferred from what is absent here, not seen.

### `Charge` and `Internal charge` are empty at this stage — on both documents

The work order line carries a `Charge` column and the reception carries `Charge`,
`Internal charge` and `Sheet number`. **All blank.** So a lot's identity is not
decided when the order is placed; it is captured when the metal is physically
booked in. The `Batch registration` button sitting on the Receipts panel toolbar
is almost certainly where it comes from — which makes H11 and H1 the same panel.

### The Receipts panel is where three other open items live

Its toolbar reads: `New` (greyed) · `Delete` (greyed) · **`Split`** ·
**`Batch registration`** · `Charge aanpassen…` (greyed).

- **`Split`** is J4 — a purchase line received in two goes. It is a button on
  the reception, not a second reception created by hand (`New` is greyed).
- **`Batch registration`** is H11's attach path.
- `Charge aanpassen…` is greyed until there is a charge to adjust.

`New` and `Delete` being greyed on **both** the Receipts and the Warehouse
workorders panels says the same thing twice: **you cannot hand-make either
document from the purchase order.** They are consequences of a button on the
header toolbar (`Confirm` · `Pre-notifiy` [sic] · `Workorder`), never of typing.

### `To` is `Ontvangst` here and `Fox` on order `401259`

Both `Unloading`, both `From` ‹blank›. So the destination of a goods-in move is
a **choice**, not a constant: goods-in proper, or straight to a pick location.
Whatever makes that choice is not on this screen.

### The arithmetic, confirmed on a live record

| Check | Working | Screen |
|---|---|---|
| Line weight | 100 × 3,000 × 1,500 × 0,003 m³ × **7 850 kg/m³** = 10 597,5 | `Kg(p)` **10 598** |
| Per piece | 10 598 ÷ 100 = 105,98 | every stock row: 742/7, 424/4, 2 014/19, 1 060/10 → **106** |
| Line amount | 10,598 TN × € 2 000,00 | **€ 21 196,00** |
| VAT | 21 196 × 21 % | **€ 4 451,16** |
| Total incl. | 21 196 + 4 451,16 | **€ 25 647,16** |
| `M1(p)` | 100 × 3 m | **300** |

The `TN` price basis and the density rule both hold to the cent and the gram on a
record created this year. Note the density is **7 850**, not the 8 000 of
`PCDIVS001` — it is per product, as the section above already establishes.

### 🟡 The `Pricing` panel is zero because the price was typed

Base price, quantity surcharge, colour surcharge, `Lengtetoeslag`, gross price,
all four discounts and net price: **€ 0,00**, while the line itself reads
`Net Price € 2.000,00 TN`.

This is not a capture failure. **The panel shows a derivation, and a
hand-entered net price derives nothing.** Every `Pricing` panel captured on this
project has read zeros, and this explains all of them at once. To see the
cascade, a line has to be priced *from a price list* — which makes it H2's job,
on the sales side, not something more purchase orders will ever show.

Two checkboxes above it, both ticked: **`Transfer price setting to order line`**
and **`Transfer pricing determination to o[rder line]`**. A purchase line's
pricing can be pushed onto the sales line it was bought for — the `For line`
column on the Lines grid is the link. We model neither.

### 🔴 Incoming stock is reserved before it arrives

The `Stock` panel's **`Purchase`** tab lists incoming supply for the article, and
our own line reads:

```
Qty(p) 100  ·  Qty(n) 100  ·  Qty(r) 90  ·  Qty Available 10
```

`Qty(r) + Qty Available = Qty(p)` on **4 of 4** rows where all three are legible
(100 = 90+10, 15 = 15+0, 15 = 5+10, 25 = 14+11). So 90 of 100 pieces are spoken
for **before the lorry leaves the mill**.

⚠️ **Do not yet conclude this is a reservation record.** The Lines grid carries a
**`For line`** column — a purchase line can be raised *for* a named sales line —
so `Qty(r)` may be derived from those links rather than stored. Either way it
matters, because `Reservations.stockUuid` is **`notNull`**: whichever mechanism
this is, our schema cannot express a hold on goods that have no lot yet. Settle
it in H7 by right-clicking an incoming row.

### The `Previous orders` panel — a buyer's price history we do not have

Six prior purchase lines for the same product, with `Qty`, `Dimensions`,
`Weight`, `Gross price`, `Amount`, `Net price`, `Group discount`, `Line discount`
and **`Days in system`**:

```
401134/10  100 ST  10 598 kg  € 2.000,00  € 21.196,00   89 days
401129/10   10 ST   1 059,8   € 2.000,00  €  2.119,60  112
400901/20   25 ST   2 649,4   € 2.450,00  €  6.491,00  516
400656/80   29 ST   3 073,4   € 2.460,00  €  7.560,56  553
400590/40   56 ST   5 934,8   € 2.470,00  € 14.703,91  559
400526/20   27 ST   2 861,4   € 2.470,00  €  7.086,43  566
```

The price is visibly falling, 2 470 → 2 000, which is the panel's whole purpose:
the buyer sees what was last paid. Nothing in `apps/dashboard` shows it.

⚠️ Four of the six reconcile exactly (`weight ÷ 1000 × net price = amount`). Two
do not — `400590/40` is out by € 45 and `400526/20` by € 19, both in the
direction of a heavier piece (106,3 kg rather than 105,98). The **`Weight` column
is recalculated at today's product weight while `Amount` is historical.** Do not
use this panel to prove the amount formula; use the live line, which is exact.

### `nvt` is a sentinel in the `Charge` column

Six of the article's stock rows read `Charge` = **`nvt`** — *niet van
toepassing*, not applicable — all of them sourced from Holland Stainless or
`Hego Voorraad`. It is not a heat number. Add it to the sentinel list beside the
others; a naive import would file it as one.

The same panel shows the four identifiers side by side and filled, which confirms
the six-field model already in `db/schema/stock.ts`:

```
Charge          nvt · 444093 · 929310 · C34AW2402…     the mill's heat
Internal charge 25AAEO · 25ACLQ · 23FBHI · 25ADCT      ours: 2 digits + 4 letters
Internal batch  385325 · 388417 · 389247 · 386078      ours: a six-digit series
Batch           4236-24 · D9652 · 31968 · EC240800150049
```

### Two smaller confirmations

- **`Stock` rows name `Swedinox` as supplier with purchase order `IO100069`** — a
  `1xxxxx` *sales* number in the `Purchase order` column. Internal affiliate
  transfers land as stock with a sales-order origin, as
  [stock-mutations.md](stock-mutations.md) inferred.
- **`Text lines`** on the order: category `InkoopOrder`, text *"Please note that
  this position was changed"*. Texts attach to a purchase order by category,
  exactly as the Texts screen models it.
- **A concurrency warning exists.** The header banner reads *"INAD
  (040-2438407) is doing the same thing."* The reference tells you when another
  user has the same record open — which is what `db/schema/work-panel-locks.ts`
  was built from, now seen working.

---

## ✅ H1.2 — watched live, 21-9-2026. **Reporting the work order creates the stock**

The other half of H1, on the same order `401141` / work order `306675`. Five
screens of the ladder, the report dialog itself, and the resulting lots exported
(`Srock on location for the TEST-H1.xlsx`, 25 × 54).

**The question the whole project hung on is answered.**

```
Release order        → nothing
Pre-notify           → reception exists, Kg(a) 0            no stock
Release work order   → stock labels print (a PDF)           no stock
Report completion    → ███ FIVE STOCK LOTS EXIST ███
(Approve)            → happens by itself, nothing to press
```

**No invoice anywhere in the chain.** `purchase-invoices/actions.ts` creating a
lot of its own is a duplicate, and this is the proof.

### The ladder is enforced, and reporting self-approves

At `New` the only live button is `Release`. `To prepare`, `Report completion…`,
`Approve` and `Package` are all greyed. After `Release` the row reads `Released`
and `Report completion…` wakes up. After reporting, the row reads **`Approved`
without `Approve` ever being pressed.**

That is exactly what `lib/enums.ts` already says of `workOrderStatuses` — *"a
warehouse order lands straight on `approved` when it is reported, because there
is nothing to check"* — now watched rather than inferred. The toolbar also only
wakes for the **leaf** row; selecting the date or type grouping row leaves
everything greyed.

`Release` prints the **stock labels** with no dialog and no questions — it offers
to save the print as a PDF because there is no printer. A second button,
`Vrijgeven zonder voorraadlabels`, releases *without* them. So releasing is
purely "freeze it and print the paperwork".

### 🔴 The report dialog splits one receipt into bundles, pre-allocated to sales lines

`Report completion of unloading workorder 306675/1, 100 ST Cold-rolled plate 304L
3000x1500x3mm`. Fifteen columns — `For order line · Qty ST · Length · Width ·
Thickness · Weight · Gross weight · Weight claimed · Meters · To · Internal
charge · Internal batch · Charge · Side · Factory number` — and **ten rows
already filled in**:

| For order line | Qty | Weight | Meters | To | Internal charge | Charge |
|---|---|---|---|---|---|---|
| `O10217…` | 20 | 2 119,5 | 60 | `Ontvangst` | `26ADRC` | ‹empty› |
| `O10217…` | 25 | 2 649,4 | 75 | `Ontvangst` | `26ADRC` | ‹empty› |
| `O10217…` | 20 | 2 119,5 | 60 | `Ontvangst` | `26ADRC` | ‹empty› |
| `O10217…` | 25 | 2 649,4 | 75 | `Ontvangst` | `26ADRC` | ‹empty› |
| ‹none› | 10 | 1 060,2 | 30 | `Ontvangst` | `26ADRC` | ‹empty› |
| ‹5 spare rows› | | | | `Ontvangst` | `26ADRC` | |

**20 + 25 + 20 + 25 = 90 committed, 10 free.** That is the `Qty(r)` 90 /
`Available` 10 read off the purchase order's own Stock panel in H1.1, and it is
now explained: the reference decides *before the lorry arrives* which bundles
belong to which customer, and the reporting dialog hands the warehouseman that
allocation to confirm. **One receipt becomes as many lots as there are bundles.**

`New` is greyed and `Delete` is not: you work inside the ten rows offered, you do
not invent them.

### 🔴 The rule that stops metal becoming stock: every bundle needs a charge

`OK` stayed greyed through all of this — a charge on one row, ticking rows,
committing cells. It went live at exactly the moment **all five rows carrying a
quantity had a `Charge`**.

> **A heat number per bundle is mandatory before goods may become stock.**

This is the hardest validation rule found anywhere in the reference so far, and
nothing in our code enforces anything like it.

⚠️ **`By:` is empty and has no options.** It is not what blocks `OK`. No
warehouse staff exist as selectable resources, which is a fourth independent
confirmation that `Resource` is one of the unused features (K3).

### The `To` cell is a location *search*, not a dropdown

Clicking it opens a **`Location search`** window with two tabs. `Search` takes
text and lists matches; **`Warehouse`** browses a tree:

```
00 Hego Almere
 ├ 01 … 12                 numbered sections
 │  └ 1A                   subsection
 │     └ 1A-1 … 1A-10      bins (several expand again)
 │     └ BNL
 ├ Consignatie
 ├ Extern
 └ Intern
Antwerpen
```

**Four levels at least**, with `Consignatie` / `Extern` / `Intern` sitting
alongside the numbered sections rather than being a flag on a location. The other
entries in the root list (`below`, `new`, `next`, `wearhouse 1`, `zakaria 2`, …)
are test data.

### ✅ The five lots, read out of the export

| Stock | Reserved | Available | Kg | Location | Charge | Internal charge | `Bundle` |
|---|---|---|---|---|---|---|---|
| 20 | **20** | 0 | 2 119,500 | `Ontvangst` | `TEST-H1` | `26ADRC` | **389823** |
| 25 | **25** | 0 | 2 649,375 | `Ontvangst` | `TEST-H1` | `26ADRC` | **389824** |
| 20 | **20** | 0 | 2 119,500 | `Ontvangst` | `TEST-H1` | `26ADRC` | **389825** |
| 25 | **25** | 0 | 2 649,375 | `Ontvangst` | `TEST-H1` | `26ADRC` | **389826** |
| 10 | 0 | **10** | 1 059,750 | `Ontvangst` | `TEST-H1` | `26ADRC` | **389827** |

100 pieces, **10 597,5 kg**, 90 reserved and 10 free — the allocation carried
straight through from the dialog. `Purchase order` = `IO401141`, `Supplier` =
Holland Stainless Int, `Receipt date` = **21-9-2026** (the day it was *reported*,
not the order's 6-8-2026 delivery date), `Created on` 16:40 the same minute.

Four things this settles:

1. 🔴 **`Internal charge` identifies the receipt, not the lot.** `26ADRC` is on
   **all five**. It is assigned by the system — it was already in the dialog
   before anything was typed — and its format is `YY` + four letters (`26` =
   2026, matching `25AAEO`, `23FBHI`, `25ADCT` on older lots).
2. 🔴 **The per-lot identifier is the six-digit running number**: 389823 → 389827,
   consecutive, one per bundle.
3. **`Charge` is typed by a person**, off the certificate. The system never
   invents one.
4. **`Ontvangst` has location type `Pick`, and `Blocked` is `False`.** Goods-in
   is an ordinary pick location, not a special holding state.

### ⚠️ A naming trap between the export and the panels

The two disagree, and getting it backwards inverts two columns:

| Export column | Panel column | Example | Our field |
|---|---|---|---|
| **`Bundle`** | **`Internal batch`** | `389823` · `385325` | `Stock.internalBatch` |
| *(absent)* | `Batch` | `4236-24` · `D9652` | `Stock.bundle` |

Proved on one row that appears in both: internal charge `25AAEO` reads `Bundle`
`385325` in this export and `Internal batch` `385325` / `Batch` `4236-24` on the
order's Stock panel. **The export's `Bundle` is the panel's `Internal batch`.**
Our schema follows the panels; any importer reading this export must map
`Bundle` → `internalBatch`, never → `bundle`.

### 🔴 A lot is valued at the product's price, not the order's

`Valuation price` = **2 058,8151** on all five lots, and `Stock (€)` reconciles
exactly as `kg ÷ 1000 × valuation price` (4 363,66 ÷ 2,1195 = 2 058,8158 ✓, three
lots checked).

But the purchase line was bought at **€ 2 000,00 / TN**. The lot is *not* valued
at what was paid for it. The same 2 058,8151 appears on the lots from purchase
order `IO400803` back in April 2025, so it is the **product's** carried price —
FSP — applied on receipt. The purchase price goes somewhere else.

**Nothing in our receipt path does this.** It is the bridge between goods-in and
the two revaluation GL accounts, and it had never been seen happening.

### ⚠️ The dialog balances the last bundle; stock does not keep the balanced figure

The dialog's five weights are 2 119,5 + 2 649,4 + 2 119,5 + 2 649,4 + **1 060,2**
= **10 598**, the order line's rounded `Kg(p)` exactly. The last bundle is the
balancing figure.

The lots stored 1 059,75 for that bundle — the theoretical 10 × 105,975 — so
total stock is **10 597,5**, half a kilo under the order. **The balancing number
is shown and then discarded.** Do not reproduce the dialog's arithmetic as if it
were stored.

---

## What is still not answered

- **Was work order `306675` raised by the `Workorder` button, or automatically
  by `Confirm` / `Pre-notifiy`?** The reception status already reads
  `workorders_created`, so it happened — but not which press did it. The only
  gap left in H1.
- **The work order line read `Qty(p)` 10 / `Kg(p)` 1 060,2 after reporting**,
  down from 100 / 10 598, and did not gain child rows. Where the other 90 went
  on that grid is unexplained; the stock is correct either way.
- **What decided the 20/25/20/25/10 split**, and whether a warehouseman may
  change it. The dialog offered it pre-filled and it was accepted unchanged.
- **The reception → work order join was never shown directly.** Pressing
  `Warehouse workorders` from the Receipts grid opens the work order screen on
  its _own_ default filter (`Workorder date` today → today), so it ignored the
  selected row. The chain above is assembled from both ends plus matching
  weights, not from the reference performing the join.
- **`Sheet number` / `Plaatnummer` was blank everywhere it appeared**, so its
  format is unknown.
- **`Internal Bundle` (`389755`) vs `Bundle` vs `Internal batch`** — three
  bundle-ish fields across the work order and the lot, and no row yet has more
  than one of them filled.
