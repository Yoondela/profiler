const request = require('supertest');
const app = require('../app');

const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const Service = require('../models/Service');
const User = require('../models/User');
const SearchDocument = require('../models/SearchDocument');
const mongoose = require('mongoose');

describe('GET /api/search/autocomplete', () => {

  beforeAll(async () => {

    await Portfolio.deleteMany();
    await Company.deleteMany();
    await Service.deleteMany();
    await User.deleteMany();
    await SearchDocument.deleteMany();

    const user = await User.create({
      name: 'John Doe',
      email: 'john@me.com',
    });

    const company = await Company.create({
      owner: user._id,
      name: 'CleanCo',
    });

    await Portfolio.create({
      user: user._id,
      displayName: 'John Cleaner',
      company: company._id,
    });

    await Service.create({
      name: 'Cleaning',
      slug: 'cleaning',
    });

  });

  afterAll(async () => {

    await Portfolio.deleteMany();
    await Company.deleteMany();
    await Service.deleteMany();

  });

  test('returns service, company and provider suggestions', async () => {

    const res = await request(app)
      .get('/api/search/autocomplete?q=cle')
      .expect(200);

    const labels = res.body.map(r => r.label);

    expect(labels).toContain('Cleaning');
    expect(labels).toContain('CleanCo');
    expect(labels).toContain('John Cleaner');

  });

  test('returns empty array when query < 2 characters', async () => {

    const res = await request(app)
      .get('/api/search/autocomplete?q=c')
      .expect(200);

    expect(res.body).toEqual([]);

  });

});

describe('Service autocomplete', () => {

  beforeEach(async () => {
    await SearchDocument.deleteMany({});
    await Service.deleteMany({});

    const services = await Service.insertMany([
      { name: 'Cleaning', slug: 'cleaning-test' },
      { name: 'Car Cleaning', slug: 'car-cleaning-test' },
      { name: 'Gardening', slug: 'gardening-test' },
    ]);

    await SearchDocument.insertMany([
      { type: 'service', refId: services[0]._id, label: 'Cleaning' },
      { type: 'service', refId: services[1]._id, label: 'Car Cleaning' },
      { type: 'service', refId: services[2]._id, label: 'Gardening' },
      { type: 'provider', refId: new mongoose.Types.ObjectId(), label: 'CleanCo Ltd' },
    ]);
  });

  it('returns only services matching query', async () => {

    const res = await request(app)
      .get('/api/search/services?q=clean')
      .expect(200);

    const labels = res.body.map(s => s.label);

    expect(labels).toContain('Cleaning');
    expect(labels).toContain('Car Cleaning');
    expect(labels).not.toContain('CleanCo Ltd');
  });

});
