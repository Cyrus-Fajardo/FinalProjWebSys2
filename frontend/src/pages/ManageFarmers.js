import React, { useState, useEffect } from 'react';
import '../css/ManageFarmers.css';
import Sidebar from '../components/Sidebar';

function ManageFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [editingFarmer, setEditingFarmer] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFarmers(data);
      }
    } catch (err) {
      console.error('Error fetching farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFarmer = async (farmerId) => {
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/farmers/${farmerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingFarmer)
      });

      const data = await response.json();

      if (response.ok) {
        setFarmers(farmers.map(f => f._id === farmerId ? data.farmer : f));
        setEditingId(null);
        setEditingFarmer({});
      } else {
        setError(data.error || 'Error updating farmer profile');
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Error:', err);
    }
  };

  const startEdit = (farmer) => {
    setEditingId(farmer._id);
    setEditingFarmer({
      farmerName: farmer.farmerName,
      farmName: farmer.farmName,
      farmSize: farmer.farmSize,
      farmSizeUnit: farmer.farmSizeUnit,
      varietiesAvailable: farmer.varietiesAvailable,
      location: farmer.location
    });
  };

  // Filter farmers if Group Manager role
  const filterFarmers = ['Group Manager'].includes(user.role)
    ? farmers
    : farmers;

  return (
    <div className="manage-farmers-container">
      <Sidebar />
      <div className="manage-farmers-content">
        <h1>Manage Farmer Profiles</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="farmers-table-container">
          {loading ? (
            <p>Loading farmer profiles...</p>
          ) : filterFarmers.length === 0 ? (
            <p className="no-data">No farmer profiles found</p>
          ) : (
            <table className="farmers-table">
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>Farm Name</th>
                  <th>Farm Size</th>
                  <th>Varieties</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterFarmers.map(farmer => (
                  <tr key={farmer._id} className={editingId === farmer._id ? 'editing' : ''}>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="text"
                          value={editingFarmer.farmerName}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, farmerName: e.target.value })}
                        />
                      ) : (
                        farmer.farmerName
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="text"
                          value={editingFarmer.farmName}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, farmName: e.target.value })}
                        />
                      ) : (
                        farmer.farmName
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <div className="farm-size-input">
                          <input
                            type="number"
                            value={editingFarmer.farmSize}
                            onChange={(e) => setEditingFarmer({ ...editingFarmer, farmSize: e.target.value })}
                          />
                          <input
                            type="text"
                            value={editingFarmer.farmSizeUnit}
                            onChange={(e) => setEditingFarmer({ ...editingFarmer, farmSizeUnit: e.target.value })}
                          />
                        </div>
                      ) : (
                        `${farmer.farmSize} ${farmer.farmSizeUnit}`
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="text"
                          value={editingFarmer.varietiesAvailable?.join(', ')}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, varietiesAvailable: e.target.value.split(',').map(v => v.trim()) })}
                          placeholder="Comma-separated varieties"
                        />
                      ) : (
                        farmer.varietiesAvailable?.join(', ')
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <input
                          type="text"
                          value={editingFarmer.location}
                          onChange={(e) => setEditingFarmer({ ...editingFarmer, location: e.target.value })}
                        />
                      ) : (
                        farmer.location
                      )}
                    </td>
                    <td>
                      {editingId === farmer._id ? (
                        <>
                          <button
                            className="save-btn"
                            onClick={() => handleUpdateFarmer(farmer._id)}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => {
                              setEditingId(null);
                              setEditingFarmer({});
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(farmer)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageFarmers;
