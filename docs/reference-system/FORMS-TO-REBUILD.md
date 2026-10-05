# Forms to rebuild — the new/edit screens that must look like the reference

Opened **5-10-2026**, off the lot-dialog capture in
[stock-lot-dialogs.md](stock-lot-dialogs.md).

**The rule this list exists to serve:** a form in our build should be the
reference's form — same fields, same order, same enums, same thing greyed, same
thing mandatory. Until now the lot dialogs were guesses. They are not any more,
so the guesses have to go.

Nothing here is written yet. This is the work list, in the order it should be
done.

---

## The shape every one of these dialogs shares

Worth stating once, because it repeats on four of them and we have it on none:

1. **A read-only ledger across the top**, stating what the action may touch —
   `Technische voorraad`, `Beschikbaar`, `Gereserveerd`, each split into what is
   already committed (`Met onderhanden opdrachten`, `Geplande verplaatsingen`),
   closing on a bold **total this action can act on**.
2. **The action's own fields below it**, with the lot's identity
   (`Interne charge`, `Bundel`) shown **greyed** rather than hidden — the dialog
   always says which lot it is about.
3. **`OK` greyed until the form is legal.** Quantity `0` or no reason = no OK.
   The reference never lets you press a button that would fail.

We currently render none of this. A user pressing Correct on our build cannot
see that 25 of 25 pieces are reserved, which is the single most important fact
about whether the action is safe.

---

## 1. 🔴 Reservations — delete the create form

**What we built:** a way to create a reservation by hand.
**What the reference has:** no such thing.

`Reserveringen…` opens a grid whose whole toolbar is **`Order` · `Verwijder`**.
There is no `New`. A reservation is a *consequence of a sales order*.

- **Delete** our create-a-reservation form and its action
- **Add** `Verwijder` — release the lot by destroying the reservation
- **Add** `Order` — a link through to the order that caused it
- Columns: `Type · Status · Hoeveelheid · Eenheid · Order/R… · Bedrijf · Datum ·
  Gewijzigd`, where `Order/R…` is **order and line in one cell** (`O107163/20`)

This is the only item on the list that *removes* a screen.

---

## 2. 🔴 Stock correction — rebuild as two halves

Ours is a quantity box. The reference's `Corrigeren voorraad` is a general lot
editor split into **two independently tickable groups**:

| ☑ `Voorraad hoeveelheid correctie` | ☐ `Voorraad kenmerk correctie` |
|---|---|
| `Huidige hoeveelheid` (read-only) | `Voorraad opmerking` (free text) |
| `Nieuwe hoeveelheid` (prefilled with current) | |
| **`Reden`** — mandatory | |
| `Zaagopdracht` | |
| `Dikte` · `Kwaliteit` · `Categorie` | |
| `Gewicht` · `Gewogen gewicht` · `Brutogewicht` · `Nettogewicht` | |
| `Vooraadmutatie omschrijving` | |

To build:

- the **tickbox gating** — unticking a half greys its fields
- **all four weights**, not one. Gross − tare = net = weighed, and weighed is
  independent of theoretical (1 798 / 1 754 / 1 766,25 on the captured lot)
- `Reden` **mandatory**, 8 values — `Rejected material · Inventory rejection ·
  Stock difference · Stock correction · Transfer length · Internal damage ·
  Scrap · Opmerking voorraad toevoegen/aanpassen`
- **`Zaagopdracht`** — a correction can point at the saw order that caused the
  loss. Two columns, `Opdracht` and `Ordernr`
- `Categorie` — 5 values, `Standaard · Scrap · 2nd choice · Remaining ·
  3rd party inventory`
- `Kwaliteit` as **code + norm** (`304L2B` → `EN 1.4307 2B`), **filtered to the
  alloy family** so 304 can never be saved as 316

---

## 3. 🔴 Options — a column becomes rows

**The biggest model change on this list.** We hold a lot's options as a column
of text. The reference holds them as **rows**, each with
`Optie · Specificatie · Status`, added through a `Toevoegen` block and saved with
`Opslaan`.

- new table, options **per lot**, with a specification and a status
- the enum is **at least 19 members across two lists and both were still
  scrolling** — do not hard-code the 6 we have
- the **product's** list (what this article *can* have done, each row a status)
  and the **lot's** list (what has *been* done) are **different lists**
- 🔑 **`2.1 Certificate` is one of them** — so the certificate is an option on a
  lot, not a field on a batch and not a document. That is why every certificate
  column on the batch screens is empty

---

## 4. Batch registration — a picker, not a form

`Voorraad partij correctie` is not data entry. You choose a `Leverancier`, it
lists that supplier's deliveries, you pick the one this lot came from, and
**only two fields are yours**: `Charge` and `Fabrieksnummer`. Order, line,
receipt date, dimensions and weight are all read off the purchase line and
greyed.

- three panels: `Artikel / Voorraad` (the lot) · `Inkoopleveringen` (the
  supplier's deliveries) · `Partijkenmerken` (the fields)
- **`Charge` is the mill's heat number; `interne charge` is ours** — two columns,
  never conflated
- the delivery grid is **per instalment**, so one purchase line shows several
  rows (`403773/10` appeared twice, 23 pcs and 25 pcs, same heat)

---

## 5. Relocate vs Transfer — two dialogs, not one

We have one "move" concept. The reference has two, and the difference is a
single field:

| | `Verplaatsen…` | `Overboeken…` |
|---|---|---|
| Title | `Aanmaken verplaatsopdracht` | `Aanmaken overboekingsopdracht` |
| Moves it to | another **location** | another **article** (+ optional location) |
| `Naar Artikel` | — | ✅ opens the **stock search dialog** |
| `Reden` | 5 values: `Conversion · To another location · From another branch · Moved` | **1 value: `Transfer`** |
| `Uitvoerdatum` | ✅ defaults to today | — |
| `Ind. reserveringen` | ✅ | — |

🔑 **Both create an *order*, not a movement** — "Aanmaken …opdracht", with an
execution date. Relocation is planned warehouse work, which is why
`Geplande verplaatsingen` is a subtracting line in the ledger at the top.

🔑 **Reserved stock is movable and splittable.** A reservation binds the lot, not
the shelf.

---

## 6. Split — keep the weight box

The one we guessed right. `Splits voorraad` has `Hoeveelheid`,
**`Gewogen gewicht`**, `Naar locatie`, and ☐ `Ind. reserveringen` — and
**no `Reden`, no `Uitvoerdatum`**, so unlike a relocation it happens
immediately rather than becoming an order.

Only change needed: the ledger at the top, counting `Totaal splitsbaar`.

⚠️ This is the **lot** split. The **reception** split (H13) is still unseen.

---

## 7. The two pickers

- **`Locatie zoeken`** — locations are a **tree under one warehouse**
  (`00 Hego Almere`), with `Zoek` / `Magazijn` tabs and a numbered depth
  toolbar. Ours is a flat list
- **`Voorraad`** (the stock search) — ours is close, but missing
  `C. Kg` / `C. ST` on the article grid, `Ongeopend` / `GIP` on the lot grid, the
  live **`TotalPhysicalStock ≠ 0`** filter chip with `Edit Filter`, the
  `1e keus` / `2e keus` tickboxes, and a **`Reserveringen…` button** that
  inspects a lot's reservations before you choose it

---

## 8. Stock label

`Voorraadlabel` → `Selecteer type voorraadlabel en aantal`:
`Type Vooraadlabel` (**`Label` · `Sticker`**), a count per line defaulting to 1,
and ☐ `Gebruik printers op locatie` — which implies **printers are configured per
location**. We have no label printing at all.

---

## Not in scope

**`Aanvullen…` (Replenish) and `Verschrotten…` (Scrap) are greyed on a normal
lot**, with a lot selected. Grey is an answer. Neither gets built until
something shows them enabled.
