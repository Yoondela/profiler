const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');

jest.mock('../helper/geocodeAddress', () => ({
  geocodeAddress: jest.fn(),
}));

const { geocodeAddress } = require('../helper/geocodeAddress');

// ---------------------------
// HELPERS
// ---------------------------
const mockGoogleAddressInput = () => ({
  formatted: '56 Hendry Rd, Morningside, Berea, 4001, South Africa',
  placeId: 'test-place-id',
  addressComponents: [
    { long_name: '56', types: ['street_number'] },
    { long_name: 'Hendry Road', types: ['route'] },
    { long_name: 'Morningside', types: ['sublocality'] },
    { long_name: 'Berea', types: ['locality'] },
    { long_name: 'KwaZulu-Natal', types: ['administrative_area_level_1'] },
    { long_name: '4001', types: ['postal_code'] },
    { long_name: 'South Africa', types: ['country'] },
  ],
});

const mockStoredAddress = () => ({
  formatted: '56 Hendry Rd, Morningside, Berea, 4001, South Africa',
  placeId: 'test-place-id',
  addressComponents: {
    street: '56 Hendry Road',
    suburb: 'Morningside',
    city: 'Berea',
    province: 'KwaZulu-Natal',
    postalCode: '4001',
    country: 'South Africa',
  },
  location: {
    type: 'Point',
    coordinates: [18.4241, -33.9249],
  },
});

// ---------------------------
// CREATE COMPANY
// ---------------------------
describe('create company API', () => {
  let user;
  let portfolio;
  let company

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Company.deleteMany({});

    user = await User.create({
      name: 'Provider User',
      email: `provider${Date.now()}@mail.com`,
      roles: ['provider'],
    });

    // console.log(mockStoredAddress());

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [],
      address: mockStoredAddress(),
      becameProviderAt: new Date(),
    });

  });

  it('should create company, link portfolio, and geocode address', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 18.4241,
      lat: -33.9249,
    });

    console.log("just geo coded");


    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: mockGoogleAddressInput(),
      });

    console.log(res.body);  

    expect(res.statusCode).toBe(201);

    // expect(geocodeAddress).toHaveBeenCalledWith(
    //   '56 Hendry Rd, Morningside, Berea, 4001, South Africa'
    // );

    expect(res.body.company).toBeDefined();
    expect(res.body.company.name).toBe('CleanCo');

    // ✅ Address assertions
    expect(res.body.company.address.formatted).toBe(
      '56 Hendry Rd, Morningside, Berea, 4001, South Africa'
    );

    expect(res.body.company.address.placeId).toBe('test-place-id');

    expect(res.body.company.address.addressComponents).toMatchObject({
      street: '56 Hendry Road',
      suburb: 'Morningside',
      city: 'Berea',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
    });

    expect(res.body.company.address.location).toEqual({
      type: 'Point',
      coordinates: [18.4241, -33.9249],
    });

    expect(res.body.company.owner).toBe(user._id.toString());
    expect(res.body.company.members).toContain(portfolio._id.toString());

    const updatedPortfolio = await Portfolio.findById(portfolio._id);
    expect(updatedPortfolio.company.toString()).toBe(res.body.company._id);
  });

  it('should reject creating company without name or address', async () => {
    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });
});

// ---------------------------
// GET COMPANY
// ---------------------------
describe('get company API', () => {
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
      address: mockStoredAddress(),
      becameProviderAt: new Date(),
    });

    company = await Company.create({
      name: 'CleanCo',
      owner: user._id,
      members: [portfolio._id],
      address: mockStoredAddress(),
    });

    portfolio.company = company._id;
    await portfolio.save();
  });

  test('should return company if exists', async () => {
    const res = await request(app).get(`/api/company/${user._id}`);

    console.log(res)

    expect(res.statusCode).toBe(200);

    const company = res.body.company;

    expect(company).toBeDefined();
    expect(company.name).toBe('CleanCo');

    expect(company.address.location).toMatchObject({
      type: 'Point',
      coordinates: [18.4241, -33.9249],
    });

    expect(company.owner._id).toBe(user._id.toString());
    expect(company.members.map(m => m._id)).toContain(
      portfolio._id.toString()
    );
  });
});

// ---------------------------
// GET MEMBERS
// ---------------------------
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
      name: 'CleanCo',
      address: mockStoredAddress(),
    });

    company = await Company.create({
      name: 'CleanCo',
      owner: owner._id,
      address: mockStoredAddress(),
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
    expect(member).toHaveProperty(
      'avatarUrl',
      'https://test.com/avatar.jpg'
    );
  });

  test('returns empty array when company has no members', async () => {
    const emptyCompany = await Company.create({
      name: 'EmptyCo',
      owner: owner._id,
      address: mockStoredAddress(),
      members: [],
    });

    const res = await request(app)
      .get(`/api/company/${emptyCompany._id}/members`)
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
