const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const Bookmark = require('../models/Bookmark');

const resolveOwner = async (providerId) => {
  const company = await Company.findOne({ owner: providerId });

  if (company) {
    return { targetId: company._id, targetType: 'Company', data: company };
  }

  const portfolio = await Portfolio.findOne({ user: providerId });

  if (portfolio) {
    return { targetId: portfolio._id, targetType: 'Portfolio', data: portfolio };
  }

  throw new Error('PROVIDER_NOT_FOUND');
};

const normalizeBookmark = (bookmark, data) => {
  return {
    id: bookmark._id,
    type: bookmark.targetType,
    name: data.name,
    image: data.primaryImage || null,
    bookmarkedAt: bookmark.createdAt,
  };
};

const toggleBookmark = async (clientId, providerId) => {
  const { targetId, targetType, data } = await resolveOwner(providerId);

  const existing = await Bookmark.findOne({
    client: clientId,
    targetId,
    targetType,
  });

  if (existing) {
    await existing.deleteOne();
    return { bookmarked: false };
  }

  await Bookmark.create({
    client: clientId,
    targetId,
    targetType,
    snapshot: {
      name: data.name,
      primaryImage: data.primaryImage || null,
    },
  });

  return { bookmarked: true };
};



const addBookmark = async (clientId, providerId) => {
  const { targetId, targetType, data } = await resolveOwner(providerId);

  // prevent duplicates
  const existing = await Bookmark.findOne({
    client: clientId,
    targetId,
    targetType,
  });

  if (existing) {
    throw new Error('ALREADY_BOOKMARKED');
  }

  const bookmark = await Bookmark.create({
    client: clientId,
    targetId,
    targetType,

    // UX optimization (denormalized snapshot)
    snapshot: {
      name: data.name,
      primaryImage: data.primaryImage || null,
    },
  });

  return normalizeBookmark(bookmark, data);
};

const getBookmarks = async (clientId) => {
  const bookmarks = await Bookmark.find({ client: clientId })
    .sort({ createdAt: -1 });

  return bookmarks.map((b) => ({
    id: b._id,
    type: b.targetType,
    name: b.snapshot?.name,
    image: b.snapshot?.primaryImage,
    bookmarkedAt: b.createdAt,
  }));
};

const removeBookmark = async (clientId, providerId) => {
  const { targetId, targetType } = await resolveOwner(providerId);

  const deleted = await Bookmark.findOneAndDelete({
    client: clientId,
    targetId,
    targetType,
  });

  if (!deleted) {
    throw new Error('BOOKMARK_NOT_FOUND');
  }

  return { success: true };
};

module.exports = {
  toggleBookmark,
  addBookmark,
  getBookmarks,
  removeBookmark,
};
