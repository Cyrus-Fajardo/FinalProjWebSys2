import React, { useState, useEffect } from 'react';
import '../css/Marketplace.css';
import Sidebar from '../components/Sidebar';
import { productAPI } from '../js/api';

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSellForm, setShowSellForm] = useState(false);
  const [formData, setFormData] = useState({
    productType: 'Coffee Seedlings',
    variety: '',
    quantity: '',
    unit: 'pieces',
    price: '',
    description: ''
  });
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update unit based on product type
    if (name === 'productType') {
      if (value === 'Fertilizers') {
        setFormData(prev => ({ ...prev, unit: 'bags' }));
      } else if (['Coffee Cherries', 'Processed Coffee'].includes(value)) {
        setFormData(prev => ({ ...prev, unit: 'kg' }));
      } else {
        setFormData(prev => ({ ...prev, unit: 'pieces' }));
      }
    }
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await productAPI.create(formData);
      setFormData({
        productType: 'Coffee Seedlings',
        variety: '',
        quantity: '',
        unit: 'pieces',
        price: '',
        description: ''
      });
      setShowSellForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  const handleBuyProduct = async (productId) => {
    try {
      await productAPI.buy(productId, 1);
      fetchProducts();
    } catch (err) {
      console.error('Error buying product:', err);
    }
  };

  const canSell = ['Farmer', 'Kaluppa Foundation'].includes(user.role);

  return (
    <div className="marketplace-container">
      <Sidebar />
      <div className="marketplace-content">
        <div className="marketplace-header">
          <h1>Coffee Marketplace</h1>
          {canSell && (
            <button
              className="sell-btn"
              onClick={() => setShowSellForm(!showSellForm)}
            >
              {showSellForm ? 'Cancel' : 'Sell Product'}
            </button>
          )}
        </div>

        {showSellForm && (
          <div className="sell-form-container">
            <h2>Add Product to Sell</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSellProduct}>
              <div className="form-group">
                <label htmlFor="productType">Product Type</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  required
                >
                  {user.role === 'Farmer' && (
                    <>
                      <option value="Coffee Cherries">Coffee Cherries</option>
                      <option value="Coffee Seedlings">Coffee Seedlings</option>
                    </>
                  )}
                  {user.role === 'Kaluppa Foundation' && (
                    <>
                      <option value="Processed Coffee">Processed Coffee</option>
                      <option value="Fertilizers">Fertilizers</option>
                      <option value="Coffee Seedlings">Coffee Seedlings</option>
                    </>
                  )}
                </select>
              </div>

              {['Coffee Seedlings', 'Coffee Cherries', 'Processed Coffee'].includes(formData.productType) && (
                <div className="form-group">
                  <label htmlFor="variety">Variety</label>
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    placeholder="e.g., Typica, Bourbon"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder={`Enter quantity in ${formData.unit}`}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (PHP)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional product description"
                  rows="3"
                />
              </div>

              <button type="submit" className="submit-btn">Add Product</button>
            </form>
          </div>
        )}

        <div className="products-container">
          <h2>Available Products</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="no-products">No products available</p>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product._id} className="product-card">
                  <h3>{product.productType}</h3>
                  {product.variety && <p><strong>Variety:</strong> {product.variety}</p>}
                  <p><strong>Quantity:</strong> {product.quantity} {product.unit}</p>
                  <p><strong>Price:</strong> ₱{product.price}</p>
                  <p><strong>Seller:</strong> {product.sellerId?.fullname || 'Unknown'}</p>
                  <p className="date-listed">Listed: {new Date(product.dateListed).toLocaleDateString()}</p>
                  {product.description && <p><strong>Description:</strong> {product.description}</p>}
                  <button
                    className="buy-btn"
                    onClick={() => handleBuyProduct(product._id)}
                  >
                    Buy Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Marketplace;
