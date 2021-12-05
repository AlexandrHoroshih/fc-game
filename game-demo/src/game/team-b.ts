import type {GameState} from "./model/game";
import type {Action} from "./model/types";

const teamB = (game: GameState): Action => {

    return {
        type: "move",
        dir: "n"
    }
}

export default teamB;