const { traverseHtml } = require('providence-analytics/src/program/utils/traverse-html.js');
const parse5 = require('parse5');

const PLACEHOLDER = '{{}}';

/**
 * @param {BabelAstPath} taggedTemplateExpressionPath
 * @param {Map} tagMap ScopedElements info or derived from customElements.define file
 */
function createEnrichedTemplateLiteral(taggedTemplateExpressionPath, tagMap) {
  const { quasis, expressions } = taggedTemplateExpressionPath.node.quasi;
  const stitchedTpl = quasis.map(templateEl => templateEl.value.raw).join(PLACEHOLDER);
  const p5Ast = parse5.parse(stitchedTpl);

  const attributeExpressions = expressions
    .map((expression, index) => {
      const precedingQuasi = quasis[index];
      // Since parse5 lowercases attrs, we need to get back these nuances for props
      const attrMatch = precedingQuasi.value.raw.match(/ (.*)=("|')?$/);
      if (attrMatch) {
        return {
          attrName: attrMatch[1],
          expression,
        };
      }
      return undefined;
    })
    .filter(_ => _);

  // Add expressions and tagNames to attributes
  function enrichChild(child, exprIndex = 0) {
    if (child.tagName && tagMap) {
      // eslint-disable-next-line no-param-reassign
      child.tagMeta = tagMap.get(child.tagName); // will be { ctorIdentifier: 'MyComp', ctorRootFile: './src/MyComp.js'}
    }

    (child.attrs || []).forEach(attrObj => {
      if (attrObj.value === PLACEHOLDER) {
        // eslint-disable-next-line no-param-reassign
        attrObj.expression = attributeExpressions[exprIndex].expression;
        // Override attr name for expressions: '.iconid' => '.iconId'
        // eslint-disable-next-line no-param-reassign
        attrObj.name = attributeExpressions[exprIndex].attrName;
        // eslint-disable-next-line no-param-reassign
        exprIndex += 1;
      }
      const typeMap = { '?': 'boolean', '.': 'property', '@': 'event' };
      Object.entries(typeMap).forEach(([symbol, type]) => {
        if (attrObj.name.startsWith(symbol)) {
          // eslint-disable-next-line no-param-reassign
          attrObj.type = type;
        }
      });
    });
    if (child.childNodes) {
      child.childNodes.forEach(nextLvlChild => {
        enrichChild(nextLvlChild, exprIndex);
      });
    }
  }

  traverseHtml(p5Ast, {
    body(p5Path) {
      p5Path.node.childNodes.forEach(enrichChild);
    },
  });

  return {
    taggedTemplateExpressionPath,
    enrichedP5Ast: p5Ast,
  };
}

module.exports = { createEnrichedTemplateLiteral };
