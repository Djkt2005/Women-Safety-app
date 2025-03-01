import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, Card, CardContent, Typography, Button, Box, Alert, Paper 
} from '@mui/material';
import { 
  GoogleMap, Marker, DirectionsRenderer, DirectionsService, 
  LoadScript, Circle 
} from '@react-google-maps/api';

// Define TypeScript interfaces
interface Location {
  lat: number;
  lng: number;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};


const darkMapStyle = [
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
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

const TripTracker: React.FC = () => {
  // State variables
  const [currentLocation, setCurrentLocation] = useState<Location>({ lat: 40.7128, lng: -74.0060 });
  const [originalLocation, setOriginalLocation] = useState<Location>({ lat: 40.7128, lng: -74.0060 });
  const [destination, setDestination] = useState<Location | null>(null);
  const [routePath, setRoutePath] = useState<Location[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [deviationDistance, setDeviationDistance] = useState<number>(0);
  const [isDeviated, setIsDeviated] = useState<boolean>(false);
  // Add a new state variable for the directions result
const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const DEVIATION_THRESHOLD = 0.5; // 0.5 km = 500 meters
  const safeZoneRadius = 500; // 500 meters

  // Initialize the map when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setOriginalLocation(location);
        },
        () => {
          // Default location if geolocation fails (New York City)
          console.log("Geolocation permission denied, using default location");
        }
      );
    }

    // Cleanup function for when component unmounts
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Start tracking user's location
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!simulationActive) {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          setOriginalLocation(newLocation);
          
          if (destination) {
            checkRouteDeviation(newLocation);
          }
        }
      },
      (error) => {
        console.error("Error retrieving location:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );

    watchIdRef.current = watchId;
    setIsTracking(true);
  };

  // Stop tracking user's location
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      setIsDeviated(false);
    }
  };

  // Handle map click to set destination
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const clickedLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setDestination(clickedLocation);
    }
  };

  // Calculate route between current location and destination
  const calculateRoute = () => {
    if (!destination || !mapLoaded) return null;
  
    return (
      <DirectionsService
        options={{
          destination: destination,
          origin: currentLocation,
          travelMode: google.maps.TravelMode.DRIVING
        }}
        callback={(result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Store the entire directions result
            setDirectionsResponse(result);
            
            // Extract route path points for deviation calculations
            const routePoints = result.routes[0].overview_path.map(point => ({
              lat: point.lat(),
              lng: point.lng()
            }));
            setRoutePath(routePoints);
            
            // Extract route information
            if (result.routes[0].legs[0]) {
              setRouteInfo({
                distance: result.routes[0].legs[0].distance?.text || '',
                duration: result.routes[0].legs[0].duration?.text || ''
              });
            }
            
            checkRouteDeviation(currentLocation);
          } else {
            console.error("Directions request failed with status:", status);
          }
        }}
      />
    );
  };
  // Check if user has deviated from the route
  const checkRouteDeviation = (location: Location) => {
    if (!routePath.length) return;
    
    // Calculate minimum distance to route
    let minDistance = Infinity;
    for (const routePoint of routePath) {
      const distance = haversineDistance(location, routePoint);
      minDistance = Math.min(minDistance, distance);
    }
    
    const distanceInMeters = minDistance * 1000;
    setDeviationDistance(distanceInMeters);
    setIsDeviated(minDistance > DEVIATION_THRESHOLD);
  };

  // Simulate deviation from route
  const simulateDeviation = () => {
    if (!routePath.length) {
      alert("Please set a destination first");
      return;
    }
    
    if (!simulationActive) {
      setOriginalLocation(currentLocation);
    }
    
    // Find a point perpendicular to the route
    if (routePath.length >= 2) {
      // Get two adjacent points on the route
      const p1 = routePath[0];
      const p2 = routePath[1];
      
      // Calculate perpendicular direction
      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      
      // Perpendicular vector (normalized and scaled to ~600 meters)
      const perpDistance = 0.006; // Approximately 600 meters in lat/lng units
      const perpX = -dy * perpDistance / Math.sqrt(dx*dx + dy*dy);
      const perpY = dx * perpDistance / Math.sqrt(dx*dx + dy*dy);
      
      // Set new simulated location
      const simulatedLocation = {
        lat: p1.lat + perpY,
        lng: p1.lng + perpX
      };
      
      setCurrentLocation(simulatedLocation);
    } else {
      // Simple offset if route is too short
      setCurrentLocation(prev => ({
        lat: prev.lat + 0.006, // ~600 meters north
        lng: prev.lng
      }));
    }
    
    setSimulationActive(true);
    
    // Check deviation with the new simulated location
    setTimeout(() => {
      checkRouteDeviation(currentLocation);
    }, 100);
  };

  // Return to original route
  const returnToRoute = () => {
    if (!simulationActive) return;
    
    setCurrentLocation(originalLocation);
    setSimulationActive(false);
    
    // Check deviation with the original location
    setTimeout(() => {
      checkRouteDeviation(originalLocation);
    }, 100);
  };

  // Haversine formula to calculate distance between two coordinates
  const haversineDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Live Trip Tracking
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Card 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <CardContent sx={{ p: '0 !important' }}>
            <LoadScript 
              googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
              onLoad={() => setMapLoaded(true)}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentLocation}
                zoom={15}
                onClick={handleMapClick}
                onLoad={map => { mapRef.current = map; }}
                options={{
                  styles: darkMapStyle,
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                }}
              >
                {/* Current location marker */}
                <Marker
                  position={currentLocation}
                  animation={google.maps.Animation.DROP}
                />
                
                {/* Safe zone circle */}
                {isTracking && (
                  <Circle
                    center={currentLocation}
                    radius={safeZoneRadius}
                    options={{
                      fillColor: isDeviated ? "#FF5252" : "#4CAF50",
                      fillOpacity: 0.1,
                      strokeColor: isDeviated ? "#FF5252" : "#4CAF50",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                )}
                
                {/* Destination marker */}
                {destination && (
                  <Marker
                    position={destination}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#2196F3",
                      fillOpacity: 0.7,
                      strokeWeight: 2,
                      strokeColor: "#2196F3",
                    }}
                  />
                )}
                
                {/* Calculate and render route */}
                {destination && calculateRoute()}
                
                {/* Render directions if route exists */}
                {routePath.length > 0 && (
                  <DirectionsRenderer
                  options={{
                    directions: directionsResponse,
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#4285F4",
                      strokeWeight: 5
                    }
                  }}
                />
                )}
              </GoogleMap>
            </LoadScript>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Information and controls */}
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Location Information
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              {simulationActive 
                ? `Simulated Location: Lat: ${currentLocation.lat.toFixed(5)}, Lng: ${currentLocation.lng.toFixed(5)}`
                : isTracking 
                  ? `Current Location: Lat: ${currentLocation.lat.toFixed(5)}, Lng: ${currentLocation.lng.toFixed(5)}`
                  : "Waiting for location..."}
            </Typography>
          </Box>
          
          {routeInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Distance: {routeInfo.distance}
              </Typography>
              <Typography variant="body1">
                Estimated Time: {routeInfo.duration}
              </Typography>
            </Box>
          )}
          
          {!routeInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Select a destination on the map
              </Typography>
            </Box>
          )}
          
          {isDeviated && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
            >
              Warning: Route Deviation Detected! ({deviationDistance.toFixed(0)} meters off route)
            </Alert>
          )}
          
          {simulationActive && (
            <Alert 
              severity="info" 
              sx={{ mb: 2 }}
            >
              Simulation active: Location artificially moved
            </Alert>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Trip Controls
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              color="success"
              sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
              onClick={startTracking}
              disabled={isTracking}
            >
              Start Trip
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={stopTracking}
              disabled={!isTracking}
            >
              Stop Trip
            </Button>
          </Box>
          
          <Box>
            <Button 
              variant="contained" 
              color="warning"
              sx={{ mr: 2, mb: { xs: 1, sm: 0 } }}
              onClick={simulateDeviation}
              disabled={!destination}
            >
              Simulate 600m Deviation
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={returnToRoute}
              disabled={!simulationActive}
            >
              Return to Route
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
  

};


export default TripTracker;