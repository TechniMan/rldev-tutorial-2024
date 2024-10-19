import { Colours } from './colours'

export interface TileGraphic {
  char: string
  fg: string
  bg: string
}
export const INVISIBLE: TileGraphic = {
  char: ' ',
  fg: Colours.Black,
  bg: Colours.Black
}

export interface Tile {
  walkable: boolean
  transparent: boolean
  visible: boolean
  seen: boolean
  dark: TileGraphic
  light: TileGraphic
}

export const FLOOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  visible: false,
  seen: false,
  dark: {
    char: ' ',
    fg: Colours.Grey,
    bg: Colours.Black
  },
  light: {
    char: '.',
    fg: Colours.Goldenrod,
    bg: Colours.Black
  }
}

export const WALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  visible: false,
  seen: false,
  dark: {
    char: '#',
    fg: Colours.Grey,
    bg: Colours.Black
  },
  light: {
    char: '#',
    fg: Colours.Goldenrod, //'white'
    bg: Colours.Black
  }
}

export const STAIRS_DOWN_TILE: Tile = {
  walkable: true,
  transparent: true,
  visible: false,
  seen: false,
  dark: {
    char: '>',
    fg: Colours.Grey,
    bg: Colours.Black
  },
  light: {
    char: '>',
    fg: Colours.Descend,
    bg: Colours.Black
  }
}
