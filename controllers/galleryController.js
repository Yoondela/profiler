const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const Portfolio = require('../models/Portfolio');

const addGalleryPhotos = async (req, res) => {
  console.log('Adding to gallery..');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { urls } = req.body;

    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }

    // Transform URLs -> objects
    const newImages = urls.map(url => ({
      url,
      // id: uuid(),
    }));

    portfolio.galleryPhotos.push(...newImages);
    await portfolio.save();

    res.json({galleryPhotos: portfolio.galleryPhotos});
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGalleryPhotos = async (req, res) => {
  console.log('Getting gallery..');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });

    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });

    res.json({galleryPhotos: portfolio.galleryPhotos});
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteGalleryPhoto = async (req, res) => {
  console.log('Deleting gallery photo..');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const photoId = req.params.photoId;

    // Filter out the photo
    const newGallery = portfolio.galleryPhotos.filter(
      (photo) => photo._id.toString() !== photoId,
    );

    if (newGallery.length === portfolio.galleryPhotos.length) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    portfolio.galleryPhotos = newGallery;
    await portfolio.save();

    res.json({galleryPhotos: portfolio.galleryPhotos});
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const reorderGalleryPhoto = async (req, res) => {
  console.log('Reordering gallery..');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { from, to } = req.body;

    if (
      from < 0 || from >= portfolio.galleryPhotos.length ||
      to < 0 || to >= portfolio.galleryPhotos.length
    ) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    const item = portfolio.galleryPhotos.splice(from, 1)[0];
    portfolio.galleryPhotos.splice(to, 0, item);

    await portfolio.save();

    res.json({galleryPhotos: portfolio.galleryPhotos});
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addGalleryPhotos, getGalleryPhotos, deleteGalleryPhoto, reorderGalleryPhoto };
