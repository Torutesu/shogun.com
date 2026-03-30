import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080808",
          borderRadius: 36,
        }}
      >
        <span style={{ color: "#C8A96E", fontSize: 100, fontWeight: 700, letterSpacing: "0.05em" }}>S</span>
      </div>
    ),
    { ...size },
  );
}
