import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, child, get, remove, update } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.FB_API_KEY,
    authDomain: process.env.FB_AUTH_DOMAIN,
    databaseURL: process.env.FB_RD,
    projectId: process.env.FB_ID,
    storageBucket: process.env.FB_STORAGE_BUCKET,
    messagingSenderId: process.env.FB_SENDER_ID,
    appId: process.env.FB_APP_ID
  };
  
  

const app = initializeApp(firebaseConfig);

type User = {
    name: string;
    code: string;
}

type Points = {
    name: string;
    points: number;
    games: Record<string, "win" | "loss">
}

type Game = {
    startedAt: string;
    log: string;
    winner: string;
    playerA: string;
    playerB: string;
}

const database = getDatabase(app);

export const saveGame = async (config: {}) => {
 // TODO
};
