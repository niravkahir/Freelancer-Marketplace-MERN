// Will be used for sending emails (welcome, password reset, notifications)
// For now, just a placeholder
const sendEmail = async (options) => {
    // Implement email sending logic later
    console.log('Email sent to:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
};

module.exports = sendEmail;