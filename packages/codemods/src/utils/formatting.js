const prettier = require('prettier');
const { default: generate } = require('@babel/generator');

/** Generic Utils */

/**
 * Formats the generated codemod output via Prettier
 * @param {string} code javascript file
 * @returns {string} formatted javascript file
 */
function formatJs(code) {
  return prettier.format(code, { parser: 'babel' });
}

/**
 * Formats the generated codemod html output via Prettier
 * @param {string} code html file
 * @returns {string} formatted html file
 */
function formatHtml(code) {
  return prettier.format(code, { parser: 'html' });
}

function generateJs(astNode) {
  return generate(astNode).code;
}

/**
 * - From:
 * <div>
 *
 *   <input>
 *
 * </div>
 *
 * - To:
 * <div>
 *   <input>
 * </div>
 *
 * @param {string} code
 */
function trimLines(code) {
  return code
    .join('\n')
    .split('\n')
    .filter(_ => _.trim()) // filter out empty lines
    .join('\n');
}

module.exports = {
  formatJs,
  formatHtml,
  generateJs,
  trimLines,
};
