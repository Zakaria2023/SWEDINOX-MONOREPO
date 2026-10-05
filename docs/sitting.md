Sitting 1 — One product record
Overviews → Stock → Stock on location → search PK304L200315 → select a row → Show Product.

On the Stock panel, select one lot, then press each button, photograph the dialog, and Cancel — do not press OK:

Reservations… → inside it, find New and press it → 📸 what it asks ← closes H2
Correction… → 📸 every field, and open its reason dropdown ← closes H3
Splits → 📸
Scrapping… → 📸
Transfering… → 📸
Relocating… → 📸
Opties bewerken → 📸
Then in the header, open the Price dropdown (it reads Algemeen) → 📸 the list.

Then open four more products — PK304L20021, PK316L40021, SC304, CK3040010 — and for each, scroll to Stock policy and photograph just the Use StockOp for this product? tickbox. Four small photos. ← closes J3, and deletes a whole screen from our build

All four, not three: they are a plate, a thicker plate, a kilo-stocked product and a coil, so if any product type uses StockOp one of those four will. SC304 is the only one not stocked in pieces, so it is the one most likely to differ.

Sitting 2 — Purchase orders
Overviews → Purchase → Purchase orders and quotes, creation date 1-1-2024 → today, press Show Data.

2a. Drag Order method into the grey bar → 📸. Then open any order whose method is not Telephone → Receipts → scroll right → 📸 the four EDI columns. ← closes O4

2b. ~~Purchase lines → find order 400650 → Show Purchase order → expand Pricing~~ ✅ **SKIP — already answered.** The Pricing panel was captured on 401156 and 401157, and the 94,2 → 100 kg question behind it is answered by the order's printed terms: only the weighed weight is accepted for invoicing. J2 is closed; this row was stale.

2c. Find order 401154 (consignment, Provisional) → press Make final → on the reception fill Kg(a) 314 and Qty(a) 10 → report it → then find that lot on Stock on location → 📸 its Stock (€) column. ← closes J1

2d. Purchase lines → find any line where Qty(a) is above 0 but below Qty(p) → Show Purchase order → Receipts → press Split → 📸. ← closes J4

2e. On a test order, press each and 📸 then cancel: Return · Par. return · Relocate · Workorder. ← closes J8

2f. Find a purchase order that is Released with no work order yet. Press Workorder → 📸 before and after. Then on a second such order press Confirm instead and 📸 whether a work order appears without you asking. ← closes O5

2g. Open IO404206 (open now — Processing, Hego Production, 24 pieces). 📸 its line, its Receipts, and expand all three Workorders sub-panels. ← closes H9

2h. Overviews → Batch registration → Batches → take a recent row → note its Internal charge → find that purchase order → Receipts → Batch registration → 📸 the dialog. ← closes H11

Sitting 3 — The trip
The only large unknown left.

Overviews → Logistics → Deliveries to be arranged without stock reservation, and also look for the plain deliveries-waiting screen. 📸 the Logistics menu open if you can't find it.

Take order 101974 → select it → whatever button creates a trip.

📸 the create dialog before you press OK — I specifically need to see whether it asks for driver, km, hours or cost. Then 📸 the trip that results, and 📸 the bill of lading.

Also open existing trip 600249 and 📸 every panel on it. ← closes H4

Sitting 4 — Read-only, no records touched
4a. Overviews → Logistics → Production workorders. Clear the product filter, date 1-1-2024 → today, Show Data. Drag Machine into the grey bar → 📸.

This one decides whether step H10 exists. If no saw appears in that list, the cutting is bought from Hego Production and we stop looking for a saw cut.

4b. Batch registration → Batches, same wide filter. Drag Mand. ign. doc. into the grey bar → 📸 the True/False counts. ← settles the certificate contradiction across all 2 910 rows

4c. Same grouping trick on three more: Purchase invoices → Status · Orders and quotes → Status · Purchase lines → Line type. 📸 each. ← closes J6

4d. Open and 📸 these dropdowns: Orders and quotes → Classification code · Company → Journal code · Net prices → Net priceU. ← closes J7

4e. Overviews → Logistics → Deviations in count lists. It has two date filters that AND together — widen one at a time, 1-1-2024 → today, and 📸 the filter block either way. ← closes I7

4f. Find warehouse work order 306675 and 📸 it as it stands now, including any child rows. ← O6 and O7

What I can't get from the system
Eleven questions need a person, not a screen, and no amount of clicking will produce them:

K1 — how many days overdue is "too long"? The setting is in no menu. It's a database query or Swedinox's administrator. This one is live in shipped code.
K2 — should customer-owned stock carry value? (€40 833 does today.)
K3 — do you want the eight features the reference ships and never uses?
K4–K13 — what FSP/LIP/Gip mean, whether purchase quotes are used, whether INAD is a person, whether the rebuild replaces AFAS or syncs with it.

---

## 🔴 Read this before using any record number below (added 5-10-2026)

**The record numbers in these sittings are stale.** They were taken from an
export of data frozen in **mid-May 2025**. The live system has moved on — a
`Purchase lines` load on 5-10-2026 returned orders `404133`–`404449` with
receipt dates in **October 2026**, and a numeric filter for `401154`–`401158`
returned **nothing**.

Confirmed missing so far: **`400650`**, **`401154`**.

**So every step must be driven by criteria, not by a number:**

| Instead of | Find it by |
|---|---|
| order `400650` (Pricing) | ✅ not needed — J2 is already answered |
| order `401154` (consignment) | `Purchase orders and quotes` → drag **`Consignment`** into the grouping bar → open the ticked group |
| a part-received line (Split) | `Purchase lines` → drag **`Status`** into the grouping bar → open **`Partially received`** |
| a released order with no work order (O5) | `Purchase lines` → group by `Status` → **`Released`**, then check its `Workorders` panel is empty |
| `IO404206` (external processing) | `Purchase orders and quotes` → group by **`Order type`** → open **`Processing`** (they are all to Hego Production) |

⚠️ Two more numbers are still unverified and may be gone the same way:
**`101974`** and trip **`600249`** in Sitting 3, and warehouse work order
**`306675`** in 4f. Check them before planning a sitting around them.

**Also: the `Find` box is not a filter.** It searches rows already loaded in the
grid. Nothing happens until `Toon Gegevens` has run, and
**`Only current purchasing lines` is ticked by default and hides closed orders.**
