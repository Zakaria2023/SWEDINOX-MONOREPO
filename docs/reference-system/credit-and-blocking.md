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
