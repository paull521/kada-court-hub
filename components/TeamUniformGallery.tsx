"use client";

import { useState } from "react";
import {
  jerseyArt,
  uniformGalleryLabels,
  uniformToggle,
  uniformGallery,
  uniformPhoto,
  uniformPlaceholder,
} from "@/components/ui/shared-classes";

export default function TeamUniformGallery({
  teamName,
  jerseyNumber,
  nextGameUniform,
  darkImage,
  lightImage,
}: {
  teamName: string;
  jerseyNumber: number;
  nextGameUniform: string;
  darkImage: string;
  lightImage: string;
}) {
  const initial = nextGameUniform.toLowerCase().includes("dark") ? "dark" : "light";
  const [variant, setVariant] = useState<"dark" | "light">(initial);
  const image = variant === "dark" ? darkImage : lightImage;
  return (
    <div className={uniformGallery}>
      <div className={uniformToggle} role="group" aria-label="Uniform color">
        <button
          type="button"
          className={variant === "dark" ? "active" : ""}
          onClick={() => setVariant("dark")}
          disabled={!darkImage && Boolean(lightImage)}
        >
          Dark
        </button>
        <button
          type="button"
          className={variant === "light" ? "active" : ""}
          onClick={() => setVariant("light")}
          disabled={!lightImage && Boolean(darkImage)}
        >
          Light
        </button>
      </div>
      {image ? (
        <div className={uniformPhoto}>
          <img src={image} alt={`${teamName} ${variant} uniform reference`} />
          <span>{variant === "dark" ? "Dark" : "Light"}</span>
        </div>
      ) : (
        <div className={uniformPlaceholder}>
          <span className={jerseyArt}>{jerseyNumber || "—"}</span>
          <p>Official division uniform photo coming soon.</p>
        </div>
      )}
      <div className={uniformGalleryLabels}>
        <span>
          <small>NEXT GAME</small>
          <b>{nextGameUniform}</b>
        </span>
        <span>
          <small>DARK</small>
          <b>{darkImage ? "Photo available" : "Photo coming soon"}</b>
        </span>
        <span>
          <small>LIGHT</small>
          <b>{lightImage ? "Photo available" : "Photo coming soon"}</b>
        </span>
      </div>
    </div>
  );
}
