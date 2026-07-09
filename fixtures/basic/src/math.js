/**
 * Adds two numbers.
 *
 * @function add
 * @param {number} left Left operand.
 * @param {number} right Right operand.
 * @returns {number} Sum of both operands.
 * @hiaKey math.add
 * @hiaPath api.math.add
 */
export function add(left, right) {
  return left + right;
}

/**
 * Calculator facade.
 *
 * @class
 */
export class Calculator {
  /**
   * Adds two numbers through the facade.
   *
   * @param {number} left Left operand.
   * @param {number} right Right operand.
   * @returns {number} Sum of both operands.
   */
  add(left, right) {
    return add(left, right);
  }
}
