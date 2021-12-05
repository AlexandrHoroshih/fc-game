import type {
  Defender,
  Attacker,
  Id,
  Action,
  GameSize,
  Dir,
  Move,
  Rotate,
} from "./types";
import {
  createEvent,
  createStore,
  attach,
  createEffect,
  split,
  combine,
  sample,
  createApi,
  guard,
  restore,
  scopeBind,
  EventPayload,
} from "effector";
import { klona } from "klona/json";
import {
  createDefer,
  runDeferFx,
  takeHealth,
  getDir,
  getPos,
  isPosEqual,
  inGunRange,
} from "./lib";
import { interval } from "patronum/interval";

export const $gameSize = createStore<GameSize>(
  {
    w: 100,
    h: 100,
  },
  { sid: "game-size" }
);
export const $defender = createStore<Record<Id, Defender>>({
  Biba: {
    id: "default",
    name: "Biba",
    position: {
      x: 50,
      y: 50,
    },
    health: 100,
    viewDir: "n",
  }},
  { sid: "defender" }
);
const defenderBaseApi = createApi($defender, {
  damage: (kv, hit: [id: Id, amount: number]) => {
    const [id, amount] = hit;
    const next = klona(kv);
    next[id].health = takeHealth(next[id].health, amount);
    return next;
  },
  rotate: (kv, rot: [id: Id, dir: Dir]) => {
    const [id, dir] = rot;
    const next = klona(kv);
    next[id].viewDir = getDir(dir);
    return next;
  },
});
const moveDef = createEvent<Dir>();
sample({
  source: [$gameSize, $defender],
  clock: moveDef,
  fn: ([size, def], dir) => {
    const realDir = getDir(dir);
    const pos = getPos(size, def.position, realDir);
    const next = klona(def);
    next.position = pos;
    next.viewDir = realDir;
    return next;
  },
  target: $defender,
});

const defenderApi = {
  ...defenderBaseApi,
  move: moveDef,
  shoot: createEvent(),
};

export const $attackers = createStore<Record<Id, Attacker>>(
  {
    defaultAttacker: {
      id: "defaultAttacker",
      name: "Boba",
      position: {
        x: 50,
        y: 25,
      },
      health: 100,
      viewDir: "n",
    },
  },
  { sid: "attackers" }
);
const attackerBaseApi = createApi($attackers, {
  damage: (kv, hit: [id: Id, amount: number]) => {
    const [id, amount] = hit;
    const next = klona(kv);
    next[id].health = takeHealth(next[id].health, amount);
    return next;
  },
  rotate: (kv, rot: [id: Id, dir: Dir]) => {
    const [id, dir] = rot;
    const next = klona(kv);
    next[id].viewDir = getDir(dir);
    return next;
  },
});
const moveAttacker = createEvent<[id: Id, dir: Dir]>();
sample({
  source: [$gameSize, $attackers],
  clock: moveAttacker,
  fn: ([size, kv], [id, dir]) => {
    const realDir = getDir(dir);
    const next = klona(kv);
    const pos = getPos(size, next[id].position, realDir);
    next[id].position = pos;
    next[id].viewDir = realDir;
    return next;
  },
  target: $attackers,
});

const attackerApi = {
  ...attackerBaseApi,
  move: moveAttacker,
};

const $defenderMeta = $defender.map((def) => ({ ...def.state, id: def.id }));

const $attackersMeta = $attackers.map((kv) =>
  Object.values(kv)
    .map((v) => ({ ...v.state, id: v.id }))
    .filter((v) => v.health > 0)
);

const attackerStash = createStore({});
export const attackerMoveFx = attach({
  sid: "attacker",
  source: combine({
    target: $defenderMeta,
    friends: $attackersMeta,
    stash: attackerStash,
  }),
  // @ts-ignore
  effect: (meta): { id: Id } & Action => {
    return {
      id: "",
      type: "nothing",
    };
  },
});

const defenderStash = createStore({});
export const defenderMoveFx = attach({
  sid: "defender",
  source: combine({
    notFriends: $attackersMeta,
    me: $defenderMeta,
    stash: defenderStash,
  }),
  // @ts-ignore
  effect: (meta): Action => ({
    type: "nothing",
  }),
});

// game
export const tick = createEvent();

const $currentMove = createStore<"defend" | "attack">("attack").on(
  tick,
  (curr) => (curr === "attack" ? "defend" : "attack")
);

// attacker
// game state
export const stopGame = createEvent();
const setGameDef = createEvent<any>();
const $gameDef = restore(setGameDef, null);
export const startGameFx = createEffect(async () => {
  const def = createDefer();
  setGameDef(def);
  await runDeferFx(def);
});

$gameDef.watch(stopGame, (d) => d?.rs());

split({
  source: $currentMove,
  match: $currentMove,
  cases: {
    attack: attackerMoveFx.prepend(() => {}),
    defend: defenderMoveFx.prepend(() => {}),
  },
});

split({
  source: defenderMoveFx.doneData,
  match: {
    move: (act) => Boolean(act && act.type === "move"),
    rotate: (act) => Boolean(act && act.type === "rotate"),
    shoot: (act) => Boolean(act && act.type === "shoot"),
  },
  cases: {
    move: defenderApi.move.prepend<Move>((act) => act.dir),
    rotate: defenderApi.rotate.prepend<Rotate>((act) => act.dir),
    shoot: defenderApi.shoot.prepend(() => {}),
  },
});

split({
  source: attackerMoveFx.doneData,
  match: {
    move: (act) => Boolean(act && act.type === "move"),
    rotate: (act) => Boolean(act && act.type === "rotate"),
  },
  cases: {
    move: attackerApi.move.prepend<{ id: Id } & Move>(({ id, dir }) => [
      id,
      dir,
    ]),
    rotate: attackerApi.rotate.prepend<{ id: Id } & Rotate>(({ id, dir }) => [
      id,
      dir,
    ]),
  },
});

// game events
const shotFired = sample({
  source: [$attackersMeta, $defenderMeta],
  clock: defenderApi.shoot,
  fn: ([list, def]) => {
    let target: typeof def | null = null;
    let range = 4;

    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      const gun = inGunRange(def.position, def.viewDir, current.position);
      if (gun.inRange && gun.range < range) {
        target = current;
      }
    }

    return target ? { target, dir: def.viewDir } : null;
  },
});
const shotHit = guard({
  clock: shotFired,
  filter: Boolean,
});
sample({
  clock: shotHit,
  target: [
    attackerApi.damage.prepend<EventPayload<typeof shotHit>>((shot) => [
      shot.target.id,
      25,
    ]),
    attackerApi.move.prepend<EventPayload<typeof shotHit>>((shot) => [
      shot.target.id,
      shot.dir,
    ]),
  ],
});

const $currentAttackerId = restore(attackerMoveFx.doneData, null).map((act) =>
  act ? act.id : ""
);
const attacked = guard({
  source: [$currentAttackerId, $defenderMeta, $attackersMeta, $attackers],
  clock: [attackerApi.move, defenderApi.move],
  filter: $currentAttackerId.map(Boolean),
})
  .map(([currentId, def, list, kv]) => {
    const current = kv[currentId];
    const who = current.id;
    const targets: string[] = [];
    [def, ...list].forEach((bot) => {
      if (isPosEqual(current.position, bot.position)) {
        if (current.id === bot.id) return;
        targets.push(bot.id);
      }
    });

    return {
      who,
      dir: current.viewDir,
      targets,
    };
  })
  .filterMap((p) => (p.targets.length > 0 ? p : undefined));

const defenderAttacked = guard({
  source: $defender,
  clock: attacked,
  filter: (def, { targets }) => targets.includes(def.id),
});

sample({
  source: attacked,
  clock: defenderAttacked,
  fn: ({ dir }) => dir,
  target: [
    defenderApi.damage.prepend(() => 25),
    defenderApi.move.prepend<Dir>((d) => d),
  ],
});

sample({
  source: $attackers,
  clock: attacked,
  fn: (kv, { targets, who }) => {
    const next = klona(kv);
    targets.forEach((id) => {
      if (!next[id] || who === id) return;
      const curr = next[id].health;
      next[id].health = takeHealth(curr, 25);
    });
    return next;
  },
  target: $attackers,
});

const defenderDead = guard({
  clock: $defender,
  filter: (def) => def.health === 0,
});
const attackersDead = guard({
  clock: $attackers,
  filter: (kv) => {
    const list = Object.values(kv);

    return list.every((a) => a.health === 0);
  },
});

const int = interval({
  timeout: 1,
  start: startGameFx.map(() => {}),
  stop: stopGame,
});

sample({
  clock: int.tick,
  target: tick,
});

const $iteration = createStore(0).on(tick, (s) => s + 1);
const $maxSteps = createStore(100);

const maxStepsHit = guard({
  source: [$iteration, $maxSteps],
  filter: ([it, max]) => it === max,
});

sample({
  clock: [defenderDead, attackersDead, maxStepsHit],
  target: stopGame,
});

sample({
  source: {
    tick: $iteration,
    def: $defenderMeta,
    att: $attackersMeta,
  },
  clock: tick,
}).watch(console.log);

sample({
  source: $attackers,
  clock: attackerApi.damage,
  fn: (kv, [id]) => {
    const t = kv[id];

    if (t.health === 0) {
      return `${t.id} is dead!`;
    }

    if (t.health === 25) {
      return `${t.id} is about to die!`;
    }
    return `${t.id} got hit!`;
  },
}).watch(console.log);
stopGame.watch(() => console.log("stopped"));
$defender.watch(shotFired, (def) => console.log(def.id, "(defender) fires!"));
attacked.watch((a) => console.log(a.who, "attacked", a.targets, "!"));
attackersDead.watch(() => console.log("all attackers dead!"));
sample({
  source: { attEv: restore(attacked, null), kv: $attackers },
  clock: defenderDead,
  fn: ({ attEv, kv }) => {
    if (attEv) {
      return kv[attEv.who];
    }
  },
}).watch((bot) =>
  console.log(`Bot ${bot?.name ?? bot?.id} killed the defender!`)
);

export const GameModel = {
  $gameSize,
  startGameFx,
  stopGame,
  tick,
  $defender,
  $attackers,
  attackerMoveFx,
  defenderMoveFx,
  $maxSteps,
};

export const ViewModel = {
  $gameSize,
  $attackers,
  $defender,
  attackerApi,
  defenderApi,
  shotFired,
  shotHit,
  defenderDead,
  attackersDead,
  defenderAttacked,
  attacked,
};
