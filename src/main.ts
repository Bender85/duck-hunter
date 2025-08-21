import kaplayCtx from "./kaplayCtx";
import { COLORS } from "./constants";
import gameManager from "./gameManager";
import formatScore from "./utils";
import makeDog from "./entities/dog";
import makeDuck from "./entities/duck";

kaplayCtx.loadSprite("background", "./graphics/background.png");
kaplayCtx.loadSprite("menu", "./graphics/menu.png");
kaplayCtx.loadSprite("cursor", "./graphics/cursor.png");
kaplayCtx.loadFont("nes", "./fonts/nintendo-nes-font/nintendo-nes-font.ttf");
kaplayCtx.loadSprite("dog", "./graphics/dog.png", {
  sliceX: 4,
  sliceY: 3,
  anims: {
    search: { from: 0, to: 3, speed: 6, loop: true },
    snif: { from: 4, to: 5, speed: 4, loop: true },
    detect: 6,
    jump: { from: 7, to: 8, speed: 6 },
    catch: 9,
    mock: { from: 10, to: 11, loop: true },
  },
});
kaplayCtx.loadSprite("duck", "./graphics/duck.png", {
  sliceX: 8,
  sliceY: 1,
  anims: {
    "flight-diagonal": { from: 0, to: 2, loop: true },
    "flight-side": { from: 3, to: 5, loop: true },
    shot: 6,
    fall: 7,
  },
});
kaplayCtx.loadSprite("text-box", "./graphics/text-box.png");
kaplayCtx.loadSound("gun-shot", "./sounds/gun-shot.wav");
kaplayCtx.loadSound("quacking", "./sounds/quacking.wav");
kaplayCtx.loadSound("flapping", "./sounds/flapping.ogg");
kaplayCtx.loadSound("fall", "./sounds/fall.wav");
kaplayCtx.loadSound("impact", "./sounds/impact.wav");
kaplayCtx.loadSound("sniffing", "./sounds/sniffing.wav");
kaplayCtx.loadSound("barking", "./sounds/barking.wav");
kaplayCtx.loadSound("laughing", "./sounds/laughing.wav");
kaplayCtx.loadSound("ui-appear", "./sounds/ui-appear.wav");
kaplayCtx.loadSound("successful-hunt", "./sounds/successful-hunt.wav");
kaplayCtx.loadSound("forest-ambiance", "./sounds/forest-ambiance.wav");

kaplayCtx.scene("main-menu", () => {
  kaplayCtx.add([kaplayCtx.sprite("menu")]);

  kaplayCtx.add([
    kaplayCtx.text("CLICK TO START", { font: "nes", size: 8 }),
    kaplayCtx.anchor("center"),
    kaplayCtx.pos(kaplayCtx.center().x, kaplayCtx.center().y + 40),
  ]);

  kaplayCtx.add([
    kaplayCtx.text("MADE BY JSLEGEND", { font: "nes", size: 8 }),
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
    kaplayCtx.text(`TOP SCORE = ${formatScore(bestScore, 6)}`, {
      font: "nes",
      size: 8,
    }),
    kaplayCtx.pos(55, 184),
    kaplayCtx.color(COLORS.RED),
  ]);

  kaplayCtx.onClick(() => {
    kaplayCtx.go("game");
  });
});

kaplayCtx.scene("game", () => {
  kaplayCtx.setCursor("none");
  kaplayCtx.add([kaplayCtx.rect(kaplayCtx.width(), kaplayCtx.height()), kaplayCtx.color(COLORS.BLUE), "sky"]);
  kaplayCtx.add([kaplayCtx.sprite("background"), kaplayCtx.pos(0, -10), kaplayCtx.z(1)]);

  const score = kaplayCtx.add([
    kaplayCtx.text(formatScore(0, 6), { font: "nes", size: 8 }),
    kaplayCtx.pos(192, 197),
    kaplayCtx.z(2),
  ]);

  const roundCount = kaplayCtx.add([
    kaplayCtx.text("1", { font: "nes", size: 8 }),
    kaplayCtx.pos(42, 182),
    kaplayCtx.z(2),
    kaplayCtx.color(COLORS.RED),
  ]);

  const duckIcons = kaplayCtx.add([kaplayCtx.pos(95, 198)]);
  let duckIconPosX = 1;
  for (let i = 0; i < 10; i++) {
    duckIcons.add([kaplayCtx.rect(7, 9), kaplayCtx.pos(duckIconPosX, 0), `duckIcon-${i}`]);
    duckIconPosX += 8;
  }

  const bulletUIMask = kaplayCtx.add([
    kaplayCtx.rect(0, 8),
    kaplayCtx.pos(25, 198),
    kaplayCtx.z(2),
    kaplayCtx.color(0, 0, 0),
  ]);

  const dog = makeDog(kaplayCtx.vec2(0, kaplayCtx.center().y));
  dog.searchForDucks();

  const roundStartController = gameManager.onStateEnter(
    "round-start",
    async (isFirstRound) => {
      if (!isFirstRound) gameManager.preySpeed += 50;
      kaplayCtx.play("ui-appear");
      gameManager.currentRoundNb++;
      roundCount.text = String(gameManager.currentRoundNb);
      const textBox = kaplayCtx.add([
        kaplayCtx.sprite("text-box"),
        kaplayCtx.anchor("center"),
        kaplayCtx.pos(kaplayCtx.center().x, kaplayCtx.center().y - 50),
        kaplayCtx.z(2),
      ]);
      textBox.add([
        kaplayCtx.text("ROUND", { font: "nes", size: 8 }),
        kaplayCtx.anchor("center"),
        kaplayCtx.pos(0, -10),
      ]);
      textBox.add([
        kaplayCtx.text(String(gameManager.currentRoundNb), { font: "nes", size: 8 }),
        kaplayCtx.anchor("center"),
        kaplayCtx.pos(0, 4),
      ]);

      await kaplayCtx.wait(1);
      kaplayCtx.destroy(textBox);
      gameManager.enterState("hunt-start");
    }
  );

  const roundEndController = gameManager.onStateEnter("round-end", () => {
    if (gameManager.nbDucksShotInRound < 6) {
      kaplayCtx.go("game-over");
      return;
    }

    if (gameManager.nbDucksShotInRound === 10) {
      gameManager.currentScore += 500;
    }

    gameManager.nbDucksShotInRound = 0;
    for (const duckIcon of duckIcons.children) {
      duckIcon.color = kaplayCtx.color(255, 255, 255);
    }
    gameManager.enterState("round-start");
  });

  const huntStartController = gameManager.onStateEnter("hunt-start", () => {
    gameManager.currentHuntNb++;
    const duck = makeDuck(
      String(gameManager.currentHuntNb - 1),
      gameManager.preySpeed
    );
    duck.setBehavior();
  });

  const huntEndController = gameManager.onStateEnter("hunt-end", () => {
    const bestScore = Number(kaplayCtx.getData("best-score"));

    if (bestScore < gameManager.currentScore) {
      kaplayCtx.setData("best-score", gameManager.currentScore);
    }

    if (gameManager.currentHuntNb <= 9) {
      gameManager.enterState("hunt-start");
      return;
    }

    gameManager.currentHuntNb = 0;
    gameManager.enterState("round-end");
  });

  const duckHunterController = gameManager.onStateEnter("duck-hunted", () => {
    gameManager.nbBulletsLeft = 3;
    dog.catchFallenDuck();
  });

  const duckEscapedController = gameManager.onStateEnter(
    "duck-escaped",
    async () => {
      dog.mockPlayer();
    }
  );

  const cursor = kaplayCtx.add([
    kaplayCtx.sprite("cursor"),
    kaplayCtx.anchor("center"),
    kaplayCtx.pos(),
    kaplayCtx.z(3),
  ]);
  kaplayCtx.onClick(() => {
    if (gameManager.state === "hunt-start" && !gameManager.isGamePaused) {
      // Note : we need to allow nbBulletsLeft to go below zero
      // so that if cursor overlaps with duck, the duck shot logic
      // will workaplayCtx. Otherwise, the onClick in the Duck class will
      // never register a successful hit because the nbBulletsLeft goes
      // to zero before that onClick runs. Look at a Duck class and you'll understand.
      if (gameManager.nbBulletsLeft > 0) kaplayCtx.play("gun-shot", { volume: 0.5 });
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

  const forestAmbianceSound = kaplayCtx.play("forest-ambiance", {
    volume: 0.1,
    loop: true,
  });
  kaplayCtx.onSceneLeave(() => {
    forestAmbianceSound.stop();
    roundStartController.cancel();
    roundEndController.cancel();
    huntStartController.cancel();
    huntEndController.cancel();
    duckHunterController.cancel();
    duckEscapedController.cancel();
    gameManager.resetGameState();
  });

  kaplayCtx.onKeyPress((key) => {
    if (key === "p") {
      kaplayCtx.getTreeRoot().paused = !kaplayCtx.getTreeRoot().paused;
      if (kaplayCtx.getTreeRoot().paused) {
        gameManager.isGamePaused = true;
        //@ts-ignore
        audioCtx.suspend();
        kaplayCtx.add([
          kaplayCtx.text("PAUSED", { font: "nes", size: 8 }),
          kaplayCtx.pos(5, 5),
          kaplayCtx.z(3),
          "paused-text",
        ]);
      } else {
        gameManager.isGamePaused = false;
        //@ts-ignore
        audioCtx.resume();

        const pausedText = kaplayCtx.get("paused-text")[0];
        if (pausedText) kaplayCtx.destroy(pausedText);
      }
    }
  });
});

kaplayCtx.scene("game-over", () => {
  kaplayCtx.add([kaplayCtx.rect(kaplayCtx.width(), kaplayCtx.height()), kaplayCtx.color(0, 0, 0)]);
  kaplayCtx.add([
    kaplayCtx.text("GAME OVER!", { font: "nes", size: 8 }),
    kaplayCtx.anchor("center"),
    kaplayCtx.pos(kaplayCtx.center()),
  ]);

  kaplayCtx.wait(2, () => {
    kaplayCtx.go("main-menu");
  });
});

kaplayCtx.go("main-menu");