"use client";

import { Children, cloneElement, createElement, isValidElement, type ReactNode, type ReactElement } from "react";

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface Props {
  level?: Level;
  className?: string;
  children: ReactNode;
}

/**
 * EmphHeading renders a heading where any <em> descendants are restyled to
 * Clear Vision Ed's signature italic-accent treatment: italic + brand
 * emerald (primary-400) + bold. Use as:
 *
 *   <EmphHeading level={1}>Master your <em>Oral Boards</em></EmphHeading>
 *
 * Non-<em> children render normally, inheriting the heading's own classes.
 */
export default function EmphHeading({ level = 2, className = "", children }: Props) {
  const tag = `h${level}`;

  const styled = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === "em") {
      const el = child as ReactElement<{ className?: string; children?: ReactNode }>;
      const existing = el.props.className || "";
      return cloneElement(el, {
        className: `${existing} emph`.trim(),
      });
    }
    return child;
  });

  return createElement(tag, { className }, styled);
}
