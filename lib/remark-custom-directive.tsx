// This plugin is an example to turn `:::custom` into divs, passing arbitrary
// attributes.
/** @type {import('unified').Plugin<[], import('mdast').Root>} */

import { visit } from "unist-util-visit";
import { h } from "hastscript/html.js";

export const remarkCustomDirective = (noteTag: any) => {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === "textDirective" ||
        node.type === "leafDirective" ||
        node.type === "containerDirective"
      ) {
        if (
          node.name !== "small" ||
          node.name !== "ins" ||
          node.name !== "delete" ||
          node.name !== "mark" ||
          node.name !== "abbr" ||
          node.name !== "custom"
        )
          return;

        const data = node.data || (node.data = {});
        const tagName = node.type === "textDirective" ? "span" : "div";

        data.hName = tagName;
        data.hProperties = h(tagName, node.attributes).properties;
      }
    });
  };
};
