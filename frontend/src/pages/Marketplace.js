import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { orderAPI, productAPI } from '../js/api';
import '../css/Marketplace.css';

const SELLABLE_TYPES_BY_ROLE = {
  Farmer: ['Coffee Cherries', 'Processed Coffee', 'Coffee Seedlings'],
  'Kaluppa Foundation': ['Coffee Seedlings', 'Processed Coffee', 'Fertilizers'],
};

const UNVERIFIED_BUYER_MAX_UNITS = 20;

function Marketplace() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!(localStorage.getItem('token') && user);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSellForm, setShowSellForm] = useState(false);
  const [error, setError] = useState('');
  const [cartWarning, setCartWarning] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const [searchType, setSearchType] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [formData, setFormData] = useState({
    productType: 'Coffee Seedlings',
    variety: '',
    quantity: '',
    unit: 'pieces',
    price: '',
    saleType: 'Retail',
    description: '',
  });

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

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const data = await orderAPI.getMyOrders();
      setOrders(data);
    } catch (_err) {
      // Orders are supplemental UI information.
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (user.role === 'DTI') {
      navigate('/manage-users');
      return;
    }

    if (user.role === 'Group Manager') {
      navigate('/manage-farmer-details');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user?.role, navigate]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'productType') {
      if (value === 'Fertilizers') {
        setFormData((prev) => ({ ...prev, unit: 'bags' }));
      } else if (['Coffee Cherries', 'Processed Coffee'].includes(value)) {
        setFormData((prev) => ({ ...prev, unit: 'kg' }));
      } else {
        setFormData((prev) => ({ ...prev, unit: 'pieces' }));
      }
    }
  };

  const handleSellProduct = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await productAPI.create(formData);
      setFormData({
        productType: 'Coffee Seedlings',
        variety: '',
        quantity: '',
        unit: 'pieces',
        price: '',
        saleType: 'Retail',
        description: '',
      });
      setShowSellForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  const getCurrentCartUnits = () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const handleAddToCart = (product) => {
    setCartWarning('');
    setCheckoutMessage('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!['Buyer', 'Farmer', 'Kaluppa Foundation'].includes(user.role)) {
      setCartWarning('Your role is not allowed to buy products.');
      return;
    }

    if (user.role === 'Buyer' && !user.isVerified) {
      if (getCurrentCartUnits() + 1 > UNVERIFIED_BUYER_MAX_UNITS) {
        setCartWarning(`Unverified buyers can only add up to ${UNVERIFIED_BUYER_MAX_UNITS} total units.`);
        return;
      }
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);

      if (existing) {
        return prev.map((item) => item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }

      return [
        ...prev,
        {
          productId: product._id,
          productType: product.productType,
          unit: product.unit,
          price: product.price,
          sellerName: product.sellerId?.fullname || 'Unknown',
          quantity: 1,
        },
      ];
    });
  };

  const handleCartQuantity = (productId, quantity) => {
    const nextQty = Math.max(1, Number(quantity || 1));
    setCart((prev) => prev.map((item) => (
      item.productId === productId ? { ...item, quantity: nextQty } : item
    )));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCheckout = async () => {
    setCartWarning('');
    setCheckoutMessage('');

    if (cart.length === 0) {
      setCartWarning('Your cart is empty.');
      return;
    }

    try {
      await orderAPI.checkout(cart.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })));

      setCheckoutMessage('Checkout successful. Your order has been created.');
      setCart([]);
      fetchProducts();
      fetchOrders();
    } catch (err) {
      setCartWarning(err.message || 'Checkout failed.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderAPI.cancel(orderId, 'Cancelled by user');
      setCheckoutMessage('Order cancelled. Cancellation fee has been applied.');
      fetchOrders();
    } catch (err) {
      setCartWarning(err.message || 'Failed to cancel order.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await productAPI.delete(productId);
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Could not cancel listing.');
    }
  };

  const canSell = isAuthenticated && ['Farmer', 'Kaluppa Foundation'].includes(user.role);
  const allowedSellOptions = canSell ? (SELLABLE_TYPES_BY_ROLE[user.role] || []) : [];

  const filteredProducts = useMemo(() => products.filter((product) => {
    const productDate = new Date(product.dateListed);
    const typeMatch = searchType ? product.productType === searchType : true;
    const dateMatch = searchDate ? productDate.toDateString() === new Date(searchDate).toDateString() : true;
    const minMatch = minPrice ? Number(product.price) >= Number(minPrice) : true;
    const maxMatch = maxPrice ? Number(product.price) <= Number(maxPrice) : true;
    return typeMatch && dateMatch && minMatch && maxMatch;
  }), [products, searchType, searchDate, minPrice, maxPrice]);

  return (
    <div className="marketplace-container">
      <Sidebar />
      <div className="marketplace-content">
        <div className="marketplace-header">
          <h1>Coffee Marketplace</h1>
          {canSell && (
            <button className="sell-btn" onClick={() => setShowSellForm(!showSellForm)}>
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
                <select name="productType" value={formData.productType} onChange={handleInputChange} required>
                  {allowedSellOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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
                <label htmlFor="saleType">Sale Type</label>
                <select name="saleType" value={formData.saleType} onChange={handleInputChange}>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
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

          <div className="market-filters">
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
              <option value="">All Product Types</option>
              <option value="Coffee Seedlings">Coffee Seedlings</option>
              <option value="Coffee Cherries">Coffee Cherries</option>
              <option value="Processed Coffee">Processed Coffee</option>
              <option value="Fertilizers">Fertilizers</option>
            </select>

            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
            <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="no-products">No products available</p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product._id} className="product-card">
                  <h3>{product.productType}</h3>
                  {product.variety && <p><strong>Variety:</strong> {product.variety}</p>}
                  <p><strong>Quantity:</strong> {product.quantity} {product.unit}</p>
                  <p><strong>Sale Type:</strong> {product.saleType || 'Retail'}</p>
                  <p><strong>Price:</strong> P{product.price}</p>
                  <p><strong>Sold by:</strong> {product.sellerId?.fullname || 'Unknown'}</p>
                  {product.processingBadge === 'self-processed' && <p className="processing-badge self">[Self-Processed]</p>}
                  {product.processingBadge === 'foundation-verified' && <p className="processing-badge verified">[Verified Process]</p>}
                  <p className="date-listed">Listed: {new Date(product.dateListed).toLocaleDateString()}</p>
                  {product.description && <p><strong>Description:</strong> {product.description}</p>}

                  <button className="buy-btn" onClick={() => handleAddToCart(product)}>Add to Cart</button>

                  {canSell && String(product.sellerId?._id || '') === String(user.userId || '') && (
                    <button className="cancel-listing-btn" onClick={() => handleDeleteProduct(product._id)}>
                      Cancel Listing
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div className="cart-container">
            <h2>Cart</h2>
            {cartWarning && <div className="error-message">{cartWarning}</div>}
            {checkoutMessage && <div className="success-message">{checkoutMessage}</div>}

            {cart.length === 0 ? (
              <p className="no-products">No items in cart.</p>
            ) : (
              <>
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sold by</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.productId}>
                        <td>{item.productType}</td>
                        <td>{item.sellerName}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleCartQuantity(item.productId, e.target.value)}
                          />
                        </td>
                        <td>P{item.price}</td>
                        <td>
                          <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
              </>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className="cart-container">
            <h2>Orders</h2>

            {orders.length === 0 ? (
              <p className="no-products">No orders yet.</p>
            ) : (
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Subtotal</th>
                    <th>Cancellation Fee</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.orderId}</td>
                      <td>{order.items?.length || 0}</td>
                      <td>{order.status}</td>
                      <td>P{order.subtotal}</td>
                      <td>P{order.cancellationFee || 0}</td>
                      <td>
                        {order.status === 'Pending' ? (
                          <button className="remove-btn" onClick={() => handleCancelOrder(order._id)}>Cancel Order</button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
