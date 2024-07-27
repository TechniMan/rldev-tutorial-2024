// const white = '#fff'
const grey = '#888'
const black = '#000'
const goldenrod = '#fc4'

export interface TileGraphic {
  char: string
  fg: string
  bg: string
}
export const INVISIBLE: TileGraphic = {
  char: ' ',
  fg: black,
  bg: black
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
    fg: grey,
    bg: black
  },
  light: {
    char: '.',
    fg: goldenrod,
    bg: black
  }
}

export const WALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  visible: false,
  seen: false,
  dark: {
    char: '#',
    fg: grey,
    bg: black
  },
  light: {
    char: '#',
    fg: goldenrod, //'white'
    bg: black
  }
}
