import { Entity, EntityType, Vector2D, EnemyState } from '../types';
import { GRAVITY, COLORS, TILE_SIZE } from '../constants';
import { resolveLevelCollision } from '../engine/Physics';

export class DemonKing implements Entity {
  id: string;
  type = EntityType.BOSS;
  pos: Vector2D;
  vel: Vector2D = { x: 1, y: 0 };
  size: Vector2D = { x: 120, y: 150 };
  facing = 1;
  onGround = false;
  
  hp: number = 100;
  maxHp: number = 100;
  isDead = false;
  isDefeated = false;
  defeatTimer = 0;
  
  attackTimer = 0;
  jumpTimer = 2000;
  
  constructor(id: string, x: number, y: number, difficultyMultiplier: number = 1) {
    this.id = id;
    this.pos = { x, y };
    this.hp = Math.floor(100 * difficultyMultiplier);
    this.maxHp = this.hp;
  }

  update(dt: number, level: number[][]) {
    if (this.isDead) return;

    if (this.isDefeated) {
      this.defeatTimer += dt;
      if (this.defeatTimer > 3000) {
        this.isDead = true;
      }
      return;
    }

    this.vel.y += GRAVITY * 0.5; // Boss falls slower

    // Simple movement
    if (this.onGround) {
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0) {
        this.vel.y = -12;
        this.jumpTimer = 3000 + Math.random() * 2000;
      }
      
      // Wander horizontally
      const nextX = this.pos.x + this.vel.x;
      const tileX = Math.floor((this.vel.x > 0 ? nextX + this.size.x : nextX) / TILE_SIZE);
      const tileY = Math.floor((this.pos.y + this.size.y / 2) / TILE_SIZE);
      
      if (level[tileY]?.[tileX] === 1 || tileX <= 1 || tileX >= 23) {
        this.vel.x *= -1;
        this.facing *= -1;
      }
    }

    const result = resolveLevelCollision(this.pos, this.vel, this.size, level);
    this.pos = result.pos;
    this.vel = result.vel;
    this.onGround = result.onGround;

    if (this.hp <= 0 && !this.isDefeated) {
      this.isDefeated = true;
      this.defeatTimer = 0;
      this.vel = { x: 0, y: 0 };
    }
  }

  takeDamage(amount: number) {
    if (this.isDefeated) return;
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    
    let shakeX = 0;
    let shakeY = 0;
    let scale = 1;

    if (this.isDefeated) {
      // Shaking stage
      if (this.defeatTimer < 1500) {
        shakeX = (Math.random() - 0.5) * (this.defeatTimer / 50);
        shakeY = (Math.random() - 0.5) * (this.defeatTimer / 50);
      } else {
        // Shrinking stage
        scale = Math.max(0, 1 - (this.defeatTimer - 1500) / 1500);
        shakeX = (Math.random() - 0.5) * 20;
        shakeY = (Math.random() - 0.5) * 20;
      }
    }

    ctx.translate(this.pos.x + this.size.x / 2 + shakeX, this.pos.y + this.size.y / 2 + shakeY);
    ctx.scale(scale, scale);

    // Demon Body
    const pulse = this.isDefeated ? 0 : Math.sin(Date.now() / 200) * 5;
    
    // Shadow/Aura
    ctx.shadowBlur = this.isDefeated ? 30 : 20;
    ctx.shadowColor = '#FF0000';
    
    ctx.fillStyle = this.isDefeated && this.defeatTimer > 1500 ? '#FF0000' : '#1A1A1A';
    ctx.beginPath();
    ctx.moveTo(-50 - pulse, 75);
    ctx.quadraticCurveTo(-60, -75, 0, -100 - pulse);
    ctx.quadraticCurveTo(60, -75, 50 + pulse, 75);
    ctx.closePath();
    ctx.fill();

    // Horns
    ctx.fillStyle = this.isDefeated && this.defeatTimer > 1500 ? '#FF3333' : '#330000';
    ctx.beginPath();
    ctx.moveTo(-40, -80);
    ctx.lineTo(-60, -120);
    ctx.lineTo(-20, -90);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(40, -80);
    ctx.lineTo(60, -120);
    ctx.lineTo(20, -90);
    ctx.fill();

    // Eyes
    ctx.fillStyle = this.isDefeated ? (Math.random() > 0.5 ? '#FFFFFF' : '#FF0000') : '#FF0000';
    const eyeSize = 10 + (this.isDefeated ? 5 : Math.sin(Date.now() / 100) * 2);
    ctx.beginPath();
    ctx.arc(-20, -40, eyeSize, 0, Math.PI * 2);
    ctx.arc(20, -40, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Grin
    ctx.strokeStyle = this.isDefeated ? '#FFFFFF' : '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, 20);
    ctx.quadraticCurveTo(0, 40, 30, 20);
    ctx.stroke();

    ctx.restore();

    // Health Bar (Hide when defeated)
    if (!this.isDefeated) {
      const barWidth = 200;
      const barHeight = 10;
      const barX = this.pos.x + this.size.x / 2 - barWidth / 2;
      const barY = this.pos.y - 20;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      const healthPercent = this.hp / this.maxHp;
      ctx.fillStyle = healthPercent > 0.3 ? '#FF0000' : '#880000';
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
      
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`DEMON KING: ${Math.ceil(this.hp)} HP`, barX + barWidth / 2, barY - 5);
    }
  }
}
