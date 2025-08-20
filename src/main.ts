import { COLORS, fontConfig } from "./constants";
import makeDog from "./entities/dog";
import { gameManager } from "./gameManager";
import kaplayCtx from "./kaplayCtx";
import { formatScore } from "./utils";

kaplayCtx.loadSprite("menu", "./graphics/menu.png");
kaplayCtx.loadSprite("background", "./graphics/background.png");
kaplayCtx.loadSprite("cursor", "./graphics/cursor.png");
kaplayCtx.loadSprite("text-box", "./graphics/text-box.png");
kaplayCtx.loadSprite("dog", "./graphics/dog.png", {
    sliceX: 4,
    sliceY: 3,
    anims: {
        search: { from: 0, to: 3, speed: 6, loop: true },
        snif: { from: 4, to: 5, speed: 6, loop: true },
        detect: 6,
        jump: { from: 7, to: 8, speed: 6},
        catch: 9,
        mock: { from: 10, to: 11, speed: 6, loop: true },
    },
});

kaplayCtx.loadSound("gun-shot", "./sounds/gun-shot.wav");
kaplayCtx.loadSound("ui-appear", "./sounds/ui-appear.wav");
kaplayCtx.loadSound("sniffing", "./sounds/sniffing.wav");
kaplayCtx.loadSound("barking", "./sounds/barking.wav");
kaplayCtx.loadSound("laughing", "./sounds/laughing.wav");
kaplayCtx.loadSound("successfull-catch", "./sounds/successfull-catch.wav");

kaplayCtx.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");

kaplayCtx.scene("main-menu", () => {
    kaplayCtx.add(
        [
            kaplayCtx.sprite("menu")
        ]
    );

    kaplayCtx.add(
        [
            kaplayCtx.text("CLICK TO START", {
                font: "nes",
                size: 8
            }),

            kaplayCtx.anchor("center"),

            kaplayCtx.pos(
                kaplayCtx.center().x,
                kaplayCtx.center().y + 40
            ),
        ]
    );

    kaplayCtx.add([
        kaplayCtx.text("MADE BY HOLOSHCHAPOV", fontConfig),
        kaplayCtx.z(2),
        kaplayCtx.pos(10, 215),
        kaplayCtx.color(COLORS.BLUE),
        kaplayCtx.opacity(0.5),
    ]);
    
    let bestScore: number = kaplayCtx.getData("best-score") || 0;

    if (!bestScore) {
        bestScore = 0;
        kaplayCtx.setData("best-score", 0);
    }

    kaplayCtx.add([
        kaplayCtx.text(`TOP SCORE: ${formatScore(bestScore, 6)}`, {
            font: "nes",
            size: 8,
        }),
        kaplayCtx.pos(55, 184),
        kaplayCtx.color(COLORS.RED),
    ]);

    kaplayCtx.onClick(() => {
        kaplayCtx.go("game");
    })
});

kaplayCtx.scene("game", () => {
    kaplayCtx.setCursor("none");
    kaplayCtx.add([kaplayCtx.rect(kaplayCtx.width(), kaplayCtx.height()), kaplayCtx.color(COLORS.BLUE), "sky"]);
    kaplayCtx.add([kaplayCtx.sprite("background"), kaplayCtx.pos(0, -10), kaplayCtx.z(1)]);

    const score = kaplayCtx.add([
        kaplayCtx.text(formatScore(0, 6), fontConfig),
        kaplayCtx.pos(192, 197),
        kaplayCtx.z(2),
    ]);

    const roundScore = kaplayCtx.add([
        kaplayCtx.text("1", fontConfig),
        kaplayCtx.pos(42, 182),
        kaplayCtx.z(2),
        kaplayCtx.color(COLORS.RED),
    ]);

    const ducks = kaplayCtx.add([kaplayCtx.pos(95, 198)]);
    let ducksPosX = 1;
    for(let i = 0; i < 10; i++) {
        ducks.add([kaplayCtx.rect(7, 9), kaplayCtx.pos(ducksPosX, 0), `duck-${i}`]);
        ducksPosX += 8;
    }

    const bulletUIMask = kaplayCtx.add([
        kaplayCtx.rect(0, 8),
        kaplayCtx.pos(25, 198),
        kaplayCtx.z(2),
        kaplayCtx.color(0, 0, 0),
    ]);

    const dog = makeDog(kaplayCtx.vec2(0, kaplayCtx.center().y));
    dog.searchForDucks();

    const roundStartController = gameManager.onStateEnter("round-start",
        async (isFirstRound: Boolean) => {
            if (!isFirstRound) gameManager.preySpeed += 50;
            kaplayCtx.play("ui-appear");
            gameManager.currentRoundNb++;
            roundScore.text = String(gameManager.currentRoundNb);
            const textBox = kaplayCtx.add([
                kaplayCtx.sprite("text-box"),
                kaplayCtx.anchor("center"),
                kaplayCtx.pos(kaplayCtx.center().x, kaplayCtx.center().y - 50),
                kaplayCtx.z(2),
            ]);

            textBox.add([
                kaplayCtx.text("ROUND", fontConfig),
                kaplayCtx.anchor("center"),
                kaplayCtx.pos(0, -10),
            ]);

            textBox.add([
                kaplayCtx.text(String(gameManager.currentRoundNb), fontConfig),
                kaplayCtx.anchor("center"),
                kaplayCtx.pos(0, 4),
            ]);

            await kaplayCtx.wait(1);
            kaplayCtx.destroy(textBox);
            gameManager.enterState("hunt-start");
        }
    );

    const roundEndController = gameManager.onStateEnter("round-end", () => {});

    const huntStartController = gameManager.onStateEnter("hunt-start", () => {});

    const huntEndController = gameManager.onStateEnter("hunt-end", () => {});

    const duckHuntedController = gameManager.onStateEnter("duck-hunted", () => {});

    const duckEscapedController = gameManager.onStateEnter("duck-escaped", () => {});

    const cursor = kaplayCtx.add([
        kaplayCtx.sprite("cursor"),
        kaplayCtx.anchor("center"),
        kaplayCtx.pos(),
        kaplayCtx.z(3),
    ]);

    kaplayCtx.onClick(() => {
        if (gameManager.state === "hunt-start" && !gameManager.isGamePaused) {
            if (gameManager.nbBulletsLeft > 0) kaplayCtx.play("gun-shot", {volume: 0.5});
                gameManager.nbBulletsLeft--;
        }
    });

    kaplayCtx.onUpdate(() => {
        score.text = formatScore(gameManager.currentScore, 6);

        switch (gameManager.nbBulletsLeft) {
            case 3:
                bulletUIMask.width = 0;
                break;
            case 2:
                bulletUIMask.width = 8;
                break;
            case 1:
                bulletUIMask.width = 15;
                break;
            default:
                bulletUIMask.width = 22; 
        }

        cursor.moveTo(kaplayCtx.mousePos());
    });

    kaplayCtx.onSceneLeave(() => {
        roundStartController.cancel();
        roundEndController.cancel();
        huntStartController.cancel();
        huntEndController.cancel();
        duckHuntedController.cancel();
        duckEscapedController.cancel();
        gameManager.resetGameState();
    });
});

kaplayCtx.scene("game-over", () => {});

kaplayCtx.go("main-menu");