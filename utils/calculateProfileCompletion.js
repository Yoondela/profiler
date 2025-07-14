// utils/calculateProfileCompletion.js

function calculateProfileCompletion(profile) {
    let score = 0;
    const total = 6;
  
    if (profile.phone) score++;
    if (profile.address) score++;
    if (profile.bio) score++;
    if (profile.preferredContactMethod) score++;
  
    if (
      profile.notificationSettings &&
      (profile.notificationSettings.email || profile.notificationSettings.sms)
    ) {
      score++;
    }
  
    if (Array.isArray(profile.savedAddresses) && profile.savedAddresses.length > 0) {
      score++;
    }
  
    const percentage = Math.round((score / total) * 100);
    return percentage;
  }
  
  module.exports = calculateProfileCompletion;
  