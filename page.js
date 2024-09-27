"use client";
import { useEffect, useState } from 'react';

export default function MenuPage() {
  const [response, setResponse] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [userInfo, setUserInfo] = useState({ name: '', address: '', mobile: '' });
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [orderSummary, setOrderSummary] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [botStarted, setBotStarted] = useState(false);
  const [orderCancelled, setOrderCancelled] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      const data = await res.json();
      setMenuItems(Object.entries(data.menu).flatMap(([_, items]) => 
        Object.entries(items).map(([name, price]) => ({ name, price }))
      ));
      setResponse('Here is the menu:');
    } catch (error) {
      setResponse('Error fetching the menu. Please try again later.');
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => ({
      ...prev,
      [item.name]: prev[item.name] ? prev[item.name] + 1 : 1
    }));
    setResponse(`Added ${item.name} to your order.`);
  };

  const handleItemRemove = (item) => {
    setSelectedItems((prev) => {
      if (prev[item.name] > 1) {
        return { ...prev, [item.name]: prev[item.name] - 1 };
      }
      const { [item.name]: _, ...rest } = prev;
      return rest;
    });
    setResponse(`Removed ${item.name} from your order.`);
  };

  const handleUserInfoChange = (e) => {
    const { value } = e.target;
    setUserInfo({ ...userInfo, [e.target.name]: value });
  };

  const handleSubmitOrder = async () => {
    const res = await fetch('http://127.0.0.1:5000/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_info: userInfo, items: Object.keys(selectedItems).filter(item => selectedItems[item] > 0) }),
    });
    const data = await res.json();
    if (res.ok) {
      setResponse(data.response);
      setOrderSummary(data.response);
      setShowUserInfo(false);
    } else {
      setResponse(data.error);
    }
  };

  const handleConfirmOrder = async () => {
    const res = await fetch('http://127.0.0.1:5000/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_info: userInfo }),
    });
    const data = await res.json();
    if (res.ok) {
      setResponse(data.response);
      setSelectedItems({});
      setOrderSummary(null);
    } else {
      setResponse(data.error);
    }
  };

  const handleCancelOrder = async () => {
    const res = await fetch('http://127.0.0.1:5000/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_info: userInfo }),
    });
    const data = await res.json();
    if (res.ok) {
      setResponse(data.response);
      setSelectedItems({});
      setOrderSummary(null);
      setOrderCancelled(true);
    } else {
      setResponse(data.error);
    }
  };

  const handleConfirmOrderClick = () => {
    if (Object.keys(selectedItems).length === 0) {
      setResponse("Please select items before confirming your order.");
      return;
    }
    setShowUserInfo(true);
    setResponse('Please provide your name, address, and mobile number.');
    setShowMenu(false);
  };

  const calculateSubtotal = () => {
    return Object.entries(selectedItems).reduce((total, [name, quantity]) => {
      const item = menuItems.find(item => item.name === name);
      return total + (item.price * quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleBackToStart = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-gray-800 shadow-2xl rounded-lg overflow-hidden border border-red-600">
        <div className="bg-red-700 text-white py-6 px-6">
          <h1 className="text-3xl font-bold">KFC Order Bot</h1>
        </div>
        <div className="p-6">
          {!orderSummary && <p className="text-gray-300 mb-4">{response}</p>}

          {!botStarted && (
            <button
              className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
              onClick={() => {
                setShowMenu(true);
                setBotStarted(true);
              }}
            >
              Start KFC Bot
            </button>
          )}

          {showMenu && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition duration-300 flex justify-between items-center"
                    onClick={() => handleItemSelect(item)}
                  >
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="text-red-400 font-bold">${item.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>

              {Object.keys(selectedItems).length > 0 && (
                <div className="bg-gray-700 rounded-lg p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-4 text-white">Your Selected Items:</h2>
                  <ul className="space-y-3">
                    {Object.entries(selectedItems).map(([item, quantity]) => (
                      <li key={item} className="flex justify-between items-center text-white">
                        <span className="font-medium">
                          {item} x {quantity} = ${(menuItems.find(i => i.name === item).price * quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-300"
                            onClick={() => handleItemRemove({ name: item })}
                          >
                            -
                          </button>
                          <span className="font-semibold">{quantity}</span>
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition duration-300"
                            onClick={() => handleItemSelect({ name: item })}
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-2 text-white">
                    <p className="flex justify-between"><span>Subtotal:</span> <span className="font-semibold">${subtotal.toFixed(2)}</span></p>
                    <p className="flex justify-between"><span>GST (18%):</span> <span className="font-semibold">${gst.toFixed(2)}</span></p>
                    <p className="flex justify-between text-lg font-bold"><span>Total:</span> <span>${total.toFixed(2)}</span></p>
                  </div>
                  <button
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300 mt-4"
                    onClick={handleConfirmOrderClick}
                  >
                    Confirm Order
                  </button>
                </div>
              )}
            </div>
          )}

          {showUserInfo && (
            <div className="mt-6 bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Please Enter Your Details:</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={userInfo.name}
                  onChange={handleUserInfoChange}
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={userInfo.address}
                  onChange={handleUserInfoChange}
                />
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile"
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={userInfo.mobile}
                  onChange={handleUserInfoChange}
                />
                <button
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
                  onClick={handleSubmitOrder}
                >
                  Submit Order
                </button>
              </div>
            </div>
          )}

          {orderSummary && !orderCancelled && (
            <div className="mt-6 bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Order Summary:</h2>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                {orderSummary.split('\n').map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <div className="flex space-x-4">
                <button
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
                  onClick={handleConfirmOrder}
                >
                  Confirm Order
                </button>
                <button
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
                  onClick={handleCancelOrder}
                >
                  Cancel Order
                </button>
              </div>
              <button
                className="w-full mt-4 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                onClick={handleBackToStart}
              >
                Back to Start
              </button>
            </div>
          )}

          {orderCancelled && (
            <div className="mt-6 bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Order Cancelled</h2>
              <p className="text-gray-300 mb-4">Oops, order cancelled. You can still order.</p>
              <button
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                onClick={handleBackToStart}
              >
                Back to Start
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}