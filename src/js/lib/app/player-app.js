/* eslint-disable no-console */
/* globals PIXI */
const logger = require('loglevel');
const PlayerAppStates = require('./player-app-states/states');
const getHandler = require('./player-app-states/get-handler');
const Stats = require('../helpers-web/stats/stats');
const GameView = require('../view-pixi/game-view');
require('../helpers-web/fill-with-aspect');
const KeyboardInputMgr = require('../input/keyboard-input-mgr');
const GamepadInputMgr = require('../input/gamepad-input-mgr');
const MultiplexInputMgr = require('../input/multiplex-input-mgr');
const PlayerAppInputRouter = require('../input/player-app-input-router');
const Character = require('../model/character');
const FlagStore = require('../model/flag-store');
const QuestTracker = require('../model/quest-tracker');
const PlayerOverlayManager = require('../view-html/player-overlay-mgr');
const DialogueSequencer = require('../model/dialogues/dialogue-sequencer');
const RoundTimer = require('../model/round-timer');
const readEnding = require('../model/dialogues/ending-reader');
const Scenery = require('../model/scenery');
const DialogueIteratorContext = require('../model/dialogues/dialogue-iterator-context');
const DialogueEffectFactory = require('../model/dialogues/effects/dialogue-effect-factory');
require('../model/dialogues/effects/dialogue-effect-init');
const HintManager = require('../model/hint-manager');
const { rotateLogLevel } = require('../helpers/configure-logger');


class PlayerApp {
  constructor(config, textures, playerId) {
    this.config = config;
    this.textures = textures;
    this.lang = config.game.defaultLanguage;
    this.playerId = playerId;
    this.cacheBuster = Date.now();

    // Game logic
    this.storylineId = null;
    this.flags = new FlagStore();
    this.dialogueIteratorContext = new DialogueIteratorContext(this.flags);

    this.questTracker = new QuestTracker(config, this.flags);
    this.roundTimer = new RoundTimer(config.game.duration);
    this.hintManager = new HintManager(config);

    this.pc = null;
    this.canControlPc = false;
    this.remotePcs = {};

    this.npcMoodsVisible = false;

    this.stateHandler = null;
    this.gameServerController = null;

    this.playerOverlayMgr = new PlayerOverlayManager(config, this.lang, playerId, this.flags);
    this.$element = this.playerOverlayMgr.$element;
    this.$element.addClass(`theme-${config.game.theme ?? 'default'}`);
    this.stats = new Stats();
    this.playerOverlayMgr.$element.append(this.stats.dom);

    this.dialogueEffectFactory = new DialogueEffectFactory(this);
    this.dialogueSequencer = new DialogueSequencer(
      this.dialogueEffectFactory,
      this.playerOverlayMgr.dialogueOverlay
    );

    // Temporary scoring manager
    this.seenFlags = {};
    this.flags.events.on('flag', (flagId, value, oldValue, setter) => {
      if (this.seenFlags[flagId]) {
        return;
      }
      this.seenFlags[flagId] = true;
      // Reset the hint manager when a new flag is set, since setting flags
      // typically indicates progress
      this.hintManager.reset();
      if (flagId.startsWith('pnt.') && setter !== 'remote') {
        const flagParts = flagId.split('.');
        const type = flagParts[1];
        if (type) {
          this.playerOverlayMgr.scoringOverlay.showAchievement(type);
        }
      }

      if (flagId.startsWith('inc.') && setter !== 'remote' && setter !== 'init') {
        const flagParts = flagId.split('.');
        const type = flagParts[1];
        if (type) {
          this.playerOverlayMgr.scoringOverlay.showInclusion(type);
        }
      }
      this.updateScenery();
      this.updateNpcs();
    });

    const width = this.config?.game?.playerAppWidth ?? 1024;
    const height = this.config?.game?.playerAppHeight ?? 768;

    // PIXI
    this.pixiApp = new PIXI.Application({
      width,
      height,
      backgroundColor: 0xffffff,
    });
    this.playerOverlayMgr.$pixiWrapper.append(this.pixiApp.view);

    this.gameView = new GameView(config, textures, this.pixiApp, width, height);
    this.pixiApp.stage.addChild(this.gameView.getDisplay());

    this.inputMgr = this.createInputMgr();
    this.inputRouter = new PlayerAppInputRouter(this.inputMgr);

    // Game loop
    this.pixiApp.ticker.add((time) => {
      this.stats.frameBegin();
      this.inputMgr.update();
      if (this.canControlPc && this.pc) {
        const { x, y } = this.inputMgr.getDirection();
        this.pc.setSpeed(x * 10, y * 10);
      }

      this.gameView.animate(time);
      this.stats.frameEnd();
    });

    this.questTracker.events.on('storylineChanged', (storylineId) => {
      this.gameView.removeAllNpcs();
      this.gameView.removeAllScenery();
      const storyline = this.config?.storylines?.[storylineId];
      if (storyline) {
        Object.entries(storyline.scenery || {}).forEach(([id, props]) => {
          this.gameView.addScenery(new Scenery(id, props));
        });
        this.updateScenery();
        Object.entries(storyline.npcs).forEach(([id, props]) => {
          this.gameView.addNpc(new Character(id, props));
        });
        this.updateNpcs();
        this.updateNpcMoods();
        this.gameView.resetDroneTargets();
        this.playerOverlayMgr.decisionLabelI18n.setText(storyline.decision || '');
        this.gameView.sortScenery();
      }
    });

    this.questTracker.events.on('questActive', () => {
      this.hintManager.reset();
      this.updateScenery();
      this.updateNpcs();
      this.updateNpcMoods();
    });

    this.questTracker.events.on('questDone', () => {
      this.hintManager.reset();
      this.updateScenery();
      this.updateNpcs();
      this.updateNpcMoods();
      this.playerOverlayMgr.markQuestDone();
    });

    this.questTracker.events.on('stageChanged', (questId, stage, oldStage) => {
      if (oldStage !== null) {
        this.playerOverlayMgr.markStageDone();
      }
      this.hintManager.reset();
      this.playerOverlayMgr.showQuestPrompt(
        this.questTracker.getActiveStagePrompt(),
        this.questTracker.getActiveStageCounter()
      );
      this.gameView.updateTargetArrow(this.questTracker.getActiveStageTarget());
    });

    this.questTracker.events.on('stageCountChanged', (questId, count) => {
      this.playerOverlayMgr.setQuestStageCounter(count);
    });

    this.questTracker.events.on('noQuest', () => {
      this.playerOverlayMgr.showDefaultPrompt();
      this.gameView.updateTargetArrow(null);
    });

    this.questTracker.events.on('hintLevelChanged', () => {
      const activePrompt = this.questTracker.getActiveStagePrompt();
      if (activePrompt) {
        this.playerOverlayMgr.changeQuestPromptText(activePrompt);
        this.gameView.updateTargetArrow(this.questTracker.getActiveStageTarget());
      }
    });

    this.hintManager.events.on('hintNeeded', () => {
      this.questTracker.incHintLevel();
    });

    this.roundTimer.events.on('update', (timeLeft) => {
      this.playerOverlayMgr.countdown.set(timeLeft);
    });

    this.roundTimer.events.on('end', () => {
      this.gameServerController.roundEnd();
    });
  }

  refresh() {
    this.playerOverlayMgr.refresh();
  }

  createInputMgr() {
    const keyboardInputMgr = new KeyboardInputMgr();
    keyboardInputMgr.attachListeners();
    if (this.config.game.devModeShortcuts !== false
      || this.config.game.userModeShortcuts !== false) {
      keyboardInputMgr.addToggle('KeyE', () => {
        this.gameServerController.roundEnd();
      });

      keyboardInputMgr.addToggle('KeyT', () => {
        this.questTracker.incHintLevel();
      });
    }
    if (this.config.game.devModeShortcuts !== false) {
      keyboardInputMgr.addToggle('KeyD', () => {
        this.stats.togglePanel();
      });
      keyboardInputMgr.addToggle('KeyF', () => {
        console.log(this.flags.dump());
      });
      keyboardInputMgr.addToggle('KeyH', () => {
        this.gameView.toggleHitboxDisplay();
      });
      keyboardInputMgr.addToggle('KeyC', () => {
        rotateLogLevel();
      });
      keyboardInputMgr.addToggle('KeyS', () => {
        this.gameView.toggleSceneryTransparency();
      });
      keyboardInputMgr.addToggle('KeyX', () => {
        if (this.pc) {
          console.log(`x: ${this.pc.position.x}, y: ${this.pc.position.y}`);
        } else {
          console.log('No PC');
        }
      });
    }

    const playerConfig = this.config?.players?.[this.playerId];
    const gamepadInputMgr = new GamepadInputMgr(
      playerConfig?.gamepadMapping ?? {},
      playerConfig?.gamepad ?? null
    );
    gamepadInputMgr.attachListeners();

    const multiplexInputMgr = new MultiplexInputMgr(
      keyboardInputMgr,
      gamepadInputMgr
    );
    multiplexInputMgr.attachListeners();

    const inputMgr = multiplexInputMgr;
    inputMgr.events.on('lang', () => {
      this.toggleLanguage();
    });

    return inputMgr;
  }

  setGameServerController(gameServerController) {
    this.gameServerController = gameServerController;
  }

  setStoryline(storylineId) {
    this.storylineId = storylineId;
    this.resetGameState();
  }

  resetGameState() {
    this.questTracker.setActiveStoryline(this.storylineId);
    this.dialogueIteratorContext.clearState();
    this.seenFlags = {};
  }

  getState() {
    return (this.stateHandler && this.stateHandler.state) || null;
  }

  getStateHandler() {
    return this.stateHandler ?? null;
  }

  setState(state) {
    // Check if the state is in PlayerApp.States
    if (Object.values(PlayerAppStates).indexOf(state) === -1) {
      throw new Error(`Error: Attempting to set invalid state ${state}`);
    }

    if (this.stateHandler && this.stateHandler.state === state) {
      return;
    }

    this.clearStateTimeout();
    const fromState = this.getState();
    const newHandler = getHandler(this, state);

    if (this.stateHandler) {
      this.stateHandler.onExit(state);
    }
    logger.info(`State change: ${fromState} -> ${state}`);
    this.stateHandler = newHandler;
    if (this.stateHandler) {
      this.stateHandler.onEnter(fromState);
    }
  }

  setStateTimeout(duration) {
    this.stateTimeout = setTimeout(() => {
      logger.info(`State '${this.stateHandler.state}' timeout after ${duration}ms`);
      this.stateHandler.onTimeout();
    }, duration);
  }

  clearStateTimeout() {
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }
  }

  isRoundInProgress() {
    return this.gameServerController?.isRoundInProgress() ?? false;
  }

  isRoundCompleted() {
    return this.gameServerController?.isRoundCompleted() ?? false;
  }

  setLanguage(lang) {
    logger.info(`Setting language to ${lang}`);
    this.lang = lang;
    this.playerOverlayMgr.setLang(lang);
  }

  toggleLanguage() {
    const langIndex = this.config.game.languages.indexOf(this.lang);
    if (langIndex === this.config.game.languages.length - 1) {
      this.setLanguage(this.config.game.languages[0]);
    } else {
      this.setLanguage(this.config.game.languages[langIndex + 1]);
    }
  }

  addPc() {
    logger.info(`Adding PC (id=${this.playerId})`);
    this.pc = new Character(this.playerId, this.config.players[this.playerId]);
    this.gameView.addPc(this.pc);
    this.gameView.cameraFollowPc();
  }

  removePc() {
    logger.info('Removing PC');
    this.gameView.cameraStop();
    this.gameView.removePc();
    this.pc = null;
  }

  hasPc() {
    return this.pc !== null;
  }

  getPc() {
    return this.pc;
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
    return this.dialogueIteratorContext;
  }

  playDialogue(dialogue, npc = null) {
    this.gameView.hideDistractions();
    this.gameView.cameraUsePreset('dialogue');
    this.inputRouter.routeToDialogueOverlay(
      this.playerOverlayMgr.dialogueOverlay,
      this.dialogueSequencer
    );
    const title = npc ? npc.name : null;
    let hintManagerReset = false;
    this.hintManager.events.once('reset', () => {
      hintManagerReset = true;
    });
    this.dialogueSequencer.play(dialogue, this.getDialogueContext(), { top: title });
    this.dialogueSequencer.events.once('end', () => {
      this.inputRouter.routeToNone();
      // Add a delay to avoid accidental re-triggering of the dialogue
      setTimeout(() => {
        // Check that the input router was not re-routed during the delay
        // (e.g. game finishing)
        if (!this.inputRouter.isRouted()) {
          this.inputRouter.routeToPcMovement(this);
        }
      }, 500);
      this.gameView.cameraUsePreset('walking');
      this.gameView.showDistractions();
      if (!hintManagerReset) {
        // We only count the dialogues in which the hint manager was not reset
        this.hintManager.handleDialogue(npc.id);
      }
    });
  }

  pcAction() {
    const pcView = this.gameView.getPcView();
    if (!pcView) {
      return;
    }
    this.gameView.handlePcAction();
    const hitbox = pcView.getActionHitbox();
    const npcs = this.gameView.getNpcViewsInRect(hitbox)
      .filter((npcView) => npcView.isVisible())
      .map((view) => view.character);
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
      this.playDialogue(this.questTracker.getNpcDialogue(closestNpc.id), closestNpc);
    }
  }

  menuAction() {
    this.stateHandler.onAction();
  }

  startSession() {
    if (this.gameServerController) {
      this.gameServerController.startSession();
    }
  }

  endSession() {
    if (this.gameServerController) {
      this.gameServerController.endSession();
    }
  }

  isSessionActive() {
    return this.gameServerController?.isSessionActive() ?? false;
  }

  playerReady() {
    if (this.gameServerController) {
      this.gameServerController.playerReady();
    }
  }

  updateNpcMoods() {
    const npcsWithQuests = this.questTracker.getNpcsWithQuests();
    const canSwitchQuests = this.config.game.canSwitchQuests !== undefined
      ? this.config.game.canSwitchQuests : true;
    const showMoods = this.npcMoodsVisible
      && (!this.questTracker.hasActiveQuest() || canSwitchQuests)
      && Object.keys(npcsWithQuests).length > 0;
    this.gameView.getAllNpcViews().forEach((npcView) => {
      if (showMoods && Object.keys(npcsWithQuests).includes(npcView.character.id)) {
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

  updateScenery() {
    const storyline = this.config.storylines[this.storylineId];
    Object.entries(storyline.scenery || {}).forEach(([id, props]) => {
      // If the scenery has a cond property, evaluate it
      if (props.cond) {
        const conditionMet = this.questTracker.isConditionMet(props.cond);
        if (conditionMet) {
          this.gameView.ensureSceneryVisible(id);
        } else {
          this.gameView.ensureSceneryHidden(id);
        }
      }
    });
  }

  updateNpcs() {
    const storyline = this.config.storylines[this.storylineId];
    Object.entries(storyline.npcs || {}).forEach(([id, props]) => {
      // If the npc has a cond property, evaluate it
      if (props.cond) {
        const conditionMet = this.questTracker.isConditionMet(props.cond);
        if (conditionMet) {
          this.gameView.ensureNpcVisible(id);
        } else {
          this.gameView.ensureNpcHidden(id);
        }
      }
    });
  }

  getCurrentEnding() {
    return readEnding(
      this.questTracker.getEndingDialogue(),
      this.getDialogueContext()
    );
  }

  getStorylineImageUrl(filename) {
    const imagePath = this.config.game.storylineImagePaths.replace('%storyline%', this.storylineId);
    const ensureSlash = imagePath.charAt(imagePath.length - 1) !== '/' ? '/' : '';
    return `${imagePath}${ensureSlash}${filename}?t=${this.cacheBuster}`;
  }
}

module.exports = PlayerApp;
