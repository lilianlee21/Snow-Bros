import { Entity, EntityType, Vector2D, FruitType } from '../types';
import { GRAVITY, TILE_SIZE } from '../constants';
import { resolveLevelCollision } from '../engine/Physics';

export class Fruit implements Entity {
  id: string;
  type = EntityType.FRUIT;
  pos: Vector2D;
  vel: Vector2D = { x: 0, y: 0 };
  size: Vector2D = { x: 20, y: 20 };
  facing = 1;
  onGround = false;
  fruitType: FruitType;
  life = 40000; // 40 seconds to collect

  constructor(id: string, x: number, y: number, fruitType: FruitType) {
    this.id = id;
    this.pos = { x, y };
    this.fruitType = fruitType;
  }

  update(dt: number, level: number[][]) {
    this.vel.y += GRAVITY;
    this.life -= dt;

    const result = resolveLevelCollision(this.pos, this.vel, this.size, level);
    this.pos = result.pos;
    this.vel = result.vel;
    this.onGround = result.onGround;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life < 5000 && Math.floor(Date.now() / 100) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);

    switch (this.fruitType) {
      case FruitType.BLUE:
        this.drawFruit(ctx, '#3366FF', 'berries');
        break;
      case FruitType.YELLOW:
        this.drawFruit(ctx, '#FFCC00', 'lemon');
        break;
      case FruitType.RED:
        this.drawFruit(ctx, '#FF0000', 'apple');
        break;
      case FruitType.CAKE:
        this.drawCake(ctx);
        break;
    }

    ctx.restore();
  }

  private drawFruit(ctx: CanvasRenderingContext2D, color: string, type: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Leaf
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.ellipse(2, -6, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCake(ctx: CanvasRenderingContext2D) {
    // Base
    ctx.fillStyle = '#FFE4C4';
    ctx.fillRect(-8, 0, 16, 8);
    // Frosting
    ctx.fillStyle = '#FFC0CB';
    ctx.fillRect(-8, -4, 16, 4);
    // Cherry
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, -6, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
