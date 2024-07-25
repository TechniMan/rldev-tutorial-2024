import type { GameMap } from './game-map'
import type { BaseAI } from './components'

import { HostileEnemy, Fighter } from './components'

export enum RenderOrder {
  Corpse,
  Item,
  Actor
}

export class Entity {
  constructor(
    public x: number,
    public y: number,
    public char: string,
    public fg: string = '#fff',
    public bg: string = '#000',
    public name: string = '<Unnamed>',
    public blocksMovement: boolean = false,
    public renderOrder: RenderOrder = RenderOrder.Corpse,
    public parent: GameMap | null = null
  ) {
    // if owned by a gamemap, add self to gamemap
    if (this.parent) {
      this.parent.entities.push(this)
    }
  }

  public get gameMap(): GameMap | null {
    return this.parent
  }

  move(dx: number, dy: number) {
    this.x += dx
    this.y += dy
  }
}

export class Actor extends Entity {
  constructor(
    public x: number,
    public y: number,
    public char: string,
    public fg: string = '#fff',
    public bg: string = '#000',
    public name: string = '<Unnamed',
    public ai: BaseAI | null,
    public fighter: Fighter,
    public parent: GameMap | null = null
  ) {
    super(x, y, char, fg, bg, name, true, RenderOrder.Actor, parent)
    this.fighter.parent = this
  }

  public get isAlive(): boolean {
    // (has an ai OR is the player) AND has hp
    return !!this.ai || window.engine.player === this // && this.fighter?.hp > 0
  }
}

export function spawnPlayer(
  x: number,
  y: number,
  gameMap: GameMap | null = null
): Actor {
  return new Actor(
    x,
    y,
    '@',
    '#fff',
    '#000',
    'Player',
    null,
    new Fighter(30, 2, 5),
    gameMap
  )
}

export function spawnOrc(gameMap: GameMap, x: number, y: number): Actor {
  return new Actor(
    x,
    y,
    'o',
    '#484',
    '#000',
    'Orc',
    new HostileEnemy(),
    new Fighter(10, 0, 3),
    gameMap
  )
}

export function spawnTroll(gameMap: GameMap, x: number, y: number): Actor {
  return new Actor(
    x,
    y,
    'T',
    '#080',
    '#000',
    'Troll',
    new HostileEnemy(),
    new Fighter(16, 1, 4),
    gameMap
  )
}
