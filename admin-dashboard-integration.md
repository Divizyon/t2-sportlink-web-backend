# Admin Dashboard Integration Guide

This guide explains how to integrate the backend with the frontend to implement role-based access control for the admin dashboard.

## Authentication Flow

1. When an admin logs in, the response will include their role information and dashboard permissions:

```json
{
  "success": true,
  "token": "jwt-token-here",
  "admin": {
    "id": "admin-id",
    "username": "admin-username",
    "role": "superadmin" // or "admin", "editor", "moderator"
    // other fields...
  },
  "dashboardAccess": {
    "hasAccess": true,
    "canCreateAdmins": true // true for superadmin, false for other roles
  }
}
```

2. Store this information in your frontend state management (Redux, Context API, etc.).

## Redirecting to Dashboard

After a successful login:

```javascript
// Example React code with React Router
import { useNavigate } from 'react-router-dom';

const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/api/admin/login', credentials);
    const { success, token, admin, dashboardAccess } = response.data;
    
    if (success) {
      // Store token, admin info and permissions in state/storage
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(admin));
      localStorage.setItem('dashboardAccess', JSON.stringify(dashboardAccess));
      
      // Redirect to dashboard
      navigate('/admin/dashboard');
    }
  } catch (error) {
    // Handle error
  }
};
```

## Dashboard Permission Check

You can verify dashboard permissions at any time by calling:

```
GET /api/admin/dashboard-permissions
```

This returns:

```json
{
  "success": true,
  "dashboardAccess": {
    "hasAccess": true,
    "canCreateAdmins": true // Only true for superadmin role
  }
}
```

## Conditional Rendering in Frontend

Based on the permissions, you can conditionally render admin creation functionality:

```jsx
// Dashboard.jsx
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [permissions, setPermissions] = useState(
    JSON.parse(localStorage.getItem('dashboardAccess') || '{"hasAccess": false, "canCreateAdmins": false}')
  );
  
  // You can also refresh permissions when component mounts
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/api/admin/dashboard-permissions');
        if (response.data.success) {
          setPermissions(response.data.dashboardAccess);
        }
      } catch (error) {
        // Handle error
      }
    };
    
    fetchPermissions();
  }, []);
  
  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Common dashboard elements for all admins */}
      <div className="dashboard-common">
        <h2>Welcome to the Admin Dashboard</h2>
        {/* Other common elements */}
      </div>
      
      {/* Only render admin creation for superadmin */}
      {permissions.canCreateAdmins && (
        <div className="admin-management">
          <h2>Admin Management</h2>
          <button onClick={() => navigate('/admin/create')}>Create New Admin</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
```

## Security Considerations

1. Always verify permissions on the backend for any protected actions
2. Don't rely solely on frontend checks for security
3. Implement proper token validation and expiration
4. Use HTTPS for all API communication 