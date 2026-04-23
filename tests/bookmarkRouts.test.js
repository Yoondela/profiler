const request = require('supertest');

jest.mock('../middleware/auth', () => (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  req.auth = { payload: { sub: authHeader.replace(/^Bearer\s+/, '') } };
  return next();
});

jest.mock('../models/User', () => ({
  findOne: jest.fn(),
}));

jest.mock('../utils/bookmarkService', () => ({
  toggleBookmark: jest.fn(),
  getBookmarks: jest.fn(),
  removeBookmark: jest.fn(),
}));

const app = require('../app');
const User = require('../models/User');
const bookmarkService = require('../utils/bookmarkService');
const { deleteBookmark } = require('../controllers/bookmarkController');

describe('Bookmark Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockResolvedValue({ _id: 'client-1' });
  });

  it('should bookmark a company', async () => {
    bookmarkService.toggleBookmark.mockResolvedValue({ bookmarked: true });

    const res = await request(app)
      .post('/api/bookmarks/providers/save')
      .set('Authorization', 'Bearer auth0|client-1')
      .send({ providerId: 'provider-1' });

    expect(res.statusCode).toBe(201);
    expect(res.body.bookmarked).toBe(true);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|client-1' });
    expect(bookmarkService.toggleBookmark).toHaveBeenCalledWith('client-1', 'provider-1');
  });

  it('should unbookmark if already bookmarked', async () => {
    bookmarkService.toggleBookmark.mockResolvedValue({ bookmarked: false });

    const res = await request(app)
      .post('/api/bookmarks/providers/save')
      .set('Authorization', 'Bearer auth0|client-1')
      .send({ providerId: 'provider-1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.bookmarked).toBe(false);
  });

  it('should fallback to portfolio if no company exists', async () => {
    bookmarkService.toggleBookmark.mockResolvedValue({ bookmarked: true });

    const res = await request(app)
      .post('/api/bookmarks/providers/save')
      .set('Authorization', 'Bearer auth0|client-1')
      .send({ providerId: 'provider-portfolio' });

    expect(res.statusCode).toBe(201);
    expect(res.body.bookmarked).toBe(true);
    expect(bookmarkService.toggleBookmark).toHaveBeenCalledWith('client-1', 'provider-portfolio');
  });

  it('should return 404 if provider does not exist', async () => {
    bookmarkService.toggleBookmark.mockRejectedValue(new Error('PROVIDER_NOT_FOUND'));

    const res = await request(app)
      .post('/api/bookmarks/providers/save')
      .set('Authorization', 'Bearer auth0|client-1')
      .send({ providerId: 'missing-provider' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Provider not found');
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .post('/api/bookmarks/providers/save')
      .send({ providerId: 'provider-1' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('should get bookmarks for authenticated user', async () => {
    const bookmarks = [{ providerId: 'provider-1' }, { providerId: 'provider-2' }];
    bookmarkService.getBookmarks.mockResolvedValue(bookmarks);

    const res = await request(app)
      .get('/api/bookmarks/providers/provider-1')
      .set('Authorization', 'Bearer auth0|client-1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(bookmarks);
    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|client-1' });
    expect(bookmarkService.getBookmarks).toHaveBeenCalledWith('client-1');
  });

  it('should return 404 when getting bookmarks for unknown user', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/bookmarks/providers/provider-1')
      .set('Authorization', 'Bearer auth0|missing-client');

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should delete a bookmark', async () => {
    bookmarkService.removeBookmark.mockResolvedValue({ removed: true });

    const req = {
      auth: { payload: { sub: 'auth0|client-1' } },
      body: { providerId: 'provider-1' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await deleteBookmark(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ auth0Id: 'auth0|client-1' });
    expect(bookmarkService.removeBookmark).toHaveBeenCalledWith('client-1', 'provider-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ removed: true });
  });

  it('should return 404 if bookmark does not exist while deleting', async () => {
    bookmarkService.removeBookmark.mockRejectedValue(new Error('BOOKMARK_NOT_FOUND'));

    const req = {
      auth: { payload: { sub: 'auth0|client-1' } },
      body: { providerId: 'missing-provider' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await deleteBookmark(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bookmark not found' });
  });
});
