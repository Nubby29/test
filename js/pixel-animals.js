'use strict';

/* ============================================================
   Experience: Bible Stories — Phase 5: Pixel Animals & NPCs
   Original pixel-art silhouettes for the existing world kinds.
   Gameplay/world data is untouched.
   ============================================================ */

const PixelAnimals = (() => {
  const palettes = {
    rabbit:  { body:'#e9e4dc', shade:'#c9c2b8', ear:'#d8b8ad', eye:'#2b211b' },
    lamb:    { body:'#f2eee2', shade:'#d6cdbd', head:'#d8c7aa', eye:'#29231d' },
    sheep:   { body:'#f7f2e5', shade:'#d5c6a9', head:'#d5c2a1', horn:'#8a6f4a', eye:'#29231d' },
    camel:   { body:'#caa36b', shade:'#9f7745', head:'#d5b277', eye:'#29231d' },
    donkey:  { body:'#aeb2b3', shade:'#858a8c', head:'#c0c3c2', eye:'#29231d' },
    elephant:{ body:'#8e999e', shade:'#6e797e', head:'#a0aaae', eye:'#29231d' },
    bird:    { body:'#d88445', shade:'#b65e32', wing:'#efab68', beak:'#e6b63f', eye:'#29231d' },
    generic: { body:'#b7a27d', shade:'#8f795a', head:'#c8b38b', eye:'#29231d' }
  };

  function rect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function shadow(ctx,x,y,w){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(Math.round(x-w),Math.round(y+3),Math.round(w*2),3);}
  function pixelEye(ctx,x,y,c){rect(ctx,x,y,2,2,c);}

  function draw(ctx,a,time){
    const p=palettes[a.kind]||palettes.generic;
    const moving=a.state!=='idle';
    const step=moving?(Math.floor(time*8+a.phase*3)%2):0;
    const bob=moving?(step?2:0):0;
    const x=Math.round(a.x), ground=Math.round(a.y), y=ground-bob;
    shadow(ctx,x,ground,a.kind==='elephant'?13:8);

    if(a.kind==='rabbit'){
      rect(ctx,x-9,y-10,17,10,p.body); rect(ctx,x+5,y-15,8,9,p.body);
      rect(ctx,x+5,y-24,3,9,p.shade); rect(ctx,x+10,y-23,3,8,p.shade);
      rect(ctx,x-4,y-5,4,6,p.shade); rect(ctx,x+5,y-5,4,6,p.shade);
      rect(ctx,x+12,y-13,2,2,p.eye);
    } else if(a.kind==='lamb'){
      rect(ctx,x-11,y-13,21,12,p.body); rect(ctx,x-9,y-18,7,9,p.body); rect(ctx,x-2,y-20,8,8,p.body);
      rect(ctx,x+7,y-16,8,8,p.head); pixelEye(ctx,x+12,y-18,p.eye);
      rect(ctx,x-6,y-4,3,6,p.shade); rect(ctx,x+4,y-4,3,6,p.shade);
    } else if(a.kind==='sheep'){
      rect(ctx,x-13,y-16,25,15,p.body); rect(ctx,x-10,y-21,8,9,p.body); rect(ctx,x-3,y-23,9,9,p.body);
      rect(ctx,x+8,y-20,10,9,p.head); pixelEye(ctx,x+14,y-19,p.eye);
      rect(ctx,x-7,y-3,3,6,p.shade); rect(ctx,x+5,y-3,3,6,p.shade);
      if(a.name==='ram'){
        rect(ctx,x+8,y-26,3,5,p.horn); rect(ctx,x+15,y-25,3,5,p.horn);
        rect(ctx,x+6,y-28,5,3,p.horn); rect(ctx,x+14,y-27,5,3,p.horn);
      }
    } else if(a.kind==='camel'){
      rect(ctx,x-12,y-19,25,13,p.body); rect(ctx,x-6,y-27,10,9,p.shade);
      rect(ctx,x+7,y-23,5,15,p.body); rect(ctx,x+10,y-34,8,10,p.head);
      rect(ctx,x+15,y-35,3,2,p.eye);
      rect(ctx,x-8,y-7,3,10,p.shade); rect(ctx,x+6,y-7,3,10,p.shade);
      rect(ctx,x-14,y-17,5,3,p.shade);
    } else if(a.kind==='donkey'){
      rect(ctx,x-12,y-17,24,12,p.body); rect(ctx,x+7,y-22,10,10,p.head);
      rect(ctx,x+8,y-31,3,10,p.shade); rect(ctx,x+14,y-30,3,9,p.shade);
      pixelEye(ctx,x+14,y-21,p.eye);
      rect(ctx,x-8,y-6,3,9,p.shade); rect(ctx,x+5,y-6,3,9,p.shade);
      rect(ctx,x-16,y-17,6,3,p.shade);
    } else if(a.kind==='elephant'){
      rect(ctx,x-15,y-19,29,17,p.body); rect(ctx,x+8,y-25,13,15,p.head);
      rect(ctx,x+17,y-10,5,13,p.shade); rect(ctx,x-12,y-3,5,10,p.shade); rect(ctx,x+5,y-3,5,10,p.shade);
      rect(ctx,x+18,y-23,5,5,p.shade); pixelEye(ctx,x+18,y-20,p.eye);
      rect(ctx,x-21,y-17,6,3,p.shade);
    } else if(a.kind==='bird'){
      const wing=step?4:9;
      rect(ctx,x-7,y-5,14,10,p.body); rect(ctx,x+5,y-8,8,8,p.body);
      rect(ctx,x+12,y-7,6,3,p.beak); pixelEye(ctx,x+9,y-6,p.eye);
      rect(ctx,x-5,y-11,10,wing,p.wing); rect(ctx,x-4,y+1,8,Math.max(2,12-wing),p.shade);
    } else {
      rect(ctx,x-9,y-11,18,10,p.body); rect(ctx,x+5,y-16,8,9,p.head);
      pixelEye(ctx,x+10,y-14,p.eye); rect(ctx,x-6,y-4,3,6,p.shade); rect(ctx,x+4,y-4,3,6,p.shade);
    }
  }
  return { draw };
})();
