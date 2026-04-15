import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { farmerAPI, userAPI } from '../js/api';
import '../css/ManageFarmerDetails.css';

const getRoleLabel = (role) => {
  if (role === 'Kaluppa Foundation') {
    return 'Kaluppâ Foundation';
  }

  return role;
};

function ManageFarmerDetails() {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = ['Kaluppa Foundation', 'DTI'].includes(currentUser?.role);

  const [farmers, setFarmers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await farmerAPI.getAll();
      setFarmers(data);

      if (isAdmin) {
        const users = await userAPI.getAll();
        setManagers(users.filter((user) => user.role === 'Group Manager'));
      }
    } catch (err) {
      setError(err.message || 'Failed to load farmer details');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return farmers;
    }

    return farmers.filter((farmer) => (
      String(farmer.sellerName || '').toLowerCase().includes(normalized)
      || String(farmer.userId?.fullname || '').toLowerCase().includes(normalized)
      || String(farmer.userId?.email || '').toLowerCase().includes(normalized)
      || String(farmer.location || '').toLowerCase().includes(normalized)
      || String(farmer.farmName || '').toLowerCase().includes(normalized)
    ));
  }, [farmers, query]);

  const startEdit = (farmer) => {
    setEditingId(farmer._id);
    setEditingData({
      sellerName: farmer.sellerName || '',
      farmName: farmer.farmName || '',
      location: farmer.location || '',
      farmSize: farmer.farmSize || 0,
      assignedManager: farmer.assignedManager?._id || '',
      harvestDetails: {
        variety: farmer.harvestDetails?.variety || '',
        coffeeCherriesKg: farmer.harvestDetails?.coffeeCherriesKg || 0,
        coffeeSeedlingsCount: farmer.harvestDetails?.coffeeSeedlingsCount || 0,
      },
      processDetails: {
        variety: farmer.processDetails?.variety || '',
        processedCoffeeKg: farmer.processDetails?.processedCoffeeKg || 0,
      },
      inventoryDetails: {
        fertilizerBags: farmer.inventoryDetails?.fertilizerBags || 0,
      },
    });
  };

  const handleSave = async (farmerId) => {
    setError('');

    try {
      const payload = {
        sellerName: editingData.sellerName,
        farmName: editingData.farmName,
        location: editingData.location,
        farmSize: Number(editingData.farmSize || 0),
        harvestDetails: {
          ...editingData.harvestDetails,
          coffeeCherriesKg: Number(editingData.harvestDetails?.coffeeCherriesKg || 0),
          coffeeSeedlingsCount: Number(editingData.harvestDetails?.coffeeSeedlingsCount || 0),
        },
        processDetails: {
          ...editingData.processDetails,
          processedCoffeeKg: Number(editingData.processDetails?.processedCoffeeKg || 0),
        },
        inventoryDetails: {
          fertilizerBags: Number(editingData.inventoryDetails?.fertilizerBags || 0),
        },
      };

      if (isAdmin) {
        payload.assignedManager = editingData.assignedManager || null;
      }

      const result = await farmerAPI.update(farmerId, payload);
      setFarmers((prev) => prev.map((farmer) => (farmer._id === farmerId ? result.farmer : farmer)));
      setEditingId(null);
      setEditingData({});
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    }
  };

  return (
    <div className="manage-farmer-details-page">
      <Sidebar />

      <div className="manage-farmer-details-content">
        <div className="header-row">
          <h1>Manage Farmer Details</h1>
          <input
            type="text"
            placeholder="Search by name, email, location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading farmer details...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Farm</th>
                  <th>Farm Size</th>
                  <th>Location</th>
                  <th>Harvest Variety</th>
                  <th>Cherries (kg)</th>
                  <th>Seedlings</th>
                  <th>Processed Variety</th>
                  <th>Processed (kg)</th>
                  <th>Fertilizer Bags</th>
                  <th>Assigned Manager</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((farmer) => (
                  <tr key={farmer._id}>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          value={editingData.sellerName || ''}
                          onChange={(e) => setEditingData((prev) => ({ ...prev, sellerName: e.target.value }))}
                        />
                      ) : (
                        farmer.sellerName
                      )}
                    </td>
                    <td>{farmer.userId?.email}</td>
                    <td>{getRoleLabel(farmer.userId?.role)}</td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          value={editingData.farmName || ''}
                          onChange={(e) => setEditingData((prev) => ({ ...prev, farmName: e.target.value }))}
                        />
                      ) : (
                        farmer.farmName
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData.farmSize || 0}
                          onChange={(e) => setEditingData((prev) => ({ ...prev, farmSize: e.target.value }))}
                        />
                      ) : (
                        farmer.farmSize
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          value={editingData.location || ''}
                          onChange={(e) => setEditingData((prev) => ({ ...prev, location: e.target.value }))}
                        />
                      ) : (
                        farmer.location
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          value={editingData.harvestDetails?.variety || ''}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            harvestDetails: { ...prev.harvestDetails, variety: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.harvestDetails?.variety || '-'
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData.harvestDetails?.coffeeCherriesKg || 0}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            harvestDetails: { ...prev.harvestDetails, coffeeCherriesKg: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.harvestDetails?.coffeeCherriesKg || 0
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData.harvestDetails?.coffeeSeedlingsCount || 0}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            harvestDetails: { ...prev.harvestDetails, coffeeSeedlingsCount: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.harvestDetails?.coffeeSeedlingsCount || 0
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          value={editingData.processDetails?.variety || ''}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            processDetails: { ...prev.processDetails, variety: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.processDetails?.variety || '-'
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData.processDetails?.processedCoffeeKg || 0}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            processDetails: { ...prev.processDetails, processedCoffeeKg: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.processDetails?.processedCoffeeKg || 0
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="number"
                          min="0"
                          value={editingData.inventoryDetails?.fertilizerBags || 0}
                          onChange={(e) => setEditingData((prev) => ({
                            ...prev,
                            inventoryDetails: { ...prev.inventoryDetails, fertilizerBags: e.target.value },
                          }))}
                        />
                      ) : (
                        farmer.inventoryDetails?.fertilizerBags || 0
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id && isAdmin ? (
                        <select
                          value={editingData.assignedManager || ''}
                          onChange={(e) => setEditingData((prev) => ({ ...prev, assignedManager: e.target.value }))}
                        >
                          <option value="">Unassigned</option>
                          {managers.map((manager) => (
                            <option key={manager._id} value={manager._id}>{manager.fullname}</option>
                          ))}
                        </select>
                      ) : (
                        farmer.assignedManager?.fullname || 'Unassigned'
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <>
                          <button className="save-btn" onClick={() => handleSave(farmer._id)}>Save</button>
                          <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="edit-btn" onClick={() => startEdit(farmer)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageFarmerDetails;
