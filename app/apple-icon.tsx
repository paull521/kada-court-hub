import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#071f3d",
        color: "#f2ad25",
        fontSize: 100,
        fontWeight: 900,
        border: "8px solid #d11f26",
        borderRadius: 40,
      }}
    >
      K
    </div>,
    size,
  );
}
