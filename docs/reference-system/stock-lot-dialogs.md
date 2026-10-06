# The lot dialogs — the `Voorraad` toolbar on a product record

Captured **5-10-2026**, on `PK304L200315` (Cold-rolled plate 304L, 3000 × 1500 ×
2 mm) at location **`Laad`**, lot `interne charge 26AOSG`, bundle `403717`,
supplier charge `112770`. easy2trade **version 3.13.0.508**.

This is the toolbar that sits above the `Voorraad` panel on a product record,
and it is where every manual stock act in the system happens:

```
+ New · Verplaatsen… · Aanvullen… · Correctie… · Verschrotten… · Overboeken…
· Partijregistratie… · Reserveringen… · [cube] · Voorraadlabel · Opties bewerken
· Splits · View: [Voorraad]
```

**`Aanvullen…` (Replenish) and `Verschrotten…` (Scrap) are greyed even with a lot
selected.** Grey is an answer: neither is reachable on a normal lot, so neither
is in scope until something shows them enabled.

---

## 0. The lot these dialogs were opened on

The arithmetic every dialog repeats back, and which our model must reproduce:

| | |
|---|---|
| `Technische voorraad` | **25** ST |
| `Gereserveerd` | **25** |
| `Beschikbaar` | **0** |
| `Gewicht` (theoretical) | **1 766,25** kg |
| `Gewogen gewicht` (weighed) | **1 754** kg |
| `Brutogewicht` (gross) | **1 798** kg |
| `Nettogewicht` (net) | **1 754** kg |

🔑 **`Technical = Reserved + Available`**, on every dialog and in the location
grid. Confirmed again on neighbouring rows: `3 = 3 + 0`, `9 = 0 + 9`.

🔑 **`Gross − Net = 44 kg` of tare, and `Net == Weighed`.** So the weighbridge
model is `gross − tare = net = weighed`, and **`weighed ≠ theoretical`**
(1 754 against 1 766,25). Both are carried, side by side, on the same lot —
which is exactly the drift the purchase invoice bills on.

---

## 1. `Reserveringen…` → **H2 is answered, and the answer is no**

Title: `Reserveringen Laad Cold-rolled plate 304L`

Toolbar: **`Order` · `Verwijder`** — and that is all.

| Type | Status | Hoeveelheid | Eenheid | Order/R… | Bedrijf | Datum |
|---|---|---|---|---|---|---|
| `Sale` | `Definitive` | 25 | ST | `O107163/20` | Sigaltec s.l. | 10-8-2026 |

🔴 **There is no `New` button.** H2 asked *"create a reservation by hand"* and
the system's answer is that you cannot. A reservation is **made by a sales
order** and the only manual act available is `Verwijder` — deleting one.

So the feature we were going to build does not exist. What exists is:

- **`Order`** — jump to the order that caused the reservation
- **`Verwijder`** — release the lot by destroying the reservation

**Consequence for our build:** drop "create reservation" entirely. Add a
**delete** path and an **open the owning order** link. A reservation is a
*consequence*, never a record somebody types.

Two enums fall out of the single row:

- `Type` = **`Sale`** — so other types exist, and `Purchase` is the one H9
  inferred from 23 rows of purchase reservations
- `Status` = **`Definitive`** — so a provisional reservation exists, matching
  the order's own `Provisional` / `Definitive` pair

`Order/R…` reads **`O107163/20`** — order number *and* line number in one
column, the line being `20`.

---

## 🔴 Correction, 6-10-2026 — our two halves were backwards

Found while building this. The reference's split between its two tickboxes is
**not** the one we had:

| | We had | The reference has |
|---|---|---|
| ☑ quantity half | quantity + weight | quantity, **all four weights**, category, quality, the three dimensions, `Reden`, `Zaagopdracht` |
| ☐ characteristics half | category, quality, dimensions, remark | **the stock remark, and nothing else** |

So our dialog greyed out the grade the moment somebody only wanted to fix the
count, and offered a "characteristics" section that the reference does not have.
Corrected in `stock-correction-dialog.tsx`: the quantity half is *what and how
much this metal is*, the characteristics half is *what somebody wrote about it*.

🔑 And a consequence worth stating: because the halves are independently
tickable, a correction that touches only one of them **says nothing at all**
about the other. Reading an absent field as blank recorded every quantity
correction as having wiped the remark — a change that never happened, in the one
ledger that exists to be trusted about what changed. `stockAttributeChanges` now
treats a key the dialog never offered as "not mentioned", not "cleared".

---

## 2. `Correctie…` → **H3 is answered**

Title: `Corrigeren voorraad`. This is the right door — **not**
`Correct products and stock`, which corrects the *article*.

The dialog is **two independent corrections, each behind its own tickbox**:

### ☑ `Voorraad hoeveelheid correctie` — quantity and weight

| Field | Value seen | Editable |
|---|---|---|
| `Interne charge` / `Bundel` | — | greyed, identifies the lot |
| `Huidige hoeveelheid` | `25 Pieces` | read-only |
| **`Nieuwe hoeveelheid`** | `25` | ✏️ prefilled with current |
| **`Reden`** | *(empty)* | ✏️ **mandatory — `OK` is greyed until set** |
| **`Zaagopdracht`** | *(empty list)* | ✏️ |
| `Dikte` | `2,000` | ✏️ |
| `Kwaliteit` | `EN 1.4307` | ✏️ |
| `Categorie` | `2nd choice` | ✏️ |
| `Gewicht` | `1766,25` | ✏️ |
| `Gewogen gewicht` | `1754` | ✏️ |
| `Brutogewicht` | `1798` | ✏️ |
| `Nettogewicht` | `1754` | ✏️ |
| `Vooraadmutatie omschrijving` | *(free text)* | ✏️ |

### ☐ `Voorraad kenmerk correctie` — characteristics

Unticked, which greys its one field, `Voorraad opmerking` (free text).

🔑 **One correction can change quantity, quality, category, thickness and all
four weights at once.** It is not a quantity adjustment with extras bolted on —
it is a general-purpose lot editor, and every change lands as one stock
mutation carrying the reason and the description.

🔑 **`Zaagopdracht` (saw order) is a field on a correction.** The list was empty
on this lot — two columns, `Opdra… /` and `Ordernr`, both `-leeg-`. So a
correction can be **attributed to a saw order**, which is the missing link
between H3 and H10: when a cut loses material, the correction that writes the
loss off points at the job that caused it.

### `Reden` — the 8-value correction reason enum

```
Rejected material
Inventory rejection
Stock difference
Stock correction
Transfer length
Internal damage
Scrap
Opmerking voorraad toevoegen/aanpassen
```

🔑 The last one — *"add/adjust stock remark"* — is the reason you pick when you
only wanted to change the remark. It pairs with the `Voorraad kenmerk correctie`
tickbox, and it is why a remark edit is still a stock mutation with a reason.

### `Kwaliteit` — code and norm are two fields

| Kwaliteitscode | Omschrijving |
|---|---|
| `304L` | EN 1.4307 |
| `304L4N` | EN 1.4307 4N |
| `304L2B` | EN 1.4307 2B |
| `304` | EN 1.4301 |
| `304L2BB` | EN 1.4307 2BB |
| `304L1D` | EN 1.4307 1D |
| `304LSB` | EN 1.4307 SB |
| `304L2E` | EN 1.4307 2E |
| `304LNO4` | EN 1.4307 No4 |
| `304L2D` | EN 1.4307 2D |
| `304LBA` | EN 1.4307 BA |

🔑 **The surface finish is a suffix on the quality code**, not a separate column:
`304L` + `2B`, `1D`, `SB`, `2E`, `No4`, `2D`, `BA`, `4N`. The norm (`EN 1.4307`)
is the description.

🔑 **The list is filtered to the 304 family.** A correction cannot turn 304 into
316 — only re-grade within the alloy. That is a constraint worth enforcing.

### `Categorie` — the 5-value stock category enum

```
Standaard
Scrap
2nd choice
Remaining
3rd party inventory
```

🔑 `3rd party inventory` is the customer-owned stock that K2 is about — the
€40 833 that carries value today. The category is set **per lot**, by hand, on a
correction.

---

## 3. `Verplaatsen…` — relocate, and what "movable" means

Title: `Aanmaken verplaatsopdracht` (create relocation order).

The header block is a ledger of what may be moved:

```
Technische voorraad:                 25
Beschikbaar:                          0
  Geplande verplaatsingen:            0
  Beschikbaar en verplaatsbaar:       0
Gereserveerd:                        25
  Met onderhanden opdrachten:         0
  Geplande verplaatsingen:            0
  Gereserveerd en verplaatsbaar:     25
Totaal verplaatsbaar:                25
```

🔑 **Reserved stock is movable.** `Gereserveerd en verplaatsbaar = 25` — moving
a lot does not break its reservation, because a reservation binds the *lot*, not
the shelf. Only `Met onderhanden opdrachten` (already on an open work order) and
`Geplande verplaatsingen` (already scheduled to move) subtract.

Fields: `Hoeveelheid` (Pieces) · ☐ `Ind. reserveringen` · `Naar locatie` ·
`Reden` · `Uitvoerdatum` (defaulted to today). `OK en gereed` stays greyed while
the quantity is `0`.

`Reden` — the relocation reason enum:

```
-leeg-
Conversion
To another location
From another branch
Moved
```

**It creates an order, not a movement** — "Aanmaken verplaats*opdracht*", with an
execution date. Relocation is planned work for the warehouse, which is why
`Geplande verplaatsingen` is a line in the ledger above.

---

## 4. `Overboeken…` — transfer to **another article**

Title: `Aanmaken overboekingsopdracht`.

🔑 **This is what separates it from `Verplaatsen`:** it has a **`Naar Artikel`**
field. `Verplaatsen` moves a lot to another *location*; `Overboeken` moves it to
another ***article***, optionally to another location at the same time.

That is re-classification — the act of deciding a lot is really a different
product than it was booked as. Fields:

| | |
|---|---|
| `Interne charge` | `26AOSG` — shown **filled** here, greyed |
| `Bundel` | `403717` — shown filled, greyed |
| `Hoeveelheid` | Pieces |
| **`Naar Artikel`** | `-leeg-` with a `…` picker |
| `Naar locatie` | `-leeg-` with a `…` picker |
| `Reden` | dropdown |
| `Vooraadmutatie omschrijving` | free text |

`Reden` has **exactly one value: `Transfer`.** A one-member enum is still an
enum — it is stored, and it is what the stock mutation will read.

🔑 **`Naar Artikel`'s `…` opens the full `Voorraad` stock-search dialog**, not a
dropdown — the same dialog our `CLAUDE.md` rule already insists on. See §8.

---

## 5. `Partijregistratie…` → **H11 is answered**

Title: `Voorraad partij correctie` (stock batch correction).

🔴 **This replaces what H11 was asking.** H11 was *"link a certificate to a
batch"*, and there is **no certificate field anywhere on this dialog** — which
independently confirms `batch-registration.md` §1, where all 2 540 received and
3 271 sent rows had every certificate column empty. The certificate is not here
(it turns up in §7 instead, as a stock **option**).

What the dialog actually does is **attach the mill's heat number to a lot by
pointing at the purchase delivery it arrived on.**

### `Artikel / Voorraad` — the lot being registered

| Code | Locatie | Voor. | Gere. | Besc. | L | B | D | kg | Charge | Interne c. |
|---|---|---|---|---|---|---|---|---|---|---|
| `PK304L…` | `Laad` | 25 ST | 25 ST | 0 ST | 3000 | 1500 | 2 | 1 766,25 | `112770` | `26AOSG` |

### `Inkoopleveringen` — the deliveries it could have come from

Supplier **`APERAM Stainless Services &`**, picked through a `…` field.

| Inkooporder | Orderregel | Leverancier code | Ontvangst | L | B | Hvh(w) | kg(w) | Charge |
|---|---|---|---|---|---|---|---|---|
| `403773` | `10` | `13660` | 7-8-2026 | 3000 | 1500 | **23** | **1 610** | `112770` |
| `403773` | `10` | `13660` | 7-8-2026 | 3000 | 1500 | **25** | **1 754** | `112770` |

🔑 **The receival grain, proved again from a third direction.** One purchase
line — `403773/10` — arriving as **two instalments**, 23 pieces and 25 pieces,
both on the same date, both carrying the same heat number. `23 → 1 610 kg` is
70,0 kg/piece; `25 → 1 754 kg` is 70,16 kg/piece. The weighed figures differ per
instalment because each was weighed separately.

🔑 **`kg(w)` is the weighed kilo and it is what the lot carries as
`Gewogen gewicht`** — 1 754, matching §2 exactly. The theoretical 1 766,25 comes
from the article.

### `Partijkenmerken` — only three fields are yours

| Field | Value | Editable |
|---|---|---|
| `Inkooporder` | `403773` | greyed |
| `Lengte` / `Breedte` | `3000` / `1500,0` | greyed |
| `Ontvangstdatum` | `7-8-2026` | greyed |
| `Binnenmaat` | — | greyed |
| **`Charge`** | **`112770`** | ✏️ |
| `Gewicht` | `1766,25` | greyed |
| **`Fabrieksnummer`** | *(empty)* | ✏️ |
| `Coilnummer` | — | greyed |
| `interne charge` | `26AOSG` | greyed |
| `Coilvolgnummer` | — | greyed |

🔑🔑 **`Charge` and `interne charge` are two different identities.**
`112770` is the **supplier's** heat number, stamped by the mill. `26AOSG` is
**ours**, generated on receipt. Everything else on the panel is read off the
purchase line and cannot be touched — so batch registration is not data entry,
it is **choosing which delivery a lot came from** and typing the number off the
certificate that came with it.

`OK` is **enabled** here, unlike every other dialog, because `Charge` is already
filled.

---

## 6. `Splits` — the lot split, with a weight box

Title: `Splits voorraad`.

Header block, same shape as `Verplaatsen` but counting what may be split:

```
Beschikbaar en splitsbaar:      0
Gereserveerd en splitsbaar:    25
Totaal splitsbaar:             25
```

🔑 **A reserved lot can be split**, same as it can be moved.

Fields — and note what is *missing* against `Verplaatsen`:

| | |
|---|---|
| `Interne charge` / `Bundel` | greyed |
| `Hoeveelheid` | Pieces · ☐ `Ind. reserveringen` |
| **`Gewogen gewicht`** | **`0,000`** |
| `Naar locatie` | `-leeg-` with `…` |
| ~~`Reden`~~ | **absent** |
| ~~`Uitvoerdatum`~~ | **absent** |

🔑 **It has a `Gewogen gewicht` box** — which vindicates the weight box we
invented for our own split. A split is *"take N pieces off this lot, weighing
this much, and put them there"*, and the weight is stated rather than
apportioned, because the pieces coming off get weighed.

🔑 No reason and no execution date, so unlike `Verplaatsen` a split is
**immediate** — it is not planned warehouse work, it happens when you press OK.

⚠️ **The group header still reads `Verplaatsen`** — a reused panel in the
reference, not a meaning. Don't read anything into it.

⚠️ **This is not H13.** This is `Splits` on a **lot**. H13 is `Split` on a
purchase order's **`Receipts`** panel, which divides a *reception* into
instalments. They are different dialogs on different objects. This capture tells
us the shape the reference likes — a movable/splittable ledger on top, a
quantity and a weighed weight below — but **H13 is still open.**

---

## 7. `Opties bewerken` → **J5 reopens, and the certificate is found**

Title: `Voorraad opties`. Grid `Optie · Specificatie · Status`, **empty** on this
lot. Below it a `Toevoegen` block: `Optie` dropdown, `Specificatie` dropdown,
`Toevoegen` button. `Opslaan` / `Annuleren`.

The `Optie` dropdown, both halves, **still scrolling in each**:

```
UV Foil            Pickling
Brushing           Remove Foil
Punching           Kanten
Embossing          Duplo
Papier verwijderen Slitting
2.1 Certificate    Stempelen
Coating            Laser
```

🔴 **J5 was wrong and must reopen.** It recorded six options from the *product*
panel — `Duplo · Decoilen · Grinding · Brushing · ShearCut · Laser Foil` — and
flagged `Knippen` as a missing seventh. Here are **fourteen**, and the two lists
barely overlap: `Decoilen`, `Grinding`, `ShearCut`, `Laser Foil` and `Knippen`
are **not** in this one, while `UV Foil`, `Punching`, `Embossing`,
`Papier verwijderen`, `2.1 Certificate`, `Coating`, `Pickling`, `Remove Foil`,
`Kanten`, `Slitting`, `Stempelen` and `Laser` are new.

So there are **two different lists**:

- the **product's** `Options` panel — what this *article* can have done to it,
  each row carrying a status (`Possible`)
- the **lot's** `Voorraad opties` — what has actually been done to *these
  pieces*, each row carrying an `Optie`, a `Specificatie` and a `Status`

Nineteen distinct members are now known across both, and both dropdowns were
still scrolling. **Our `options` enum is incomplete and our model is wrong** —
we treat options as a column; they are rows on a lot, with a specification.

🔑🔑 **`2.1 Certificate` is in the list.** That is the certificate, and it is
modelled as an **option on a lot** — not a field on a batch, not a document.
This resolves the contradiction 4b was going to chase across 2 910 batch rows:
the batch screen's certificate columns are empty because **certificates were
never recorded there**. EN 10204 **2.1** is the declaration of compliance, which
fits an option exactly — it is a thing you ask for, not a file you attach.

---

## 8. The two pickers

### `Locatie zoeken` — locations are a tree under one warehouse

Opened from `Naar locatie` on both `Verplaatsen` and `Overboeken`. Two tabs,
`Zoek` and `Magazijn`, a depth toolbar reading `1` `2`, and a tree with a single
expandable root:

```
00 Hego Almere
```

So **one warehouse**, locations nested beneath it, and a numbered depth — which
matches `Laad`, `9B`, `SC` being siblings at one level.

### `Voorraad` — the stock search, reached from `Naar Artikel`

The same dialog our product-picker rule is built on, and it carries more than we
show:

- **Filters:** `Artikelcode` · `Zoekcode` · `Bedrijf` (greyed) · `Productgroep` ·
  `Kwaliteit` · `Bewerking`, plus `Lengte` / `Breedte` / `Dikte` as
  `Van` → `Tot en met` with ☑ **`Met marges zoeken`** at **5 %** each
- ☑ **`Alleen artikelen met technische voorraad`** · ☐ `1e keus` · ☐ `2e keus`
- **Article grid:** `Artikel · Kwaliteit · Vrd. cat. · Opties · Lengte · Breedte
  · Dikte · Technisch · Gereserveerd · Beschikbaar · Kg (t…) · Kg (g…) ·
  Kg (b…) · Totale lengte · C. Kg · C. ST`
- a live filter chip reading **`TotalPhysicalStock ≠ 0`** with `Edit Filter`
- `Gebruik geselecteerde artikel` (greyed until a row is picked)
- **three source tabs: `Voorraad` · `Inkoop` · `Interne productie`**
- **Lot grid:** `Order hvh. · Lengte · Breedte · Dikte · Technisch ·
  Gereserveerd · Beschikbaar · Ongeopend · Kg (bes…) · Opties · Opmerking ·
  Kwaliteit · GIP · Inkoopprijs · Interne … · Vrd. cat.`
- footer `Charge · Interne charge · Locatie · Inkoop`
- buttons `Reset dialoog · Standaard instellingen · Reserveringen… · Annuleer`

🔑 **`Reserveringen…` is a button on the search dialog itself** — you can inspect
a lot's reservations before choosing it.

🔑 The three tabs are `Voorraad` / `Inkoop` / `Interne productie` — stock,
purchase, internal production — matching H5's finding that goods are sold before
they arrive.

---

## 9. `Voorraadlabel` — printing

Title: `Selecteer type voorraadlabel en aantal`.

`Type Vooraadlabel` has two values: **`Label`** and **`Sticker`**. Then
⦿ `Aantal (per regel)` with a count defaulting to `1` `stuk(s)`, and
☐ `Gebruik printers op locatie` — *use the printers at the location*, which
implies printers are configured per warehouse location.

---

## 10. Two things the location screen gave away

The `Laad` location record behind the dialogs:

- `Naam: Laad` · `Locaties van: Laad` · `Pickvolgorde: 0`
- ☐ `Geblokkeerd`, with **`Reden: Location type setting`** greyed out
- ☑ **`Geblokkeerd voor optimalisatie`**, highlighted amber
- ☐ `Beperkte afmetingen`
- panels below: `Klantvoorraad` · `Telinstellingen` · `Documents — 0 Documents`

🔑 `Reden: Location type setting` greyed confirms **blocking follows from the
location's type** — it is not chosen per location, which is what
`project_stock_lot_model` already recorded.

🔴 ~~The status bar reads `Batchscheduler is actief.`~~ **Wrong — corrected
6-10-2026.** Read again at 16:22 the next day, on the purchase-order screen, the
status bar reads **`Batchscheduler is niet actief.`** — *not* active. The
negation was missed the first time.

So nothing changed and nothing needs re-checking: the scheduler is **off**, as
every earlier capture said, and K10 stands exactly where it was. The AFAS open
posts are stale, which is still the best explanation for every held order
reading 496–614 days overdue.

⚠️ Also noted: the build is now **3.13.0.512**, against **3.13.0.508** recorded
on 5-10-2026. The application is being updated under us, so a version is worth
reading off the status bar with each capture.

---

## What this capture did **not** answer

- the header's **`Price` dropdown** (reads `Algemeen`) — still owed for J7
- **`Use StockOp for this product?`** on `PK304L20021`, `PK316L40021`, `SC304`,
  `CK3040010` — still owed for J3
- **H13** — the `Split` on a purchase order's `Receipts` panel, which is a
  different dialog from §6

---

## ✅ §7 completed — the options list, end to end (6-10-2026)

The `Optie` dropdown on `Voorraad opties`, scrolled from top to bottom. **27
members**, in the reference's own order:

```
 1 UV Foil              10 ShearCut            19 Anodizing
 2 Brushing             11 Rolling             20 3.1 Certificate
 3 Punching             12 Zagen               21 Pickling
 4 Embossing            13 Paper interleaving  22 Remove Foil
 5 Papier verwijderen   14 Laser Foil          23 Kanten
 6 2.1 Certificate      15 Decoilen            24 Duplo
 7 Coating              16 Stempels wassen     25 Slitting
 8 Blue Foil            17 Polished            26 Stempelen
 9 Grinding             18 Perforate           27 Laser
```

The 5-10 capture caught 14 with the list still scrolling. **Nine were missing
from our enum**: `Blue Foil`, `Rolling`, `Zagen`, `Paper interleaving`,
`Stempels wassen`, `Polished`, `Perforate`, `Anodizing` and — the important one
— **`3.1 Certificate`**.

### 🔑🔑 `3.1 Certificate` sits beside `2.1 Certificate`

EN 10204 **3.1** is the inspection certificate carrying actual test results,
signed by the mill's own inspector. It is the one customers specify and the one
that costs money; 2.1 is only a declaration of compliance.

**Both are options on a lot.** That closes the certificate question for good:
there are two grades of certificate, neither is a field on a batch, and that is
why every certificate column on the batch screens is empty. A certificate is
something you *ask for*, and the reference models it as processing.

### 🔑 `Knippen` is **not** in the lot's list

27 members and `Knippen` is not among them — `Zagen` (sawing) is there instead.
But `Knippen` is attested in real batch data
([batch-registration.md](batch-registration.md)), so it is either on the
product's list only, or historic. Kept in the enum; removing it would make
existing batch rows unreadable.

### 🔴 `Status` is **derived, not chosen** — the model was wrong

Adding `Remove Foil` produced a row reading:

| Optie | Specificatie | Status |
|---|---|---|
| `Remove Foil` | *(empty)* | **`Toevoegen`** |

*"Toevoegen"* is literally **"to add"** — the same word as the button that
created the row. And the `Toevoegen` block has **no Status field at all**, only
`Optie` and `Specificatie`.

So the grid is an **edit buffer**: `Opslaan` commits it, `Annuleren` throws it
away, and `Status` reports the **pending edit** rather than the state of the
metal. Our first model — `possible` / `requested` / `done`, a work lifecycle —
was wrong and has been replaced.

| Value | Evidence |
|---|---|
| `possible` | ✅ the **product's** panel, every row |
| `to_add` | ✅ the **lot**, on a staged row |
| `to_remove` | ⚠️ inferred from `Verwijder geselecteerde optie` + its confirm |
| `applied` | ⚠️ inferred — what a **saved** row reads. Never seen |

⚠️ **One capture settles the last two**, and it is the only thing still owed
here: add an option, press **`Opslaan`**, reopen `Opties bewerken`, and read the
Status of the saved row.

### `Specificatie` is a dropdown, and it was empty

Empty for `Remove Foil`. It is a **dropdown, not free text**, so its values are
constrained — and `Specificatie = K320` is recorded elsewhere against
*Slijpen*/Grinding, so the list is **per option** and most options have none.
⚠️ Ours stores free text, which is the safe side of a list nobody has read in
full.

### Two smaller things

- **`Verwijder geselecteerde optie` asks `Weet je dit zeker?`** before removing
  a row. Ours deleted silently; it now confirms.
- The product's `Opties` panel shows `Duplo · Decoilen · Grinding · Brushing ·
  ShearCut · Laser Foil`, all `Possible`, **with a scrollbar** — so the product
  list is longer than six and is still not fully read. It is a different list
  from the lot's, which is why one table carries both and keys them by which of
  `stockUuid` / `productUuid` is set.
