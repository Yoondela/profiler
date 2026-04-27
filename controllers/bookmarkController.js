const bookmarkService = require('../utils/bookmarkService');
const User = require('../models/User');

const getUserId = async (req) => {
  
  try {
    const auth0Id = req?.auth?.payload?.sub;
    if (!auth0Id) {
      throw new Error('NOT_AUTHORISED');
    }

    const currentUser = await User.findOne({ auth0Id });
    if (!currentUser) {
      throw new Error('USER_NOT_FOUND');
    }

    return currentUser._id;
  } catch (err) {
    throw new Error('USER_NOT_FOUND');
  }
};

const toggleBookmark = async (req, res) => {
  console.log('Toggling bookmark..');

  console.log('Request body:', req.body);

  try {
    const clientId = await getUserId(req);

    const result = await bookmarkService.toggleBookmark(
      clientId,
      req.body.providerId,
    );

    const status = result.bookmarked ? 201 : 200;
    res.status(status).json(result);
  } catch (err) {
    handleError(res, err);
  }
};

const getBookmarks = async (req, res) => {
  console.log('Getting bookmarks..');
  try {
    const clientId = await getUserId(req);
    const result = await bookmarkService.getBookmarks(
      clientId,
    );

    console.log('Bookmarks retrieved:', result);

    res.status(200).json(result);
    console.log("Successful!")
  } catch (err) {
    handleError(res, err);
  }
};

const deleteBookmark = async (req, res) => {
  console.log('Deleting bookmark..');
  try {
    const clientId = await getUserId(req);

    console.log('cleint:', clientId);
    console.log('provider:', req.params);

    const result = await bookmarkService.removeBookmark(
      clientId,
      req.params.providerId,
    );

    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
  console.log('Successful!');
};

const handleError = (res, err) => {
  switch (err.message) {
  case 'ALREADY_BOOKMARKED':
    return res.status(409).json({ message: 'Already bookmarked' });

  case 'PROVIDER_NOT_FOUND':
    return res.status(404).json({ message: 'Provider not found' });

  case 'BOOKMARK_NOT_FOUND':
    return res.status(404).json({ message: 'Bookmark not found' });
  case 'USER_NOT_FOUND':
    return res.status(404).json({ message: 'User not found' });

  default:
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleBookmark,
  getBookmarks,
  deleteBookmark,
};
