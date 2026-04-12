# Deployment Guide for KapeKONEK

## GitHub Setup

### 1. Initialize Git Repository
```bash
cd KapeKONEK
git init
git add .
git commit -m "Initial commit: KapeKONEK marketplace"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Create a new repository named "KapeKONEK"
3. Copy the repository URL

### 3. Push to GitHub
```bash
git remote add origin https://github.com/yourusername/KapeKONEK.git
git branch -M main
git push -u origin main
```

## MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Sign up for free account
- Create a new project

### 2. Create a Cluster
- Click "Build a Database"
- Choose "Shared" (Free tier)
- Select region (closest to your users)
- Accept default settings
- Click "Create Cluster"

### 3. Database Access
- Go to "Database Access"
- Click "Add New Database User"
- Create username and complex password
- Choose "Password (SCRAM)" method
- Add user

### 4. Network Access
- Go to "Network Access"
- Click "Add IP Address"
- Choose "Allow Access from Anywhere" (or add specific IPs)
- Confirm

### 5. Get Connection String
- Go to "Databases"
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` with your database user password
- Replace `myFirstDatabase` with `kapekonek`

### Example Connection String:
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/kapekonek?retryWrites=true&w=majority
```

## Vercel Deployment

### 1. Connect GitHub to Vercel
- Go to [Vercel](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Select "KapeKONEK" repository
- Click "Import"

### 2. Configure Project Settings
- **Framework**: Select "Other"
- **Root Directory**: Leave as `.`
- **Build Command**: `npm run build --prefix frontend`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm run install-all`

### 3. Add Environment Variables

**For Backend Variables:**
- Add `MONGODB_URI`: Your MongoDB Atlas connection string
- Add `JWT_SECRET`: A secure random key (generate at https://passwordsgenerator.net/)
- Add `NODE_ENV`: `production`
- Add `PORT`: `3001` (Vercel assigns port automatically)

**For Frontend Variables:**
- Add `REACT_APP_API_URL`: The backend URL from Vercel

### 4. Deploy
- Click "Deploy"
- Wait for deployment to complete
- Your app will be live at the provided URL

## Post-Deployment Steps

### 1. Create Admin Accounts

Use MongoDB Atlas to insert admin users:

**In Collections > users > Insert Documents**

```json
{
  "fullname": "Kaluppa Foundation Admin",
  "email": "admin@kaluppa.com",
  "password": "$2a$10$... (bcrypt hashed 'kaluppapass123')",
  "role": "Kaluppa Foundation",
  "createdAt": new Date()
}
```

Or use your application's Manage Users page if you can create users directly.

### 2. Verify Deployment
- Test login with admin account
- Test basic marketplace functionality
- Check error console for issues

### 3. Set Up CI/CD
GitHub Actions workflow (optional but recommended):

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## Troubleshooting Deployment

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify no console errors in frontend build

### Connection Errors
- Verify MongoDB connection string format
- Check MongoDB Atlas IP whitelist
- Test connection string locally first

### Runtime Errors
- Check Vercel function logs
- Verify environment variables are set
- Check API endpoint URLs

### CORS Issues
- Backend CORS is configured in server.js
- Verify frontend proxy setting in package.json
- Check Vercel routing in vercel.json

## Performance Optimization

### Frontend
- Enable gzip compression
- Optimize images
- Use code splitting
- Minimize CSS/JS

### Backend
- Use connection pooling
- Implement caching
- Add request rate limiting
- Use indexes in MongoDB

### Database
- Create appropriate indexes
- Archive old data
- Monitor query performance

## Security Checklist

- [ ] Change JWT_SECRET to secure value
- [ ] Remove console.log from production code
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set secure MongoDB password policy
- [ ] Enable MongoDB backup
- [ ] Add request validation
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Use environment variables for all secrets
- [ ] Regular security updates

## Monitoring & Maintenance

### Vercel Dashboard
- Monitor deployment history
- Check analytics
- View logs
- Monitor uptime

### MongoDB Atlas
- Check cluster status
- Monitor memory usage
- Review backup status
- Check billing

### Application Health
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Track user analytics
- Set up alerts

## Scaling Recommendations

### When Traffic Increases
1. Upgrade MongoDB cluster tier
2. Enable CDN for frontend assets
3. Implement caching layer (Redis)
4. Add database replication
5. Consider database sharding

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 100 https://your-domain.com

# Using wrk
wrk -t12 -c400 -d30s https://your-domain.com
```

## Rollback Procedures

### Vercel Rollback
1. Go to Deployments in Vercel dashboard
2. Find previous successful deployment
3. Click "Redeploy"

### Database Rollback
1. Use MongoDB Atlas backup
2. Restore to specific point in time
3. Verify data integrity
4. Notify users if needed

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

For additional support or issues, contact the development team.
