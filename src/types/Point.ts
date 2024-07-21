export class Point {
  static fromArray(array: [number, number]): Point {
    return new Point(array[0], array[1])
  }

  constructor(public x: number, public y: number) {}
}
