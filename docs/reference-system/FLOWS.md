# Part H — the twelve flows, the codes, and what each one changes

**Opened 21-9-2026.** This is the runsheet for the twelve write-flows of
[WHAT-IS-LEFT.md](WHAT-IS-LEFT.md) Part H. Everything else on that list is
*reading* the reference. This is the only part that needs somebody to **do**
something in it.

> 126 screens exist in `apps/dashboard` and **42 of them write**. Every one of
> those 42 was built from a grid export and a guess at the verb. The grid says
> what a record looks like when it is finished. It never says which click
> finished it.

**Status: waiting on screens.** The codes below were picked out of the exports so
the flows run on records that actually exist, in the state the flow needs.

> ⚠️ **The numbering here is the order the flows are being *done* in, and it is
> not [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md)'s.** That file numbered them as it found
> them. The two that differ so far:
>
> | Here | WHAT-IS-LEFT.md | Flow |
> |---|---|---|
> | H1 | H1 | a lorry arrives → stock |
> | **H2** | **H5** | order entry → delivery |
> | H3 | H6 | send an invoice |
> | H4 | H7 | take a payment |
> | **H5** | **H8** | block, then unblock |
> | H6 | H4 | plan a trip |
> | H7 | H2 | reserve by hand |
> | H8 | H3 | adjust a lot |
> | H9–H12 | H9–H12 | unchanged |
>
> Always say which file a number came from.

---

## ✅ Settled first — live is the same as test

**21-9-2026, answered by Swedinox:** the **live system is exactly the same as
`HEGO TEST`** — same ledger, same batch jobs.

That closes the last open qualifier on this project. Every finding taken off
`HEGO TEST` — ~130 000 exported rows, the AFAS sync, the eight batch jobs, the
security profiles, the frozen error log — now describes the **live** system too,
and no capture needs repeating against a second environment.

Three consequences, applied in [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md):

1. **K12 narrows.** The ledger is AFAS on live as well, so "replace or sync" is
   a pure business decision — not a question about which environment was seen.
2. **K10 sharpens.** `Batchscheduler is not active` had been explained away as an
   artefact of the test copy. It is not. It is the live configuration, and the
   overdue-posts rule really may be running on stale open posts.
3. **The error log is evidence about live.** Including that `INAD` is an
   interactive vendor login that has lifted 63 order blocks by hand.

---

## The records to use

Chosen from the exports so each flow starts from a record already in the right
state. Where a flow creates something, it is created against these.

| Thing | Code | Why this one |
|---|---|---|
| Customer | **`SCHRIJVER`** — H. Schrijver Construktiebedrijf B.V. | busiest customer in the file, 108 sales orders |
| Test customer | **`TESTBEDRIJF BV`** | already exists; `13765 shadi`, `13761 zakaria test`, `13760 Taym` are other test entries |
| Product | **`PK304L200315`** — Cold-rolled plate 304L, 3000 mm | 23 in stock at location `9B`, **0 reserved** — free to reserve, adjust and cut |
| Purchase order, unreceived | **`IO400118`** | `Released`, nothing received yet. Supplier `10627` Aperam Stainless Belgium NV |
| Purchase order, backup | **`IO400131`** | supplier `HOLLANDSTA` Holland Stainless Int |
| Purchase order, processing | **`IO400151`** | type = **`Processing`**, status `Provisional`, supplier `13660` Hego Production |
| Processors | `FOX SLIJP` · `FOX LASER` · `FOX KNIP` · `FOX DECOIL` · `EM STEEL` | the five in the company file |
| Transporter | `GEBA TRANS` | |
| Blocked order | **`O102167`** | debtor `11126` Dohmen en Vogten, `Credit limit exceeded` |
| Blocked order, changed | **`O102168`** | debtor `11132` Onnink — `Order changed?` = `True` |
| Trip | **`600249`** / bill of lading **`300813`** | the pair that has never been explained |
| Delivery waiting | order **`101974`**, 247 Watersnijden B.V. | |
| Invoice | **`501501`** (Coek Enginering NV, `10946`) | a `Surcharge` type |
| Credit invoice | **`501399`** (Valsteel, `13366`) | already a credit — shows the finished shape |
| Batch | charge **`70764 5`** / internal charge **`23EFFG`**, purchase order `100020` | |
| Certificate | purchase order **`IO400003`** line `10`, supplier `11338` Fisher Edelstaal, bill of lading `VZ-2500242` | |
| Complaint | **`K40055`** | already captured as a record ([complaints.md](complaints.md) §2) |
| Return order | **`R290000`** | first of the 43 in the `R29xxxx` series |

⚠️ **`Filename` is empty on every row of the batches export.** No batch in three
years has a certificate file attached by that column. H11 is the only way to
find out where the certificate actually goes.

---

## The twelve

Each section says what the flow settles, and **what changes in the code when the
screens land**. The "on arrival" list is the point of the exercise — if a flow
lands and nothing there moves, the flow was not worth asking for.

---

### ~~H1 · A lorry arrives → the goods become stock~~ ✅ **DONE 21-9-2026**

`IO400118` → `Workorder` button → warehouse work order → report actual kg →
`Approved` → the lot appears on `Stock on location`.

> 🟡 **H1.1 done, 21-9-2026, on purchase order `401141`** (not `400118` — a
> fresher test order) → [receipt-chain.md](receipt-chain.md) §H1.1, 13
> screenshots.
>
> **The reception and the warehouse work order both exist before anything is
> received, and no lot does.** Order `Released`, pre-notified, bill of lading
> `324234`, work order `306675` at `Unloading`/`New`, `To Ontvangst`, `Kg(a)` 0
> everywhere — and no stock. Order release, pre-notify and raising the work
> order are **all ruled out** as the moment stock is created, which leaves the
> reporting step and matches what our code already does.
>
> ✅ **H1.2 done the same day** → [receipt-chain.md](receipt-chain.md) §H1.2.
> **Reporting the work order creates the stock.** Five lots `389823`–`389827`,
> 100 pieces / 10 597,5 kg at `Ontvangst`, **90 of them arriving already
> reserved** to the sales lines the dialog had pre-allocated. Release prints
> labels and creates nothing; reporting self-approves without `Approve` ever
> being pressed. 🔴 **`OK` will not enable until every bundle carries a
> `Charge`.** 🔴 `Internal charge` names the **receipt** (one code, five lots,
> system-assigned); the six-digit number names the **lot**. 🔴 The lot is valued
> at the product's carried price, **not** the price paid.

**Settles:** which click creates the lot, and who assigns the charge number.
✅ **Both answered.**

The chain is already traced ([receipt-chain.md](receipt-chain.md)): purchase
order → reception → warehouse work order → stock lot, and the lot exists
**before** the invoice. What is unknown is the **moment** — is the lot born when
the work order is raised, or when it is approved? And does the receipt row
appear at the same click or a different one?

**On arrival:**

- `warehouse-work-orders/actions.ts` — the approve path already creates the lot. Confirm the moment, or move it. **Waiting on H1.2.**
- `purchase-invoices/actions.ts` — **delete its lot creation.** ✅ **H1.1 settles this on its own:** a complete receipt chain stands on `401141` with no invoice in it. The duplicate comes out and does not need H1.2.
- `purchase-receivals/actions.ts` — ✅ the reception is written **before** receipt, at pre-notify, carrying planned quantities and `Kg(a)` 0. `workorders_created` is a real status on it, already in our enum.
- `batches/` — ✅ charge and internal charge are **blank until the goods are booked in**, on both the reception and the work order. `Batch registration` on the Receipts toolbar is the attach path, which makes this the same panel as H11.
- `lib/enums.ts` — the work-order statuses in the order they really pass through. **Waiting on H1.2.**
- `reservations` — 🔴 **new, unplanned.** Incoming purchase quantity carries a reserved/available split (`Qty(r)` 90 + available 10 = 100) before a lot exists, and `Reservations.stockUuid` is `notNull`. Either that column becomes nullable or the split is derived from `For line`. Settle in H7.
- `purchase-orders/` — 🔴 **new.** A `Previous orders` panel: the last six purchase lines for the product with prices and `Days in system`. A buyer's price history we have nothing like.

---

### H2 · Order entry → delivery 🟡 **half done 21-9-2026**

New order for `SCHRIJVER`, one line of `PK304L200315`, 5 ST at 3000 mm, through
to delivered.

> 🟡 **Captured 21-9-2026 on order `102191`** → [order-to-delivery.md](order-to-delivery.md).
> Entry → priced → blocked → unblocked → `Make final` → picked to `Laad`.
> 🔴 **Revenue is billed on trade weight, cost taken on theoretical weight.**
> 🔴 Entering a line opens a **stock search** with three supply tabs, so goods can
> be sold before they arrive. 🔴 `Make final` prints the confirmation and creates
> the **warehouse and transport work orders** by itself.
> ⚠️ **The pricing cascade reads zeros because the product has no sales price** —
> that is the answer, not a failed capture, and the cascade still cannot be built
> from evidence.
> 🔴 **Still owed:** the trip, the delivery note, the invoice and the payment.

**Settles:** the sales status ladder, and **the discount cascade with real
numbers in it**.

Every `Pricing` panel captured so far reads zeros end to end
([order-detail.md](order-detail.md) Part 2). The build-up is known
structurally — base + quantity + colour + length surcharges → gross; line +
extra + group discounts → net — and **numerically unproved**. Five of those
columns do not exist on our order item at all.

**On arrival:**

- `db/schema/order-items.ts` — the five missing price build-up columns.
- `orders/actions.ts` — the cascade, in the reference's order of operations.
- `lib/helpers.ts` — the surcharge and discount helpers, currently inferred from line totals.
- `orders/validation.ts` — which fields the form demands at each stage.
- Whichever step reserves stock decides whether `reservations/` is written by the order or by the delivery.

---

### H3 · Send an invoice

The order from H2, delivered → invoiced → sent. Plus every panel of invoice
`501501`.

**Settles:** what stamps the print and mail timestamps, and whether the invoice
**snapshots** the address or reads it live.

`printedAt`, `mailedAt` and `mailedTo` were added to the invoice schema on the
strength of the grid columns. Nothing writes them.

**On arrival:**

- `invoices/actions.ts` — the send path, and the three timestamps.
- `db/schema/invoices.ts` — address snapshot columns **if** the reprint test shows the old address.
- `journal-entries/` — the posting, if the invoice is where it is decided. Bounded by K12.
- Closes **G2** as well.

---

### H4 · Take a payment

Invoice `501501`.

**Settles:** whether a payment can be entered in the reference at all.

The ledger is **AFAS**. Receivables and payments live there and come back
through the open-posts sync. If there is no payment entry on this screen, that
is the answer, and `payments/` should not grow a write path.

**On arrival:**

- `payments/` — built, or **deliberately left read-only** with the reason recorded.
- Feeds K12 directly.

---

### ~~H5 · Block, then unblock~~ ✅ **DONE 21-9-2026**

`O102167`, then `O102168`.

> ✅ **Answered 21-9-2026, on a block we caused ourselves** → [order-to-delivery.md](order-to-delivery.md) §4.
> Order `102191` saved itself `Provisional, Blocked` with reason
> **`Post(s) outstanding for too long`**. **Unticking `Financial blockage` lifts
> it** — no confirmation, no reason asked, the reason clears to `-empty-`, and it
> **survived a close and reopen**. `Blocking reason` is **disabled**: system-set,
> never chosen. 🔴 A second, independent **`Invoice blockage`** flag exists.
> ⚠️ The margin warning does **not** block — it only ticks `Profit too low`.
> ⚠️ The scheduler is off, so a scheduled re-check is untested.

**Settles:** how a hold is released, whether the release is recorded against a
person, and whether it **survives the next run of the check**. ✅ **All three.**

Three blocking rules are built. **No unblocking exists.** The unblocked-orders
export shows 571 releases, 63 of them by the vendor login `INAD`, so releasing
is ordinary daily work.

**On arrival:**

- `financially-blocked/actions.ts` — the release action.
- `db/schema/orders.ts` — who released, when, and why, if the dialog asks.
- `unblocked-orders/` — becomes a log of a real action instead of an import.
- If the release is permanent, blocking needs a manual-override flag the nightly check respects.

---

### H6 · Plan a trip

Deliveries waiting → trip → bill of lading. Order `101974`.

**Settles:** the relationship between a trip number and a bill-of-lading number,
and whether the reference **asks** for driver, km and cost.

Trip `600249` carries bill of lading `300813` and the pair is unexplained. A
customer delivery is caused by a trip in 4 189 cases against 854 by a work
order, so this is the main door metal leaves through — and our whole transport
side is read-only.

`Driver`, `Km`, `Hours` and the four cost columns are **empty on all 438 trips**
([trip-data.md](trip-data.md)). If the create dialog does not ask for them, they
are dead fields and K3 gains a ninth declined feature.

**On arrival:**

- `trip-data/actions.ts` — trip creation.
- `db/schema/` — a bill-of-lading record, if it is a document in its own right rather than a print of the trip.
- `deliveries-to-arrange/actions.ts` — the selection → trip hand-off.
- `transport-workorders/` — how the trip relates to the transport work order.

---

### H7 · Create a reservation by hand

`PK304L200315` at `9B` → right-click → `Toon reserveringen…` → `Order` button.

**Settles:** does creating a reservation make you pick a **specific lot**, or
just a product and a quantity?

Everything about reservations hangs on this. It is already proved that a
reservation **binds a lot** — the same product at another location opens an
empty panel ([reservations.md](reservations.md)) — but proving it from the
reading side does not say whether the **user** chooses the lot or the system
allocates it.

**On arrival:**

- `reservations/actions.ts` — create and delete, neither of which exists.
- If the system allocates: an allocation rule (FIFO? nearest? oldest charge?) that exists nowhere in our code.
- `stock-on-location` — `Reserved` and `Available` must move as a consequence, not be stored.

---

### H8 · Adjust a lot by hand

Product screen → `Correct products and stock`.

**Settles:** whether a correction demands a reason, and what mutation type it is
booked as.

**On arrival:**

- `stock-movements/actions.ts` — the correction path.
- `lib/enums.ts` — the mutation type for a manual correction.
- `db/schema/` — a reason column if the dialog asks for one.
- Also closes part of **J8**.

---

### H9 · External processing, out and back

`IO400151` — purchase order type `Processing`, processor `Hego Production`.

**Settles:** what marks a purchase order as processing rather than buying, and
**what blocks the lot** while it sits at the processor.

All 483 movements hang off an `IO4…` **purchase** order, never a sales order,
and land on GL `3100` ([external-processing.md](external-processing.md)). All 36
lots at processor locations are **blocked** and nothing in our code sets that.

**On arrival:**

- `purchase-orders/actions.ts` — the processing order type and its send-out.
- `control-stock-increase-external-processing/` — becomes a control list over real movements.
- `db/schema/` — whether blocked follows from location type (already believed) or is set explicitly by this flow.

---

### H10 · Report a saw cut

`PK304L200315`, 3000 mm → 1500 mm.

**Settles:** whether the kilo balance is **enforced**, and whether the remnant
keeps the original lot number or gets a new one.

The two report dialogs were modelled from a single screenshot
([warehouse-and-production-workorders.md](warehouse-and-production-workorders.md))
and have never been watched. The remnant's identity also answers **G9** —
whether an offcut traces back to the heat it was cut from.

**On arrival:**

- `production-workorders/actions.ts` — the two report steps.
- `control-sawing-waste/` — the loss it produces.
- `db/schema/` — remnant lineage, if the remnant is a new lot pointing at its parent.
- Sawing **planning** stays out of scope — proved unused three times over (K3).

---

### H11 · Link a certificate to a batch

Batch `70764 5` / `23EFFG` → right-click → `Show File`, and `Adjust charge…`.

**Settles:** is the certificate **stored in the system**, or is it a filename
pointing at a network folder?

Completely different builds. We have `certificates-received`,
`certificates-to-be-linked` and `sending-certificates` as lists, and no attach
path at all. A batch has **no record of its own** — the right-click menu is the
whole interface ([batch-registration.md](batch-registration.md) §11).

**On arrival:**

- `certificates-to-be-linked/actions.ts` — the link action.
- `lib/server/document-storage.ts` — if it is a real file it goes to R2 like every other document. If it is a path it is a string column and no upload exists.
- `batches/actions.ts` — `Adjust charge…`, never seen.

---

### H12 · Credit note / return

Complaint `K40055` → return order in the `R290000` shape → credit.

**Settles:** whether crediting **requires** the goods to come back.

One real complaint reads *"book the return, do not actually collect the goods,
credit it"* ([returns-and-complaints.md](returns-and-complaints.md)) — so a
paper-only reversal is possible and there must be a tick or an option for it.
A return is driven by a complaint first; `K4xxxx` is a sixth number series, and
**nothing in our app models a complaint's link to a return**.

**On arrival:**

- `return-orders/actions.ts` — creation from a complaint.
- `db/schema/` — the complaint → return link, and a **goods-not-returned** flag.
- `complaints/actions.ts` — raising the return from the complaint side.
- `invoices/` — the credit note, and whether it reuses the invoice series (`501399` suggests it does).
- Closes **G11**.

---

## What to do each time a flow arrives

1. **Write the capture up** — a new section in the matching doc under
   `docs/reference-system/`, not here. This file stays a runsheet.
2. **Tick the flow off in [WHAT-IS-LEFT.md](WHAT-IS-LEFT.md) Part H** with the
   date and the record number, the way Parts B, C and D were ticked.
3. **Make the code change named above**, as its own commit — one flow per
   commit, never a batch of them.
4. **Re-run the checks** if the flow touched money or kilos — the conservation
   identities, not expected values.
5. **Update the memory note** for that area (warehouse model, purchase model,
   logistics findings) only if the flow changed a *model* rather than a field.

---

## The two that block everything else

**H1**, because the warehouse write paths cannot be built until a lorry arriving
has been watched end to end, and `purchase-invoices/actions.ts` is creating a
duplicate lot in the meantime.

**H2**, because the discount cascade is the last unproved arithmetic on the
selling side, and single lines from single screenshots are exactly how the two
wrong conclusions in this project got made.
