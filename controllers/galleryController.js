const GalleryPhoto = require('../models/GalleryPhoto');
const Portfolio = require('../models/Portfolio');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const { set } = require('../app');

const resolveOwner = async (providerId) => {

  const company = await Company.findOne({ owner: providerId });

  const ownerType = company ? 'Company' : 'Portfolio';

  if (ownerType === 'Portfolio') {
    const portfolio = await Portfolio.findOne({ user: providerId });
    if (!portfolio) throw new Error('Portfolio not found');

    return {
      ownerId: portfolio._id,
      ownerType: 'Portfolio',
    };
  }

  if (ownerType === 'Company') {
    const company = await Company.findOne({ owner: providerId });
    if (!company) throw new Error('Company not found');

    return {
      ownerId: company._id,
      ownerType: 'Company',
    };
  }

  throw new Error('Invalid owner type');
};


// CREATE
const addGalleryPhotos = async (req, res) => {
  console.log('adding to gallery...');

  try {
    const { urls } = req.body;

    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }

    const { ownerId, ownerType } = await resolveOwner(
      req.params.providerId,
    );

    const last = await GalleryPhoto
      .findOne({ ownerId, ownerType })
      .sort('-order');

    let startOrder = last ? last.order + 1 : 0;

    const docs = urls.map((url, i) => ({
      url,
      ownerId,
      ownerType,
      order: startOrder + i,
    }));

    const hasPrimary = await GalleryPhoto.exists({
      ownerId,
      ownerType,
      isPrimary: true,
    });

    if (!hasPrimary) {
      docs[0].isPrimary = true;
    }

    await GalleryPhoto.insertMany(docs);

    const gallery = await GalleryPhoto.find({
      ownerId,
      ownerType,
    }).sort('order');

    res.json({ galleryPhotos: gallery });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getGalleryPhotos = async (req, res) => {
  try {
    const { ownerId, ownerType } = await resolveOwner(
      req.params.providerId,
    );

    const gallery = await GalleryPhoto.find({
      ownerId,
      ownerType,
    }).sort('order');

    res.json({ galleryPhotos: gallery });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const deleteGalleryPhoto = async (req, res) => {
  try {
    const { ownerId, ownerType } = await resolveOwner(
      req.params.providerId,
    );

    const result = await GalleryPhoto.deleteOne({
      _id: req.params.photoId,
      ownerId,
      ownerType,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const gallery = await GalleryPhoto.find({
      ownerId,
      ownerType,
    }).sort('order');

    res.json({ galleryPhotos: gallery });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const reorderGalleryPhoto = async (req, res) => {
  try {
    const { from, to } = req.body;

    const { ownerId, ownerType } = await resolveOwner(
      req.params.providerId,
    );

    const gallery = await GalleryPhoto.find({
      ownerId,
      ownerType,
    }).sort('order');

    if (
      from < 0 || from >= gallery.length ||
      to < 0 || to >= gallery.length
    ) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    const item = gallery.splice(from, 1)[0];
    gallery.splice(to, 0, item);

    const bulkOps = gallery.map((photo, index) => ({
      updateOne: {
        filter: { _id: photo._id },
        update: { order: index },
      },
    }));

    await GalleryPhoto.bulkWrite(bulkOps);

    const updated = await GalleryPhoto.find({
      ownerId,
      ownerType,
    }).sort('order');

    res.json({ galleryPhotos: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const resolveOwnerWithSession = async (providerId, session) => {

  const company = await Company.findOne({ owner: providerId });

  const ownerType = company ? 'Company' : 'Portfolio';

  if (ownerType === 'Portfolio') {
    const portfolio = await Portfolio.findOne({ user: providerId }).session(session);
    if (!portfolio) throw new Error('Portfolio not found');

    return { ownerId: portfolio._id, ownerType: 'Portfolio' };
  }

  if (ownerType === 'Company') {
    const company = await Company.findOne({ owner: providerId }).session(session);
    if (!company) throw new Error('Company not found');

    return { ownerId: company._id, ownerType: 'Company' };
  }

  throw new Error('Invalid owner type');
};

const setPrimaryGalleryPhoto = async (req, res) => {
  const session = await mongoose.startSession();
  console.log(req.params);
  session.startTransaction();

  try {
    const { providerId, photoId } = req.params;

    const { ownerId, ownerType } = await resolveOwnerWithSession(
      providerId,
      session,
    );

    // ensure photo belongs to owner
    const photo = await GalleryPhoto.findOne({
      _id: photoId,
      ownerId,
      ownerType,
    }).session(session);

    if (!photo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Photo not found' });
    }

    // reset all
    await GalleryPhoto.updateMany(
      { ownerId, ownerType },
      { $set: { isPrimary: false } },
      { session },
    );

    // set selected
    await GalleryPhoto.updateOne(
      { _id: photoId },
      { $set: { isPrimary: true } },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    const gallery = await GalleryPhoto.find({
      ownerId,
      ownerType,
    })
      .sort('order')
      .select('url order isPrimary')
      .lean();

    return res.json({ galleryPhotos: gallery });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({ error: err.message });
  }
};

module.exports = { addGalleryPhotos, getGalleryPhotos, deleteGalleryPhoto, reorderGalleryPhoto, setPrimaryGalleryPhoto };
