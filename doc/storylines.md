# Storylines

Dialogues describe the game's goals and interactions during a round. Think of it like a "level",
except that storylines are rotated constantly and each game involves a single storyline.

Storylines are described through a YAML file.

The schema is defined in [storylines.schema.json](../specs/storyline.schema.json).

## Storyline format

```yaml
decision:
  en: "Should we celebrate cake day?"
  es: "¿Deberíamos celebrar el día de las tortas?"
prompt:
  en: "Should we celebrate cake day? Talk to people to find out."
  es: "¿Deberíamos celebrar el día de las tortas? Habla con la gente para averiguarlo."
npcs:
  mayor:
    name:
      en: Mayor
      es: Alcalde
    spawn: { x: 0, y: 0 }
    dialogue:
      - text:
          en: "I like cake."
          es: "Me gusta la torta."
  baker:
    name: Joe Baker
    spawn: { x: 100, y: 100 }
quests:
  mayorIdea:
    npc: mayor
    mood: cake
    available:
      dialogue:
        - text:
            en: "We should ask the baker."
            es: "Deberíamos preguntarle al panadero."
          set: ['quest.mayorIdea.active']
    stages:
      - prompt:
          en: "Go talk to the baker"
          es: "Ve a hablar con el panadero"
        dialogues:
          mayor:
            - text:
                en: "Did you talk to the baker? Come back when you did."
                es: "¿Hablaste con el panadero? Vuelve cuando lo hayas hecho."
          baker:
            - text:
                en: "I agree about celebrating cake day."
                es: "Estoy de acuerdo con celebrar el día de las tortas."
              set: ['talkedToBaker']
      - cond: 'talkedToBaker'
        dialogues:
          mayor:
            - text:
                en: "Then it's decided!"
                es: "¡Entonces está decidido!"
              set: ['quest.mayorIdea.done']
```

The top-level properties in a storyline are:

- **decision**: (text) The decision that the city is facing in this storyline. This is displayed in
  the city map screen.
- **prompt**: (text) The initial prompt that will be shown on player screens before any quests 
  become active.
- **npcs**: (npc) The npcs that participate in this story.
- **quests**: (quest) The quests that are available in this story.
- **ending** (ending) How the story ends.

Each of these parts will be described in more detail below.

### Texts

Texts can be strings or objects. If they are objects, they are keyed by language code, and the
value is the text in that language.

e.g.

```yaml
text: "Hello!"
```

or

```yaml
text:
  en: "Hello!"
  es: "¡Hola!"
  de: "Hallo!"
```

### Dialogues

Storylines can contain dialogues in several places. Dialogues are described in detail in 
their own document, [dialogues.md](dialogues.md).

Within a storyline, a dialogue is specified simply as an array of root level nodes. i.e. There's no 
need to write the top level node with `id` and `items` properties, just the array of items that 
would go within `items`.

#### Use of flags

There are two types of flags that are synchronized between clients:

- Those beginning with `pnt.`, which are used to track "scoring".
- Those beginning with `quest.`, and ending with `.done` which are used to track quest completion.

### NPCs

NPCs are listed at the top level of the storyline in an object. The keys in this object are the
IDs of the npcs. These IDs are used to refer to the NPCs in quests, and also are used to pick
the texture that the character will be rendered with on screen.

NPCs are specified through these properties:

- **name**: (text) The name of the NPC. This is displayed at the top of dialogue windows when the 
  character speaks.
- **spawn**: (point) The position where the NPC will be spawned in the city map screen.
- **dialogue**: (dialogue) The dialogues that the NPC will say when the player talks to them. 

### Dialogue overriding

Whenever a player character talks to an NPC, a dialogue executed. This dialogue is built by 
concatenating, in order, the list of nodes in several different places:

- The dialogue from the current stage
- The dialogue from the current quest
- The dialogue from the `available` section of all available quests that the npc hands out.
- The dialogue from the current storyline

The more specific dialogues take precedence over the more general ones.

### Quests

Quests are listed at the top level of the storyline in an object. The keys in this object are the
IDs of the quests. These IDs are used to refer to the quests in other parts of the storyline.

Quests are specified through these properties:

- **npc**: (npc) The NPC that hands out this quest.
- **mood**: (string) The "mood" is the icon that is shown in the dialogue balloon above the npc's
  head when they have a quest available. This is a string that is used to look up the icon in the
  game's icon set.
- **available.dialogue**: (dialogue) The dialogue that the NPC says when the quest is available.
- **stages**: (array<stage>) The stages of the quest.
- **required**: (string | array<string>, optional) One or more quests that must be completed for 
  this quest to be available.

Within the `available` dialogue, there should be a node that sets the `quest.<questId>.active` flag,
which activates the quest. This flag can be set by a node, or by a response within a node.

### Stages

Quests are made up of one or more stages. You can think of them as sub-quests.

Stages are specified through these properties:

- **prompt**: (text) The prompt that is shown to the player when the stage is active.
- **dialogues**: (dialogue) The dialogues that NPCs says when the stage is active.
- **cond**: (string, optional) A condition that must be true for the stage to be active.
- **counter**: (counter, optional) If the stage involves collecting several things of a kind,
  this is the counter that tracks the progress of the collection.

Stages are evaluated from top to bottom. The first stage that has a valid condition (or none) is 
the one that is active.

In at least one of the stages, there should be a node that sets the `quest.<questId>.done` flag,
which indicates that the quest is complete. This flag can be set by a node, or by a response within
a node.

#### Counters

Counters are used to track the progress of a stage. They are specified through these properties:

- **expression**: (string) An expression that evaluates to the current count.
- **max**: (number) The maximum value that the counter can reach.

Currently expressions can only be of the form `COUNT("prefix")`, where `prefix` is the prefix of
flags that are being counted. e.g. `COUNT("cake.")` will count all flags that start with `cake.`.

### Ending

The ending is specified through these properties:

- **dialogue**: (dialogue) The dialogue that is shown when the storyline ends.

The ending dialogue is text that is shown when the storyline ends. You can think of it as the speech
of a "narrator". Using a dialogue instead of static text allows for building a dynamic text
based on flags set during the storyline.

This dialogue should not contain any nodes with r# Storylines

Dialogues describe the game's goals and interactions during a round. Think of it like a "level",
except that storylines are rotated constantly and each game involves a single storyline.

Storylines are described through a YAML file.

The schema is defined in [storylines.schema.json](../specs/storyline.schema.json).

## Storyline format

```yaml
decision:
  en: "Should we celebrate cake day?"
  es: "¿Deberíamos celebrar el día de las tortas?"
prompt:
  en: "Should we celebrate cake day? Talk to people to find out."
  es: "¿Deberíamos celebrar el día de las tortas? Habla con la gente para averiguarlo."
npcs:
  mayor:
    name:
      en: Mayor
      es: Alcalde
    spawn: { x: 0, y: 0 }
    dialogue:
      - text:
          en: "I like cake."
          es: "Me gusta la torta."
  baker:
    name: Joe Baker
    spawn: { x: 100, y: 100 }
quests:
  mayorIdea:
    npc: mayor
    mood: cake
    available:
      dialogue:
        - text:
            en: "We should ask the baker."
            es: "Deberíamos preguntarle al panadero."
          set: ['quest.mayorIdea.active']
    stages:
      - prompt:
          en: "Go talk to the baker"
          es: "Ve a hablar con el panadero"
        dialogues:
          mayor:
            - text:
                en: "Did you talk to the baker? Come back when you did."
                es: "¿Hablaste con el panadero? Vuelve cuando lo hayas hecho."
          baker:
            - text:
                en: "I agree about celebrating cake day."
                es: "Estoy de acuerdo con celebrar el día de las tortas."
              set: ['talkedToBaker']
      - cond: 'talkedToBaker'
        dialogues:
          mayor:
            - text:
                en: "Then it's decided!"
                es: "¡Entonces está decidido!"
              set: ['quest.mayorIdea.done']
```

The top-level properties in a storyline are:

- **decision**: (text) The decision that the city is facing in this storyline. This is displayed in
  the city map screen.
- **prompt**: (text) The initial prompt that will be shown on player screens before any quests
  become active.
- **npcs**: (npc) The npcs that participate in this story.
- **quests**: (quest) The quests that are available in this story.
- **ending** (ending) How the story ends.

Each of these parts will be described in more detail below.

### Texts

Texts can be strings or objects. If they are objects, they are keyed by language code, and the
value is the text in that language.

e.g.

```yaml
text: "Hello!"
```

or

```yaml
text:
  en: "Hello!"
  es: "¡Hola!"
  de: "Hallo!"
```

### Dialogues

Storylines can contain dialogues in several places. Dialogues are described in detail in
their own document, [dialogues.md](dialogues.md).

Within a storyline, a dialogue is specified simply as an array of root level nodes. i.e. There's no
need to write the top level node with `id` and `items` properties, just the array of items that
would go within `items`.

#### Use of flags

There are two types of flags that are synchronized between clients:

- Those beginning with `pnt.`, which are used to track "scoring".
- Those beginning with `quest.`, and ending with `.done` which are used to track quest completion.

### NPCs

NPCs are listed at the top level of the storyline in an object. The keys in this object are the
IDs of the npcs. These IDs are used to refer to the NPCs in quests, and also are used to pick
the texture that the character will be rendered with on screen.

NPCs are specified through these properties:

- **name**: (text) The name of the NPC. This is displayed at the top of dialogue windows when the
  character speaks.
- **spawn**: (point) The position where the NPC will be spawned in the city map screen.
- **dialogue**: (dialogue) The dialogues that the NPC will say when the player talks to them.

### Dialogue overriding

Whenever a player character talks to an NPC, a dialogue executed. This dialogue is built by
concatenating, in order, the list of nodes in several different places:

- The dialogue from the current stage
- The dialogue from the current quest
- The dialogue from the `available` section of all available quests that the npc hands out.
- The dialogue from the current storyline

The more specific dialogues take precedence over the more general ones.

### Quests

Quests are listed at the top level of the storyline in an object. The keys in this object are the
IDs of the quests. These IDs are used to refer to the quests in other parts of the storyline.

Quests are specified through these properties:

- **npc**: (npc) The NPC that hands out this quest.
- **mood**: (string) The "mood" is the icon that is shown in the dialogue balloon above the npc's
  head when they have a quest available. This is a string that is used to look up the icon in the
  game's icon set.
- **available**: (dialogue) The dialogue that the NPC says when the quest is available.
- **stages**: (array<stage>) The stages of the quest.
- **required**: (string | array<string>, optional) One or more quests that must be completed for
  this quest to be available.

Within the `available` dialogue, there should be a node that sets the `quest.<questId>.active` flag,
which activates the quest. This flag can be set by a node, or by a response within a node.

### Stages

Quests are made up of one or more stages. You can think of them as sub-quests.

Stages are specified through these properties:

- **prompt**: (text) The prompt that is shown to the player when the stage is active.
- **dialogues**: (dialogue) The dialogues that NPCs says when the stage is active.
- **cond**: (string, optional) A condition that must be true for the stage to be active.
- **counter**: (counter, optional) If the stage involves collecting several things of a kind,
  this is the counter that tracks the progress of the collection.

Stages are evaluated from top to bottom. The first stage that has a valid condition (or none) is
the one that is active.

In at least one of the stages, there should be a node that sets the `quest.<questId>.done` flag,
which indicates that the quest is complete. This flag can be set by a node, or by a response within
a node.

#### Counters

Counters are used to track the progress of a stage. They are specified through these properties:

- **expression**: (string) An expression that evaluates to the current count.
- **max**: (number) The maximum value that the counter can reach.

Currently expressions can only be of the form `COUNT("prefix")`, where `prefix` is the prefix of
flags that are being counted. e.g. `COUNT("cake.")` will count all flags that start with `cake.`.

### Ending

The ending is specified through these properties:

- **dialogue**: (dialogue) The dialogue that is shown when the storyline ends.

The ending dialogue is text that is shown when the storyline ends. You can think of it as the speech
of a "narrator". Using a dialogue instead of static text allows for building a dynamic text
based on flags set during the storyline.

This dialogue should not contain any nodes with responses, as user input cannot be captured
at this point.

Only `pnt.` and `quest.*.done` flags should be used in the ending dialogue, since those are
the only ones synchronized, and will result in the same text being shown to all players. The
exception to this rule is flags that are set by the ending dialogue itself.
esponses, as user input cannot be captured
at this point.

Only `pnt.` and `quest.*.done` flags should be used in the ending dialogue, since those are
the only ones synchronized, and will result in the same text being shown to all players. The 
exception to this rule is flags that are set by the ending dialogue itself.
