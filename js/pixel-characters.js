'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 10 Character Art Direction
   Version: 10.0.0
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

  function roleForEntity(person) {
    const name = String((person && person.name) || '');
    const base = roleFor(name, null);
    // Give repeated generic NPC names deliberate visual variation without
    // changing World data or gameplay state.
    if (base === 'villager_a' && name.toLowerCase() === 'villager') {
      const bucket = Math.abs(Math.floor(((person.x || 0) + (person.y || 0)) / 32)) % 3;
      return ['villager_a', 'villager_b', 'villager_c'][bucket];
    }
    if (base === 'traveler' && /^(servant|brother)$/i.test(name)) {
      const bucket = Math.abs(Math.floor(((person.x || 0) + (person.y || 0)) / 32)) % 2;
      return bucket ? 'traveler' : 'elder';
    }
    return base;
  }

  function drawPerson(ctx, person, time) {
    if (!person) return false;

    const role = person.role || roleForEntity(person);
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

  return { drawPerson, drawPlayer, roleFor, roleForEntity };
})();
