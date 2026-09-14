# Credit space, and the three ways an order gets held

Two exports, 10-9-2026: `Credit information customers` (**2 593 rows**) and
`Financially blocked quotes and orders` (**31 rows**). Between them they settle
the credit model exactly.

## The formula

```
Creditspace = Credit limit
            + Credit limit uninsured
            - Outstanding entrees
            - Current orders
```

**2 593 of 2 593 exact** on the customer export, and **31 of 31** on the blocked
export, which prints the same figure under Dutch headings (`Onverzekerd
Limiet`, `Open orders excl BTW`, `Open entrees`). Two screens, one formula, no
exceptions.

Both amounts are **excluding VAT**. Each export also carries an incl.-VAT pair
beside them, and substituting those breaks the identity — 315 rows fail. The
gross figures are for display.

## There are two limits, and we only use one

| | |
| --- | --- |
| **`Credit limit`** | the **insured** limit. 346 of the 351 customers with one also carry a `Credit insurance` policy number; only 5 have a limit without a policy. This is what the insurer will cover. |
| **`Credit limit uninsured`** | the merchant's own appetite on top, with its own expiry (`Onverzekerd Limiet geldig tot`, usually the `31-12-9999` sentinel). 57 customers have one. |

A customer's headroom is the **sum**. 187 of the 2 593 customers have a
creditspace that comes entirely from the uninsured limit — `Credit limit` is
zero and the uninsured one is not. Those are the 187 rows that fail if you use
the insured limit alone.

⚠️ **`Zelfbeoordeling` ("self-assessment") is a third limit and it is `0` on all
2 593 rows.** Another feature shipped switched off, alongside transport costing,
`Resource` and `Pickvolgorde`. It is in the formula's shape but contributes
nothing, so it cannot be told apart from absent — do not model it.

## Three blocking reasons, and they are independent

`Financially blocked quotes and orders` gives one reason per held order:

| Reason | Rows | Test that reproduces it |
| ------ | ---- | ----------------------- |
| `Post(s) outstanding for too long` | 18 | — |
| `Credit limit exceeded` | 11 | **order amount > creditspace, 11 of 11** |
| `Customer blocked` | 2 | **`Company blocked?` is True, 2 of 2** |

The third one is the important discovery: **17 of the 18 orders held for
outstanding posts have `creditspace ≥ order amount`** — they pass the credit
check comfortably and are held anyway, because money is overdue. It is an
**age-of-debt rule, not an amount rule**, and it is the single most common
reason an order is held in this system.

The customer export confirms the reasons do not derive from each other: 49
customers have negative creditspace and only 3 of them are `Blocked`; 59 are
`Blocked` and only 3 have negative creditspace.

The screen also carries `Order changed?` (True on 5 of 31) — an order edited
after it was blocked — and `Delivery date 1st delivery`, so the queue can be
worked by urgency.

## What this means for our code

`assessCredit` computes `creditSpace = creditLimit - owed` from a **single**
limit, and knows **two** blocking reasons. Both need to change. The columns are
already on `Companies` (`creditLimit`, `creditLimitUninsured`,
`creditLimitUninsuredDate`, `creditLimitInsurance`) — they are simply not read.

Written up as items 1 and 2 of
[PLANNED-CODE-CHANGES-2.md](PLANNED-CODE-CHANGES-2.md). **No code was changed.**

---

## Re-captured 14-9-2026

`Financially blocked quotes and orders` exported again — **31 rows × 18**,
`exports/financially-blocked-2026-09-14.tsv`. **Unchanged since 10-9-2026:**
18 / 11 / 2 by reason, and every rule above holds again — creditspace formula
31 of 31, `order amount > creditspace` 11 of 11, `creditspace ≥ order amount`
17 of 18 on the outstanding-posts rows, `Company blocked?` 2 of 2.

Read beside the C7 `Unblocked orders` export
([customers-and-prospects.md](customers-and-prospects.md) Part 3), it adds three
things:

### 🔴 A block comes back — proved on live orders

**3 of the 29 orders held today were unblocked before**: `O102168`, `O101985`,
`O102150`. They were let go and are held again. C7 showed repeats in history;
this shows them in the current queue. The credit check is **re-run after an
unblock** — at a later step of the order — and nothing in our code does that.

### One row per delivery, not per order

31 rows are **29 orders**. `O102167` and `O102168` each appear twice, with
`Delivery date 1st delivery` of 26-6-2026 and 14-8-2026 — the same order,
held once per planned delivery. The queue is worked **by delivery**.

### Prepayment customers are held on the credit limit

**10 rows carry `PaymentTerm` = `Prepayment`, and 9 of them have
`Credit limit` = 0.** Eight of the 11 `Credit limit exceeded` rows are
prepayment customers. A prepayment customer has no credit, so **every order
they place is held until they pay** — the block *is* the prepayment mechanism.
There is no separate prepayment status; it falls out of a zero limit.

`Order changed?` is `True` on 5 rows (4 orders) — `O102168` among them, the one
that was unblocked and blocked again.

---

## The company window and its `Debtor` panel (item G12) — 14-9-2026

Two screenshots of **Mercainox Componentes Industriais, Lda.**, opened from the
blocked queue with `Show Company` (it is held for `Post(s) outstanding for too
long`, order `O102152`).

### The company header

- Roles are **nine tick boxes**: Customer, Prospect, Supplier, Processor,
  Transporter, Agent, **Purchasing org.**, Other, **Internal** — exactly our
  `companyRoles`. ✅
- `Company (created on 25-1-2013)`, **`Company code: 12368`** — while the Debtor
  panel says **`Debtor number: 10059`**. The two-number model of
  [customers-and-prospects.md](customers-and-prospects.md) §38, seen on one
  record.
- `Company name`, `Corresp. name`, `Main language` (English), `Sister affiliate`,
  three search codes, `Work panel color`.
- Panels, top to bottom: Additional info, Addresses, Contacts, Remarks ·
  Counter Orders, Documents (with a count), Visit reports, Communication,
  Communication settings, Contracts (with a count), **Debtor** (with a summary),
  Invoices, Invoicing, Purchase orders (open count, € and kg), Complaints, …

### The `Debtor` panel

| Left | Right |
| --- | --- |
| Debtor number `10059` (read-only) | Payment terms `Within 60 days from date of invoice` |
| IBAN, BIC, Bank account, Postbank account | Different payment terms ex works |
| Purchase org. + `Show`, Mem. no. Pur.Org. | Journal code `11` (read-only) |
| ☑ Calculate VAT if applicable · ☑ Reminder | VAT no `PT505216221`, C of C number |
| ☐ Collect invoices in collection-mandate · ☐ Different contracts | Currency `Euro` |

**Credit block:**

| Field | Value |
| --- | --- |
| `Credit limit insurance` | **`0016184861`** — a **policy number**, with `Insurance valid until` `31-12-9999` |
| `Credit limit` | **€ 750 001** |
| `Credit limit uninsured` | **€ 249 999**, valid until `31-12-9999` |
| `Credit space` | **€ 215 952,53** |
| `Open orders` excl / incl BTW | € 234 195,89 / € 234 195,89 |
| `Open entrees` excl / incl BTW | € 549 851,58 / € 549 851,58 |
| `Oldest invoice date open entrees` | **30-1-2025** |
| `Oldest due date open entrees` | **31-3-2025** |
| ☐ `Blocked by` + a free-text note box | — |

And the panel's collapsed summary reads `Credit limit: € 1.000.000,00, Credit
limit: € 215.952,53` — **the total limit, then the credit space**.

### What it proves

- **Credit space, on the record itself:** 750 001 + 249 999 − 234 195,89 −
  549 851,58 = **215 952,53**. Exact. The `Update` button recomputes it.
- **The two limits add up to a round million** — 750 001 + 249 999. So the
  `…001` habit of [customers-and-prospects.md](customers-and-prospects.md) §18 is
  not "one euro over": the uninsured limit is typed one euro *under* to
  compensate. The total is what staff think in.
- **Due date = invoice date + payment term:** 30-1-2025 + 60 days = 31-3-2025.
- **The overdue rule's input is `Oldest due date open entrees`.** Mercainox's is
  **532 days** before 14-9-2026, inside the 496–614 range already seen. ⚠️ **The
  threshold itself is not on this panel.** It is not per customer; it has to be
  a system setting (item A1, the `Extra` menu).
- Portugal: incl. and excl. BTW are equal — no Dutch VAT on an intra-EU customer.

### 🔴 What it means for our code

1. **`creditLimitInsurance` is a `decimal` in `db/schema/companies.ts`. In the
   reference it is the insurer's policy number** (`0016184861`, leading zeros).
   It must be a string. `insuranceValidUntil` is its date — that part is right.
2. **`assessCredit` refuses to block a customer with no limit, and refuses to
   block a prepayment order.** The blocked queue contradicts both: **8 of the 11
   `Credit limit exceeded` rows are `Prepayment` customers, 9 of the 10 prepayment
   rows have `Credit limit` 0**, and they are held. In the reference a zero limit
   means "no credit", and a prepayment customer's order waits for the money. Our
   two "deliberate refusals" are exactly the cases the reference blocks.
3. `Blocked by` is a tick box **plus a note** — our `blockedByUserId` +
   `blockedByNote`. ✅
4. The panel summary shows **total limit** and **credit space**, not the insured
   limit — worth copying on our company page.
