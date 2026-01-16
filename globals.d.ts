declare module "*.md" {
    const content: string;
    export default content;
  }
  
  import type React from "react";
  
  declare global {
    namespace JSX {
      export type Element = React.JSX.Element;
      export type IntrinsicElements = React.JSX.IntrinsicElements;
      export type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
      export interface ElementClass extends React.JSX.ElementClass {}
      export interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
      export interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
    }
  }
  
  export {};