/* globals PIXI */
const EventEmitter = require('events');
const Stats = require('../helpers-web/stats.js');
const TownView = require('../views/town-view');
require('../helpers-web/fill-with-aspect');
const PCView = require('../views/pc-view');
const CharacterView = require('../views/character-view');
const KeyboardInputMgr = require('../input/keyboard-input-mgr');
const GamepadInputMgr = require('../input/gamepad-input-mgr');
const MultiplexInputMgr = require('../input/multiplex-input-mgr');
const PlayerAppInputRouter = require('../input/player-app-input-router');
const Character = require('../model/character');
const FlagStore = require('../dialogues/flag-store');
const QuestTracker = require('../model/quest-tracker');
const QuestOverlay = require('../ui/questOverlay');
const DialogueOverlay = require('../dialogues/dialogue-overlay');
const DialogueSequencer = require('../dialogues/dialogue-sequencer');
const Dialogue = require('../dialogues/dialogue');
const Countdown = require('../helpers-web/countdown');
const DecisionScreen = require('../ui/decisionScreen');
const ScoringOverlay = require('../ui/scoringOverlay');
const { I18nTextAdapter } = require('../helpers/i18n');
const readEnding = require('../dialogues/ending-reader');


class PlayerApp {
  constructor(config, playerId) {
    this.config = config;
    this.lang = config.game.defaultLanguage;
    this.playerId = playerId;
    this.pc = new Character(playerId, this.config.players[playerId]);
    this.otherPcs = Object.fromEntries(Object.entries(this.config.players)
      .filter(([id, player]) => (player.enabled === undefined || player.enabled) && id !== playerId)
      .map(([id]) => [id, new Character(id, this.config.players[id])]));
    this.canControlPc = false;
    this.npcs = Object.entries(config.storylines.touristen.npcs).map(([id, props]) => new Character(id, props));

    this.$element = $('<div></div>')
      .addClass('player-app');

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
    }, this.lang, this.config.storylines.touristen.decision);

    this.endingScreen = null;

    this.countdown = new Countdown(config.game.duration);
    this.countdown.$element.appendTo(this.$element);
    this.countdown.events.on('end', () => {
      this.handleStorylineEnd();
    });

    this.flags = new FlagStore();
    this.questTracker = new QuestTracker(config, this.flags);

    this.questOverlay = new QuestOverlay(this.config, this.lang, this.questTracker);
    this.$element.append(this.questOverlay.$element);

    this.dialogueOverlay = new DialogueOverlay(this.config, this.lang);
    this.dialogueSequencer = new DialogueSequencer(this.dialogueOverlay);
    this.$element.append(this.dialogueOverlay.$element);

    this.scoringOverlay = new ScoringOverlay(this.config);
    this.$element.append(this.scoringOverlay.$element);

    // Temporary scoring manager
    const seenFlags = {};
    this.flags.events.on('flag', (flagId) => {
      if (seenFlags[flagId]) {
        return;
      }
      seenFlags[flagId] = true;
      if (flagId.startsWith('pnt.')) {
        const flagParts = flagId.split('.');
        const category = flagParts[1];
        if (category) {
          this.scoringOverlay.show(category);
        }
      }
    });

    this.showHitbox = false;
  }

  async init() {
    this.pixiApp = new PIXI.Application({
      // todo: get these from config or constants
      width: PlayerApp.APP_WIDTH,
      height: PlayerApp.APP_HEIGHT,
      backgroundColor: 0xffffff,
    });
    this.$pixiWrapper.append(this.pixiApp.view);

    await this.loadTextures();

    this.townView = new TownView(this.config, this.textures);
    this.townView.transform.scale = {x: 0.25, y: 0.25};
    this.pixiApp.stage.addChild(this.townView.transform);
    this.pcView = new PCView(this.config, this.textures, this.pc, this.townView);
    this.otherPcViews = Object.fromEntries(
      Object.entries(this.otherPcs)
        .map(([id, pc]) => [id, new PCView(this.config, this.textures, pc, this.townView)])
    );
    this.npcViews = Object.values(this.npcs).map(npc => new CharacterView(this.config, this.textures, npc, this.townView));

    this.townView.mainLayer.addChild(this.pcView.display);
    this.townView.bgLayer.addChild(this.pcView.hitboxDisplay);
    this.townView.mainLayer.addChild(...this.npcViews.map(npcView => npcView.display));
    if (Object.values(this.otherPcViews).length > 0) {
      this.townView.mainLayer.addChild(...Object.values(this.otherPcViews)
        .map(pcView => pcView.display));
    }

    this.stats = new Stats();
    this.$element.append(this.stats.dom);

    this.keyboardInputMgr = new KeyboardInputMgr();
    this.keyboardInputMgr.attachListeners();
    this.keyboardInputMgr.addToggle('KeyE', () => { this.countdown.forceEnd(); });
    this.keyboardInputMgr.addToggle('KeyD', () => { this.stats.togglePanel(); });
    this.keyboardInputMgr.addToggle('KeyH', () => { this.toggleHitboxDisplay(); });
    this.keyboardInputMgr.addToggle('KeyX', () => { console.log(`x: ${this.pc.position.x}, y: ${this.pc.position.y}`); });

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
    inputMgr.events.on('lang', () => { this.toggleLanguage(); });

    this.inputRouter = new PlayerAppInputRouter(inputMgr);
    this.inputRouter.routeToPcMovement(this);

    this.pixiApp.ticker.add((time) => {
      this.stats.frameBegin();
      inputMgrs.forEach((inputMgr) => inputMgr.update());
      if (this.canControlPc) {
        const { x, y } = inputMgr.getDirection();
        this.pc.setSpeed(x * 10, y * 10);
      }
      this.pcView.animate(time);
      Object.entries(this.otherPcViews).forEach(([, pcView]) => {
        pcView.display.position = pcView.pc.position;
        pcView.display.zIndex = pcView.pc.position.y;
      });
      this.townView.mainLayer.sortChildren();

      // Set the town view's pivot so the PC is always centered on the screen,
      // but don't let the pivot go off the edge of the town
      this.townView.display.pivot.set(
        Math.max(0, Math.min(this.pcView.display.x + this.pcView.display.width / 2 - PlayerApp.APP_WIDTH / 2, this.townView.townSize.width - PlayerApp.APP_WIDTH)),
        Math.max(0, Math.min(this.pcView.display.y + this.pcView.display.height / 2 - PlayerApp.APP_HEIGHT / 2 * 1.5, this.townView.townSize.height - PlayerApp.APP_HEIGHT)),
      );
      this.stats.frameEnd();
    });

    this.countdown.start();
    this.updateNpcMoods();
    this.questTracker.events.on('questActive', (questId) => {
      this.updateNpcMoods();
    });
    this.questTracker.events.on('questDone', (questId) => {
      this.updateNpcMoods();
    });

    return this;
  }

  async loadTextures() {
    PIXI.Assets.init({
      basePath: './static/textures',
      manifest: this.config.textures,
    });

    this.textures = await PIXI.Assets.loadBundle('town-view');
  }

  setLanguage(lang) {
    this.lang = lang;
    this.dialogueOverlay.setLang(this.lang);
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

  enablePcControl() {
    this.canControlPc = true;
  }

  disablePcControl() {
    this.canControlPc = false;
    this.pc.setSpeed(0, 0);
  }

  getDialogue(dialogueId) {
    const items = this.config.storylines.touristen.dialogues[dialogueId];
    if (!items) throw new Error(`No dialogue found with id ${dialogueId}`);
    try {
      return Dialogue.fromJson({
        id: dialogueId,
        items,
      });
    } catch (e) {
      if(e.errors) {
        console.error(`Error parsing dialogue with id ${dialogueId}:`);
        e.errors.forEach((error) => {
          console.error(error);
        });
      }
      throw e;
    }
  }

  getDialogueContext() {
    return {
      flags: this.flags,
        random: max => Math.floor(Math.random() * max),
    };
  }

  playDialogue(dialogue, npc = null) {
    this.inputRouter.routeToDialogueOverlay(this.dialogueOverlay, this.dialogueSequencer);
    this.dialogueSequencer.play(dialogue, this.getDialogueContext(), { top: npc.name });
    this.dialogueSequencer.events.once('end', () => {
      this.inputRouter.routeToPcMovement(this);
    });
  }

  getNpcsInRect(rect) {
    return this.npcViews.filter(npcView => npcView.inRect(rect))
      .map(npcView => npcView.character);
  }

  pcAction() {
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
      this.playDialogue(this.getDialogue(closestNpc.dialogue || closestNpc.id), closestNpc);
    }
    if (this.showHitbox) {
      this.pcView.showActionHitbox(hitbox);
    }
  }

  updateNpcMoods() {
    const npcsWithQuests = this.questTracker.getNpcsWithQuests();
    this.npcViews.forEach((npcView) => {
      if (Object.keys(npcsWithQuests).includes(npcView.character.id)) {
        npcView.showMoodBalloon(npcsWithQuests[npcView.character.id]);
      } else {
        npcView.hideMoodBalloon();
      }
    });
  }

  toggleHitboxDisplay() {
    this.showHitbox = !this.showHitbox;
  }

  handleStorylineEnd() {
    const [ endingText, classes ] = readEnding(this.getDialogue('_ending'), this.getDialogueContext());

    this.inputRouter.unroute();
    this.endingScreen = new DecisionScreen(this.config, this.lang);
    this.$element.append(this.endingScreen.$element);
    this.endingScreen.showDecision(endingText, classes);
  }
}

PlayerApp.APP_WIDTH = 1024;
PlayerApp.APP_HEIGHT = 768;
PlayerApp.FONT_RATIO = 0.0175; // 1.75% of the width of the app

module.exports = PlayerApp;
