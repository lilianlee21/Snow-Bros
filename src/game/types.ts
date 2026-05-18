export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  BOSS = 'BOSS',
  SNOWBALL = 'SNOWBALL',
  PROJECTILE = 'PROJECTILE',
  FRUIT = 'FRUIT',
}

export enum FruitType {
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  RED = 'RED',
  CAKE = 'CAKE',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum EnemyState {
  NORMAL = 'NORMAL',
  STUNNED = 'STUNNED', // Layers of snow
  ROLLING = 'ROLLING', // Full snowball
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2D;
  vel: Vector2D;
  size: Vector2D;
  facing: number; // 1 for right, -1 for left
  onGround: boolean;
  update: (dt: number, level: number[][]) => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
}
