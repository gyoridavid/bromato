import { program } from "commander";

import { Config } from "./Config";
import { logger } from "./logger";
import SessionManager from "./SessionManager";
import Server from "./Server";
import Browser from "./Browser";
import Tunnel, { LocalTunnelStrategy } from "./Tunnel";

async function main() {
  program
    .version("0.1.0")
    .description("Bromato - Local browser automation for no-code tools")
    .option("-p, --port <number>", "Port to run the server on")
    .option("-s, --subdomain <string>", "Subdomain for the server")
    .option(
      "-d, --userdata <string>",
      "Path to the user data directory for browser sessions",
    );

  program.parse();
  const options = program.opts();

  const config = new Config(options.port, options.subdomain, options.userdata);
  const port = await config.port();

  const tunnel = new Tunnel(new LocalTunnelStrategy(), port, config.subdomain);
  const tunnelURL = await tunnel.start();
  const browser = await Browser.create(config.userDataDir, tunnelURL, port);

  const sessionManager = new SessionManager(browser.getContext());

  const server = new Server(config, sessionManager);

  const shutdown = async () => {
    logger.info("Shutting down...");
    await tunnel.stop();
    logger.info("Tunnel stopped");
    await sessionManager.destroy();
    logger.info("Sessions destroyed");
    await browser.close();
    logger.info("Browser closed");
    await server.stop();
    logger.info("Server stopped");
    await new Promise((r) => setTimeout(r, 1));
    logger.info("Shutdown complete");
    process.exit(0);
  };

  logger.info(`Server is running on port ${port}`);
  logger.info(`Tunnel URL: ${tunnelURL}`);
  await server.start(shutdown);

  process.removeAllListeners("SIGINT");
  process.removeAllListeners("SIGTERM");

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  logger.error(error, "Fatal error during startup");
  process.exit(1);
});
