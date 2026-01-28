const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

describe('Portfolio Gallery API', () => {
  let user;
  let portfolio;

  beforeAll(async () => {
    user = await User.create({
      name: 'Gallery Tester',
      email: 'gallery@test.com',
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      galleryPhotos: [
        { url: '1.jpg' },
        { url: '2.jpg' },
        { url: '3.jpg' },
      ],
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
  });

  test('POST /api/portfolios/:id/gallery should append multiple URLs', async () => {
    const res = await request(app)
      .post(`/api/portfolios/${user._id}/gallery`)
      .send({ urls: ['4.jpg', '5.jpg'] });

    expect(res.status).toBe(200);

    // Check shape
    expect(Array.isArray(res.body.galleryPhotos)).toBe(true);
    expect(res.body.galleryPhotos.length).toBe(5);


    // Check each image has url + id
    for (const img of res.body.galleryPhotos) {
      expect(typeof img.url).toBe('string');
      expect(typeof img._id).toBe('string');
    }

    // Check URLs specifically
    const urls = res.body.galleryPhotos.map(img => img.url);

    expect(urls).toContain('4.jpg');
    expect(urls).toContain('5.jpg');
  });

  test('DELETE /api/portfolios/:id/gallery/:photoId should delete item', async () => {
    const photoIdToDelete = portfolio.galleryPhotos[1]._id; // remove the 2nd image

    const res = await request(app)
      .delete(`/api/portfolios/${user._id}/gallery/${photoIdToDelete}`);

    expect(res.status).toBe(200);
    expect(res.body.galleryPhotos.length).toBe(4); // One removed
    expect(res.body.galleryPhotos.find(p => p._id === photoIdToDelete)).toBeUndefined();
  });


  test('PATCH /api/portfolios/:id/gallery/reorder should reorder items', async () => {
    const res = await request(app)
      .patch(`/api/portfolios/${user._id}/gallery/reorder`)
      .send({ from: 2, to: 0 }); // moving '4.jpg' to the top

    expect(res.status).toBe(200);
    expect(res.body.galleryPhotos.map(p => p.url)).toEqual([
      '4.jpg', '1.jpg', '3.jpg', '5.jpg',
    ]);
  });


  test('GET /api/portfolios/:id/gallery should get all user gallery urls', async () => {
    const res = await request(app)
      .get(`/api/portfolios/${user._id}/gallery`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.galleryPhotos)).toBe(true);
    expect(res.body.galleryPhotos.length).toBe(4);

    for (const img of res.body.galleryPhotos) {
      expect(typeof img.url).toBe('string');
      expect(typeof img._id).toBe('string');
    }

    expect(res.body.galleryPhotos.map(p => p.url)).toEqual([
      '4.jpg', '1.jpg', '3.jpg', '5.jpg',
    ]);
  });
});
