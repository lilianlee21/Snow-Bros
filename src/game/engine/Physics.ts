import { Rect, Vector2D } from '../types';
import { TILE_SIZE } from '../constants';

export function checkCollision(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

export function resolveLevelCollision(
  pos: Vector2D,
  vel: Vector2D,
  size: Vector2D,
  level: number[][]
): { pos: Vector2D; vel: Vector2D; onGround: boolean } {
  let newX = pos.x + vel.x;
  let newY = pos.y + vel.y;
  let onGround = false;

  // Horizontal collisions
  const leftTile = Math.floor(newX / TILE_SIZE);
  const rightTile = Math.floor((newX + size.x - 1) / TILE_SIZE);
  const topTile = Math.floor(pos.y / TILE_SIZE);
  const bottomTile = Math.floor((pos.y + size.y - 1) / TILE_SIZE);

  if (vel.x > 0) {
    for (let row = topTile; row <= bottomTile; row++) {
      if (level[row]?.[rightTile] === 1) {
        newX = rightTile * TILE_SIZE - size.x;
        vel.x = 0;
        break;
      }
    }
  } else if (vel.x < 0) {
    for (let row = topTile; row <= bottomTile; row++) {
      if (level[row]?.[leftTile] === 1) {
        newX = (leftTile + 1) * TILE_SIZE;
        vel.x = 0;
        break;
      }
    }
  }

  // Vertical collisions
  const finalLeftTile = Math.floor(newX / TILE_SIZE);
  const finalRightTile = Math.floor((newX + size.x - 1) / TILE_SIZE);
  const finalTopTile = Math.floor(newY / TILE_SIZE);
  const finalBottomTile = Math.floor((newY + size.y - 1) / TILE_SIZE);

  if (vel.y > 0) {
    for (let col = finalLeftTile; col <= finalRightTile; col++) {
      if (level[finalBottomTile]?.[col] === 1) {
        newY = finalBottomTile * TILE_SIZE - size.y;
        vel.y = 0;
        onGround = true;
        break;
      }
    }
  } else if (vel.y < 0) {
    for (let col = finalLeftTile; col <= finalRightTile; col++) {
      if (level[finalTopTile]?.[col] === 1) {
        newY = (finalTopTile + 1) * TILE_SIZE;
        vel.y = 0;
        break;
      }
    }
  }

  return { pos: { x: newX, y: newY }, vel, onGround };
}
