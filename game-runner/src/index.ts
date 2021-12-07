require('dotenv').config()
import {createSafeRunner} from "./safe-box";
import {getUsers, saveGame, savePoints, User} from "./db";
import { createGame } from './model/run';
import { GameModel } from './model/game';
import { nanoid } from "nanoid/non-secure";


const safeGame = async (config: {A: [string, User]; B: [string, User];}) => {
    const safeA = createSafeRunner(config.A[1].code);
    const safeB = createSafeRunner(config.B[1].code);
    const game = createGame({
        size: {w: 10, h: 10},
        interval: 1,
        teamA: safeA.run as any,
        teamB: safeB.run as any,
    })
    const startedAt = `${Date.now()}`;
    game.run();

    await new Promise(r => setTimeout(() => r(0), 1000));
    const log = game.scope.getState(GameModel.$log);
    const winner = game.scope.getState(GameModel.$winner);
    const playerA = config.A[1].name;
    const playerAId = config.A[0];
    const playerB = config.B[1].name;
    const playerBId = config.B[0];
    safeA.dispose()
    safeB.dispose()

    return {
        gameId: nanoid(),
        startedAt,
        log: JSON.stringify(log),
        winner,
        playerA,
        playerAId,
        playerB,
        playerBId,
    }
} 

type Awaited<T> = T extends PromiseLike<infer U> ? U : T

const start = async () => {
    const users = await getUsers();

    const games: Awaited<ReturnType<typeof safeGame>>[] = [];
    const usersList = Object.entries(users);

    for (let i = 0; i < usersList.length; i++) {
        const A = usersList[i]
        for (let j = i + 1; j < usersList.length; j++) {
            const B = usersList[j]
            const result = await safeGame({A, B})
            games.push(result);
        }
    }

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        const pointsA = {
            win: game.winner === "a",
            userId: game.playerAId,
            userName: game.playerA,
            gameId: game.gameId,
        };
        const pointsB = {
            win: game.winner === "b",
            userId: game.playerBId,
            userName: game.playerB,
            gameId: game.gameId,
        }

        await saveGame(game);
        await savePoints(pointsA);
        await savePoints(pointsB);
    }
};

start()
