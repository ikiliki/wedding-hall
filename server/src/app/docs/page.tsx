"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const SWAGGER_VERSION = "5.17.14";
const SWAGGER_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
const SWAGGER_BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;
const SWAGGER_PRESET = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-standalone-preset.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => unknown;
    SwaggerUIStandalonePreset?: { slice: (s: number, e: number) => unknown[] };
  }
}

export default function DocsPage() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    const tryRender = () => {
      if (
        typeof window === "undefined" ||
        !window.SwaggerUIBundle ||
        !window.SwaggerUIStandalonePreset
      ) {
        return false;
      }
      mounted.current = true;
      window.SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          window.SwaggerUIBundle,
          window.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
      });
      return true;
    };
    if (tryRender()) return;
    const iv = window.setInterval(() => {
      if (tryRender()) window.clearInterval(iv);
    }, 100);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <>
      <link rel="stylesheet" href={SWAGGER_CSS} />
      <Script src={SWAGGER_BUNDLE} strategy="afterInteractive" />
      <Script src={SWAGGER_PRESET} strategy="afterInteractive" />
      <main style={{ margin: "-24px" }}>
        <div
          id="swagger-ui"
          style={{ background: "#fafafa", minHeight: "100vh" }}
        />
      </main>
    </>
  );
}
