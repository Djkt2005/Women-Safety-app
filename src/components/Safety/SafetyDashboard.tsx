import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert as MuiAlert,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Circle,
  InfoWindow,
} from "@react-google-maps/api";
import { useLocation } from "../../contexts/LocationContext";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import ShareIcon from "@mui/icons-material/Share";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SOSButton from "./SOSButton";

// Define interfaces and constants
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
  low: "#FFC107",    // Yellow
  medium: "#FF9800", // Orange
  high: "#F44336",   // Red
};

const handleShareLocation = () => {
  // Implement location sharing logic
  if (navigator.share) {
    navigator.share({
      title: 'My Location',
      text: 'Check my current location',
      url: window.location.href
    }).catch(console.error);
  }
};

const mapContainerStyle = {
  width: "100%",
  height: "600px",
  borderRadius: "12px",
  overflow: "hidden",
};

const SafetyDashboard = () => {
  // Combine state from both components
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [newAlert, setNewAlert] = useState({
    type: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high",
  });
  const [shareEnabled, setShareEnabled] = useState(false);
  const [safeZoneRadius, setSafeZoneRadius] = useState(1000);

  const { currentLocation, isTracking, startTracking, stopTracking } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    startTracking();
    // Subscribe to alerts
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData: AlertType[] = [];
      snapshot.forEach((doc) => {
        alertsData.push({ id: doc.id, ...doc.data() } as AlertType);
      });
      setAlerts(alertsData);
    });

    return () => {
      unsubscribe();
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  const center = currentLocation
    ? {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      }
    : {
        lat: 0,
        lng: 0,
      };

  const handleAddAlert = async () => {
    if (!currentLocation || !user) return;

    try {
      await addDoc(collection(db, "alerts"), {
        ...newAlert,
        location: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        },
        timestamp: Date.now(),
        userId: user.uid,
      });

      setNewAlert({
        type: "",
        description: "",
        severity: "medium",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding alert:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
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
              component="h1"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                color: "primary.main",
              }}
            >
              <MyLocationIcon sx={{ fontSize: 40 }} />
              Safety Dashboard
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={handleShareLocation}
                disabled={!currentLocation}
              >
                Share Location
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsDialogOpen(true)}
              >
                Report Alert
              </Button>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)" }}>
            <CardContent sx={{ p: 0 }}>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={14}
                  options={{
                    styles: [
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
                    ],
                  }}
                >
                  {currentLocation && (
                    <>
                      <Marker position={center} />
                      <Circle
                        center={center}
                        radius={safeZoneRadius}
                        options={{
                          fillColor: "#4CAF50",
                          fillOpacity: 0.1,
                          strokeColor: "#4CAF50",
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                        }}
                      />
                    </>
                  )}

                  {alerts.map((alert) => (
                    <Marker
                      key={alert.id}
                      position={alert.location}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: severityColors[alert.severity],
                        fillOpacity: 0.7,
                        strokeWeight: 2,
                        strokeColor: severityColors[alert.severity],
                      }}
                      onClick={() => setSelectedAlert(alert)}
                    />
                  ))}

                  {selectedAlert && (
                    <InfoWindow
                      position={selectedAlert.location}
                      onCloseClick={() => setSelectedAlert(null)}
                    >
                      <Box>
                        <Typography variant="h6">{selectedAlert.type}</Typography>
                        <Typography variant="body2">{selectedAlert.description}</Typography>
                        <Chip
                          label={selectedAlert.severity.toUpperCase()}
                          color={selectedAlert.severity === 'high' ? 'error' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </CardContent>
          </Card>
        </Grid>

        {/* Add Current Location Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Location
              </Typography>
              {currentLocation ? (
                <Typography variant="body2" color="text.secondary">
                  Latitude: {currentLocation.coords.latitude.toFixed(6)}
                  <br />
                  Longitude: {currentLocation.coords.longitude.toFixed(6)}
                  <br />
                  Accuracy: ±{currentLocation.coords.accuracy.toFixed(0)}m
                </Typography>
              ) : (
                <MuiAlert severity="info">Acquiring location...</MuiAlert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Add Recent Alerts Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon />
                Recent Alerts
              </Typography>
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1">{alert.type}</Typography>
                      <Chip
                        label={alert.severity.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: severityColors[alert.severity],
                          color: 'white',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {alert.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent alerts in your area
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Alert Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Report New Alert</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Alert Type"
            value={newAlert.type}
            onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={newAlert.description}
            onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            select
            fullWidth
            label="Severity"
            value={newAlert.severity}
            onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as "low" | "medium" | "high" })}
            margin="normal"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAlert}>
            Report Alert
          </Button>
        </DialogActions>
      </Dialog>

      <SOSButton />
    </Container>
  );
};

export default SafetyDashboard; 