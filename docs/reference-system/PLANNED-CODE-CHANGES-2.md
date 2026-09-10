# Planned code changes — round 2

✅ **All eight items are now applied.** Written 10-9-2026 as a plan while data
collection was still running, then worked through the same day.

Round 1 is [PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md). This is what the
Sales and Finance exports opened.

| #   |                                 |                                                    |
| --- | ------------------------------- | -------------------------------------------------- |
| 1   | credit space takes both limits  | ✅ built                                           |
| 2   | a third blocking reason         | ✅ built ⚠️ on an assumed threshold                |
| 3   | negative half-cents             | ⚪ a note, no change                               |
| 4   | order type and line type        | ✅ built — **and this item named the wrong field** |
| 5   | a contract says what it adjusts | ✅ already modelled; a guard added                 |
| 6   | VAT scenarios                   | ✅ already modelled                                |
| 7   | the GL accounts                 | ⚪ recorded, nothing to build                      |
| 8   | production movement reasons     | ✅ checked, all four already present               |

**115 checks pass**, up from 99: the creditspace identity on 2 593 rows and
again on 31, each of the three blocking reasons reproduced, and eight cases
against `assessCredit` itself.

---

## 1. 🔴 Credit space uses one limit and there are two

**Evidence:** [credit-and-blocking.md](credit-and-blocking.md) — 2 593 of 2 593
rows, confirmed again on a second screen at 31 of 31.

```
Creditspace = Credit limit + Credit limit uninsured
            - Outstanding entrees - Current orders
```

`assessCredit` in `lib/helpers.ts` computed `creditSpace: creditLimit - owed`.

✅ **Built.** Both limits are added, through one shared `effectiveCreditLimit`
helper — because three places were computing this and they must not disagree:
`assessCredit`, the Credit information customers screen and the Financially
blocked screen. **All three had the same single-limit bug.** `Companies` already has
`creditLimit`, `creditLimitUninsured`, `creditLimitUninsuredDate` and
`creditLimitInsurance` — they are simply never read. `checkCredit` in
`lib/server/credit-control.ts` already selects the company row, so the second
column is one field away.

**Why it matters:** 187 of 2 593 customers have **no insured limit at all** and
trade entirely on the uninsured one. Today every one of those computes a credit
space of `0 - owed`, negative the moment they owe anything. We are holding
orders for customers who have room.

✅ **`creditLimitUninsuredDate` is respected.** A lapsed uninsured limit counts
for nothing; the `31-12-9999` sentinel never lapses. Both are checked.

🚫 **Do not model `Zelfbeoordeling`.** It is a third limit in the reference's
formula and reads `0` on all 2 593 rows — indistinguishable from absent.

---

## 2. 🔴 There is a third blocking reason and we have no rule for it

**Evidence:** [credit-and-blocking.md](credit-and-blocking.md).

| Reason                             | Rows   | Reproduced by                           |
| ---------------------------------- | ------ | --------------------------------------- |
| `Post(s) outstanding for too long` | **18** | ❌ nothing in our code                  |
| `Credit limit exceeded`            | 11     | ✅ order amount > creditspace, 11 of 11 |
| `Customer blocked`                 | 2      | ✅ company blocked flag, 2 of 2         |

**The one we are missing is the most common one**, and it is not an amount rule:
**17 of those 18 orders have creditspace greater than or equal to the order
amount.** They pass the credit check and are held because money is overdue.

✅ **Built.** `assessCredit` has a third branch, before the limit test and
before the prepayment let-off — money already late is late whoever is paying for
the next order. It reads `MIN(Invoices.expirationDate)` over invoices with
something still outstanding, which is the due date; invoices with no due date
are excluded rather than treated as infinitely overdue.

🔴 **The threshold is still an assumption.** `OVERDUE_POST_BLOCK_DAYS = 30`.

Cross-referencing the two exports does **not** settle it, and it is worth
recording why the obvious check fails: 153 customers are more overdue than the
least-overdue blocked one and are not blocked — but the blocked screen only
lists debtors who _have_ an order right now, so almost all of those have nothing
to block. The comparison is invalid, not informative.

What the data does give is a **ceiling**: all eleven debtors held for this reason
are 496 to 614 days past due, so any threshold from 1 to 496 reproduces every
observed block. 30 is ordinary trade practice and sits safely inside.

**Confirm it with Swedinox and change the one constant.**

---

## 3. 🟠 `roundToCents` — negative half-cents are an assumption

Not new, but it belongs on a list somebody will read. Recorded in the helper and
in [discount-basis.md](discount-basis.md): half-up means toward positive
infinity, so `-67,165` now reads `-67,16` where it used to read `-67,17`. No
negative half-cent has been seen in the reference. **If a credit note ever lands
on one, this is the line to check first.**

---

## 4. ✅ `Order type` — done, and the plan below was wrong

**Evidence:** [order-types.md](order-types.md).

🔴 **This item named the wrong field.** The reference labels two different
things `Order type`. Its Production capacity details export prints both:
`Order type` is **Normal / Call-off / Rush** and the Stk/CD axis is **`Line
type`**, which also has a third value — `Stk+CD`, on 31 of 1.970 lines — that
the revenue screens hide by aggregating.

Both were built. `Orders.orderType` for the urgency, `OrderItems.sourceType`
for the sourcing, and `OrderItems.purchaseOrderItemUuid` for the purchase line
behind a cross-dock. Pages, columns and filters wired.

CD is still **a quarter of the volume at half the margin** (20,09 % against
10,55 %) and still splits purchases as well as sales.

**What was built:**

- `Orders.orderType` — `normal` / `call_off` / `rush`. A select on the order
  form, a hidden-by-default column and a filter on the overview. Hidden because
  1 933 of 1 970 rows are `Normal`.
- `OrderItems.sourceType` — `stock` / `stock_and_cross_dock` / `cross_dock`,
  shown by default on the Order lines screen with its own filter.
- `OrderItems.purchaseOrderItemUuid` — the purchase line behind a cross-dock,
  as a **real foreign key**: nothing in the purchase chain imports
  `order-items.ts`, so it closes no module cycle the way `Stock.orderItemUuid`
  would have.

⚠️ **The blank third value is still not modelled.** Both revenue screens show an
unlabelled `Order type:` group carrying `Price differences` — 94 091 kg at a
68 % margin. That is where price corrections land, not a way of selling steel.

---

## 5. ✅ A contract says what it adjusts — it already did

**Evidence:** [contracts.md](contracts.md).

Every contract declares a **kind**: `Gross prices`, `Surcharges` or `Options`.

✅ **We already had it.** `Contracts.contractType` exists and carries all three
of those values plus `net_prices`, `cost_price` and `allowances`. This item
over-scoped itself by not checking first.

What was missing was a guard: `resolveLineNetPrice` applied whatever price
fields a contract carried regardless of its kind, so an `options` or
`surcharges` contract could silently restate the material price. It now returns
the list price untouched for those two. A contract with **no** type recorded is
left alone rather than assumed harmless — that is the older data, and it priced
lines before the column was filled in.

Worth taking while in there: `Preference` (a supplier ranking, `0` everywhere —
record, do not use) and the two-level `Contractgroups` tree (`Main group` plus
`Subgroup`, each with an unused sequence).

Also: the text-filter sentinel is **nine** z's on these screens against fifteen
on the Logistics ones. `TEXT_FILTER_UPPER_BOUND_SENTINEL` should be matched by
shape — all z's — not by exact string.

---

## 6. ✅ VAT scenarios — we already had them

**Evidence:** [finance-screens.md](finance-screens.md). Six attested:

```
(1) Purchase domestically                   (6) Domestic sales
(3) Purchase within EU with reverse charge  (7) Sales within EU with reverse charge
(4) Purchase outside the EU, reverse charge (8) Sales outside the EU, reverse charge
```

The numbering is symmetric — purchase 1/3/4 against sales 6/7/8 — so **2 and 5
exist and are unused in this data.** Do not invent them; leave the gaps.

✅ **`invoiceVatScenarios` already exists** with all six of those, plus
`domestic_purchase_vat_shifted` — an earlier session's inference at position 2 —
and `Invoices.vatScenario` already stores it. Nothing to build. The sales twin
at position 5 is still absent, and stays absent: it has never been observed.

---

## 7. ⚪ The GL accounts the reference actually posts to

Recorded so they are not guessed later:

| Account | What lands on it                        | Rows seen                       |
| ------- | --------------------------------------- | ------------------------------- |
| `7005`  | sawing waste                            | 2 168, all of them              |
| `3100`  | stock increase from external processing | 483, all of them                |
| `3170`  | goods received not invoiced             | on the purchase-invoices screen |

Two more are named and never populated: `GLA# Revaluation` and `GLA Revaluation
Stock` on the FSP screen ([fsp.md](fsp.md)), and `GLA Price difference. Sawing`,
blank on all 2 168 sawing rows.

**Change:** none yet. `LedgerAccounts` exists; these are the numbers to seed it
with when somebody wires real posting.

---

## 8. ✅ Production movement reasons — checked, all four present

`Control sawing waste` names them: `Origin of production` (1 200), `Consumed`
(513), `Scrap production` (264), `Rest production` (191) — the two halves of a
cut, with the offcut and the waste split apart.

✅ **Compared against `stockMovementReasons`, and all four are there:**
`Consumed` is `production_input`, `Origin of production` is `production_output`,
`Rest production` is `production_remnant` and `Scrap production` is
`sawing_waste`. No change needed.

---

# ⚪ Not to be built

- **`Zelfbeoordeling`** — third credit limit, `0` on 2 593 rows
- **`Preference`** on supplier contracts — `0` on all three
- **Contract group sequences** — `0` on all six
- **`Transactioncode` / `Transportcode`** in the CBS return — constants (`11`
  and `3`), not dimensions
- **`Cost centre`** — `0` on all 34 826 journal rows
- **FSP revaluation** — a real feature, unused in two and a half years
  ([fsp.md](fsp.md))

# ⚪ Still unknown

- 🔴 **How many days is "too long"** for an outstanding post. Item 2 ships on
  `OVERDUE_POST_BLOCK_DAYS = 30`, an assumption. Every observed block is 496+
  days past due, so any value from 1 to 496 reproduces them all — but the
  real number is a setting on a screen nobody has captured.
- **What `LIP` stands for** — the fourth profit basis
- **What `FSP` stands for.** Its behaviour is established; the letters are not
- **Whether customer-owned stock should carry value.** €40 833 does today in the
  reference, and that is an accounting policy call for Swedinox rather than a
  code fact ([customer-stock.md](customer-stock.md))
