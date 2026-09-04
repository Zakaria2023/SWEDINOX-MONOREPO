# Exports from the reference system

Drop `Save as Excel` exports from easy2trade here, one file per screen, named
after the screen (`order-advice.xlsx`, `products.xlsx`, …).

Two things to get right before exporting, or the file is misleading:

1. **Widen every filter first.** A legacy grid exports what is on screen, so a
   narrow `from`/`u/i` pair exports a subset without saying so.
2. **The export carries the current `View`'s columns.** A column hidden in the
   active view is absent from the file, not blank in it.

Contents are gitignored — see `.gitignore`.
