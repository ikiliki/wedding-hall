import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Hall API",
  description: "Backend service for Wedding Hall (health + future APIs).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 24 }}>{children}</body>
    </html>
  );
}
