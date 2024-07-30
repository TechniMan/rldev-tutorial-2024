export class Point {
  static fromArray(array: [number, number]): Point {
    return new Point(array[0], array[1])
  }

  constructor(public x: number, public y: number) {}

  distanceTo(other: Point): number {
    // return sqrt(a^2 + b^2) for c, the diagonal distance
    return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2)
  }
}
