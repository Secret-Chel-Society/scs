// ELO Rating System Calculator
// This handles all ELO rating calculations and match processing

export interface EloMatchResult {
  player1Id: string
  player2Id: string
  player1RatingBefore: number
  player2RatingBefore: number
  player1RatingAfter: number
  player2RatingAfter: number
  player1RatingChange: number
  player2RatingChange: number
  winner: 'player1' | 'player2' | 'draw'
  score: string
}

export interface EloPlayer {
  id: string
  elo_rating: number
  total_matches: number
  wins: number
  losses: number
  draws: number
}

export class EloCalculator {
  private static readonly DEFAULT_K_FACTOR = 32
  private static readonly DEFAULT_INITIAL_RATING = 1200

  /**
   * Calculate ELO rating changes for a match
   */
  static calculateMatch(
    player1: EloPlayer,
    player2: EloPlayer,
    winner: 'player1' | 'player2' | 'draw',
    score: string,
    kFactor: number = this.DEFAULT_K_FACTOR
  ): EloMatchResult {
    const player1Rating = player1.elo_rating
    const player2Rating = player2.elo_rating

    // Calculate expected scores
    const player1Expected = this.calculateExpectedScore(player1Rating, player2Rating)
    const player2Expected = this.calculateExpectedScore(player2Rating, player1Rating)

    // Calculate actual scores
    let player1Actual: number
    let player2Actual: number

    switch (winner) {
      case 'player1':
        player1Actual = 1
        player2Actual = 0
        break
      case 'player2':
        player1Actual = 0
        player2Actual = 1
        break
      case 'draw':
        player1Actual = 0.5
        player2Actual = 0.5
        break
    }

    // Calculate new ratings
    const player1RatingChange = Math.round(kFactor * (player1Actual - player1Expected))
    const player2RatingChange = Math.round(kFactor * (player2Actual - player2Expected))

    const player1RatingAfter = player1Rating + player1RatingChange
    const player2RatingAfter = player2Rating + player2RatingChange

    return {
      player1Id: player1.id,
      player2Id: player2.id,
      player1RatingBefore: player1Rating,
      player2RatingBefore: player2Rating,
      player1RatingAfter,
      player2RatingAfter,
      player1RatingChange,
      player2RatingChange,
      winner,
      score
    }
  }

  /**
   * Calculate expected score for a player
   */
  private static calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
  }

  /**
   * Calculate K-factor based on player rating and experience
   */
  static calculateKFactor(playerRating: number, totalMatches: number): number {
    let kFactor = this.DEFAULT_K_FACTOR

    // Adjust K-factor based on rating
    if (playerRating >= 2400) {
      kFactor = 16
    } else if (playerRating >= 2100) {
      kFactor = 24
    }

    // Adjust K-factor based on experience (newer players get higher K-factor)
    if (totalMatches < 30) {
      kFactor = Math.min(kFactor + 16, 48)
    }

    return kFactor
  }

  /**
   * Calculate points earned/lost based on match result
   */
  static calculatePoints(winner: 'player1' | 'player2' | 'draw', pointsPerWin: number = 3, pointsPerLoss: number = 0, pointsPerDraw: number = 1) {
    switch (winner) {
      case 'player1':
        return { player1Points: pointsPerWin, player2Points: pointsPerLoss }
      case 'player2':
        return { player1Points: pointsPerLoss, player2Points: pointsPerWin }
      case 'draw':
        return { player1Points: pointsPerDraw, player2Points: pointsPerDraw }
    }
  }

  /**
   * Calculate win percentage
   */
  static calculateWinPercentage(wins: number, losses: number, draws: number): number {
    const total = wins + losses + draws
    if (total === 0) return 0
    return Math.round(((wins + (draws * 0.5)) / total) * 100 * 10) / 10
  }

  /**
   * Calculate rank based on ELO rating
   */
  static calculateRank(players: EloPlayer[], playerId: string): number {
    const sortedPlayers = [...players].sort((a, b) => b.elo_rating - a.elo_rating)
    const playerIndex = sortedPlayers.findIndex(p => p.id === playerId)
    return playerIndex === -1 ? 0 : playerIndex + 1
  }

  /**
   * Validate if a match result is reasonable
   */
  static validateMatchResult(result: EloMatchResult): boolean {
    // Check if rating changes are reasonable
    const maxRatingChange = 100
    if (Math.abs(result.player1RatingChange) > maxRatingChange || Math.abs(result.player2RatingChange) > maxRatingChange) {
      return false
    }

    // Check if ratings are positive
    if (result.player1RatingAfter < 0 || result.player2RatingAfter < 0) {
      return false
    }

    // Check if total rating change balances out (approximately)
    const totalChange = result.player1RatingChange + result.player2RatingChange
    if (Math.abs(totalChange) > 5) {
      return false
    }

    return true
  }

  /**
   * Get initial rating for new players
   */
  static getInitialRating(): number {
    return this.DEFAULT_INITIAL_RATING
  }

  /**
   * Calculate rating tier/division
   */
  static getRatingTier(rating: number): string {
    if (rating >= 2400) return 'Grandmaster'
    if (rating >= 2100) return 'Master'
    if (rating >= 1800) return 'Expert'
    if (rating >= 1500) return 'Advanced'
    if (rating >= 1200) return 'Intermediate'
    return 'Beginner'
  }

  /**
   * Calculate rating tier color
   */
  static getRatingTierColor(rating: number): string {
    if (rating >= 2400) return 'text-yellow-400' // Gold
    if (rating >= 2100) return 'text-purple-400' // Purple
    if (rating >= 1800) return 'text-blue-400'   // Blue
    if (rating >= 1500) return 'text-green-400'  // Green
    if (rating >= 1200) return 'text-orange-400' // Orange
    return 'text-gray-400'                        // Gray
  }
}
