# Concept Prototype Report: 冰箱爆仓了

> **Date**: 2026-06-21
> **Prototype Path**: HTML
> **Concept File**: design/gdd/fridge-overflow-game-concept.md

---

## Hypothesis

If the player drags shaped food into a 6x8 fridge grid and clears adjacent groups of three matching foods, the five-second conveyor will create readable pressure and satisfying rescue moments. We will know this is true if the player understands placement within 5 seconds, feels pressure before overflow, and intentionally sets up clears to recover space.

---

## Riskiest Assumption Tested

The biggest risk was whether shaped grid placement plus adjacent three-clear would be readable and satisfying on mobile. The prototype confirmed the core assumption: after difficulty tuning, the user reported that late-game pressure was obvious, and the strongest moment was nearly failing to place food, then recovering through a just-in-time three-clear.

---

## Approach

Built a single-file HTML prototype focused on one loop: drag a shaped food item into the fridge, manage limited grid space, and clear adjacent groups of three matching foods before conveyor pressure causes overflow.

**Path chosen:** HTML
**Reason for path:** This is a logic and readability prototype for a puzzle / light arcade H5 concept. The main question is rule clarity and pressure pacing, not native action feel.

**Shortcuts taken (intentional):**
- Inline HTML, CSS, and JavaScript in one throwaway `prototype.html`.
- Placeholder food visuals using colors, labels, and simple rectangles.
- Hardcoded board size, food pool, scoring, pressure, and difficulty values.
- No asset pipeline, save data, audio, menus, power-ups, or production architecture.
- Prototype code is not intended to be reused in production.

---

## Result

The hypothesis was confirmed in this prototype pass.

Observed playtest signals:

- The initial mobile pass felt too easy, so progressive difficulty was added.
- Difficulty was still too low, so the food set was expanded to 7 total types with 5 active at start and larger foods unlocking over time.
- The final late-game tuning made pressure obvious.
- The best observed moment was a near-fail placement followed by a just-in-time three-clear that rescued the board.
- No major frustrating, confusing, or broken moment was reported in this pass.
- No unexpected positive or negative surprise was reported in this pass.

The most important signal is that clearing did not act as abstract scoring only. It produced the intended rescue moment by freeing space when the board was close to failure.

---

## Metrics

| Metric | Value |
|--------|-------|
| Path used | HTML |
| Iterations to playable | N/A for HTML path; 3 difficulty tuning passes after first playable |
| Prototype duration | Same-session concept prototype and tuning pass |
| Playtesters | 1 internal |
| Feel assessment | Late-game pressure became obvious; a near-fail into just-in-time three-clear created the intended rescue feel |
| Hypothesis verdict | CONFIRMED |

---

## Recommendation: PROCEED

Proceed to formal design. The prototype validated the core pressure loop: shaped placement creates spatial tension, the conveyor timer creates urgency, and adjacent three-clear can rescue the board in a way that feels meaningful. The next design work should preserve this relationship between pressure and space recovery rather than treating clearing as only a score event.

---

## If Proceeding

What the prototype revealed for GDD writing:

- **Core tuning values discovered:** `6x8` grid, 7 total food types, 5 active at start, 20-second difficulty steps, 2x2 soup pot introduced after 20 seconds, 3x1 frozen fish introduced after 40 seconds, late pressure ramp from 60 seconds onward, and conveyor timing that can drop from 5 seconds to about 2.7 seconds.
- **Assumptions confirmed:** The player can understand drag-to-pack quickly; larger shapes create the intended "will this fit?" pressure; same-food adjacent three-clear can create a satisfying rescue moment; late-game pressure became readable after tuning.
- **Assumptions disproved:** The first difficulty pass was too easy for mobile play; the initial food variety and late-game pressure needed to be higher.
- **Emergent mechanics:** Players can intentionally preserve or create adjacency opportunities as an emergency space-recovery plan. This should become a formal skill target in the MVP.

**Next steps:**
1. `/design-review design/gdd/fridge-overflow-game-concept.md`
2. `/gate-check`
3. `/art-bible`
4. `/map-systems`
5. `/design-system core-loop`

---

## If Pivoting

Not applicable. The verdict is PROCEED.

---

## If Killing

Not applicable. The verdict is PROCEED.

---

## Lessons Learned

- **What assumptions were broken by actually building this?**
  The first playable difficulty was too easy on mobile. The prototype needed more starting variety, a clearer timed ramp, and stronger late-game pressure.

- **What surprised us that did not show up in the brainstorm?**
  No new surprise was reported during this playtest pass.

- **What would we test differently next time?**
  Run a first-time tester session focused on onboarding clarity, then a separate 2-3 minute survival test focused on whether late pressure and rescue moments repeat reliably.

---

> *Prototype code location: `prototypes/fridge-overflow-core-loop-concept/`*
> *This code is throwaway. Never refactor into production.*
