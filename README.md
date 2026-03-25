# 1RM Calculator

A minimal, installable web app for estimating your one-rep max (1RM) using the **Marzagão weight-dependent formula**.

[Click here to use it!](https://aaboyles.github.io/1rm-calculator/)

## What it does

Enter a lift, the weight you used, and how many reps you completed — the app estimates the maximum weight you could lift for a single rep. It also generates a percentage breakdown table for planning training intensities.

**Three tabs:**

- **Calculator** — enter weight + reps, get an estimated 1RM
- **% Table** — shows training weights at 50–100% of your estimated 1RM
- **My 1RMs** — history of saved lifts, persisted in `localStorage`

## The formula

This app uses the [Marzagão weight-dependent formula](https://sportrxiv.org/index.php/server/preprint/view/768) rather than the more common Epley or Brzycki formulas. The key difference: the rep-to-1RM relationship is adjusted based on the actual load, since heavier weights produce a different fatigue curve than lighter ones.

```
1RM = w × (1 + (r − 1)^0.85 / (−2.55 + 4.58 × ln(w)))
```

where `w` = weight lifted and `r` = reps performed.

The formula is undefined for very low weights (where the denominator approaches zero); the app displays `—` in those cases.

**Accuracy note:** Best results come from sets taken close to failure, ideally 3–10 reps. High-rep sets (15+) are less reliable because technique and fatigue become confounding factors before true muscular failure.

## Options

| Setting | Options | Default |
|---------|---------|---------|
| Unit | lbs / kg | lbs |
| Display | Round / Exact | Round |

**Round mode** floors the estimated 1RM to the nearest loadable increment (5 lb or 0.5 kg), so the result is always a weight you can actually put on the bar.

## Supported lifts

The autocomplete includes ~65 common exercises across squat, hinge, press, row, pull, and isolation patterns. You can type any lift name — it doesn't need to be in the list.

## Installation (PWA)

The app ships a web manifest and is installable as a Progressive Web App on both mobile and desktop. On iOS, use **Share → Add to Home Screen**. On Chrome/Edge, use the install prompt in the address bar.

No build step, no dependencies, no server required — just open `index.html`.

## Files

```
index.html      # App shell and markup
script.js       # All logic: formula, state, views, autocomplete
styles.css      # Styling
manifest.json   # PWA manifest
icon.png        # App icon (180×180)
icon.svg        # App icon (scalable)
```
