## KapeKONEK MERN Stack - Installation & Setup Guide

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Git

### Quick Start (First Time Setup)

1. **Navigate to project root**
```bash
cd KapeKONEK
```

2. **Install all dependencies**
```bash
npm run install-all
```

3. **Set up MongoDB**
   - Local: Ensure MongoDB is running
   - Cloud: Create MongoDB Atlas account and get connection string

4. **Configure environment variables**
   - Create `.env` file in backend folder
   - Copy values from `.env.example`
   - Update MONGODB_URI with your database URL
   - Update JWT_SECRET with a secure key

5. **Start development servers**

**Option A: Separate terminals**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Option B: Concurrent (requires npm-run-all)**
```bash
npm start
```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

### Default Test Credentials

**Pre-generated Admin Accounts** (must be created first):
```
Kaluppa Foundation:
- Email: admin@kaluppa.com
- Password: kaluppapass123
- Role: Kaluppa Foundation

DTI:
- Email: admin@dti.com
- Password: dtipass123
- Role: DTI

Group Manager:
- Email: manager@group.com
- Password: managerpass123
- Role: Group Manager
```

**To create admin accounts:**
1. Use MongoDB directly to insert into User collection
2. Hash passwords using bcryptjs
3. Or use the Manage Users page if admin account exists

### Troubleshooting

**MongoDB Connection Error**
- Verify MongoDB is running locally or check Atlas connection string
- Check MONGODB_URI in .env file

**Port Already in Use**
- Backend: Change PORT in .env
- Frontend: Set PORT=3001 npm start

**CORS Errors**
- Ensure proxy is set in frontend package.json
- Backend CORS configuration in server.js

**Dependencies Installation Issues**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm run install-all
```

### Environment Variables Reference

**Backend .env**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kapekonek
JWT_SECRET=your-secure-secret-key
PORT=5000
NODE_ENV=development
```

### Project Deployment

**To Vercel:**
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Development Tips

- Use Postman or Insomnia to test API endpoints
- Check browser console for frontend errors
- Check terminal for backend errors
- Use MongoDB Compass to visualize database

### Database Reset

To reset the database and start fresh:
```bash
# Clear all collections in MongoDB
# Then restart the application
```

### Common Commands

```bash
# Backend
npm start --prefix backend        # Production mode
npm run dev --prefix backend      # Development mode with nodemon

# Frontend
npm start --prefix frontend       # Development server
npm run build --prefix frontend   # Production build

# Both
npm install --prefix backend      # Install backend deps only
npm install --prefix frontend     # Install frontend deps only
npm run install-all               # Install all dependencies
```

### API Testing Examples

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"pass123","role":"Farmer"}'
```

**Get Products**
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Need Help?

- Check the README.md for feature details
- Review API endpoint documentation
- Check backend console for error messages
- Verify MongoDB is running and accessible
