const EventEmitter = require('events');
const LogicParser = require('../dialogues/logic-parser');
const safeBuildDialogueFromItems = require('../dialogues/dialogue-safe-builder');

class QuestTracker {
  constructor(config, storylineManager, flags) {
    this.config = config;
    this.flags = flags;
    this.storylineManager = storylineManager;
    this.events = new EventEmitter();
    this.logicParser = new LogicParser({ flags });

    this.flags.events.on('flag', this.handleFlagChange.bind(this));

    this.activeQuestId = null;
    this.activeStage = null;
    this.stageCounter = null;
  }

  handleFlagChange(flag, value) {
    const flagParts = flag.split('.');
    if (flagParts.length === 3 && flagParts[0] === 'quest') {
      if (this.storylineManager.hasQuest(flagParts[1])) {
        if (flagParts[2] === 'active' && value === 1) {
          this.onQuestActive(flagParts[1]);
        } else if (flagParts[2] === 'done' && value === 1) {
          this.onQuestDone(flagParts[1]);
        }
      }
    }

    this.updateCounter();
    this.updateStage();
  }

  getAvailableQuests() {
    return Object.keys(this.storylineManager.getAllQuests())
      .filter((id) => !this.questIsDone(id) && this.questRequirementsMet(id))
      .slice(0, this.config.game.maxActiveQuests || 3);
  }

  getNpcsWithQuests() {
    const availableQuests = this.getAvailableQuests();
    return Object.fromEntries(
      Object.entries(this.storylineManager.getAllQuests())
        .filter(([id]) => availableQuests.includes(id))
        .map(([, props]) => [props.npc, props.mood])
    );
  }

  questIsDone(questId) {
    return !!this.flags.value(`quest.${questId}.done`);
  }

  questRequirementsMet(questId) {
    const requiredQuests = this.storylineManager.getQuest(questId).required || null;
    return !requiredQuests
      || [requiredQuests].flat().every((id) => this.questIsDone(id));
  }

  setActiveQuest(questId) {
    if (questId !== this.activeQuestId) {
      if (this.activeQuestId) {
        this.events.emit('questInactive', this.activeQuestId);
        this.flags.set(`quest.${this.activeQuestId}.active`, 0);
      }
      this.activeQuestId = questId;
      this.activeStage = null;
      this.stageCounter = null;
      if (questId) {
        this.events.emit('questActive', questId);
      }
      this.updateStage();
      this.updateCounter();
    }
  }

  setActiveStage(stage) {
    if (stage !== this.activeStage) {
      const oldStage = this.activeStage;
      this.activeStage = stage;
      this.stageCounter = null;
      this.events.emit('stageChanged', this.activeQuestId, stage, oldStage);
      this.updateCounter();
    }
  }

  setStageCounter(count) {
    if (count !== this.stageCounter) {
      const oldCount = this.stageCounter;
      this.stageCounter = count;
      this.events.emit('stageCountChanged', this.activeQuestId, count, oldCount);
    }
  }

  getActiveQuest() {
    return this.activeQuestId;
  }

  getActiveStage() {
    return this.activeStage;
  }

  getActivePrompt() {
    if (this.activeQuestId === null || this.activeStage === null) {
      return null;
    }
    return this.storylineManager.getQuest(this.activeQuestId).stages[this.activeStage].prompt;
  }

  getActiveStageCounter() {
    if (this.activeQuestId === null || this.activeStage === null || this.stageCounter === null) {
      return null;
    }

    return this.stageCounter;
  }

  getActiveStageCounterMax() {
    if (this.activeQuestId === null || this.activeStage === null) {
      return null;
    }

    const stage = this.storylineManager.getQuest(this.activeQuestId).stages[this.activeStage];
    if (stage.counter !== undefined) {
      return stage.counter.max;
    }
    return null;
  }

  updateStage() {
    if (!this.activeQuestId) {
      return;
    }
    const newStage = this.storylineManager.getQuest(this.activeQuestId).stages
      .findIndex((stage) => stage.cond === undefined || !!this.logicParser.evaluate(stage.cond));

    this.setActiveStage(newStage);
  }

  updateCounter() {
    if (this.activeQuestId === null || this.activeStage === null) {
      return;
    }
    const stage = this.storylineManager.getQuest(this.activeQuestId).stages[this.activeStage];
    if (stage.counter !== undefined) {
      const newCount = this.logicParser.evaluate(stage.counter.expression);
      this.setStageCounter(newCount);
    }
  }

  getDialogueItems(npcId) {
    // Concatenate, in order:
    // - dialogue items from the current stage
    // - dialogue items from the current quest
    // - dialogue items from all active quests
    // - dialogue items from the current storyline

    const currentStoryline = this.storylineManager.getCurrentStoryline();
    const currentQuest = this.storylineManager.getQuest(this.activeQuestId);
    const currentStage = currentQuest?.stages[this.activeStage];
    const storylineDialogue = currentStoryline?.dialogues?.[npcId];
    const npcDialogue = currentStoryline?.npcs?.[npcId]?.dialogue;
    const stageDialogue = currentStage?.dialogues?.[npcId];
    const questDialogue = currentQuest?.dialogues?.[npcId];
    return [
      ...(stageDialogue || []),
      ...(questDialogue || []),
      ...(this.getAvailableQuests()
        .filter((id) => this.storylineManager.getQuest(id)?.npc === npcId)
        .map((id) => this.storylineManager.getQuest(id)?.available?.dialogue || []).flat()),
      ...(npcDialogue || []),
      ...(storylineDialogue || []),
    ];
  }

  getDialogue(npcId) {
    return safeBuildDialogueFromItems(npcId, this.getDialogueItems(npcId));
  }

  onQuestActive(questId) {
    this.setActiveQuest(questId);
  }

  onQuestDone(questId) {
    this.events.emit('questDone', questId);
    this.setActiveQuest(null);
  }
}

module.exports = QuestTracker;
