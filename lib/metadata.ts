import type { Metadata } from "next"

// Canonical site URL used to resolve relative Open Graph URLs.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.chelgaming.com"

export const SITE_NAME = "SCS - Secret Chel Society"

// Default preview image (the league logo) used when a page has no image of its own.
export const DEFAULT_OG_IMAGE =
  "https://kudmtqjzuxakngbrqxzp.supabase.co/storage/v1/object/public/media/SCS_logo-removebg-preview.png"

const DEFAULT_DESCRIPTION = "Welcome to Secret Chel Society."

/**
 * Strip HTML tags and collapse whitespace, then truncate to a clean preview
 * description. Used to turn article/news HTML content into an OG description.
 */
export function toPlainText(input: string | null | undefined, maxLength = 200): string {
  if (!input) return ""
  const text = input
    .replace(/<[^>]*>/g, " ") // remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…"
}

interface BuildMetadataInput {
  title?: string | null
  description?: string | null
  image?: string | null
  /** Path beginning with "/" (e.g. "/news/123"). */
  path?: string
  type?: "website" | "article" | "profile"
}

/**
 * Build a consistent Metadata object with Open Graph + Twitter card tags so
 * shared links render a content-specific preview instead of the site default.
 */
export function buildMetadata({
  title,
  description,
  image,
  path,
  type = "website",
}: BuildMetadataInput): Metadata {
  const resolvedTitle = title ? `${title} | MGHL` : SITE_NAME
  const resolvedDescription = description?.trim() || DEFAULT_DESCRIPTION
  const resolvedImage = image || DEFAULT_OG_IMAGE
  const url = path ? `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}` : SITE_URL

  return {
    title: { absolute: resolvedTitle },
    description: resolvedDescription,
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: resolvedImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
  }
}
