// OpenAPI 3.1 spec for the Wedding Hall server.
// Single source of truth. Served at /api/openapi.json and rendered at /docs.

export type OpenApiDocument = Record<string, unknown>;

export function buildOpenApi(origin: string): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: {
      title: "Wedding Hall API",
      version: "0.2.0",
      description:
        "Server-side endpoints for the Wedding Hall MVP. The browser still " +
        "talks to Supabase Auth directly for sign-in / sign-up; data writes " +
        "(profiles, wedding_budgets) and reads go through this server, which " +
        "forwards the user's JWT to Supabase so RLS keeps enforcing row " +
        "ownership. The server uses the anon key only — no service role.",
      contact: {
        name: "Wedding Hall",
        url: "https://github.com/ikiliki/wedding-hall",
      },
    },
    servers: [
      { url: origin, description: "this deployment" },
      { url: "http://localhost:3001", description: "local dev" },
    ],
    tags: [
      { name: "system", description: "Service health and metadata." },
      { name: "profiles", description: "Authenticated user profile." },
      { name: "budgets", description: "Authenticated user's wedding budget." },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["system"],
          summary: "Liveness check",
          description:
            "Returns a small JSON payload confirming the server is reachable. " +
            "Used by Vercel uptime checks and the docker-compose smoke tests.",
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
            "Returns this OpenAPI document. Use it to drive Swagger UI, code " +
            "generators, or contract tests.",
          operationId: "getOpenApi",
          responses: {
            "200": {
              description: "OpenAPI 3.1 document.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/profiles": {
        post: {
          tags: ["profiles"],
          summary: "Upsert the current user's profile",
          description:
            "Idempotent. Called by the client right after sign-in / sign-up / " +
            "auth callback. The server derives `id` from the JWT — never the " +
            "request body. Defaults `email` and `full_name` to the values on " +
            "the auth user when omitted.",
          operationId: "upsertProfile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpsertProfilePayload" },
              },
            },
          },
          responses: {
            "200": {
              description: "Profile after upsert.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      profile: { $ref: "#/components/schemas/Profile" },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "503": { $ref: "#/components/responses/TablesMissing" },
          },
        },
      },
      "/api/budget": {
        get: {
          tags: ["budgets"],
          summary: "Get the current user's budget",
          description: "Returns the authenticated user's latest budget, or `null` if none exists yet.",
          operationId: "getBudget",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Budget (or null).",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      budget: {
                        oneOf: [
                          { $ref: "#/components/schemas/WeddingBudget" },
                          { type: "null" },
                        ],
                      },
                    },
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
        put: {
          tags: ["budgets"],
          summary: "Upsert the current user's budget",
          description:
            "Server validates inputs, computes `estimated_total`, and ignores " +
            "any caller-supplied `user_id` (always taken from the JWT).",
          operationId: "saveBudget",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SaveBudgetPayload" },
              },
            },
          },
          responses: {
            "200": {
              description: "Budget after upsert.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      budget: { $ref: "#/components/schemas/WeddingBudget" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/ValidationError" },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "503": { $ref: "#/components/responses/TablesMissing" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Supabase Auth JWT (`session.access_token`). The server forwards " +
            "this header to Supabase so RLS still applies.",
        },
      },
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
        Profile: {
          type: "object",
          required: ["id", "created_at", "updated_at"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: ["string", "null"] },
            full_name: { type: ["string", "null"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        UpsertProfilePayload: {
          type: "object",
          properties: {
            email: { type: ["string", "null"] },
            full_name: { type: ["string", "null"] },
          },
        },
        WeddingBudget: {
          type: "object",
          required: [
            "id",
            "user_id",
            "couple_name_1",
            "couple_name_2",
            "guest_count",
            "wedding_type",
            "venue_price_type",
            "venue_price_per_guest",
            "estimated_total",
            "created_at",
            "updated_at",
          ],
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            couple_name_1: { type: "string" },
            couple_name_2: { type: "string" },
            preferred_day: { type: ["string", "null"] },
            guest_count: { type: "integer", minimum: 0 },
            guest_count_min: { type: ["integer", "null"], minimum: 0 },
            guest_count_max: { type: ["integer", "null"], minimum: 0 },
            wedding_type: { type: "string", enum: ["hall"] },
            venue_price_type: {
              type: "string",
              enum: ["cheap", "average", "premium", "custom"],
            },
            venue_price_per_guest: { type: "integer", minimum: 0 },
            venue_name: { type: ["string", "null"] },
            estimated_total: { type: "integer", minimum: 0 },
            selections: {
              type: ["object", "null"],
              description:
                "Catalog-driven wizard answers. The server recomputes " +
                "estimated_total from these on every PUT so the client " +
                "cannot tamper with prices.",
              additionalProperties: true,
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        SaveBudgetPayload: {
          type: "object",
          required: [
            "coupleName1",
            "coupleName2",
            "guestCount",
            "weddingType",
            "venuePriceType",
          ],
          properties: {
            coupleName1: { type: "string" },
            coupleName2: { type: "string" },
            preferredDay: { type: "string" },
            guestCount: { type: "integer", minimum: 0 },
            guestCountMin: { type: "integer", minimum: 0 },
            guestCountMax: { type: "integer", minimum: 0 },
            weddingType: { type: "string", enum: ["hall"] },
            venuePriceType: {
              type: "string",
              enum: ["cheap", "average", "premium", "custom"],
            },
            customPricePerGuest: {
              type: "number",
              description: "Required when venuePriceType is 'custom'.",
            },
            venueName: {
              type: "string",
              description: "Optional, only used when venuePriceType is 'custom'.",
            },
            selections: {
              type: "object",
              description:
                "Optional catalog-driven wizard answers. See `WeddingBudget.selections`.",
              additionalProperties: true,
            },
          },
        },
        ErrorBody: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
            code: { type: "string" },
            details: { type: "array", items: { type: "object" } },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Missing or invalid bearer token.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorBody" },
            },
          },
        },
        ValidationError: {
          description: "Body failed validation.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorBody" },
            },
          },
        },
        TablesMissing: {
          description: "Supabase tables have not been created yet.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorBody" },
            },
          },
        },
      },
    },
  };
}
