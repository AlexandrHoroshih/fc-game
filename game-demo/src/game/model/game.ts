import type {
  Bot,
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
  EffectParams,
  StoreValue,
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
import { interval } from "./interval";

export const $gameSize = createStore<GameSize>(
  {
    w: 100,
    h: 100,
  },
  { sid: "game-size" }
);

// TEAM A
export const $teamA = createStore<Record<Id, Bot>>(
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
  { sid: "teamA" }
);
const teamABaseApi = createApi($teamA, {
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
const moveA = createEvent<[id: Id, dir: Dir]>();
sample({
  source: [$gameSize, $teamA],
  clock: moveA,
  fn: ([size, kv], [id, dir]) => {
    const realDir = getDir(dir);
    const next = klona(kv);
    const pos = getPos(size, next[id].position, realDir);
    next[id].position = pos;
    next[id].viewDir = realDir;
    return next;
  },
  target: $teamA,
});

const teamAApi = {
  ...teamABaseApi,
  move: moveA,
  shoot: createEvent<Id>()
};

// TEAM B
export const $teamB = createStore<Record<Id, Bot>>(
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
  { sid: "teamB" }
);
const teamBBaseApi = createApi($teamB, {
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
const moveB = createEvent<[id: Id, dir: Dir]>();
sample({
  source: [$gameSize, $teamB],
  clock: moveB,
  fn: ([size, kv], [id, dir]) => {
    const realDir = getDir(dir);
    const next = klona(kv);
    const pos = getPos(size, next[id].position, realDir);
    next[id].position = pos;
    next[id].viewDir = realDir;
    return next;
  },
  target: $teamB,
});

const teamBApi = {
  ...teamBBaseApi,
  move: moveB,
  shoot: createEvent<Id>()
};

const $teamAMeta = $teamA.map((kv) =>
  Object.values(kv)
    .map((v) => ({ ...v }))
    .filter((v) => v.health > 0)
);

const $teamBMeta = $teamB.map((kv) =>
  Object.values(kv)
    .map((v) => ({ ...v }))
    .filter((v) => v.health > 0)
);

const teamAConf = {
  sid: "teamAMove",
  source: combine({
    myBots: $teamAMeta,
    enemyBots: $teamBMeta,
    stash: {},
  }),
  effect: (meta): { id: Id } & Action => {
    return {
      id: "",
      type: "nothing",
    };
  },
} as const;
export const teamAMoveFx = attach(teamAConf);

const teamBConf = {
  sid: "teamBMove",
  source: combine({
    myBots: $teamBMeta,
    enemyBots: $teamAMeta,
    stash: {},
  }),
  effect: (meta): { id: Id } & Action => {
    return {
      id: "",
      type: "nothing",
    };
  },
} as const;
export const teamBMoveFx = attach(teamBConf);

export type GameState = StoreValue<typeof teamBConf.source>;

// game
export const tick = createEvent();

const $currentMove = createStore<"a" | "b">("a").on(
  tick,
  (curr) => (curr === "a" ? "b" : "a")
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
    a: teamAMoveFx.prepend(() => {}),
    b: teamBMoveFx.prepend(() => {}),
  },
});

split({
  source: teamAMoveFx.doneData,
  match: {
    move: (act) => Boolean(act && act.type === "move"),
    rotate: (act) => Boolean(act && act.type === "rotate"),
    shoot: (act) => Boolean(act && act.type === "shoot"),
  },
  cases: {
    move: teamAApi.move.prepend<{ id: Id } & Move>(({ id, dir }) => [
      id,
      dir,
    ]),
    rotate: teamAApi.rotate.prepend<{ id: Id } & Rotate>(({ id, dir }) => [
      id,
      dir,
    ]),
    shoot: teamAApi.shoot.prepend<{id: Id}>(({id}) => id),
  },
});

split({
  source: teamBMoveFx.doneData,
  match: {
    move: (act) => Boolean(act && act.type === "move"),
    rotate: (act) => Boolean(act && act.type === "rotate"),
    shoot: (act) => Boolean(act && act.type === "shoot"),
  },
  cases: {
    move: teamBApi.move.prepend<{ id: Id } & Move>(({ id, dir }) => [
      id,
      dir,
    ]),
    rotate: teamBApi.rotate.prepend<{ id: Id } & Rotate>(({ id, dir }) => [
      id,
      dir,
    ]),
    shoot: teamBApi.shoot.prepend<{id: Id}>(({id}) => id),
  },
});

// game events
type BotTeam = Bot & {team: string};
// shooting
const shotFired = sample({
  source: {a: $teamAMeta, b: $teamBMeta},
  clock: [teamAApi.shoot.map(id => ({team: "A", id})), teamBApi.shoot.map(id => ({team: "A", id}))],
  fn: (teams, shot) => {
    const shooter = teams[shot.team][shot.id];
    const listA: BotTeam[] = Object.values(teams.a).map(bot => ({...bot, team: "a"}))
    const listB: BotTeam[] = Object.values(teams.b).map(bot => ({...bot, team: "b"}))
    const list: BotTeam[] = [...listA, ...listB];
    let target: Bot & {team: string} | null = null;
    let range = 4;

    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      const gun = inGunRange(shooter.position, shooter.viewDir, current.position);
      if (gun.inRange && gun.range < range) {
        target = current;
      }
    }

    return target ? { target, dir: shooter.viewDir } : null;
  },
});
const shotHit = guard({
  clock: shotFired,
  filter: Boolean,
});

split({
  source: shotHit,
  match: {
    a: (hit) => hit.target.team === "a",
    b: (hit) => hit.target.team === "b",
  },
  cases: {
    a: [teamAApi.damage.prepend<EventPayload<typeof shotHit>>((shot) => [
      shot.target.id,
      25,
    ]), teamAApi.move.prepend],
    b: teamBApi.damage.prepend<EventPayload<typeof shotHit>>((shot) => [
      shot.target.id,
      25,
    ]),
  }
})

// hand damage
const handFired = sample({
  source: {a: $teamAMeta, b: $teamBMeta},
  clock: [teamAApi.move.map(m => ({...m, team: "a"})), teamBApi.move.map(m => ({...m, team: "b"}))],
  fn: (teams, move) => {
    const listA: BotTeam[] = Object.values(teams.a).map(bot => ({...bot, team: "a"}))
    const listB: BotTeam[] = Object.values(teams.b).map(bot => ({...bot, team: "b"}))
    const list: BotTeam[] = [...listA, ...listB];

    for (let i = 0; i < list.length; i++) {

    }

    return true;
  }
})

const handHit = guard({
  clock: handFired,
  filter: () => false,
})

// results
const teamADead = guard({
  clock: $teamA,
  filter: (kv) => {
    const list = Object.values(kv);

    return list.every(a => a.health === 0)
  }
})

const teamBDead = guard({
  clock: $teamB,
  filter: (kv) => {
    const list = Object.values(kv);

    return list.every(a => a.health === 0)
  }
})

const $interval = createStore(1, {sid: "tick-interval"});

const int = interval({
  timeout: $interval,
  start: startGameFx.map(() => {}),
  stop: stopGame,
})

sample({
  clock: int.tick,
  target: tick,
})

const $iteration = createStore(0).on(tick, s => s + 1)
const $maxSteps = createStore(100)

const maxStepsHit = guard({
  source: [$iteration, $maxSteps],
  filter: ([it, max]) => it === max,
})

sample({
  clock: [teamADead, teamBDead, maxStepsHit],
  target: stopGame,
})

export const GameModel = {
  $gameSize,
  startGameFx,
  stopGame,
  tick,
  $teamA,
  $teamB,
  teamAMoveFx,
  teamBMoveFx,
  $maxSteps,
  $interval,
};

export const ViewModel = {
  $gameSize,
  tick,
  $teamA,
  $teamB,
  teamAApi,
  teamBApi,
  shotHit,
  handHit,
  teamADead,
  teamBDead,
  maxStepsHit,
  stopGame,
  $interval,
}
