# An order from entry to the loading bay — watched live

**Flows H2 and H5 of [FLOWS.md](FLOWS.md), captured 21-9-2026** on sales order
**`102191`**, H. Schrijver Construktiebedrijf B.V., one line of
`PK304L300315`, 5 ST at 3000 mm.

It is the first sales document anybody has watched being made. What it changes in
the code is in
[PLANNED-CODE-CHANGES-6.md](PLANNED-CODE-CHANGES-6.md); this file is the evidence.

> **It ran straight into the receipt.** The picking work order drew from
> `Ontvangst` — the goods-in location where the five lots from
> [receipt-chain.md](receipt-chain.md) §H1.2 had landed ninety minutes earlier.
> Purchase and sales met on the same metal on the same afternoon.

---

## 1. The sequence, as it happened

```
Bestand → Nieuw → Order            empty form
  customer 13000                   contact, delivery terms, delivery address,
                                   weight type and payment terms all fill
  Bewaar                           → order 102191, status Provisional
  Order lines → New                → a STOCK SEARCH window opens, not a product list
  Use selected product             → line 10, Type Stk, Qty 0
  Qty(p) = 5, Bewaar               → ⚠ "profit margin is lower than the minimum"
                                   → order saves as Provisional, BLOCKED
  Finances → untick Financial blockage, Bewaar
                                   → block gone, survives close + reopen
  Net Price = 2500, Bewaar         → revenue 1 350,00 · profit 259,09 · 19,2 %
  Make final                       → ORDERBEVESTIGING printed
                                   → Send dialog (Don't send)
                                   → status Vrijgegeven, Printed
                                   → warehouse workorder 306697 (Picking)
                                   → transport workorder (Deliver)
  Workorder 306697 → Release       → PickOrderLandscape printed
  Report completion → OK           → status Approved, no Approve pressed
                                   → 5 pieces at Laad, reserved
```

Eight saves, two printed documents, three work orders, one block lifted.

---

## 2. Entering a line opens a stock search

Pressing `New` on `Order lines` does **not** give a product dropdown. It opens a
window titled `Stock`:

- **Filters:** product code, search code, company, product group, quality,
  processes
- **Dimensions:** length / width / thickness `From` and `Until and incl.`, each
  with a **`Search with margin` of 5 %**
- `Only products with available stock` ✓ · `1e keus` ☐ · `2e keus` ☐
- **Upper grid — product/quality variants.** For `PK304L300315`:

  | Quality | Stk. cat. | Options | Technical | Reserved | Available |
  |---|---|---|---|---|---|
  | 304L2B | | | 96 ST | 24 ST | 72 ST |
  | 304L | | | 157 ST | **90 ST** | 67 ST |
  | 304L2B | | Laser F… | 3 ST | 0 | 3 ST |
  | 304L2B | 2nd ch… | | 4 ST | 0 | 4 ST |

- **Lower grid — individual lots**, with `APP`, purchase price, internal batch,
  remarks and an `Unopened` tick. **Rows in red are the ones with nothing
  available.**
- **Three tabs: `Stock` · `Purchase` · `Internal production`**
- Two buttons: **`Use selected product`** (takes the variant, line stays
  unallocated) and **`Use selected stock`** (binds the line to a lot).

🔴 **The `Purchase` tab is how goods are sold before they arrive.** The `90 ST`
reserved on the `304L` row is the same 90 that purchase order `401141` carried on
its own Stock panel before the lorry left, and the same 20/25/20/25 the receipt
dialog then pre-allocated.

`Use selected product` was pressed here, so line 10 reserves nothing.

---

## 3. Two weights, and the customer is billed on the larger one

| | Value |
|---|---|
| `Total weight` (trade) | **540 Kg** |
| `Theor. wt.` | **529,9 Kg** |
| Revenue | 540 ÷ 1000 × € 2 500 = **€ 1 350,00** |
| Costs | 529,88 ÷ 1000 × € 2 058,8151 = **€ 1 090,91** |
| Profit | **€ 259,09** — 19,2 % |
| `Avg. kilo price` | 1 350 ÷ **540** = **€ 2,50** |
| VAT 21 % | € 283,50 → incl. **€ 1 633,50** |

The order type is `Trade weight`, inherited from the customer. **The printed
confirmation shows `540 KG`**, so the customer is billed on it.

Per piece that is **108,0 kg** against a theoretical **105,975** — a ratio of
1,0191, which is not a round uplift and whose source is not on this screen.

---

## 4. The block, and lifting it

Saving with a below-minimum margin produced a warning, and the order came back
**`Provisional, Blocked`**. The two are unrelated:

```
⚠ "Line 10: The profit margin is lower than the minimum profit margin
   for this product."            → ticks `Profit too low` on the line. Nothing else.

Finances panel:
   Financial blockage  ☑    Blocking reason: Post(s) outstanding for too long  (DISABLED)
   Invoice blockage    ☐    Payment terms:   Within 30 days from date of invoice
```

The block is the **overdue-debt** rule — the one whose day threshold is still
K1, the last hardcoded guess in our code.

**Unticking `Financial blockage` lifts it.** No confirmation, no reason asked,
no second field; `Blocking reason` clears to `-empty-` and the title stops
saying `Blocked`. **It survived closing and reopening the order.**

⚠️ The batch scheduler is off on this system, so whether a scheduled re-check
would re-apply the hold is untested.

That is the whole unblock mechanism, and it explains why 63 releases in the
reference's own export carry nothing but the vendor's login name: there is
nothing else to record.

---

## 5. `Make final` — one button, four consequences

**A document.** An `ORDERBEVESTIGING`, full letterhead, both references, a
grouped line table (`Lev. datum · Rgl · Aantal · Omschrijving · Afm. (mm) ·
Hoeveelh. · Prijs · Korting · Per · Bedrag`), delivery and payment conditions,
terms text, bank footer.

🔴 Its footer reads *"Deze Vordering is verkocht en gecedeerd aan **Boozt24
Finance B.V.** Bevrijdende betaling kan uitsluitend plaatsvinden aan Boozt24
Finance B.V."* — **the receivables are factored.** Payment discharges only to the
factor. Nothing in this project has accounted for that.

**A send dialog.** `Don't send` (default) / `Immediately send the following`,
with three channels: **e-mail** to the contact, **fax**, and **Staalweb**.

**A status change.** Order → `Vrijgegeven, Printed` (`Vrijgegeven` untranslated),
line → `Released`. The toolbar loses `Make final` and gains `Workorder`,
`Optimize`, `Invoice` and `Options…`.

**Two work orders, created automatically:**

| Stream | What |
|---|---|
| Warehouse | **`306697`**, Type `Picking`, `From Ontvangst` → `To Laad`, 5 ST / **540 kg**, `New` |
| Transport | Direction **`Deliver`**, delivery date 23-09-2026, `Trip` and `Bill of lading` **empty**, `New` |
| Production | none — nothing needs cutting |

The picking order carries the **trade** weight, not the theoretical.

---

## 6. Picking is the mirror of unloading

`Release` printed a **`PickOrderLandscape`** with no dialog. `Report completion`
then opened a grid that is the unloading dialog turned around:

| | Unloading (goods in) | Picking (goods out) |
|---|---|---|
| Rows are | bundles you **declare** | lots you **consume** |
| `Charge` | **typed by hand, mandatory** | **pre-filled** from the lot |
| Destination | `To` on **every row** | one **`To Location`** for the whole report |
| Extra column | `For order line` | `From location` |

The `Charge` cell opens a lot picker, filtered `Location = Ontvangst`, listing
every lot there:

| Location | Internal charge | Charge | Purchase order | Receipt date | Available | Interne partij |
|---|---|---|---|---|---|---|
| Ontvangst | 26ADRC | TEST-H1 | IO401141 | 21-9-2026 | 20 | 389825 |
| Ontvangst | 26ADRC | TEST-H1 | IO401141 | 21-9-2026 | **10** | **389827** ← default |
| Ontvangst | 26ADRC | TEST-H1 | IO401141 | 21-9-2026 | 20 | 389823 |
| Ontvangst | 26ADRC | TEST-H1 | IO401141 | 21-9-2026 | 25 | 389826 |
| Ontvangst | 26ADRC | TEST-H1 | IO401141 | 21-9-2026 | 25 | 389824 |

🔴 **It defaulted to the one lot not promised to another customer.** The system
suggests free metal; a picker may override. The column name `Interne partij`
settles that the six-digit number is the lot's own identifier.

Reporting **self-approved**, exactly as the unloading did.

---

## 7. What the stock did — and the one thing that does not add up

Two exports of `Stock on location` for `PK304L300315`, before and after:

| Lot | Location | Before | After |
|---|---|---|---|
| 389823 | Ontvangst | 20, res 20 | 20, res 20 |
| 389824 | Ontvangst | 25, res 25 | 25, res 25 |
| **389825** | Ontvangst | 20, res 20 | **15, res 15** |
| 389826 | Ontvangst | 25, res 25 | 25, res 25 |
| **389827** | Ontvangst | 10, res 0 | **10, res 5**, available 5 |
| **389827** | **Laad** | — | **5, res 5, 529,875 kg** ← new |

**Totals conserve exactly: 100 pieces and 10 597,5 kg before and after.**

But the five pieces came off **`389825`**, while the parcel that landed at `Laad`
is labelled **`389827`** — and `389827` at `Ontvangst` did not shrink at all; it
gained a reservation of 5.

✅ **RESOLVED 30-9-2026** — see [picking-flow.md](picking-flow.md#6). Reproduced
deliberately: a bundle number is a **printed label, not an identity**, and two
lots that a shelf cannot tell apart are interchangeable to the system. The
original note is kept below as it was written.

🔴 **This was unresolved and was not guessed at.** Either the six-digit
number is a reusable bundle label rather than a lot identity, or the pick debited
a different lot than it displayed. It is **O2** in
[PLANNED-CODE-CHANGES-6.md](PLANNED-CODE-CHANGES-6.md).

Two things that *are* clean: the moved parcel weighs **529,875 kg** — the
theoretical weight, while the customer is billed on 540 — and everything at a
`Laad` location is fully reserved, as every earlier capture showed.

---

## 8. The move was not a stock mutation

`Stock mutations`, 21-9-2026 → 21-9-2026, returned **five rows** — all
`Ontvangst From supplier`, all work order `306675`, all at 16:40. **Nothing for
the picking.**

So the ledger books boundary crossings and not relocations. That squares with
4 189 customer deliveries being caused by a **trip** rather than a work order.

The five receipt rows, in full:

| Qty | Kg | Value | Internal bundle | M1 |
|---|---|---|---|---|
| 20 | 2 119,5 | € 4 239,00 | 389823 | 60 |
| 25 | 2 649,375 | € 5 298,75 | 389824 | 75 |
| 20 | 2 119,5 | € 4 239,00 | 389825 | 60 |
| 25 | 2 649,375 | € 5 298,75 | 389826 | 75 |
| 10 | 1 059,75 | € 2 119,50 | 389827 | 30 |

🔴 **€ 4 239,00 ÷ 2,1195 t = € 2 000,00/TN — the purchase price**, not the
€ 2 058,8151 the lots are valued at. The ledger records what was paid; the lot
carries the product's standard price.

Running balances close to the cent:

| | Start | Close | Change |
|---|---|---|---|
| Value | € 35 311,54 | € 56 506,54 | **+€ 21 195,00** |
| Weight | 16 955,982 | 27 553,482 | **+10 597,5 kg** |
| Pieces | 160 | 260 | **+100** |

€ 21 195,00 rather than the order's € 21 196,00: the ledger uses the true
10 597,5 kg, the order line its rounded 10 598.

Other columns now seen filled: `Mutation reason`, `Workorder#`, `Text`
(= `401141/10`, the purchase **line**), GL **`3000 Stock`**, revenue group
`SS 304` / `1000`, company `11692`, charge, internal charge, internal bundle,
and **three quantity columns** — pieces, kg and metres.

---

## 9. The pricing cascade is empty, and that is the answer

```
Base price          € 0,00     Line discount:      0 %   € 0,00
Quantity surcharge  € 0,00     Extra discount:     0 %   € 0,00
Color surcharge     € 0,00     Line discount tot.: 0 %   € 0,00
Lengtetoeslag       € 0,00     Group discount:     0 %   € 0,00
Gross Price         € 0,00     Net price:                € 0,00
```

— while the line itself was priced € 2 500,00 by hand.

**The panel shows a derivation, and a product with no price list derives
nothing.** Every `Pricing` panel captured on this project has read zeros and this
explains all of them at once. It also means **the discount cascade still cannot
be implemented from evidence**: it needs a product with a base price and a
customer with an agreement.

Above it, two ticks we do not model: **`Transfer price setting to order line`**
and **`Transfer pricing determination to order line`** — a purchase line's
pricing can be pushed onto the sales line it was bought for, which is what the
`For line` column links.

---

## 10. Four profit bases

```
CURRENT APP: € 2.058,82        Profit w.r.t. CURRENT APP: € -1.090,91

            Revenue   w.r.t. APP (€2.058,82)   w.r.t. FSP   w.r.t. Repl. price   w.r.t. LIP
Materials:   € 0,00        € -1.090,91          € 0,00          € 0,00             € 0,00
Options:     € 0,00             € 0,00          € 0,00          € 0,00             € 0,00
Total:       € 0,00        € -1.090,91          € 0,00          € 0,00             € 0,00
```

🔴 **APP is the price a lot is valued at.** € 2 058,82 is the same figure on all
five lots and in the stock picker's own `APP` column. So the carried price has a
name, it drives cost, and it is one of four bases profit is measured against.
FSP, Replacement price and LIP are unset on this product.

We compute two of the four.

---

## 11. Panels, fields and smaller findings

**Sixteen order-level panels** (right-click navigator): `Workorders · Order
lines · Competitors · Contracts · Invoice lines · Finances · Purchase lines ·
Complaints · Logistics · Remark · Return lines · Texts · Surcharges · Documents ·
Communication · PDF Documents`. We had twelve.

**Six line-level panels**, scoped to the selected line: `Revenue+Profit ·
Pricing · Stock · Stock other affiliates · Previous orders · Previous quotes`.

- `Competitors` — `Firm · Revenue share · Customer satisfaction · Remarks`
- `Contracts` counts **three** kinds: company, project, order
- `Previous orders` / `Previous quotes` — price history with `Days in system`
- `Logistics` header reads `The Netherlands`

**Header fields we do not have:** `Price date`, `Order category`, `Project`,
`Handling blocked`, `Klant materiaal`, `Consignment with a duration` (value +
unit), `Leave customer`.

**Print options on `Finances`:** `Show net price`, `Scrap surcharge separately`,
`Only total amount on invoice`, and **`Include option prices in material
prices`** — on by default, which bears directly on the C10 option-revenue split.

**`Transport costs` and `Handling costs`** sit on the order summary. That is
where a trip's cost lands, which had been an open question with no home.

**Confirmations:** `Must be sent` ✓ / `Deliberately not sent` ☐ / `Send` ☐ on a
fresh order — the B1 send rule, proved on a document we made ourselves. `M1` is
linear metres (5 × 3 m = 15). `Seller` (`Ayam`) and `Representative` (`Hego`)
are two different people.

---

## 12. Where it stopped

The metal is at `Laad`, reserved, with a **transport work order waiting for a
trip and a bill of lading**. That is the doorstep of **H6**, and the natural
place to pick the flow up.

Still unwatched on this order: the trip, the delivery note, the invoice
(**H3**), and the payment (**H4**).
