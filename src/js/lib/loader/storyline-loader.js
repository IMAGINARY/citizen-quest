const { validateStoryline } = require('../model/storyline-validation');

async function storylineLoader(cfgLoader, storylinePath, ids) {
  return cfgLoader.load(
    ids.map((s) => `${storylinePath}/${s}.yml`),
    (cfgSegment, file) => {
      const id = file.match(/\/([^/]*)\.yml$/)[1];
      try {
        validateStoryline(cfgSegment);
      } catch (err) {
        throw new Error(`Error validating storyline '${id}': ${err.message}`);
      }
      return Object.fromEntries([[id, cfgSegment]]);
    }
  );
}

module.exports = storylineLoader;
