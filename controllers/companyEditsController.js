const Company = require('../models/Company');

const getCompanyEdits = async (req, res) => {
  console.log('Getting Company for edits');

  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId)
      .populate('owner')
      .populate('servicesOffered')
      .populate('members');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log('Company fetched for edits', companyId);
    return res.status(200).json(company);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateCompanyEdits = async (req, res) => {
  console.log('Updating Company');

  try {
    const { companyId } = req.params;
    const updates = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    Object.keys(updates).forEach((key) => {
      company[key] = updates[key];
    });

    await company.save();

    console.log('Company updated', companyId);
    return res.status(200).json(company);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCompanyEdits,
  updateCompanyEdits,
};
