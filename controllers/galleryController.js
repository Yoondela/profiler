const Portfolio = require('../models/Portfolio');

const addGalleryPhotos = async (req, res) => {
  console.log('Appending to gallery..');
  console.log(req.params);
  console.log(req.body);
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { urls } = req.body;

    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }

    portfolio.galleryPhotosUrls.push(...urls);
    await portfolio.save();

    res.json(portfolio.galleryPhotosUrls);
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const deleteGalleryPhoto = async (req, res) => {
  console.log('Deleting from gallery');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.providerId });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const index = parseInt(req.params.index);
    if (index < 0 || index >= portfolio.galleryPhotosUrls.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    portfolio.galleryPhotosUrls.splice(index, 1);
    await portfolio.save();

    res.json(portfolio.galleryPhotosUrls);
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const reorderGalleryPhoto = async (req, res) => {
  console.log('Reordering gallery');
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.id });
    if (!portfolio) return res.status(404).json({ error: 'Not found' });

    const { from, to } = req.body;

    if (
      from < 0 || from >= portfolio.galleryPhotosUrls.length ||
      to < 0 || to >= portfolio.galleryPhotosUrls.length
    ) {
      return res.status(400).json({ error: 'Invalid index' });
    }

    const item = portfolio.galleryPhotosUrls.splice(from, 1)[0];
    portfolio.galleryPhotosUrls.splice(to, 0, item);

    await portfolio.save();

    res.json(portfolio.galleryPhotosUrls);
    console.log('Successful!');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addGalleryPhotos, deleteGalleryPhoto, reorderGalleryPhoto };
