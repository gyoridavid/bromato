import { expect, test } from "vitest";

import { createUniqueId, htmlToMarkdown, htmlToText } from "./utils";

test("createUniqueId generates unique IDs", () => {
  const id1 = createUniqueId();
  const id2 = createUniqueId();
  expect(id1).not.toBe(id2);
  expect(id1).toHaveLength(10);
  expect(id2).toHaveLength(10);
});

test("htmlToText converts HTML to plain text", () => {
  const html = "<h1>Hello</h1><p>This is a <strong>test</strong>.</p>";
  const text = htmlToText(html);
  expect(text).toBe("HelloThis is a test.");
});

test("htmlToText with selector extracts and converts specific HTML to plain text", () => {
  const html =
    "<div><h1>Hello</h1><p>This is a <strong>test</strong>.</p></div>";
  const text = htmlToText(html, "p");
  expect(text).toBe("This is a test.");
});

test("htmlToMarkdown converts HTML to Markdown", () => {
  const html = "<h1>Hello</h1><p>This is a <strong>test</strong>.</p>";
  const markdown = htmlToMarkdown(html);
  expect(markdown).toBe("# Hello\n\nThis is a **test**.");
});

test("htmlToMarkdown with selector extracts and converts specific HTML to Markdown", () => {
  const html =
    "<div><h1>Hello</h1><p>This is a <strong>test</strong>.</p></div>";
  const markdown = htmlToMarkdown(html, "p");
  expect(markdown).toBe("This is a **test**.");
});
