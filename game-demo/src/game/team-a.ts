import type {GameState} from "./model/game";
import type {Action} from "./model/types";

const teamA = (game: GameState): Action => {

    return {
        type: "move",
        dir: "n"
    }
}

export default teamA;
