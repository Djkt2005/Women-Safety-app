import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import { sendMessage, initializeChat } from "../../services/aiService";

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

  useEffect(() => {
    // Initialize chat session
    initializeChat();
    
    // Add welcome message
    setMessages([
      {
        text: "Hello! I'm your AI safety assistant. How can I help you today?",
        sender: "ai",
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      text: newMessage,
      sender: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      const aiResponse = await sendMessage(newMessage);
      
      const aiMessage: Message = {
        text: aiResponse,
        sender: "ai",
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "I apologize, but I'm having trouble responding right now. Please try again.",
          sender: "ai",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card
        sx={{
          background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, overflow: "auto", mb: 2 }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    background: message.sender === "user" ? "primary.main" : "background.paper",
                    borderRadius: 2,
                    display: "flex",
                    gap: 1,
                  }}
                >
                  {message.sender === "ai" ? (
                    <SmartToyIcon fontSize="small" sx={{ mt: 0.5 }} />
                  ) : (
                    <PersonIcon fontSize="small" sx={{ mt: 0.5 }} />
                  )}
                  <Typography>{message.text}</Typography>
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={isLoading || !newMessage.trim()}
              sx={{
                bgcolor: "primary.main",
                borderRadius: 3,
                width: 56,
                height: 56,
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AIChat; 