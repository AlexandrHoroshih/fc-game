import ivm from "isolated-vm";

export const createSafeRunner = (code: string) => {
  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = isolate.createContextSync();

  context.global.setSync("Promise", undefined);
  context.global.setSync("setTimeout", undefined);
  context.global.setSync("setInterval", undefined);
  context.global.setSync("setImmediate", undefined);
  context.global.setSync("require", undefined);
  context.global.setSync("process", undefined);
  context.global.setSync("XMLHttpRequest", undefined);
  context.global.setSync("WebAssembly", undefined);
  context.global.setSync("MessagePort", undefined);
  context.global.setSync("MessageChannel", undefined);
  context.global.setSync("MessageEvent", undefined);
  context.global.setSync("AbortController", undefined);
  context.global.setSync("stash", null)

  const runnerCode = `
  const isPosEqual = (left, right) => {
    return left.x === right.x && left.y === right.y;
};
const RANGE = 3;
const getAim = (base, dir, aim) => {
    if (dir === "n") {
        return {
            x: base.x,
            y: base.y + aim
        };
    }
    if (dir === "ne") {
        return {
            x: base.x + aim,
            y: base.y + aim
        };
    }
    if (dir === "e") {
        return {
            x: base.x + aim,
            y: base.y
        };
    }
    if (dir === "se") {
        return {
            x: base.x + aim,
            y: base.y - aim
        };
    }
    if (dir === "s") {
        return {
            x: base.x,
            y: base.y - aim
        };
    }
    if (dir === "sw") {
        return {
            x: base.x - aim,
            y: base.y - aim
        };
    }
    if (dir === "w") {
        return {
            x: base.x - aim,
            y: base.y
        };
    }
    if (dir === "nw") {
        return {
            x: base.x - aim,
            y: base.y + aim
        };
    }
    return base;
};
const libInGunRange = (shooter, dir, target) => {
    let inRange = false;
    let range = 0;
    for (let i = 1; i < RANGE + 1; i++) {
        const aimedAt = getAim(shooter, dir, i);
        if (isPosEqual(aimedAt, target)) {
            inRange = true;
            range = i;
            break;
        }
    }
    return { inRange, range };
};
  stash = stash || {}
  const botLib = {
    getDistance: (l, r) => Math.sqrt((l.position.x - r.position.x) ** 2 + (l.position.y - r.position.y) ** 2),
    getDir: (me, bot) => {
        let ydir = "";
        let xdir = "";
        if (bot.position.y > me.position.y) {
            ydir = "n";
        }
        if (bot.position.y < me.position.y) {
            ydir = "s";
        }
        if (bot.position.x < me.position.x) {
            xdir = "w";
        }
        if (bot.position.x > me.position.x) {
            xdir = "e";
        }
        return (ydir + xdir);
    },
    findClosest: (current, enemies) => {
        let closest = enemies[0];
        if (enemies.length === 1)
            return closest;
        let distance = 10000;
        for (let i = 0; i < enemies.length; i++) {
            const maybeClosest = enemies[i];
            const currentDistance = botLib.getDistance(maybeClosest, current);
            if (currentDistance < distance) {
                closest = maybeClosest;
                distance = currentDistance;
            }
        }
        return closest;
    },
    inGunRange: (me, target) => {
        return libInGunRange(me.position, me.viewDir, target.position).inRange;
    },
};

   const state = JSON.parse($0);
   const move = (game) => {
    ${code}
   }
   const result = move({...state, stash: stash, lib: botLib, meta: { field: { w: 10, h: 10 }}});

   return JSON.stringify(result);
  `;

  return {
    run: (gameState) => {
      try {
        const nextMove = context.evalClosureSync(
          runnerCode,
          [JSON.stringify(gameState)],
          { timeout: 2500 }
        );
        return JSON.parse(nextMove);
      } catch (error) {
        console.log(error)
      }
    },
    dispose: isolate.dispose,
  };
};
