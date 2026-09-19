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

---

## Re-captured 18-9-2026 — and the age-of-debt rule gets a column

Both exports taken again: `Credit information customers` (**2 593 × 35**) and
`Financially blocked quotes and orders` (**31 × 13**). Scratchpad
`credit-info-18sep.tsv` and `fin-blocked-18sep.tsv`.

### Everything above re-proves, unchanged

| Rule | Result |
| --- | --- |
| `Creditspace = Credit limit + uninsured − outstanding − current orders` | **2 593 / 2 593** |
| …using the insured limit alone | **2 406 / 2 593** — the same **187** failures |
| `Credit limit exceeded` ⇒ order amount > creditspace | **11 / 11** |
| `Customer blocked` ⇒ `Company blocked?` is True | **2 / 2** |
| Outstanding-posts rows with creditspace ≥ order amount | **17 / 18** |
| Reason split | 18 / 11 / 2, unchanged since 10-9 |
| 31 rows are 29 orders (`O102167`, `O102168` twice) | unchanged |
| Prepayment rows, and those with a zero limit | 10, of which 9 |
| `Order changed?` True | 5 |
| Negative creditspace / blocked / both | 49 / 59 / **3** |
| `Zelfbeoordeling` | **`0` on all 2 593**, and `0` on all 31 blocked rows |

Three exports across nine days, every rule holding each time. The credit model
is as settled as anything in this reference.

### 🔴 `Oldest due date for open entrees` is the age-of-debt column

The doc above called the outstanding-posts block "an **age-of-debt rule, not an
amount rule**" but had no column to compute it from. This export has one.

**All 18 orders held for `Post(s) outstanding for too long` belong to a customer
carrying a non-null `Oldest due date for open entrees` — 18 of 18, none
unmatched.** 164 of the 2 593 customers have one; so does every held order's
customer.

⚠️ **But it is necessary, not sufficient, and the threshold is not in the data.**
Those 18 rows are only **11 distinct customers**, whose oldest due dates run
4-1-2025 to 2-5-2025. **125 customers who are *not* held carry debt at least as
old**, reaching back to 11-8-2023. So there is no date cutoff that separates the
two groups, and nothing else here separates them either:

| | Held (11) | Not held (153) |
| --- | --- | --- |
| `Reminder` True | 11 / 11 | 152 / 153 |
| Has current orders | 11 / 11 | 70 / 153 |
| Prepayment terms | 0 | 13 |

"Has current orders" is a tautology — you cannot hold an order that does not
exist. The real gate is an overdue-days threshold, and
[[project-ledger-is-afas]] already records that **no screen in this reference
exposes one**. So: the column to age from is now known; the number to compare it
against is still not.

### Four more features shipped switched off

Empty on **all 2 593 rows**, joining `Zelfbeoordeling` on the list of things not
to model:

- `Purchase organization code` / `name` / `Mem. no. Purchase organization`
- `Contact e-mail`
- `Last follow-up` **and** `Last follow-up date`

The last one matters: we have a `FollowUps` table, and the reference's own
follow-up columns on its credit screen are empty on every customer.

### `Reminder` is real, and it is nearly always on

`Reminder` is a boolean: **True on 2 586, False on 7**. A per-debtor switch for
whether payment reminders go out at all — so the seven exceptions are the whole
point of the column. `Companies.reminder` already existed and defaulted to
`true`; the screen simply never read it.

### Revenue comes in two bases, and they are not a rate apart

The export carries `Revenue this / last / two years ago` **twice**, incl. and
excl. VAT. The ratio is **exactly 1,21** where there is VAT — but **110 of the
290 customers with last-year revenue sit at 1,00**, invoiced no VAT at all
(export and reverse-charge customers). So the excl.-VAT figure cannot be derived
from the incl.-VAT one by dividing; both have to be summed.

Also worth recording: **`Revenue this year` is non-zero on only 2 customers**
against 290 for last year — consistent with the database being frozen early in
the year, see [[project-reference-database-schema]].

### `Credit insurance valid until` has its own sentinel

`9999-12-31` on 2 586 rows, with 7 real dates. A policy number is present on
1 343 customers.

## What changed in `apps/dashboard` (19-9-2026)

| Finding | What was done |
| --- | --- |
| `Debtor number` is on this screen too | Added — the column existed on `Companies`, unread here |
| `Reminder` is a real per-debtor switch | Added — likewise already stored |
| Revenue in both VAT bases | Three excl.-VAT columns added, summed separately rather than derived |
| `Zelfbeoordeling`, purchase organisation, contact e-mail, last follow-up | **Deliberately not modelled** — empty on every row |
| The age-of-debt threshold | **Not built.** The column to age from is known; the cutoff is not, so guessing one would hold orders on a number nobody agreed |
