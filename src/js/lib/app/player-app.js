/* globals PIXI */
const Stats = require('../helpers-web/stats');
const TownView = require('../views/town-view');
require('../helpers-web/fill-with-aspect');
const PCView = require('../views/pc-view');
const DemoDrone = require('../views/demo-drone');
const CharacterView = require('../views/character-view');
const KeyboardInputMgr = require('../input/keyboard-input-mgr');
const GamepadInputMgr = require('../input/gamepad-input-mgr');
const MultiplexInputMgr = require('../input/multiplex-input-mgr');
const PlayerAppInputRouter = require('../input/player-app-input-router');
const Character = require('../model/character');
const FlagStore = require('../dialogues/flag-store');
const StorylineManager = require('../model/storyline-manager');
const QuestTracker = require('../model/quest-tracker');
const QuestOverlay = require('../ui/quest-overlay');
const DialogueOverlay = require('../dialogues/dialogue-overlay');
const DialogueSequencer = require('../dialogues/dialogue-sequencer');
const Countdown = require('../helpers-web/countdown');
const DecisionScreen = require('../ui/decision-screen');
const ScoringOverlay = require('../ui/scoring-overlay');
const { I18nTextAdapter } = require('../helpers/i18n');
const readEnding = require('../dialogues/ending-reader');
const { PlayerAppStates, getHandler } = require('./player-app-states');
const TitleOverlay = require('../ui/title-overlay');
const TextScreen = require('../ui/text-screen');

class PlayerApp {
  constructor(config, textures, playerId, stateController) {
    this.config = config;
    this.textures = textures;
    this.lang = config.game.defaultLanguage;
    this.playerId = playerId;

    // Game logic
    this.flags = new FlagStore();
    this.storylineManager = new StorylineManager(this.config);
    this.storylineManager.events.on('storylineChanged',
      this.handleStorylineChanged.bind(this)
    );

    this.questTracker = new QuestTracker(config, this.storylineManager, this.flags);

    this.pc = null;
    this.canControlPc = false;
    this.remotePcs = {};

    this.pcView = null;
    this.showHitbox = false;
    this.remotePcViews = {};
    this.npcViews = {};
    this.npcMoodsVisible = false;

    this.demoDrone = new DemoDrone();

    this.stateHandler = null;
    this.gameServerController = null;

    // HTML elements
    this.$element = $('<div></div>')
      .addClass('player-app')
      .addClass(`player-${playerId}`);

    this.$pixiWrapper = $('<div></div>')
      .addClass('pixi-wrapper')
      .appendTo(this.$element);

    this.$storylineBar = $('<div></div>')
      .addClass('storyline-bar')
      .appendTo(this.$element)
      .hide();

    this.$decisionLabel = $('<div></div>')
      .addClass('decision-label')
      .appendTo(this.$storylineBar);

    this.decisionLabelI18n = new I18nTextAdapter((text) => {
      this.$decisionLabel.html(text);
    }, this.lang);

    this.endingScreen = null;

    this.countdown = new Countdown(config.game.duration);
    this.countdown.$element.appendTo(this.$element);
    this.countdown.hide();
    this.countdown.events.on('end', () => {
      this.gameServerController.roundEnd();
    });

    this.questOverlay = new QuestOverlay(this.config, this.lang, this.questTracker);
    this.$element.append(this.questOverlay.$element);

    this.textScreen = new TextScreen(this.config, this.lang);
    this.$element.append(this.textScreen.$element);

    this.dialogueOverlay = new DialogueOverlay(this.config, this.lang);
    this.dialogueSequencer = new DialogueSequencer(this.dialogueOverlay);
    this.$element.append(this.dialogueOverlay.$element);

    this.scoringOverlay = new ScoringOverlay(this.config);
    this.$element.append(this.scoringOverlay.$element);

    this.titleOverlay = new TitleOverlay(this.config, this.lang);
    this.$element.append(this.titleOverlay.$element);
    this.titleOverlay.show();

    this.stats = new Stats();
    this.$element.append(this.stats.dom);

    // Temporary scoring manager
    this.seenFlags = {};
    this.flags.events.on('flag', (flagId, value, oldValue, setter) => {
      if (this.seenFlags[flagId]) {
        return;
      }
      this.seenFlags[flagId] = true;
      if (flagId.startsWith('pnt.') && setter !== 'remote') {
        const flagParts = flagId.split('.');
        const category = flagParts[1];
        if (category) {
          this.scoringOverlay.show(category);
        }
      }
    });

    // PIXI
    this.pixiApp = new PIXI.Application({
      // todo: get these from config or constants
      width: PlayerApp.APP_WIDTH,
      height: PlayerApp.APP_HEIGHT,
      backgroundColor: 0xffffff,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    this.camera = new PIXI.Container();
    this.townView = new TownView(this.config, this.textures);
    this.camera.addChild(this.townView.display);
    this.pixiApp.stage.addChild(this.camera);
    this.demoDrone.setPosition(this.townView.townSize.width / 2, this.townView.townSize.height / 2);

    this.cameraTarget = null;
    this.cameraOffset = new PIXI.Point(0, 0);

    // Input
    this.keyboardInputMgr = new KeyboardInputMgr();
    this.keyboardInputMgr.attachListeners();
    this.keyboardInputMgr.addToggle('KeyE', () => {
      this.gameServerController.roundEnd();
    });
    this.keyboardInputMgr.addToggle('KeyD', () => {
      this.stats.togglePanel();
    });
    this.keyboardInputMgr.addToggle('KeyH', () => {
      this.toggleHitboxDisplay();
    });
    this.keyboardInputMgr.addToggle('KeyX', () => {
      if (this.pc) {
        console.log(`x: ${this.pc.position.x}, y: ${this.pc.position.y}`);
      } else {
        console.log('No PC');
      }
    });

    const gamepadMapperConfig =
      this.config?.players?.[this.playerId]?.['gamepadMapping'] ?? {};
    this.gamepadInputMgr = new GamepadInputMgr(gamepadMapperConfig);
    this.gamepadInputMgr.attachListeners();

    this.multiplexInputMgr = new MultiplexInputMgr(
      this.keyboardInputMgr,
      this.gamepadInputMgr
    );
    this.multiplexInputMgr.attachListeners();

    const inputMgrs = [
      this.keyboardInputMgr,
      this.gamepadInputMgr,
      this.multiplexInputMgr, // the multiplexer must be the last one
    ];

    const inputMgr = this.multiplexInputMgr;
    inputMgr.events.on('lang', () => {
      this.toggleLanguage();
    });

    this.inputRouter = new PlayerAppInputRouter(inputMgr);

    // Game loop
    this.pixiApp.ticker.add((time) => {
      this.stats.frameBegin();
      inputMgrs.forEach((inputMgr) => inputMgr.update());
      if (this.canControlPc && this.pc) {
        const { x, y } = inputMgr.getDirection();
        this.pc.setSpeed(x * 10, y * 10);
      }

      Object.entries(this.remotePcViews).forEach(([, pcView]) => {
        pcView.display.position = pcView.character.position;
        pcView.display.zIndex = pcView.character.position.y;
        pcView.animate(time);
      });
      this.townView.mainLayer.sortChildren();

      if (this.pcView) {
        this.pcView.animate(time);
      }

      if (this.demoDrone) {
        this.demoDrone.animate(time);
      }

      if (this.cameraTarget) {
        // Cap the camera position to the town size
        this.camera.pivot.set(
          Math.max(0,
            Math.min(this.cameraTarget.x + this.cameraOffset.x - PlayerApp.APP_WIDTH / 2
              / this.camera.scale.x,
              this.townView.townSize.width - PlayerApp.APP_WIDTH / this.camera.scale.x)),
          Math.max(0,
            Math.min(this.cameraTarget.y + this.cameraOffset.y - PlayerApp.APP_HEIGHT
              / 2 / this.camera.scale.y,
              this.townView.townSize.height - PlayerApp.APP_HEIGHT / this.camera.scale.y)),
        );
      }
      this.stats.frameEnd();
    });

    this.questTracker.events.on('questActive', (questId) => {
      this.updateNpcMoods();
    });
    this.questTracker.events.on('questDone', (questId) => {
      this.updateNpcMoods();
    });

    // Temporary
    // this.addPcView();
    // Object.entries(this.config.players)
    //   .filter(([id, player]) => (player.enabled === undefined || player.enabled) && id !== playerId)
    //   .forEach(([id, player]) => {
    //     this.addRemotePcView(id);
    //   });
    this.storylineManager.setCurrentStoryline('touristen');
  }

  setGameServerController(gameServerController) {
    this.gameServerController = gameServerController;
  }

  getState() {
    return (this.stateHandler && this.stateHandler.state) || null;
  }

  setState(state) {
    // Check if the state is in PlayerApp.States
    if (Object.values(PlayerAppStates).indexOf(state) === -1) {
      throw new Error(`Error: Attempting to set invalid state ${state}`);
    }

    if (this.stateHandler && this.stateHandler.state === state) {
      return;
    }

    const fromState = this.getState();
    const newHandler = getHandler(this, state);

    if (this.stateHandler) {
      this.stateHandler.onExit(state);
    }
    this.stateHandler = newHandler;
    if (this.stateHandler) {
      this.stateHandler.onEnter(fromState);
    }
  }

  setLanguage(lang) {
    this.lang = lang;
    this.titleOverlay.setLang(this.lang);
    this.dialogueOverlay.setLang(this.lang);
    this.textScreen.setLang(this.lang);
    this.questOverlay.setLang(this.lang);
    this.decisionLabelI18n.setLang(this.lang);
    if (this.endingScreen) {
      this.endingScreen.setLang(this.lang);
    }
  }

  toggleLanguage() {
    const langIndex = this.config.game.languages.indexOf(this.lang);
    if (langIndex === this.config.game.languages.length - 1) {
      this.setLanguage(this.config.game.languages[0]);
    } else {
      this.setLanguage(this.config.game.languages[langIndex + 1]);
    }
  }

  resize() {
    this.$element.fillWithAspect(PlayerApp.APP_WIDTH / PlayerApp.APP_HEIGHT);
    this.$element.css('font-size', `${(this.$element.width() * PlayerApp.FONT_RATIO).toFixed(3)}px`);
  }

  setCameraTarget(displayObject, offset = { x: 0, y: 0 }) {
    this.cameraTarget = displayObject;
    this.cameraOffset = offset;
  }

  cameraFollowPc() {
    if (this.pcView) {
      this.demoDrone.active = false;
    }
  }

  cameraFollowDrone() {
    if (this.demoDrone) {
      this.setCameraTarget(this.demoDrone);
      this.demoDrone.active = true;
    }
  }

  addPc() {
    this.removePc();
    this.pc = new Character(this.playerId, this.config.players[this.playerId]);
    this.pcView = new PCView(this.config, this.textures, this.pc, this.townView);
    this.townView.mainLayer.addChild(this.pcView.display);
    this.townView.bgLayer.addChild(this.pcView.hitboxDisplay);
    this.setCameraTarget(this.pcView.display, new PIXI.Point(this.pcView.display.width / 2, -this.pcView.display.height * 0.8));
  }

  removePc() {
    if (this.pcView) {
      this.townView.mainLayer.removeChild(this.pcView.display);
      this.townView.bgLayer.removeChild(this.pcView.hitboxDisplay);
      this.pcView = null;
      this.pc = null;
    }
  }

  addRemotePcView(id) {
    if (this.config.players[id]) {
      const pc = new Character(id, this.config.players[id]);
      this.remotePcs[id] = pc;
      const view = new PCView(this.config, this.textures, pc, this.townView);
      this.remotePcViews[id] = view;
      this.townView.mainLayer.addChild(view.display);
    }
  }

  removeRemotePcView(id) {
    if (this.remotePcViews[id]) {
      this.townView.mainLayer.removeChild(this.remotePcViews[id].display);
      delete this.remotePcs[id];
      delete this.remotePcViews[id];
    }
  }

  addNpc(npc) {
    const view = new CharacterView(this.config, this.textures, npc, this.townView);
    this.npcViews[npc.id] = view;
    this.townView.mainLayer.addChild(view.display);
  }

  removeNpc(id) {
    if (this.npcViews[id]) {
      this.townView.mainLayer.removeChild(this.npcViews[id].display);
      delete this.npcViews[id];
    }
  }

  clearNpcs() {
    Object.values(this.npcViews).forEach((npcView) => {
      this.townView.mainLayer.removeChild(npcView.display);
    });
    this.npcViews = { };
  }

  enablePcControl() {
    this.canControlPc = true;
  }

  disablePcControl() {
    this.canControlPc = false;
    if (this.pc) {
      this.pc.setSpeed(0, 0);
    }
  }

  getDialogueContext() {
    return {
      flags: this.flags,
        random: max => Math.floor(Math.random() * max),
    };
  }

  clearFlags() {
    this.flags.clear();
    this.seenFlags = {};
  }

  playDialogue(dialogue, npc = null) {
    this.inputRouter.routeToDialogueOverlay(this.dialogueOverlay, this.dialogueSequencer);
    const title = npc ? npc.name : null;
    this.dialogueSequencer.play(dialogue, this.getDialogueContext(), { top: title });
    this.dialogueSequencer.events.once('end', () => {
      this.inputRouter.routeToPcMovement(this);
    });
  }

  getNpcsInRect(rect) {
    return Object.values(this.npcViews).filter(npcView => npcView.inRect(rect))
      .map(npcView => npcView.character);
  }

  pcAction() {
    if (this.pcView === null) {
      return;
    }
    const hitbox = this.pcView.getActionHitbox();
    const npcs = this.getNpcsInRect(hitbox);
    let closestNpc = null;
    let closestDistance = null;
    npcs.forEach((npc) => {
      const distance = Math.max(
        Math.abs(this.pc.position.x - npc.position.x),
        Math.abs(this.pc.position.y - npc.position.y)
      );
      if (closestDistance === null || distance < closestDistance) {
        closestNpc = npc;
        closestDistance = distance;
      }
    });
    if (closestNpc) {
      this.playDialogue(this.questTracker.getDialogue(closestNpc.id), closestNpc);
    }
    if (this.showHitbox) {
      this.pcView.showActionHitbox(hitbox);
    }
  }

  menuAction() {
    this.stateHandler.onAction();
  }

  playerStart() {
    if (this.gameServerController) {
      this.gameServerController.playerStart();
    }
  }

  updateNpcMoods() {
    const npcsWithQuests = this.questTracker.getNpcsWithQuests();
    Object.values(this.npcViews).forEach((npcView) => {
      if (this.npcMoodsVisible && Object.keys(npcsWithQuests).includes(npcView.character.id)) {
        npcView.showMoodBalloon(npcsWithQuests[npcView.character.id]);
      } else {
        npcView.hideMoodBalloon();
      }
    });
  }

  hideNpcMoods() {
    this.npcMoodsVisible = false;
    this.updateNpcMoods();
  }

  showNpcMoods() {
    this.npcMoodsVisible = true;
    this.updateNpcMoods();
  }

  toggleHitboxDisplay() {
    this.showHitbox = !this.showHitbox;
  }

  showStorylinePrompt() {
    this.questOverlay.setPrompt(this.storylineManager.getPrompt());
  }

  handleStorylineChanged() {
    this.decisionLabelI18n.setText(this.storylineManager.getDecision());
    this.clearNpcs();
    Object.entries(this.storylineManager.getNpcs()).forEach(([id, props]) => {
      this.addNpc(new Character(id, props));
    });
    this.updateNpcMoods();
    if (this.demoDrone) {
      this.demoDrone.setTargets(Object.values(this.npcViews).map(
        npcView => ({
          x: npcView.display.x,
          y: npcView.display.y - npcView.display.height,
        })
      ));
    }
  }

  handleStorylineEnd() {
    const [endingText, classes] = readEnding(
      this.storylineManager.getEndingDialogue(),
      this.getDialogueContext()
    );

    this.endingScreen = new DecisionScreen(this.config, this.lang);
    this.$element.append(this.endingScreen.$element);
    this.endingScreen.showDecision(endingText, classes);
  }

  hideEndingScreen() {
    if (this.endingScreen) {
      this.endingScreen.$element.remove();
      this.endingScreen = null;
    }
  }

  showTextScreen(text) {
    this.textScreen.setText(text);
    this.textScreen.show();
  }

  hideTextScreen() {
    this.textScreen.hide();
    this.textScreen.setText('');
  }
}

PlayerApp.APP_WIDTH = 1024;
PlayerApp.APP_HEIGHT = 768;
PlayerApp.FONT_RATIO = 0.0175; // 1.75% of the width of the app

module.exports = PlayerApp;
