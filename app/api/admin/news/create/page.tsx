"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import NewsForm from "@/components/news-form"

export default function CreateNewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-2 mb-8">
          <ArrowLeft className="h-5 w-5" />
          <Link href="/admin/news" className="text-muted-foreground hover:text-foreground">
            Back to News Management
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create News Article</CardTitle>
            <CardDescription>Create a new news article for the MGHL website</CardDescription>
          </CardHeader>
          <CardContent>
            <NewsForm />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
