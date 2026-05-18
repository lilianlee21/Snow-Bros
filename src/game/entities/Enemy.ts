import { Entity, EntityType, Vector2D, EnemyState } from '../types';
import { GRAVITY, MOVE_SPEED, COLORS, TILE_SIZE } from '../constants';
import { resolveLevelCollision } from '../engine/Physics';

export class Enemy implements Entity {
  id: string;
  type = EntityType.ENEMY;
  pos: Vector2D;
  vel: Vector2D = { x: -2, y: 0 };
  size: Vector2D = { x: 30, y: 38 };
  facing = -1;
  onGround = false;
  
  state: EnemyState = EnemyState.NORMAL;
  snowLayers = 0;
  maxSnowLayers = 4;
  stunTimer = 0;
  rollVel = 0;
  isDead = false;
  speedMultiplier = 1;
  color: string;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.pos = { x, y };
    
    // Assign ghost colors (Blinky, Pinky, Inky, Clyde)
    const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
    const index = parseInt(id.replace('e', '')) || 0;
    this.color = ghostColors[index % ghostColors.length];
  }

  update(dt: number, level: number[][]) {
    if (this.isDead) return;

    if (this.state === EnemyState.NORMAL) {
      this.vel.y += GRAVITY;
      
      // Simple AI: Walk and turn at walls
      const nextX = this.pos.x + this.vel.x;
      const tileX = Math.floor((this.vel.x > 0 ? nextX + this.size.x : nextX) / TILE_SIZE);
      const tileY = Math.floor((this.pos.y + this.size.y / 2) / TILE_SIZE);
      
      if (level[tileY]?.[tileX] === 1) {
        this.vel.x *= -1;
        this.facing *= -1;
      }

      // Turn at edges
      const groundTileX = Math.floor((this.vel.x > 0 ? this.pos.x + this.size.x : this.pos.x) / TILE_SIZE);
      const groundTileY = Math.floor((this.pos.y + this.size.y + 2) / TILE_SIZE);
      if (level[groundTileY]?.[groundTileX] !== 1) {
          this.vel.x *= -1;
          this.facing *= -1;
      }

    } else if (this.state === EnemyState.STUNNED) {
      this.vel.x = 0;
      this.vel.y += GRAVITY;
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.state = EnemyState.NORMAL;
        this.snowLayers = 0;
        this.vel.x = this.facing * 2 * this.speedMultiplier;
      }
    } else if (this.state === EnemyState.ROLLING) {
       this.vel.x = this.rollVel;
       this.vel.y += GRAVITY;
    }

    const result = resolveLevelCollision(this.pos, this.vel, this.size, level);
    
    // Custom logic for rolling snowball
    if (this.state === EnemyState.ROLLING) {
      // If result.vel.x is 0, it means resolveLevelCollision detected a horizontal hit
      if (result.vel.x === 0 && Math.abs(this.rollVel) > 0) {
        const nextX = this.pos.x + this.rollVel;
        const tileX = Math.floor((this.rollVel > 0 ? nextX + this.size.x : nextX) / TILE_SIZE);
        const tileY = Math.floor((this.pos.y + this.size.y / 2) / TILE_SIZE);
        
        // If hitting the side boundaries or walls at the very bottom, explode
        if (tileX <= 0 || tileX >= 19 || tileY >= 13) {
            this.isDead = true;
        } else {
            // Otherwise bounce off internal walls
            this.rollVel *= -1;
            result.vel.x = this.rollVel;
        }
      }
    }

    this.pos = result.pos;
    this.vel = result.vel;
    this.onGround = result.onGround;
  }

  hitWithSnow() {
    if (this.state === EnemyState.ROLLING) return;
    
    this.snowLayers = Math.min(this.snowLayers + 1, this.maxSnowLayers);
    this.state = EnemyState.STUNNED;
    this.stunTimer = 3000; // 3 seconds stun
  }

  kick(direction: number) {
    if (this.state === EnemyState.STUNNED && this.snowLayers === this.maxSnowLayers) {
      this.state = EnemyState.ROLLING;
      this.rollVel = direction * 10;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);

    if (this.state === EnemyState.NORMAL) {
      // Ghost Body (Pac-Man Style)
      ctx.fillStyle = this.color;
      
      // Rounded top
      ctx.beginPath();
      ctx.arc(0, -5, 12, Math.PI, 0);
      ctx.lineTo(12, 15);
      
      // Wavy bottom
      const waveCount = 3;
      const waveWidth = 24 / waveCount;
      const time = Date.now() / 150; // Animation time
      for (let i = 0; i <= waveCount; i++) {
          const x = 12 - i * waveWidth;
          const y = 15 + Math.sin(time + i) * 3;
          ctx.lineTo(x, y);
      }
      
      ctx.lineTo(-12, -5);
      ctx.closePath();
      ctx.fill();
      
      // Eyes (White part)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(this.facing * 5 - 2, -6, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(this.facing * 5 + 6, -6, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils (Looking in direction)
      ctx.fillStyle = '#0000FF';
      ctx.beginPath();
      ctx.arc(this.facing * 5 - 2 + this.facing * 2, -6, 2, 0, Math.PI * 2);
      ctx.arc(this.facing * 5 + 6 + this.facing * 2, -6, 2, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Snowball state (with ghost trapped inside)
      const progress = this.snowLayers / this.maxSnowLayers;
      const isAboutToWake = this.state === EnemyState.STUNNED && this.stunTimer < 1000;
      const wobble = isAboutToWake ? Math.sin(Date.now() / 30) * 2 : 0;
      
      ctx.translate(wobble, 0);

      const radius = 12 + progress * 8;
      
      // Ghost peering through (scared blue color if stunned, or frozen color)
      if (this.state === EnemyState.STUNNED) {
        ctx.save();
        // Shake the ghost internally if about to wake or just generally for "struggling" feel
        const ghostShakeX = Math.sin(Date.now() / 50) * (isAboutToWake ? 3 : 1);
        const ghostShakeY = Math.cos(Date.now() / 40) * (isAboutToWake ? 2 : 0.5);
        ctx.translate(ghostShakeX, ghostShakeY);

        ctx.fillStyle = '#2121ff'; // Scared Ghost Blue
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Scared eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-4, -4, 3, 3);
        ctx.fillRect(4, -4, 3, 3);
        
        // Scared wavy mouth
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        for(let i=0; i<3; i++) {
          ctx.lineTo(-6+i*4+2, (i + Math.floor(Date.now()/200)) % 2 ? 0 : 4);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Snow layers overlay
      ctx.fillStyle = `rgba(204, 255, 255, ${0.4 + progress * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Icy border
      ctx.strokeStyle = isAboutToWake ? '#FFCCCC' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Warning exclamation if about to wake
      if (isAboutToWake) {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -radius - 5);
      }

      if (this.state === EnemyState.ROLLING) {
          // Add rotation effect for rolling snowball
          ctx.rotate(Date.now() / 50 * (this.rollVel > 0 ? 1 : -1));
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.beginPath();
          ctx.moveTo(-radius, 0);
          ctx.lineTo(radius, 0);
          ctx.stroke();
      }
    }

    ctx.restore();
  }
}
