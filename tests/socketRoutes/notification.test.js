const request = require('supertest');
const app = require('../../app');

const User = require('../../models/User');
const Portfolio = require('../../models/Portfolio');
const Company = require('../../models/Company');
const { sendNotification } = require('../../services/sockeClient');


it('sends realtime notification when inviting user', async () => {
  const owner = await User.create({ name: 'Owner', email: 'owner@test.com' });
  const invited = await User.create({ name: 'Invited', email: 'user@test.com' });

  const portfolio = await Portfolio.create({ user: invited._id });

  const company = await Company.create({
    name: 'TestCo',
    owner: owner._id,
  });


  await request(app)
    .post(`/api/invites/${company._id}/invite`)
    .send({
      portfolioId: portfolio._id,
      invitedBy: owner._id,
    })
    .expect(201);

  expect(sendNotification).toHaveBeenCalled();
});
