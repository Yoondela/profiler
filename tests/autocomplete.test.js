const request = require('supertest');
const app = require('../app');

const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const Service = require('../models/Service');
const User = require('../models/User');
const SearchDocument = require('../models/SearchDocument');

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
