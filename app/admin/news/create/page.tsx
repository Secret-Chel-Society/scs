"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
// import { motion } from "framer-motion" - disabled due to Next.js 15.2.4 compatibility
import NewsForm from "@/components/news-form"

export default function CreateNewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden py-20 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-ice-blue-200/30 to-rink-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-assist-green-200/30 to-goal-red-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div>
            <h1 className="hockey-title mb-6">
              Create News Article
            </h1>
            <p className="hockey-subtitle mx-auto mb-8">
              Craft engaging content and announcements for the Secret Chel Society community
            </p>
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white px-6 py-3 rounded-full shadow-lg shadow-assist-green-500/25 border-2 border-white dark:border-hockey-silver-800">
              <Newspaper className="h-5 w-5" />
              <span className="font-semibold">Content Creator</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-8">
            <ArrowLeft className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
            <Link href="/admin/news" className="text-hockey-silver-600 dark:text-hockey-silver-400 hover:text-ice-blue-600 dark:hover:text-ice-blue-400 transition-colors duration-300">
              Back to News Management
            </Link>
          </div>

          <Card className="hockey-card">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/30 dark:to-rink-blue-900/30 rounded-full -mr-6 -mt-6 opacity-60"></div>
              <CardTitle className="flex items-center gap-3 text-2xl relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-ice-blue-500/25">
                  <Newspaper className="h-6 w-6 text-white" />
                </div>
                Create News Article
              </CardTitle>
              <CardDescription className="text-lg relative z-10">
                Create a new news article for the Secret Chel Society website
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <NewsForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
