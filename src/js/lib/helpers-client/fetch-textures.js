/* globals PIXI */

async function fetchTextures(basePath, manifest, bundle) {
  PIXI.Assets.resolver.setDefaultSearchParams({
    t: Date.now(), // Cache buster
  });
  await PIXI.Assets.init({
    basePath,
    manifest,
  });
  return PIXI.Assets.loadBundle(bundle);
}

module.exports = fetchTextures;
