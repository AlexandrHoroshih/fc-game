import {createGame} from "./run";

const game = createGame({size: {w: 10, h: 10}, interval: 100})
game.scope // to subscribe
game.run() // to run
