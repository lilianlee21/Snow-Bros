import { Entity, EntityType, Vector2D } from '../types';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, COLORS } from '../constants';
import { resolveLevelCollision } from '../engine/Physics';
import { input } from '../engine/Input';

export class Player implements Entity {
  id = 'player';
  type = EntityType.PLAYER;
  pos: Vector2D = { x: 100, y: 100 };
  vel: Vector2D = { x: 0, y: 0 };
  size: Vector2D = { x: 30, y: 38 };
  facing = 1;
  onGround = false;
  lastShootTime = 0;
  isShooting = false;
  isPunching = false;
  punchTimer = 0;
  invincibleTimer = 0;
  speedBoostTimer = 0;
  powerShotTimer = 0;

  update(dt: number, level: number[][]) {
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
    }
    if (this.powerShotTimer > 0) {
      this.powerShotTimer -= dt;
    }

    const h = input.getHorizontal();
    let currentSpeed = MOVE_SPEED;
    if (this.speedBoostTimer > 0) {
      currentSpeed *= 1.6;
    }
    this.vel.x = h * currentSpeed;
    
    if (h !== 0) this.facing = h;

    if (input.isJumpPressed() && this.onGround) {
      this.vel.y = JUMP_FORCE;
      this.onGround = false;
    }

    this.vel.y += GRAVITY;

    const result = resolveLevelCollision(this.pos, this.vel, this.size, level);
    this.pos = result.pos;
    this.vel = result.vel;
    this.onGround = result.onGround;

    this.isShooting = input.isShootPressed();

    if (input.isPunchPressed() && !this.isPunching) {
      this.isPunching = true;
      this.punchTimer = 200; // Duration of the punch animation
    }

    if (this.isPunching) {
      this.punchTimer -= dt;
      if (this.punchTimer <= 0) {
        this.isPunching = false;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    
    // Invincibility Glow
    if (this.invincibleTimer > 0) {
      ctx.shadowColor = '#FFCC00';
      ctx.shadowBlur = 15;
      // Drawing a secondary circle for the glow effect
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
      ctx.fill();
    }
    
    // Character Body
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(0, 5, 12, 0, Math.PI * 2); // Bottom ball
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI * 2); // Top head
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.facing * 3, -12, 2, 2);
    ctx.fillRect(this.facing * 7, -12, 2, 2);

    // Hat (Blue for Player 1)
    ctx.fillStyle = '#3366FF';
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.lineTo(0, -28);
    ctx.closePath();
    ctx.fill();

    // Snow breath effect if shooting
    if (this.isShooting) {
        ctx.fillStyle = 'rgba(200, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.facing * 20, -5, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Punching / Glove effect
    if (this.isPunching) {
      ctx.fillStyle = '#CC3333'; // Deep Red Gloves
      const extend = Math.sin((this.punchTimer / 200) * Math.PI) * 15;
      
      // Glove body
      ctx.beginPath();
      ctx.arc(this.facing * (10 + extend), 5, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow/Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(this.facing * (10 + extend) - this.facing * 2, 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
