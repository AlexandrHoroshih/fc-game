import { GameModel } from "./model/game";
import { fork, allSettled, scopeBind, serialize } from "effector";
import type { GameSize } from "./model/types";
import teamA from "./team-a";
import teamB from "./team-b";

export const createGame = (config: { size: GameSize; interval: number }) => {
  const scope = fork({
    handlers: [
      [GameModel.teamAMoveFx, teamA],
      [GameModel.teamBMoveFx, teamB],
    ],
    values: [
      [GameModel.$interval, config.interval],
      [GameModel.$gameSize, config.size],
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
          Roomba: {
            id: "Roomba",
            name: "Roomba",
            position: { x: 8, y: 4 },
            health: 100,
            viewDir: "w",
          },
          Booba: {
            id: "Booba",
            name: "Booba",
            position: { x: 8, y: 8 },
            health: 100,
            viewDir: "w",
          },
        },
      ],
    ],
  });

  const runGame = async () => {
      await allSettled(GameModel.startGameFx, {scope, params: `${Math.random()}`})
  }

  return {
      run: runGame,
      scope,
    }
};
