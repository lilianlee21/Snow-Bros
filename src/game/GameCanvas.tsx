import React, { useEffect, useRef, useState } from 'react';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, COLORS } from './constants';
import { LEVELS } from './levels/LevelData';
import { Player } from './entities/Player';
import { Enemy } from './entities/Enemy';
import { DemonKing } from './entities/DemonKing';
import { Projectile } from './entities/Projectile';
import { Fruit } from './entities/Fruit';
import { EnemyState, FruitType, Difficulty, EntityType } from './types';
import { checkCollision } from './engine/Physics';
import { input } from './engine/Input';

interface GameCanvasProps {
  onGameOver: (score: number, reachedLevel: number) => void;
  startLevel?: number;
  difficulty?: Difficulty;
  isPaused?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  onGameOver, 
  startLevel = 0, 
  difficulty = Difficulty.MEDIUM,
  isPaused = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const gameLoopRef = useRef<number>(0);
  
  // Internal mutable state for the game loop
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const onGameOverRef = useRef(onGameOver);
  const levelIndexRef = useRef(0);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  // Game states in refs for performance and mutable access in loop
  const playerRef = useRef(new Player());
  const enemiesRef = useRef<(Enemy | DemonKing)[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const fruitsRef = useRef<Fruit[]>([]);
  const lastShotRef = useRef(0);
  const [shake, setShake] = useState(0);

  // Transition state
  const transitionRef = useRef({ 
    alpha: 0, 
    active: false, 
    phase: 'idle' as 'idle' | 'clear' | 'fade-out' | 'fade-in',
    timer: 0 
  });

  const loadLevel = (index: number) => {
    const levelData = LEVELS[index];
    if (!levelData) return false;

    playerRef.current.pos = { x: 100, y: 100 };
    playerRef.current.vel = { x: 0, y: 0 };
    playerRef.current.invincibleTimer = 1000;
    
    // Filter spawns based on difficulty
    let spawns = [...levelData.spawns];
    const diffMultiplier = difficulty === Difficulty.EASY ? 0.7 : difficulty === Difficulty.HARD ? 1.5 : 1;

    if (levelData.isBoss) {
      enemiesRef.current = spawns.map((spawn, i) => new DemonKing(`boss${i}`, spawn.x, spawn.y, diffMultiplier));
    } else {
      if (difficulty === Difficulty.EASY) {
        spawns = spawns.slice(0, Math.max(1, Math.floor(spawns.length * 0.65)));
      }

      enemiesRef.current = spawns.map((spawn, i) => {
        const enemy = new Enemy(`e${i}`, spawn.x, spawn.y);
        enemy.speedMultiplier = diffMultiplier;
        enemy.vel.x *= enemy.speedMultiplier;
        return enemy;
      });
    }
    
    projectilesRef.current = [];
    fruitsRef.current = [];
    
    return true;
  };

  useEffect(() => {
    loadLevel(startLevel);
    levelIndexRef.current = startLevel;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isTerminated = false;
    let lastTime = performance.now();

    const update = (time: number) => {
      if (isTerminated) return;
      
      const dt = time - lastTime;
      lastTime = time;

      if (isPaused) {
        render(ctx);
        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      if (shake > 0) setShake(s => Math.max(0, s - dt * 0.1));

      // Handle Transitions
      if (transitionRef.current.active) {
        switch (transitionRef.current.phase) {
          case 'clear':
            transitionRef.current.timer -= dt;
            if (transitionRef.current.timer <= 0) {
              transitionRef.current.phase = 'fade-out';
            }
            break;
            
          case 'fade-out':
            transitionRef.current.alpha += dt * 0.002;
            if (transitionRef.current.alpha >= 1) {
              transitionRef.current.alpha = 1;
              levelIndexRef.current++;
              if (!loadLevel(levelIndexRef.current)) {
                isTerminated = true;
                setTimeout(() => onGameOverRef.current(scoreRef.current + 5000, levelIndexRef.current - 1), 0);
                return;
              }
              transitionRef.current.phase = 'fade-in';
            }
            break;

          case 'fade-in':
            transitionRef.current.alpha -= dt * 0.002;
            if (transitionRef.current.alpha <= 0) {
              transitionRef.current.alpha = 0;
              transitionRef.current.active = false;
              transitionRef.current.phase = 'idle';
            }
            break;
        }
      }

      // Update Entities (active if not in fade-out)
      if (transitionRef.current.phase !== 'fade-out') {
        const currentLevel = LEVELS[levelIndexRef.current];
        if (!currentLevel) {
          console.error('Level not found', levelIndexRef.current);
          return;
        }

        playerRef.current.update(dt, currentLevel.map);

        if (playerRef.current.isShooting && transitionRef.current.phase === 'idle') {
          const p = playerRef.current;
          const shotCooldown = p.powerShotTimer > 0 ? 120 : 200;
          if (time - lastShotRef.current > shotCooldown) {
            projectilesRef.current.push(
              new Projectile(
                `p-${Date.now()}`,
                p.pos.x + (p.facing === 1 ? p.size.x : -10),
                p.pos.y + 10,
                p.facing,
                p.powerShotTimer > 0
              )
            );
            lastShotRef.current = time;
          }
        }

        projectilesRef.current.forEach(p => p.update(dt, currentLevel.map));
        projectilesRef.current = projectilesRef.current.filter(p => p.life > 0);

        enemiesRef.current.forEach(e => e.update(dt, currentLevel.map));
        enemiesRef.current = enemiesRef.current.filter(e => !e.isDead);

        fruitsRef.current.forEach(f => f.update(dt, currentLevel.map));
        fruitsRef.current = fruitsRef.current.filter(f => f.life > 0);

        // Level Skip Shortcut
        if (input.isSkipPressed() && !transitionRef.current.active) {
          transitionRef.current.active = true;
          transitionRef.current.phase = 'clear';
          transitionRef.current.timer = 500; // Faster transition for skip
        }

        // Level Clear Condition
        if (enemiesRef.current.length === 0 && !transitionRef.current.active) {
          transitionRef.current.active = true;
          transitionRef.current.phase = 'clear';
          transitionRef.current.timer = 2000; // 2 seconds celebration
        }

        handleCollisions();
      }

      render(ctx);
      gameLoopRef.current = requestAnimationFrame(update);
    };

    const handleCollisions = () => {
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const projectiles = projectilesRef.current;

      // Projectile vs Enemy/Boss
      projectiles.forEach((p) => {
        enemies.forEach(e => {
          if (checkCollision(
            { x: p.pos.x, y: p.pos.y, width: p.size.x, height: p.size.y },
            { x: e.pos.x, y: e.pos.y, width: e.size.x, height: e.size.y }
          )) {
            if (e.type === EntityType.BOSS) {
              (e as DemonKing).takeDamage(p.vel.x > 8 || p.vel.x < -8 ? 5 : 2);
              setShake(2);
            } else if (e.type === EntityType.ENEMY) {
              (e as Enemy).hitWithSnow();
            }
            p.life = 0; 
          }
        });
      });

      // Player vs Enemy/Boss
      for (const e of enemies) {
        // Punch interaction
        if (player.isPunching) {
          const punchBox = {
            x: player.facing === 1 ? player.pos.x + player.size.x : player.pos.x - 30,
            y: player.pos.y,
            width: 30,
            height: player.size.y
          };
          
          if (checkCollision(punchBox, { x: e.pos.x, y: e.pos.y, width: e.size.x, height: e.size.y })) {
            if (e.type === EntityType.ENEMY && (e.state === EnemyState.STUNNED || e.state === EnemyState.ROLLING)) {
              e.isDead = true; 
              setScore(prev => prev + 50); // Small reward for destroying
              setShake(8);
            } else if (e.type === EntityType.BOSS) {
              (e as DemonKing).takeDamage(1); // Small damage from punches
            }
          }
        }

        if (checkCollision(
          { x: player.pos.x, y: player.pos.y, width: player.size.x, height: player.size.y },
          { x: e.pos.x, y: e.pos.y, width: e.size.x, height: e.size.y }
        )) {
          if (e.type === EntityType.BOSS || (e.type === EntityType.ENEMY && e.state === EnemyState.NORMAL)) {
            if (player.invincibleTimer <= 0) {
              livesRef.current -= 1;
              setLives(livesRef.current);
              
              if (livesRef.current <= 0) {
                   isTerminated = true;
                   setTimeout(() => onGameOverRef.current(scoreRef.current, levelIndexRef.current), 0);
                   return;
              }
              
              player.pos = { x: 100, y: 100 };
              player.vel = { x: 0, y: 0 };
              player.invincibleTimer = 2000;
              setShake(15);
            }
          } else if (e.type === EntityType.ENEMY && e.state === EnemyState.STUNNED && e.snowLayers === e.maxSnowLayers) {
             (e as Enemy).kick(player.facing);
             setShake(5);
          }
        }
      }

      // Rolling Snowball vs Enemy/Boss
      enemies.forEach((ball) => {
        if (ball.type === EntityType.ENEMY && ball.state === EnemyState.ROLLING) {
          enemies.forEach((other) => {
            if (ball.id !== other.id && checkCollision(
              { x: ball.pos.x, y: ball.pos.y, width: ball.size.x, height: ball.size.y },
              { x: other.pos.x, y: other.pos.y, width: other.size.x, height: other.size.y }
            )) {
               if (other.type === EntityType.BOSS) {
                  (other as DemonKing).takeDamage(20);
                  ball.isDead = true; // Ball breaks when hitting boss
                  setShake(10);
               } else if (other.type === EntityType.ENEMY && other.state !== EnemyState.ROLLING) {
                  other.isDead = true;
                  
                  // Spawn Fruit
                  const types = [FruitType.BLUE, FruitType.YELLOW, FruitType.RED, FruitType.CAKE];
                  const randomType = types[Math.floor(Math.random() * types.length)];
                  fruitsRef.current.push(new Fruit(`f-${Date.now()}-${Math.random()}`, other.pos.x, other.pos.y, randomType));
                  
                  scoreRef.current += 1000;
                  setScore(scoreRef.current);
                  setShake(8);
               }
            }
          });
        }
      });

      // Player vs Fruit
      fruitsRef.current.forEach((f, idx) => {
        if (checkCollision(
          { x: player.pos.x, y: player.pos.y, width: player.size.x, height: player.size.y },
          { x: f.pos.x, y: f.pos.y, width: f.size.x, height: f.size.y }
        )) {
          // Apply Power-up
          switch (f.fruitType) {
            case FruitType.BLUE:
              player.speedBoostTimer = 10000; // 10s speed
              break;
            case FruitType.YELLOW:
              player.invincibleTimer = 8000; // 8s invincibility
              break;
            case FruitType.RED:
              player.powerShotTimer = 10000; // 10s power
              break;
            case FruitType.CAKE:
              scoreRef.current += 2000;
              setScore(scoreRef.current);
              break;
          }
          f.life = 0; // Remove fruit
        }
      });
    };

    const render = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = COLORS.PLATFORM;
      const currentLevel = LEVELS[levelIndexRef.current];
      if (currentLevel) {
        currentLevel.map.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell === 1) {
              ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = 'rgba(255,255,255,0.1)';
              ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = 'rgba(255,255,255,0.2)';
              ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 4);
              ctx.fillStyle = COLORS.PLATFORM;
            }
          });
        });
      }

      playerRef.current.draw(ctx);
      enemiesRef.current.forEach(e => e.draw(ctx));
      projectilesRef.current.forEach(p => p.draw(ctx));
      fruitsRef.current.forEach(f => f.draw(ctx));

      // Transition Overlay
      if (transitionRef.current.active) {
        if (transitionRef.current.phase === 'clear') {
          // Draw "LEVEL CLEAR" banner
          ctx.save();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, GAME_HEIGHT / 2 - 60, GAME_WIDTH, 120);
          
          ctx.shadowColor = '#3366FF';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 60px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Slight bounce effect
          const bounce = Math.sin(Date.now() / 100) * 5;
          ctx.fillText(`LEVEL ${levelIndexRef.current + 1} CLEAR!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + bounce);
          ctx.restore();
        } else if (transitionRef.current.alpha > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${transitionRef.current.alpha})`;
          ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
      }

      ctx.restore();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${scoreRef.current.toString().padStart(6, '0')}`, 20, 30);
      
      ctx.fillText('LIVES:', GAME_WIDTH - 180, 30);
      for (let i = 0; i < livesRef.current; i++) {
          ctx.beginPath();
          ctx.arc(GAME_WIDTH - 90 + (i * 25), 22, 6, 0, Math.PI * 2);
          ctx.arc(GAME_WIDTH - 90 + (i * 25), 12, 4, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.fillText(`LEVEL ${levelIndexRef.current + 1}`, GAME_WIDTH / 2 - 50, 30);
      
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = difficulty === Difficulty.HARD ? '#FF0000' : difficulty === Difficulty.EASY ? '#00FF00' : '#FFFFFF';
      ctx.textAlign = 'right';
      ctx.fillText(difficulty, GAME_WIDTH - 20, 30);
      ctx.textAlign = 'left';
      ctx.font = 'bold 20px "Courier New", monospace';

      // Power-up indicators
      let uiOffset = 0;
      if (playerRef.current.speedBoostTimer > 0) {
        ctx.fillStyle = '#3366FF';
        ctx.fillText(`SPEED ↑ ${(playerRef.current.speedBoostTimer / 1000).toFixed(1)}s`, 20, 60 + uiOffset);
        uiOffset += 25;
      }
      if (playerRef.current.powerShotTimer > 0) {
        ctx.fillStyle = '#FF0000';
        ctx.fillText(`POWER ↑ ${(playerRef.current.powerShotTimer / 1000).toFixed(1)}s`, 20, 60 + uiOffset);
        uiOffset += 25;
      }
      if (playerRef.current.invincibleTimer > 0) {
        ctx.fillStyle = '#FFCC00';
        ctx.fillText(`INVINCIBLE ${(playerRef.current.invincibleTimer / 1000).toFixed(1)}s`, 20, 60 + uiOffset);
      }
    };

    gameLoopRef.current = requestAnimationFrame(update);

    return () => {
      isTerminated = true;
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, []); // Empty dependency array fixed!


  return (
    <div className="relative border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="block"
      />
    </div>
  );
};
