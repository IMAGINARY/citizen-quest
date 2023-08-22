const EventEmitter = require('events');
const Dialogue = require('../dialogues/dialogue');

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

  getDecision() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? currentStoryline.decision : null;
  }

  hasQuest(id) {
    return this.getCurrentStoryline().quests[id] !== undefined;
  }

  getQuest(id) {
    return this.getCurrentStoryline().quests[id] || null;
  }

  getAllQuests() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? currentStoryline.quests || {} : {};
  }

  getDialogue(id) {
    const currentStoryline = this.getCurrentStoryline();
    const items = currentStoryline ? currentStoryline.dialogues[id] : null;
    if (!items) throw new Error(`No dialogue found with id ${id}`);
    try {
      return Dialogue.fromJson({
        id,
        items,
      });
    } catch (e) {
      if (e.errors) {
        const errorText = [];
        errorText.push(`Error parsing dialogue with id ${id}:`);
        e.errors.forEach((error) => {
          errorText.push(`- ${error}`);
        });
        throw new Error(errorText.join('\n'));
      }
      throw e;
    }
  }

  getNpcs() {
    const currentStoryline = this.getCurrentStoryline();
    return currentStoryline ? this.getCurrentStoryline().npcs || {} : {};
  }
}

module.exports = StorylineManager;