const express = require("express");
const { Product } = require("../model/ProductModel.js");

const router = express.Router();

function getPublicSiteBaseUrl() {
  const directCandidates = [
    process.env.FRONTEND_URL,
    process.env.PUBLIC_URL,
    process.env.CLIENT_URL,
    process.env.SITE_URL,
  ]
    .filter(Boolean)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const candidate of directCandidates) {
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      return candidate.replace(/\/$/, "");
    }
  }

  const envOrigins = [process.env.CLIENT_URLS, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .filter(
      (origin) =>
        origin.startsWith("https://") && !origin.includes("localhost"),
    );

  if (envOrigins.length > 0) {
    return envOrigins[0].replace(/\/$/, "");
  }

  return "https://smartcart-11-2-2026.netlify.app";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateValue) {
  if (!dateValue) return null;
  return new Date(dateValue).toISOString().split("T")[0];
}

function buildUrlEntry({ loc, lastmod, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
    `    <changefreq>${priority === "1.0" ? "daily" : "weekly"}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = getPublicSiteBaseUrl();
    const products = await Product.find({ isActive: true })
      .select("_id updatedAt")
      .lean();

    const urls = [
      { loc: `${baseUrl}/`, lastmod: null, priority: "1.0" },
      { loc: `${baseUrl}/products`, lastmod: null, priority: "0.9" },
      { loc: `${baseUrl}/categories`, lastmod: null, priority: "0.9" },
      ...products.map((product) => ({
        loc: `${baseUrl}/product/${product._id}`,
        lastmod: formatDate(product.updatedAt),
        priority: "0.8",
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((entry) => buildUrlEntry(entry))
      .join("\n")}\n</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    return res.send(xml);
  } catch (error) {
    return res.status(500).send("Failed to generate sitemap");
  }
});

module.exports = router;
