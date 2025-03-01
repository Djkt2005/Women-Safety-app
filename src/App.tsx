import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import theme from "./theme";
import Header from "./components/Layout/Header";
import Dashboard from "./components/Dashboard";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import LocationTracking from "./components/Safety/LocationTracking";
import CommunityAlerts from "./components/Safety/CommunityAlerts";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import "./services/firebase"; // Import firebase initialization
import SafetyDashboard from "./components/Safety/SafetyDashboard";
import FakeCall from "./components/Safety/FakeCall";
import EmergencyContacts from "./components/Safety/EmergencyContacts";
import AIChat from "./components/Safety/AIChat";
import Profile from "./components/Auth/Profile";
import Onboarding from "./components/Auth/Onboarding";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <LocationProvider>
          <Router>
            <Header />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/location" element={<LocationTracking />} />
              <Route path="/fake-call" element={<FakeCall />} />
              <Route path="/safety" element={<SafetyDashboard />} />
              <Route path="/emergency-contacts" element={<EmergencyContacts />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/alerts" element={<Navigate to="/location" replace />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
