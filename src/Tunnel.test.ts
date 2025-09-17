import { expect, test } from "vitest";

import Tunnel, { ErrorTunnelStart } from "./Tunnel";

class MockStrategy {
  public port?: number;
  public subdomain: string | undefined;
  public tunnelUrl: string | undefined;
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  async start(port: number, subdomain?: string): Promise<string> {
    this.port = port;
    this.subdomain = subdomain;
    if (this.shouldFail) {
      return "";
    }
    this.tunnelUrl = `http://${this.subdomain || "random"}.mocktunnel.com`;
    return this.tunnelUrl;
  }

  async stop(): Promise<void> {
    this.port = undefined;
    this.subdomain = undefined;
    this.tunnelUrl = undefined;
  }
}

test("Tunnel starts and stops correctly with successful strategy", async () => {
  const strategy = new MockStrategy();
  const tunnel = new Tunnel(strategy, 8080, "testsubdomain");

  const url = await tunnel.start();
  expect(url).toBe("http://testsubdomain.mocktunnel.com");
  expect(tunnel.tunnelUrl).toBe("http://testsubdomain.mocktunnel.com");

  await tunnel.stop();
  expect(tunnel.tunnelUrl).toBeUndefined();
});

test("Tunnel throws error when strategy fails to start", async () => {
  const strategy = new MockStrategy(true);
  const tunnel = new Tunnel(strategy, 8080, "testsubdomain");

  await expect(tunnel.start()).rejects.toThrow(ErrorTunnelStart.message);
  expect(tunnel.tunnelUrl).toBe("");
});

test("Tunnel stops correctly even if not started", async () => {
  const strategy = new MockStrategy();
  const tunnel = new Tunnel(strategy, 8080, "testsubdomain");

  await tunnel.stop(); // Should not throw
  expect(tunnel.tunnelUrl).toBeUndefined();
});

test("Tunnel starts with random subdomain if none provided", async () => {
  const strategy = new MockStrategy();
  const tunnel = new Tunnel(strategy, 8080);

  const url = await tunnel.start();
  expect(url).toMatch(/^http:\/\/random\.mocktunnel\.com$/);
  expect(tunnel.tunnelUrl).toBe(url);

  await tunnel.stop();
  expect(tunnel.tunnelUrl).toBeUndefined();
});
