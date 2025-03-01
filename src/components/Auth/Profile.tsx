import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Avatar,
  Grid,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

interface UserProfile {
  displayName: string;
  phoneNumber: string;
  emergencyContact: string;
  address: string;
  bloodGroup: string;
  medicalConditions: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    phoneNumber: "",
    emergencyContact: "",
    address: "",
    bloodGroup: "",
    medicalConditions: "",
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, "user_profiles", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showSnackbar("Failed to load profile", "error");
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const profileData = {
        displayName: profile.displayName,
        phoneNumber: profile.phoneNumber,
        emergencyContact: profile.emergencyContact,
        address: profile.address,
        bloodGroup: profile.bloodGroup,
        medicalConditions: profile.medicalConditions,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, "user_profiles", user.uid);
      await setDoc(docRef, profileData, { merge: true });
      
      setIsEditing(false);
      showSnackbar("Profile updated successfully", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile", "error");
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleChange = (field: keyof UserProfile) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card
        sx={{
          background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" component="h1">
                Profile
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 3,
              }}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={profile.displayName}
                onChange={handleChange("displayName")}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={profile.phoneNumber}
                onChange={handleChange("phoneNumber")}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Emergency Contact"
                value={profile.emergencyContact}
                onChange={handleChange("emergencyContact")}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Address"
                value={profile.address}
                onChange={handleChange("address")}
                disabled={!isEditing}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Blood Group"
                value={profile.bloodGroup}
                onChange={handleChange("bloodGroup")}
                disabled={!isEditing}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Medical Conditions"
                value={profile.medicalConditions}
                onChange={handleChange("medicalConditions")}
                disabled={!isEditing}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          <Typography variant="body2" color="text.secondary">
            Email: {user?.email}
          </Typography>
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

export default Profile; 