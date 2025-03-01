import React from "react";
import { GoogleMap, useJsApiLoader, Circle, Marker } from "@react-google-maps/api";
import { useLocation } from "../../contexts/LocationContext";
import { DangerZone } from "../../contexts/LocationContext";

interface MapProps {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const Map: React.FC<MapProps> = ({ center = { lat: 0, lng: 0 }, zoom = 14 }) => {
  const { location, dangerZones } = useLocation();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  });

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

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: "400px",
      }}
      center={center}
      zoom={zoom}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {location && (
        <Marker
          position={{
            lat: location.latitude,
            lng: location.longitude,
          }}
        />
      )}
      {dangerZones?.map((zone: DangerZone, index: number) => (
        <Circle
          key={index}
          center={zone.center}
          radius={zone.radius}
          options={{
            fillColor: "#ff0000",
            fillOpacity: 0.2,
            strokeColor: "#ff0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default Map;
