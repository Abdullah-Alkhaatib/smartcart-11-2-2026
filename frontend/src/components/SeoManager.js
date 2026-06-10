import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_META = {
  title: "SmartCart | متجر إلكتروني في الكويت",
  description:
    "SmartCart متجر إلكتروني في الكويت لعرض المنتجات والفئات والعروض مع تجربة تسوق سهلة وسريعة.",
  robots: "index, follow",
  keywords:
    "متجر في الكويت, متجر إلكتروني في الكويت, تسوق أونلاين الكويت, منتجات الكويت, SmartCart",
};

const NOINDEX_PATHS = [
  "/login",
  "/register",
  "/cart",
  "/profile",
  "/orders",
  "/search-results",
  "/dashboard",
  "/users",
  "/archived-categories",
  "/archived-products",
  "/logout",
];

function getRouteMeta(pathname) {
  if (pathname.startsWith("/product/")) {
    return {
      title: "تفاصيل المنتج في الكويت | SmartCart",
      description:
        "اطلع على تفاصيل المنتج والصور والسعر والتوفر قبل الشراء من SmartCart في الكويت.",
      robots: "index, follow",
      keywords: "تفاصيل المنتج في الكويت, شراء منتج في الكويت, SmartCart",
    };
  }

  if (pathname === "/products") {
    return {
      title: "جميع المنتجات في الكويت | SmartCart",
      description:
        "تصفح جميع منتجات SmartCart في الكويت واختر من بين أفضل العروض والخيارات المتوفرة.",
      robots: "index, follow",
      keywords: "منتجات في الكويت, جميع المنتجات, متجر إلكتروني الكويت",
    };
  }

  if (pathname === "/categories") {
    return {
      title: "الفئات في الكويت | SmartCart",
      description:
        "استكشف فئات SmartCart في الكويت لتصل إلى المنتج المناسب بسرعة وسهولة.",
      robots: "index, follow",
      keywords: "فئات المنتجات في الكويت, تصفح الفئات, متجر الكويت",
    };
  }

  if (
    NOINDEX_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return {
      title: "SmartCart",
      description: DEFAULT_META.description,
      robots: "noindex, nofollow",
    };
  }

  return DEFAULT_META;
}

function setMetaTag(name, content) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalLink(url) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const routeMeta = getRouteMeta(location.pathname);
    const canonicalUrl = `${window.location.origin}${location.pathname}`;

    document.title = routeMeta.title;
    setMetaTag("description", routeMeta.description);
    setMetaTag("robots", routeMeta.robots);
    setMetaTag("keywords", routeMeta.keywords || DEFAULT_META.keywords);
    setMetaTag("author", "SmartCart");
    setCanonicalLink(canonicalUrl);
  }, [location.pathname]);

  return null;
}
