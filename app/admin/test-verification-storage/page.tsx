import { TestVerificationStorage } from "@/components/admin/test-verification-storage"

export default function TestVerificationStoragePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Test Verification Token Storage</h1>
        <p className="text-gray-600 mt-2">Debug tool to test if we can store verification tokens in the database.</p>
      </div>

      <TestVerificationStorage />
    </div>
  )
}
