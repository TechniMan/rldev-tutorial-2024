const white = '#fff'
const black = '#000'

export interface TileGraphic {
  char: string
  fg: string
  bg: string
}

export interface Tile {
  walkable: boolean
  transparent: boolean
  dark: TileGraphic
}

export const FLOOR_TILE: Tile = {
  walkable: true,
  transparent: true,
  dark: {
    char: ' ',
    fg: white,
    bg: black
  }
}

export const WALL_TILE: Tile = {
  walkable: false,
  transparent: false,
  dark: {
    char: '#',
    fg: white,
    bg: black
  }
}
