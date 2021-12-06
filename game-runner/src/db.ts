import {initializeApp} from 'firebase/app';
import { getDatabase, ref, set, child, get, remove, update, runTransaction } from "firebase/database";

const firebaseConfig = {
    apiKey: 'AIzaSyAasa4UaQSBpfOogSTqwVQIMA_ZnbOrtF4',
    authDomain: 'fcg-game-proj.firebaseapp.com',
    databaseURL: 'https://fcg-game-proj-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'fcg-game-proj',
    storageBucket: 'fcg-game-proj.appspot.com',
    messagingSenderId: '352423505754',
    appId: '1:352423505754:web:a80522fe6458d41c394d63'
  };
  
  

const app = initializeApp(firebaseConfig);

export type User = {
    name: string;
    code: string;
}

type Points = {
    name: string;
    points: number;
    games: Record<string, "win" | "loss">
}

type Game = {
    gameId: string;
    startedAt: string;
    log: string;
    winner: string;
    playerA: string;
    playerB: string;
}

const database = getDatabase(app);

export const savePoints = async (config: {userId: string; userName: string; gameId: string; win: boolean;}) => {
    const inc = config.win ? 2 : 1;
    const pointsRef = ref(database, 'points/');
    await runTransaction(pointsRef, points => {
        if (points) {
            if (points[config.userId]) {
                points[config.userId].points += inc;
                points[config.userId].games[config.gameId] = inc;
            } else {
                points[config.userId] = {
                    userName: config.userName,
                    points: inc,
                    games: {
                        [config.gameId]: inc,
                    }
                }
            }
        }
        return points;
    })

}

export const saveGame = async (config: Game) => {
    const result = await set(ref(database, 'games/' + config.gameId), config);
    
    return result;
};

export const getUsers = async () => {
    const result = await get(ref(database, 'users/'));
     
     return result.val() as Record<string, User>;
 }
