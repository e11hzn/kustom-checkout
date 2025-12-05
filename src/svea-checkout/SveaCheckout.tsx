import { useEffect, useState, useRef } from "react";
import { generateSveaAuthHeader, getFormattedTimestamp } from "./utils";

const MERCHANT_ID = "124842";
const CHECKOUT_SECRET = "1NDxpT2WQ4PW6Ud95rLWKD98xVr45Q8O9Vd52nomC7U9B18jp7lHCu7nsiTJO1NWXjSx26vE41jJ4rul7FUP1cGKXm4wakxt3iF7k63ayleb1xX9Di2wW46t9felsSPW";

// API Endpoint (Use the proxy path if calling Svea directly from here, in real app this should be done on our server)
const DEV_CORS_PRE_API_URL = location.hostname === 'localhost' ? 'http://127.0.0.1:8080/' : 'https://cors-anywhere.herokuapp.com/';
const API_URL = `${DEV_CORS_PRE_API_URL}https://checkoutapistage.svea.com/api/orders`; // Using proxy path to avoid CORS

const cartItems = [
    {
      articleNumber: "12345",
      name: "Playground Test Product",
      quantity: 1,
      unitPrice: 25000, // 250.00 SEK
      vatPercent: 2500, // 25%
    },
  ];

export const SveaCheckout = () => {
  const [snippet, setSnippet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const createOrder = async () => {
    setLoading(true);
    setError(null);

    const timestamp = getFormattedTimestamp();
    
    // Construct Request Body
    const requestBody = {
      countryCode: "SE",
      currency: "SEK",
      locale: "sv-SE",
      clientOrderNumber: `TEST-${Date.now()}`,
      merchantSettings: {
        termsUri: 'https://www.example.com/terms',
        checkoutUri: 'https://www.example.com/checkout',
        confirmationUri: 'https://www.example.com/confirmation?kco_order_id={checkout.order.id}',
        pushUri: 'https://www.example.com/api/push?kco_order_id={checkout.order.id}',
      },
      cart: {
        items: cartItems,
      },
    };

    const bodyString = JSON.stringify(requestBody);

    try {
      const authToken = await generateSveaAuthHeader(
        MERCHANT_ID,
        CHECKOUT_SECRET,
        bodyString,
        timestamp
      );

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
          Timestamp: timestamp,
        },
        body: bodyString,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      // The snippet is usually in data.Gui.Snippet
      setSnippet(data.Gui.Snippet);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  // Initialize checkout on mount
  useEffect(() => {
    createOrder();
  }, []);

  // Helper to execute scripts inside the snippet HTML
  useEffect(() => {
    if (snippet && containerRef.current) {
      // 1. Insert HTML
      containerRef.current.innerHTML = snippet;

      // 2. Find and execute scripts manually
      const scripts = containerRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        
        // Replace old script with executable new script
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [snippet]);

  return (
    <div>
      <h1>Svea Checkout Playground</h1>
      <div className="cart-summary">
        <h2>Your Cart</h2>
        <ul>
          {cartItems.map((item) => (
            <li key={item.articleNumber}>
              {item.name} x {item.quantity} - {(item.unitPrice / 100).toFixed(2)} SEK
            </li>
          ))}
        </ul>
        {loading && <p>Loading checkout...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div ref={containerRef} />
      </div>
    </div>
  );
};