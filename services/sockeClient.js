const axios = require('axios');

const sendNotification = async (notificationData) => {

  try {
    await axios.post(
      `${process.env.SOCKET_SERVICE_URL}/internal/notify`,
      notificationData,
    );
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = {
  sendNotification,
};

