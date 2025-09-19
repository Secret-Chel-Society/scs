# Waiver System V3 - Complete Documentation

## Midnight Studios INTl - All rights reserved

## Overview

The Waiver System V3 is a complete rewrite of the waiver management system, designed to handle player waivers, claims, and priority management with robust error handling and modern UI components.

## Features

### Core Functionality
- **Player Waiving**: Teams can place players on waivers with 48-hour claim period
- **Waiver Claims**: Teams can claim waived players based on priority order
- **Priority Management**: Dynamic priority system that updates when teams make claims
- **Automatic Processing**: Cron job processes expired waivers automatically
- **Real-time Updates**: Live status updates and notifications

### User Interface
- **Modern Design**: Clean, hockey-themed interface with blue color palette
- **Responsive Layout**: Works on all device sizes
- **Interactive Components**: Smooth animations and hover effects
- **Status Indicators**: Clear visual feedback for all waiver states
- **Search & Filter**: Easy navigation through waivers and players

## API Endpoints

### `/api/waivers/v3`

#### GET - Fetch Waivers
```typescript
GET /api/waivers/v3?status=active&teamId=uuid
```

**Query Parameters:**
- `status`: Filter by waiver status (active, claimed, cleared, cancelled)
- `teamId`: Include team-specific data like `hasTeamClaimed`

**Response:**
```json
{
  "success": true,
  "waivers": [...],
  "count": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### POST - Waiver Actions
```typescript
POST /api/waivers/v3
{
  "action": "waive_player" | "claim_waiver" | "cancel_waiver" | "process_expired" | "get_team_priority",
  "playerId": "uuid",
  "teamId": "uuid",
  "waiverId": "uuid",
  "userId": "uuid"
}
```

### `/api/waivers/v3/reset-priority`

#### POST - Reset Priority Order
```typescript
POST /api/waivers/v3/reset-priority
```

Resets all team waiver priorities to default alphabetical order.

### `/api/waivers/v3/process`

#### POST - Process Expired Waivers
```typescript
POST /api/waivers/v3/process
```

Manually processes all expired waivers and updates priority order.

### `/api/cron/process-waivers-v3`

#### GET - Cron Job Processing
```typescript
GET /api/cron/process-waivers-v3
Authorization: Bearer {CRON_SECRET}
```

Automated processing of expired waivers (runs every hour).

## Database Schema

### Tables Used

#### `waivers`
- `id`: UUID primary key
- `player_id`: Reference to players table
- `waiving_team_id`: Team placing player on waivers
- `waived_at`: Timestamp when player was waived
- `claim_deadline`: 48 hours from waived_at
- `status`: active, claimed, cleared, cancelled
- `winning_team_id`: Team that claimed the player
- `processed_at`: When waiver was processed

#### `waiver_claims`
- `id`: UUID primary key
- `waiver_id`: Reference to waivers table
- `claiming_team_id`: Team making the claim
- `priority_at_claim`: Team's priority when claim was made
- `status`: pending, approved, rejected
- `created_at`: When claim was submitted

#### `waiver_priority`
- `id`: UUID primary key
- `team_id`: Reference to teams table
- `priority`: Priority number (1 = highest)
- `last_used`: When team last made a claim

## User Interface

### Management Pages

#### `/management/waivers`
Main waiver management interface with tabs for:
- **Active Waivers**: Currently available players
- **Claimed**: Successfully claimed players
- **Cleared**: Players who cleared waivers
- **My Team**: Team roster management

#### `/management/waivers/priority`
Priority management interface showing:
- Current priority order
- Team statistics
- Priority reset functionality
- Usage tracking

### Key Components

#### WaiverCard
Displays individual waiver information with:
- Player details and avatar
- Time remaining countdown
- Claim/cancel actions
- Claims list

#### PriorityDisplay
Shows team priority order with:
- Visual priority indicators
- Last used timestamps
- Priority statistics

## Priority System

### How It Works
1. Teams are ordered by priority number (1 = highest)
2. When a team claims a player, they move to the bottom
3. All other teams move up one position
4. Priority resets at season start

### Priority Rules
- Lower numbers = higher priority
- Ties broken by earliest claim time
- Winning team moves to bottom of list
- Other teams shift up accordingly

## Error Handling

### API Error Responses
All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### Common Error Scenarios
- **404**: Waiver/player not found
- **409**: Team already has claim/player already on waivers
- **500**: Database or server errors

### Client-Side Error Handling
- Toast notifications for user feedback
- Loading states for all async operations
- Graceful fallbacks for missing data

## Security

### Authentication
- All endpoints require valid session
- Team ownership verification
- Role-based access control

### Validation
- Input sanitization
- SQL injection prevention
- XSS protection

## Performance

### Optimization
- Efficient database queries with proper joins
- Client-side caching where appropriate
- Pagination for large datasets
- Optimistic UI updates

### Monitoring
- Comprehensive error logging
- Performance metrics tracking
- User action auditing

## Testing

### Manual Testing Checklist
- [ ] Create waiver for player
- [ ] Claim waiver from different team
- [ ] Cancel waiver before deadline
- [ ] Process expired waivers
- [ ] Reset priority order
- [ ] Verify priority updates after claims

### Automated Testing
- API endpoint testing
- Database constraint validation
- Error scenario coverage

## Deployment

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

### Cron Job Setup
Set up hourly cron job to call:
```
GET /api/cron/process-waivers-v3
Authorization: Bearer {CRON_SECRET}
```

## Migration from V2

### Breaking Changes
- New API endpoints (`/v3/`)
- Updated database schema
- New UI components
- Different error handling

### Migration Steps
1. Deploy new API endpoints
2. Update frontend to use new endpoints
3. Test all functionality
4. Remove old V2 endpoints

## Support

For issues or questions regarding the waiver system, contact the development team at Midnight Studios INTl.

---

**Version**: 3.0.0  
**Last Updated**: January 2024  
**Maintainer**: Midnight Studios INTl Development Team
