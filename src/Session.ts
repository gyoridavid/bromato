import { type Page, type Response } from "patchright";
import HTTPStatusCodes from "http-status-codes";
import Clipboard from "@crosscopy/clipboard";

import { createUniqueId } from "./utils";

type ResponseEntry = {
  timestamp: string;
  url: string;
  status: number;
  data: any;
};

type InterceptorResponse = {
  id: string;
  url: string;
  responses: ResponseEntry[];
};

export const ErrorInterceptorAlreadyExists = new Error(
  "JSON Interceptor for this URL pattern already exists",
);
export const ErrorInterceptorNotFound = new Error("JSON Interceptor not found");

class Interceptor {
  public id: string;
  public urlPattern: string;
  private responseEntries: ResponseEntry[];
  private session: Session;
  private listener: (response: Response) => void;

  constructor(session: Session, urlPattern: string) {
    this.session = session;
    this.urlPattern = urlPattern;
    this.responseEntries = [];
    this.id = createUniqueId();

    this.listener = async (response: Response) => {
      await response.finished();
      try {
        if (urlPattern && !response.url().includes(urlPattern)) {
          return;
        }
        try {
          const responseStatus = response.status();
          if (responseStatus < 200 || responseStatus >= 300) {
            return;
          }

          // the response can be anything, let's try to parse it as json
          // if it fails just return the original content

          let data = await response.text();

          try {
            data = await response.json();
          } catch (e) {}

          const logEntry = {
            timestamp: new Date().toISOString(),
            url: response.url(),
            status: response.status(),
            data,
          };

          this.responseEntries.push(logEntry);
        } catch (error) {}
      } catch (error) {}
    };
    this.session.page.on("response", this.listener);
  }

  getResponses(): ResponseEntry[] {
    return this.responseEntries;
  }

  destroy() {
    this.session.page.removeListener("response", this.listener);
  }
}

export class Session {
  public id: string;
  public page: Page;
  private interceptors: Interceptor[];

  constructor(id: string, page: Page) {
    this.id = id;
    this.page = page;
    this.interceptors = [];
  }

  async destroy() {
    for (const interceptor of this.interceptors) {
      interceptor.destroy();
    }
    this.page.removeAllListeners();
  }

  // actions

  async clickOn(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  async navigateTo(
    url: string,
    timeout?: number,
    waitUntil?: "domcontentloaded" | "networkidle" | "load" | "commit",
  ): Promise<number> {
    try {
      const response = await this.page.goto(url, {
        timeout,
        waitUntil,
      });
      // actually there's nothing in the documentation when would the response be null
      // I assume it won't, hence the ridiculous status code
      // https://playwright.dev/docs/api/class-page#page-goto
      return response?.status() || HTTPStatusCodes.IM_A_TEAPOT;
    } catch (e) {
      throw e;
    }
  }

  async screenShot(fullPage: boolean = true): Promise<Buffer> {
    return this.page.screenshot({
      fullPage,
    });
  }

  async reload(): Promise<number> {
    const response = await this.page.reload();
    return response?.status() || HTTPStatusCodes.REQUEST_TIMEOUT;
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.isVisible(selector);
  }

  async getContent(): Promise<string> {
    return this.page.content();
  }

  async evaluate(script: string): Promise<any> {
    return this.page.evaluate(script);
  }

  async nativePaste(
    content: string,
    type: "html" | "text" | "base64_image",
  ): Promise<void> {
    switch (type) {
      case "html":
        Clipboard.setHtml(content);
        break;
      case "base64_image":
        Clipboard.setImageBase64(content);
        break;
      case "text":
      default:
        Clipboard.setText(content);
        break;
    }
    await this.page.bringToFront();
    await this.page.keyboard.press("Meta+v");
  }

  async focus(selector: string): Promise<void> {
    await this.page.locator(selector).focus();
  }

  // interceptors

  addInterceptor(urlPattern: string): string {
    const existing = this.interceptors.find(
      (interceptor) => interceptor.urlPattern === urlPattern,
    );
    if (existing) {
      throw ErrorInterceptorAlreadyExists;
    }

    const interceptor = new Interceptor(this, urlPattern);
    this.interceptors.push(interceptor);
    return interceptor.id;
  }

  removeInterceptor(interceptorId: string): void {
    const interceptorIndex = this.interceptors.findIndex(
      (i) => i.id === interceptorId,
    );

    if (interceptorIndex === -1) {
      throw ErrorInterceptorNotFound;
    }

    this.interceptors[interceptorIndex].destroy();
    this.interceptors.splice(interceptorIndex, 1);
  }

  removeAllInterceptors(): void {
    this.interceptors.forEach((interceptor) => interceptor.destroy());
    this.interceptors = [];
  }

  getInterceptorResponse(interceptorId: string): InterceptorResponse {
    const interceptor = this.interceptors.find((i) => i.id === interceptorId);
    if (!interceptor) {
      throw ErrorInterceptorNotFound;
    }
    return {
      id: interceptor.id,
      url: interceptor.urlPattern,
      responses: interceptor.getResponses(),
    };
  }
}
