import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { buildMetadata, toPlainText } from "@/lib/metadata"
import NewsDetailClient from "./news-detail-client"

export const dynamic = "force-dynamic"

async function getArticle(id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase
      .from("news")
      .select("title, content, excerpt, image_url, published")
      .eq("id", id)
      .maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(id)

  if (!article || !article.published) {
    return buildMetadata({
      title: "News",
      description: "The latest news and updates from the Major Gaming Hockey League.",
      path: `/news/${id}`,
      type: "article",
    })
  }

  const description =
    toPlainText(article.excerpt) || toPlainText(article.content) || undefined

  return buildMetadata({
    title: article.title,
    description,
    image: article.image_url || undefined,
    path: `/news/${id}`,
    type: "article",
  })
}

export default function NewsDetailPage() {
  return <NewsDetailClient />
}
