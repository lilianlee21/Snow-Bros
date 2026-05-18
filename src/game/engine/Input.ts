export class InputManager {
  private keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  // Helper for one-time presses (would need more state, but this works for basic)
  isJumpPressed(): boolean {
    return this.isDown('Space') || this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  isShootPressed(): boolean {
    return this.isDown('KeyJ') || this.isDown('KeyZ') || this.isDown('KeyX') || this.isDown('Space');
  }

  isPunchPressed(): boolean {
    return this.isDown('KeyC');
  }

  isSkipPressed(): boolean {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  getHorizontal(): number {
    let h = 0;
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) h -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) h += 1;
    return h;
  }
}

export const input = new InputManager();
