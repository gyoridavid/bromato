import { type BrowserContext, chromium } from "patchright";
import fs from "fs-extra";
import dashboardTemplate from "./dashboardTemplate";

class Browser {
  private browserContext: BrowserContext;

  constructor(browserContext: BrowserContext) {
    this.browserContext = browserContext;
  }

  getContext(): BrowserContext {
    return this.browserContext;
  }

  static async create(
    userDataDir: string,
    tunnelURL: string,
    serverPort: number,
  ): Promise<Browser> {
    const logoImage = fs.readFileSync(`${__dirname}/../bromato_logo.png`);
    const base64Logo = logoImage.toString("base64");
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
      channel: "chrome",
      headless: false,
      viewport: null,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const mainPage = browserContext.pages()[0];
    mainPage.setContent(dashboardTemplate(tunnelURL, serverPort, base64Logo));
    return new Browser(browserContext);
  }

  async close() {
    await this.browserContext.close();
  }
}

export default Browser;
