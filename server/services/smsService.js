const twilio = require("twilio");

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSMS(to, message) {
    try {
      // Format phone number for India
      const cleaned = to.replace(/\D/g, ""); // Remove non-digits

      // Only add +91 if the number doesn't start with +91
      const fullNumber = to.startsWith("+91") ? to : `+91${cleaned}`;

      console.log(`Attempting to send SMS to ${fullNumber}`);

      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: fullNumber,
      });

      console.log("SMS sent successfully:", response.sid);

      return {
        success: true,
        messageId: response.sid,
        status: response.status,
      };
    } catch (error) {
      console.error("SMS Service Error:", error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}

module.exports = new SMSService();
