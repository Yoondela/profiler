const axios = require('axios');


async function emitToUser(userId, event, payload) {
  console.log(`Emitting event '${event}' to user ${userId} with payload:`, payload);
  try {
    await axios.post(`${process.env.SOCKET_SERVICE_URL}/internal/emit-request`, {
      user: userId.toString(),
      event,
      payload,
    });
  } catch (error) {
    console.error('Socket emit failed:', error.response?.data || error.message);
  }
}

module.exports = { emitToUser };

