import { Suspense } from "react"
import { FreeAgencyList } from "@/components/free-agency/free-agency-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default function FreeAgencyPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Free Agents</CardTitle>
          <CardDescription>Browse and bid on available players</CardDescription>
                </CardHeader>
                <CardContent>
                  <FreeAgencyList searchParams={searchParams} />
                </CardContent>
              </Card>
    </div>
  )
}
