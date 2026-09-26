import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoWay | USF Day Planner",
    short_name: "MoWay",
    description: "A personalized mobility planner for USF Tampa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f2",
    theme_color: "#173b2b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
