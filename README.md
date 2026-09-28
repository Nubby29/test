# Experience: Bible Stories

A simple **2D top-down, quest-driven RPG** where you play a character in the Bible.
You are the **first angel — Jehovah God's helper** — and you walk through the days
of creation, completing quests that lead to the canon events of Scripture.

**Chapter 1: God Made Heaven and Earth** ✅ · **Chapter 2: God Made the First Man and Woman** ✅ · **Chapter 3: Adam and Eve Disobeyed God** ✅ · **Chapter 4: From Anger to Murder** ✅ · **Chapter 5: Noah's Ark** ✅ · **Chapter 6: Eight Survive Into a New World** ✅ · **Chapter 7: The Tower of Babel** ✅ · **Chapter 8: Abraham and Sarah Obeyed God** ✅ · **Chapter 9: A Son At Last!** ✅ · **Chapter 10: Remember the Wife of Lot** ✅ · **Chapter 11: A Test of Faith** ✅ · **Chapter 12: Jacob Got the Inheritance** ✅ · **Chapter 13: Jacob and Esau Make Peace** ✅ · **Chapter 14: A Slave Who Obeyed God** ✅ — all completed. Each chapter's end screen continues seamlessly into the next (no reload), and the selector brings you back any time.

## How to play

No build step, no dependencies. Either:

- **Double-click `index.html`** (works from disk), or
- Serve the folder: `npx serve .` → open the shown URL.

### Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` / Arrow keys | Move |
| `E` / `Space` / `Enter` / any key | Talk, interact, advance dialogs & cutscenes |
| Mouse click (anywhere) | Advance dialogs & cutscenes |
| `1`–`9` | Start that chapter instantly from the chapter selector |

The game opens on a **chapter selector** — one card per chapter, generated from
`CHAPTERS[]` (future chapters appear automatically). Finished chapters get a
**✓ Completed** badge, saved in your browser via `localStorage`, so you can jump
straight into a later chapter any time.

### Chapter 1 quest chain

1. **The Creator Calls** — talk to Jehovah God on the hill
2. **Let There Be Light** — touch the Beacon of Light → *Canon Event: the sun's light shone on the earth* (the world visibly changes from dark to light!)
3. **Grass, Plants and Trees** — plant seeds in 3 patches of soft soil (trees grow as you plant)
4. **The Animals Arrive** — find the rabbit, lamb, elephant and bird and lead them into the meadow
5. **"Let Us Make Man"** — return to Jehovah → **letterbox cutscene** → Adam is created → Chapter Complete screen → **Continue to Chapter 2**

### Chapter 2 quest chain (Garden of Eden) — **you play as Adam**

1. **The Garden of Eden** — intro cutscene (*"Today, you are that man — Adam"*), then talk to Jehovah
2. **Adam Names the Animals** — walk to each of 4 animals and **give it its name yourself**
3. **The One Rule** — Jehovah gives **you** the rule beside the glowing **tree of the knowledge** → 🎞 *Canon Event: "If you eat fruit from that tree, you will die."*
4. **A Helper for Adam** — **letterbox cutscene**: you fall **asleep on screen** → rib → **Eve appears beside you** and follows you → Adam's happy quote → 🎞 *Canon Event: the first woman*
5. **The First Family** — finale blessing cutscene with Eve at your side (*"fill the earth… make it a paradise"*) → Chapter 2 Complete → **Continue to Chapter 3**

### Chapter 3 quest chain — **you play as Eve**

1. **A Voice in the Garden** — walk to the glowing **tree of the knowledge** → a **snake** speaks to you (its question, your answer, the lie — *"Was that true? No, it was a lie."*)
2. **The Tempting Fruit** — take the fruit → **letterbox cutscene**: you eat → 🎞 *Canon Event: Eve ate the fruit*
3. **Some for Adam** — find Adam, give him some → *"he knew… but ate anyway"* → 🎞 *Canon Event: Adam ate too* → **Adam follows you**
4. **Jehovah Questions Them** — *"why have you disobeyed?"* → Eve blames the snake, Adam blames Eve
5. **Put Out of the Garden** — **finale cutscene**: you & Adam are moved outside the **eastern gate** → **two glowing angels + a flickering sword of fire** appear at the entrance → the **Satan the Devil** reveal → 🎞 2 more canon events → Chapter 3 Complete

### Chapter 4 quest chain — **you play as Cain**

1. **The Offerings** — bring your gift to the **stone altar with its offering fire** → 🎞 *Canon Event: Jehovah was happy with Abel's offering, but not with Cain's*
2. **Jehovah's Warning** — Jehovah sees your anger: *"it could make you do something bad… But you did not listen."*
3. **Come to the Field** — find Abel in the pasture (sheep grazing!) → *"Come over to the field with me"* → **Abel follows you**
4. **Alone in the Field** — lead him into the south-east field → **zone-triggered cutscene**: the screen **fades to black**, narration only (handled tastefully) → Abel is gone → 🎞 *Canon Event: Cain attacked his brother*
5. **Jehovah Punishes Cain** — **finale**: `banish` (you are sent far away, never to return) → 🎞 *punishment* → the anger lesson (*"control our emotions before they control us"*) → 🎞 *Jehovah will always remember Abel* → *"God will bring Abel back to life when He makes the earth a paradise"* → Chapter 4 Complete

The **west wall of Chapter 4 is the still-guarded garden gate** from Chapter 3 — the angel guard physically blocks the way back, exactly as the story says.

### Chapter 5 quest chain — **you play as Noah**

1. **Jehovah's Command** — talk to Jehovah on the hill → 🎞 *Nephilim & the Flood decision* canon event
2. **Build the Ark** — work on 4 timber piles on the building field (*about 50 years of work*) — the **ark itself only appears once it is finished** → 🎞 *ark built exactly as told*
3. **Warn the People** — warn 3 villagers in the eastern village → they laugh and refuse to listen → 🎞 *no one listened*
4. **The Animals Arrive** — **13 animals**: 2 rabbits, 2 elephants, 2 birds (partners go **two by two**) and **7 sheep** — lead them all to the ark, where they **walk inside through the door**
5. **Into the Ark** — enter the ark → **finale**: everyone goes inside, Jehovah shuts the door → 🎞 *Noah's family entered the ark* → **40 days of rain** fall over the whole scene

### Chapter 6 quest chain — **you play as Noah**

1. **Look Through the Window** — you start **inside the ark**; look through its little window at the world covered by the Flood → 🎞 *Canon Event: the Flood covered the whole earth — only Noah and his family were safe*
2. **The Rain Stops** — look out of the window once more: the rain stops and the ark settles on the mountains → 🎞 *rain stopped, ark settled* (Jehovah does **not** appear yet — *"wait a little longer"*)
3. **Come Out of the Ark** — go to the **door of the ark** → it opens, everyone steps out, the waters dry up and dry land appears → 🎞 *water dried up, eight people stepped into a new world*
4. **Build an Altar** — out on the dry island, pile up the **stones** into an altar for Jehovah
5. **Offer a Sheep** — **take one of the sheep** and lead it to the altar → the offering → 🎞 *Noah's offering made Jehovah happy* → **finale**: the rainbow arcs over the mountains → 🎞 *first rainbow as His promise* → 🎞 *fill the earth again* → Chapter 6 Complete

### Chapter 7 quest chain — **you play as a builder of Babel**

1. **A City and a Tower** — talk to the **foreman** on the plain of Shinar: the builders plan a city and a tower whose top reaches heaven → 🎞 *Canon Event: the people decided to build a city and a tower that reached to heaven*
2. **Bricks for the Tower** — **take bricks from the brick pile** and carry them to the tower (3 trips)
3. **Higher and Higher** — **work at the three scaffolds** and raise the tower → then Jehovah confuses everyone's language → 🎞 *Jehovah confused the language of the builders*
4. **Nobody Understands** — climb the **hill** and talk to Jehovah God about the confusion → 🎞 *the city was called Babel — which means Confusion*
5. **Leave Babel** — go to the **city gate** and head out over the earth → **finale**: the builders put down their tools and scatter in every direction → 🎞 *people spread out and lived all over the earth* → Chapter 7 Complete

### Chapter 8 quest chain — **you play as Abraham**

1. **Jehovah Calls Abraham** — in the sandy city of **Ur**, listen to Jehovah God: *leave your home and your relatives* → 🎞 *Canon Event: Jehovah told Abraham to leave his home* → 🎞 *promised a great nation that blesses everyone*
2. **Pack for the Journey** — tell **Sarah, Terah and Lot** to pack their things (3 family members)
3. **The Long Road to Canaan** — follow the road east across the **river bridge** through the desert; walk into the land of Canaan → 🎞 *Abraham was 75 when his family arrived in Canaan*
4. **The Promise of the Land** — talk to Jehovah by the **great tree** → 🎞 *All this land I will give to your children*
5. **Old and Childless** — talk to **Sarah** → **finale**: they are old and have no children, but they trust Jehovah's promise → 🎞 *trusted in Jehovah's promise* → Chapter 8 Complete

### Chapter 9 quest chain — **you play as Abraham**

1. **Sarah's Wish** — talk to **Sarah** at the tent: *if my servant Hagar has a child, it could be like my own*
2. **Hagar Has a Son** — talk to **Hagar** → **Ishmael** is born → 🎞 *Canon Event: Hagar had a son, and Abraham named him Ishmael* (then, years later, three visitors appear under the great tree)
3. **Three Visitors** — meet the **three visitors (angels!)** under the great tree → 🎞 *a son next year* → 🎞 *Sarah laughed* — the visitors depart
4. **A Son Named Laughter** — go to the **tent** → Isaac is born → 🎞 *Abraham named him Isaac — which means Laughter* (Isaac appears in camp)
5. **Listen to Sarah** — talk to **Sarah** → **finale**: she asks to send Hagar and Ishmael away, and Jehovah says *listen to Sarah* → 🎞 *promises would come true through Isaac* → Chapter 9 Complete

### Chapter 10 quest chain — **you play as Lot**

1. **Which Way Will You Go?** — talk to **Abraham** at the crowded camp → 🎞 *Canon Event: Abraham and Lot separated — Abraham let Lot choose first* (unselfish!)
2. **Lot Chooses the Land** — go east to the **pleasant land** (water + green grass near Sodom) and choose it → 🎞 *Lot chose the land near Sodom* → the family moves to Sodom and two angels arrive
3. **The Warning** — talk to the **two angels** in Sodom → 🎞 *Hurry, get out — Jehovah will destroy it* → the angels rush the family onto the road
4. **Escape for Your Life!** — run south on the road to **Zoar** (don't look back!) → arrival → 🎞 *fire and sulfur destroyed Sodom and Gomorrah* (the cities keep burning on the horizon)
5. **Remember Lot's Wife** — talk to **Lot's wife** at Zoar → **finale**: she looks back and becomes a **pillar of salt** → 🎞 *Lot's wife looked back* → Chapter 10 Complete

### Chapter 11 quest chain — **you play as Abraham**

1. **The Hardest Command** — talk to **Jehovah** at the camp: *take your only son Isaac and offer him as a sacrifice* → 🎞 *Canon Event: Jehovah told Abraham to offer Isaac on Mount Moriah*
2. **Three Days to Moriah** — follow the road east into the mountains (zone trigger) → 🎞 *Abraham obeyed even though he did not understand* → the **two servants wait** at the mountain's foot
3. **Jehovah Will Provide** — talk to **Isaac** on the mountain path → 🎞 *Jehovah will provide it* (Isaac carries the firewood, Abraham the knife)
4. **The Altar on Moriah** — build the **altar** from the stones → the knife is raised → the **angel calls from heaven** → 🎞 *Do not harm the boy — your faith is proven* → a **ram appears** in the bushes
5. **The Ram in the Bushes** — **take the ram** → **finale**: sacrificed instead of Isaac → 🎞 *Abraham sacrificed the ram* → 🎞 *Jehovah called Abraham His friend and promised to bless all people through his family* → Chapter 11 Complete

### Chapter 12 quest chain — **you play as Jacob**

1. **A Son's Inheritance** — talk to **Isaac**: the oldest son gets the land, the money, and a part in Jehovah's promises → 🎞 *Canon Event: the inheritance includes Jehovah's promises to Abraham*
2. **A Bowl of Red Stew** — talk to **Esau**, home tired from the hunt → he trades his inheritance for stew → 🎞 *Esau traded his inheritance for a bowl of red stew* (not wise!)
3. **The Stolen Blessing** — talk to **Rebekah** → she helps Jacob get Isaac's blessing → 🎞 *Rebekah helped Jacob, the younger son, get the blessing*
4. **Esau's Rage** — talk to **Esau** (he's just found out) → 🎞 *Esau was angry and planned to kill Jacob*
5. **Run for Your Life!** — through the **east gate** and down the road to Laban (zone trigger; talking to Isaac or Rebekah first gives the advice) → **finale**: Jacob obeys and runs → 🎞 *Jacob went to stay with Laban* → Chapter 12 Complete

### Chapter 13 quest chain — **you play as Jacob**

1. **Return to Your Homeland** — talk to **Jehovah** at the travelling camp → 🎞 *Canon Event: go back home — I will protect you* → the **messenger** arrives on the road
2. **Esau Is Coming!** — talk to the **messenger** → 🎞 *400 men are coming — Jacob prays: save me from my brother*
3. **A Gift for Esau** — talk to the **servant** with the herds (sheep, lambs, a camel and a donkey are visible in camp) → 🎞 *Jacob sent a gift of many animals* → **night falls** (screen darkens) and the **angel** appears
4. **Wrestling Till Dawn** — wrestle the **angel** until morning → "not until you bless me!" → 🎞 *Jacob wrestled until he was blessed* → **dawn breaks** and Esau + his six men appear in the east
5. **Bowing Seven Times** — greet **Esau** → **finale**: the embrace, tears, peace → 🎞 *the brothers made peace* → the 12 sons and the hook to Joseph → Chapter 13 Complete

### Chapter 14 quest chain — **you play as Joseph**

1. **Jacob Sends Joseph** — talk to **Jacob** at the Canaan camp (intro already fires 🎞 *the brothers were jealous and hated him* for his dreams) → you set out in your coat of many colours
2. **Here Comes the Dreamer** — find the **brothers** at the Shechem pasture → pit, Judah's plan, 20 pieces of silver → 🎞 *sold to Midianite merchants*
3. **The Road to Egypt** — follow the caravan road east (zone trigger) → narrated on the way: the bloodied coat → 🎞 *Jacob thought a wild animal had killed Joseph* → sold to Potiphar in sandy Egypt
4. **Potiphar's Household** — talk to **Potiphar** → 🎞 *Joseph was put in charge of everything — Jehovah was with him*
5. **I Would Sin Against God!** — face **Potiphar's wife** → refusal, the lie, prison → 🎞 *she had him thrown into prison* → *But Jehovah did not forget about Joseph* → Chapter 14 Complete

### Playable characters

Each chapter declares its own hero in `js/data.js` (`playable:` field):
**Chapter 1** = the first angel · **Chapter 2** = Adam · **Chapter 3** = Eve · **Chapter 4** = Cain · **Chapter 5 & 6** = Noah · **Chapter 7** = a builder on the plain of Shinar · **Chapter 8 & 9** = Abraham · **Chapter 10** = Lot · **Chapter 11** = Abraham · **Chapter 12 & 13** = Jacob · **Chapter 14** = Joseph · future chapters pick their own character from the story.

Adam and Eve (playable in Chapters 2 and 3, NPCs elsewhere) are animated from
the pixel-art sprite sheets `assets/adam/walk.png` and `assets/eve/walk.png` —
each a 4×4 grid of 192px frames (rows: down / right / up / left). Column 0 is
the **idle** pose; the row cycles as they **walk**, with facing tracked from
the movement keys. If a sheet can't load, the original vector drawing is used
instead.

Animals are drawn as vector "assets" by `drawAnimal()` in `js/game.js` —
available kinds: **rabbit, lamb, sheep** (with a curled-horn variant used for
the ram of Moriah), **camel, donkey, elephant** and **bird**. Any kind without
a branch would render only a shadow, and the test suite asserts every kind the
game uses draws a full body.

### Audio (no asset files)

`js/audio.js` synthesizes everything with the Web Audio API, so the game still works
from `file://` (double-click `index.html`):

- **Background music** — a gentle procedural hymn (pad chords + bass + arpeggio) with a
  different mood per chapter: bright (Ch1) · warm Eden (Ch2) · tense (Ch3) · somber (Ch4) · steady hope (Ch5) · the Flood, then the rainbow (Ch6)
- **Sound effects** — dialog blips, quest-complete chime, canon fanfare, footsteps,
  planting, snake hiss, eating, offering whoosh, dark/banish sweeps
- **`♪ Music` / `🔊 Sound` toggle buttons** (top-left) — state persists in `localStorage`
  (`ebs_music`, `ebs_sfx`); audio starts on your first click/keypress (browser autoplay rules)

Golden floating markers above objectives, a quest journal (top-right), and golden
"Canon Event" toasts tell you where to go next.

## Project structure

```
index.html        UI: canvas, HUD, dialog box, cinema overlay, screens
css/style.css     Parchment/biblical UI styling
js/data.js        ★ Chapter data (quests, dialogs, cutscenes) — add Chapter 7 here
js/world.js       Procedural tile map (ocean, mountains, river, meadow, paths), trees, quest objects
js/audio.js       Procedural background music (one mood per chapter) + synthesized SFX, toggle buttons
js/game.js        Game loop, player, camera, interactions, quest state machine, dialog/cutscene engine, rendering
test/run-test.js  Automated headless playthrough of the whole chapter
```

## Adding the next chapter

`js/data.js` contains a `CHAPTERS` array — chapters are data-driven. Append a new
chapter object with its own `quests`, `dialogs`, `cutscenes` and `canonEvents`,
add a matching `World.buildChapterN()` map, and dispatch any chapter-specific
interactions in `interactChapterN()` (`js/game.js`). The quest engine already
handles generic chains: each quest has `id`, `title`, `objective`, an optional
`need` counter + `unit`, and quest logic hooks into `tryInteract()`.
The end-screen button automatically offers "Continue" when a next chapter exists.

## Running the automated test

```
node test/run-test.js
```

Stubs a minimal DOM/canvas, loads the real game scripts, and auto-plays **all
fourteen chapters** end-to-end (start screen → each chapter's 5 quests → finale
cutscene → chapter-complete screen, chained one into the next), verifying keyboard
movement, dialog advancing, chapter transitions, Eve's spawn and **zero runtime
errors** under strict browser-accurate canvas validation. Exits `0` and prints
`ALL_TESTS_PASSED` on success.
#   t e s t  
 

## Pixel-art visual upgrade

The visual layer is being upgraded in six isolated phases without changing the quest/world logic:

1. **Pixel foundation** — fixed low-resolution rendering and nearest-neighbour scaling.
2. **Pixel terrain** — authored pixel terrain patterns for grass, meadow, water, mountain, sand, paths, soil, garden and bridges.
3. **Environment** — pixel trees, huts, rocks and deterministic ground decoration.
4. **Characters** — directional pixel characters with walking animation and chapter-specific visual identities.
5. **Animals & NPCs** — pixel-rendered animals and supporting creature palettes.
6. **Effects & polish** — animated water highlights, rain, smoke/fire, dust, ambient particles and atmospheric pixel accents.
7. **Authored terrain transitions** — neighbouring-tile aware shorelines, terrain banks, path/soil/garden boundaries and pixel corner cuts, while preserving the original 32px world grid.
8. **Advanced map composition** — layered cliff faces, road edging, settlement yards, wells, field shrubs and background tree masses turn the tile map into a composed environment rather than a collection of isolated tiles.

All of these are original renderers built for this project; the upgrade does not copy Pokémon, Zelda, or other commercial game assets.
