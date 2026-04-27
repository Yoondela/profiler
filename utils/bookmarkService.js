const Company = require('../models/Company');
const Portfolio = require('../models/Portfolio');
const Bookmark = require('../models/Bookmark');
const mongoose = require('mongoose');

const resolveOwner = async (providerId) => {
  console.log('Resolving owner for providerId:', providerId);
  const company = await Company.findOne({ _id: providerId });

  if (company) {
    console.log(company);
    return { targetId: company._id, targetType: 'Company', data: company };
  }

  console.log('No company found, checking portfolio for providerId:', providerId);

  const portfolio = await Portfolio.findOne({ _id: providerId });

  console.log(portfolio);


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
  console.log('In service, toggling bookmark for clientId:', clientId, 'providerId:', providerId);
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
    owner: data.user || data.owner, // company has owner, portfolio has user
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
  console.log('Getting bookmarks for clientId:', clientId);
  try {
    const bookmarks = await Bookmark.aggregate([
      {
      $match: { client: new mongoose.Types.ObjectId(clientId) }
    },

    // Split into two pipelines
    {
      $facet: {
        companies: [
          { $match: { targetType: 'Company' } },

          {
            $lookup: {
              from: 'companies',
              localField: 'targetId',
              foreignField: '_id',
              as: 'company'
            }
          },
          { $unwind: '$company' },

          // get primary image
          {
            $lookup: {
              from: 'galleryphotos',
              let: { companyId: '$company._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$ownerId', '$$companyId'] },
                        { $eq: ['$ownerType', 'Company'] },
                        { $eq: ['$isPrimary', true] }
                      ]
                    }
                  }
                },
                { $limit: 1 }
              ],
              as: 'primaryImage'
            }
          },

          {
            $project: {
              _id: 1,
              providerId: '$targetId',
              targetType: 1,
              name: '$company.name',
              owner: '$owner',
              about: '$company.about',
              services: '$company.servicesOffered',
              company: '$company.name',
              primaryImage: { $arrayElemAt: ['$primaryImage.url', 0] }
            }
          }
        ],
        
        portfolios: [
          { $match: { targetType: 'Portfolio' } },
          
          {
            $lookup: {
              from: 'portfolios',
              localField: 'targetId',
              foreignField: '_id',
              as: 'portfolio'
            }
          },
          { $unwind: '$portfolio' },

          // populate company if exists
          {
            $lookup: {
              from: 'companies',
              localField: 'portfolio.company',
              foreignField: '_id',
              as: 'company'
            }
          },

          {
            $lookup: {
              from: 'galleryphotos',
              let: { portfolioId: '$portfolio._id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$ownerId', '$$portfolioId'] },
                        { $eq: ['$ownerType', 'Portfolio'] },
                        { $eq: ['$isPrimary', true] }
                      ]
                    }
                  }
                },
                { $limit: 1 }
              ],
              as: 'primaryImage'
            }
          },
          
          {
            $project: {
              _id: 1,
              targetType: 1,
              providerId: '$targetId',
              owner: '$owner',
              name: '$portfolio.displayName',
              about: '$portfolio.about',
              services: '$portfolio.servicesOffered',
              company: {
                $arrayElemAt: ['$company.name', 0]
              },
              primaryImage: { $arrayElemAt: ['$primaryImage.url', 0] }
            }
          }
        ]
      }
    },
    
    // merge both arrays
    {
      $project: {
        data: { $concatArrays: ['$companies', '$portfolios'] }
      }
    },
    
    { $unwind: '$data' },
    { $replaceRoot: { newRoot: '$data' } }
  ]);
    console.log('Bookmarks retrieved:', bookmarks);


    return bookmarks;
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    throw new Error('FAILED_TO_FETCH_BOOKMARKS');
  }

};

const removeBookmark = async (clientId, providerId) => {
  console.log('Deleting bookmark in service for clientId:', clientId, 'providerId:', providerId);

  try { 
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
}catch (err) {
    console.error('Error removing bookmark:', err);
    if (err.message === 'PROVIDER_NOT_FOUND') {
      throw err; // rethrow to be handled by controller
    }
    throw new Error('FAILED_TO_REMOVE_BOOKMARK');
  }
};

module.exports = {
  toggleBookmark,
  addBookmark,
  getBookmarks,
  removeBookmark,
};
