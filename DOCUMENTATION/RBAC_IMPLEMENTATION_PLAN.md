# Enterprise User Management & RBAC Implementation Plan

## Status: IN PROGRESS

### Completed ✅

1. **Permission System** (`src/lib/permissions.ts`)
   - Centralized permission checker
   - Type-safe permission methods
   - Role-based permission matrix
   - Helper functions for UI (badge colors, descriptions)

2. **Backend User Management API** (`backend/app/api/users.py`)
   - GET /users - List users with pagination, search, filters, sorting
   - GET /users/investigators - Get active investigators for case assignment
   - GET /users/{id} - Get user by ID
   - POST /users - Create new user (admin only)
   - PUT /users/{id} - Update user (admin only)
   - POST /users/{id}/activate - Activate user (admin only)
   - POST /users/{id}/deactivate - Deactivate user (admin only)
   - POST /users/{id}/reset-password - Reset password (admin only)
   - GET /users/stats/overview - User statistics (admin only)

3. **Frontend User Management API Service** (`src/services/usersApi.ts`)
   - Complete API client for all user management endpoints
   - TypeScript interfaces for requests/responses

4. **Backend Integration** (`backend/app/main.py`)
   - Users router registered and protected with authentication

### Remaining Tasks 🚧

#### 1. User Management Page (STARTED)
**File**: `src/pages/UsersManagementPage.tsx`
- Professional enterprise table
- Search, filter, sort functionality
- Pagination
- View/Edit/Create user modals
- Activate/Deactivate/Reset Password actions
- Admin-only access

#### 2. Case Assignment Enhancement
**Files**: 
- `src/pages/CreateCasePage.tsx` - Add officer selector
- `src/pages/CaseDetailPage.tsx` - Show assigned officer
- `backend/app/api/cases.py` - Enhanced case assignment endpoint

**Requirements**:
- Load active investigators from `/users/investigators`
- Admin can assign to any investigator
- Investigator auto-assigned to themselves
- Viewer cannot create cases

#### 3. Dashboard Personalization
**File**: `src/pages/DashboardPage.tsx`

**By Role**:
- **Admin**: Total users, online users, cases by investigator, department stats
- **Investigator**: My cases, pending reports, recent activity, high priority cases
- **Viewer**: Read-only metrics

#### 4. Navigation & Routing
**Files**:
- `src/App.tsx` - Add /users route (admin only)
- `src/components/layout/Sidebar.tsx` - Add Administration menu

#### 5. Permission-Based UI
**Apply to all components**:
- Conditionally show/hide actions based on permissions
- Disable buttons for viewers
- Show appropriate messages

### Implementation Steps

#### STEP 1: Complete User Management Page (HIGH PRIORITY)
```typescript
// Components needed:
- UsersList (table with actions)
- UserFilters (search, role filter, status filter)
- UserModal (view/edit user details)
- CreateUserModal (create new user)
- ConfirmDialog (for dangerous actions)
```

#### STEP 2: Update Case Assignment
```typescript
// In CreateCasePage.tsx
- Add officer selector dropdown
- Load investigators from usersApi.getInvestigators()
- Default to current user if investigator
- Admin can select any investigator

// In CaseDetailPage.tsx
- Display assigned officer name
- Show profile photo/initials
- Link to officer profile (if admin)
```

#### STEP 3: Dashboard Personalization
```typescript
// Based on user.role:
if (user.role === 'admin') {
  // Show admin dashboard
  // - Total users, online users
  // - Cases by investigator
  // - Department statistics
  // - System health
}

if (user.role === 'investigator') {
  // Show investigator dashboard
  // - My cases
  // - Pending reports
  // - Recent activity
  // - Assigned high priority cases
}

if (user.role === 'viewer') {
  // Show viewer dashboard (read-only)
  // - Overview metrics
  // - Recent cases (view only)
}
```

#### STEP 4: Add Administration Menu
```typescript
// In Sidebar.tsx
{permissions.canManageUsers() && (
  <NavLink to="/users" icon={Users}>
    User Management
  </NavLink>
)}
```

#### STEP 5: Apply Permissions Throughout
```typescript
// Example usage:
import { usePermissions } from '@/lib/permissions';

const permissions = usePermissions(user.role);

// In component:
{permissions.canCreateCase() && (
  <button onClick={createCase}>Create Case</button>
)}

{permissions.canEditCase() && (
  <button onClick={editCase}>Edit Case</button>
)}

// Disable for viewers:
<button disabled={!permissions.canEditCase()}>
  Edit Case
</button>
```

### API Endpoints Summary

#### User Management
- `GET /users` - List users (paginated, filtered, sorted)
- `GET /users/investigators` - Get active investigators
- `GET /users/{id}` - Get user details
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `POST /users/{id}/activate` - Activate user
- `POST /users/{id}/deactivate` - Deactivate user
- `POST /users/{id}/reset-password` - Reset password
- `GET /users/stats/overview` - User statistics

#### Existing (Enhanced)
- `GET /auth/me` - Current user
- `PUT /auth/profile` - Update own profile
- `POST /auth/change-password` - Change own password

### Database Schema (Already Exists)
```sql
users table:
- id (uuid, primary key)
- full_name (varchar)
- email (varchar, unique)
- username (varchar, unique, nullable)
- password_hash (varchar)
- role (enum: admin, investigator, viewer)
- department (varchar, nullable)
- phone (varchar, nullable)
- profile_photo (text, nullable)
- is_active (boolean)
- failed_login_attempts (int)
- last_login (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Permission Matrix

| Permission | Admin | Investigator | Viewer |
|-----------|-------|--------------|--------|
| Manage Users | ✅ | ❌ | ❌ |
| Create Case | ✅ | ✅ | ❌ |
| Edit Case | ✅ | ✅ (own) | ❌ |
| Delete Case | ✅ | ❌ | ❌ |
| Assign Case | ✅ | ❌ | ❌ |
| Upload Evidence | ✅ | ✅ | ❌ |
| Generate Report | ✅ | ✅ | ❌ |
| Use CrimeGPT | ✅ | ✅ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ |
| View Profile | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ |

### Security Considerations

1. **Admin Self-Protection**: Admin cannot deactivate their own account
2. **Password Security**: Minimum requirements enforced
3. **Soft Delete**: Users are deactivated, not deleted
4. **Failed Attempts**: Track and lock after 5 failed logins
5. **Role-Based Routes**: Backend validates user role for all endpoints
6. **Token Validation**: All requests require valid JWT

### Testing Checklist

#### User Management
- [ ] Admin can view user list
- [ ] Search filters users correctly
- [ ] Pagination works
- [ ] Can create new user
- [ ] Can edit user details
- [ ] Can change user role
- [ ] Can activate user
- [ ] Can deactivate user
- [ ] Can reset user password
- [ ] Cannot deactivate self
- [ ] Non-admin cannot access

#### Case Assignment
- [ ] Investigator selector loads active investigators
- [ ] Admin can assign to any investigator
- [ ] Investigator auto-assigned to self
- [ ] Viewer cannot create cases
- [ ] Assigned officer displayed in case detail

#### Dashboard
- [ ] Admin sees admin dashboard
- [ ] Investigator sees investigator dashboard
- [ ] Viewer sees viewer dashboard
- [ ] Stats are role-specific

#### Permissions
- [ ] Create button hidden for viewers
- [ ] Edit button disabled for viewers
- [ ] Admin menu only visible to admins
- [ ] All permission checks working

### Files to Complete

1. ✅ `src/lib/permissions.ts` - DONE
2. ✅ `backend/app/api/users.py` - DONE
3. ✅ `src/services/usersApi.ts` - DONE
4. ✅ `backend/app/main.py` - DONE
5. 🚧 `src/pages/UsersManagementPage.tsx` - IN PROGRESS
6. ⏳ `src/pages/CreateCasePage.tsx` - TODO (add officer selector)
7. ⏳ `src/pages/CaseDetailPage.tsx` - TODO (show assigned officer)
8. ⏳ `src/pages/DashboardPage.tsx` - TODO (personalize by role)
9. ⏳ `src/App.tsx` - TODO (add /users route)
10. ⏳ `src/components/layout/Sidebar.tsx` - TODO (add admin menu)

### Next Steps

1. **Complete UsersManagementPage.tsx** (1000+ lines)
   - User list table
   - Search and filters
   - Pagination
   - View/Edit/Create modals
   - Action handlers

2. **Update CreateCasePage.tsx**
   - Add officer selector
   - Load investigators
   - Handle assignment

3. **Update DashboardPage.tsx**
   - Add role-based rendering
   - Create admin dashboard
   - Create investigator dashboard
   - Create viewer dashboard

4. **Update Sidebar.tsx**
   - Add Administration section
   - Add User Management link (admin only)

5. **Update App.tsx**
   - Add /users route
   - Protect with admin role check

6. **Apply permissions throughout**
   - Hide/disable buttons based on role
   - Show appropriate UI messages

### Estimated Completion Time

- User Management Page: 2-3 hours
- Case Assignment: 30 minutes
- Dashboard Personalization: 1 hour
- Navigation & Routing: 20 minutes
- Permission UI Updates: 1 hour
- Testing & Bug Fixes: 1 hour

**Total**: ~6 hours of development

### Current Session Summary

**Completed**:
1. ✅ Permission system with centralized checking
2. ✅ Backend user management API (9 endpoints)
3. ✅ Frontend API service
4. ✅ Backend router registration
5. 🚧 Started User Management page

**Status**: Foundation complete, UI implementation in progress
