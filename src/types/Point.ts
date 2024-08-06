/**
 * Class to represent an { x, y } point in 2D space. Also has some helpful maths functions.
 */
export class Point {
  static fromArray(array: [number, number]): Point {
    return new Point(array[0], array[1])
  }

  constructor(public x: number, public y: number) {}

  /**
   * Returns the result of adding two points
   */
  static add(a: Point, b: Point): Point {
    return new Point(a.x + b.x, a.y + b.y)
  }

  /**
   * Returns a new copy of the Point
   */
  clone() {
    return new Point(this.x, this.y)
  }

  /**
   * Calculate the straight-line diagonal distance between this and the other point.
   */
  distanceTo(other: Point): number {
    // return sqrt(a^2 + b^2) for c, the diagonal distance, between two points
    return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2)
  }
}
