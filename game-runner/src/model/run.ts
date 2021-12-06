import { GameModel, GameStateBase } from "./game";
import { inGunRange as libInGunRange } from "./lib";
import { fork, allSettled, scopeBind, serialize } from "effector";
import type { GameSize, GameState, Bot, Dir, Action } from "./types";

const botLib: GameState["lib"] = {
  getDistance: (l: Bot, r: Bot) =>
    Math.sqrt(
      (l.position.x - r.position.x) ** 2 + (l.position.y - r.position.y) ** 2
    ),
  getDir: (me: Bot, bot: Bot): Dir => {
    let ydir = "";
    let xdir = "";

    if (bot.position.y > me.position.y) {
      ydir = "n"
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

    return (ydir + xdir) as Dir;
  },
  findClosest: (current: Bot, enemies: Bot[]) => {
    let closest = enemies[0];
    if (enemies.length === 1) return closest;

    let distance = 10_000;
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
  inGunRange: (me: Bot, target: Bot) => {
    return libInGunRange(me.position, me.viewDir, target.position).inRange;
  },
};

export const createGame = (config: { size: GameSize; interval: number; teamA: (game: GameStateBase) => Action; teamB: (game: GameStateBase) => Action; }) => {
  const scope = fork({
    handlers: [
      [
        GameModel.teamAMoveFx,
        config.teamA
      ],
      [
        GameModel.teamBMoveFx, config.teamB
      ],
    ],
    values: [
      [GameModel.$interval, config.interval],
      [GameModel.$gameSize, {w: 10, h: 10}],
      [
        GameModel.$teamA,
        {
          Abba: {
            id: "Abba",
            name: "Abba",
            position: { x: 2, y: 2 },
            health: 100,
            viewDir: "e",
          },
          Amba: {
            id: "Amba",
            name: "Amba",
            position: { x: 2, y: 4 },
            health: 100,
            viewDir: "e",
          },
          Aooba: {
            id: "Aooba",
            name: "Aooba",
            position: { x: 2, y: 8 },
            health: 100,
            viewDir: "e",
          },
        },
      ],
      [
        GameModel.$teamB,
        {
          Boba: {
            id: "Boba",
            name: "Boba",
            position: { x: 8, y: 2 },
            health: 100,
            viewDir: "w",
          },
          Boomba: {
            id: "Boomba",
            name: "Boomba",
            position: { x: 8, y: 4 },
            health: 100,
            viewDir: "w",
          },
          Bogba: {
            id: "Bogba",
            name: "Bogba",
            position: { x: 8, y: 8 },
            health: 100,
            viewDir: "w",
          },
        },
      ],
    ],
  });

  const runGame = async () => {
    await allSettled(GameModel.startGameFx, {
      scope,
    });
  };

  return {
    run: runGame,
    scope,
  };
};
