import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WarningIcon from "@mui/icons-material/Warning";
import PhoneIcon from "@mui/icons-material/Phone";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate("/")}
          sx={{ 
            mr: 2,
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s'
            }
          }}
        >
          <SecurityIcon />
        </IconButton>

        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}
        >
          Safety App
        </Typography>

        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              color="inherit" 
              onClick={() => navigate("/location")}
              sx={{ 
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.08)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s'
              }}
            >
              <LocationOnIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => navigate("/fake-call")}>
              <PhoneIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircleIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/profile");
                }}
              >
                Profile
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  navigate("/emergency-contacts");
                }}
              >
                Emergency Contacts
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            color="inherit" 
            onClick={() => navigate("/login")}
            sx={{
              borderRadius: 2,
              px: 3,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.08)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s'
            }}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
