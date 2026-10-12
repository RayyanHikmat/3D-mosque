import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Abu Bakar Mosque digital twin",
  description: "A 3D digital twin of Abu Bakar Mosque built with CesiumJS and Next.js.",
};

export const viewport: Viewport = {
  themeColor: "#050a14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Cesium's widget styles, copied to public/cesium by scripts/copy-cesium.mjs */}
        <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
