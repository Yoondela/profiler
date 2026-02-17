const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const CompanyInvite = require('../models/CompanyInvite');

let owner;
let providerA;
let providerB;
let providerC;
let portfolioA;
let portfolioB;
let portfolioC;
let company;

beforeAll(async () => {
  await User.deleteMany();
  await Portfolio.deleteMany();
  await Company.deleteMany();
  await CompanyInvite.deleteMany();

  owner = await User.create({
    name: 'Owner Person',
    email: 'owner@test.com',
    roles: ['provider'],
  });

  providerA = await User.create({
    name: 'Yondela Sasayi',
    email: 'alice@test.com',
    roles: ['provider'],
  });

  providerB = await User.create({
    name: 'Bob Marley',
    email: 'bob@test.com',
    roles: ['provider'],
  });

  providerC = await User.create({
    name: 'Random User',
    email: 'random@test.com',
    roles: ['provider'],
  });

  portfolioA = await Portfolio.create({ user: providerA._id });
  portfolioB = await Portfolio.create({ user: providerB._id });
  portfolioC = await Portfolio.create({ user: providerC._id });

  company = await Company.create({
    name: 'CleanCo',
    owner: owner._id,
    members: [portfolioA._id],
  });

  await CompanyInvite.create({
    company: company._id,
    portfolio: portfolioB._id,
    invitedBy: owner._id,
    status: 'pending',
  });
});

describe('GET /api/invites/:companyId/search', () => {
  test('fuzzy searches user names and returns inviteStatus', async () => {
    const res = await request(app)
      .get(`/api/invites/${company._id}/search`)
      .query({ q: 'sas' })
      .expect(200);

    expect(res.body.length).toBe(1);

    const user = res.body[0];
    expect(user.name).toBe('Yondela Sasayi');
    expect(user.inviteStatus).toBe('already_member');
  });

  test('returns empty array when no name matches', async () => {
    const res = await request(app)
      .get(`/api/invites/${company._id}/search`)
      .query({ q: 'yea' })
      .expect(200);

    expect(res.body).toEqual([]);
  });
});
