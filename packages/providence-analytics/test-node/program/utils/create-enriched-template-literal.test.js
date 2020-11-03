const { expect } = require('chai');
const babelParser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
const { traverseHtml } = require('../../../src/program/utils/traverse-html.js');
const {
  createEnrichedTemplateLiteral,
} = require('../../../src/program/utils/create-enriched-template-literal.js');

function getTplExpression(code) {
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['importMeta', 'dynamicImport', 'classProperties'],
  });
  let tplExpressionPath;
  traverse(ast, {
    TaggedTemplateExpression(path) {
      tplExpressionPath = path;
      path.stop();
    },
  });
  return tplExpressionPath;
}

describe('createEnrichedTemplateLiteral', () => {
  describe('Default output', () => {
    it('provides a parse5 ast (enriched)', async () => {});
    // it('provides a write method', async () => {});
    it('stores the Babel TemplateLiteralExpression', async () => {});
  });

  describe('Attribute meta', () => {
    it('connects babel expression to parse5 attrs', async () => {
      const tpl =
        // eslint-disable-next-line no-template-curly-in-string
        'html`<el-x .prop="${0}" test="c"></el-x>${1}<el-y .prop="${2}"></el-y>`';
      const tplExpressionPath = getTplExpression(tpl);
      const { enrichedP5Ast } = createEnrichedTemplateLiteral(tplExpressionPath);
      let foundAttrX;
      let foundAttrY;
      traverseHtml(enrichedP5Ast, {
        // eslint-disable-next-line object-shorthand
        'el-x'(p5Path) {
          foundAttrX = p5Path.node.attrs.find(a => a.name === '.prop');
        },
        // eslint-disable-next-line object-shorthand
        'el-y'(p5Path) {
          foundAttrY = p5Path.node.attrs.find(a => a.name === '.prop');
        },
      });
      expect(foundAttrX.expression).to.equal(tplExpressionPath.node.quasis.expressions[0]);
      expect(foundAttrY.expression).to.equal(tplExpressionPath.node.quasis.expressions[2]);
    });

    describe('Types', () => {
      it('adds type (property|attribute|boolean|event) meta info to attributes', async () => {
        const templateLiteral = getTplExpression(
          // eslint-disable-next-line no-template-curly-in-string
          'html`<el-x .prop="${identifier}" attr="a" ?bool="${identifier}" @event="${identifier}"></el-x>`',
        );
        const { enrichedP5Ast } = createEnrichedTemplateLiteral(templateLiteral);
        // eslint-disable-next-line one-var
        let foundProp, foundAttr, foundBool, foundEvent;
        traverseHtml(enrichedP5Ast, {
          // eslint-disable-next-line object-shorthand
          'el-x'(p5Path) {
            foundProp = p5Path.node.attrs.find(a => a.name === '.prop');
            foundAttr = p5Path.node.attrs.find(a => a.name === 'attr');
            foundBool = p5Path.node.attrs.find(a => a.name === '?bool');
            foundEvent = p5Path.node.attrs.find(a => a.name === '@event');
          },
        });
        expect(foundProp.type).to.equal('property');
        expect(foundAttr.type).to.equal('attribute');
        expect(foundBool.type).to.equal('boolean');
        expect(foundEvent.type).to.equal('event');
      });
    });
  });

  describe('Tag meta', () => {
    it('adds "tagMeta" object when tagMap provided', async () => {
      const templateLiteral = getTplExpression('html`<el-x></el-x><el-y></el-y>`');
      const tagMap = {
        'el-x': {
          classIdentifier: 'LionX',
          rootFile: './src/MyComp.js',
        },
      };
      const { enrichedP5Ast } = createEnrichedTemplateLiteral(templateLiteral, tagMap);
      let foundTagMetaX;
      let foundTagMetaY;
      traverseHtml(enrichedP5Ast, {
        // eslint-disable-next-line object-shorthand
        'el-x'(p5Path) {
          foundTagMetaX = p5Path.node.tagMeta;
        },
        // eslint-disable-next-line object-shorthand
        'el-y'(p5Path) {
          foundTagMetaY = p5Path.node.tagMeta;
        },
      });
      expect(foundTagMetaX).to.eql({
        classIdentifier: 'ElX',
        rootFile: './src/ElX.js',
        // FindClassesAnalyzerResult?
      });
      expect(foundTagMetaY).to.be.undefined;
    });
  });

  describe('Synchronization with TemplateLiteralExpression', () => {
    it('updates html (quasis) inside TemplateLiteralExpression', async () => {});
    it('updates expressions inside TemplateLiteralExpression', async () => {});
  });
});
