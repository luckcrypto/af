# -*- coding: utf-8 -*-
"""
Twenty military aircraft.

Figures are published air-force / manufacturer numbers where those exist. Where a
value is classified or genuinely disputed between reputable sources it is marked
estimated in the spec note rather than presented as fact. Variable-geometry aircraft
(F-14, B-1B) are recorded at full span, with the swept figure noted.
"""

# slug, name, maker, cc, category, span, length, height, mtow, range, speed, ff, built, crew
FLEET = [
    # --- reconnaissance ---
    ("lockheed-sr-71-blackbird", "Lockheed SR-71 Blackbird", "Lockheed", "US", "Reconnaissance",
     16.94, 32.74, 5.64, 77111, 5400, 3529, 1964, 32, 2,
     "The fastest air-breathing crewed aircraft ever flown, and still unbeaten.",
     "Mach 3.2 cruise at 26,000 m. Titanium airframe that leaked fuel on the ground because the panels only sealed once heat expansion closed them in flight."),
    ("lockheed-u-2-dragon-lady", "Lockheed U-2 Dragon Lady", "Lockheed", "US", "Reconnaissance",
     31.39, 19.20, 4.88, 18600, 10300, 805, 1955, 104, 1,
     "A jet-powered glider that flies to the edge of space and is famously brutal to land.",
     "The 31 m wing gives it the aspect ratio of a sailplane. Pilots wear pressure suits and a chase car calls out height on landing."),

    # --- stealth ---
    ("northrop-b-2-spirit", "Northrop B-2 Spirit", "Northrop Grumman", "US", "Stealth bomber",
     52.43, 21.03, 5.18, 170600, 11100, 1010, 1989, 21, 2,
     "A flying wing with no fuselage and no tail — the most expensive aircraft ever built.",
     "Twenty-one built at roughly $2bn each. The tailless flying wing has no vertical surfaces at all, which is what makes it near-invisible to radar."),
    ("lockheed-f-117-nighthawk", "Lockheed F-117 Nighthawk", "Lockheed", "US", "Stealth aircraft",
     13.20, 20.09, 3.78, 23814, 1720, 1040, 1981, 64, 1,
     "The first operational stealth aircraft, faceted into shape by 1970s computers.",
     "Its flat panels exist because the era's radar-cross-section software could only solve flat plates. Subsonic and aerodynamically unstable without computer control."),

    # --- fifth generation ---
    ("lockheed-martin-f-22-raptor", "Lockheed Martin F-22 Raptor", "Lockheed Martin", "US", "Fighter",
     13.56, 18.92, 5.08, 38000, 2960, 2414, 1997, 195, 1,
     "The first fifth-generation fighter, and still the reference point for air superiority.",
     "Supercruises above Mach 1.5 without afterburner. Production stopped at 195 aircraft and the line was closed rather than exported."),
    ("lockheed-martin-f-35-lightning-ii", "Lockheed Martin F-35 Lightning II", "Lockheed Martin", "US", "Fighter",
     10.70, 15.70, 4.36, 31800, 2220, 1930, 2006, 1100, 1,
     "The most-produced stealth fighter, in three variants including a vertical-landing model.",
     "One airframe family covering conventional, carrier and short-takeoff roles. The B model lifts on a shaft-driven fan behind the cockpit."),
    ("sukhoi-su-57-felon", "Sukhoi Su-57 Felon", "Sukhoi", "RU", "Fighter",
     14.10, 20.10, 4.60, 35000, 3500, 2135, 2010, 32, 1,
     "Russia's first fifth-generation fighter, built around supermanoeuvrability.",
     "Three-dimensional thrust vectoring and a very large internal fuel load. Production numbers remain low and figures are largely Russian-published."),
    ("chengdu-j-20-mighty-dragon", "Chengdu J-20 Mighty Dragon", "Chengdu", "CN", "Fighter",
     13.01, 20.30, 4.45, 37000, 5500, 2100, 2011, 200, 1,
     "China's stealth fighter — a long-ranged canard delta built for the Pacific.",
     "The canard delta layout is unusual for a stealth design. Most published performance figures are Western estimates rather than released data."),

    # --- fourth generation ---
    ("mcdonnell-douglas-f-15-eagle", "McDonnell Douglas F-15 Eagle", "Boeing", "US", "Fighter",
     13.05, 19.43, 5.63, 30845, 5550, 2655, 1972, 1198, 1,
     "An air-superiority fighter with a combat record of over 100 kills and no losses.",
     "Thrust-to-weight above one meant it could accelerate vertically. Still in production fifty years on as the F-15EX."),
    ("general-dynamics-f-16-fighting-falcon", "General Dynamics F-16 Fighting Falcon", "Lockheed Martin", "US", "Fighter",
     9.96, 15.06, 4.88, 19200, 4220, 2120, 1974, 4600, 1,
     "The most widely exported fighter of the jet age, flown by more than 25 air forces.",
     "The first production fighter with a fly-by-wire system and a deliberately unstable airframe, which is what makes it so agile."),
    ("grumman-f-14-tomcat", "Grumman F-14 Tomcat", "Grumman", "US", "Fighter",
     19.55, 19.10, 4.88, 33720, 2960, 2485, 1970, 712, 2,
     "The swing-wing carrier interceptor — 19.5 m spread, 11.6 m swept.",
     "Wings sweep automatically with speed. Retired by the US Navy in 2006 and now flown only by Iran."),
    ("boeing-f-a-18-super-hornet", "Boeing F/A-18 Super Hornet", "Boeing", "US", "Fighter",
     13.62, 18.31, 4.88, 29937, 3330, 1915, 1995, 600, 1,
     "The backbone of US carrier aviation, doing fighter and strike work in one airframe.",
     "A substantially larger redesign of the original Hornet. The canted intakes and leading-edge extensions give it excellent low-speed handling."),
    ("sukhoi-su-27-flanker", "Sukhoi Su-27 Flanker", "Sukhoi", "RU", "Fighter",
     14.70, 21.94, 5.92, 30450, 3530, 2500, 1977, 680, 1,
     "The Soviet answer to the F-15, and the origin of a whole family of fighters.",
     "The blended fuselage generates lift across its whole length. Famous for the Pugachev's Cobra manoeuvre at air shows."),
    ("mikoyan-mig-29-fulcrum", "Mikoyan MiG-29 Fulcrum", "Mikoyan", "RU", "Fighter",
     11.36, 17.32, 4.73, 20000, 1430, 2400, 1977, 1600, 1,
     "A short-ranged front-line fighter designed to operate from damaged runways.",
     "Intake doors close on takeoff and roll to keep debris out, with louvres feeding air from above. Built for rough-field operation."),
    ("mikoyan-mig-31-foxhound", "Mikoyan MiG-31 Foxhound", "Mikoyan", "RU", "Interceptor",
     13.46, 22.62, 6.15, 46200, 3000, 3000, 1975, 519, 2,
     "A Mach 2.8 interceptor built to catch cruise missiles across Siberia.",
     "One of very few aircraft that can sustain Mach 2.35 in level flight. Carried the first operational electronically scanned radar."),
    ("eurofighter-typhoon", "Eurofighter Typhoon", "Eurofighter", "EU", "Fighter",
     10.95, 15.96, 5.28, 23500, 2900, 2495, 1994, 600, 1,
     "A four-nation canard delta built by Britain, Germany, Italy and Spain.",
     "Aerodynamically unstable by design and flyable only through quadruplex fly-by-wire. Exceptional climb and high-altitude performance."),
    ("dassault-rafale", "Dassault Rafale", "Dassault", "FR", "Fighter",
     10.80, 15.27, 5.34, 24500, 3700, 1912, 1986, 250, 1,
     "France's omnirole fighter — one airframe for air defence, strike and carrier work.",
     "France left the Eurofighter programme to build it, largely because it needed a carrier-capable aircraft. Close-coupled canards sit ahead of the delta."),
    ("saab-jas-39-gripen", "Saab JAS 39 Gripen", "Saab", "SE", "Fighter",
     8.60, 15.20, 4.50, 16500, 4000, 2470, 1988, 270, 1,
     "A light fighter designed to fly from Swedish public roads with conscript ground crews.",
     "Turnaround by six people in ten minutes, from a 800 m stretch of road. The smallest wingspan of any modern fighter."),

    # --- bomber and attack ---
    ("rockwell-b-1b-lancer", "Rockwell B-1B Lancer", "Boeing", "US", "Strategic bomber",
     41.80, 44.50, 10.36, 216400, 9400, 1335, 1974, 104, 4,
     "A swing-wing supersonic bomber carrying the largest payload in the US fleet.",
     "Wings spread to 41.8 m for takeoff and sweep to 24.1 m for high-speed dash. Carries more ordnance than any other American aircraft."),
    ("fairchild-republic-a-10-thunderbolt-ii", "Fairchild Republic A-10 Thunderbolt II", "Fairchild Republic", "US", "Attack aircraft",
     17.53, 16.26, 4.47, 23000, 4150, 706, 1972, 716, 1,
     "An armoured gun platform built around a 30 mm cannon the size of a car.",
     "The airframe was designed around the GAU-8 Avenger. Titanium bathtub around the cockpit, and engines mounted high to survive ground fire."),
]

print(f"{len(FLEET)} military aircraft defined")
