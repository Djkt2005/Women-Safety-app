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
  Alert,
  Chip,
} from "@mui/material";
import {
  GoogleMap,
  LoadScript,
  Marker,
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
import ReportIcon from "@mui/icons-material/Report";

interface Alert {
  id: string;
  type: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Timestamp;
  userId: string;
  severity: "low" | "medium" | "high";
}

const alertTypes = [
  { value: "suspicious", label: "Suspicious Activity" },
  { value: "harassment", label: "Harassment" },
  { value: "unsafe", label: "Unsafe Area" },
  { value: "emergency", label: "Emergency" },
];

const severityColors = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
};

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
  overflow: "hidden",
};

const CommunityAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [newAlert, setNewAlert] = useState({
    type: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high",
  });
  const { currentLocation, startTracking } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    startTracking();
    // Subscribe to alerts
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData: Alert[] = [];
      snapshot.forEach((doc) => {
        alertsData.push({ id: doc.id, ...doc.data() } as Alert);
      });
      setAlerts(alertsData);
    });

    return () => unsubscribe();
  }, [startTracking]);

  const handleSubmitAlert = async () => {
    if (!currentLocation || !user) return;

    try {
      await addDoc(collection(db, "alerts"), {
        type: newAlert.type,
        description: newAlert.description,
        severity: newAlert.severity,
        location: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        },
        timestamp: Timestamp.now(),
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

  const center = currentLocation
    ? {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
      }
    : {
        lat: 0,
        lng: 0,
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
              <WarningIcon sx={{ fontSize: 40 }} />
              Community Alerts
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsDialogOpen(true)}
            >
              Report Alert
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <LoadScript googleMapsApiKey="AIzaSyCy0kXXsgj80wczOd2I0zNkB3y7AdSAcUo">
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
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {
                            alertTypes.find(
                              (t) => t.value === selectedAlert.type
                            )?.label
                          }
                        </Typography>
                        <Typography variant="body2">
                          {selectedAlert.description}
                        </Typography>
                        <Chip
                          size="small"
                          label={selectedAlert.severity.toUpperCase()}
                          sx={{
                            mt: 1,
                            bgcolor: severityColors[selectedAlert.severity],
                            color: "white",
                          }}
                        />
                      </Box>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              <Grid container spacing={2}>
                {alerts.slice(0, 3).map((alert) => (
                  <Grid item xs={12} md={4} key={alert.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <ReportIcon
                            sx={{ color: severityColors[alert.severity] }}
                          />
                          <Typography variant="subtitle1">
                            {
                              alertTypes.find((t) => t.value === alert.type)
                                ?.label
                            }
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {alert.description}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {alert.timestamp.toDate().toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report New Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Alert Type"
              value={newAlert.type}
              onChange={(e) =>
                setNewAlert({ ...newAlert, type: e.target.value })
              }
              fullWidth
            >
              {alertTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Severity"
              value={newAlert.severity}
              onChange={(e) =>
                setNewAlert({
                  ...newAlert,
                  severity: e.target.value as "low" | "medium" | "high",
                })
              }
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>

            <TextField
              label="Description"
              multiline
              rows={4}
              value={newAlert.description}
              onChange={(e) =>
                setNewAlert({ ...newAlert, description: e.target.value })
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitAlert}
            variant="contained"
            disabled={!newAlert.type || !newAlert.description}
          >
            Submit Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CommunityAlerts;
