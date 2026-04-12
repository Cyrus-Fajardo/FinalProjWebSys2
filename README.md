# KapeKONEK - Coffee Marketplace MERN Stack

A comprehensive marketplace application for buying and selling coffee products (coffee cherries, coffee seedlings, fertilizers, and processed coffee). Built with the MERN stack (MongoDB, Express.js, React, Node.js) with full Role-Based Access Control (RBAC).

## 🌟 Features

### Authentication & Authorization
- Role-based access control (RBAC) for 5 user roles
- Secure login and registration system
- JWT token-based authentication
- MongoDB-backed user authentication

### User Roles
1. **Kaluppa Foundation** - Admin role for managing platform
2. **DTI** - Admin role for user management
3. **Group Manager** - Manager role for farmer profiles
4. **Farmer** - Basic user role for selling agricultural products
5. **Buyer** - Basic user role for purchasing products

### Pages & Functionality

#### 1. **Login Page**
- Email address input
- Password input
- Role selection dropdown
- Validation: email check → role check → password verification
- Error messages for each validation step
- Link to registration page

#### 2. **Register Page**
- Full name input
- Email address input
- Password input
- Role selection (Farmers and Buyers only)
- Details added to MongoDB
- Auto-login after registration

#### 3. **Marketplace Page**
- Browse available products from MongoDB
- Sell products (role-based availability)
- Buy products (removes from inventory)
- Product display with: type, variety, quantity, price, seller info, date listed
- Product forms with conditional fields based on product type

**Selling Rules:**
- **Farmers**: Can sell Coffee Cherries and Coffee Seedlings
- **Kaluppa Foundation**: Can sell Processed Coffee, Fertilizers, and Coffee Seedlings

**Product Fields:**
- Coffee Seedlings: quantity (pieces), variety
- Coffee Cherries: variety, quantity (kg)
- Processed Coffee: variety, quantity (kg)
- Fertilizers: quantity (bags)

#### 4. **Manage Users Page**
- Access: Kaluppa Foundation & DTI only
- View all user accounts with details
- Create new user accounts
- Edit user information
- Delete user accounts
- Save button for patching changes

#### 5. **Manage Farmer Profiles Page**
- Access: Kaluppa Foundation, DTI, Group Managers, and Farmers
- View farmer profiles with details:
  - Farmer's name
  - Farm name
  - Farm size (with unit)
  - Varieties available
  - Farm location
- Edit farmer profiles
- Batch update records (Group Managers)

### Sidebar Navigation

**Kaluppa Foundation Menu:**
- Login
- Marketplace
- Manage Farmer Profile
- Manage Users

**DTI Menu:**
- Login
- Manage Farmer Profile
- Manage Users

**Group Managers Menu:**
- Login
- Manage Farmer Profiles

**Farmers Menu:**
- Login
- Register
- Manage Farmer Profile
- Marketplace

**Buyers Menu:**
- Login
- Register
- Marketplace

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests
- **Dotenv** for environment variables

### Frontend
- **React 18.2.0**
- **React Router v6** for navigation
- **Axios** for API calls
- **CSS3** with earthy coffee theme

## 📋 Project Structure

```
KapeKONEK/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Farmer.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   └── farmerRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   └── farmerController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Marketplace.js
│   │   │   ├── ManageUsers.js
│   │   │   └── ManageFarmers.js
│   │   ├── components/
│   │   │   ├── Sidebar.js
│   │   │   └── ProtectedRoute.js
│   │   ├── css/
│   │   │   ├── global.css
│   │   │   ├── Login.css
│   │   │   ├── Register.css
│   │   │   ├── Marketplace.css
│   │   │   ├── ManageUsers.css
│   │   │   ├── ManageFarmers.css
│   │   │   └── Sidebar.css
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── package.json
├── vercel.json
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/KapeKONEK.git
cd KapeKONEK
```

2. **Install dependencies**
```bash
# Install all dependencies for both frontend and backend
npm run install-all
```

3. **Configure environment variables**

**Backend (.env)**
```
MONGODB_URI=mongodb://localhost:27017/kapekonek
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
NODE_ENV=development
```

**Frontend (.env - if needed)**
```
REACT_APP_API_URL=http://localhost:5000
```

4. **Start the development servers**

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Farmers & Buyers only)

### Users
- `GET /api/users` - Get all users (DTI, Kaluppa Foundation)
- `POST /api/users` - Create user (DTI, Kaluppa Foundation)
- `PATCH /api/users/:userId` - Update user (DTI, Kaluppa Foundation)
- `DELETE /api/users/:userId` - Delete user (DTI, Kaluppa Foundation)

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add product (Farmers, Kaluppa Foundation)
- `POST /api/products/buy` - Buy product
- `DELETE /api/products/:productId` - Delete product

### Farmers
- `GET /api/farmers` - Get all farmer profiles
- `GET /api/farmers/:farmerId` - Get single farmer profile
- `POST /api/farmers` - Create farmer profile
- `PATCH /api/farmers/:farmerId` - Update farmer profile
- `PATCH /api/farmers/batch/update` - Batch update farmers

## 🔐 Database Schema

### User Model
```javascript
{
  fullname: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: Kaluppa Foundation, DTI, Group Manager, Farmer, Buyer),
  createdAt: Date
}
```

### Product Model
```javascript
{
  productType: String (enum: Coffee Seedlings, Coffee Cherries, Processed Coffee, Fertilizers),
  variety: String,
  quantity: Number,
  unit: String (enum: pieces, kg, bags),
  sellerId: ObjectId (ref: User),
  sellerRole: String (enum: Kaluppa Foundation, Farmer),
  price: Number,
  description: String,
  dateListed: Date
}
```

### Farmer Model
```javascript
{
  userId: ObjectId (ref: User),
  farmerName: String,
  farmName: String,
  farmSize: Number,
  farmSizeUnit: String,
  varietiesAvailable: [String],
  location: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Design Theme

The application features an earthy color palette representative of coffee:
- **Primary Brown**: #6f4e37
- **Secondary Brown**: #8b6f47
- **Dark Brown**: #3e2723
- **Light Cream**: #f5f1ed
- **Accent Tan**: #d4a574
- **Accent Green**: #6b8e23

## 📦 Deployment

### Deploy to Vercel

1. **Push code to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [Vercel Dashboard](https://vercel.com)
- Click "New Project"
- Import the GitHub repository
- Configure environment variables (MONGODB_URI, JWT_SECRET)
- Deploy

3. **Configure MongoDB Atlas**
- Create a MongoDB Atlas account
- Create a database
- Get the connection string
- Add to Vercel environment variables

## 🧪 Testing

### Manual Testing Checklist

- [ ] User can login with correct credentials
- [ ] User receives error for incorrect password
- [ ] User receives error for non-existent email
- [ ] User can register as Farmer or Buyer
- [ ] Non-basic roles cannot register
- [ ] Farmer can only sell Coffee Cherries and Seedlings
- [ ] Kaluppa Foundation can sell Processed Coffee, Fertilizers, Seedlings
- [ ] Products appear in marketplace after selling
- [ ] Products are removed after purchase
- [ ] Sidebar navigation works per role
- [ ] Edit and delete functions work in manage pages

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@kapekonek.com or open an issue in the GitHub repository.

## 🎯 Future Enhancements

- [ ] Payment integration
- [ ] Order tracking system
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Product categories
- [ ] Seller verification system

---

**Created with ❤️ for coffee farmers and buyers**
