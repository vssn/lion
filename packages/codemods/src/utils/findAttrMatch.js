const { traverseHtml } = require('providence-analytics/src/program/utils/traverse-html.js');

/**
 * @param {object} enrichedTemplateLiteral
 * @param {object} opts
 */
function findAttrMatch(enrichedTemplateLiteral, opts) {
  const { attrMatchConfigs, iconTagName } = opts;

  function checkLevel(childNodes) {
    childNodes.forEach(childNode => {
      attrMatchConfigs.forEach(attrMatchConfig => {
        if (childNode.tagName === iconTagName) {
          childNode.attrs.forEach(attrObj => {
            if (attrObj.name === attrMatchConfig.attrName) {
              attrMatchConfig.onAttrMatch(attrObj, opts);
            }
          });
        }
      });
      if (childNode.childNodes) {
        checkLevel(childNode.childNodes);
      }
    });
  }

  traverseHtml(enrichedTemplateLiteral.enrichedP5Ast, {
    body(p5Path) {
      checkLevel(p5Path.node.childNodes);
    },
  });
}

module.exports = { findAttrMatch };
