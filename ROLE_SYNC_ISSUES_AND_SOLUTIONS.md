# Role Synchronization Issues and Solutions

## 🔍 **Problem Analysis**

The SCS application has been experiencing role synchronization issues between the database and website. This document outlines the root causes and provides comprehensive solutions.

## 🚨 **Root Causes**

### 1. **Dual Role System Architecture**
The application uses two separate tables for role management:
- **`user_roles` table**: Stores all user roles (Player, GM, AGM, Owner, Admin)
- **`players` table**: Stores only team-related roles (Player, GM, AGM, Owner) - excludes Admin

### 2. **Role Mismatch During Updates**
When updating user roles through the admin panel:
- All selected roles are inserted into `user_roles` table
- Only the first valid player role is used for `players` table
- This can cause inconsistencies between the two tables

### 3. **Admin Role Handling**
- Admin users don't have player records (by design)
- UI components fetch roles from both tables inconsistently
- Some components prioritize `user_roles`, others prioritize `players`

### 4. **UI Fetching Logic Issues**
Different components fetch roles differently:
- Navigation components fetch from both tables
- Management components primarily use `players` table
- Admin components use `user_roles` table

## 🛠️ **Solutions Implemented**

### 1. **Role Sync Fix API** (`/api/admin/fix-role-sync`)
- **GET**: Check role synchronization status for a specific user
- **POST**: Fix role synchronization for a specific user
- Automatically determines the correct player role based on user roles
- Creates missing player records when needed
- Updates existing player records to match user roles

### 2. **Bulk Role Sync API** (`/api/admin/bulk-fix-role-sync`)
- **POST**: Fix role synchronization for all users
- Supports dry-run mode for testing
- Processes users in batches to avoid rate limits
- Provides detailed results and error reporting

### 3. **Admin Role Sync Page** (`/admin/role-sync`)
- User-friendly interface for managing role synchronization
- Single user fix functionality
- Bulk sync with dry-run capability
- Real-time status checking
- Detailed results display with filtering

### 4. **Role Priority Logic**
Implemented consistent role priority:
1. **Owner** (highest priority)
2. **GM**
3. **AGM**
4. **Player** (default)

## 📋 **How to Use the Solutions**

### **For Single User Fix:**
1. Go to `/admin/role-sync`
2. Enter the user ID
3. Click "Check Status" to see current sync status
4. Click "Fix Sync" to resolve any issues

### **For Bulk Fix:**
1. Go to `/admin/role-sync`
2. Click "Dry Run" to see what would be fixed
3. Review the results
4. Click "Run Fix" to apply the changes

### **API Usage:**
```bash
# Check single user status
GET /api/admin/fix-role-sync?userId=USER_ID

# Fix single user
POST /api/admin/fix-role-sync
{
  "userId": "USER_ID",
  "forceSync": true
}

# Run bulk sync (dry run)
POST /api/admin/bulk-fix-role-sync
{
  "dryRun": true,
  "limit": 100
}

# Run bulk sync (actual fix)
POST /api/admin/bulk-fix-role-sync
{
  "dryRun": false,
  "limit": 100
}
```

## 🔧 **Technical Details**

### **Role Sync Logic:**
```typescript
// Determine player role based on user roles
const VALID_PLAYER_ROLES = ["Player", "GM", "AGM", "Owner"]
let playerRole = "Player" // Default

if (userRoles.includes("Owner")) {
  playerRole = "Owner"
} else if (userRoles.includes("GM")) {
  playerRole = "GM"
} else if (userRoles.includes("AGM")) {
  playerRole = "AGM"
} else if (userRoles.includes("Player")) {
  playerRole = "Player"
}
```

### **Database Schema:**
```sql
-- user_roles table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('Player', 'GM', 'AGM', 'Owner', 'Admin')),
  created_at timestamp with time zone DEFAULT now()
);

-- players table
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('Player', 'GM', 'AGM', 'Owner')),
  salary integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## 🚀 **Prevention Measures**

### 1. **Consistent Role Updates**
- Always update both tables when changing roles
- Use the role sync APIs for any role changes
- Implement validation to ensure consistency

### 2. **UI Component Updates**
- Standardize role fetching across all components
- Use a centralized role management hook
- Implement proper error handling for role mismatches

### 3. **Database Constraints**
- Add foreign key constraints where appropriate
- Implement triggers to maintain consistency
- Regular monitoring of role synchronization

## 📊 **Monitoring and Maintenance**

### **Regular Checks:**
1. Run bulk sync dry-run weekly
2. Monitor for role inconsistencies
3. Check admin panel for sync issues
4. Review error logs for role-related problems

### **Signs of Role Sync Issues:**
- Users can't access features they should have access to
- Admin panel shows incorrect role information
- Navigation shows wrong role-based options
- Team management features not working properly

## 🎯 **Expected Results**

After implementing these solutions:
- ✅ All user roles will be properly synchronized
- ✅ UI components will display correct role information
- ✅ Admin panel will show accurate role data
- ✅ Team management features will work correctly
- ✅ Role-based access control will function properly

## 🔄 **Next Steps**

1. **Immediate**: Run the bulk sync fix to resolve current issues
2. **Short-term**: Update UI components to use consistent role fetching
3. **Long-term**: Implement automated role sync monitoring
4. **Future**: Consider consolidating to a single role table if possible

---

**Note**: This solution maintains backward compatibility while fixing the synchronization issues. All existing functionality will continue to work, but with improved reliability and consistency.
