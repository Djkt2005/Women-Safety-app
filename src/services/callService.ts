interface CallResponse {
  success: boolean;
  callId?: string;
  error?: string;
}

export const initiateCall = async (phoneNumber: string): Promise<CallResponse> => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/initiate-call`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to initiate call");
    }

    return data;
  } catch (error) {
    console.error("Error initiating call:", error);
    throw error;
  }
}; 