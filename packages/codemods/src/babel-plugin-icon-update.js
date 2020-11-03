const t = require('@babel/types');
const { traverseHtml } = require('providence-analytics/src/program/utils/traverse-html');
const { createEnrichedTemplateLiteral } = require('./utils/createEnrichedTemplateLiteral.js');
const { findAttrMatch } = require('./utils/findAttrMatch.js');

const PLACEHOLDER = '{{}}';

/**
 * @param {*} attrObj
 * @param {object} opts Babel plugin options
 */
function replaceValue(attrObj, opts) {
  let value;
  let isExpression = false;
  if (attrObj.value === PLACEHOLDER && t.isLiteral(attrObj.expression)) {
    value = attrObj.expression.value;
    isExpression = true;
  } else {
    value = attrObj.value;
  }

  const mapped = opts.oldToNewMap[value];
  if (mapped) {
    if (isExpression) {
      // eslint-disable-next-line no-param-reassign
      attrObj.value = `\${'${mapped}'}`;
    } else {
      // eslint-disable-next-line no-param-reassign
      attrObj.value = mapped;
    }
  }
}

// Note that attrs are attributes according to parse5, not according to lit-elemnent
const attrMatchConfigs = [
  {
    attrName: 'icon-id',
    onAttrMatch: replaceValue,
  },
  {
    attrName: '.iconId',
    onAttrMatch: replaceValue,
  },
];

function createTaggedTemplateLiteralFromP5Ast(enrichedP5Ast) {
  function handleLevel(childNodes) {
    let result = '';
    const nonClosableTags = ['input'];
    childNodes.forEach(c => {
      if (c.nodeName.startsWith('#')) {
        result += c.value;
        return;
      }
      result += `<${c.tagName}`;
      (c.attrs || []).forEach(a => {
        // TODO: for now, no expressions supported
        result += ` ${a.name}="${a.value}"`;
      });
      result += '>';
      if (c.childNodes) {
        result += handleLevel(c.childNodes);
      }
      if (!nonClosableTags.includes(c.tagName)) {
        result += `</${c.tagName}>`;
      }
    });
    return result;
  }

  let result = 'html`';
  traverseHtml(enrichedP5Ast, {
    body(p5Path) {
      const { childNodes } = p5Path.node;
      result += handleLevel(childNodes);
    },
  });
  result += '`';

  return result;
}

module.exports = () => {
  return {
    name: 'icon-update',
    visitor: {
      TaggedTemplateExpression(path, state) {
        if (path.node.tag.name !== 'html') {
          return;
        }

        // Enriches a parse5 html ast by adding meta info about attr types
        const enrichedTemplateLiteral = createEnrichedTemplateLiteral(path);

        // This manipulates enrichedTemplateLiteral
        findAttrMatch(enrichedTemplateLiteral, {
          attrMatchConfigs,
          iconTagName: 'lion-icon',
          ...state.opts,
        });

        // Now write back result to TaggedTemplateExpression

        const result = createTaggedTemplateLiteralFromP5Ast(enrichedTemplateLiteral.enrichedP5Ast);

        path.replaceWithSourceString(result);
        path.stop();
      },
    },
  };
};
