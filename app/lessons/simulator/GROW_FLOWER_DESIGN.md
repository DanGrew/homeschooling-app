# Grow a Plant v2 — Asset Design & Stage Flow

## Asset Inventory

| File | Role | Notes |
|---|---|---|
| `table.png` | Indoor background | Full scene |
| `empty-pot.png` | Scene state + pot tool icon | |
| `pot-with-dirt.png` | Scene state | |
| `pot-with-seeds.png` | Scene state | |
| `pot-with-shoot.png` | Scene state | |
| `pot-with-bloom.png` | Scene state | |
| `pot-with-fruit.png` | Scene state | |
| `fruit-outside-pot.png` | Scene state + plant tool icon | Plant on table after removal; becomes toolbar tool |
| `ground.png` | Outdoor background | Full scene, fit:cover — soil anchors at bottom |
| `ground-with-hole.png` | Outdoor background state | sprite_states advance of ground |
| `planted-fruit-in-ground.png` | Full-page scene state | Replaces entire scene when planted |
| `planted-in-ground-grow-max-fruit.png` | Full-page scene state (WIN) | Black bg intentional, full page |
| `seeds.png` | Seed tool icon | |
| `trowel.png` | Tool icon | Soil → remove plant → dig hole |
| `watering-can.png` | Tool icon | |
| `sun.png` | Tool icon | |
| `splash.png` | Effect | |

---

## Architecture

### Scene objects (in z-order)

| Object | Type | Sprite / States | Position | Notes |
|---|---|---|---|---|
| `bg_table` | image | `table.png` | 0,0,360,616 fit:cover | Indoor bg |
| `bg_ground` | image | `ground` → `ground-with-hole` (sprite_states) | 0,0,360,616 fit:cover | Outdoor bg, hidden initially |
| `the_pot` | image | `empty-pot` → `pot-with-dirt` → `pot-with-seeds` → `pot-with-shoot` → `pot-with-bloom` → `pot-with-fruit` | centred on table | Hidden initially, shown at stage 0→1 |
| `the_fruit_on_table` | image | `fruit-outside-pot.png` | centred on table | Hidden until stage 6, hides at transition |
| `go_outside_btn` | **button** | label: "🌱 Go Outside!" | centre of scene | Hidden until stage 6, hidden after tap |
| `the_plant_scene` | image | `planted-fruit-in-ground` → `planted-in-ground-grow-max-fruit` | 0,0,360,616 fit:cover | Hidden until stage 8 |

### Toolbar

Tools visible from start: `empty-pot` · `seeds` · `watering-can` · `sun` · `trowel`

Tool revealed mid-game: `plant` (icon: `fruit-outside-pot.png`, `visible: false` initially) — shown at stage 6→7 transition via `show_tool: plant`

---

## Stage Flow

| Stage | Action | Visual result |
|---|---|---|
| 0 | pot tool → tap `bg_table` | `the_pot` fades in (empty-pot) |
| 1 | trowel → tap `the_pot` | advance_sprite → pot-with-dirt |
| 2 | seeds → tap `the_pot` | advance_sprite → pot-with-seeds |
| 3 | water + sun ×1 on `the_pot` | advance_sprite → pot-with-shoot |
| 4 | water + sun ×1 on `the_pot` | advance_sprite → pot-with-bloom |
| 5 | water + sun ×1 on `the_pot` | advance_sprite → pot-with-fruit |
| 6 | trowel → tap `the_pot` | `the_fruit_on_table` appears to the right of the pot (both visible on table); `go_outside_btn` appears |
| 6→7 | tap `go_outside_btn` | btn hides; `the_pot` hides; `the_fruit_on_table` hides; bg_table fades out; bg_ground fades in; `show_tool: plant` |
| 7 | trowel → tap `bg_ground` | advance_sprite bg_ground → ground-with-hole |
| 8 | plant → tap `bg_ground` | bg_ground hides; `the_plant_scene` fades in (planted-fruit-in-ground) |
| 9 | water + sun ×1 on `the_plant_scene` | advance_sprite → planted-in-ground-grow-max-fruit → WIN |

### Tap targets for outdoor stages
- **Stage 7**: `bg_ground` is the tap target for the trowel. Full-scene image, easy to hit.
- **Stage 8**: `bg_ground` again for the plant tool (hole is in the ground).
- **Stage 9**: `the_plant_scene` (full-page image) is itself the tap target for water and sun — child taps the plant image directly.

**State variables:** `stage`, `watered`, `sunned`

**Rules:**
- `stage==3 && watered>=1 && sunned>=1` → advance_sprite the_pot, stage=4, reset
- `stage==4 && watered>=1 && sunned>=1` → advance_sprite the_pot, stage=5, reset
- `stage==5 && watered>=1 && sunned>=1` → advance_sprite the_pot, stage=6, reset
- `stage==9 && watered>=1 && sunned>=1` → advance_sprite the_plant_scene, stage=10 → WIN

---

## Engine Changes Needed

| Feature | Syntax | Notes |
|---|---|---|
| Fade out object | `fade_out: objectId 800` | opacity 1→0, then display:none |
| Fade in object | `fade_in: objectId 800` | display:block, opacity 0→1 |
| Show toolbar tool | `show_tool: toolId` | Reveals tool with `visible:false` |
| `button` object type | `"type": "button", "label": "text"` | Renders styled green button, no sprite needed; clickable via normal tap action |
| Toolbar `visible: false` | JSON property on toolbar item | Tool hidden at start |

---

## Decisions

- **Pot position**: TBD by eye once wired up — table surface is upper half of perspective image
- **Stage 6 layout**: pot stays visible (showing pot-with-fruit) to the left; fruit-outside-pot appears to its right — both on table together before the transition
- **Trowel triple use**: keep for now (add soil / remove plant / dig hole)
