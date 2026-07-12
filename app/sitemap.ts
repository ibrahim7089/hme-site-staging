import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const routes = [
  "",
  "/about",
  "/be-our-agent",
  "/biz-remit",
  "/career",
  "/compliance",
  "/compliance/aml-policy",
  "/compliance/communication-channels",
  "/compliance/corporate-sustainability",
  "/compliance/customer-charter",
  "/compliance/fees-charges",
  "/compliance/fraud-prevention",
  "/compliance/privacy-policy",
  "/compliance/terms",
  "/contact",
  "/corporate",
  "/currency-booking",
  "/currency-exchange",
  "/faq",
  "/locate-us",
  "/media/blog",
  "/media/news",
  "/money-transfer",
  "/money-transfer-rates",
  "/promotions",
  "/rates",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${site.domain}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route.includes("rates") ? "daily" : "monthly",
    priority: route === "" ? 1 : route.includes("rates") ? 0.9 : 0.7,
  }));
}
