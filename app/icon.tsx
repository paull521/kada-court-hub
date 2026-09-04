import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
        fontSize: 280,
        fontWeight: 900,
        border: "20px solid #d11f26",
        borderRadius: 110,
      }}
    >
      K
    </div>,
    size,
  );
}
