import React, { useState } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { initiateCall } from "../../services/callService";

const FakeCall = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const handleFakeCall = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get user's phone number from profile
      const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
      const profile = profileDoc.data();

      if (!profile?.phoneNumber) {
        throw new Error("Phone number not found in profile");
      }

      // Initiate the call
      await initiateCall(profile.phoneNumber);

      setSnackbar({
        open: true,
        message: "Incoming call initiated",
        severity: "success",
      });
    } catch (error) {
      console.error("Error initiating fake call:", error);
      setSnackbar({
        open: true,
        message: "Failed to initiate call",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card
        sx={{
          background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Fake Call
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Receive a call to your registered phone number
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={isLoading ? <CircularProgress size={24} /> : <PhoneIcon />}
              onClick={handleFakeCall}
              disabled={isLoading}
              sx={{
                borderRadius: 2,
                py: 2,
                px: 4,
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              }}
            >
              {isLoading ? "Initiating Call..." : "Receive Fake Call"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FakeCall;
