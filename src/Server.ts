import HTTPStatusCodes from "http-status-codes";
import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";

import type SessionManager from "./SessionManager";
import {
  ErrorInterceptorAlreadyExists,
  ErrorInterceptorNotFound,
  type Session,
} from "./Session";
import { htmlToMarkdown, htmlToText, selectHtml } from "./utils";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
  }
}

const ErrorCantStartServer = new Error("Can't start server");

class Server {
  private app: FastifyInstance;
  private sessionManager: SessionManager;
  private port: number;
  private shutdown?: () => Promise<void>;
  constructor(port: number, sessionManager: SessionManager) {
    this.port = port;
    this.app = Fastify({ logger: true });
    this.sessionManager = sessionManager;
    this.registerRoutes();
  }

  private async registerApiRoutes(instance: FastifyInstance) {
    instance.post("/sessions", async (_, reply: FastifyReply) => {
      const session = await this.sessionManager.createSession();
      reply.send({ id: session.id });
    });

    instance.delete<{
      Params: { id: string };
    }>("/sessions/:id", async (request, reply) => {
      const { id } = request.params;
      const session = await this.sessionManager.getSession(id);
      if (!session) {
        reply.status(404).send({ error: "Session not found" });
        return;
      }
      await session.destroy();
      reply
        .status(200)
        .send({ status: `Session ${id} was successfully closed` });
    });

    instance.register(this.registerSessionRoutes.bind(this), {
      prefix: "/sessions/:id",
    });
  }

  private async registerSessionRoutes(instance: FastifyInstance) {
    instance.addHook<{ Params: { id: string } }>(
      "preHandler",
      async (request, reply) => {
        const { id } = request.params;
        const session = await this.sessionManager.getSession(id);
        if (!session) {
          reply.status(404).send({ error: "Session not found" });
          return;
        }
        request.session = session;
      },
    );

    // actions

    instance.post<{
      Body: {
        url: string;
        timeout?: number;
        waitUntil?: "domcontentloaded" | "networkidle" | "load" | "commit";
      };
    }>(
      "/navigate",
      {
        schema: {
          body: {
            type: "object",
            properties: {
              url: { type: "string", format: "uri" },
              timeout: { type: "number", minimum: 0 },
              waitUntil: {
                type: "string",
                enum: ["domcontentloaded", "networkidle", "load", "commit"],
              },
            },
            required: ["url"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        try {
          const statusCode = await session.navigateTo(request.body.url);
          reply.status(HTTPStatusCodes.OK).send({ status: statusCode });
        } catch (e) {
          request.log.error({ e, url: request.body.url }, "page load error");
          reply.status(500).send({ error: "Failed to navigate" });
        }
      },
    );

    instance.post<{ Body: { selector: string } }>(
      "/click",
      {
        schema: {
          body: {
            type: "object",
            properties: { selector: { type: "string", minLength: 1 } },
            required: ["selector"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        await session.clickOn(request.body.selector);
        reply
          .status(HTTPStatusCodes.OK)
          .send({ action: "click", target: request.body.selector });
      },
    );

    instance.post<{ Body: { selector: string } }>(
      "/focus",
      {
        schema: {
          body: {
            type: "object",
            properties: { selector: { type: "string", minLength: 1 } },
            required: ["selector"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        await session.focus(request.body.selector);
        reply
          .status(HTTPStatusCodes.OK)
          .send({ action: "focus", target: request.body.selector });
      },
    );

    instance.post<{ Body: { fullPage?: boolean } }>(
      "/screenshot",
      {
        schema: {
          body: {
            type: "object",
            properties: { fullPage: { type: "boolean", default: true } },
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        const screenshotBuffer = await session.screenShot(
          request.body.fullPage,
        );
        reply
          .header("Content-Type", "image/png")
          .header("Content-Length", screenshotBuffer.length)
          .send(screenshotBuffer);
      },
    );

    instance.post("/reload", async (request, reply) => {
      const session = request.session;
      const statusCode = await session.reload();
      reply.status(HTTPStatusCodes.OK).send({ status: statusCode });
    });

    instance.post<{ Body: { selector: string } }>(
      "/is_visible",
      {
        schema: {
          body: {
            type: "object",
            properties: { selector: { type: "string", minLength: 1 } },
            required: ["selector"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        const { selector } = request.body;
        const isVisible = await session.isVisible(selector);
        reply.send({ is_visible: isVisible });
      },
    );

    instance.get<{ Querystring: { format?: string; selector?: string } }>(
      "/extract_content",
      async (request, reply) => {
        const session = request.session;
        const format = request.query?.format || "html";
        const htmlContent = await session.getContent();
        let content: string = "";
        if (format === "html") {
          content = selectHtml(htmlContent, request.query.selector);
        } else if (format === "text") {
          content = htmlToText(htmlContent, request.query.selector);
        } else if (format === "markdown") {
          content = htmlToMarkdown(htmlContent, request.query.selector);
        } else {
          reply.status(400).send({ error: "Invalid format specified" });
          return;
        }
        reply.status(HTTPStatusCodes.OK).send({ content });
      },
    );

    instance.post<{ Body: { script: string } }>(
      "/evaluate",
      {
        schema: {
          body: {
            type: "object",
            properties: { script: { type: "string", minLength: 1 } },
            required: ["script"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        try {
          const result = await session.evaluate(request.body.script);
          reply.send({ result });
        } catch (e) {
          request.log.error(
            { e, script: request.body.script },
            "evaluate error",
          );
          reply.status(500).send({ error: "Failed to evaluate script" });
        }
      },
    );

    instance.post<{
      Body: {
        content: string;
        type: "html" | "text" | "base64_image";
      };
    }>(
      "/native_paste",
      {
        schema: {
          body: {
            type: "object",
            properties: {
              content: { type: "string", minLength: 1 },
              type: { type: "string", enum: ["html", "text", "base64_image"] },
            },
            required: ["content"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        try {
          await session.nativePaste(request.body.content, request.body.type);
          reply
            .status(HTTPStatusCodes.OK)
            .send({ status: "Content pasted to system clipboard" });
        } catch (e) {
          request.log.error(
            { e, content: request.body.content },
            "native paste error",
          );
          reply.status(500).send({ error: "Failed to perform native paste" });
        }
      },
    );

    // interceptors

    instance.post<{ Body: { urlPattern: string } }>(
      "/interceptors",
      {
        schema: {
          body: {
            type: "object",
            properties: { urlPattern: { type: "string" } },
            required: ["urlPattern"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        const { urlPattern } = request.body;
        try {
          const interceptorId = session.addInterceptor(urlPattern);
          reply.status(HTTPStatusCodes.OK).send({ id: interceptorId });
        } catch (e) {
          if (e === ErrorInterceptorAlreadyExists) {
            reply.status(400).send({
              error: `Interceptor already exists for the ${urlPattern} url pattern`,
            });
            return;
          }
          request.log.error({ e, urlPattern }, "add interceptor error");
          reply.status(500).send({ error: "Failed to add interceptor" });
        }
      },
    );

    instance.get<{ Params: { interceptorId: string } }>(
      "/interceptors/:interceptorId/responses",
      {
        schema: {
          params: {
            type: "object",
            properties: {
              interceptorId: { type: "string", minLength: 1 },
            },
            required: ["interceptorId"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        const { interceptorId } = request.params;

        try {
          const responses = session.getInterceptorResponse(interceptorId);
          reply.status(HTTPStatusCodes.OK).send(responses);
        } catch (e) {
          if (e === ErrorInterceptorNotFound) {
            reply.status(404).send({ error: "Interceptor not found" });
            return;
          }
          request.log.error(
            { e, interceptorId },
            "get interceptor responses error",
          );
          reply
            .status(500)
            .send({ error: "Failed to get interceptor responses" });
        }
      },
    );

    instance.delete<{ Params: { interceptorId: string } }>(
      "/interceptors/:interceptorId",
      {
        schema: {
          params: {
            type: "object",
            properties: {
              interceptorId: { type: "string", minLength: 1 },
            },
            required: ["interceptorId"],
          },
        },
      },
      async (request, reply) => {
        const session = request.session;
        const { interceptorId } = request.params;

        try {
          session.removeInterceptor(interceptorId);
          reply
            .status(HTTPStatusCodes.OK)
            .send({ status: `Interceptor ${interceptorId} removed` });
        } catch (e) {
          if (e === ErrorInterceptorNotFound) {
            reply.status(404).send({ error: "Interceptor not found" });
            return;
          }
          request.log.error({ e, interceptorId }, "remove interceptor error");
          reply.status(500).send({ error: "Failed to remove interceptor" });
        }
      },
    );

    instance.delete("/interceptors", async (request, reply) => {
      const session = request.session;
      session.removeAllInterceptors();
      reply
        .status(HTTPStatusCodes.OK)
        .send({ status: "All interceptors removed" });
    });
  }

  private async registerRoutes() {
    this.app.get("/healthz", function handler(request, reply) {
      reply.send({
        status: "ok",
      });
    });

    this.app.post("/shutdown", async (request, reply) => {
      reply.send({ status: "Shutting down" });
      await this.shutdown?.();
    });

    this.app.register(this.registerApiRoutes.bind(this), { prefix: "/api/v1" });
  }

  public async start(shutdown: () => Promise<void>) {
    if (this.app.server.listening) {
      return;
    }
    this.shutdown = shutdown;
    this.app.listen(
      {
        port: this.port,
      },
      (err) => {
        if (err) {
          this.app.log.error(err);
          throw ErrorCantStartServer;
        }
      },
    );
  }

  public async stop() {
    await this.app.close();
  }
}

export default Server;
