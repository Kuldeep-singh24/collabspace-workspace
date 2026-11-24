
import "./globals.css";

export const metadata = {
  title: "CollabSpace | Collaborative Workspace",
  description:
    "Real-time collaborative workspace built with Next.js, Yjs, WebSockets, PostgreSQL, Prisma, and Redis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
