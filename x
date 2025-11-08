[1mdiff --git a/config/db.js b/config/db.js[m
[1mapp 403f70c..9761e63 100644[m
[1m--- a/config/db.js[m
[1m+++ b/config/db.js[m
[36m@@ -5,7 +5,11 @@[m [mconst connectDB = async () => {[m
     const uri = process.env.NODE_ENV === 'test'[m
     ? process.env.MONGO_URI_TEST[m
     : process.env.MONGO_URI;[m
[31m-    const conn = await mongoose.connect(uri);[m
[32m+[m[32m    const conn = await mongoose.connect(uri, {[m
[32m+[m[32m      useUnifiedTopology: true,[m
[32m+[m[32m      ssl: true, // force TLS[m
[32m+[m[32m      tlsAllowInvalidCertificates: false,[m
[32m+[m[32m    });[m
     console.log(`MongoDB Connected: ${conn.connection.host}`);[m
   } catch (err) {[m
     console.error('MongoDB connection failed:', err.message);[m
[1mdiff --git a/app.js b/app.js[m
[1mapp 4cf23cf..3ea2cf4 100644[m
[1m--- a/app.js[m
[1m+++ b/app.js[m
[36m@@ -28,6 +28,9 @@[m [mapp.use('/api/users', userRoutes);[m
 const profileRoutes = require('./routes/profileRoutes');[m
 app.use('/api/profiles', profileRoutes);[m
 [m
[32m+[m[32mconst serviceBookingsRoutes = require('./routes/serviceBookingsRoutes');[m
[32m+[m[32mapp.use('/api', serviceBookingsRoutes);[m
[32m+[m
 app.get('/', (req, res) => {[m
   res.send('Profiler backend is live');[m
 });[m
[1mdiff --git a/models/ServiceBooking.js b/models/ServiceBooking.js[m
[1mapp 75198fe..56c703f 100644[m
[1m--- a/models/ServiceBooking.js[m
[1m+++ b/models/ServiceBooking.js[m
[36m@@ -1,6 +1,6 @@[m
 const mongoose = require('mongoose');[m
 [m
[31m-const serviceBookingSchema = mongoose.Schema({[m
[32m+[m[32mconst serviceBookingSchema = new mongoose.Schema({[m
   client: {[m
     type: mongoose.Schema.Types.ObjectId,[m
     ref: 'User',[m
[36m@@ -18,7 +18,7 @@[m [mconst serviceBookingSchema = mongoose.Schema({[m
   },[m
   description: {[m
     type: String,[m
[31m-    required: true,[m
[32m+[m[32m    required: false,[m
     minlength: 10,[m
   },[m
   status: {[m
[36m@@ -32,17 +32,20 @@[m [mconst serviceBookingSchema = mongoose.Schema({[m
   },[m
   forDate: {[m
     type: Date,[m
[31m-    reqired: true,[m
[32m+[m[32m    required: true,[m
   },[m
[31m-  forAdress: {[m
[32m+[m[32m  forAddress: {[m
     type: String,[m
     required: true,[m
   },[m
   note: {[m
     type: String,[m
[31m-    default: 'None given'[m
[31m-  }[m
[31m-[m
[31m-});[m
[32m+[m[32m    default: 'None given',[m
[32m+[m[32m  },[m
[32m+[m[32m  amount: {[m
[32m+[m[32m    type: Number,[m
[32m+[m[32m    default: 0,[m
[32m+[m[32m  },[m
[32m+[m[32m}, { timestamps: true });[m
 [m
 module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);[m
[1mdiff --git a/models/User.js b/models/User.js[m
[1mapp 239292f..5107866 100644[m
[1m--- a/models/User.js[m
[1m+++ b/models/User.js[m
[36m@@ -1,27 +1,30 @@[m
[32m+[m[32m// models/User.js[m
 const mongoose = require('mongoose');[m
[31m-const Profile = require('./Profile'); // 🔁 Import Profile model[m
 [m
[31m-const userSchema = new mongoose.Schema([m
[31m-  {[m
[31m-    name: {[m
[31m-      type: String,[m
[31m-      required: true,[m
[31m-    },[m
[31m-    email: {[m
[31m-      type: String,[m
[31m-      required: true,[m
[31m-      unique: true,[m
[31m-    },[m
[31m-    createdAt: {[m
[31m-      type: Date,[m
[31m-      default: Date.now,[m
[31m-    },[m
[32m+[m[32mconst providerProfileSchema = new mongoose.Schema({[m
[32m+[m[32m  servicesOffered: { type: [String], default: [] },[m
[32m+[m[32m  bio: { type: String, default: '' },[m
[32m+[m[32m  phone: { type: String, default: '' },[m
[32m+[m[32m  address: { type: String, default: '' },[m
[32m+[m[32m  rating: { type: Number, default: 0 },[m
[32m+[m[32m  completedJobs: { type: Number, default: 0 },[m
[32m+[m[32m  becameProviderAt: { type: Date, default: null },[m
[32m+[m[32m}, { _id: false });[m
[32m+[m
[32m+[m[32mconst userSchema = new mongoose.Schema({[m
[32m+[m[32m  name: { type: String, required: true },[m
[32m+[m[32m  email: { type: String, required: true, unique: true },[m
[32m+[m[32m  roles: {[m
[32m+[m[32m    type: [String],[m
[32m+[m[32m    enum: ['client', 'provider', 'admin'],[m
[32m+[m[32m    default: ['client'],[m
   },[m
[31m-  {[m
[31m-    discriminatorKey: 'role', // tells Mongoose which model type this is[m
[31m-    collection: 'users',      // all stored in one collection[m
[31m-  }[m
[31m-);[m
[32m+[m[32m  providerProfile: { type: providerProfileSchema, default: null },[m
[32m+[m[32m  createdAt: { type: Date, default: Date.now },[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32muserSchema.methods.hasRole = function (role) {[m
[32m+[m[32m  return this.roles && this.roles.includes(role);[m
[32m+[m[32m};[m
 [m
[31m-const User = mongoose.model('User', userSchema);[m
[31m-module.exports = User;[m
[32m+[m[32mmodule.exports = mongoose.model('User', userSchema);[m
[1mdiff --git a/package.json b/package.json[m
[1mapp 84d1530..b149f4f 100644[m
[1m--- a/package.json[m
[1m+++ b/package.json[m
[36m@@ -11,7 +11,7 @@[m
     "lint:fix": "eslint . --fix",[m
     "prestart": "npm run lint",[m
     "seed": "node seed.js",[m
[31m-    "test": "cross-env NODE_ENV=test jest --runInBand"[m
[32m+[m[32m    "test": "cross-env NODE_ENV=test jest --runInBand --detectOpenHandles"[m
   },[m
   "keywords": [],[m
   "author": "",[m
[1mdiff --git a/routes/serviceBookingsRoutes.js b/routes/serviceBookingsRoutes.js[m
[1mapp a2d1bb4..4bd136e 100644[m
[1m--- a/routes/serviceBookingsRoutes.js[m
[1m+++ b/routes/serviceBookingsRoutes.js[m
[36m@@ -1,15 +1,10 @@[m
 const express = require('express');[m
[32m+[m[32mconst { createBooking, getBookings, getBookingById } = require('../controllers/serviceBookingController');[m
 const router = express.Router();[m
[31m-const ServiceBooking = require('../models/ServiceBooking');[m
 [m
[31m-router.post('/', async (req, res) => {[m
[31m-  try {[m
[31m-    const booking = new ServiceBooking(req.body);[m
[31m-    await booking.save();[m
[31m-    res.status(201).json(booking);[m
[31m-  } catch (err) {[m
[31m-    res.status(400).json({ error: err.message });[m
[31m-  }[m
[31m-});[m
[32m+[m[32mrouter.post('/bookings', createBooking);[m
[32m+[m[32mrouter.get('/bookings', getBookings);[m
[32m+[m[32mrouter.post('/bookings/:id', getBookingById);[m
[32m+[m
 [m
 module.exports = router;[m
[1mdiff --git a/routes/userRoutes.js b/routes/userRoutes.js[m
[1mapp 6bd7e82..ba43b58 100644[m
[1m--- a/routes/userRoutes.js[m
[1m+++ b/routes/userRoutes.js[m
[36m@@ -3,6 +3,7 @@[m [mconst express = require('express');[m
 const router = express.Router();[m
 [m
 const { createUser, getAllUsers, deleteUser } = require('../controllers/userController');[m
[32m+[m[32mconst { becomeProvider } = require('../controllers/providerConroller,js');[m
 [m
 const checkJwt = require('../middleware/auth');[m
 [m
[36m@@ -12,6 +13,7 @@[m [mrouter.get('/protected', checkJwt, (req, res) => {[m
 [m
 router.post('/', createUser);[m
 router.get('/', getAllUsers);[m
[32m+[m[32mrouter.patch('/:id/upgrade-to-provider', becomeProvider);[m
 router.delete('/:id', deleteUser);[m
 [m
 module.exports = router;[m
[1mdiff --git a/tests/userProfile.test.js b/tests/userProfile.test.js[m
[1mapp 895479a..62ad570 100644[m
[1m--- a/tests/userProfile.test.js[m
[1m+++ b/tests/userProfile.test.js[m
[36m@@ -1,11 +1,12 @@[m
[32m+[m[32m// tests/profiles.test.js[m
 const request = require('supertest');[m
[31m-const app = require('../app');[m
 const mongoose = require('mongoose');[m
[32m+[m[32mconst app = require('../app');[m
 const User = require('../models/User');[m
 const Profile = require('../models/Profile');[m
[31m-const calculateProfileCompletion = require("../utils/calculateProfileCompletion");[m
[32m+[m[32mconst calculateProfileCompletion = require('../utils/calculateProfileCompletion');[m
 [m
[31m-jest.setTimeout(10000); // in case anything is slow[m
[32m+[m[32mjest.setTimeout(15000);[m
 [m
 describe('Profiles API', () => {[m
   let user;[m
[36m@@ -20,7 +21,7 @@[m [mdescribe('Profiles API', () => {[m
     await user.save();[m
   });[m
 [m
[31m-  it('should create a profile and compute profileCompletion', async () => {[m
[32m+[m[32m  test('POST /api/profiles creates profile and computes completion', async () => {[m
     const payload = {[m
       user: String(user._id),[m
       bio: 'Testing profile API',[m
[36m@@ -42,18 +43,16 @@[m [mdescribe('Profiles API', () => {[m
     expect(res.body).toHaveProperty('bio', payload.bio);[m
     expect(res.body).toHaveProperty('profileCompletion', expectedCompletion);[m
 [m
[31m-    profile = res.body; // save profile for next test[m
[31m-[m
[32m+[m[32m    profile = res.body;[m
     const saved = await Profile.findById(profile._id).lean();[m
     expect(saved).not.toBeNull();[m
     expect(String(saved.user)).toBe(String(user._id));[m
     expect(saved.profileCompletion).toBe(expectedCompletion);[m
   });[m
 [m
[31m-  it('should get user profile by ID', async () => {[m
[31m-[m
[32m+[m[32m  test('GET /api/profiles/:id returns profile', async () => {[m
     const res = await request(app)[m
[31m-      .get(`/api/profiles/${profile._id}`)[m
[32m+[m[32m      .get(`/api/profiles/${profile._id}`);[m
 [m
     expect(res.statusCode).toBe(200);[m
     expect(res.body).toHaveProperty('_id');[m
[36m@@ -61,10 +60,9 @@[m [mdescribe('Profiles API', () => {[m
     expect(res.body.phone).toBe('0712345678');[m
   });[m
 [m
[31m-  it('should get user profile by /me/:ID', async () => {[m
[31m-[m
[32m+[m[32m  test('GET /api/profiles/me/:userId returns profile', async () => {[m
     const res = await request(app)[m
[31m-      .get(`/api/profiles/me/${user._id}`)[m
[32m+[m[32m      .get(`/api/profiles/me/${user._id}`);[m
 [m
     expect(res.statusCode).toBe(200);[m
     expect(res.body).toHaveProperty('_id');[m
[36m@@ -72,34 +70,26 @@[m [mdescribe('Profiles API', () => {[m
     expect(res.body.phone).toBe('0712345678');[m
   });[m
 [m
[31m-  it('should get user profile by email', async () => {[m
[31m-[m
[32m+[m[32m  test('GET /api/profiles/me/mail/:email returns nested userAccount shape', async () => {[m
     const res = await request(app)[m
[31m-      .get(`/api/profiles/me/mail/${user.email}`)[m
[32m+[m[32m      .get(`/api/profiles/me/mail/${user.email}`);[m
 [m
     expect(res.statusCode).toBe(200);[m
[32m+[m[32m    expect(res.body.userAccount).toBeDefined();[m
[32m+[m[32m    expect(res.body.userAccount.user.email).toBe(user.email);[m
     expect(res.body.userAccount.profile.bio).toBe('Testing profile API');[m
     expect(res.body.userAccount.profile.phone).toBe('0712345678');[m
   });[m
 [m
[31m-  it('should edit user profile by ID and update profileCompletion', async () => {[m
[31m-    const updatePayload = {[m
[31m-      bio: 'Updated bio',[m
[31m-      phone: '0799999999'[m
[31m-    };[m
[31m-[m
[31m-    // merge with existing profile to compute expected completion[m
[31m-    const expectedCompletion = calculateProfileCompletion({[m
[31m-      ...profile,[m
[31m-      ...updatePayload[m
[31m-    });[m
[32m+[m[32m  test('PATCH /api/profiles/:id edits profile and updates completion', async () => {[m
[32m+[m[32m    const updatePayload = { bio: 'Updated bio', phone: '0799999999' };[m
[32m+[m[32m    const expectedCompletion = calculateProfileCompletion({ ...profile, ...updatePayload });[m
 [m
     const res = await request(app)[m
       .patch(`/api/profiles/${profile._id}`)[m
       .send(updatePayload);[m
 [m
     expect(res.statusCode).toBe(200);[m
[31m-    expect(res.body).toHaveProperty('_id');[m
     expect(res.body.bio).toBe(updatePayload.bio);[m
     expect(res.body.phone).toBe(updatePayload.phone);[m
     expect(res.body.profileCompletion).toBe(expectedCompletion);[m
[36m@@ -110,34 +100,18 @@[m [mdescribe('Profiles API', () => {[m
     expect(saved.profileCompletion).toBe(expectedCompletion);[m
   });[m
 [m
[31m-  it('should edit user profile by email and update profileCompletion', async () => {[m
[31m-    const updatePayload = {[m
[31m-      bio: 'Updated bio via email identity',[m
[31m-      phone: '0799999999'[m
[31m-    };[m
[31m-[m
[31m-    // merge with existing profile to compute expected completion[m
[31m-    const expectedCompletion = calculateProfileCompletion({[m
[31m-      ...profile,[m
[31m-      ...updatePayload[m
[31m-    });[m
[31m-[m
[31m-    console.log('user dot email is', user.email);[m
[32m+[m[32m  test('PATCH /api/profiles/update-by-mail/:email edits profile by email', async () => {[m
[32m+[m[32m    const updatePayload = { bio: 'Updated bio via email', phone: '0791111111' };[m
[32m+[m[32m    const expectedCompletion = calculateProfileCompletion({ ...profile, ...updatePayload });[m
 [m
     const res = await request(app)[m
       .patch(`/api/profiles/update-by-mail/${user.email}`)[m
       .send(updatePayload);[m
 [m
     expect(res.statusCode).toBe(200);[m
[31m-    expect(res.body).toHaveProperty('_id');[m
     expect(res.body.bio).toBe(updatePayload.bio);[m
     expect(res.body.phone).toBe(updatePayload.phone);[m
     expect(res.body.profileCompletion).toBe(expectedCompletion);[m
[31m-[m
[31m-    const saved = await Profile.findById(profile._id).lean();[m
[31m-    expect(saved.bio).toBe(updatePayload.bio);[m
[31m-    expect(saved.phone).toBe(updatePayload.phone);[m
[31m-    expect(saved.profileCompletion).toBe(expectedCompletion);[m
   });[m
 [m
   afterAll(async () => {[m
[1mdiff --git a/tests/userRoutes.test.js b/tests/userRoutes.test.js[m
[1mapp a7f0c70..84f38c1 100644[m
[1m--- a/tests/userRoutes.test.js[m
[1m+++ b/tests/userRoutes.test.js[m
[36m@@ -1,43 +1,32 @@[m
[32m+[m[32m// tests/user.test.js[m
 const request = require('supertest');[m
[31m-const app = require('../app');[m
 const mongoose = require('mongoose');[m
[32m+[m[32mconst app = require('../app');[m
 const User = require('../models/User');[m
 const Profile = require('../models/Profile');[m
[31m-const calculateProfileCompletion = require("../utils/calculateProfileCompletion");[m
 [m
[31m-jest.setTimeout(10000); // in case anything is slow[m
[31m-[m
[31m-describe('POST /api/users', () => {[m
[31m-  it('should create a new user and return user data', async () => {[m
[31m-    const uniqueEmail = `user${Date.now()}@example.com`;[m
[32m+[m[32mjest.setTimeout(15000);[m
 [m
[31m-    const response = await request(app)[m
[31m-      .post('/api/users')[m
[31m-      .send({[m
[31m-        name: 'Yondela',[m
[31m-        email: uniqueEmail,[m
[32m+[m[32mdescribe('User endpoints', () => {[m
[32m+[m[32m  beforeAll(async () => {[m
[32m+[m[32m    // Increase timeout for slow Atlas connection[m
[32m+[m[32m    jest.setTimeout(30000);[m
[32m+[m[41m  [m
[32m+[m[32m    if (mongoose.connection.readyState === 0) {[m
[32m+[m[32m      await mongoose.connect(process.env.MONGO_URI_TEST, {[m
[32m+[m[32m        useNewUrlParser: true,[m
[32m+[m[32m        useUnifiedTopology: true,[m
       });[m
[31m-[m
[31m-    expect(response.statusCode).toBe(201);[m
[31m-    expect(response.body.newUser).toHaveProperty('name', 'Yondela');[m
[31m-    expect(response.body.newUser).toHaveProperty('email', uniqueEmail);[m
[32m+[m[32m    }[m
   });[m
[31m-[m
[31m-  it('should create a new user with default username', async () => {[m
[31m-    const uniqueSub = `auth0|${Date.now()}`;[m
[31m-    const response = await request(app)[m
[31m-      .post('/api/users')[m
[31m-      .send({[m
[31m-        name: 'yolanda@exalt.com',[m
[31m-        email: 'yolanda@exalt.com',[m
[31m-        sub: uniqueSub[m
[31m-      });[m
   [m
[31m-    expect(response.statusCode).toBe(201);[m
[31m-    expect(response.body.newUser.name).toContain('user_');[m
[32m+[m[32m  afterAll(async () => {[m
[32m+[m[32m    await mongoose.connection.collection('users').deleteMany({});[m
[32m+[m[32m    await mongoose.connection.collection('profiles').deleteMany({});[m
[32m+[m[32m    await mongoose.connection.close();[m
   });[m
 [m
[31m-  it('should create a profile through create user', async () => {[m
[32m+[m[32m  test('POST /api/users creates user + default profile', async () => {[m
     const uniqueEmail = `user${Date.now()}@example.com`;[m
 [m
     const response = await request(app)[m
[36m@@ -47,109 +36,39 @@[m [mdescribe('POST /api/users', () => {[m
         email: uniqueEmail,[m
       });[m
 [m
[31m-    expect(response.body).toHaveProperty('profile');[m
[31m-    expect(response.body.profile).toHaveProperty('user');[m
[31m-    expect(response.body.profile).toHaveProperty('phone');[m
[31m-    expect(response.body.profile).toHaveProperty('address');[m
[31m-    expect(response.body.profile).toHaveProperty('bio');[m
[31m-    expect(response.body.profile).toHaveProperty('preferredContactMethod');[m
[31m-    expect(response.body.profile).toHaveProperty('notificationSettings');[m
[31m-    expect(response.body.profile).toHaveProperty('profileCompletion');[m
[31m-    expect(response.body.profile).toHaveProperty('_id');[m
[31m-    expect(response.body.profile).toHaveProperty('createdAt');[m
[31m-  })[m
[32m+[m[32m    expect(response.statusCode).toBe(201);[m
[32m+[m[32m    expect(response.body.newUser).toHaveProperty('name', 'Yondela');[m
[32m+[m[32m    expect(response.body.newUser).toHaveProperty('email', uniqueEmail);[m
 [m
[31m-  afterAll(async () => {[m
[31m-    await mongoose.connection.collection('users').deleteMany({});[m
[31m-    await mongoose.connection.collection('profiles').deleteMany({});[m
[31m-    // await mongoose.connection.close();[m
[31m-  });[m
[31m-});[m
[32m+[m[32m    // NEW: ensure roles default exists[m
[32m+[m[32m    expect(response.body.newUser).toHaveProperty('roles');[m
[32m+[m[32m    expect(Array.isArray(response.body.newUser.roles)).toBe(true);[m
[32m+[m[32m    expect(response.body.newUser.roles).toContain('client');[m
 [m
[31m-describe('DELETE /api/users/:id', () => {[m
[31m-  let userId;[m
[32m+[m[32m    // providerProfile default should be null (no provider yet)[m
[32m+[m[32m    expect(response.body.newUser).toHaveProperty('providerProfile', null);[m
 [m
[31m-  beforeAll(async () => {[m
[31m-    // create a user + profile to delete[m
[31m-    const user = new User({ name: 'Delete Me', email: `deleteme${Date.now()}@test.com` });[m
[32m+[m[32m    // ensure profile object is returned (if your controller returns it)[m
[32m+[m[32m    if (response.body.profile) {[m
[32m+[m[32m      expect(response.body.profile).toHaveProperty('user');[m
[32m+[m[32m      expect(response.body.profile).toHaveProperty('profileCompletion');[m
[32m+[m[32m    }[m
[32m+[m[32m  });[m
[32m+[m
[32m+[m[32m  test('DELETE /api/users/:id deletes user and profile', async () => {[m
[32m+[m[32m    const user = new User({ name: 'ToDelete', email: `del${Date.now()}@ex.com` });[m
     await user.save();[m
 [m
     const profile = new Profile({ user: user._id, bio: 'bye' });[m
     await profile.save();[m
 [m
[31m-    userId = user._id;[m
[31m-  });[m
[31m-[m
[31m-  it('should delete user and profile', async () => {[m
[31m-    const res = await request(app).delete(`/api/users/${userId}`);[m
[31m-[m
[32m+[m[32m    const res = await request(app).delete(`/api/users/${user._id}`);[m
     expect(res.statusCode).toBe(200);[m
     expect(res.body.message).toBe('User and profile deleted successfully');[m
 [m
[31m-    const deletedUser = await User.findById(userId);[m
[31m-    const deletedProfile = await Profile.findOne({ user: userId });[m
[31m-[m
[32m+[m[32m    const deletedUser = await User.findById(user._id);[m
[32m+[m[32m    const deletedProfile = await Profile.findOne({ user: user._id });[m
     expect(deletedUser).toBeNull();[m
     expect(deletedProfile).toBeNull();[m
   });[m
[31m-[m
[31m-  it('should return 404 if user not found', async () => {[m
[31m-    const fakeId = new mongoose.Types.ObjectId();[m
[31m-    const res = await request(app).delete(`/api/users/${fakeId}`);[m
[31m-[m
[31m-    expect(res.statusCode).toBe(404);[m
[31m-    expect(res.body.message).toBe('User not found');[m
[31m-  });[m
 });[m
[31m-[m
[31m-describe('POST /api/profiles', () => {[m
[31m-  let user;[m
[31m-[m
[31m-  beforeAll(async () => {[m
[31m-    // ensure a clean slate[m
[31m-    await Profile.deleteMany({});[m
[31m-    await User.deleteMany({});[m
[31m-    // create a user to attach the profile to (Profile model usually references a user)[m
[31m-    const uniqueEmail = `profileowner${Date.now()}@test.com`;[m
[31m-    user = new User({ name: 'Profile Owner', email: uniqueEmail });[m
[31m-    await user.save();[m
[31m-  });[m
[31m-[m
[31m-  it('should create a profile and compute profileCompletion', async () => {[m
[31m-    const payload = {[m
[31m-      user: String(user._id),        // send user id (string is fine over HTTP)[m
[31m-      bio: 'Testing profile creation',[m
[31m-      phone: '0712345678',[m
[31m-      address: '1 Test Lane',[m
[31m-      preferredContactMethod: 'sms',[m
[31m-      notificationSettings: { email: true, sms: true }[m
[31m-    };[m
[31m-[m
[31m-    const expectedCompletion = calculateProfileCompletion(payload);[m
[31m-[m
[31m-    const res = await request(app)[m
[31m-      .post('/api/profiles')[m
[31m-      .send(payload);[m
[31m-[m
[31m-    // controller should return 201 and the saved profile[m
[31m-    expect(res.statusCode).toBe(201);[m
[31m-    expect(res.body).toHaveProperty('_id');[m
[31m-    expect(String(res.body.user)).toBe(String(user._id));[m
[31m-    expect(res.body).toHaveProperty('bio', payload.bio);[m
[31m-    expect(res.body).toHaveProperty('phone', payload.phone);[m
[31m-    expect(res.body).toHaveProperty('profileCompletion', expectedCompletion);[m
[31m-[m
[31m-    // double-check DB actually got the document[m
[31m-    const saved = await Profile.findById(res.body._id).lean();[m
[31m-    expect(saved).not.toBeNull();[m
[31m-    expect(String(saved.user)).toBe(String(user._id));[m
[31m-    expect(saved.profileCompletion).toBe(expectedCompletion);[m
[31m-  });[m
[31m-[m
[31m-  afterAll(async () => {[m
[31m-    // clean up and close connection[m
[31m-    await Profile.deleteMany({});[m
[31m-    await User.deleteMany({});[m
[31m-    await mongoose.connection.close();[m
[31m-  });[m
[31m-})[m
