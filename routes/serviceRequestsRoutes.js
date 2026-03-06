const express = require('express');
const checkJwt = require('../middleware/auth');
const {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestById,
  getServiceRequestsByUserId,
  updateServiceRequestStatus,
} = require('../controllers/serviceRequestController');

const router = express.Router();

router.post('/service-requests', checkJwt, createServiceRequest);
router.get('/service-requests', checkJwt, getAllServiceRequests);
router.get('/service-requests/:id', checkJwt, getServiceRequestById);
router.get('/service-requests/user/:userId', checkJwt, getServiceRequestsByUserId);
router.patch('/service-requests/status/:requestId', checkJwt, updateServiceRequestStatus);

module.exports = router;
