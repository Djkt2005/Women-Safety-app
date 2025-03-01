import React, { useState } from "react";
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  Grid,
  Paper,
  useTheme,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import SecurityIcon from "@mui/icons-material/Security";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SmartToyIcon from "@mui/icons-material/SmartToy";

interface UserProfile {
  displayName: string;
  phoneNumber: string;
  emergencyContact: string;
  address: string;
  bloodGroup: string;
  medicalConditions: string;
}

const steps = ["Welcome", "Personal Info", "Medical Info", "Features"];

const bloodGroups = [
  "A+", "A-",
  "B+", "B-",
  "O+", "O-",
  "AB+", "AB-"
];

const features = [
  {
    title: "Real-time Location Tracking",
    description: "Share your location with trusted contacts and set up safe zones",
    icon: <LocationOnIcon fontSize="large" />,
    color: "#4CAF50"
  },
  {
    title: "Emergency SOS",
    description: "Quick access to emergency services and automatic contact alerts",
    icon: <NotificationsActiveIcon fontSize="large" />,
    color: "#f44336"
  },
  {
    title: "Emergency Contacts",
    description: "Manage your trusted contacts for quick access during emergencies",
    icon: <ContactPhoneIcon fontSize="large" />,
    color: "#2196F3"
  },
  {
    title: "AI Safety Assistant",
    description: "Get instant safety advice and guidance from our AI assistant",
    icon: <SmartToyIcon fontSize="large" />,
    color: "#9C27B0"
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: user?.displayName || "",
    phoneNumber: "",
    emergencyContact: "",
    address: "",
    bloodGroup: "",
    medicalConditions: "",
  });

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      try {
        const docRef = doc(db, "user_profiles", user!.uid);
        await setDoc(docRef, {
          ...profile,
          createdAt: new Date().toISOString(),
          onboardingCompleted: true,
        });
        navigate("/dashboard");
      } catch (error) {
        console.error("Error saving profile:", error);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (field: keyof UserProfile) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                margin: "0 auto 20px",
              }}
            >
              <SecurityIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom>
              Welcome to SafetyApp
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your personal safety companion. Let's get you set up with some basic information
              to help keep you safe.
            </Typography>
          </Box>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={profile.displayName}
                onChange={handleChange("displayName")}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profile.phoneNumber}
                onChange={handleChange("phoneNumber")}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Emergency Contact"
                value={profile.emergencyContact}
                onChange={handleChange("emergencyContact")}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={profile.address}
                onChange={handleChange("address")}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Blood Group"
                value={profile.bloodGroup}
                onChange={handleChange("bloodGroup")}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Conditions"
                value={profile.medicalConditions}
                onChange={handleChange("medicalConditions")}
                multiline
                rows={3}
                helperText="List any allergies, conditions, or medications that emergency responders should know about"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    height: "100%",
                    background: `linear-gradient(45deg, ${feature.color}20 30%, ${feature.color}10 90%)`,
                    border: `1px solid ${feature.color}40`,
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        );

      default:
        return null;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: // Welcome step
        return true;
      case 1: // Personal Info step
        return !!(profile.displayName && profile.phoneNumber && profile.emergencyContact);
      case 2: // Medical Info step
        return true;
      case 3: // Features step
        return true;
      default:
        return false;
    }
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
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
            {activeStep !== 0 && (
              <Button onClick={handleBack}>Back</Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(activeStep)}
            >
              {activeStep === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Onboarding; 