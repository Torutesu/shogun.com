import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SHOGUN",
    short_name: "SHOGUN",
    description: "The only AI that knows your work. Personal AI Cloud Computer + Work Memory.",
    start_url: "/chat",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#C8A96E",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
