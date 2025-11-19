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
      company: 'Gallery Co',
      galleryPhotosUrls: ['1.jpg', '2.jpg', '3.jpg'],
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

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toContain('4.jpg');
    expect(res.body).toContain('5.jpg');
  });

  test('DELETE /api/portfolios/:id/gallery/:index should delete item', async () => {
    const res = await request(app)
      .delete(`/api/portfolios/${user._id}/gallery/1`); // remove "2.jpg"

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['1.jpg', '3.jpg', '4.jpg', '5.jpg']);
  });

  test('PATCH /api/portfolios/:id/gallery/reorder should reorder items', async () => {
    const res = await request(app)
      .patch(`/api/portfolios/${user._id}/gallery/reorder`)
      .send({
        from: 2, // '4.jpg'
        to: 0,
      });

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['4.jpg', '1.jpg', '3.jpg', '5.jpg']);
  });
});
