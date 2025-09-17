import getPort from "get-port";
import fs from "fs-extra";
import path from "path";
import os from "os";

export class Config {
  public subdomain?: string;
  public userDataDir: string;
  private desiredPort: number;
  // todo add proxy settings

  constructor(desiredPort?: number, subdomain?: string, userDataDir?: string) {
    this.subdomain = subdomain;
    this.desiredPort = desiredPort || 3025;
    if (userDataDir) {
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      this.userDataDir = userDataDir;
    } else {
      this.userDataDir = path.join(
        os.homedir(),
        ".bromato",
        "browser-user-data",
      );
    }
  }

  async port(): Promise<number> {
    const port = await getPort({ port: this.desiredPort });
    return port;
  }
}
