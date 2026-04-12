# KapeKONEK - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites
- Node.js installed
- MongoDB running locally OR MongoDB Atlas account
- Git installed

### Step 2: Clone & Install
```bash
cd KapeKONEK
npm run install-all
```

### Step 3: Configure Database
**Local MongoDB:**
```
Leave MONGODB_URI as: mongodb://localhost:27017/kapekonek
```

**MongoDB Atlas:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kapekonek
```

Update in `backend/.env`

### Step 4: Start Application
**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 5: Access Application
- Open http://localhost:3000 in browser
- Login with test credentials or register new account

## 📋 File Locations

### Important Configuration Files
- Backend Config: `backend/.env`
- Frontend Config: `frontend/package.json` (proxy setting)
- Deployment: separate Vercel project settings for `frontend` and `backend`

### Main Application Files

**Backend:**
- Entry Point: `backend/server.js`
- Database Models: `backend/models/*.js`
- API Routes: `backend/routes/*.js`
- Business Logic: `backend/controllers/*.js`

**Frontend:**
- Entry Point: `frontend/src/App.js`
- Pages: `frontend/src/pages/*.js`
- Styles: `frontend/src/css/*.css`
- Utils: `frontend/src/js/*.js`

## 🔑 Default Test Accounts

**Admin Accounts (Must be pre-created in DB):**

Kaluppa Foundation:
- Email: `admin@kaluppa.com`
- Password: `kaluppapass123`

DTI:
- Email: `admin@dti.com`
- Password: `dtipass123`

Group Manager:
- Email: `manager@group.com`
- Password: `managerpass123`

**User Registration:**
- Register as Farmer or Buyer (self-service)
- DTI/Kaluppa Foundation create accounts via Manage Users

## 🧪 Quick Test Flow

1. **Register as Farmer:**
   - Go to login page → Click "Sign up here"
   - Fill form (any email/password)
   - Redirects to marketplace

2. **Add Product:**
   - Click "Sell Product" button
   - Select product type (Coffee Cherries for Farmer)
   - Fill variety and quantity
   - Click "Add Product"

3. **Buy Product:**
   - See products in marketplace
   - Click "Buy Now"
   - Product quantity reduces or removes

## 🐛 Troubleshooting

**App won't start?**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm run install-all
```

**MongoDB connection error?**
- Verify MongoDB is running
- Check connection string in .env
- Check firewall/network
- Test connection locally first

**Login doesn't work?**
- Ensure admin user exists in DB
- Check password is hashed
- Verify email format
- Check console for errors

**CORS Error?**
- Frontend proxy should point to localhost:5000
- Backend CORS is configured
- Check server.js for cors middleware

## 📊 API Testing Examples

**Login:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kaluppa.com","password":"kaluppapass123","role":"Kaluppa Foundation"}'
```

**Get Products:**
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📚 Documentation Files

- **README.md** - Full project documentation
- **SETUP.md** - Detailed setup instructions
- **DEPLOYMENT.md** - Vercel deployment guide
- **ARCHITECTURE.md** - System architecture diagram
- **TESTING.md** - Test checklist and procedures

## 🔄 Development Workflow

### Daily Development
1. Start backend: `npm run dev --prefix backend`
2. Start frontend: `npm start --prefix frontend`
3. Edit files (hot reload works)
4. Test changes in browser
5. Commit changes

### Before Deployment
1. Run tests: `npm test` (when available)
2. Check console for errors
3. Test all user roles
4. Verify database changes
5. Commit and push to GitHub

## 🚢 Deployment Checklist

- [ ] All code committed to GitHub
- [ ] .env variables configured
- [ ] Database backup created
- [ ] Tested in production environment
- [ ] All team members notified
- [ ] Rollback plan in place

## 📞 Support & Resources

### Getting Help
1. Check documentation files
2. Review browser console for errors
3. Check backend terminal for logs
4. Verify MongoDB connection
5. Check network requests in DevTools

### Useful Links
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Vercel Docs](https://vercel.com/docs)

## 🎯 Common Tasks

### Add New Product Type
1. Update Product model in `backend/models/Product.js`
2. Add option to seller's dropdown
3. Add validation in product controller
4. Update Marketplace form
5. Test with different user roles

### Add New User Role
1. Update User model enum
2. Add constants in auth middleware
3. Create sidebar menu option
4. Add route protection
5. Create role-specific pages

### Modify Database Schema
1. Update model file
2. Create migration script
3. Verify existing data
4. Test thoroughly before deploy
5. Backup database first

## ✅ Launch Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] MongoDB connected
- [ ] Can login with test account
- [ ] Can register new user
- [ ] Can access marketplace
- [ ] Can create/edit products
- [ ] Can manage users/farmers (admin)
- [ ] No console errors
- [ ] Responsive on mobile

---

**You're all set! Happy coding! 🎉**
