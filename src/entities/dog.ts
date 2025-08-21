import type { GameObj, Vec2 } from "kaplay";
import kaplayCtx from "../kaplayCtx";
import gameManager from "../gameManager";

export default function makeDog(position: Vec2) {
  const sniffingSound = kaplayCtx.play("sniffing", { volume: 2 });
  sniffingSound.stop();

  const barkingSound = kaplayCtx.play("barking");
  barkingSound.stop();

  const laughingSound = kaplayCtx.play("laughing");
  laughingSound.stop();

  return kaplayCtx.add([
    kaplayCtx.sprite("dog"),
    kaplayCtx.pos(position),
    kaplayCtx.state("search", ["search", "snif", "detect", "jump", "drop"]),
    kaplayCtx.z(2),
    {
      speed: 15,
      searchForDucks(this: GameObj) {
        let nbSnifs = 0;

        this.onStateEnter("search", () => {
          this.play("search");
          kaplayCtx.wait(2, () => {
            this.enterState("snif");
          });
        });

        this.onStateUpdate("search", () => {
          this.move(this.speed, 0);
        });

        this.onStateEnter("snif", () => {
          nbSnifs++;
          this.play("snif");
          sniffingSound.play();
          kaplayCtx.wait(2, () => {
            sniffingSound.stop();
            if (nbSnifs === 2) {
              this.enterState("detect");
              return;
            }
            this.enterState("search");
          });
        });

        this.onStateEnter("detect", () => {
          barkingSound.play();
          this.play("detect");
          kaplayCtx.wait(1, () => {
            barkingSound.stop();
            this.enterState("jump");
          });
        });

        this.onStateEnter("jump", () => {
          barkingSound.play();
          this.play("jump");
          kaplayCtx.wait(0.5, () => {
            barkingSound.stop();
            this.use(kaplayCtx.z(0));
            this.enterState("drop");
          });
        });

        this.onStateUpdate("jump", () => {
          this.move(100, -50);
        });

        this.onStateEnter("drop", async () => {
          await kaplayCtx.tween(
            this.pos.y,
            125,
            0.5,
            (newY) => (this.pos.y = newY),
            kaplayCtx.easings.linear
          );
          gameManager.enterState("round-start", true);
        });
      },
      async slideUpAndDown(this: GameObj) {
        await kaplayCtx.tween(
          this.pos.y,
          90,
          0.4,
          (newY) => (this.pos.y = newY),
          kaplayCtx.easings.linear
        );
        await kaplayCtx.wait(1);
        await kaplayCtx.tween(
          this.pos.y,
          125,
          0.4,
          (newY) => (this.pos.y = newY),
          kaplayCtx.easings.linear
        );
      },
      async catchFallenDuck(this: GameObj) {
        this.play("catch");
        kaplayCtx.play("successful-hunt");
        await this.slideUpAndDown();
        gameManager.enterState("hunt-end");
      },

      async mockPlayer(this: GameObj) {
        laughingSound.play();
        this.play("mock");
        await this.slideUpAndDown();
        gameManager.enterState("hunt-end");
      },
    },
  ]);
}