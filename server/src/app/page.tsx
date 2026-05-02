export default function HomePage() {
  return (
    <main>
      <h1>Wedding Hall — server</h1>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          API docs: <a href="/docs">/docs</a> (Swagger UI)
        </li>
        <li>
          OpenAPI spec: <a href="/api/openapi.json">/api/openapi.json</a>
        </li>
        <li>
          Health: <a href="/api/health">/api/health</a>
        </li>
      </ul>
      <p style={{ color: "#666", fontSize: 14, maxWidth: 560 }}>
        This deploy is the Wedding Hall API. The browser handles auth
        (sign-in/out) directly against Supabase, then forwards the user
        JWT here for every <code>/api/profiles</code> and{" "}
        <code>/api/budget</code> call. The server uses the Supabase{" "}
        <strong>anon</strong> key only — RLS keeps enforcing row ownership.
      </p>
    </main>
  );
}
