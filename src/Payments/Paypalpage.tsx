import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";

const PayPalPayment = () => {
  const [orderID, setOrderID] = useState(""); // For debugging or additional logic
  const [error, setError] = useState(null); // To display errors to the user
  const createOrder = async (data, actions) => {
    try {
      const response = await axios.post("http://localhost:5000/api/orders", {
        cart: [], // Add actual cart items here if required
      });
      const orderData = response.data;
      console.log("✅ Frontend Received Order:", orderData);
  
      if (!orderData.id) {
        throw new Error("No order ID returned from backend");
      }
  
      setOrderID(orderData.id);
      return orderData.id;
    } catch (error) {
      console.error("❌ Error creating order:", error);
      throw error;
    }
  };
  
  const onApprove = async (data, actions) => {
    console.log("🔹 onApprove triggered! Data:", data);
  
    try {
      const orderDetails = await actions.order.capture();
      console.log("💰 Payment Captured (Client-Side):", orderDetails);
  
      // Notify the backend to finalize the order
      const response = await axios.post(
        `http://localhost:5000/api/orders/${orderDetails.id}/capture`
      );
  
      console.log("✅ Backend Capture Response:", response.data);
      alert("✅ Payment Successful!");
    } catch (error) {
      console.error("❌ Error capturing payment:", error);
    }
  };
  
  const clientID = import.meta.env.VITE_PAYPAL_CLIENTID;
  if (!clientID) {
    console.error("❌ PayPal Client ID is missing!");
    return <div>Error: PayPal Client ID not configured.</div>;
  }
  console.log("💳 PayPal Client ID:", clientID);

  return (
    <div>
      <PayPalScriptProvider options={{ clientId: clientID, currency: "USD" }}>
        <PayPalButtons
          createOrder={createOrder}
          onApprove={onApprove}
        
          style={{ layout: "vertical" }} // Optional styling
        />
      </PayPalScriptProvider>
      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}
    </div>
  );
};

export default PayPalPayment;