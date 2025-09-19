import { Locator, Page } from "patchright";

type RoleParameter =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "blockquote"
  | "button"
  | "caption"
  | "cell"
  | "checkbox"
  | "code"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "deletion"
  | "dialog"
  | "directory"
  | "document"
  | "emphasis"
  | "feed"
  | "figure"
  | "form"
  | "generic"
  | "grid"
  | "gridcell"
  | "group"
  | "heading"
  | "img"
  | "insertion"
  | "link"
  | "list"
  | "listbox"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "meter"
  | "menu"
  | "menubar"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "none"
  | "note"
  | "option"
  | "paragraph"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "strong"
  | "subscript"
  | "superscript"
  | "switch"
  | "tab"
  | "table"
  | "tablist"
  | "tabpanel"
  | "term"
  | "textbox"
  | "time"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem";

const validGetBy = [
  "altText",
  "label",
  "placeholder",
  "role",
  "testId",
  "text",
  "title",
];

const validGetters = [
  "isVisible",
  "count",
  "textContent",
  "isHidden",
  "isEnabled",
  "isEditable",
  "isDisabled",
  "isChecked",
  "inputValue",
  "innerHTML",
  "innerText",
  "getAttribute",
  "allTextContents",
  "allInnerTexts",
];

const validActions = [
  "click",
  "dblclick",
  "fill",
  "setChecked",
  "selectOption",
  "pressSequentially",
  "press",
  // "setInputFiles", // todo implement file uploads
  "focus",
  "blur",
  "check",
  "uncheck",
  "clear",
  "dragTo",
  "hover",
  "tap",
  "wait",
  "waitFor",
];

const validLocatorTypes = [
  "getBy",
  "framelocator",
  "or",
  "and",
  "filter",
  "locator",
  "nth",
  "first",
  "last",
];

type locatorTypes = (typeof validLocatorTypes)[number] | "action" | "getter";

export type Instruction = {
  type: locatorTypes;
  operation?: string; // Combines by, action, getter
  elements?: Instruction[];
  value?: any;
  options?: any;
};

function getBy(
  locator: Locator,
  by: string,
  parameter: string,
  options?: any,
): Locator {
  switch (by) {
    case "altText":
      return locator.getByAltText(parameter, options);
    case "label":
      return locator.getByLabel(parameter, options);
    case "placeholder":
      return locator.getByPlaceholder(parameter, options);
    case "role":
      return locator.getByRole(parameter as RoleParameter, options);
    case "testId":
      return locator.getByTestId(parameter);
    case "text":
      return locator.getByText(parameter, options);
    case "title":
      return locator.getByTitle(parameter, options);
    default:
      throw new Error(
        `Invalid 'by' value: ${by}, must be one of ${validGetBy.join(", ")}`,
      );
  }
}

function parseOptions(page: Page, options: any) {
  for (const key in options) {
    if (typeof options[key] === "string" && options[key].startsWith("regex:")) {
      options[key] = new RegExp(options[key].slice(6));
    } else if (
      typeof options[key] === "object" &&
      options[key] !== null &&
      !Array.isArray(options[key])
    ) {
      options[key] = parseOptions(page, options[key]);
    } else if (["has", "hasNot"].includes(key) && Array.isArray(options[key])) {
      options[key] = buildLocatorChain(page, options[key] as Instruction[]);
    }
  }
  return options;
}

export async function executeLocatorChain(
  items: Instruction[] | Instruction[][],
  page: Page,
) {
  if (items.length === 0) {
    throw new Error("Locator chain cannot be empty");
  }
  if (Array.isArray(items[0])) {
    for (const chain of items as Instruction[][]) {
      await executeLocatorChain(chain, page);
    }
    return;
  }
  items = items as Instruction[];
  let locator = page.locator("body");
  for (const item of items) {
    if (
      !validLocatorTypes.includes(item.type) &&
      item.type !== "action" &&
      item.type !== "getter"
    ) {
      throw new Error(
        `Invalid locator type: ${item.type}, must be one of ${validLocatorTypes.join(", ")}, action or getter`,
      );
    }
    if (validLocatorTypes.includes(item.type)) {
      locator = runLocator(page, locator, item);
    }
    if (item.type === "action") {
      if (!item.operation) {
        throw new Error("Action item must have an action property");
      }
      await runAction(locator, item.operation, item.value);
    }
    if (item.type === "getter") {
      if (!item.operation) {
        throw new Error("Getter item must have a getter property");
      }
      return await runGetter(locator, item.operation, item.value);
    }
  }
}

function runAction(locator: Locator, action: string, value?: any) {
  switch (action) {
    case "click":
      return locator.click();
    case "dblclick":
      return locator.dblclick();
    case "fill":
      return locator.fill(value);
    case "setChecked":
      return locator.setChecked(value);
    case "selectOption":
      return locator.selectOption(value);
    case "pressSequentially":
      return locator.pressSequentially(value);
    case "press":
      return locator.press(value);
    // todo implement file uploads
    // case "setInputFiles":
    //   return locator.setInputFiles(value);
    case "focus":
      return locator.focus();
    case "blur":
      return locator.blur();
    case "check":
      return locator.check();
    case "uncheck":
      return locator.uncheck();
    case "clear":
      return locator.clear();
    case "dragTo":
      return locator.dragTo(value);
    case "hover":
      return locator.hover();
    case "tap":
      return locator.tap();
    case "wait":
      return new Promise((resolve) => setTimeout(resolve, Number(value)));
    case "waitFor":
      return locator.waitFor({ state: value || "visible", timeout: 5000 });
    default:
      throw new Error(
        `Invalid action: ${action}, must be one of ${validActions.join(", ")}`,
      );
  }
}

function runGetter(locator: Locator, getter: string, value?: string) {
  switch (getter) {
    case "isVisible":
      return locator.isVisible();
    case "count":
      return locator.count();
    case "textContent":
      return locator.textContent();
    case "isHidden":
      return locator.isHidden();
    case "isEnabled":
      return locator.isEnabled();
    case "isEditable":
      return locator.isEditable();
    case "isDisabled":
      return locator.isDisabled();
    case "isChecked":
      return locator.isChecked();
    case "inputValue":
      return locator.inputValue();
    case "innerHTML":
      return locator.innerHTML();
    case "innerText":
      return locator.innerText();
    case "getAttribute":
      if (!value) {
        throw new Error("getAttribute requires a value");
      }
      return locator.getAttribute(value);
    case "allTextContents":
      return locator.allTextContents();
    case "allInnerTexts":
      return locator.allInnerTexts();
    default:
      throw new Error(
        `Invalid getter: ${getter}, must be one of ${validGetters.join(", ")}`,
      );
  }
}

function buildLocatorChain(page: Page, items: Instruction[]): Locator {
  let locator = page.locator("body");
  for (const item of items) {
    if (!validLocatorTypes.includes(item.type)) {
      throw new Error(
        `Invalid locator type: ${item.type}, must be one of ${validLocatorTypes.join(", ")}`,
      );
    }
    locator = runLocator(page, locator, item);
  }
  return locator;
}

function runLocator(page: Page, locator: Locator, item: Instruction): Locator {
  // todo throw error if there's no more getBy after framelocator
  switch (item.type) {
    case "getBy":
      return getBy(
        locator,
        item.operation!,
        item.value!,
        item.options ? parseOptions(page, item.options) : undefined,
      );
    case "framelocator":
      return locator.frameLocator(item.value!) as unknown as Locator;
    case "or":
      if (!item.elements || item.elements.length === 0) {
        throw new Error("Or must have at least one element");
      }
      return locator.or(buildLocatorChain(page, item.elements));
    case "and":
      if (!item.elements || item.elements.length === 0) {
        throw new Error("And must have at least one element");
      }
      return locator.and(buildLocatorChain(page, item.elements));
    case "filter":
      return locator.filter(parseOptions(page, item.options));
    case "locator":
      return locator.locator(
        item.value!,
        item.options ? parseOptions(page, item.options) : undefined,
      );
    case "nth":
      return locator.nth(Number(item.value!));
    case "first":
      return locator.first();
    case "last":
      return locator.last();
    default:
      throw new Error(`Unknown locator type: ${item.type}`);
  }
}
