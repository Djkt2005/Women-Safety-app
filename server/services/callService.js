const twilio = require("twilio");

class CallService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async initiateCall(to) {
    try {
      // Format phone number
      const cleaned = to.replace(/\D/g, "");
      const fullNumber = to.startsWith("+91") ? to : `+91${cleaned}`;

      console.log(`Initiating call to ${fullNumber}`);

      const call = await this.client.calls.create({
        url: 'http://demo.twilio.com/docs/voice.xml', // This is a Twilio demo TwiML
        to: fullNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log("Call initiated successfully:", call.sid);

      return {
        success: true,
        callId: call.sid,
        status: call.status,
      };
    } catch (error) {
      console.error("Call Service Error:", error.message);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }
}

module.exports = new CallService(); 