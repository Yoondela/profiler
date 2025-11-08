const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

const becomeProvider = async (req, res) => {
  console.log('Becomming provider');
  try {
    const { id } = req.params;

    console.log('ID', id);

    const user = await User.findById(id);

    console.log('User found', user);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.roles.includes('provider')) {
      user.roles.push('provider');
    }

    await user.save();

    let portfolio = await Portfolio.findOne({ user: user._id });

    console.log('portfolio found', portfolio);

    if (!portfolio) {
      const portfolioData = {
        user: user._id,
        company: 'Company name',
        servicesOffered: [],
        bio: '',
        phone: '',
        address: '',
        becameProviderAt: new Date(),
      };

      portfolio = new Portfolio(portfolioData);
      await portfolio.save();
    }



    res.status(200).json({
      message: 'User upgraded to provider successfully',
      userRoles: user.roles,
      portfolio: portfolio,
    });
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = { becomeProvider };
