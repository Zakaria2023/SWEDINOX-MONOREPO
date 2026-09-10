# Locations

`Overviews → Logistics → Locations`. Ours: **nothing** — there is no locations
table at all. `Stock.locationUuid` is a bare `char(36)` with no foreign key and
no table behind it, and the same is true of `WarehouseWorkOrderLines`'
`fromLocationUuid` / `toLocationUuid`.

**9-9-2026 export**: `View` = `-empty-`, `Show in Excel` →
`exports/locations.tsv`, **1 940 rows × 11 columns**.

⚠️ **This screen is not translated** — every header comes back in Dutch, unlike
every other Logistics overview.

| Dutch                            | English                                           |
| -------------------------------- | ------------------------------------------------- |
| `Locatie naam`                   | Location name                                     |
| `Subsectie naam`                 | Subsection name — **the parent**                  |
| `Magazijn naam`                  | Warehouse name                                    |
| `Pickvolgorde`                   | Pick sequence                                     |
| `Sorteer volgorde`               | Sort order                                        |
| `Locatie soort`                  | **Location type**                                 |
| `Voorkeurslocatie Artikelcode`   | Preferred-location product code                   |
| `Artikelomschrijving`            | Product description                               |
| `Lengte` / `Breedte`             | Length / Width                                    |
| `Aanvullocatie voorkeurslocatie` | Replenishment location for the preferred location |

---

## Locations are a three-level tree

`Subsectie naam` is not a flat section label — it is the **parent location**, and
it recurses. `10A-1`'s parent is `10A`, whose parent is `10`.

```
41 top-level sections   (named in Subsectie naam, but NOT rows in this export)
      └── 330 subsections
                └── 1 610 locations
```

Of the 1 940 rows, **162 are somebody's parent** and **1 778 are pure leaves**.
Every row has a parent, and the 41 values that never appear as a row of their own
are therefore the true roots.

⚠️ This does **not** line up with the Warehouse capacity screen's _"17 sections
and 48 subsections"_. Two different groupings share the word _subsection_, and
which one the capacity screen books against is unresolved. See
[warehouse-capacity.md](warehouse-capacity.md).

### The 41 sections split into racks and functions

**Physical racks** — `01` `02` `03` `05` `06` `07` `08` `09` `10` `11` `12`
`2A` `2B` `2C` `4A`–`4F` `7V` `7W` `9R` `9V` `9W` `11A` `11B` `11C` `12A` `12B`
`REK`. Numbers and letters, ten-ish children each, leaves like `9R14`, `10A-7`,
`2B-10`.

**Functional groups** — and these are the interesting ones:

| Section                        | Children | What sits there                                                                                                                                                                                         |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Productie`**                | 17       | `Pick` · `Laad` · `Afhaal` · `Afroep` · `Ontvangst` · `Decoiler` · `Knip` · `Laser` · `Laser 1` · `Laser 2` · `Interne wzh` · `Opslag Laser 1/2` · `Opslag Knip` · `Opslag Slijpen` · `Opslag Decoilen` |
| **`Loonwerk`** _(subcontract)_ | 17       | `ALTUN` · `AS` · `AUSTENIT` · `B&A` · `BURGER` · `DECO` · `GEENEN` · `H&B` · `HEBELS` · `M&W` · `MARIO` · `OKS` …                                                                                       |
| **`Intern`**                   | 8        | `Fox` · `Blok` · `Buit` · `Buiten` · `Balie` · `Emballage` · `Roestv` · `-`                                                                                                                             |
| **`Transporteur`** _(carrier)_ | 3        | `ADO` · **`CUVELJE`** · `JONKER`                                                                                                                                                                        |
| **`Extern`**                   | 2        | `Bewerkers` · `Hego Productions`                                                                                                                                                                        |
| **`Import`**                   | 1        | `TRANSIT`                                                                                                                                                                                               |

Three things fall out of that:

1. **A location can be a company.** The 17 `Loonwerk` children and the 3
   `Transporteur` children are named after firms. So metal at an external
   processor or sitting on a haulier's yard is _stock in a location_, which is
   why `Levering To processor` and `Ontvangst From processor` are ordinary
   movements rather than a special case.
2. **`CUVELJE` is explained.** [stock-on-location.md](stock-on-location.md)
   recorded a saved view `Location = CUVELJE` returning **0 rows** and called it
   "a named location, currently empty". It is a **carrier's** location — empty
   because nothing is on their yard today.
3. **A machine is a location.** `Decoiler`, `Laser 1`, `Laser 2`, `Knip` are
   locations under `Productie`, and each has an `Opslag …` _(storage)_ sibling.
   So a work order's `To-location` of `Decoiler` names a place, and the machine
   and the place may be one record — which is exactly what
   [machines-and-small-screens.md](machines-and-small-screens.md) still needs
   settling.

---

## 🔴 `Locatie soort` came back blank on all 1 940 rows

The column exists and it is **empty on every single row** — while
`Stock on location` reports a `Location type` on every lot (`Pick` 1 934, `Laad`
168, `Bulk` 45, `Bewerker` 36, `Schroot` 27, `Productie` 23, `Afroep` 12,
`Afhaal` 2).

**I tried to derive it from the tree and it does not work.** The obvious
hypothesis — that the type is the ancestor section — fails immediately:

| Location    | Its parent     | Type per the stock export |
| ----------- | -------------- | ------------------------- |
| `Fox`       | `Intern`       | **`Pick`**                |
| `Ontvangst` | `Productie`    | _(no lots)_               |
| `Bewerkers` | `Extern`       | **`Bewerker`**            |
| `CUVELJE`   | `Transporteur` | _(no lots)_               |

`Fox` is the clincher: it hangs off `Intern`, and its lots are typed `Pick`. And
`Pick`, `Afroep`, `Afhaal` and `Laad` are themselves _locations_ under
`Productie`, not types.

So `Locatie soort` is a genuine stored attribute that this export does not
populate — confirmed below by opening one.

## ✅ Answered: open a location with `Toon locatie` (right-click)

A location cannot be double-clicked. **Right-click a row → `Toon locatie`**
(_show location_) — the same menu also offers `Print locatie label`. That is why
the screen looks actionless.

The detail screen of the location named `-` (a child of `Intern`):

| Field                      | Value                                        |
| -------------------------- | -------------------------------------------- |
| `Name`                     | `-`                                          |
| **`Location type`**        | **`Pick`** — a dropdown, and it is populated |
| `Picking sequence`         | `0`                                          |
| `Blocked`                  | ☐ **with its own `Reason` dropdown**         |
| `Blocked for optimization` | ☐                                            |
| `Limited dimensions`       | ☐                                            |

So the type lives on the location exactly as expected, and the grid export
simply returns the column empty.

### 🔴 And the block lives on the **location**, not on the lot

The location carries `Blocked` **plus a `Reason`** of its own. That is the
mechanism behind
[stock-on-location.md](stock-on-location.md#location-type--eight-of-them-and-they-carry-the-block)'s
finding that all 36 `Bewerker` lots and all 12 `Afroep` lots are blocked: it is
not the _type_ that blocks them — **the location is blocked, and every lot on it
inherits that.** Those locations happen to be blocked because metal at an
external processor or on call-off is not ours to sell.

Two further flags on the location, both new:

- **`Blocked for optimization`** — the location's stock may be sold but must not
  be chosen by the nesting/sawing optimiser.
- **`Limited dimensions`** — the location cannot take anything; presumably the
  `Lengte`/`Breedte` columns are the limit.

### The location detail also carries the stock, and the actions

A `Stock` panel lists the lots on that location with a toolbar that reads like
the mutation-reason list from the other side:

`New` · **`Relocating…`** · `Restocking…` _(greyed)_ · **`Correction…`** ·
**`Scrapping…`** · **`Transfering…`** · **`Batch registration`** ·
**`Reservations…`** · `Stock label` · `Opties bewerken`

Those map one-for-one onto `Overboeking Transfer`, `Correctie Stock correction`,
`Schroot Scrap` and `Correctie Transfer length` — the four mutation reasons that
carry **no work order**, because a human does them from this screen. See
[stock-mutations.md](stock-mutations.md).

⚠️ **`Reservations…` is here** — the screen I have never seen, reachable from a
location.

Three columns the earlier export did not show, all on the lot rows:

| Column                | Value seen                                                   |
| --------------------- | ------------------------------------------------------------ |
| **`Plate no.`**       | blank on all four — the `Plaatnummer`, still never populated |
| **`Internal charge`** | `21GFFI` · `23EHGI` · `23DDGC` · `23CHJH`                    |
| **`Internal Bundle`** | `366558` · `384768` · `383362` · `382797`                    |

The internal charges confirm the format across three years — **two-digit year +
four characters** (`21…`, `23…`, and `25AAWO` / `25AELU` / `25ACKT` from the
receptions). And `Internal Bundle` is a six-digit series, matching the `389755`
seen on a warehouse work order.

All four lots there show `Purc… IO10…` — **sales-order origins**, i.e. remnants —
with suppliers `Madi…`, `Holland Stainless`, `Hyundai` and `Swedinox`. Which is
exactly the mix [stock-on-location.md](stock-on-location.md) reported: a remnant
we cut ourselves is supplied by us, one cut from bought metal keeps its mill.

Also on the location: an `Opti…` column reading **`Grind…`** on one lot, so a lot
carries its own processing options; plus `Customer stock`, `Count settings` and
`Documents` panels, and toolbar jumps to `Purchase lines`,
`Warehouse workorders`, `Orders and Quotes`, `Production workorders` and
`Transport workorders`.

---

## What is _not_ used here

- **`Pickvolgorde` is `0` on all 1 940 rows.** The pick sequence is unused, so
  picking is not route-optimised in this installation — worth knowing before
  building a pick-order feature nobody wants.
- **`Sorteer volgorde`** is `1` on 1 911 rows, with a thin tail of 2, 3, 4, 9,
  10, 11, 12.
- **Preferred locations barely exist** — 4 rows, and 3 of those read
  `Meerdere artikelen` _("multiple articles")_ with a blank product code, which
  is a display string rather than data. Only `Pick` names a real product
  (`6050015315T2`, an aluminium tear plate, 3000 × 1500).
- **`Aanvullocatie`** (replenishment location) is blank everywhere.

## Warehouses: one real, four junk

| `Magazijn naam`                  | Rows      |
| -------------------------------- | --------- |
| **`00 Hego Almere`**             | **1 936** |
| `Consignatie-OUD/OLD verwijderd` | 1         |
| `zakaria's location`             | 1         |
| `Pick location`                  | 1         |
| `Antwerpen`                      | 1         |

This confirms the earlier suspicion that there is effectively **one warehouse**.
`Antwerpen` holds a single location called `Test`, and `zakaria's location` and
`Pick location` are test rows created while exploring the system.

⚠️ **Do not import those four.** They are not data; three of them are ours.
