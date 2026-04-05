import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080808",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Background kanji watermark */}
        <div
          style={{
            position: "absolute",
            fontSize: 400,
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: "1px rgba(240, 237, 230, 0.04)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          将軍
        </div>

        {/* SHOGUN wordmark */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#F0EDE6",
            display: "flex",
          }}
        >
          <span>SHO</span>
          <span style={{ color: "#C8A96E" }}>G</span>
          <span>UN</span>
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: 80,
            height: 2,
            background: "linear-gradient(90deg, transparent, #C8A96E, transparent)",
            marginTop: 20,
            marginBottom: 28,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#C8A96E",
            fontWeight: 300,
            letterSpacing: "0.05em",
          }}
        >
          One AI to rule them all.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: "#888880",
            fontWeight: 300,
            marginTop: 12,
          }}
        >
          AI Cloud Computer + Work Memory
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 16,
            color: "#444440",
            letterSpacing: "0.15em",
            fontWeight: 400,
            textTransform: "uppercase",
          }}
        >
          syogun.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
