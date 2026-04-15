import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { farmerAPI } from '../js/api';
import '../css/FarmerProfile.css';

const initialProfile = {
  sellerName: '',
  farmName: '',
  farmSize: 0,
  farmSizeUnit: 'hectares',
  location: '',
  harvestDetails: {
    variety: '',
    coffeeCherriesKg: 0,
    coffeeSeedlingsCount: 0,
    lastHarvestDate: '',
  },
  processDetails: {
    variety: '',
    processedCoffeeKg: 0,
    processDate: '',
    notes: '',
  },
  inventoryDetails: {
    fertilizerBags: 0,
  },
};

function FarmerProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const sellers = await farmerAPI.getAll();

        if (sellers.length > 0) {
          const existing = sellers[0];
          setProfileId(existing._id);
          setProfile({
            ...initialProfile,
            ...existing,
            harvestDetails: { ...initialProfile.harvestDetails, ...(existing.harvestDetails || {}) },
            processDetails: { ...initialProfile.processDetails, ...(existing.processDetails || {}) },
            inventoryDetails: { ...initialProfile.inventoryDetails, ...(existing.inventoryDetails || {}) },
          });
        }
      } catch (err) {
        setError(err.message || 'Could not load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        sellerName: profile.sellerName,
        farmName: profile.farmName,
        farmSize: Number(profile.farmSize || 0),
        farmSizeUnit: profile.farmSizeUnit,
        location: profile.location,
        harvestDetails: {
          ...profile.harvestDetails,
          coffeeCherriesKg: Number(profile.harvestDetails?.coffeeCherriesKg || 0),
          coffeeSeedlingsCount: Number(profile.harvestDetails?.coffeeSeedlingsCount || 0),
        },
        processDetails: {
          ...profile.processDetails,
          processedCoffeeKg: Number(profile.processDetails?.processedCoffeeKg || 0),
        },
        inventoryDetails: {
          fertilizerBags: Number(profile.inventoryDetails?.fertilizerBags || 0),
        },
      };

      if (profileId) {
        await farmerAPI.update(profileId, payload);
      } else {
        const result = await farmerAPI.create(payload);
        setProfileId(result.farmer._id);
      }

      setMessage('Farmer profile saved successfully.');
    } catch (err) {
      setError(err.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="farmer-profile-page">
      <Sidebar />

      <div className="farmer-profile-content">
        <h1>Farmer Profile</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <div className="profile-card">
            <h2>Farm Details</h2>

            <div className="form-grid">
              <label>
                Seller Name
                <input value={profile.sellerName || ''} onChange={(e) => updateField('sellerName', e.target.value)} />
              </label>

              <label>
                Farm Name
                <input value={profile.farmName || ''} onChange={(e) => updateField('farmName', e.target.value)} />
              </label>

              <label>
                Farm Size
                <input type="number" value={profile.farmSize || 0} onChange={(e) => updateField('farmSize', e.target.value)} />
              </label>

              <label>
                Farm Size Unit
                <input value={profile.farmSizeUnit || ''} onChange={(e) => updateField('farmSizeUnit', e.target.value)} />
              </label>

              <label>
                Location
                <input value={profile.location || ''} onChange={(e) => updateField('location', e.target.value)} />
              </label>
            </div>

            <h2>Harvest Details</h2>
            <div className="form-grid">
              <label>
                Variety
                <input value={profile.harvestDetails?.variety || ''} onChange={(e) => updateNestedField('harvestDetails', 'variety', e.target.value)} />
              </label>

              <label>
                Coffee Cherries (kg)
                <input
                  type="number"
                  value={profile.harvestDetails?.coffeeCherriesKg || 0}
                  onChange={(e) => updateNestedField('harvestDetails', 'coffeeCherriesKg', e.target.value)}
                />
              </label>

              <label>
                Coffee Seedlings (count)
                <input
                  type="number"
                  value={profile.harvestDetails?.coffeeSeedlingsCount || 0}
                  onChange={(e) => updateNestedField('harvestDetails', 'coffeeSeedlingsCount', e.target.value)}
                />
              </label>

              <label>
                Last Harvest Date
                <input
                  type="date"
                  value={profile.harvestDetails?.lastHarvestDate ? profile.harvestDetails.lastHarvestDate.slice(0, 10) : ''}
                  onChange={(e) => updateNestedField('harvestDetails', 'lastHarvestDate', e.target.value)}
                />
              </label>
            </div>

            <h2>Process Details</h2>
            <div className="form-grid">
              <label>
                Variety
                <input value={profile.processDetails?.variety || ''} onChange={(e) => updateNestedField('processDetails', 'variety', e.target.value)} />
              </label>

              <label>
                Processed Coffee (kg)
                <input
                  type="number"
                  value={profile.processDetails?.processedCoffeeKg || 0}
                  onChange={(e) => updateNestedField('processDetails', 'processedCoffeeKg', e.target.value)}
                />
              </label>

              <label>
                Process Date
                <input
                  type="date"
                  value={profile.processDetails?.processDate ? profile.processDetails.processDate.slice(0, 10) : ''}
                  onChange={(e) => updateNestedField('processDetails', 'processDate', e.target.value)}
                />
              </label>

              <label>
                Notes
                <input value={profile.processDetails?.notes || ''} onChange={(e) => updateNestedField('processDetails', 'notes', e.target.value)} />
              </label>
            </div>

            <h2>Fertilizer Inventory</h2>
            <div className="form-grid">
              <label>
                Fertilizer Bags
                <input
                  type="number"
                  value={profile.inventoryDetails?.fertilizerBags || 0}
                  onChange={(e) => updateNestedField('inventoryDetails', 'fertilizerBags', e.target.value)}
                />
              </label>
            </div>

            <button className="save-profile-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerProfile;
