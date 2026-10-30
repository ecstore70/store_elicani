import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elicani",
    short_name: "Elicani",
    description:
      "Elicani gives your business its own storefront. Products, customers and orders in one place — in any currency.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/brand/elicani-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/elicani-icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/elicani-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
