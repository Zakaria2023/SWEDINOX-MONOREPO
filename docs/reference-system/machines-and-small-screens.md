# Machines, and the two small delivery screens

Three screens that are answered completely and need nothing further.

---

# Machines

`Overviews → Logistics → Machines`. Ours: `/machines`.

**Two columns, six rows. That is the whole table.**

| Machine code | Machine |
|---|---|
| `DECOILER` | Decoiler |
| `INTERNE WZH` | Interne wzh |
| `KNIP` | Knip |
| `LASER 1` | Laser 1 |
| `LASER 2` | Laser 2 |
| `SLIJPEN` | Slijpen/Foliën |

No capacity, no rate, no cost per hour — the overview carries nothing but
identity. Which answers the question asked in
[NEXT-LOGISTICS.md](NEXT-LOGISTICS.md) item 15: **a machine does not carry a
rate.** Capacity is planned by the half-hour slot on the work order, not by a
figure on the machine.

### These six are the same six seen from three other angles

| Machine | Turns up as |
|---|---|
| `SLIJPEN` | `Fetching` → `Slijpen/Foliën` on Warehouse workorders; `Aanhalen Slijpen` on Warehouse capacity; the `Slijpen (K320)` purchase option |
| `KNIP` | `Fetching` → `Knip`; `Aanhalen Knippen`; the `KNIP` sawing machine on Nesting |
| `LASER 1` / `LASER 2` | `Fetching` → `Laser 1`; `LASER 1` on Nesting |
| `DECOILER` | the destination of a decoiling work order; the `Decoilen` purchase option, priced per tonne |
| `INTERNE WZH` | *(werkzaamheden — internal work)* the catch-all |

So a processing option bought on a purchase line, a `Fetching` work order, a
capacity pool and a nesting machine are four views of one machine. Our
`MACHINE_OPTION_FOR_PROCESSING` map already links options to machines; what it
does not yet know is that the same machine name is the work order's
`To-location`.

⚠️ There is **no `UV Folie` machine**, yet Warehouse capacity books
`Aanhalen UV Folie`. Either UV film runs on `SLIJPEN` (whose name,
`Slijpen/Foliën`, does say "grinding/film") or it is a capacity pool with no
machine behind it. The name strongly suggests the former.

---

# Deliveries to be arranged without stock reservation

`Overviews → Logistics → Deliveries to be arranged without stock reservation`.
Ours: `/deliveries-to-arrange`.

**Sales order lines with a delivery date and nothing reserved to fill it.** A
worklist, not a report: every row is a promise that cannot currently be kept.

Twelve rows across five customers. All `PC304200` / `PC304300` / `PC304150`
cold-rolled 304 plate, quantities of 5 to 1 000, dated `17-9-2025` to
`13-10-2025`.

**Columns**: `Customer` · `Order` · `Line` · `Delivery date` · `Qty(p)` ·
`U(p)` · `Product code` · `Product description` · `Length`

Nine columns, no money, no status. Ours reads
`WHERE OrderItems.qtyReserved = 0`, which matches.

⚠️ One gap: the reference sorts by `Customer` and ours by `createdAt DESC`. A
worklist is worked customer by customer, so the sort is part of the screen.

---

# Blocked deliveries

See [blocked-deliveries.md](blocked-deliveries.md) — it earned its own file,
because it proved the sales-side pricing rule to the cent.
