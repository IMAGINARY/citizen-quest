/* globals PIXI */
class TownView {
  constructor(config, textures) {
    this.config = config;
    this.textures = textures;
    this.display = new PIXI.Container();
    this.transform = new PIXI.Container();
    this.bgLayer = new PIXI.Container();
    this.mainLayer = new PIXI.Container();
    this.transform.addChild(this.display);
    this.display.addChild(this.bgLayer);
    this.display.addChild(this.mainLayer);

    // Temporary initialization
    this.townSize = {
      width: 1024 * 8,
      height: 768 * 6,
    };

    const collisionScale = 0.5;
    this.collisionSize = {
      width: Math.round(this.townSize.width * collisionScale),
      height: Math.round(this.townSize.height * collisionScale),
    };

    this.background = PIXI.Sprite.from(this.textures['town-bg']);
    this.background.width = this.townSize.width;
    this.background.height = this.townSize.height;
    this.bgLayer.addChild(this.background);

    const collisionRenderer = new PIXI.CanvasRenderer({
      ...this.collisionSize,
    });
    const collisionTree = new PIXI.Container();
    const baseCollisionMap = PIXI.Sprite.from(this.textures['town-collmap']);
    baseCollisionMap.width = collisionRenderer.width;
    baseCollisionMap.height = collisionRenderer.height;
    collisionTree.addChild(baseCollisionMap);
    collisionRenderer.render(collisionTree);

    const collisionMapRGBA = collisionRenderer.view
      .getContext('2d')
      .getImageData(
        0,
        0,
        collisionRenderer.width,
        collisionRenderer.height
      ).data;

    // An inline bitvector implementation that uses a Uint32Array for storage
    const BitVector = class {
      constructor(numBits) {
        this.length = numBits;
        this.data = new Uint32Array(Math.ceil(numBits / 32));
      }

      set(idx, value) {
        const bigIndex = Math.floor(idx / 32);
        const smallIndex = idx % 32;

        if (value) {
          this.data[bigIndex] = this.data[bigIndex] | (1 << smallIndex);
        } else {
          this.data[bigIndex] = this.data[bigIndex] & ~(1 << smallIndex);
        }
      }
      get(idx) {
        const bigIndex = Math.floor(idx / 32);
        const smallIndex = idx % 32;

        const value = this.data[bigIndex] & (1 << smallIndex);

        // we convert to boolean to make sure the result is always 0 or 1,
        // instead of what is returned by the mask
        return value !== 0;
      }
    };

    // We only need one bit per pixel by thresholding the grayscale value
    const numBits = Math.floor(collisionMapRGBA.length / 4);
    this.collisionMap = new BitVector(numBits);
    for (let i = 0; i < numBits; i += 1) {
      const gray =
        (collisionMapRGBA[i * 4] +
          collisionMapRGBA[i * 4 + 1] +
          collisionMapRGBA[i * 4 + 2]) /
        3;
      this.collisionMap.set(i, gray < 128);
    }

    window.isWalkable = this.isWalkable.bind(this);
    window.collMap = this.collisionMap;
  }

  async loadAssets() {
    this.assets = await PIXI.Assets.load();
  }

  isWalkable(x, y) {
    const transformedX = Math.floor(
      (x / this.townSize.width) * this.collisionSize.width
    );
    const transformedY = Math.floor(
      (y / this.townSize.height) * this.collisionSize.height
    );

    const index = transformedY * this.collisionSize.width + transformedX;
    return this.collisionMap.get(index);
  }
}

module.exports = TownView;
