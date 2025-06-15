const getAllUsers = (req, res) => {

  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
};

module.exports = { getAllUsers };

