'use strict';

/* ============================================================
   Experience: Bible Stories — Pixel Renderer Foundation
   Phase 1: fixed logical resolution + crisp nearest-neighbour
   presentation. Gameplay coordinates remain unchanged.
   ============================================================ */

const PixelRenderer = (() => {
  const WIDTH = 480;
  const HEIGHT = 270;

  function configureCanvas(canvas, windowObj) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // CSS scales the low-resolution game surface to the browser viewport.
    // image-rendering keeps the pixel grid crisp instead of smoothing it.
    canvas.style.width = windowObj.innerWidth + 'px';
    canvas.style.height = windowObj.innerHeight + 'px';
    canvas.style.imageRendering = 'pixelated';

    return { width: WIDTH, height: HEIGHT, dpr: 1 };
  }

  function prepareContext(ctx) {
    ctx.imageSmoothingEnabled = false;
  }

  function snap(value) {
    return Math.round(value);
  }

  return Object.freeze({
    WIDTH,
    HEIGHT,
    configureCanvas,
    prepareContext,
    snap
  });
})();
