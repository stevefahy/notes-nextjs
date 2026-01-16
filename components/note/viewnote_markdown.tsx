/* eslint-disable react/no-children-prop */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { SpecialComponents, Components } from "react-markdown/lib/ast-to-react";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import atomDark from "react-syntax-highlighter/dist/cjs/styles/prism/atom-dark";
import js from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import md from "react-syntax-highlighter/dist/cjs/languages/prism/markdown";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import ts from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import classesShared from "./editviewnote_shared.module.css";
import classes from "./viewnote_markdown.module.css";
import emoji from "remark-emoji";
import smartypants from "remark-smartypants";
import supersub from "remark-supersub";
import rehypeSlug from "rehype-slug";
import { SourcePosition, ViewNoteMarkdownProps } from "../../types";
import remarkDirective from "remark-directive";
import remarkDirectiveRehype from "remark-directive-rehype";
import { remarkCustomDirective } from "../../lib/remark-custom-directive";
import useWindowDimensions from "../../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";

SyntaxHighlighter.registerLanguage("js", js);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("markdown", md);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("ts", ts);

const ViewNoteMarkdown = (props: ViewNoteMarkdownProps) => {
  const { data, content } = matter(props.viewText);

  const disableLinks = props.disableLinks;

  const splitscreen = props.splitScreen;

  const [contextView, setContextView] = useState("");

  const [isSplitScreen, setIsSplitScreen] = useState(splitscreen);

  const { width, height, viewnote_width } = useWindowDimensions();

  const [windowDimensions, setWindowDimensions] = useState({
    width,
    height,
    viewnote_width,
  });

  useEffect(() => {
    setWindowDimensions({ width, height, viewnote_width });
  }, [width, height, viewnote_width]);

  useEffect(() => {
    setIsSplitScreen((prev) => splitscreen);
  }, [splitscreen]);

  useEffect(() => {
    if (content !== contextView) {
      setContextView((prev) => content);
      return () => {
        // component unmount
      };
    }
  }, [content, contextView]);

  const onChangeCheckbox = (
    sourcePosition: SourcePosition,
    checked: boolean,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let newcontent = contextView;
    const offset = sourcePosition.start.offset!;
    const endset = sourcePosition.end.offset!;
    const prefix = newcontent.slice(0, offset);
    const endfix = newcontent.slice(offset, endset);
    const remainder = newcontent.slice(endset);

    // Find [x] or [ ]
    let regex = /\[\s*(x|\s)\s*\]/;

    const result = endfix.replace(regex, (match) => {
      if (!checked) {
        return "[x]";
      } else {
        return "[ ]";
      }
    });

    const new_content = prefix + result + remainder;

    // Need to update contextView
    props.updatedViewText(new_content);
  };

  // Custom List item for checkboxes,
  // so that they can be enabled in view mode and interacted with
  const ListWrapper: SpecialComponents["li"] = ({
    checked,
    index,
    ordered,
    node,
    sourcePosition,
    siblingCount,
    ...props
  }) => {
    if (checked == null) {
      return React.createElement("li", props);
    }
    return React.createElement(
      "li",
      props,
      React.Children.map(props.children, (child) => {
        if (
          React.isValidElement(child) &&
          child.type === "input" &&
          (child.props as { type?: string }).type === "checkbox"
        ) {
          // Manipulate input tag by React.cloneElement() or return customized checkbox.
          // Below code is for material-ui.
          return (
            <input
              type="checkbox"
              checked={(child.props as { checked?: boolean }).checked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                if (sourcePosition) {
                  onChangeCheckbox(sourcePosition!, checked, e);
                }
              }}
            />
          );
        }
        return child;
      })
    );
  };

  const TableWrapper = (props: any) => {
    return <table className="table table-striped">{props.children}</table>;
  };

  const LinkRenderer = (props: any) => {
    let linkTarget = "_blank";
    if (disableLinks) {
      // Remove links in viewnotethumb.
      // They should not be avaialable here and cause a nested <a> error.
      return <span title={props.title}>{props.children}</span>;
    } else {
      if (props.href.charAt(0) === "#") {
        linkTarget = "_self";
      }
      // Open links in a new tab
      return (
        <a
          title={props.title}
          href={props.href}
          id={props.id}
          className={props.class}
          target={linkTarget}
          rel="noreferrer"
        >
          {props.children}
        </a>
      );
    }
  };

  const ImageRenderer = (imageTag: any) => {
    const { node } = imageTag;
    let width: number = 1;
    let height: number = 1;
    let alt: string = "";

    // Prevent a Next image src error while editing
    // src  must start with a single leading slash "/"
    // or be an absolute URL ("http://"" or "https://")
    const regex = new RegExp(/^\/[^\/]|https?/);
    if (
      node.properties.src === undefined ||
      regex.test(node.properties.src) === false
    ) {
      node.properties.src = "/images/image-not-found-icon.svg";
    }

    if (node.properties.alt) {
      const substrings = node.properties.alt?.split("{{");
      alt = substrings[0].trim();

      const regex_w = /w:\d.*\b/;
      const regex_h = /h:\d.*\b/;

      const default_w = 100;
      const default_h = 100;

      let result_w;
      let result_h;

      if (substrings[1]) {
        result_w = substrings[1].match(regex_w);
        result_h = substrings[1].match(regex_h);
      }
      if (
        substrings[1] &&
        substrings[1].includes("}}") &&
        result_w !== null &&
        result_h !== null
      ) {
        width = substrings[1]
          ? substrings[1].match(/(?<=w:\s?)\d+/g)[0]
          : default_w;
        height = substrings[1]
          ? substrings[1].match(/(?<=h:\s?)\d+/g)[0]
          : default_h;
      } else {
        width = default_w;
        height = default_h;
      }
    }

    // Set the width and height of the span containing
    // the image so that the images do not jump during editing
    let styleObject;
    let original_w = width;
    let original_h = height;
    let temp_width = windowDimensions.width;
    if (isSplitScreen) {
      temp_width = windowDimensions.width / 2;
    }
    if (
      windowDimensions &&
      windowDimensions.viewnote_width &&
      width > temp_width - APPLICATION_CONSTANTS.VIEWNOTE_PADDING // takes account of padding
    ) {
      let viewnote_width = windowDimensions.viewnote_width;
      let window_width = windowDimensions.width;
      let diff = window_width - viewnote_width;

      width = temp_width - diff;

      let width_percent_change = ((width - original_w) / original_w) * -1;
      let new_height_reduce = original_h * width_percent_change;
      height = original_h - new_height_reduce;

      width = Math.round(width);
      height = Math.round(height);

      styleObject = { width: `${width}px`, height: `${height}px` };
    } else {
      styleObject = { width: `${width}px`, height: `${height}px` };
    }

    return (
      <span className={classesShared.image} style={styleObject}>
        <Image
          src={`${imageTag.node.properties.src}`}
          alt={alt}
          title={imageTag.node.properties.title}
          width={width}
          height={height}
          style={{ width: "100%", height: "100%" }}
          onError={() => {
            return <p>Error</p>;
          }}
        />
      </span>
    );
  };

  function cleanChildren(children: any) {
    for (var i = 0; i < children.length; i++) {
      children[i] = children[i].trim();
    }
    return children;
  }

  const replaceSpecialCharacters = (str: any) => {
    const specialChars = APPLICATION_CONSTANTS.SPECIAL_CHARACTERS;

    let charsOnly = specialChars.map((a) => a.char);
    let newstring = str;
    const hasSome = charsOnly.some((chars) => str.includes(chars));

    if (hasSome) {
      for (const i in specialChars) {
        newstring = newstring.replaceAll(
          specialChars[i].char,
          specialChars[i].display
        );
      }
      return newstring;
    }
    return str;
  };

  const checkSpecialChars = (str: any) => {
    for (const i in str) {
      if (typeof str[i] === "string") {
        str[i] = replaceSpecialCharacters(str[i]);
      }
    }
  };

  const Insert = (insTag: any) => {
    const { node, children } = insTag;

    let classes: string = "";
    let styleObj = null;

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }

    return (
      <ins className={classes} style={styleObj}>
        {children}
      </ins>
    );
  };

  const Delete = (delTag: any) => {
    const { node, children } = delTag;

    let classes: string = "delete_md ";
    let styleObj = null;

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes += node.properties.className.join(" ");
    }

    return (
      <del className={classes} style={styleObj}>
        {children}
      </del>
    );
  };

  const Unit = (unitTag: any) => {
    const { node, children } = unitTag;

    let classes: string = "";
    let styleObj = null;

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }

    return (
      <small className={classes} style={styleObj}>
        {children}
      </small>
    );
  };

  const Mark = (markTag: any) => {
    const { node, children } = markTag;

    let classes: string = "";
    let styleObj = null;

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }

    return (
      <mark className={classes} style={styleObj}>
        {children}
      </mark>
    );
  };

  const Abbr = (abbrTag: any) => {
    const { node, children } = abbrTag;
    let classes: string = "";
    let styleObj = null;
    let title: string = "";

    if (node.properties.title) {
      title = node.properties.title;
    }

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }

    return (
      <abbr title={title} className={classes} style={styleObj}>
        {children}
      </abbr>
    );
  };

  const Custom = (customTag: any) => {
    const { node, children } = customTag;

    let classes: string = "";
    let styleObj = null;

    if (node.properties && node.properties.style) {
      //Check that the JSON is parsable
      try {
        styleObj = JSON.parse(node.properties.style);
      } catch (error) { }
    }

    if (node.properties && node.properties.className) {
      classes = node.properties.className.join(" ");
    }

    return (
      <span className={classes} style={styleObj}>
        {children}
      </span>
    );
  };

  const customRenderers = {
    abbr: Abbr,

    custom: Custom,

    mark: Mark,

    unit: Unit,

    ins: Insert,

    delete: Delete,

    table: TableWrapper,

    li: ListWrapper,

    img: ImageRenderer,

    a: LinkRenderer,

    p(paragraph: any) {
      const { node, children } = paragraph;
      checkSpecialChars(children);
      return (
        <p className="line" data-line={children.length}>
          {paragraph.children}
        </p>
      );
    },

    code(code: any) {
      const { node, inline, className, children } = code;
      let language: string = "";
      if (className !== undefined) {
        language = className.split("-")[1]; // className is something like language-js => We need the "js" part here
      }
      return (
        <span className="highlightRoot">
          {inline ? (
            <span className="inlineCode">
              <code>{children}</code>
            </span>
          ) : (
            <span>
              <span className={classes.codebox}>
                <SyntaxHighlighter
                  language={language}
                  style={atomDark}
                  showLineNumbers={false}
                  startingLineNumber={1}
                  children={cleanChildren(children)}
                />
              </span>
              {language && (
                <span className={classes.codebox_language}>
                  <p>{language}</p>
                </span>
              )}
            </span>
          )}
        </span>
      );
    },

    section(section: any) {
      const { node, children } = section;
      let classes;
      if (node.properties && node.properties.className) {
        classes = node.properties.className.join(" ");
      }

      let data_attribute;
      if (node.properties && node.properties.dataFootnotes) {
        data_attribute = { "data-footnotes": "true" };
        let new_children = children;
        new_children.shift();
        return (
          <span className="footnotes_inner">
            <hr />
            <section className={classes} {...data_attribute}>
              {new_children}
            </section>
          </span>
        );
      }
      return <section className={classes}>{children}</section>;
    },
  };

  return (
    <ReactMarkdown
      children={contextView}
      sourcePos
      rawSourcePos
      rehypePlugins={[
        [rehypeSlug],
        [
          rehypeSanitize,
          {
            ...defaultSchema,
            tagNames: [
              ...(defaultSchema.tagNames || []),
              "small",
              "ins",
              "delete",
              "mark",
              "abbr",
              "custom",
              "section",
            ],
            attributes: {
              ...defaultSchema.attributes,
              code: [
                ...(defaultSchema.attributes?.code || []),
                // List of all allowed languages:
                [
                  "className",
                  "language-js",
                  "language-css",
                  "language-md",
                  "language-ts",
                  "language-html",
                  "language-bash",
                ],
              ],
              small: ["title", "style"],
              ins: ["className", "style"],
              delete: ["className", "style"],
              mark: ["className", "style"],
              section: ["className", "style", "data*"],
              custom: ["className", "style"],
              abbr: ["className", "style", "title"],
            },
          },
        ],
      ]}
      remarkPlugins={[
        [remarkGfm, { tablePipeAlign: true, singleTilde: false }],
        [remarkCustomDirective],
        [remarkDirective],
        [remarkDirectiveRehype],
        [emoji, { padSpaceAfter: true, emoticon: true }],
        [
          smartypants,
          {
            quotes: true,
            ellipses: true,
            backticks: true,
            dashes: true,
            openingQuotes: { single: "‘", double: "“" },
            closingQuotes: { single: "’", double: "”" },
          },
        ],
        [supersub],
      ]}
      components={customRenderers as unknown as Partial<Components>}
    />
  );
};

export default ViewNoteMarkdown;
