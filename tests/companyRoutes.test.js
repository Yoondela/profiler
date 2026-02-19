const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');

jest.mock('../services/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

const { geocodeAddress } = require('../services/geocodeAddress');

describe('create company API', () => {
  let user;
  let portfolio;

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Company.deleteMany({});

    user = await User.create({
      name: 'Provider User',
      email: `provider${Date.now()}@mail.com`,
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [],
      becameProviderAt: new Date(),
    });
  });

  it('should create company, link portfolio, and geocode address', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 18.4241,
      lat: -33.9249,
    });

    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: {
          formatted: 'Cape Town, South Africa',
          placeId: 'place-id',
        },
      });

    expect(res.statusCode).toBe(201);

    expect(geocodeAddress).toHaveBeenCalledWith(
      'Cape Town, South Africa',
    );

    expect(res.body.company).toBeDefined();
    expect(res.body.company.name).toBe('CleanCo');
    expect(res.body.company.location.coordinates).toEqual([
      18.4241,
      -33.9249,
    ]);

    expect(res.body.company.owner).toBe(user._id.toString());
    expect(res.body.company.members).toContain(portfolio._id.toString());

    const updatedPortfolio = await Portfolio.findById(portfolio._id);
    expect(updatedPortfolio.company.toString()).toBe(res.body.company._id);
  });


  it('should be idempotent and not re-geocode or recreate company', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 1,
      lat: 1,
    });

    const firstRes = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: {
          formatted: 'Cape Town, South Africa',
        },
      });

    geocodeAddress.mockClear();

    const secondRes = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: {
          formatted: 'Cape Town, South Africa',
        },
      });

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.company._id).toBe(firstRes.body.company._id);
    expect(geocodeAddress).not.toHaveBeenCalled();
  });

  it('should reject creating company without name or address', async () => {
    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });
});

describe('create company API', () => {
  let user;
  let portfolio;
  let company;

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Company.deleteMany({});

    user = await User.create({
      name: 'Provider User',
      email: `provider${Date.now()}@mail.com`,
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [],
      becameProviderAt: new Date(),
    });

    company = await Company.create({
      name: 'CleanCo',
      owner: user._id,
      members: [portfolio._id],
      address: {
        formatted: 'Cape Town, South Africa',
      },
      location: {
        type: 'Point',
        coordinates: [18.4241, -33.9249],
      },
    });

    portfolio.company = company._id;
    await portfolio.save();
  });

  test('should return company if exists', async () => {

    const res = await request(app).get(`/api/company/${user._id}`);

    console.log(res.body);

    expect(res.statusCode).toBe(200);

    const company = res.body.company;
    expect(company).toBeDefined();

    // Core fields
    expect(company._id).toBeDefined();
    expect(company.name).toBe('CleanCo');

    // Location (GeoJSON)
    expect(company.location).toMatchObject({
      type: 'Point',
      coordinates: [18.4241, -33.9249],
    });

    // Ownership
    expect(company.owner._id).toBe(user._id.toString());
    expect(company.members.map(m => m._id)).toContain(portfolio._id.toString());

    // Serialization
    expect(typeof company._id).toBe('string');
    expect(typeof company.owner._id).toBe('string');
    expect(typeof company.members[0]._id).toBe('string');

    // Integrity
    expect(Array.isArray(company.members)).toBe(true);
    expect(company.members.length).toBeGreaterThan(0);
    expect(new Set(company.members).size).toBe(company.members.length);
  });
});

describe('GET /api/company/:companyId/members', () => {

  let owner;
  let memberUser;
  let memberPortfolio;
  let company;

  beforeAll(async () => {
    await User.deleteMany();
    await Profile.deleteMany();
    await Portfolio.deleteMany();
    await Company.deleteMany();

    owner = await User.create({
      name: 'Owner User',
      email: 'owner@test.com',
      roles: ['provider'],
    });

    memberUser = await User.create({
      name: 'Alice Photo',
      email: 'alice@test.com',
      roles: ['provider'],
    });

    await Profile.create({
      user: memberUser._id,
      avatarUrl: 'https://test.com/avatar.jpg',
    });

    memberPortfolio = await Portfolio.create({
      user: memberUser._id,
    });

    company = await Company.create({
      name: 'CleanCo',
      owner: owner._id,
      members: [memberPortfolio._id],
    });
  });

  afterAll(async () => {
    await User.deleteMany();
    await Profile.deleteMany();
    await Portfolio.deleteMany();
    await Company.deleteMany();
  });


  test('returns all company members with name and avatar', async () => {
    const res = await request(app)
      .get(`/api/company/${company._id}/members`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const member = res.body[0];

    expect(member).toHaveProperty('portfolioId');
    expect(member).toHaveProperty('name', 'Alice Photo');
    expect(member).toHaveProperty('avatarUrl', 'https://test.com/avatar.jpg');
  });

  test('returns empty array when company has no members', async () => {
    const emptyCompany = await Company.create({
      name: 'EmptyCo',
      owner: owner._id,
      members: [],
    });

    const res = await request(app)
      .get(`/api/company/${emptyCompany._id}/members`)
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
