import { createEffect } from "effector";
import { dir } from "./types";
import type { Dir, Position, GameSize } from "./types";

export const createDefer = <T>() => {
  const defer = {};

  // @ts-ignore
  defer.req = new Promise((rs) => ((defer as any).rs = rs));

  return defer as {
    req: Promise<T>;
    rs: () => void;
  };
};

export const runDeferFx = createEffect(
  async (def: ReturnType<typeof createDefer>) => await def.req
);

export const takeHealth = (current: number, hit: number) => {
  const next = current - hit;
  return next > 0 ? next : 0;
};

export const getDir = (next: Dir): Dir => {
  if (dir.includes(next)) return next;

  return "n";
};

export const getPos = (size: GameSize, pos: Position, dir: Dir) => {
  let result = { ...pos };

  switch (dir) {
    case "n": {
      result.y += 1;
      break;
    }
    case "ne": {
      result.y += 1;
      result.x += 1;
      break;
    }
    case "e": {
      result.x += 1;
      break;
    }
    case "se": {
      result.y -= 1;
      result.x += 1;
      break;
    }
    case "s": {
      result.y -= 1;
      break;
    }
    case "sw": {
      result.x -= 1;
      result.y -= 1;
      break;
    }
    case "w": {
      result.x -= 1;
      break;
    }
    case "nw": {
      result.x -= 1;
      result.y += 1;
      break;
    }
  }

  if (result.x < 0) {
    result.x = 0;
  }
  if (result.x > size.w) {
    result.x = size.w;
  }
  if (result.y < 0) {
    result.y = 0;
  }
  if (result.y > size.h) {
    result.y = size.h;
  }

  return result;
};

export const isPosEqual = (left: Position, right: Position) => {
  return left.x === right.x && left.y === right.y;
};

const RANGE = 3;

const getAim = (base: Position, dir: Dir, aim: number) => {
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

export const inGunRange = (shooter: Position, dir: Dir, target: Position) => {
  let inRange = false;
  let range = 0;
  for (let i = 1; i < RANGE + 1; i++) {
    const aimedAt: Position = getAim(shooter, dir, i);
    if (isPosEqual(aimedAt, target)) {
      inRange = true;
      range = i;
      break;
    }
  }

  return { inRange, range };
};

