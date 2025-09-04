import type { Metadata } from "next"
import PasswordResetForm from "@/components/admin/password-reset-form"
import { Key, Shield, Users, Lock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export const metadata: Metadata = {
  title: "Reset User Password | SCS Admin",
  description: "Reset a user's password by email address",
}

export default function ResetUserPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ice-blue-50 via-white to-rink-blue-50 dark:from-hockey-silver-900 dark:via-hockey-silver-800 dark:to-rink-blue-900/30">
      {/* Enhanced Hero Header Section */}
      <div className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-hockey-pattern opacity-5"></div>
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-ice-blue-500/20 to-rink-blue-500/20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-assist-green-500/20 to-goal-red-500/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-hockey-silver-500/20 to-ice-blue-500/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-full shadow-2xl shadow-ice-blue-500/30">
              <Key className="h-16 w-16 text-white" />
            </div>
          </div>
          
          <h1 className="hockey-title mb-4">
            Reset User Password
          </h1>
          <p className="hockey-subtitle mb-8">
            Use this form to reset a user's password. The user will be able to log in with the new password immediately.
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-ice-blue-200/50 dark:border-rink-blue-700/50">
              <Shield className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Admin Only</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-assist-green-100/50 to-assist-green-100/50 dark:from-assist-green-900/20 dark:to-assist-green-900/20 px-4 py-2 rounded-full border border-assist-green-200/50 dark:border-assist-green-700/50">
              <Users className="h-4 w-4 text-assist-green-600 dark:text-assist-green-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">User Management</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-rink-blue-100/50 to-rink-blue-100/50 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 px-4 py-2 rounded-full border border-rink-blue-200/50 dark:border-rink-blue-700/50">
              <Lock className="h-4 w-4 text-rink-blue-600 dark:text-rink-blue-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Secure Reset</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-hockey-silver-100/50 to-hockey-silver-100/50 dark:from-hockey-silver-900/20 dark:to-hockey-silver-900/20 px-4 py-2 rounded-full border border-hockey-silver-200/50 dark:border-hockey-silver-700/50">
              <RefreshCw className="h-4 w-4 text-hockey-silver-600 dark:text-hockey-silver-400" />
              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Immediate Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-12">
        <PasswordResetForm />
      </div>
    </div>
  )
}
