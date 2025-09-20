import { init as cuid2 } from "@paralleldrive/cuid2";
import * as cheerio from "cheerio";
import { NodeHtmlMarkdown } from "node-html-markdown";

export const createUniqueId = cuid2({
  length: 10,
});

export function selectHtml(html: string, selector?: string): string {
  if (!selector) return html;
  const $ = cheerio.load(html);
  const selected = $(selector);
  return selected.html() || html;
}

export function htmlToText(html: string, selector?: string) {
  const selected = selectHtml(html, selector);
  return cheerio.load(selected).text();
}

export function htmlToMarkdown(html: string, selector?: string): string {
  const selected = selectHtml(html, selector);
  return NodeHtmlMarkdown.translate(selected);
}
