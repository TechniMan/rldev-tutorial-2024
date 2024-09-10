import type { BaseAI, BaseComponent } from './components'

import {
  HostileEnemy,
  Fighter,
  Consumable,
  HealingConsumable,
  Inventory
} from './components'
import {
  ConfusionConsumable,
  FireballDamageConsumable,
  LightningConsumable
} from './components/Consumable'
import { GameMap } from './gameMap'
import { Point } from './types/Point'

export enum RenderOrder {
  Corpse,
  Item,
  Actor
}

export class Entity {
  constructor(
    public position: Point,
    public char: string,
    public fg: string = '#fff',
    public bg: string = '#000',
    public name: string = '<Unnamed Entity>',
    public blocksMovement: boolean = false,
    public renderOrder: RenderOrder = RenderOrder.Corpse,
    public parent: GameMap | BaseComponent | null = null
  ) {
    // if owned by a gamemap, add self to gamemap
    if (this.parent && this.parent instanceof GameMap) {
      this.parent.entities.push(this)
    }
  }

  public get gameMap(): GameMap | null {
    return this.parent instanceof GameMap ? this.parent : null
  }

  move(dx: number, dy: number) {
    this.position.x += dx
    this.position.y += dy
  }

  place(x: number, y: number, gameMap: GameMap | undefined) {
    this.position.x = x
    this.position.y = y
    if (gameMap) {
      if (this.parent && this.parent === gameMap) {
        gameMap.removeEntity(this)
      }
      this.parent = gameMap
      gameMap.entities.push(this)
    }
  }
}

export class Actor extends Entity {
  constructor(
    public position: Point,
    public char: string,
    public fg: string = '#fff',
    public bg: string = '#000',
    public name: string = '<Unnamed Actor>',
    public ai: BaseAI | null,
    public fighter: Fighter,
    public inventory: Inventory,
    public parent: GameMap | null = null
  ) {
    super(position, char, fg, bg, name, true, RenderOrder.Actor, parent)
    this.fighter.parent = this
    this.inventory.parent = this
  }

  public get isAlive(): boolean {
    // (has an ai OR is the player) AND has hp
    return !!this.ai || window.engine.player === this // && this.fighter?.hp > 0
  }
}

export class Item extends Entity {
  constructor(
    public position: Point,
    public char: string = '?',
    public fg: string = '#fff',
    public bg: string = '#000',
    public name: string = '<Unnamed Item>',
    public consumable: Consumable,
    public parent: GameMap | BaseComponent | null = null
  ) {
    super(position, char, fg, bg, name, false, RenderOrder.Item, parent)
    this.consumable.parent = this
  }
}

export function spawnPlayer(
  x: number,
  y: number,
  gameMap: GameMap | null = null
): Actor {
  return new Actor(
    new Point(x, y),
    '@',
    '#fff',
    '#000',
    'Player',
    null,
    new Fighter(30, 2, 5),
    new Inventory(26),
    gameMap
  )
}

export function spawnOrc(gameMap: GameMap, x: number, y: number): Actor {
  return new Actor(
    new Point(x, y),
    'o',
    '#484',
    '#000',
    'Orc',
    new HostileEnemy(),
    new Fighter(10, 0, 3),
    new Inventory(0),
    gameMap
  )
}

export function spawnTroll(gameMap: GameMap, x: number, y: number): Actor {
  return new Actor(
    new Point(x, y),
    'T',
    '#080',
    '#000',
    'Troll',
    new HostileEnemy(),
    new Fighter(16, 1, 4),
    new Inventory(0),
    gameMap
  )
}

export function spawnHealthPotion(
  gameMap: GameMap,
  x: number,
  y: number
): Entity {
  return new Item(
    new Point(x, y),
    '!',
    '#70f',
    '#000',
    'Health Potion',
    new HealingConsumable(4),
    gameMap
  )
}

export function spawnLightningScroll(
  gameMap: GameMap,
  x: number,
  y: number
): Entity {
  return new Item(
    new Point(x, y),
    '~',
    '#ff0',
    '#000',
    'Lightning Scroll',
    new LightningConsumable(20, 5),
    gameMap
  )
}

export function spawnConfusionScroll(gameMap: GameMap, x: number, y: number) {
  return new Item(
    new Point(x, y),
    '~',
    '#c4f',
    '#000',
    'Confusion Scroll',
    new ConfusionConsumable(10),
    gameMap
  )
}

export function spawnFireballScroll(gameMap: GameMap, x: number, y: number) {
  return new Item(
    new Point(x, y),
    '~',
    '#f00',
    '#000',
    'Fireball Scroll',
    new FireballDamageConsumable(12, 3),
    gameMap
  )
}
