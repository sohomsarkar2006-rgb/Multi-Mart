# MultiMart Authentication System Summary

## Admin Access
- **Single Admin Account**: Only one admin credential exists
  - Email: admin@gmail.com
  - Password: 123456
  - Role: admin
- **No Registration**: Admin registration disabled for security
- **Login Method**: Email + password authentication
- **Fallback**: Local authentication when backend unavailable

## User Registration
- **Open Registration**: Users can register new accounts
- **Roles Supported**: customer, vendor
- **Validation**: Email uniqueness, password confirmation
- **Storage**: LocalStorage with session management

## Vendor Registration
- **Open Registration**: Vendors can register new accounts
- **Required Fields**: Email, password, store name, store address
- **Validation**: Business information verification
- **Role**: vendor

## Security Features
- **Session Management**: JWT tokens with localStorage fallback
- **Role-Based Access**: Different permissions for admin, vendor, customer
- **Password Security**: Hashed passwords in backend
- **Session Timeout**: Automatic logout on session expiry

## API Integration
- **Primary**: Backend API authentication
- **Fallback**: Local authentication when API unavailable
- **Token Management**: Automatic token storage and refresh
- **Error Handling**: Graceful degradation with user notifications

## Database Schema
- **Users Table**: id, email, password, role, name, storeName, storeAddress
- **Platform Settings**: Dynamic configuration management
- **Sessions**: Token-based authentication tracking

This system provides secure, role-based access control with proper fallback mechanisms for offline functionality.
