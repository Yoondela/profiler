const request = require('supertest');
const app = require('../app');

const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const CompanyInvite = require('../models/CompanyInvite');

let ownerUser;
let providerUser;
let providerPortfolio;
let company;

beforeAll(async () => {

  await User.deleteMany();
  await Portfolio.deleteMany();
  await Company.deleteMany();
  await CompanyInvite.deleteMany();

  ownerUser = await User.create({
    name: 'Owner',
    email: 'owner@test.com',
    roles: ['provider'],
  });

  providerUser = await User.create({
    name: 'Provider',
    email: 'provider@test.com',
    roles: ['provider'],
  });

  providerPortfolio = await Portfolio.create({
    user: providerUser._id,
  });

  company = await Company.create({
    name: 'CleanCo',
    owner: ownerUser._id,
  });
});

describe('POST /api/invites/:companyId/invite', () => {
  test('owner can invite a provider', async () => {
    const res = await request(app)
      .post(`/api/invites/${company._id}/invite`)
      .send({
        portfolioId: providerPortfolio._id,
        invitedBy: ownerUser._id,
      })
      .expect(201);

    console.log('Response Body:', res.body);

    expect(res.body.invite).toBeDefined();
    expect(res.body.invite.company).toBe(company._id.toString());
    expect(res.body.invite.portfolio).toBe(providerPortfolio._id.toString());
    expect(res.body.invite.status).toBe('pending');
  });
});

describe('GET /api/invites/:providerId', () => {
  test('provider sees pending invites', async () => {
    const res = await request(app)
      .get(`/api/invites/${providerUser._id}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const invite = res.body[0];
    expect(invite.company.name).toBe('CleanCo');
    expect(invite.status).toBe('pending');
  });
});

describe('POST /api/invites/:inviteId/respond', () => {
  test('provider can accept invite and become member of the company', async () => {
    const invite = await CompanyInvite.findOne({ status: 'pending' });
    expect(invite).toBeTruthy();

    const res = await request(app)
      .post(`/api/invites/${invite._id}/respond`)
      .send({ action: 'accept' })
      .expect(200);

    expect(res.body.success).toBe(true);

    const updatedCompany = await Company.findById(company._id).lean();

    expect(updatedCompany.members.map(String)).toContain(
      providerPortfolio._id.toString(),
    );
  });
});
