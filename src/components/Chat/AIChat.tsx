import React, { useState, useRef, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

interface Message {
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      text: newMessage,
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      // Here you would integrate with your AI service
      // For now, we'll simulate a response
      const aiResponse = await simulateAIResponse(newMessage);

      const aiMessage: Message = {
        text: aiResponse,
        sender: "ai",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAIResponse = async (message: string): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple response logic - in reality, you'd call your AI service here
    if (message.toLowerCase().includes("unsafe")) {
      return "If you feel unsafe, please: 1. Stay in well-lit areas 2. Share your location with trusted contacts 3. Call emergency services if needed 4. Use the SOS button in this app";
    }
    return "I'm here to help. How can I assist you with your safety concerns?";
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, height: "400px", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h6" gutterBottom>
        Safety Assistant
      </Typography>

      <List sx={{ flexGrow: 1, overflow: "auto", mb: 2 }}>
        {messages.map((message, index) => (
          <ListItem
            key={index}
            sx={{
              justifyContent:
                message.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                maxWidth: "70%",
                backgroundColor:
                  message.sender === "user" ? "primary.main" : "grey.100",
                color: message.sender === "user" ? "white" : "text.primary",
              }}
            >
              <ListItemText primary={message.text} />
            </Paper>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask for safety advice..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </Button>
      </Box>
    </Paper>
  );
};

export default AIChat;
