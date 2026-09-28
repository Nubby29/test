'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 9 Character Renderer
   Version: 9.0.0
   Character drawing now uses reusable sprite sheets with
   directional frames and action poses. Adam/Eve remain
   compatible with their original authored sheets in game.js.
   ============================================================ */

const PixelCharacters = (() => {
  const playableRoles = {
    angel: 'angel',
    adam: 'adam',
    eve: 'eve',
    cain: 'cain',
    noah: 'noah',
    builder: 'builder',
    abraham: 'abraham',
    lot: 'lot',
    jacob: 'jacob',
    joseph: 'joseph'
  };

  function roleFor(name, playable) {
    if (playable && playableRoles[playable]) return playableRoles[playable];
    return PixelSprites.roleFor(name);
  }

  function facingFor(entity, fallback) {
    const f = entity && entity.facing;
    return (f === 'up' || f === 'down' || f === 'left' || f === 'right') ? f : (fallback || 'down');
  }

  function drawPerson(ctx, person, time) {
    if (!person) return false;

    const role = person.role || roleFor(person.name, null);
    const moving = !!(person.moving || (person.movingT || 0) > 0);
    const action = person.action || (person.carrying ? 'carry' : null);

    return PixelSprites.draw(ctx, {
      x: person.x,
      y: person.y,
      facing: facingFor(person, 'down'),
      moving
    }, role, time, {
      action,
      carrying: !!person.carrying
    });
  }

  function drawPlayer(ctx, player, chapter, time) {
    const playable = chapter && chapter.playable;
    const role = roleFor('', playable);

    return PixelSprites.draw(ctx, {
      x: player.x,
      y: player.y,
      facing: facingFor(player, 'down'),
      moving: !!player.moving
    }, role, time, {
      action: player.action || (typeof World !== 'undefined' && World.carrying ? 'carry' : null),
      carrying: !!(typeof World !== 'undefined' && World.carrying)
    });
  }

  return { drawPerson, drawPlayer, roleFor };
})();
