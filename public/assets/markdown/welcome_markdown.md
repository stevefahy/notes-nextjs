::: custom font-size: 55px;  color: #1B3D29; height: 45px; display: table-cell; vertical-align: bottom;
![Notes {{w:32,h:32}}](/assets/images/edit_green.png "Notes Logo")**Notes**
:::

Welcome to the **Notes** App. Notes can be created using text and/or [GitHub Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax "link to GitHub markdown").

The Notes can be edited using the `Edit` button below. To view the edited Markdown select the `View` button below.

Examples of the Markdown are shown below. To see the Markdown source for these examples select the `Edit` button.

Notebooks can also be created and edited. Notes can be moved to other Notebooks or deleted from a Notebook.

# Examples

# h1 Heading 8-)
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading

## Horizontal Rules
___
---
***

## Typographic replacements

The following characters within parentheses are replaced by symbols:

(&#8203;c)(&#8203;C)(&#8203;r)(&#8203;R)(&#8203;tm)(&#8203;TM)(&#8203;p)(&#8203;P)(&#8203;+-)

(c) (C) (r) (R) (tm) (TM) (p) (P) (+-)

test.. test... test..... test?..... test!....

!!!!!! ???? ,,  -- ---

"Smartypants, double quotes" and 'single quotes'

## Escape
To display a literal character that would otherwise be used to format text in a Markdown document, add a backslash `\` in front of the character, or the Zero Width Space HTML code `&#8203;`.

\# This is an escaped hashtag which prevents this line displaying as an Header.

## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~

## Blockquotes

> This is an example of a blockquote.

Blockquotes can also be nested:

> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.

## Lists

### Unordered

- Create a list by starting a line with `+`, `-`, or `*`
  - Sub-lists are made by indenting 2 spaces:
+ Marker character change forces new list start:
* Lorem ipsum dolor sit amet
* Consectetur adipiscing elit
  * Praesent ultrices purus in lorem blandit
  * Nullam elit lorem
    * Porttitor in libero vitae
    * Ornare viverra ligula
  * Integer vel mauris vel libero
  * Pretium vulputate et in turpis
* Pellentesque mauris est
* Luctus vitae tortor at

### Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa
   1. You can use sequential numbers...
   1. ...or nest numbers starting again as `1.`
      1. Another nested item
      1. Each nested ordered item starts at `1` again
   1. Third item
1. Fourth item in the nested ordered list.

Start numbering with offset:

57. foo
1. bar

## Check Boxes
- [x] First
- [x] Second. The text may extend over more than one line.
- [x] Third
- [ ] Fourth
- [x] Fifth

## Code

Inline `code`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code
    (use 4 spaces)

Block code "fences"

```
Sample text here...
```

Syntax highlighting

``` javascript
var foo = function (bar) {
  return bar++;
};
console.log(foo(5));
```

## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

## Links

[Link text.](http://www.google.com)

[Link with title.](http://www.google.com "Title text!")

Auto converted link https://www.google.com.

This is a reference, or anchor link to the header [Tables](#tables).


This is a link to the [Dojo Cat](#dojo-cat) header.

## Images

![Minion {{w:256,h:256}}](https://octodex.github.com/images/minion.png)
![Stormtroopocat ](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

Like links, Images also have a footnote style syntax:
```markdown
![Alt text][image ref number][link ref number]
[1]: #links
[2]: https://octodex.github.com/images/dojocat.jpg
```
#### Dojo Cat
This image links to a previous location in the document, the Links header:

[![DojoCat][2]][1]

[//]: # (The link we want our image link to point to) 
[1]: #links
[//]: # (The image url we want to use for our img tag source) 
[2]: https://octodex.github.com/images/dojocat.jpg "The Dojo Cat"

Images are responsive to the screen size.
![This is the alt text {{w:896,h:896}}](https://octodex.github.com/images/mummytocat.gif "The MummytoCat")Text can be to the right,
or below the image.

Images are responsive to the screen size.
![Futuristic City {{w:1000,h:475}}](/assets/images/SYj8uKB.jpeg "Futuristic City")Text can be to the right,
or below the image.

## Plugins

The killer feature of `react-markdown` is very effective support of
[plugins](https://github.com/remarkjs/react-markdown#examples).

### [Emojies](https://github.com/markdown-it/markdown-it-emoji)

> Classic markup: :wink: :crush: :cry: :tear: :laughing: :yum:
>
> Shortcuts (emoticons): :-) :-( 8-) ;)

see [how to change output](https://github.com/markdown-it/markdown-it-emoji#change-output) with markdown-it-emoji.

### [Subscript/Superscript](https://github.com/Symbitic/remark-plugins/blob/master/packages/remark-supersub/README.md)

- 19^th^
- H~2~O

## Custom Markdown

### [\<ins>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins "HTML Insert element")

The `<ins>` HTML element represents a range of text that has been ++added++ to a document. The markdown for this element is `++text to be inserted++`.

```md
<!--Classes and styles can be added using the syntax below:-->
ins {
    background-color: #d4fcbc;
}
```

### [\<mark>](https://www.w3schools.com/tags/tag_mark.asp "The Mark Tag")

The `<mark>` HTML tag defines text that should be ==marked== or ==highlighted==. The markdown for this element is `==text to be marked==`.

Classes and styles can be added using the syntax below:

```css
mark {
  color: black;
  background-color: #ff0;
}
```

### [\<abbr\>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr)

*[HTML]: Hyper Text Markup Language
*[W3C]:  World Wide Web Consortium

This is HTML abbreviation example.

The `<abbr>` HTML element represents an abbreviation or acronym. The markdown for this element is `*[HTML]: Hyper Text Markup Language`.

## [Footnotes](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#footnotes "Markdown Footnotes")

Here is a simple footnote[^1]

A footnote can also have multiple lines[^2].

Inline footnote[^3] link to some code.

Duplicated footnote reference[^2].

[^2]: Footnote **can have markup**,
and many lines.

    Even multiple paragraphs. 


    To add line breaks or new paragraph within a footnote, prefix new lines with 4 spaces.


[^first]: Footnote **can have markup**

    and multiple paragraphs.

[^1]: Footnote text.

[^3]: Inline footnote definition and code.
    ```js
    console.log(foo(5));
    ```

## Custom containers

Custom containers can be used to create custom content blocks.

### Post-it *CSS*


::: custom-css post-it
This is a custom container which can be styled and have CSS classes.
This example is a a custom container styled as a *sticky note*.
Link to style[^4].
:::

The *markdown* for the Custom Container Post-it is:

```md
::: custom-css post-it
This is a custom container which can be styled and have CSS classes.
This example is a a custom container styled as a *sticky note*.
Link to style[^4].
:::
```

### [Description List *Style*](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl)

::: custom font-weight: 600
Term One
:::

::: custom display: inline-block; margin-inline-start: 1.5em; max-width: 90%
Definition One containing **markdown** and an embedded Code block.
```js
console.log(foo(5));
```
:::

::: custom font-weight: 600
Term Two
:::

::: custom display: inline-block; margin-inline-start: 2em; max-width: 90%
Definition Two
:::
&nbsp;
The *Markdown* and *Style* for the Custom Container Definition lists are:

````md
::: custom font-weight: 600
Term One
:::
````

````md
::: custom display: inline-block; margin-inline-start: 1.5em; max-width: 90%
Definition One containing **markdown** and an embedded Code block.
```js
console.log(foo(5));
```
:::
````

[^4]: This is the CSS style for the Post-It.
    ```css
    .post-it {
      display: inline-table;
      width: 250px;
      position: relative;
      background: #ffa;
      overflow: hidden;
      padding: 20px;
      border-radius: 0 0 0 30px/45px;
      box-shadow: inset 0 -40px 40px      
      rgba(0,0,0,0.2), inset 0 25px 10px     
      rgba(0,0,0,0.2), 0 5px 6px 5px     
      rgba(0,0,0,0.2);
      font-family: 'Permanent Marker', cursive;
      line-height: 1.7em;
      -webkit-mask-image:
    url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAA5JREFUeNpiYGBgAAgwAAAEAAGbA+oJAAAAAElFTkSuQmCC);
      color: #130d6b;
    }
    ```