import type { GameObj } from "kaplay";
import kaplayCtx from "../kaplayCtx";
import gameManager from "../gameManager";
import { COLORS } from "../constants";

export default function makeDuck(duckId: string, speed: number) {
  const startingPos = [
    kaplayCtx.vec2(80, kaplayCtx.center().y + 40),
    kaplayCtx.vec2(kaplayCtx.center().x, kaplayCtx.center().y + 40),
    kaplayCtx.vec2(200, kaplayCtx.center().y + 40),
  ];

  const flyDirections = [kaplayCtx.vec2(-1, -1), kaplayCtx.vec2(1, -1), kaplayCtx.vec2(1, -1)];

  const chosenPosIndex = kaplayCtx.randi(startingPos.length);
  const chosenFlyDirectionIndex = kaplayCtx.randi(flyDirections.length);

  return kaplayCtx.add([
    kaplayCtx.sprite("duck", { anim: "flight-side" }),
    kaplayCtx.area({ shape: new kaplayCtx.Rect(kaplayCtx.vec2(0), 24, 24) }),
    kaplayCtx.body(),
    kaplayCtx.anchor("center"),
    kaplayCtx.pos(startingPos[chosenPosIndex]),
    kaplayCtx.state("fly", ["fly", "shot", "fall"]),
    kaplayCtx.timer(),
    kaplayCtx.offscreen({ destroy: true, distance: 100 }),
    {
      flyTimer: 0,
      timeBeforeEscape: 5,
      duckId,
      flyDirection: null,
      speed,
      quackingSound: null,
      flappingSound: null,
      setBehavior(this: GameObj) {
        this.flyDirection = flyDirections[chosenFlyDirectionIndex];
        // make duck face the correct direction
        if (this.flyDirection.x < 0) this.flipX = true;
        this.quackingSound = kaplayCtx.play("quacking", { volume: 0.5, loop: true });
        this.flappingSound = kaplayCtx.play("flapping", { loop: true, speed: 2 });

        this.onStateUpdate("fly", () => {
          if (
            this.flyTimer < this.timeBeforeEscape &&
            (this.pos.x > kaplayCtx.width() + 10 || this.pos.x < -10)
          ) {
            this.flyDirection.x = -this.flyDirection.x;
            this.flyDirection.y = this.flyDirection.y;
            this.flipX = !this.flipX;
            const currentAnim =
              this.getCurAnim().name === "flight-side"
                ? "flight-diagonal"
                : "flight-side";
            this.play(currentAnim);
          }
          if (this.pos.y < -10 || this.pos.y > kaplayCtx.height() - 70) {
            this.flyDirection.y = -this.flyDirection.y;
            const currentAnim =
              this.getCurAnim().name === "flight-side"
                ? "flight-diagonal"
                : "flight-side";
            this.play(currentAnim);
          }
          this.move(kaplayCtx.vec2(this.flyDirection).scale(this.speed));
        });
        this.onStateEnter("shot", async () => {
          gameManager.nbDucksShotInRound++;
          this.play("shot");
          this.quackingSound.stop();
          this.flappingSound.stop();
          await kaplayCtx.wait(0.2);
          this.enterState("fall");
        });
        this.onStateEnter("fall", () => {
          this.fallSound = kaplayCtx.play("fall", { volume: 0.7 });
          this.play("fall");
        });
        this.onStateUpdate("fall", async () => {
          this.move(0, this.speed);
          if (this.pos.y > kaplayCtx.height() - 70) {
            this.fallSound.stop();
            kaplayCtx.play("impact");
            kaplayCtx.destroy(this);
            sky.color = kaplayCtx.Color.fromHex(COLORS.BLUE);
            const duckIcon = kaplayCtx.get(`duckIcon-${this.duckId}`, {
              recursive: true,
            })[0];
            if (duckIcon) duckIcon.color = kaplayCtx.Color.fromHex(COLORS.RED);

            await kaplayCtx.wait(1);
            gameManager.enterState("duck-hunted");
          }
        });
        this.onClick(() => {
          if (gameManager.nbBulletsLeft < 0) return;
          gameManager.currentScore += 100;
          this.play("shot");
          this.enterState("shot");
        });
        const sky = kaplayCtx.get("sky")[0];
        this.loop(1, () => {
          this.flyTimer += 1;
          if (this.flyTimer === this.timeBeforeEscape) {
            sky.color = kaplayCtx.Color.fromHex(COLORS.BEIGE);
          }
        });
        this.onExitScreen(() => {
          this.quackingSound.stop();
          this.flappingSound.stop();
          sky.color = kaplayCtx.Color.fromHex(COLORS.BLUE);
          gameManager.nbBulletsLeft = 3;
          gameManager.enterState("duck-escaped");
        });
      },
    },
  ]);
}