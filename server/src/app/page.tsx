export default function HomePage() {
  return (
    <main>
      <h1>Wedding Hall — server</h1>
      <p>
        API: <a href="/api/health">/api/health</a>
      </p>
      <p style={{ color: "#666", fontSize: 14, maxWidth: 480 }}>
        This deploy is separate from the React client. Supabase (database +
        auth for the browser) is still configured in the Supabase dashboard;
        add a service role key here only when this service needs admin access.
      </p>
    </main>
  );
}
