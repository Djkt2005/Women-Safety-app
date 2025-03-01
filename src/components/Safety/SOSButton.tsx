import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import EmergencyShareIcon from "@mui/icons-material/Share";
import PhoneIcon from "@mui/icons-material/Phone";
import { useLocation } from "../../contexts/LocationContext";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import ErrorIcon from "@mui/icons-material/Error";
import { sendSMS } from "../../services/smsService";

const SOSButton = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { currentLocation } = useLocation();
  const { user } = useAuth();

  const notifyEmergencyContacts = async () => {
    if (!user || !currentLocation) return;

    try {
      // Get emergency contacts from Firestore
      const contactsDoc = await getDoc(doc(db, "emergency_contacts", user.uid));
      const contacts = contactsDoc.data()?.contacts || [];

      // Get user profile details
      const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
      const profile = profileDoc.data() || {};

      // Google Maps link to the location
      const locationLink = `https://www.google.com/maps?q=${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;

      // Create detailed emergency message
      const createEmergencyMessage = () => {
        const message = [
          "Safety Alert:",
          `${profile.displayName || user.displayName || 'Emergency Contact'} requires assistance.`,
          "",
          "Contact Information:",
          `Name: ${profile.displayName || user.displayName || 'N/A'}`,
          `Phone: ${profile.phoneNumber || 'N/A'}`,
          `Blood Group: ${profile.bloodGroup || 'N/A'}`,
          `Address: ${profile.address || 'N/A'}`,
          "",
          "Current Location:",
          locationLink,
          "",
          "Please respond immediately.",
        ].join("\n");

        return message;
      };

      // Send SMS to each emergency contact
      const smsPromises = contacts.map(
        async (contact: { name: string; phone: string }) => {
          try {
            await sendSMS(contact.phone, createEmergencyMessage());
            console.log(`Successfully sent SMS to ${contact.name}`);
            return true;
          } catch (error) {
            console.error(`Failed to send SMS to ${contact.name}:`, error);
            return false;
          }
        }
      );

      const results = await Promise.all(smsPromises);
      const successCount = results.filter(Boolean).length;

      setSnackbar({
        open: true,
        message: `Alert sent to ${successCount} emergency contacts`,
        severity: successCount > 0 ? "success" : "error",
      });
    } catch (error) {
      console.error("Error notifying emergency contacts:", error);
      setSnackbar({
        open: true,
        message: "Failed to notify emergency contacts",
        severity: "error",
      });
    }
  };

  const handleSOS = async () => {
    setIsActivating(true);
    try {
      if (user && currentLocation) {
        // Create SOS alert
        await setDoc(doc(db, "sos_alerts", `${user.uid}_${Date.now()}`), {
          userId: user.uid,
          timestamp: Date.now(),
          location: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          status: "active",
        });

        // Notify emergency contacts
        await notifyEmergencyContacts();

        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error activating SOS:", error);
      setSnackbar({
        open: true,
        message: "Failed to activate SOS alert",
        severity: "error",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleMarkAsSafe = async () => {
    try {
      if (!user) return;

      // Update the latest emergency alert for this user
      const alertsRef = collection(db, "emergencyAlerts");
      await updateDoc(doc(alertsRef, user.uid), {
        status: "resolved",
        resolvedAt: Date.now(),
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error marking as safe:", error);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={handleSOS}
          disabled={isActivating}
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            fontSize: "1.2rem",
            fontWeight: "bold",
            boxShadow: "0 4px 20px rgba(244, 67, 54, 0.5)",
            animation: isActivating ? "pulse 1.5s infinite" : "none",
            "@keyframes pulse": {
              "0%": {
                transform: "scale(1)",
                boxShadow: "0 4px 20px rgba(244, 67, 54, 0.5)",
              },
              "50%": {
                transform: "scale(1.05)",
                boxShadow: "0 4px 30px rgba(244, 67, 54, 0.7)",
              },
              "100%": {
                transform: "scale(1)",
                boxShadow: "0 4px 20px rgba(244, 67, 54, 0.5)",
              },
            },
          }}
        >
          {isActivating ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "SOS"
          )}
        </Button>
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ErrorIcon color="error" />
          SOS Alert Activated
        </DialogTitle>
        <DialogContent>
          <Typography>
            Emergency contacts have been notified of your location via SMS. Stay
            calm and seek help if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SOSButton;
