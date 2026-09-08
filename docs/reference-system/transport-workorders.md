# Transport work orders

Reached with the `Transport workorders` button, which sits beside
`Warehouse workorders` on most screens. Ours: `/transport-workorders`.

The transport plan: which lorry goes where, on which day, carrying what.

**Toolbar**: Select All · Details · Loading preparation list ·
Provisional Trip list · Bill of lading ×2 · `GR` · Show CMR | Purchase lines
**Controls**: `View` · `Go To` · an `Order` selector · three layout buttons ·
`Cancel` · sort · **`Release`** · `1 2 3` · `Period` · `Status` · a filter funnel

## 🔑 Inbound goods are collected by a transport work order

This is the piece the receipt chain was missing.

The tree's `Action` column takes two values:

| Action | Direction | Against |
|---|---|---|
| **`Pick-up`** | inbound | a **purchase** order |
| **`Deliver`** | outbound | a sales order |

And the detail panel underneath, on its `Order` tab, shows a *purchase* order
behind a `Pick-up` line:

```
Purchase order:  401059 HW-Inox GmbH
Status:          Partially received
Delivery date:   30-7-2025
Purchaser:       André van der Veen
Contact person:  C. Ontact Person
```

So a purchase order that is `Partially received` has its outstanding line
sitting in the transport plan as a **pick-up**. Goods do not simply appear at
the door; a trip is planned to fetch them.

The panel has four tabs — `Stock` · `Order` · `Options` · `Texts` — so a
transport line reaches back to the lot, the document, the processing options
and its free text.

## The tree

Three levels, headed `Rit / Bestemming / Regel` — *trip / destination / line*:

```
INOX TRANSPORT sp. z o.o.  26-5-2026 07:00        ← trip: carrier + departure
 └ Holland Dak Accessoires B.V. 2031 BT HAARLEM   ← destination
    └ 10 Cold-rolled plate 304L 3000x1500x2mm     ← line
```

Trips seen: `AFHAAL` (*collection*) · `ADO NL` · `CUVELJE` · `ERC` ·
`FERCAM AUSTRIA` · `INOX TRANSPORT sp. z o.o.` · `JONKER DE` · `LANKVELD` ·
`INCIDENTEEL` (*ad hoc*) · `VERVALLEN ORDERS` (*expired orders*).

`CUVELJE` is also a stock location — the one with a saved view and no stock in
it. It is a carrier, which is why the location is always empty.

## Two views, two jobs

| View | For | What it adds |
|---|---|---|
| `Ingepland` (*scheduled*) | planning | a `Release` action, `Status = Scheduled` |
| `Laden` (*loading*) | the yard | **`Approve loaded`**, then **`Trip Departed`** |

## The trip lifecycle

Read off the `Status` column in the `Laden` view:

```
Loading list → Loading document → Partially loaded → Loaded → (Trip Departed)
```

`Source Status` is a **second, independent** status: the document behind the
line — `Ready`, `Released`, `In progress`. So a line has its own transport
state and inherits its order's state, the same split as `Line status` versus
`Receipt status` on [Purchase receivals](purchase/purchase-receivals.md).

## `Loading location` ties back to stock

The `Loading L…` column reads **`Laad`** on a delivery and **`Bewerkers`** on
lines going out for processing. Both are real
[stock locations](stock-on-location.md): `Laad` is the despatch staging area
and `Bewerkers` is the external processors. So planning a trip *moves the lot
to a location*, which is why those locations exist and why `Bewerkers` lots are
blocked.

## 🔑 Planned against ready — the weighed weight again

Expanding a trip shows a two-sided panel: **`Planned`** and
**`Ready for transport`**, each with `Qty` · `U.` · `Kg`.

| Order | Item | Planned kg | Ready kg |
|---|---|---|---|
| 101811 | 40 Aluminium coils A1050 3mm | **305** | **316** |
| 101885 | 10 Coil Cold-rolled 304L 0,5 mm | 212 | 212 |
| 101885 | 20 Coil Cold-rolled 441 3 mm | 690 | 690 |

The first line's planned and ready weights differ by 11 kg on 9 coils. That is
the same split the purchase order's printed terms describe — theoretical weight
to plan on, weighed weight to bill on — showing up a third time, now in
transport. Coils are weighed; plate cut to a fixed size is not.

`Length` reads `999999` on every coil: the sentinel again.

## What this changes for us

Our model has goods appearing when the purchase invoice is posted. The
reference plans a **pick-up**, moves the lot to a location, weighs it, and only
then has something to invoice. See
[IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) §1 — this is the strongest
evidence yet that the receipt chain runs through work orders rather than
through the invoice.

## 🔴 What is still needed

1. **What `Release` does** in the `Ingepland` view, and what `Approve loaded`
   and `Trip Departed` do in `Laden` — the three actions that walk the
   lifecycle.
2. **`GR`** — a toolbar button whose two letters are unexplained. Goods
   received?
3. **`Loading preparation list`, `Provisional Trip list`, `Bill of lading`,
   `Show CMR`** — four documents, none opened. A CMR is the international
   consignment note, so at least one of these is a printed transport document.
4. **Whether a `Pick-up` line completing is what fills a reception's `Kg(a)`**
   — the question the whole receipt chain hangs on.
