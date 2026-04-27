const request = require('supertest');
const app = require('../app');

const {
  toggleBookmark,
  getBookmarks,
  deleteBookmark,
} = require('../controllers/bookmarkController');

const bookmarkService = require('../utils/bookmarkService');
const User = require('../models/User');

// 🔥 mock dependencies
jest.mock('../utils/bookmarkService');
jest.mock('../models/User');

// mock checkJwt middleware
const mockCheckJwt = (req, res, next) => {
  req.auth = {
    payload: {
      sub: 'auth0|test-user',
    },
  };
  next();
};

describe('Bookmark Routes', () => {
  const mockUserId = '507f191e810c19729de860ea';

  beforeEach(() => {
    jest.clearAllMocks();

    User.findOne.mockResolvedValue({
      _id: mockUserId,
    });
  });

  // =============================
  // TOGGLE BOOKMARK
  // =============================
  describe('POST /providers/save', () => {
    it('should bookmark successfully', async () => {
      bookmarkService.toggleBookmark.mockResolvedValue({
        bookmarked: true,
      });

      const res = await request(app)
        .post('/api/bookmarks/providers/save')
        .send({ providerId: 'provider123' });

      expect(res.status).toBe(201);
      expect(res.body.bookmarked).toBe(true);

      expect(bookmarkService.toggleBookmark).toHaveBeenCalledWith(
        mockUserId,
        'provider123'
      );
    });

    it('should unbookmark successfully', async () => {
      bookmarkService.toggleBookmark.mockResolvedValue({
        bookmarked: false,
      });

      const res = await request(app)
        .post('/api/bookmarks/providers/save')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(200);
      expect(res.body.bookmarked).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/bookmarks/providers/save')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  // =============================
  // GET BOOKMARKS
  // =============================
  describe('GET /providers/saved', () => {
    it('should return bookmarks', async () => {
      const mockBookmarks = [
        {
          name: 'CleanCo',
          primaryImage: 'image.jpg',
        },
      ];

      bookmarkService.getBookmarks.mockResolvedValue(mockBookmarks);

      const res = await request(app)
        .get('/api/bookmarks/providers/saved')
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockBookmarks);

      expect(bookmarkService.getBookmarks).toHaveBeenCalledWith(
        mockUserId
      );
    });

    it('should return 404 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/bookmarks/providers/saved')
        .set('Authorization', 'Bearer mocktoken');



      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle server errors', async () => {
      bookmarkService.getBookmarks.mockRejectedValue(
        new Error('Something broke')
      );

      const res = await request(app)
        .get('/api/bookmarks/providers/saved')
        .set('Authorization', 'Bearer mocktoken');


      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });
  // =============================
  // DELETE BOOKMARK
  // =============================
  describe('DELETE /providers/save', () => {
    const mockUserId = '507f191e810c19729de860ea';

    beforeEach(() => {
      jest.clearAllMocks();

      User.findOne.mockResolvedValue({
        _id: mockUserId,
      });
    });

    it('should remove bookmark successfully', async () => {
      bookmarkService.removeBookmark.mockResolvedValue({
        removed: true,
      });

      const res = await request(app)
        .delete('/api/bookmarks/providers/save/provider123')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(200);
      expect(res.body.removed).toBe(true);

      expect(bookmarkService.removeBookmark).toHaveBeenCalledWith(
        mockUserId,
        'provider123'
      );
    });

    it('should return 404 if bookmark not found', async () => {
      bookmarkService.removeBookmark.mockRejectedValue(
        new Error('BOOKMARK_NOT_FOUND')
      );

      const res = await request(app)
        .delete('/api/bookmarks/providers/save/provider123')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Bookmark not found');
    });

    it('should return 404 if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/bookmarks/providers/save/provider123')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should handle server errors', async () => {
      bookmarkService.removeBookmark.mockRejectedValue(
        new Error('Something broke')
      );

      const res = await request(app)
        .delete('/api/bookmarks/providers/save/provider123')
        .send({ providerId: 'provider123' })
        .set('Authorization', 'Bearer mocktoken');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Server error');
    });
  });

});
