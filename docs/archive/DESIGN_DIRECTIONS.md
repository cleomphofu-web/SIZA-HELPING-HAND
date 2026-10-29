SUPERSEDED by docs/SIZA-v2-spec.md and docs/copy-deck.md. Do not follow.

# SIZA landing-page directions

These are two distinct directions for the final landing-page treatment. No direction is selected yet.

## Direction A — The yellow register

The page is organised as a sequence of oversized editorial “registers”: a black hero, a yellow vetting proof band, an off-white booking explanation, and a black payment close. The two lines under the SIZA mark become the consistent horizontal rule between registers. The Z diagonal appears only at the boundary between the proof band and the booking explanation.

Motion is restrained and typographic. On reveal, the two-line rule extends from the logo’s width into the section. Numbers in the vetting checklist advance as a compact progress bar. Buttons lift by a few pixels on interaction. The hero stays calm: the supplied wordmark and CTA fade in over the poster/video scrim.

### Rough sketch

```text
┌────────────────────────────────────────────┐
│ BLACK / poster-video                       │
│ siZa                         How it works  │
│                                            │
│                         SIZA               │
│ Vetted cleaners...       [REQUEST A CLEAN] │
├════════════════════════════════════════════┤  two-line motif
│ YELLOW / HOW WE VET                        │
│ Vetted means the full checklist is done.   │
│ 01 ───────── 02 ───────── 03               │
└────────────────────────────────────────────┘
             ╱ Z-angle boundary
┌────────────────────────────────────────────┐
│ OFF-WHITE / HOW IT WORKS                   │
│ Request → SIZA assigns → pay directly      │
└────────────────────────────────────────────┘
```

## Direction B — The offset itinerary

The page reads as a strong vertical itinerary. The hero is a compressed black field with the wordmark offset to one side. Subsequent sections deliberately alternate their alignment: a narrow left rail for the process, a wide right-hand proof block for vetting, and a payment statement crossing the grid. The layout feels more kinetic while preserving a single reading order on mobile.

Motion uses the Z diagonal as an occasional directional wipe between the itinerary stages. The two-line motif becomes the step indicator beside the process rail. Reveals move blocks upward with opacity only; no scroll-linked transforms or decorative looping motion are used.

### Rough sketch

```text
┌────────────────────────────────────────────┐
│ BLACK                                      │
│ siZa                         [menu]        │
│              SIZA                          │
│              Vetted cleaners...            │
│              [REQUEST A CLEAN]             │
└────────────────────────────────────────────┘
┌──────────────┬─────────────────────────────┐
│ 01           │ Request a clean              │
│ ══           │                             │
│ 02           │ SIZA assigns an approved    │
│ ══           │ cleaner                     │
│ 03           │ Payment is direct            │
├──────────────┴─────────────────────────────┤
│             ╱ Z wipe                       │
│ YELLOW      HOW WE VET / proof              │
└────────────────────────────────────────────┘
```

## Selection gate

Superseded for the current implementation by the approved Framer-driven monochrome public-site direction. The original yellow-register and offset-itinerary directions remain as historical references only.
