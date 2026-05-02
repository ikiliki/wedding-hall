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
      <p style={{ color: "#666", fontSize: 14, maxWidth: 480 }}>
        This deploy is separate from the React client. Supabase (database +
        auth for the browser) is configured in the Supabase dashboard; add a
        service role key here only when this service needs admin access.
      </p>
    </main>
  );
}
