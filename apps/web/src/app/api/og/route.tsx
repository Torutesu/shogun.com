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
        }}
      >
        {/* SHOGUN wordmark */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "#F0EDE6",
          }}
        >
          SHOGUN
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: 80,
            height: 3,
            backgroundColor: "#C8A96E",
            marginTop: 24,
            marginBottom: 32,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#A0A0A0",
            fontWeight: 400,
          }}
        >
          The only AI that knows your work
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#666666",
            letterSpacing: "0.1em",
            fontWeight: 300,
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
