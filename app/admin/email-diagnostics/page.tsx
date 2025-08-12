import { EmailTester } from "@/components/admin/email-tester"
import { SmtpConfigTester } from "@/components/admin/smtp-config-tester"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"

export default function EmailDiagnosticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader heading="Email Diagnostics" subheading="Test and troubleshoot email system configuration" />

      <Tabs defaultValue="tester" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tester">Email Tester</TabsTrigger>
          <TabsTrigger value="configs">SMTP Configurations</TabsTrigger>
        </TabsList>
        <TabsContent value="tester" className="mt-4">
          <EmailTester />
        </TabsContent>
        <TabsContent value="configs" className="mt-4">
          <SmtpConfigTester />
        </TabsContent>
      </Tabs>
    </div>
  )
}
