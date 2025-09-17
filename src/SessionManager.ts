import { type BrowserContext } from "patchright";

import { Session } from "./Session";
import { createUniqueId } from "./utils";

class SessionManager {
  private browser: BrowserContext;
  private sessions: Map<string, Session>;

  constructor(browser: BrowserContext) {
    this.sessions = new Map<string, Session>();
    this.browser = browser;
  }

  async createSession(): Promise<Session> {
    const sessionId = createUniqueId();
    const page = await this.browser.newPage();
    const session = new Session(sessionId, page);
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.destroy();
      this.sessions.delete(sessionId);
    }
  }

  async destroy(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.destroy();
      await session.page.close();
    }
    this.sessions.clear();
  }
}

export default SessionManager;
