import { Entity, EntityType, Vector2D } from '../types';
import { COLORS } from '../constants';

export class Projectile implements Entity {
  id: string;
  type = EntityType.PROJECTILE;
  pos: Vector2D;
  vel: Vector2D;
  size: Vector2D = { x: 10, y: 10 };
  facing: number;
  onGround = false;
  life = 300; // Short range

  constructor(id: string, x: number, y: number, facing: number, isPower: boolean = false) {
    this.id = id;
    this.pos = { x, y };
    const speed = isPower ? 12 : 8;
    this.vel = { x: facing * speed, y: 0 };
    this.facing = facing;
    this.life = isPower ? 500 : 300;
  }

  update(dt: number, level: number[][]) {
    this.pos.x += this.vel.x;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = COLORS.SNOWBALL;
    ctx.beginPath();
    ctx.arc(this.pos.x + 5, this.pos.y + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow for power shots
    if (this.life > 0 && this.vel.x > 8 || this.vel.x < -8) {
       ctx.shadowColor = '#FF0000';
       ctx.shadowBlur = 10;
       ctx.stroke();
    }
  }
}
