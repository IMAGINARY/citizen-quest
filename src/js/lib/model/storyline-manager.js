const EventEmitter = require('events');
const safeBuildDialogueFromItems = require('../dialogues/dialogue-safe-builder');

class StorylineManager {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();
    this.currentStorylineId = null;
  }

  setCurrentStoryline(id) {
    if (this.currentStorylineId !== id) {
      this.currentStorylineId = id;
      this.events.emit('storylineChanged', id);
    }
  }

  getAllStorylineIds() {
    return Object.entries(this.config.storylines)
      .filter(([, storyline]) => storyline.enabled !== false)
      .map(([id]) => id);
  }

  getStoryline(id) {
    return this.config.storylines[id] || null;
  }

  getCurrentStoryline() {
    if (this.currentStorylineId === null) {
      return null;
    }

    return this.getStoryline(this.currentStorylineId);
  }

  getPrompt() {
    return this.getCurrentStoryline().prompt || null;
  }

  getDecision() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? currentStoryline.decision : null;
  }

  hasQuest(id) {
    return !!this.getCurrentStoryline()?.quests?.[id];
  }

  getQuest(id) {
    return this.getCurrentStoryline()?.quests?.[id] || null;
  }

  getAllQuests() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? currentStoryline.quests || {} : {};
  }

  getDialogue(id) {
    const currentStoryline = this.getCurrentStoryline();
    const items = currentStoryline ? currentStoryline.dialogues[id] : null;
    if (!items) throw new Error(`No dialogue found with id ${id}`);
    return safeBuildDialogueFromItems(id, items);
  }

  getNpcs() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? this.getCurrentStoryline().npcs || {} : {};
  }

  getEnding() {
    return this.getCurrentStoryline()?.ending || null;
  }

  getEndingDialogue() {
    const ending = this.getEnding();
    if (!ending || !ending.dialogue) {
      return null;
    }
    return safeBuildDialogueFromItems('ending', ending.dialogue);
  }
}

module.exports = StorylineManager;
