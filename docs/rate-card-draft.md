# SIZA rate card: DRAFT starting point (validate before the pilot)

These are starting hypotheses, not facts. The statutory minimum wage is R30.23 an hour since 1 March 2026 (it applies to employees; SIZA cleaners are independent, but it is a useful floor). SweepSouth's published data had its cleaners averaging about R33.71 an hour in 2025, and cleaners there keep 80 to 96% of the fee. The draft below pays clearly above both. Replace every number after the validation step.

## 1. Pay per cleaner per hour (what the cleaner receives)
| Service | R per hour |
|---|---|
| Standard clean | 50 |
| Deep clean | 60 |
| Airbnb turnover | 55 |
| Post-construction clean | 65 |

## 2. Labour time estimate (total minutes of work for the whole job)
| Item | Minutes |
|---|---|
| Standard: base | 90 |
| Per bedroom | 40 |
| Per bathroom | 30 |
| Deep clean | standard total x 1.6 |
| Airbnb turnover: base | 60 |
| Airbnb turnover: per bedroom (includes bed linen) | 30 |
| Airbnb turnover: per bathroom | 30 |
| Add-ons: oven 30, fridge 20, inside windows (per bedroom) 15, laundry (per load) 20, ironing (per basket) 30, balcony 15 | as listed |

Rules: split the total minutes across the number of cleaners, round up to the nearest half hour, and apply a **minimum of 3 hours per cleaner** so a trip is worth making.

## 3. Transport allowance per cleaner (round trip) by zone: PLACEHOLDERS
| Zone | Meaning | R |
|---|---|---|
| A | same or next suburb | 30 |
| B | up to about 15 km | 60 |
| C | about 15 to 35 km | 100 |
| D | long distance (for example Johannesburg to the Vaal) | 180 |
These are guesses. Taxi and e-hailing fares differ by route: ask three cleaners in each pilot suburb what their real round trip costs and use those.

## 4. Worked example
2-bedroom, 1-bathroom standard clean, one cleaner: 90 + 80 + 30 = 200 minutes, rounded to 3.5 hours. Pay R50 x 3.5 = R175. Add zone B transport R60. Cleaner receives R235; the host sees the same total (a Phase B service fee would be shown on top).
Same job, two cleaners: 100 minutes each, raised to the 3-hour minimum: R150 pay plus R60 transport each, R420 in total.

## 5. Validate before launch (two quick rounds)
1. Ask 5 cleaners in each region: "What is the lowest you would accept for this job, including getting there?"
2. Ask 5 hosts: "What would you pay for this job?"
Adjust hourly rates, minutes, minimum hours and transport zones. If hosts will not pay the recommended total, lower the estimate minutes or raise efficiency before cutting pay.
Keep `floor_percent` at 100% at first. Review the card monthly from pilot data (declined jobs, overruns, no-shows).

## 6. Suburbs and regions
Seed a `suburbs` list with `region` (Johannesburg or Vaal), zone, and `enabled`. A suburb opens to hosts only when it has at least 3 approved cleaners.
