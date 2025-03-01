import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Alert,
  InputAdornment,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import SendIcon from "@mui/icons-material/Send";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useLocation } from "../../contexts/LocationContext";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

const EmergencyContacts = () => {
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContact, setCurrentContact] = useState<EmergencyContact | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'emergency_contacts', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContacts(docSnap.data().contacts || []);
      } else {
        await setDoc(docRef, { contacts: [] });
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      showSnackbar('Failed to load contacts', 'error');
    }
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit number
    // This will allow numbers that start with 91 as long as they're valid Indian mobile numbers
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's already 10 digits, return as is
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // If it starts with 91 and has 12 digits total, take the last 10 digits
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned.slice(2);
    }
    
    // Return the first 10 digits
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formattedPhone });
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const sendEmergencyMessage = async (contact: EmergencyContact) => {
    if (!currentLocation) {
      showSnackbar("Unable to get current location", "error");
      return;
    }

    const message = `Emergency Alert from Safety App!\n\n${
      user?.displayName || 'Your contact'
    } needs help!\n\nLast known location:\nhttps://www.google.com/maps?q=${
      currentLocation.coords.latitude
    },${currentLocation.coords.longitude}\n\nPlease reach out immediately!`;

    try {
      // Using SMS gateway API (you'll need to set this up)
      const response = await fetch('YOUR_SMS_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SMS_API_KEY}`,
        },
        body: JSON.stringify({
          to: `+91${contact.phone}`,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      showSnackbar(`Alert sent to ${contact.name}`, "success");
    } catch (error) {
      console.error("Error sending SMS:", error);
      showSnackbar(`Failed to send alert to ${contact.name}`, "error");
    }
  };

  const sendToAllContacts = async () => {
    for (const contact of contacts) {
      await sendEmergencyMessage(contact);
    }
  };

  const handleAddContact = async () => {
    if (!validatePhoneNumber(formData.phone)) {
      showSnackbar("Please enter a valid 10-digit Indian mobile number", "error");
      return;
    }

    try {
      if (!user) return;

      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        relationship: formData.relationship,
      };

      const updatedContacts = isEditing && currentContact
        ? contacts.map(c => c.id === currentContact.id ? { ...newContact, id: c.id } : c)
        : [...contacts, newContact];

      await setDoc(doc(db, "emergency_contacts", user.uid), { contacts: updatedContacts }, { merge: true });

      setContacts(updatedContacts);
      handleCloseDialog();
      showSnackbar(
        isEditing ? "Contact updated successfully" : "Contact added successfully",
        "success"
      );
      await loadContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      showSnackbar("Error saving contact", "error");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user) return;

    try {
      const updatedContacts = contacts.filter((c) => c.id !== contactId);
      await setDoc(doc(db, "emergency_contacts", user.uid), { contacts: updatedContacts }, { merge: true });

      setContacts(updatedContacts);
      showSnackbar("Contact deleted successfully", "success");
      await loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      showSnackbar("Error deleting contact", "error");
    }
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentContact(null);
    setFormData({ name: "", phone: "", relationship: "" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      relationship: "",
    });
    setIsEditing(false);
    setCurrentContact(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: 'primary.main',
          }}
        >
          <ContactPhoneIcon sx={{ fontSize: 40 }} />
          Emergency Contacts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          }}
        >
          Add Contact
        </Button>
      </Box>

      <Grid container spacing={3}>
        {contacts.map((contact) => (
          <Grid item xs={12} md={6} key={contact.id}>
            <Card
              sx={{
                background: 'linear-gradient(45deg, #1a1a1a 30%, #2a2a2a 90%)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{contact.name}</Typography>
                  <Box>
                    <IconButton onClick={() => handleEditContact(contact)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteContact(contact.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Phone: {contact.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Relation: {contact.relationship}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Contact' : 'Add Emergency Contact'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={handlePhoneChange}
              fullWidth
              helperText="Enter 10-digit Indian mobile number"
              error={formData.phone.length > 0 && !validatePhoneNumber(formData.phone)}
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
            />
            <TextField
              label="Relation"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAddContact}
            variant="contained"
            disabled={!formData.name || !validatePhoneNumber(formData.phone)}
          >
            {isEditing ? 'Update' : 'Add'} Contact
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmergencyContacts; 