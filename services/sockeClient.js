const axios = require('axios');

const sendNotification = async (notificationData, event) => {

  console.log('Sending notification to socket service:', notificationData);

  try {
    await axios.post(
      `${process.env.SOCKET_SERVICE_URL}/internal/notify`, {
        event: 'new_notification',
        payload: notificationData,
        user: notificationData.user,
      },
    );

    console.log('Notification sent successfully');
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error('Error sending notification:', error.response);
  }
};

module.exports = {
  sendNotification,
};

