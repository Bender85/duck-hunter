import type { GameObj } from "kaplay";
import kaplayCtx from "./kaplayCtx";

function makeGameManager() {
    return kaplayCtx.add([
        kaplayCtx.state("menu", [
            "menu",
            "cutscene",
            "round-start",
            "round-end",
            "hunt-start",
            "hunt-end",
            "duck-hunted",
            "duck-escaped",
        ]),
        {
            isGamePaused: false,
            currentScore: 0,
            currentRoundNb: 0,
            currentHuntNB: 0,
            nbBulletsLeft: 3,
            nbDucksShotInRound: 0,
            preySpeed: 100,
            resetGameState(this: GameObj) {
                this.currentScore = 0;
                this.currentRoundNb = 0;
                this.currentHuntNB = 0;
                this.nbBulletsLeft = 3;
                this.nbDucksShotInRound = 0;
                this.preySpeed = 100;
            }
        }
    ])
}

export const gameManager = makeGameManager();