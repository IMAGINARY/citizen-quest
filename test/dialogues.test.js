const { expect } = require('chai');
const Dialogue = require('../src/js/lib/model/dialogues/dialogue');
const DialogueIterator = require('../src/js/lib/model/dialogues/dialogue-iterator');
const FlagStore = require('../src/js/lib/model/flag-store');
const { getText } = require('../src/js/lib/helpers/i18n');
const helloWorldDialogue = require('./fixtures/dialogues/core/hello-world.dialogue.json');
const helloThenWorldDialogue = require('./fixtures/dialogues/core/then.dialogue.json');
const sequenceDialogue = require('./fixtures/dialogues/sequences/sequence.dialogue.json');
const nestedSequencesDialogue = require('./fixtures/dialogues/sequences/nested-sequences.dialogue.json');
const sequenceWithSkipDialogue = require('./fixtures/dialogues/sequences/sequence-with-skip.dialogue.json');
const jumpIntoSequenceDialogue = require('./fixtures/dialogues/sequences/jump-into-sequence.dialogue.json');
const jumpToMidSequenceDialogue = require('./fixtures/dialogues/sequences/jump-to-mid-sequence.dialogue.json');
const jumpAroundWithSequencesDialogue = require('./fixtures/dialogues/sequences/jump-around-with-sequences.dialogue.json');
const randomDialogue = require('./fixtures/dialogues/random/random.dialogue.json');
const conditionDialogue = require('./fixtures/dialogues/conditions/condition.dialogue.json');
const setFlagsDialogue = require('./fixtures/dialogues/conditions/set-flags.dialogue.json');
const setFlagsIntDialogue = require('./fixtures/dialogues/conditions/set-flags-int.dialogue.json');
const setFlagsTouchDialogue = require('./fixtures/dialogues/conditions/set-flags-touch.dialogue.json');
const setFlagsIncDecDialogue = require('./fixtures/dialogues/conditions/set-flags-inc-dec.dialogue.json');
const logicDialogue = require('./fixtures/dialogues/conditions/logic.dialogue.json');
const comparisonDialogue = require('./fixtures/dialogues/conditions/comparison.dialogue.json');
const countDialogue = require('./fixtures/dialogues/conditions/count.dialogue.json');
const firstDialogue = require('./fixtures/dialogues/first/first-dialogue.json');
const firstWithCondsDialogue = require('./fixtures/dialogues/first/first-with-conds.json');
const firstBetweenSequencesDialogue = require('./fixtures/dialogues/first/first-between-sequences.json');
const responseDialogue = require('./fixtures/dialogues/responses/response.dialogue.json');
const conditionalResponseDialogue = require('./fixtures/dialogues/responses/conditional-response.dialogue.json');
const responseSetsFlagsDialogue = require('./fixtures/dialogues/responses/response-sets-flags.dialogue.json');
const responseJumpsDialogue = require('./fixtures/dialogues/responses/response-jumps.dialogue.json');
const thentextResponseDialogue = require('./fixtures/dialogues/responses/thentext-response.dialogue.json');
const helloWorldI18nDialogue = require('./fixtures/dialogues/i18n/hello-world-i18n.dialogue.json');
const thenTextResponseI18nDialogue = require('./fixtures/dialogues/i18n/thentext-response-i18n.dialogue.json');
const invalidTypeDialogue = require('./fixtures/dialogues/invalid/invalid-type.dialogue.json');
const invalidThenDialogue = require('./fixtures/dialogues/invalid/invalid-then.dialogue.json');
const invalidCondDialogue = require('./fixtures/dialogues/invalid/invalid-cond.dialogue.json');

const MAX_TRANSITIONS = 10;
function getTrace(iterator, input = [], lang = null) {
  const trace = [];
  let transitions = 0;
  const log = [];
  while (!iterator.isEnd()) {
    const activeNode = iterator.getActiveNode();
    log.push(activeNode.id);
    const { text } = activeNode;
    if (text !== undefined) {
      trace.push(getText(text, lang));
    }
    if (activeNode.responses && activeNode.responses.length > 0) {
      const responseIndex = input.shift();
      if (activeNode.responses[responseIndex] === undefined) {
        throw new Error(`Invalid input ${responseIndex} (${activeNode.id}:${iterator.dialogue.root.id})`);
      }
      const response = activeNode.responses[responseIndex];
      trace.push(`>> ${getText(response.text, lang)}`);
      if (response.thenText) {
        trace.push(getText(response.thenText, lang));
      }
      iterator.nextWithResponse(activeNode.responses[responseIndex].id);
    } else {
      iterator.next();
    }
    transitions += 1;
    if (transitions > MAX_TRANSITIONS) {
      throw new Error(`Exceeded max transitions (${MAX_TRANSITIONS}): ${log.join(' -> ')}`);
    }
  }
  return trace;
}

class TestContext {
  constructor() {
    this.randomValues = [];
    this.flags = new FlagStore();
  }

  setRandom(random) {
    this.randomValues = random;
  }

  random() {
    if (this.randomValues.length === 0) {
      throw new Error('Not enough random values set');
    }
    return this.randomValues.shift();
  }
}

describe('DialogueIterator', () => {
  describe('core functionality', () => {
    it('should handle a single statement', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(iterator.getActiveNode().id).to.equal('hello-world');
      expect(iterator.getActiveNode().type).to.equal('root');
      expect(getTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support resetting', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello world!']);
      iterator.reset();
      expect(getTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should handle statements connected by a then', () => {
      const dialogue = Dialogue.fromJson(helloThenWorldDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('sequences', () => {
    it('should handle a sequence', () => {
      const dialogue = Dialogue.fromJson(sequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle nested sequences', () => {
      const dialogue = Dialogue.fromJson(nestedSequencesDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle a sequence that skips midway', () => {
      const dialogue = Dialogue.fromJson(sequenceWithSkipDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!', 'End']);
    });

    it('should handle jumping into a sequence', () => {
      const dialogue = Dialogue.fromJson(jumpIntoSequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });

    it('should handle jumping around with sequences', () => {
      const dialogue = Dialogue.fromJson(jumpAroundWithSequencesDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['One', 'Two', 'Three', 'Four', 'Five']);
    });

    it('should handle jumping into the middle of a sequence', () => {
      const dialogue = Dialogue.fromJson(jumpToMidSequenceDialogue);
      const iterator = new DialogueIterator(dialogue, new TestContext());
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('random', () => {
    it('should handle a random statement', () => {
      const dialogue = Dialogue.fromJson(randomDialogue);
      const context = new TestContext();
      context.setRandom([0, 1]);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'World', '!']);
    });
  });

  describe('conditions', () => {
    it('should skip nodes with unmatched flags', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Neither']);
    });

    it('should enter nodes when flags are set', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestContext();
      context.flags.touch('even');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Two']);
    });

    it('should use conditions to filter items from sequences', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestContext();
      context.flags.touch('useSequence');
      context.flags.touch('possible');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should use conditions to filter items from random nodes', () => {
      const dialogue = Dialogue.fromJson(conditionDialogue);
      const context = new TestContext();
      context.setRandom([2]);
      context.flags.touch('useRandom');
      context.flags.touch('possible');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['right']);
    });

    it('should allow a dialogue to set flags', () => {
      const dialogue = Dialogue.fromJson(setFlagsDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.exists('aFlag')).to.be.true;
      expect(context.flags.exists('bFlag')).to.be.true;
      expect(context.flags.exists('cFlag')).to.be.false;
    });

    it('should allow a dialogue to set flags to integer literals', () => {
      const dialogue = Dialogue.fromJson(setFlagsIntDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
      expect(context.flags.value('cFlag')).to.equal(3);
    });

    it('should allow a dialogue to increment or decrement flags', () => {
      const dialogue = Dialogue.fromJson(setFlagsIncDecDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
      expect(context.flags.value('cFlag')).to.equal(3);
    });

    it('should not modify a flag if its already set', () => {
      const dialogue = Dialogue.fromJson(setFlagsTouchDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B']);
      expect(context.flags.value('aFlag')).to.equal(1);
      expect(context.flags.value('bFlag')).to.equal(2);
    });

    it('should support conditions with logic expressions', () => {
      const dialogue = Dialogue.fromJson(logicDialogue);
      const context = new TestContext();
      context.flags.touch('flagA');
      context.flags.touch('flagB');
      context.flags.touch('flagC');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should support conditions with comparisons', () => {
      const dialogue = Dialogue.fromJson(comparisonDialogue);
      const context = new TestContext();
      context.flags.set('flagA', 2);
      context.flags.set('flagB', 3);
      context.flags.set('flagC', 4);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });

    it('should support conditions with the count function', () => {
      const dialogue = Dialogue.fromJson(countDialogue);
      const context = new TestContext();
      context.flags.set('prefixA_flag1', 2);
      context.flags.set('prefixA_flag2', 3);
      context.flags.set('prefixB_flag1', 4);
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['A', 'B', 'C']);
    });
  });

  describe('first', () => {
    it('should support first type nodes', () => {
      const dialogue = Dialogue.fromJson(firstDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support first type nodes with conditions', () => {
      const dialogue = Dialogue.fromJson(firstWithCondsDialogue);
      const context = new TestContext();
      context.flags.touch('flagA');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Hello world!']);
    });

    it('should support first type nodes between sequences', () => {
      const dialogue = Dialogue.fromJson(firstBetweenSequencesDialogue);
      const context = new TestContext();
      context.flags.touch('flagA');
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator)).to.deep.equal(['Hello', 'world', '!']);
    });
  });

  describe('responses', () => {
    it('should support responses', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [1, 2])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'How are you?', '>> I\'m good, thanks!']
      );
    });

    it('should filter responses using conditions', () => {
      const dialogue = Dialogue.fromJson(conditionalResponseDialogue);
      const context = new TestContext();
      context.flags.touch('flagA');
      context.flags.touch('flagB');
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      iterator.getEnabledResponses().map(r => r.text);
      expect(iterator.getEnabledResponses().map(r => r.text)).to.deep.equal(
        ['Hello world!', 'Hello everyone!', '...']
      );
    });

    it('should support responses that set flags', () => {
      const dialogue = Dialogue.fromJson(responseSetsFlagsDialogue);
      const context = new TestContext();
      expect(context.flags.exists('programmer')).to.be.false;
      expect(context.flags.exists('polite')).to.be.false;
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [1])).to.deep.equal(
        ['Hello?', '>> Hello world!']
      );
      expect(context.flags.exists('programmer')).to.be.true;
      expect(context.flags.exists('polite')).to.be.false;
    });

    it('should support responses that jump to other nodes', () => {
      const dialogue = Dialogue.fromJson(responseJumpsDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [1])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'I see you\'re a programmer.']
      );
    });

    it('should support responses that generate text when selected', () => {
      const dialogue = Dialogue.fromJson(thentextResponseDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [2])).to.deep.equal(
        ['Hello?', '>> Hello world!', 'Are you a programmer?']
      );
    });

    it('should throw an exception if next() is called from a statement with responses', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      expect(() => iterator.next()).to.throw('Can\'t use next() on a node of type \'statement\' with responses');
    });

    it('should throw an exception if nextWithResponse() is called from a statement without responses', () => {
      const dialogue = Dialogue.fromJson(helloWorldDialogue);
      const iterator = new DialogueIterator(dialogue);
      iterator.next();
      expect(() => iterator.nextWithResponse(0)).to.throw('Can\'t use nextWithResponse on a node without responses');
    });

    it('should throw an exception if an invalid response is selected', () => {
      const dialogue = Dialogue.fromJson(responseDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      iterator.next();
      expect(() => iterator.nextWithResponse(3)).to.throw('Unknown response id: 3');
    });
  });

  describe('i18n', () => {
    it('should support texts in multiple languages', () => {
      const dialogue = Dialogue.fromJson(helloWorldI18nDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [], 'en')).to.deep.equal(['Hello world!']);
      iterator.reset();
      expect(getTrace(iterator, [], 'de')).to.deep.equal(['Hallo Welt!']);
    });

    it('should support responses in multiple languages', () => {
      const dialogue = Dialogue.fromJson(thenTextResponseI18nDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(getTrace(iterator, [2], 'en')).to.deep.equal(
        ['Hello?', '>> Hello world!', 'Are you a programmer?']
      );
      iterator.reset();
      expect(getTrace(iterator, [2], 'de')).to.deep.equal(
        ['Hallo?', '>> Hallo Welt!', 'Bist du ein Programmierer?']
      );
    });
  });

  describe('invalid dialogues', () => {
    it('should throw an exception if a node has an invalid type', () => {
      expect(() => Dialogue.fromJson(invalidTypeDialogue)).to.throw('validation failed');
    });

    it('should throw an exception if a node tries to transition to a non-existant node', () => {
      const dialogue = Dialogue.fromJson(invalidThenDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(() => getTrace(iterator)).to.throw('Can\'t find node id: non-existant');
    });

    it('should throw an exception if a node has a condition with invalid syntax', () => {
      const dialogue = Dialogue.fromJson(invalidCondDialogue);
      const context = new TestContext();
      const iterator = new DialogueIterator(dialogue, context);
      expect(() => getTrace(iterator)).to.throw('Error parsing condition');
    });
  });
});
