# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Install dependencies (must do BOTH)
npm install              # Client dependencies (root directory)
cd server && npm install # Server dependencies

# Client build
npm run build            # Compile client via Webpack
npm run watch            # Watch mode for development

# Server
npm run start            # Start server (port 4850 by default)
cd server && npm start   # Alternative: run directly from server dir

# Tests (Mocha + Chai, client-side code only)
npm test                 # Run all tests
npx mocha test/dialogues.test.js  # Run a single test file

# Linting
npx eslint src/js/       # ESLint with Airbnb config
npx stylelint "src/sass/**/*.scss"  # SCSS linting
```

## Architecture Overview

Citizen Quest is a multi-station interactive exhibit about democracy. Players explore a city, talk to NPCs, complete quests, and make decisions. It runs as a Node.js server with browser-based clients rendered via PixiJS.

### Client-Server Relationship

The server (Express + WebSocket) manages game rounds, player synchronization, and serves configuration. Clients connect via WebSocket (`ServerSocketConnector`) for real-time sync and fetch config via HTTP. The server has its own `package.json` in `/server` and is a separate npm package.

### Webpack Entry Points (5 separate bundles)

- `main.js` → `index.html` — Standalone demo/test client (no server needed, uses `LocalGameServerController`)
- `player.js` → `player.html` — Player station (connects to server)
- `map.js` → `map.html` — Map/city view station (spectator display)
- `test.js` → `test.html` — Live test harness
- `char-edit.js` → `char-edit.html` — Character editor

### Core Patterns

**MVC with event-driven communication:**
- **Models** (`src/js/lib/model/`): `FlagStore`, `QuestTracker`, `Character`, `Scenery`, `DialogueSequencer`
- **Views**: PixiJS rendering (`src/js/lib/view-pixi/`) and HTML overlays (`src/js/lib/view-html/`)
- **Controllers** (`src/js/lib/app/`): `PlayerApp`, `MapApp`, `GameServerController`

**State machines** are used extensively:
- `PlayerApp` states: RESET, IDLE, QUEUED, INTRO, PLAYING, ENDING (in `player-app-states/`)
- `ServerSocketConnector` states: Connecting, Open, ReconnectDelay, Closing
- `DialogueSequencer` states: TextState, ResponseState, EffectState, ThenState
- Server `GameManager` states: INIT, WAITING_PLAYERS, PLAYING, ROUND_END

**Configuration-driven design:** All game content (storylines, dialogues, NPCs, quests, scenery) is defined in YAML files under `config/`. Code is content-agnostic.

### Key Domain Concepts

**FlagStore** (`model/flag-store.js`): Central game state as key-value flags (boolean/integer 0-999). Emits `'flag'` events on changes. Flag naming conventions: `quest.*` (quest state), `pnt.*` (points), `inc.*` (inclusion scores). The `setter` parameter tracks origin (`'remote'`, `'init'`, `'counter'`).

**Dialogue System** (`model/dialogues/`): Tree-based dialogues with node types: `sequence`, `cycle`, `random`, `first` (conditional), `statement` (text + responses), `effect`. `DialogueIterator` traverses the tree evaluating `cond` expressions against FlagStore. `DialogueSequencer` orchestrates playback with effects and timing. `DialogueEffectFactory` is a static registry for effect classes.

**LogicParser** (`model/dialogues/logic-parser.js`): Parses boolean expressions for conditions: `flag1 | (^flag2 & flag3)`. Operators: `|` (OR), `&` (AND), `^` (NOT).

**QuestTracker** (`model/quest-tracker.js`): Manages up to 3 concurrent active quests. Evaluates stage conditions against flags, tracks progression, handles progressive prompts (hint levels). Emits events: `questActive`, `questInactive`, `questDone`, `stageChanged`.

**Storylines** (`config/storylines/*.yml`): Define NPCs, dialogues, quests with stages, scenery objects, and init flags. Quests progress through stages with conditions, counters, and flag-setting.

### Rendering

- PixiJS for 2D game rendering with layered containers (bgLayer, preMainLayer, mainLayer, frontLayer)
- `GameViewCamera` provides pan/zoom/follow with camera presets
- `CollisionMap` loaded from texture data for walkable area validation
- HTML/jQuery overlays for UI (dialogues, quests, menus) positioned on top of the PixiJS canvas

### Input

`MultiplexInputMgr` combines `KeyboardInputMgr` and `GamepadInputMgr`. `PlayerAppInputRouter` routes input to different targets (PC movement, dialogue overlay, menus).

### Validation

JSON schemas in `specs/` validate dialogues (`dialogue.schema.json`) and storylines (`storyline.schema.json`) using AJV. Custom validators in `model/dialogues/dialogue-validation.js` and `model/storyline-validation.js` add semantic checks beyond schema validation.

## ESLint Conventions

- Airbnb base config with ES2022
- Trailing commas required on multiline arrays/objects/imports/exports, but **never on function parameters**
- `no-param-reassign` allows property mutation (props: false)
- No `.js` extension in imports
- Test files (`test/`): Mocha environment enabled, `chai-friendly` plugin for assertion expressions

## Testing

Tests use Mocha + Chai with `describe`/`it` blocks. Test fixtures are YAML files in `test/fixtures/`. Event testing uses `chai-eventemitter2`. Test helpers in `test/lib/` provide dialogue tracing utilities.

## API Specs

- HTTP API: `specs/openapi.yaml`
- WebSocket API: `specs/asyncapi.yaml`
