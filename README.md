# GROK DASH

A 2.5D side-scrolling platformer (three.js) mixing Sonic Superstars speed with Rayman-style bouncy platforming.
5 worlds, 20 levels + 5 bosses + 5 bonus stages, 4 heroes, online co-op & race for up to 3 players (grok-net / PeerJS).

Run locally: `python3 -m http.server 8000` and open http://localhost:8000/

## DLC: Super Sonic Pack (Expansion, from the Grok Arcade DLC Machine 3000, idea #14)
Unlocks when `localStorage['grokDLC.dash.super_sonic_pack_expansion']` is set (the arcade's DLC Shop does this, same origin). It turns on live, no reload needed.
Until then the title screen, world map (DLC W6/W7 tabs), Super/Metal skins and BOSS MODE button all show a locked teaser that links to the arcade.
- **World 6: Sunset Speedway**: boost lanes, loops, rails and quarter-pipes under a giant sunset, with palm trees, overpasses and traffic cones. 4 stages + boss **Roller Rex** (4 hits; he rolls into a spiky ball and charges) + bonus stage.
- **World 7: Starlight Carnival** (opens after Roller Rex): ferris wheels, circus tents, balloons and coaster tracks at night. 4 stages + bonus stage + the **MEGA boss GIGA GRUMBOT**: 8 hits, 3 phases, mixing every attack from the base game (shockwave leaps, slams, tyre throws, charges, zap beams, rocket hover).
- **Super + Metal skins** for all 4 heroes: Super skins glow with a sparkling aura (with speed trails), Metal skins are shiny chrome with a visor and a jet.
- **BOSS MODE** (title screen): *you* are GIGA GRUMBOT vs 3 CPU heroes (Grok, Speedy, Floaty, 4 hearts each). Move = stomp, JUMP = big leap + shockwave, ATTACK = zap beam (in the air it's a bomb drop), DASH = rocket charge. Every attack adds HEAT; overheat (or bonk a wall) and you go dizzy so the heroes can bop you. KO all 3 heroes within 2:30 to win.
- Online: if the **host** owns the pack, friends in the room can play the DLC levels the host picks (and try the skins) for that session. Boss Mode is single player.
