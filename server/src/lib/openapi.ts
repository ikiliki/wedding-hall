// OpenAPI 3.1 spec for the Wedding Hall server.
// Single source of truth. Served at /api/openapi.json and rendered at /docs.

export type OpenApiDocument = Record<string, unknown>;

export function buildOpenApi(origin: string): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: {
      title: "Wedding Hall API",
      version: "0.1.0",
      description:
        "Server-side endpoints for the Wedding Hall MVP. The browser talks to Supabase directly for auth and data; this service is reserved for things that must run with elevated privileges or outside the client.",
      contact: {
        name: "Wedding Hall",
        url: "https://github.com/ikiliki/wedding-hall",
      },
    },
    servers: [
      { url: origin, description: "this deployment" },
      { url: "http://localhost:3001", description: "local dev" },
    ],
    tags: [{ name: "system", description: "Service health and metadata." }],
    paths: {
      "/api/health": {
        get: {
          tags: ["system"],
          summary: "Liveness check",
          description:
            "Returns a small JSON payload confirming the server is reachable. Used by Vercel uptime checks and the docker-compose smoke tests.",
          operationId: "getHealth",
          responses: {
            "200": {
              description: "Service is up.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Health" },
                  examples: {
                    ok: {
                      value: {
                        ok: true,
                        service: "wedding-hall-server",
                        ts: "2026-05-02T15:00:00.000Z",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/openapi.json": {
        get: {
          tags: ["system"],
          summary: "OpenAPI spec",
          description:
            "Returns this OpenAPI document. Use it to drive Swagger UI, code generators, or contract tests.",
          operationId: "getOpenApi",
          responses: {
            "200": {
              description: "OpenAPI 3.1 document.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Health: {
          type: "object",
          required: ["ok", "service", "ts"],
          properties: {
            ok: { type: "boolean", description: "True when the service is healthy." },
            service: {
              type: "string",
              example: "wedding-hall-server",
              description: "Service identifier.",
            },
            ts: {
              type: "string",
              format: "date-time",
              description: "Server time when the response was generated.",
            },
          },
        },
      },
    },
  };
}
