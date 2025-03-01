import React, { useEffect, useState } from "react";
import TripTracker from "./triptracker";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
} from "@mui/material";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";
import { useLocation } from "../../contexts/LocationContext";
import { useAuth } from "../../contexts/AuthContext";
import ShareIcon from "@mui/icons-material/Share";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import SOSButton from "./SOSButton";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface AlertType {
  id: string;
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  location: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  userId: string;
}

const severityColors = {
  low: "#FFC107", // Yellow
  medium: "#FF9800", // Orange
  high: "#F44336", // Red
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
  borderRadius: "12px",
  overflow: "hidden",
};

const mapStyles = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
];

const alertTypes = [
  "Suspicious Activity",
  "Harassment",
  "Unsafe Area",
  "Medical Emergency",
  "Fire",
  "Other",
];

const MONITORING_RADIUS = 300; // 300 meters

const LocationOverlay = ({ location }: { location: GeolocationPosition }) => (
  <Box
    sx={{
      position: "absolute",
      top: 16,
      right: 16,
      zIndex: 1,
      maxWidth: 200,
      width: "auto",
    }}
  >
    <Card
      sx={{
        background: "rgba(33, 33, 33, 0.75)",
        backdropFilter: "blur(8px)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LocationOnIcon fontSize="small" color="primary" />
          <Typography variant="caption" color="primary.light">
            {location.coords.latitude.toFixed(6)},{" "}
            {location.coords.longitude.toFixed(6)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption">
            {new Date(location.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  </Box>
);

const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const LocationTracking = () => {
  const { currentLocation, error, startTracking } = useLocation();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high",
  });

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AlertType[];
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAlert = async () => {
    if (!currentLocation || !user) return;

    try {
      // First close the dialog
      handleCloseDialog();

      // Then add the alert
      await addDoc(collection(db, "alerts"), {
        ...newAlert,
        location: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        },
        timestamp: Date.now(),
        userId: user.uid,
      });
    } catch (error) {
      console.error("Error adding alert:", error);
      // Reopen dialog if there's an error
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewAlert({
      type: "",
      description: "",
      severity: "medium",
    });
  };

  const center = currentLocation
    ? {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      }
    : {
        lat: 0,
        lng: 0,
      };

  const handleShareLocation = async () => {
    if (currentLocation) {
      try {
        await navigator.share({
          title: "My Location",
          text: `My current location: ${currentLocation.coords.latitude}, ${currentLocation.coords.longitude}`,
          url: `https://www.google.com/maps?q=${currentLocation.coords.latitude},${currentLocation.coords.longitude}`,
        });
      } catch (error) {
        console.error("Error sharing location:", error);
      }
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={startTracking} variant="contained" sx={{ mt: 2 }}>
          Retry Location Access
        </Button>
      </Box>
    );
  }

  if (!currentLocation) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography>Acquiring location...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontWeight: 600,
            color: "primary.main",
          }}
        >
          <MyLocationIcon sx={{ fontSize: 40 }} />
          Live Tracking
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleShareLocation}
            disabled={!currentLocation}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              "&:hover": {
                transform: "translateY(-2px)",
                transition: "transform 0.2s",
              },
            }}
          >
            Share Location
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              background: "linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)",
              "&:hover": {
                transform: "translateY(-2px)",
                transition: "transform 0.2s",
              },
            }}
          >
            Report Alert
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Map Card */}
        <TripTracker></TripTracker>
        {/* Recent Alerts Section */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              position: "relative",
              overflow: "visible",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                <WarningIcon sx={{ color: "primary.main" }} />
                Recent Alerts
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 2,
                }}
              >
                {alerts.length > 0 ? (
                  alerts
                    .filter(
                      (alert) =>
                        calculateDistance(
                          {
                            lat: currentLocation.coords.latitude,
                            lng: currentLocation.coords.longitude,
                          },
                          alert.location
                        ) <= MONITORING_RADIUS
                    )
                    .map((alert) => (
                      <Box
                        key={alert.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          transition: "transform 0.2s, background-color 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {alert.type}
                          </Typography>
                          <Chip
                            label={alert.severity.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: severityColors[alert.severity],
                              color: "white",
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {alert.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                            textAlign: "right",
                            fontFamily: "monospace",
                          }}
                        >
                          {new Date(alert.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    ))
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 4 }}
                  >
                    No recent alerts in your area
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Report New Alert</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Alert Type"
            value={newAlert.type}
            onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
            margin="normal"
          >
            {alertTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Description"
            value={newAlert.description}
            onChange={(e) =>
              setNewAlert({ ...newAlert, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            select
            fullWidth
            label="Severity"
            value={newAlert.severity}
            onChange={(e) =>
              setNewAlert({
                ...newAlert,
                severity: e.target.value as "low" | "medium" | "high",
              })
            }
            margin="normal"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddAlert}
            disabled={!newAlert.type || !newAlert.description}
          >
            Report Alert
          </Button>
        </DialogActions>
      </Dialog>

      <SOSButton />
    </Container>
  );
};

export default LocationTracking;
