import { PublicBiddingRecap } from "@/components/free-agency/public-bidding-recap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Gavel, 
  Clock, 
  TrendingUp, 
  Star, 
  Trophy, 
  Users, 
  Award, 
  Activity,
  BarChart3,
  Coins,
  Gift,
  Heart,
  Flame,
  Lightning,
  Zap,
  Target,
  Crown,
  Medal,
  Shield,
  Gamepad2,
  DollarSign,
  TrendingDown,
  UserPlus,
  UserCheck
} from "lucide-react"

export default function BiddingRecapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-hockey-ice/5 to-hockey-ice/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-hockey-orange/20 via-hockey-gold/20 to-hockey-orange/20 border-b border-hockey-orange/20">
        <div className="absolute inset-0 bg-gradient-to-r from-hockey-orange/5 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-hockey-orange/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-hockey-gold/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-hockey-orange to-hockey-gold rounded-xl">
                <Gavel className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold hockey-gradient-text">Bidding Recap</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Track the latest free agency activity and bidding wars in the Secret Chel Society. 
              See which teams are making moves and which players are in high demand.
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-hockey-orange to-transparent rounded-full mx-auto" />
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Free Agency Activity</h2>
              <p className="text-muted-foreground">Latest bidding activity and player movement in the SCS</p>
            </div>
            <div className="flex gap-2">
              <Button className="btn-ice" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button className="btn-championship">
                <TrendingUp className="h-4 w-4 mr-2" />
                Track Bids
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bidding Overview Cards */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="enhanced-card">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-green to-hockey-blue rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-hockey-green mb-1">24</div>
                <div className="text-sm text-muted-foreground">Active Bids</div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-blue to-hockey-purple rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-hockey-blue mb-1">$2.4M</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-gold to-hockey-orange rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-hockey-gold mb-1">8</div>
                <div className="text-sm text-muted-foreground">Players Signed</div>
              </CardContent>
            </Card>

            <Card className="enhanced-card">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-hockey-purple to-hockey-pink rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-hockey-purple mb-1">12h</div>
                <div className="text-sm text-muted-foreground">Avg. Bid Time</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Bidding Recap Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PublicBiddingRecap />
        </motion.div>
      </div>
    </div>
  )
}
