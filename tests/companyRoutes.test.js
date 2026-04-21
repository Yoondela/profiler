const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Profile = require('../models/Profile');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const GalleryPhoto = require('../models/GalleryPhoto');

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

  beforeEach(async () => {
    await User.deleteMany({});
    await Portfolio.deleteMany({});
    await Company.deleteMany({});
    await GalleryPhoto.deleteMany({});

    user = await User.create({
      name: 'Provider User',
      email: `provider${Date.now()}@mail.com`,
      roles: ['provider'],
    });

    portfolio = await Portfolio.create({
      user: user._id,
      servicesOffered: [],
      otherSkills: ['ironing'],
      email: 'provider@test.com',
      phone: '0812345678',
      logoUrl: 'logo.png',
      bannerUrl: 'banner.png',
      about: 'Portfolio bio',
      address: mockStoredAddress(),
      becameProviderAt: new Date(),
    });

    // add portfolio gallery
    await GalleryPhoto.create({
      url: 'https://img.com/1.jpg',
      ownerType: 'Portfolio',
      ownerId: portfolio._id,
    });
  });

  it('should create company, copy portfolio data, clone gallery, and link portfolio', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 18.4241,
      lat: -33.9249,
    });

    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: mockGoogleAddressInput(),
      });

    expect(res.statusCode).toBe(201);

    const company = res.body.company;

    // basic
    expect(company).toBeDefined();
    expect(company.name).toBe('CleanCo');

    // copied fields
    expect(company.logoUrl).toBe('logo.png');
    expect(company.bannerUrl).toBe('banner.png');
    expect(company.about).toBe('Portfolio bio');
    expect(company.phone).toBe('0812345678');

    // members
    expect(company.members).toContain(portfolio._id.toString());

    // address
    expect(company.address.formatted).toBeDefined();
    expect(company.address.location.coordinates).toEqual([
      18.4241,
      -33.9249,
    ]);

    // gallery cloned
    const companyGallery = await GalleryPhoto.find({
      ownerId: company._id,
      ownerType: 'Company',
    });

    expect(companyGallery.length).toBe(1);
    expect(company.gallery.length).toBe(1);

    // portfolio linked
    const updatedPortfolio = await Portfolio.findById(portfolio._id);
    expect(updatedPortfolio.company.toString()).toBe(company._id);
  });

  it('should NOT create duplicate company', async () => {
    geocodeAddress.mockResolvedValue({
      lng: 18.4241,
      lat: -33.9249,
    });

    await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: mockGoogleAddressInput(),
      });

    const res = await request(app)
      .post(`/api/company/create/${user._id}`)
      .send({
        name: 'CleanCo',
        address: mockGoogleAddressInput(),
      });

    expect(res.statusCode).toBe(200);

    const companies = await Company.find({ owner: user._id });
    expect(companies.length).toBe(1);
  });

  it('should reject missing name/address', async () => {
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
      address: mockStoredAddress(),
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

  test('should return company with populated members', async () => {
    const res = await request(app).get(`/api/company/${user._id}`);

    expect(res.statusCode).toBe(200);

    const company = res.body.company;

    expect(company.name).toBe('CleanCo');
    expect(company.owner._id).toBe(user._id.toString());

    expect(Array.isArray(company.members)).toBe(true);
    expect(company.members[0]._id).toBe(portfolio._id.toString());
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
      'https://test.com/avatar.jpg',
    );
  });

  test('returns empty array when no members', async () => {
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
