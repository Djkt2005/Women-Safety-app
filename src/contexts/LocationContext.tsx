import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface DangerZone {
  center: {
    lat: number;
    lng: number;
  };
  radius: number;
}

interface LocationContextType {
  currentLocation: GeolocationPosition | null;
  location: Location | null;
  isTracking: boolean;
  error: string | null;
  dangerZones: DangerZone[];
  startTracking: () => void;
  stopTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationPosition | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { user } = useAuth();

  // Move handleSuccess and handleError before startTracking
  const handleSuccess = useCallback(async (position: GeolocationPosition) => {
    setCurrentLocation(position);
    setError(null);

    if (user) {
      const newLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp,
      };

      setLocation(newLocation);
      try {
        await setDoc(doc(db, "locations", user.uid), newLocation);
      } catch (error) {
        console.error("Error updating location:", error);
      }
    }
  }, [user]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setError(error.message);
    setCurrentLocation(null);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (!isTracking) {  // Add this check
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });

      setWatchId(id);
      setIsTracking(true);
    }
  }, [handleSuccess, handleError, isTracking]);  // Add isTracking to dependencies

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId]);

  // Initialize tracking only once when component mounts
  useEffect(() => {
    startTracking();
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);  // Keep empty dependency array

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isTracking) {
        startTracking();
      } else if (document.visibilityState === 'hidden' && isTracking) {
        stopTracking();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, startTracking, stopTracking]);

  // Load danger zones
  useEffect(() => {
    if (!user) return;

    const loadDangerZones = async () => {
      try {
        const docRef = doc(db, "danger_zones", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDangerZones(docSnap.data().zones || []);
        }
      } catch (error) {
        console.error("Error loading danger zones:", error);
      }
    };

    loadDangerZones();
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        location,
        isTracking,
        error,
        dangerZones,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
