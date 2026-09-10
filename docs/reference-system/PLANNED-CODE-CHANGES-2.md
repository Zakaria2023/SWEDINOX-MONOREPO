# Planned code changes — round 2

**Nothing in this file has been applied.** Written 10-9-2026 at the user's
instruction: *"do not make any edit on code just write docs for everything now
so when we get home we will start to edit."*

Round 1 is [PLANNED-CODE-CHANGES.md](PLANNED-CODE-CHANGES.md) and is fully
applied. This is what the Sales and Finance exports opened.

Ordered by how much they change, not by how interesting they are.

---

## 1. 🔴 Credit space uses one limit and there are two

**Evidence:** [credit-and-blocking.md](credit-and-blocking.md) — 2 593 of 2 593
rows, confirmed again on a second screen at 31 of 31.

```
Creditspace = Credit limit + Credit limit uninsured
            - Outstanding entrees - Current orders
```

`assessCredit` in `lib/helpers.ts` computes `creditSpace: creditLimit - owed`.

**Change:** take both limits and add them. `Companies` already has
`creditLimit`, `creditLimitUninsured`, `creditLimitUninsuredDate` and
`creditLimitInsurance` — they are simply never read. `checkCredit` in
`lib/server/credit-control.ts` already selects the company row, so the second
column is one field away.

**Why it matters:** 187 of 2 593 customers have **no insured limit at all** and
trade entirely on the uninsured one. Today every one of those computes a credit
space of `0 - owed`, negative the moment they owe anything. We are holding
orders for customers who have room.

⚠️ **Respect `creditLimitUninsuredDate`.** The uninsured limit has an expiry
(`Onverzekerd Limiet geldig tot`), usually the `31-12-9999` sentinel. An expired
uninsured limit should not count. Use `isSentinelDate` for the open end.

🚫 **Do not model `Zelfbeoordeling`.** It is a third limit in the reference's
formula and reads `0` on all 2 593 rows — indistinguishable from absent.

---

## 2. 🔴 There is a third blocking reason and we have no rule for it

**Evidence:** [credit-and-blocking.md](credit-and-blocking.md).

| Reason | Rows | Reproduced by |
| ------ | ---- | ------------- |
| `Post(s) outstanding for too long` | **18** | ❌ nothing in our code |
| `Credit limit exceeded` | 11 | ✅ order amount > creditspace, 11 of 11 |
| `Customer blocked` | 2 | ✅ company blocked flag, 2 of 2 |

**The one we are missing is the most common one**, and it is not an amount rule:
**17 of those 18 orders have creditspace greater than or equal to the order
amount.** They pass the credit check and are held because money is overdue.

**Change:** `assessCredit` needs a third branch, before the limit test, keyed on
the age of the oldest open receivable. `Invoices` has what it needs; the
customer export carries `Oldest due date for open entrees` alongside `Oldest
invoice date for open entrees`, so the reference measures from the **due** date.

⚠️ **The threshold is not known.** Nothing in either export states how many days
"too long" is — it is a setting on a screen we have not seen. **Ask before
picking a number**; do not default to 30 and call it done. Until it is known
this item is blocked on a question, not on work.

---

## 3. 🟠 `roundToCents` — negative half-cents are an assumption

Not new, but it belongs on a list somebody will read. Recorded in the helper and
in [discount-basis.md](discount-basis.md): half-up means toward positive
infinity, so `-67,165` now reads `-67,16` where it used to read `-67,17`. No
negative half-cent has been seen in the reference. **If a credit note ever lands
on one, this is the line to check first.**

---

## 4. 🟠 `Order type` — `Stk` vs `CD` — is not modelled at all

**Evidence:** [order-types.md](order-types.md).

CD is **a quarter of the volume at half the margin** (20,09 % against 10,55 %),
it appears as a column or a grouping on **eight** screens, and it splits
purchases as well as sales.

**Change, in two parts:**

- `Orders` — and `OrderItems`, which carries `Type` per line in the reference —
  gain an order-type enum. Two proved values, so `["stock", "cross_dock"]` and
  nothing else: widening is free, inventing is not.
- A CD line names **the purchase order line that covers it**. `CD-deliveries in
  progress` prints both keys on one row. `PurchaseOrderItems` has no sales-side
  reference, so this is a new nullable column rather than a rename.

⚠️ **Do not add the blank third value.** Both revenue screens show an unlabelled
`Order type:` group carrying `Price differences` — 94 091 kg at a 68 % margin.
That is where price corrections land, not a way of selling steel.

---

## 5. 🟠 A contract does not say what it adjusts

**Evidence:** [contracts.md](contracts.md).

Every contract declares a **kind**: `Gross prices`, `Surcharges` or `Options`.
Ours has no such field, so `loadSalesPricingContext` treats every contract as a
price agreement.

**Change:** a `contractInfoType` enum on `Contracts` with those three values —
all three are attested, so this is the rare case where the enum is complete on
the first day — and the pricing context branches on it.

Worth taking while in there: `Preference` (a supplier ranking, `0` everywhere —
record, do not use) and the two-level `Contractgroups` tree (`Main group` plus
`Subgroup`, each with an unused sequence).

Also: the text-filter sentinel is **nine** z's on these screens against fifteen
on the Logistics ones. `TEXT_FILTER_UPPER_BOUND_SENTINEL` should be matched by
shape — all z's — not by exact string.

---

## 6. ⚪ VAT scenarios are an enum we do not have

**Evidence:** [finance-screens.md](finance-screens.md). Six attested:

```
(1) Purchase domestically                   (6) Domestic sales
(3) Purchase within EU with reverse charge  (7) Sales within EU with reverse charge
(4) Purchase outside the EU, reverse charge (8) Sales outside the EU, reverse charge
```

The numbering is symmetric — purchase 1/3/4 against sales 6/7/8 — so **2 and 5
exist and are unused in this data.** Do not invent them; leave the gaps.

**Change:** an enum plus a column on the invoice and journal side. Low priority:
we push no ledger anywhere yet, and the scenario is only carried on VAT-bearing
legs (32 235 of 34 826 journal rows have none).

---

## 7. ⚪ The GL accounts the reference actually posts to

Recorded so they are not guessed later:

| Account | What lands on it | Rows seen |
| ------- | ---------------- | --------- |
| `7005` | sawing waste | 2 168, all of them |
| `3100` | stock increase from external processing | 483, all of them |
| `3170` | goods received not invoiced | on the purchase-invoices screen |

Two more are named and never populated: `GLA# Revaluation` and `GLA Revaluation
Stock` on the FSP screen ([fsp.md](fsp.md)), and `GLA Price difference. Sawing`,
blank on all 2 168 sawing rows.

**Change:** none yet. `LedgerAccounts` exists; these are the numbers to seed it
with when somebody wires real posting.

---

## 8. ⚪ Production movement reasons — four, and we have the shape already

`Control sawing waste` names them: `Origin of production` (1 200), `Consumed`
(513), `Scrap production` (264), `Rest production` (191) — the two halves of a
cut, with the offcut and the waste split apart. Our `applyProductionConsume` and
`applyProductionOutput` already model exactly this. Worth a comparison pass
against `lib/enums.ts` to check the names line up; no change expected.

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

- **How many days is "too long"** for an outstanding post — blocks item 2
- **What `LIP` stands for** — the fourth profit basis
- **What `FSP` stands for.** Its behaviour is established; the letters are not
- **Whether customer-owned stock should carry value.** €40 833 does today in the
  reference, and that is an accounting policy call for Swedinox rather than a
  code fact ([customer-stock.md](customer-stock.md))
