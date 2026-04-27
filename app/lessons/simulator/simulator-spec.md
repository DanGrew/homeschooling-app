```text
You are designing content for an existing children’s educational simulation engine.

Your task is to output ONLY a valid YAML simulation spec using the schema below.

Do NOT output explanations.
Do NOT output markdown fences.
Do NOT output code comments.
Do NOT invent new schema fields.
Keep logic simple, deterministic, and toddler-friendly.

-----------------------------------
PURPOSE OF THE ENGINE
-----------------------------------

The child interacts with on-screen objects.

Two supported input styles:

1. direct_tap
- tapping an object can trigger an action instantly

2. tool_then_target
- child selects a tool
- then taps a target

Examples:
watering_can + soil
food + dog
sponge + car

The engine interprets actions, updates state, animates responses, and checks win conditions.

-----------------------------------
DESIGN RULES
-----------------------------------

Target age: 2 to 5 years old

Use:
- simple cause and effect
- clear visual progress
- repeated satisfying interactions
- early vocabulary
- short encouraging speech lines

Avoid:
- timers
- penalties
- failure states
- complex numbers
- reading-heavy tasks
- abstract logic

Use small values only (0 to 5 preferred)

A child should complete the simulation in 3 to 8 successful interactions.

-----------------------------------
ALLOWED CONDITION TYPES
-----------------------------------

state.x >= n
state.x == n

Combine using:

all:
  - condition1
  - condition2

any:
  - condition1
  - condition2

-----------------------------------
ALLOWED ACTION TYPES
-----------------------------------

- state.x += n
- state.x = n
- state.x -= n
- animate: name
- say: short sentence

-----------------------------------
YAML SCHEMA
-----------------------------------

simulation:
  id: short_snake_case_id
  title: short title
  age_range: 2-5

scene:
  background: simple_scene_name

  objects:
    - id: object_id
      type: tool | target | actor
      sprite: sprite_name
      clickable: true

    - id: animated_actor_id
      type: actor
      sprite_states:
        - state1
        - state2
        - state3

state:
  variable_name: 0

input_modes:
  - direct_tap
  - tool_then_target

actions:
  - when:
      tool: tool_id
      target: target_id
    do:
      - state.var += 1
      - animate: animation_name
      - say: short sentence

rules:
  - if:
      state.var >= 1
    do:
      - state.other += 1
      - animate: grow

win_condition:
  state.var >= 3

win_response:
  - animate: celebrate
  - say: short success sentence

-----------------------------------
CONTENT REQUIREMENTS
-----------------------------------

Create a simulation about:

GROW A PLANT

Learning goals:
- plant life cycle
- cause and effect
- vocabulary:
  seed
  soil
  water
  grow
  flower

The child should:
- water plant
- give sunshine
- see plant visibly grow through stages
- end with a flower blooming

Output ONLY YAML.
```
