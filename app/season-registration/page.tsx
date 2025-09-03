"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { 
  Calendar, 
  Crown, 
  Medal, 
  Star, 
  Target, 
  TrendingUp, 
  Zap, 
  Shield,
  Gamepad2,
  Activity,
  BarChart3,
  Clock,
  Coins,
  Gift,
  Heart,
  Flame,
  Lightning,
  UserPlus,
  UserCheck,
  UserX,
  ExternalLink,
  Share2,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  Trophy,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Download,
  Upload,
  Send,
  Save
} from "lucide-react"
import Link from "next/link"

interface SeasonInfo {
  id: string
  name: string
  start_date: string
  end_date: string
  registration_deadline: string
  max_teams: number
  current_registrations: number
  status: "open" | "closing-soon" | "closed" | "full"
  entry_fee: number
  prize_pool: number
  requirements: string[]
  rules: string[]
}

interface RegistrationForm {
  team_name: string
  captain_name: string
  captain_email: string
  captain_discord: string
  team_size: number
  experience_level: string
  preferred_schedule: string
  team_description: string
  agree_to_rules: boolean
  agree_to_terms: boolean
}

const mockSeasonInfo: SeasonInfo = {
  id: "2",
  name: "Season 2",
  start_date: "2024-02-01",
  end_date: "2024-05-31",
  registration_deadline: "2024-01-25",
  max_teams: 32,
  current_registrations: 28,
  status: "closing-soon",
  entry_fee: 50,
  prize_pool: 5000,
  requirements: [
    "Team must have minimum 12 players",
    "All players must be 18+ years old",
    "Captain must have Discord account",
    "Team must commit to full season schedule",
    "Entry fee must be paid before deadline"
  ],
  rules: [
    "NHL 26 gameplay rules apply",
    "Matches scheduled weekly on designated days",
    "Teams must field minimum 6 players per match",
    "Substitutions allowed between periods",
    "Disputes resolved by league officials",
    "Code of conduct must be followed"
  ]
}

const experienceLevels = [
  "Beginner (0-1 years)",
  "Intermediate (1-3 years)",
  "Advanced (3-5 years)",
  "Expert (5+ years)"
]

const schedulePreferences = [
  "Weekday evenings (Mon-Thu)",
  "Weekend afternoons (Sat-Sun)",
  "Weekend evenings (Fri-Sat)",
  "Flexible - any time",
  "Specific days only"
]

export default function SeasonRegistrationPage() {
  const [formData, setFormData] = useState<RegistrationForm>({
    team_name: "",
    captain_name: "",
    captain_email: "",
    captain_discord: "",
    team_size: 12,
    experience_level: "",
    preferred_schedule: "",
    team_description: "",
    agree_to_rules: false,
    agree_to_terms: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const daysUntilDeadline = Math.ceil(
    (new Date(mockSeasonInfo.registration_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="badge-regular"><CheckCircle className="h-3 w-3 mr-1" />Open</Badge>
      case "closing-soon":
        return <Badge className="badge-playoff"><Clock className="h-3 w-3 mr-1" />Closing Soon</Badge>
      case "closed":
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>
      case "full":
        return <Badge className="badge-champion"><Users className="h-3 w-3 mr-1" />Full</Badge>
      default:
        return <Badge className="badge-regular">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "hockey-green"
      case "closing-soon": return "hockey-orange"
      case "closed": return "hockey-red"
      case "full": return "hockey-gold"
      default: return "hockey-silver"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleInputChange = (field: keyof RegistrationForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setShowSuccess(true)
    
    // Reset form after success
    setTimeout(() => {
      setShowSuccess(false)
      setFormData({
        team_name: "",
        captain_name: "",
        captain_email: "",
        captain_discord: "",
        team_size: 12,
        experience_level: "",
        preferred_schedule: "",
        team_description: "",
        agree_to_rules: false,
        agree_to_terms: false
      })
    }, 5000)
  }

  const isFormValid = () => {
    return (
      formData.team_name.trim() !== "" &&
      formData.captain_name.trim() !== "" &&
      formData.captain_email.trim() !== "" &&
      formData.captain_discord.trim() !== "" &&
      formData.experience_level !== "" &&
      formData.preferred_schedule !== "" &&
      formData.agree_to_rules &&
      formData.agree_to_terms
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="enhanced-card text-center p-12 max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Registration Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your team has been successfully registered for {mockSeasonInfo.name}. 
              You will receive a confirmation email shortly.
            </p>
            <Button className="btn-championship" onClick={() => setShowSuccess(false)}>
              Continue
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-gold/20 via-hockey-orange/20 to-hockey-gold/20 border-b border-hockey-gold/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-gold/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-gold/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-orange/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-gold to-hockey-orange rounded-xl">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">Season Registration</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join the ultimate NHL 26 competitive experience. Register your team for {mockSeasonInfo.name} 
              and compete for glory in the Secret Chel Society.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-gold to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-gold to-hockey-orange rounded-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <span>Team Registration Form</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Team Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-hockey-blue">Team Information</h3>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Team Name *</label>
                        <Input
                          placeholder="Enter your team name"
                          value={formData.team_name}
                          onChange={(e) => handleInputChange("team_name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Team Size *</label>
                          <Select 
                            value={formData.team_size.toString()} 
                            onValueChange={(value) => handleInputChange("team_size", parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[12, 13, 14, 15, 16, 17, 18, 19, 20].map(size => (
                                <SelectItem key={size} value={size.toString()}>
                                  {size} Players
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Experience Level *</label>
                          <Select 
                            value={formData.experience_level} 
                            onValueChange={(value) => handleInputChange("experience_level", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                            <SelectContent>
                              {experienceLevels.map(level => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Preferred Schedule *</label>
                        <Select 
                          value={formData.preferred_schedule} 
                          onValueChange={(value) => handleInputChange("preferred_schedule", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule preference" />
                          </SelectTrigger>
                          <SelectContent>
                            {schedulePreferences.map(schedule => (
                              <SelectItem key={schedule} value={schedule}>
                                {schedule}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Team Description</label>
                        <Textarea
                          placeholder="Tell us about your team, playing style, goals, etc."
                          value={formData.team_description}
                          onChange={(e) => handleInputChange("team_description", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Captain Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-hockey-green">Captain Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Captain Name *</label>
                          <Input
                            placeholder="Enter captain's full name"
                            value={formData.captain_name}
                            onChange={(e) => handleInputChange("captain_name", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Email Address *</label>
                          <Input
                            type="email"
                            placeholder="Enter captain's email"
                            value={formData.captain_email}
                            onChange={(e) => handleInputChange("captain_email", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Discord Username *</label>
                        <Input
                          placeholder="Enter Discord username (e.g., username#1234)"
                          value={formData.captain_discord}
                          onChange={(e) => handleInputChange("captain_discord", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Agreements */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-hockey-purple">Agreements</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="rules"
                            checked={formData.agree_to_rules}
                            onCheckedChange={(checked) => handleInputChange("agree_to_rules", checked)}
                            required
                          />
                          <label htmlFor="rules" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            I have read and agree to follow all league rules and regulations *
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms"
                            checked={formData.agree_to_terms}
                            onCheckedChange={(checked) => handleInputChange("agree_to_terms", checked)}
                            required
                          />
                          <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            I agree to the terms and conditions and code of conduct *
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full btn-championship"
                        disabled={!isFormValid() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Registration
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Season Information Sidebar */}
          <div className="space-y-6">
            {/* Season Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 bg-gradient-to-r from-${getStatusColor(mockSeasonInfo.status)} to-hockey-orange rounded-lg`}>
                      <Info className="h-5 w-5 text-white" />
                    </div>
                    <span>Season Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      {getStatusBadge(mockSeasonInfo.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registration Deadline</span>
                      <span className="font-semibold">{formatDate(mockSeasonInfo.registration_deadline)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Days Remaining</span>
                      <span className={`font-bold ${daysUntilDeadline <= 7 ? "text-hockey-red" : "text-hockey-green"}`}>
                        {daysUntilDeadline} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teams Registered</span>
                      <span className="font-semibold">
                        {mockSeasonInfo.current_registrations}/{mockSeasonInfo.max_teams}
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-hockey-green to-hockey-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(mockSeasonInfo.current_registrations / mockSeasonInfo.max_teams) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Season Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span>Season Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Season</span>
                      <span className="font-semibold">{mockSeasonInfo.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="font-semibold">{formatDate(mockSeasonInfo.start_date)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">End Date</span>
                      <span className="font-semibold">{formatDate(mockSeasonInfo.end_date)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Entry Fee</span>
                      <span className="font-bold text-hockey-gold">{formatCurrency(mockSeasonInfo.entry_fee)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Prize Pool</span>
                      <span className="font-bold text-hockey-gold">{formatCurrency(mockSeasonInfo.prize_pool)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <span>Requirements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-2">
                    {mockSeasonInfo.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-hockey-green mt-0.5 flex-shrink-0" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="enhanced-card">
                <CardHeader className="enhanced-card-header">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-hockey-purple to-hockey-pink rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Button className="w-full btn-ice" variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Rules
                    </Button>
                    <Button className="w-full btn-ice" variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View FAQ
                    </Button>
                    <Button className="w-full btn-ice" variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="enhanced-card bg-gradient-to-br from-hockey-gold/20 via-hockey-orange/10 to-transparent">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-hockey-gold to-hockey-orange rounded-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Ready to Compete?</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Don't miss your chance to join the most competitive NHL 26 league. 
                Register now and start your journey to the championship.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="btn-championship">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register Your Team
                </Button>
                <Button className="btn-ice" variant="outline">
                  <Info className="h-5 w-5 mr-2" />
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
