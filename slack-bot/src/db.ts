import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, child, get, remove } from "firebase/database";

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

const baseUser: User = {
    name: "",
    code: "",
} as const

type Game = {
    startedAt: string;
    log: string;
    winner: string;
    playerA: string;
    playerB: string;
}

const database = getDatabase(app);

export const setUser = async (config: { userId: string; name: string; code: string; }) => {
   const result = await set(ref(database, 'users/' + config.userId), {
        name: config.name,
        code: config.code,
      });
    
    return result;
}

export const setBotInstall = async (config: { id: string; installation: string; }) => {
    const result = await set(ref(database, 'bots/' + config.id), config.installation);
     
     return result;
 }

export const readBotInstall = async (config: {id: string}) => {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, `bots/${config.id}`))

    if (!snapshot.exists()) {
        throw new Error(config.id + " not found")
    }

    return snapshot.val();
}

export const deleteBotInstall = async (config: {id: string}) => {
    const result = await remove(ref(database, 'bots/' + config.id));

    return result;
}






