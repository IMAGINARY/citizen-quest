const Ajv = require('ajv');
const AjvErrors = require('ajv-errors');
const schema = require('../../../../specs/storyline.schema.json');
const dialogueSchema = require('../../../../specs/dialogue.schema.json');
const { fromJson } = require('../dialogues/dialogue');
const LogicParser = require('../dialogues/logic-parser');

function validateStorylineQuestNpcs(storyline) {
  // Every npc in /quests/*/npc must be defined in /npcs
  const npcs = storyline.npcs ? Object.keys(storyline.npcs) : [];
  Object.keys(storyline.quests || {}).forEach((questId) => {
    const quest = storyline.quests[questId];
    if (quest.npc && !npcs.includes(quest.npc)) {
      throw new Error(`Quest ${questId} references undefined npc ${quest.npc}`);
    }
  });
}

function validateStorylineQuestRequirements(storyline) {
  // Every quest in /quests/*/required must be defined in /quests
  const quests = storyline.quests ? Object.keys(storyline.quests) : [];
  Object.keys(storyline.quests || {}).forEach((questId) => {
    const quest = storyline.quests[questId];
    if (quest.required) {
      const requirements = Array.isArray(quest.required)
        ? quest.required : [quest.required];
      requirements.forEach((requirement) => {
        if (!quests.includes(requirement)) {
          throw new Error(`Quest ${questId} references undefined quest ${requirement}`);
        }
      });
    }
  });
}

function validateStorylineQuestActivatesItself(storyline) {
  // The dialogue in /quests/*/available/dialogues must set the quest to active
  // through the existance of one 'set' property that includes the quest ID.
  // Also, it must not set any other quest to active.

  Object.keys(storyline.quests || {}).forEach((questId) => {
    const activation = `quest.${questId}.active`;
    if (storyline.quests[questId].available && storyline.quests[questId].available.dialogue) {
      const dialogue = fromJson({
        id: `quest-${questId}-available`,
        items: storyline.quests[questId].available.dialogue,
      });
      let isQuestActivated = false;
      dialogue.nodes.forEach((node) => {
        if (node.set) {
          isQuestActivated = isQuestActivated || node.set.includes(activation);
          // Check that no other quest is activated
          node.set.forEach((flag) => {
            if (flag.startsWith('quest.') && flag.endsWith('.active') && flag !== activation) {
              throw new Error(`Quest ${questId} activates another quest (${flag})`);
            }
          });
        }
        if (node.responses) {
          node.responses.forEach((response) => {
            if (response.set) {
              isQuestActivated = isQuestActivated || response.set.includes(activation);
              response.set.forEach((flag) => {
                if (flag.startsWith('quest.') && flag.endsWith('.active') && flag !== activation) {
                  throw new Error(`Quest ${questId} activates another quest (${flag})`);
                }
              });
            }
          });
        }
      });
      if (!isQuestActivated) {
        throw new Error(`Quest ${questId} is never activated`);
      }
    }
  });
}

function validateStorylineQuestCompletes(storyline) {
  // There must be at least one quest.<questId>.done flag in one of the
  // dialogues in one of the stages of the quest.

  Object.keys(storyline.quests || {}).forEach((questId) => {
    const completion = `quest.${questId}.done`;
    let isQuestCompleted = false;
    if (storyline.quests[questId].stages) {
      storyline.quests[questId].stages.forEach((stage, i) => {
        if (stage.dialogues) {
          Object.keys(stage.dialogues || {}).forEach((npcId) => {
            const dialogue = fromJson({
              id: `quest-${questId}-${i}-${npcId}`,
              items: stage.dialogues[npcId],
            });
            dialogue.nodes.forEach((node) => {
              if (node.set) {
                isQuestCompleted = isQuestCompleted || node.set.includes(completion);
              }
              if (node.responses) {
                node.responses.forEach((response) => {
                  if (response.set) {
                    isQuestCompleted = isQuestCompleted || response.set.includes(completion);
                  }
                });
              }
            });
          });
        }
      });
    }
    if (!isQuestCompleted) {
      throw new Error(`Quest ${questId} sets no flags to complete itself.`);
    }
  });
}

function validateStorylineQuestStageCounter(storyline) {
  const parser = new LogicParser({ flags: { value: () => 0, all: () => [] } });
  // Every expression in /quests/*/stages/*/counter/expression must be valid
  Object.keys(storyline.quests || {}).forEach((questId) => {
    const quest = storyline.quests[questId];
    if (quest.stages) {
      quest.stages.forEach((stage) => {
        if (stage.counter && stage.counter.expression) {
          parser.evaluate(stage.counter.expression);
        }
      });
    }
  });
}

function validateStorylineQuestStageCond(storyline) {
  // Every expression in /quests/*/stage/cond must be valid
  const parser = new LogicParser({ flags: { value: () => 0, all: () => [] } });
  Object.keys(storyline.quests || {}).forEach((questId) => {
    const quest = storyline.quests[questId];
    if (quest.stages) {
      quest.stages.forEach((stage) => {
        if (stage.cond) {
          parser.evaluate(stage.cond);
        }
      });
    }
  });
}

function validateExpressions(storyline) {
  validateStorylineQuestStageCond(storyline);
  validateStorylineQuestStageCounter(storyline);
}

function validateStorylineEndingDialogue(storyline) {
  if (storyline?.ending?.dialogue) {
    const dialogue = fromJson({
      id: 'ending',
      items: storyline.ending.dialogue,
    });

    if (dialogue.nodes.find((node) => node.responses)) {
      throw new Error('Ending dialogue nodes must not have responses');
    }
  }
}

/**
 * Check if the storyline is valid using the schema.
 */
function validateStorylineUsingSchema(storylineDefinition) {
  if (!validateStorylineUsingSchema.validate) {
    const ajv = new Ajv({ allErrors: true }); // allErrors required by ajv-errors
    AjvErrors(ajv);
    validateStorylineUsingSchema.validate = ajv
      .addSchema(dialogueSchema)
      .compile(schema);
  }
  const valid = validateStorylineUsingSchema.validate(storylineDefinition);
  if (!valid) {
    throw new Error(`Error validating storyline: ${validateStorylineUsingSchema.validate.errors.map(e => `- ${e.instancePath}: ${e.message}`).join('\n')}`);
  }
  return true;
}

/**
 * Perform various validations to a storyline object.
 * @param storyline
 */
function validateStoryline(storyline) {
  validateStorylineUsingSchema(storyline);
  validateStorylineQuestNpcs(storyline);
  validateStorylineQuestRequirements(storyline);
  validateStorylineQuestActivatesItself(storyline);
  validateExpressions(storyline);
  validateStorylineQuestCompletes(storyline);
  validateStorylineEndingDialogue(storyline);
}

module.exports = {
  validateStorylineUsingSchema,
  validateStoryline,
};
