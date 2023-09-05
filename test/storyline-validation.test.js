const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chai = require('chai');
const { validateStoryline } = require('../src/js/lib/model/storyline-validation');

const { expect } = chai;
chai.config.truncateThreshold = 0;

function loadFixture(name) {
  return yaml.load(fs.readFileSync(path.join(__dirname, 'fixtures', 'storylines', name)));
}

describe('Storyline validation', () => {
  describe('schema', () => {
    it('should accept a minimal storyline', () => {
      const storyline = loadFixture('schema/minimal.yml');
      expect(() => validateStoryline(storyline)).to.not.throw();
    });

    it('should accept a complete storyline', () => {
      const storyline = loadFixture('schema/complete.yml');
      expect(() => validateStoryline(storyline)).to.not.throw();
    });

    it('should validate the "decision" field', () => {
      const storyline = loadFixture('schema/bad-decision.yml');
      expect(() => validateStoryline(storyline)).to.throw('must be a string or an object');
    });

    it('should validate the "prompt" field', () => {
      const storyline = loadFixture('schema/bad-prompt.yml');
      expect(() => validateStoryline(storyline)).to.throw('must be a string or an object');
    });

    it('should validate the "npcs" field', () => {
      const storyline = loadFixture('schema/bad-npcs.yml');
      expect(() => validateStoryline(storyline)).to.throw('must be object');
    });

    it('should validate that npcs have required properties', () => {
      const storyline = loadFixture('schema/bad-npc.yml');
      expect(() => validateStoryline(storyline)).to.throw('must have required property \'spawn\'');
    });

    it('should validate npc dialogues', () => {
      const storyline = loadFixture('schema/bad-npc-dialogue.yml');
      expect(() => validateStoryline(storyline)).to.throw('/npcs/mayor/dialogue/0');
    });

    it('should validate quests', () => {
      const storyline = loadFixture('schema/bad-quest.yml');
      expect(() => validateStoryline(storyline)).to.throw('must have required property \'npc\'');
    });

    it('should validate quest available dialogues', () => {
      const storyline = loadFixture('schema/bad-quest-available.yml');
      expect(() => validateStoryline(storyline)).to.throw('/quests/mayorIdea/available/dialogue: must be array');
    });

    it('should validate quest requirements', () => {
      const storyline = loadFixture('schema/bad-quest-requirement.yml');
      expect(() => validateStoryline(storyline)).to.throw('must be a quest ID or an array of quest IDs');
    });
  });

  describe('references', () => {
    it('should validate that quests reference existing NPCs', () => {
      const storyline = loadFixture('references/bad-npc-reference.yml');
      expect(() => validateStoryline(storyline)).to.throw('references undefined npc notTheMayor');
    });

    it('should validate that quests reference existing quests', () => {
      const storyline = loadFixture('references/bad-quest-requirement.yml');
      expect(() => validateStoryline(storyline)).to.throw('references undefined quest unexistingQuest');
    });

    it('should validate that quests have a dialogue that activates them', () => {
      const storyline = loadFixture('references/bad-quest-not-activated.yml');
      expect(() => validateStoryline(storyline)).to.throw('is never activated');
    });

    it('should validate that quests do not activate other quests', () => {
      const storyline = loadFixture('references/bad-quest-activates-other.yml');
      expect(() => validateStoryline(storyline)).to.throw('activates another quest (quest.mayorIdea.active)');
    });

    it('should validate that quests have a dialogue that completes them', () => {
      const storyline = loadFixture('references/bad-quest-not-complete.yml');
      expect(() => validateStoryline(storyline)).to.throw('Quest mayorIdea sets no flags to complete itself');
    });
  });

  describe('expressions', () => {
    it('should validate that stage counter expressions are valid', () => {
      const storyline = loadFixture('expressions/bad-stage-counter.yml');
      expect(() => validateStoryline(storyline)).to.throw('Invalid term: <');
    });

    it('should validate that stage condition expressions are valid', () => {
      const storyline = loadFixture('expressions/bad-stage-condition.yml');
      expect(() => validateStoryline(storyline)).to.throw('unexpected EOF');
    });
  });

  describe('dialogues', () => {
    it('should validate that the ending dialogue doesn\'t have nodes with resposes', () => {
      const storyline = loadFixture('dialogues/bad-ending-responses.yml');
      expect(() => validateStoryline(storyline)).to.throw('Ending dialogue nodes must not have responses');
    });
  });

  describe('game storylines', () => {
    it('should validate the "touristen" storyline', () => {
      const storyline = loadFixture('../../../config/storylines/touristen.yml')
        .storylines.touristen;
      expect(() => validateStoryline(storyline)).to.not.throw();
    });
  });
});
