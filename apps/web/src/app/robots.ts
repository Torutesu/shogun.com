import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/chat", "/files", "/terminal", "/memory", "/services", "/automations", "/settings", "/billing", "/team", "/onboarding"],
      },
    ],
    sitemap: "https://syogun.com/sitemap.xml",
  };
}
