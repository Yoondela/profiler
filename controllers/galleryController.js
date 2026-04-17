const GalleryPhoto = require('../models/GalleryPhoto');
const Portfolio = require('../models/Portfolio');

const OWNER_TYPE = 'Portfolio';

// CREATE
const addGalleryPhotos = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }

    // get current max order
    const last = await GalleryPhoto
      .findOne({ ownerId: portfolio._id, ownerType: OWNER_TYPE })
      .sort('-order');

    let startOrder = last ? last.order + 1 : 0;

    const docs = urls.map((url, i) => ({
      url,
      ownerId: portfolio._id,
      ownerType: OWNER_TYPE,
      order: startOrder + i,
    }));

    await GalleryPhoto.insertMany(docs);

    const gallery = await GalleryPhoto.find({
      ownerId: portfolio._id,
      ownerType: OWNER_TYPE,
    }).sort('order');

    res.json({ galleryPhotos: gallery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGalleryPhotos = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const gallery = await GalleryPhoto.find({
      ownerId: portfolio._id,
      ownerType: OWNER_TYPE,
    }).sort('order');

    res.json({ galleryPhotos: gallery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteGalleryPhoto = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const result = await GalleryPhoto.deleteOne({
      _id: req.params.photoId,
      ownerId: portfolio._id,
      ownerType: OWNER_TYPE,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const gallery = await GalleryPhoto.find({
      ownerId: portfolio._id,
      ownerType: OWNER_TYPE,
    }).sort('order');

    res.json({ galleryPhotos: gallery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const reorderGalleryPhoto = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { from, to } = req.body;

    const gallery = await GalleryPhoto.find({
      ownerId: portfolio._id,
      ownerType: 'Portfolio',
    }).sort('order');

    if (
      from < 0 || from >= gallery.length ||
      to < 0 || to >= gallery.length
    ) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    // reorder in memory
    const item = gallery.splice(from, 1)[0];
    gallery.splice(to, 0, item);

    // build bulk operations
    const bulkOps = gallery.map((photo, index) => ({
      updateOne: {
        filter: { _id: photo._id },
        update: { order: index },
      },
    }));

    await GalleryPhoto.bulkWrite(bulkOps);

    const updated = await GalleryPhoto.find({
      ownerId: portfolio._id,
      ownerType: 'Portfolio',
    }).sort('order');

    res.json({ galleryPhotos: updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = { addGalleryPhotos, getGalleryPhotos, deleteGalleryPhoto, reorderGalleryPhoto };
