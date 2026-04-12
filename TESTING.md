# Testing Guide for KapeKONEK

## Manual Testing Checklist

### 1. Authentication Tests

#### Login Functionality
- [ ] Successfully login with correct credentials
- [ ] Error message for non-existent email
- [ ] Error message "User not found" when role doesn't match
- [ ] Error message "Incorrect password" for wrong password
- [ ] Token stored in localStorage after successful login
- [ ] User redirected to correct dashboard based on role

#### Registration Functionality
- [ ] Register as Farmer with valid data
- [ ] Register as Buyer with valid data
- [ ] Error when trying to register as admin role
- [ ] Error when email already exists
- [ ] User added to database
- [ ] Auto-login after successful registration
- [ ] Redirect to marketplace after registration

#### Role-Based Navigation
- [ ] Kaluppa Foundation sees: Login, Marketplace, Farmer Profiles, Manage Users
- [ ] DTI sees: Login, Farmer Profiles, Manage Users
- [ ] Group Manager sees: Login, Farmer Profiles
- [ ] Farmer sees: Login, Register, Farmer Profile, Marketplace
- [ ] Buyer sees: Login, Register, Marketplace

### 2. Marketplace Tests

#### Product Display
- [ ] All products display correctly
- [ ] Product details show (type, variety, quantity, price, seller, date)
- [ ] Products update in real-time when new items are added

#### Selling Products
- [ ] Farmers can sell Coffee Cherries
- [ ] Farmers can sell Coffee Seedlings
- [ ] Farmers cannot sell Processed Coffee or Fertilizers
- [ ] Kaluppa Foundation can sell all allowed products
- [ ] Buyers cannot sell products
- [ ] Product added to database after selling
- [ ] Product appears in marketplace
- [ ] Form fields show correctly based on product type

#### Buying Products
- [ ] Buyers can purchase products
- [ ] Farmers can purchase products
- [ ] Kaluppa Foundation can purchase products
- [ ] Product removed from marketplace after purchase
- [ ] Product quantity decreases correctly
- [ ] Product deleted from DB when quantity reaches 0

#### Product-Specific Fields
- [ ] Coffee Seedlings: variety and quantity fields required
- [ ] Coffee Cherries: variety and quantity (kg) fields required
- [ ] Processed Coffee: variety and quantity (kg) fields required
- [ ] Fertilizers: quantity (bags) field required

### 3. User Management Tests

#### List Users
- [ ] Kaluppa Foundation can view all users
- [ ] DTI can view all users
- [ ] Other roles cannot access page
- [ ] User list displays all required information
- [ ] User list properly formatted

#### Create User
- [ ] Kaluppa Foundation can create users
- [ ] DTI can create users
- [ ] New user added to database
- [ ] Form validation works (email, password)
- [ ] Email uniqueness enforced
- [ ] All roles selectable for creation

#### Edit User
- [ ] Kaluppa Foundation can edit users
- [ ] DTI can edit users
- [ ] Changes saved to database
- [ ] Save button works correctly
- [ ] Cancel button discards changes
- [ ] All fields (fullname, email, role) editable

#### Delete User
- [ ] Kaluppa Foundation can delete users
- [ ] DTI can delete users
- [ ] Confirmation dialog appears
- [ ] User deleted from database
- [ ] List updates after deletion
- [ ] User can no longer login with deleted account

### 4. Farmer Profile Tests

#### View Profiles
- [ ] Farmer can view their profile
- [ ] Kaluppa Foundation can view all profiles
- [ ] DTI can view all profiles
- [ ] Group Manager can view profiles
- [ ] Profiles display all fields correctly

#### Edit Profiles
- [ ] Farmer can edit their own profile
- [ ] Kaluppa Foundation can edit any profile
- [ ] DTI can edit any profile
- [ ] Group Manager can edit profiles
- [ ] Changes saved to database
- [ ] All fields editable (name, farm name, size, varieties, location)

#### Batch Update
- [ ] Group Manager can batch update
- [ ] Kaluppa Foundation can batch update
- [ ] DTI can batch update
- [ ] Multiple records update correctly
- [ ] Database reflects changes

### 5. Database Tests

#### User Collection
- [ ] New users appear in MongoDB
- [ ] Passwords are hashed (not plaintext)
- [ ] Email is unique
- [ ] Role is one of the enum values
- [ ] Delete removes user from collection

#### Product Collection
- [ ] New products appear in database
- [ ] Seller ID references correct user
- [ ] Variety and quantity fields saved correctly
- [ ] Products removed when purchased
- [ ] Quantity updates correctly

#### Farmer Collection
- [ ] New profiles appear in database
- [ ] User ID references correct user
- [ ] All fields saved correctly
- [ ] Updates reflect in database
- [ ] Batch updates work correctly

### 6. UI/UX Tests

#### Responsive Design
- [ ] Desktop view (1920x1080) looks good
- [ ] Tablet view (768x1024) is responsive
- [ ] Mobile view (375x667) is usable
- [ ] No horizontal scroll needed
- [ ] Text is readable on all sizes

#### Color Scheme
- [ ] Coffee theme colors are consistent
- [ ] Buttons are visually distinguishable
- [ ] Error messages are clearly visible
- [ ] Links are clearly marked
- [ ] Hover states work on buttons

#### Navigation
- [ ] Sidebar links navigate correctly
- [ ] Logout button works
- [ ] Back buttons work where applicable
- [ ] Page titles update correctly
- [ ] URL structure is logical

### 7. Error Handling Tests

#### Login Errors
- [ ] Email validation error shows
- [ ] Password validation error shows
- [ ] Role selection required error shows
- [ ] Network error displays message
- [ ] Timeout handled gracefully

#### Form Errors
- [ ] Required field validation
- [ ] Email format validation
- [ ] Password length validation
- [ ] Duplicate email error
- [ ] Error messages clear when corrected

#### API Errors
- [ ] 404 errors handled
- [ ] 500 errors handled
- [ ] Network timeout handled
- [ ] Invalid token handled
- [ ] Unauthorized access handled

### 8. Performance Tests

#### Load Times
- [ ] Login page loads < 2 seconds
- [ ] Marketplace loads < 3 seconds
- [ ] User list loads < 2 seconds
- [ ] Farmer profiles load < 2 seconds
- [ ] Page transitions are smooth

#### Data Load
- [ ] 100+ products load without lag
- [ ] 100+ users load without lag
- [ ] 100+ farmer profiles load without lag
- [ ] Search/filter performance acceptable

### 9. Security Tests

#### Authentication
- [ ] Logged-out users cannot access protected pages
- [ ] Direct URL navigation requires login
- [ ] Token is not exposed in source code
- [ ] JWT token is properly validated
- [ ] Password never visible in response

#### Authorization
- [ ] Farmers cannot access Manage Users
- [ ] Buyers cannot access any admin pages
- [ ] DTI cannot access Marketplace
- [ ] Group Manager cannot access Manage Users
- [ ] Role restrictions enforced

#### Data Protection
- [ ] Passwords are hashed
- [ ] Other users' data is not exposed
- [ ] Seller information properly displayed
- [ ] Personal information not leaked

### 10. Cross-Browser Testing

- [ ] Chrome latest version
- [ ] Firefox latest version
- [ ] Safari latest version
- [ ] Edge latest version
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Automated Testing (Optional)

### Backend API Tests (with Jest/Supertest)
```bash
npm test --prefix backend
```

### Frontend Component Tests (with Jest/React Testing Library)
```bash
npm test --prefix frontend
```

## Test Data

### Admin Users
```
Email: admin@kaluppa.com
Password: kaluppapass123
Role: Kaluppa Foundation

Email: admin@dti.com
Password: dtipass123
Role: DTI

Email: manager@group.com
Password: managerpass123
Role: Group Manager
```

### Test Users
```
Email: farmer1@example.com
Password: password123
Role: Farmer

Email: buyer1@example.com
Password: password123
Role: Buyer
```

### Test Products
```
- Coffee Seedlings (Typica variety, 100 pieces)
- Coffee Cherries (Bourbon variety, 50 kg)
- Processed Coffee (Arabica variety, 25 kg)
- Fertilizers (100 bags)
```

## Known Issues & Limitations

- [ ] Item: Current limitation or issue
- [ ] Item: Workaround if applicable

## Sign-Off

| Role | Name | Date | Comments |
|------|------|------|----------|
| QA Lead | | | |
| Developer | | | |
| Product Manager | | | |

---

Date: [Testing Date]
Version: 1.0
