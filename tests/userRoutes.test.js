const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');

jest.setTimeout(10000); // in case anything is slow

describe('POST /api/users', () => {
  it('should create a new user and return user data', async () => {
    const uniqueEmail = `user${Date.now()}@example.com`;

    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Yondela',
        email: uniqueEmail,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.newUser).toHaveProperty('name', 'Yondela');
    expect(response.body.newUser).toHaveProperty('email', uniqueEmail);
  });

  it('should create a new user with default username', async () => {
    const uniqueSub = `auth0|${Date.now()}`;
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'yolanda@exalt.com',
        email: 'yolanda@exalt.com',
        sub: uniqueSub
      });
  
    expect(response.statusCode).toBe(201);
    expect(response.body.newUser.name).toContain('user_');
  });
  
  describe('DELETE /api/users/:id', () => {
    let userId;
  
    beforeAll(async () => {
      // create a user + profile to delete
      const user = new User({ name: 'Delete Me', email: `deleteme${Date.now()}@test.com` });
      await user.save();
  
      const profile = new Profile({ user: user._id, bio: 'bye' });
      await profile.save();
  
      userId = user._id;
    });
  
    it('should delete user and profile', async () => {
      const res = await request(app).delete(`/api/users/${userId}`);
  
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('User and profile deleted successfully');
  
      const deletedUser = await User.findById(userId);
      const deletedProfile = await Profile.findOne({ user: userId });
  
      expect(deletedUser).toBeNull();
      expect(deletedProfile).toBeNull();
    });
  
    it('should return 404 if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/users/${fakeId}`);
  
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  afterAll(async () => {
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('profiles').deleteMany({});
    await mongoose.connection.close();
  });
});
