const parse5 = require('parse5');
const { traverseHtml } = require('./traverse-html.js');

const PLACEHOLDER = '{{}}';

/**
 * @param {BabelAstPath} taggedTemplateExpressionPath
 * @param {Map} tagMap ScopedElements info or derived from customElements.define file
 */
function createEnrichedTemplateLiteral(taggedTemplateExpressionPath, tagMap) {
  const { quasis, expressions } = taggedTemplateExpressionPath.node.quasi;
  const stitchedTpl = quasis.map(templateEl => templateEl.value.raw).join(PLACEHOLDER);
  const p5Ast = parse5.parse(stitchedTpl);

  const attributeExpressions = expressions.filter(e => /=("|')?$/.test(e.value));

  // Add expressions and tagNames to attributes
  function enrichChild(child, exprIndex = 0) {
    if (child.tagName && tagMap) {
      // eslint-disable-next-line no-param-reassign
      child.tagMeta = tagMap.get(child.tagName); // will be { ctorIdentifier: 'MyComp', ctorRootFile: './src/MyComp.js'}
    }
    child.attrs.forEach(attrObj => {
      if (attrObj.value === PLACEHOLDER) {
        // eslint-disable-next-line no-param-reassign
        attrObj.expression = attributeExpressions[exprIndex];
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
