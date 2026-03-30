import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080808",
          borderRadius: 4,
        }}
      >
        <span style={{ color: "#C8A96E", fontSize: 18, fontWeight: 700 }}>S</span>
      </div>
    ),
    { ...size },
  );
}
