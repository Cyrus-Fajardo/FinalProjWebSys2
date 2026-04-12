# KapeKONEK Project Architecture

## System Overview

KapeKONEK is a full-stack MERN marketplace application with the following architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Browser                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                   React Frontend                              │
│  (Components, Pages, CSS Styling)                             │
│  - Login/Register Pages                                       │
│  - Marketplace Dashboard                                      │
│  - User Management                                            │
│  - Farmer Profile Management                                  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────────┐
│              Express.js Backend                               │
│  - Authentication Routes                                      │
│  - Product Management Routes                                  │
│  - User Management Routes                                     │
│  - Farmer Management Routes                                   │
│  - JWT Middleware & Auth                                      │
│  - RBAC Authorization                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────────┐
│              MongoDB Database                                 │
│  - Users Collection                                           │
│  - Products Collection                                        │
│  - Farmers Collection                                         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Authentication Flow
```
User Input (Email/Password/Role)
          ↓
Frontend: Login Page Component
          ↓
POST /api/login
          ↓
Backend: authController.login()
          ↓
Database Query: Find User by Email
          ↓
Validate Role Match
          ↓
Compare Password (bcrypt)
          ↓
Generate JWT Token
          ↓
Return Token + User Data
          ↓
Frontend: Store in localStorage
          ↓
Redirect to Dashboard
```

### Product Purchase Flow
```
User Selects Product
          ↓
Click "Buy Now"
          ↓
POST /api/products/buy
          ↓
Backend: productController.buyProduct()
          ↓
Database: Check product quantity
          ↓
Reduce quantity by 1
          ↓
If quantity = 0, remove product from DB
          ↓
Frontend: Refresh product list
```

### Marketplace Product Listing
```
GET /api/products (with Auth Token)
          ↓
Backend: Check user role
          ↓
Query Products from DB
          ↓
Populate seller information
          ↓
Return Product Array
          ↓
Frontend: Render Product Cards
```

## Folder Structure Details

### Backend Organization

```
backend/
├── models/                 # MongoDB Schemas
│   ├── User.js            # User schema with roles
│   ├── Product.js         # Product schema with variants
│   └── Farmer.js          # Farmer profiles schema
│
├── controllers/           # Business Logic
│   ├── authController.js  # Login/Register logic
│   ├── userController.js  # User CRUD operations
│   ├── productController.js # Product operations
│   └── farmerController.js # Farmer profile operations
│
├── routes/                # API Endpoints
│   ├── authRoutes.js      # /api/auth/*
│   ├── userRoutes.js      # /api/users/*
│   ├── productRoutes.js   # /api/products/*
│   └── farmerRoutes.js    # /api/farmers/*
│
├── middleware/            # Custom Middleware
│   ├── auth.js            # JWT verification
│   └── errorHandler.js    # Error handling
│
├── server.js              # Express app setup
├── package.json           # Dependencies
└── .env                   # Environment variables
```

### Frontend Organization

```
frontend/
├── src/
│   ├── pages/             # Page Components
│   │   ├── Login.js       # Authentication page
│   │   ├── Register.js    # Registration page
│   │   ├── Marketplace.js # Product marketplace
│   │   ├── ManageUsers.js # User management
│   │   └── ManageFarmers.js # Farmer profiles
│   │
│   ├── components/        # Reusable Components
│   │   ├── Sidebar.js     # Navigation sidebar
│   │   └── ProtectedRoute.js # Route protection
│   │
│   ├── css/               # Styling
│   │   ├── global.css     # Global styles
│   │   ├── Login.css      # Login page styles
│   │   ├── Register.css   # Register styles
│   │   ├── Marketplace.css  # Marketplace styles
│   │   ├── ManageUsers.css  # User management styles
│   │   ├── ManageFarmers.css # Farmer profile styles
│   │   └── Sidebar.css    # Sidebar styles
│   │
│   ├── js/                # Utilities
│   │   ├── api.js         # API functions
│   │   └── auth.js        # Auth utilities
│   │
│   ├── App.js             # Main React component
│   └── index.js           # React DOM rendering
│
├── public/
│   └── index.html         # HTML entry point
└── package.json           # Dependencies
```

## Database Schema Relationships

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ _id (PK)        │◄──┐
│ fullname        │   │
│ email (Unique)  │   │
│ password        │   │
│ role            │   │
│ createdAt       │   │
└─────────────────┘   │
        ▲             │
        │             │
        │ References  │
        │             │
┌───────┴──────────────┴──┐
│      Farmers            │
├───────────────────────┤
│ _id (PK)              │
│ userId (FK) ──────────┘
│ farmerName            │
│ farmName              │
│ farmSize              │
│ varietiesAvailable[]  │
│ location              │
│ createdAt/updatedAt   │
└───────────────────────┘

        ▲
        │ References
        │
┌───────┴──────────────────┐
│      Products            │
├─────────────────────────┤
│ _id (PK)                │
│ productType             │
│ variety                 │
│ quantity                │
│ unit (enum)             │
│ sellerId (FK) ──────────┘
│ sellerRole              │
│ price                   │
│ description             │
│ dateListed              │
└─────────────────────────┘
```

## User Roles & Permissions Matrix

| Feature | Farmer | Buyer | Kaluppa | DTI | Group Manager |
|---------|--------|-------|---------|-----|---------------|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Marketplace | ✓ | ✓ | ✓ | ✗ | ✗ |
| Buy Products | ✓ | ✓ | ✓ | ✗ | ✗ |
| Sell Products | ✓ | ✗ | ✓ | ✗ | ✗ |
| Manage Farmer Profiles | ✓ | ✗ | ✓ | ✓ | ✓ |
| Manage Users | ✗ | ✗ | ✓ | ✓ | ✗ |
| Batch Update Farmers | ✗ | ✗ | ✓ | ✓ | ✓ |

## API Endpoint Categories

### Authentication (Public)
- `POST /api/login` - Login endpoint
- `POST /api/register` - Register endpoint

### Products (Protected)
- `GET /api/products` - List products
- `POST /api/products` - Create product (Farmer/Kaluppa Foundation)
- `POST /api/products/buy` - Buy product
- `DELETE /api/products/:productId` - Delete product

### Users (Protected - Admin)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PATCH /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Farmers (Protected)
- `GET /api/farmers` - List all farmers
- `GET /api/farmers/:farmerId` - Get single farmer
- `POST /api/farmers` - Create farmer profile
- `PATCH /api/farmers/:farmerId` - Update farmer profile
- `PATCH /api/farmers/batch/update` - Batch update farmers

## Security Features

### Authentication
- JWT token-based authentication
- Token stored in localStorage
- Automatic token refresh not implemented (consider for future)
- Token expiration: 24 hours

### Authorization
- Role-Based Access Control (RBAC)
- Middleware to verify roles
- Frontend route protection
- Backend endpoint protection

### Password Security
- bcryptjs hashing (salt rounds: 10)
- Passwords never returned in responses
- Minimum length validation (6 characters)

### Data Validation
- Email format validation
- Required field validation
- Email uniqueness check
- Role enumeration enforcement

## Deployment Architecture

### Vercel Deployment Structure
```
┌─────────────────────────────────────────┐
│         Vercel Edge Network              │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ React Build  │  │ Node.js API  │    │
│  │   (Static)   │  │ (Serverless) │    │
│  └──────────────┘  └──────────────┘    │
│                                          │
└────────────┬─────────────────────────────┘
             │ HTTPS
             │
   ┌─────────▼─────────┐
   │ MongoDB Atlas     │
   │ (Document DB)     │
   └───────────────────┘
```

### Environment Variables
- Production uses Vercel secrets
- Database connection pooling
- Secure JWT secret management
- CORS configured for production domain

## Performance Considerations

### Frontend Optimization
- React Router lazy loading (can be added)
- Component memoization (can be added)
- CSS organization by component
- Minimal dependencies

### Backend Optimization
- MongoDB indexes on frequently queried fields
- Lean queries (select specific fields)
- Connection pooling
- Error handling & logging

### Database Optimization
- Index on User.email
- Index on Product.sellerId
- Index on Farmer.userId
- Query optimization for list operations

## Future Enhancement Opportunities

1. **Payment Integration** - Stripe/PayPal
2. **Real-time Notifications** - Socket.io
3. **Product Reviews** - Rating system
4. **Image Upload** - AWS S3/Cloudinary
5. **Advanced Search** - Elasticsearch
6. **Analytics Dashboard** - Charts & graphs
7. **Bulk Operations** - CSV import/export
8. **Email Notifications** - SendGrid/Nodemailer
9. **Two-Factor Authentication** - TOTP/SMS
10. **API Documentation** - Swagger/OpenAPI

---

For more details, refer to specific component documentation in each folder.
