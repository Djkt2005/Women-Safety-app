import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningIcon from "@mui/icons-material/Warning";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatIcon from "@mui/icons-material/Chat";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useLocation } from "../contexts/LocationContext";
import SOSButton from "./Safety/SOSButton";

const DashboardCard = ({
  title,
  icon,
  description,
  onClick,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  color: string;
}) => (
  <Card
    sx={{
      height: "100%",
      cursor: "pointer",
      background: "linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-8px)",
        boxShadow: "0 12px 20px rgba(0,0,0,0.4)",
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ height: "100%", p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${color}20`,
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "12px",
  overflow: "hidden",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentLocation, startTracking } = useLocation();

  useEffect(() => {
    startTracking();
  }, [startTracking]);

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
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 500,
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <SecurityIcon sx={{ fontSize: 40 }} />
          Safety Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your personal safety companion. Stay protected with our
          comprehensive safety features.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Map Section */}
        <Grid item xs={12}>
          <Card
            sx={{
              background: "linear-gradient(45deg, #132f4c 30%, #173d5f 90%)",
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Your Current Location
                </Typography>
                {currentLocation && (
                  <Typography variant="body2" color="text.secondary">
                    Lat: {currentLocation.coords.latitude.toFixed(6)}, Long:{" "}
                    {currentLocation.coords.longitude.toFixed(6)}
                  </Typography>
                )}
              </Box>
              <LoadScript googleMapsApiKey="AIzaSyCy0kXXsgj80wczOd2I0zNkB3y7AdSAcUo">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={15}
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
                      {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                      },
                    ],
                  }}
                >
                  {currentLocation && (
                    <Marker
                      position={{
                        lat: currentLocation.coords.latitude,
                        lng: currentLocation.coords.longitude,
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Cards */}
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Live Location"
            icon={<LocationOnIcon fontSize="large" />}
            description="Share your real-time location with trusted contacts and enable location tracking."
            onClick={() => navigate("/location")}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Community Alerts"
            icon={<WarningIcon fontSize="large" />}
            description="View and report safety concerns in your area. Stay informed about local incidents."
            onClick={() => navigate("/alerts")}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="Fake Call"
            icon={<PhoneIcon fontSize="large" />}
            description="Generate a fake incoming call to help you exit uncomfortable situations."
            onClick={() => navigate("/fake-call")}
            color="#f50057"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <DashboardCard
            title="AI Safety Assistant"
            icon={<ChatIcon fontSize="large" />}
            description="Get instant safety advice and emergency guidance from our AI assistant."
            onClick={() => navigate("/ai-chat")}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* SOS Button */}
      <SOSButton />
    </Container>
  );
};

export default Dashboard;
