# Purchase quotes

`Overviews → Purchase → Purchase quotes`. Ours: `/purchase-quotes`.

Every line of every quote asked of a supplier. One row per quote line, not per
quote — `Line` is a column and the header fields repeat down the group.

**Filters**: `Quote date` (from / to), `Show Data`.
**Toolbar**: Save as Excel · Show in Excel · Print · Show Product ·
Show Company · Show… · Purchase lines · Warehouse workorders ·
Production workorders.
**View open when captured**: none selected (blank).
**Grid was empty**, so no example values were readable.

## Columns — captured, not yet matched

| # | Reference heading | Notes |
|---|---|---|
| 1 | Supplier | grid was sorted on this |
| 2 | Quote date | |
| 3 | Valid u/i | "valid until" — `u/i` is this system's "to" throughout |
| 4 | Quote nr. supplier | the supplier's own reference for their quote |
| 5 | Purchase quote | tooltip confirmed — our quote number |
| 6 | Line | |
| 7 | Status | |
| 8 | Expiration reason | why a quote lapsed |
| 9 | Revenue group number | |
| 10 | Revenue group | |
| 11 | Product code | |
| 12 | Product description | note: `Product description` here, `Description` on order advice |
| 13 | Length | **no (mm) suffix** |
| 14 | Width | **no (mm) suffix** |
| 15 | Quantity | |
| 16 | QtyU | the quantity's unit, as a column |
| 17 | Kg | |
| 18 | Net price | |
| 19 | PriceU | the price's unit, as a column |
| 20 | Amount | |
| 21 | Company code | |
| 22 | Internal Text | |
| 23 | Consignation | tooltip confirmed — likely a checkbox |
| 24 | Initials purchaser | tooltip confirmed |
| 25 | Purchaser | |
| 26 | Onze referentie | **untranslated Dutch** — "our reference" |
| 27 | Purchase Reference | tooltip confirmed |

## 🔴 What is needed before this can be built

**1. `Expiration reason` — what are its values?**
This is almost certainly an enum we do not have, and by our own rule an enum has
to decide something rather than just be stored and labelled. Knowing the values
will say whether it drives anything (re-quote, blacklist a supplier) or is purely
a note.
→ *In the old system:* find a lapsed quote and open its `Expiration reason`
dropdown to list every option. Then group the grid by the column to see which
are actually used.

**2. `Status` — what are its values?**
→ *In the old system:* drag the `Status` header into the group bar to see every
distinct value with counts.

**3. Three reference fields, and it is not clear which is which.**
`Quote nr. supplier` (theirs), `Onze referentie` (ours), and
`Purchase Reference` (?). Two "our reference" fields is odd — one may be the
order this quote was raised for.
→ *In the old system:* open a quote with all three filled and read them against
its header. If `Purchase Reference` matches a purchase order number, it is a
link, not a free-text reference.

**4. `Revenue group` on a purchase quote.**
Revenue groups are a sales/finance concept in every other screen captured. On a
quote it is presumably the group the bought material will eventually sell under,
used to report purchases against sales by group — which the Finance overviews do
(`Purchases and sales per revenue group`).
→ *In the old system:* open a quote line and see whether the revenue group is
editable there or comes from the product.

**5. `Consignation` — the same concept as our `Stock.ownerCompanyUuid`?**
Ours marks consignment stock by whose it is. If this is just a flag on the quote
line, we need to know what it changes — consignment goods are normally not
valued as our stock until drawn.
→ *In the old system:* find a quote with it ticked and follow it through to the
purchase order and the receipt. If the received lot is excluded from stock value,
it is the same concept.

**6. `Initials purchaser` alongside `Purchaser`.**
Two representations of the same person, or two different people (who asked vs.
who is responsible)?
→ *In the old system:* find a row where they disagree. If none does, it is a
display convenience and we store one field.

**7. `Company code` — whose?**
Every other screen names the counterparty `Supplier`. A separate company code
suggests either the supplier's account number or the buying entity (the status
bar shows a `Vestiging` / branch — `HEGO TEST Stainless Steel Aluminium`), which
would make it a multi-branch field we do not model.
→ *In the old system:* compare `Company code` against the supplier on the same
row. If it matches the supplier's number, it is the supplier; if it is constant
down the whole grid, it is the branch.

**8. `Length` and `Width` carry no unit here** where purchase lines has `(mm)`.
Assume millimetres unless the values say otherwise.

**9. Translate `Onze referentie`.**
Our UI is English throughout, so this becomes "Our reference". Same string
appears on the sales order header, so translate it once and consistently.
