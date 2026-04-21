const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const GalleryPhoto = require('../models/GalleryPhoto');
const mongoose = require('mongoose');

// Stored (DB shape)
const mockStoredAddress = () => ({
  formatted: 'Test Address',
  placeId: 'test-id',
  addressComponents: {
    street: '123 Test St',
    suburb: 'Test Suburb',
    city: 'Test City',
    province: 'Test Province',
    postalCode: '0000',
    country: 'South Africa',
  },
  location: {
    type: 'Point',
    coordinates: [31.0, -29.0],
  },
});

describe.skip('Portfolio Gallery API', () => {
  let user;
  let portfolio;
  let galleryPhoto;

  beforeAll(async () => {
    user = await User.create({
      name: 'Gallery Tester',
      email: 'gallery@test.com',
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      address: mockStoredAddress(),
    });

    galleryPhoto = await GalleryPhoto.insertMany([
      { url: '1.jpg', ownerId: portfolio._id, ownerType: 'Portfolio', order: 0 },
      { url: '2.jpg', ownerId: portfolio._id, ownerType: 'Portfolio', order: 1 },
      { url: '3.jpg', ownerId: portfolio._id, ownerType: 'Portfolio', order: 2 },
    ]);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await GalleryPhoto.deleteMany({});
  });

  test('POST /api/portfolios/:id/gallery should append multiple URLs', async () => {
    const res = await request(app)
      .post(`/api/portfolios/${user._id}/gallery`)
      .send({ urls: ['4.jpg', '5.jpg'] });

    console.log(res.body);

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
    const photoIdToDelete = galleryPhoto[1]._id; // remove the 2nd image
    console.log('At position 1:', photoIdToDelete );


    const res = await request(app)
      .delete(`/api/portfolios/${user._id}/gallery/${photoIdToDelete}`);

    console.log(res.body);


    expect(res.status).toBe(200);
    expect(res.body.galleryPhotos.length).toBe(4); // One removed
    expect(res.body.galleryPhotos.find(p => p._id === photoIdToDelete)).toBeUndefined();
  });


  test('GET /api/portfolios/:id/gallery should get all user gallery urls', async () => {
    const res = await request(app)
      .get(`/api/portfolios/${user._id}/gallery`);

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.galleryPhotos)).toBe(true);
    expect(res.body.galleryPhotos.length).toBe(4);

    for (const img of res.body.galleryPhotos) {
      expect(typeof img.url).toBe('string');
      expect(typeof img._id).toBe('string');
    }

    expect(res.body.galleryPhotos.map(p => p.url)).toEqual([
      '1.jpg', '3.jpg', '4.jpg', '5.jpg',
    ]);
  });

  test('PATCH /api/portfolios/:id/gallery/reorder should reorder items', async () => {
    const res = await request(app)
      .patch(`/api/portfolios/${user._id}/gallery/reorder`)
      .send({ from: 2, to: 0 }); // moving '4.jpg' to the top

    console.log(res.body);

    expect(res.status).toBe(200);
    expect(res.body.galleryPhotos.map(p => p.url)).toEqual([
      '4.jpg', '1.jpg', '3.jpg', '5.jpg',
    ]);
  });
});

+

describe('PATCH /api/gallery/:providerId/:photoId/primary', () => {

  let user;
  let portfolio;
  let photo1;
  let photo2;

  beforeAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await GalleryPhoto.deleteMany({});

    user = await User.create({
      name: 'Gallery User',
      email: 'gallery@test.com',
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      address: mockStoredAddress(),
    });

    photo1 = await GalleryPhoto.create({
      url: 'img1.jpg',
      ownerType: 'Portfolio',
      ownerId: portfolio._id,
      order: 0,
    });

    photo2 = await GalleryPhoto.create({
      url: 'img2.jpg',
      ownerType: 'Portfolio',
      ownerId: portfolio._id,
      order: 1,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await GalleryPhoto.deleteMany({});
  });

  it('should set one photo as primary and unset others', async () => {

    const res = await request(app)
      .patch(`/api/gallery/${user._id}/${photo2._id}/primary`);

    console.log(res.body);


    expect(res.status).toBe(200);

    const gallery = res.body.galleryPhotos;

    const primaryPhotos = gallery.filter(p => p.isPrimary === true);

    expect(primaryPhotos.length).toBe(1);
    expect(primaryPhotos[0].url).toBe('img2.jpg');

  });

  it('should move primary to another photo', async () => {

    const res = await request(app)
      .patch(`/api/gallery/${user._id}/${photo1._id}/primary`);

    console.log(res.body);

    expect(res.status).toBe(200);

    const gallery = res.body.galleryPhotos;

    const primaryPhotos = gallery.filter(p => p.isPrimary === true);

    expect(primaryPhotos.length).toBe(1);
    expect(primaryPhotos[0].url).toBe('img1.jpg');

  });

  it('should return 404 if photo does not belong to owner', async () => {

    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/api/gallery/${user._id}/${fakeId}/primary`);

    expect(res.status).toBe(404);

  });

});
