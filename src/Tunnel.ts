import LocalTunnel from "localtunnel";

export const ErrorTunnelStart = new Error("Failed to start tunnel");

// we could add more strategies in the future (like ngrok, cloudflare tunnel, etc)
interface TunnelStrategy {
  start(port: number, subdomain?: string): Promise<string>;
  stop(): Promise<void>;
  tunnelUrl?: string;
}

export class LocalTunnelStrategy implements TunnelStrategy {
  public tunnelUrl: string | undefined;
  private tunnelInstance?: LocalTunnel.Tunnel;

  async start(port: number, subdomain?: string): Promise<string> {
    this.tunnelInstance = await LocalTunnel({
      port: port,
      subdomain: subdomain,
    });
    return this.tunnelInstance.url;
  }

  async stop(): Promise<void> {
    if (this.tunnelInstance) {
      this.tunnelInstance.close();
      this.tunnelInstance = undefined;
      this.tunnelUrl = undefined;
    }
  }
}

class Tunnel {
  public port: number;
  public subdomain: string | undefined;
  public tunnelUrl: string | undefined;
  private strategy: TunnelStrategy;

  constructor(strategy: TunnelStrategy, port: number, subdomain?: string) {
    this.port = port;
    this.subdomain = subdomain;
    this.strategy = strategy;
  }

  async start(): Promise<string> {
    this.tunnelUrl = await this.strategy.start(this.port, this.subdomain);
    if (!this.tunnelUrl) {
      throw ErrorTunnelStart;
    }
    return this.tunnelUrl;
  }

  async stop(): Promise<void> {
    await this.strategy.stop();
    this.tunnelUrl = undefined;
  }
}

export default Tunnel;
