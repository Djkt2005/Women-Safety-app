interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendSMS = async (
  to: string,
  message: string
): Promise<SMSResponse> => {
  try {
    const response = await fetch(
      `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }/api/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          message,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to send SMS");
    }

    return data;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};
