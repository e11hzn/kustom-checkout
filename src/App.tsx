import React, { useEffect, useRef, useState } from 'react';

interface OrderLine {
  type: string;
  reference: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_amount: number;
  total_tax_amount: number;
}

interface MerchantUrls {
  terms: string;
  checkout: string;
  confirmation: string;
  push: string;
}

interface OrderPayload {
  purchase_country: string;
  purchase_currency: string;
  locale: string;
  order_amount: number;
  order_tax_amount: number;
  order_lines: OrderLine[];
  merchant_urls: MerchantUrls;
}

interface KustomOrderResponse {
  order_id: string;
  html_snippet: string;
  // Add other fields if needed
}

const KUSTOM_USERNAME = 'PM00512798-E41ai';
const KUSTOM_PASSWORD = 'kco_test_api_5GFOyq6RdYEPXxG4F9VBg0Yp0dKcOoHD';
const DEV_CORS_PRE_API_URL = location.hostname === 'localhost' ? 'http://localhost:8080/' : '';
const API_URL = `${DEV_CORS_PRE_API_URL}https://api.playground.kustom.co/checkout/v3/orders`; // Playground URL

const CheckoutPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);

  // Helper to execute scripts embedded in the HTML snippet
  const executeScripts = (container: HTMLDivElement) => {
    const scripts = container.getElementsByTagName('script');
    Array.from(scripts).forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  };

  const createOrder = async () => {
    setLoading(true);
    setError(null);

    // Dummy Product Data
    // Price: 100.00 SEK (represented as 10000 minor units)
    // Tax: 25% (20.00 SEK tax included)
    const orderPayload: OrderPayload = {
      purchase_country: 'SE',
      purchase_currency: 'SEK',
      locale: 'sv-se',
      order_amount: 10000,
      order_tax_amount: 2000,
      order_lines: [
        {
          type: 'physical',
          reference: '12345',
          name: 'Dummy Product',
          quantity: 1,
          unit_price: 10000,
          tax_rate: 2500,
          total_amount: 10000,
          total_tax_amount: 2000,
        },
      ],
      merchant_urls: {
        terms: 'https://www.example.com/terms',
        checkout: 'https://www.example.com/checkout',
        confirmation: 'https://www.example.com/confirmation?kco_order_id={checkout.order.id}',
        push: 'https://www.example.com/api/push?kco_order_id={checkout.order.id}',
      },
    };

    try {
      const auth = btoa(`${KUSTOM_USERNAME}:${KUSTOM_PASSWORD}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: KustomOrderResponse = await response.json();

      if (checkoutContainerRef.current) {
        // 1. Inject the HTML snippet
        checkoutContainerRef.current.innerHTML = data.html_snippet;
        // 2. Execute the scripts within that snippet to load the iframe
        executeScripts(checkoutContainerRef.current);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create checkout order');
    } finally {
      setLoading(false);
    }
  };

  // Initialize checkout on mount
  useEffect(() => {
    createOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Kustom Checkout Playground</h1>
      
      <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>Cart Summary</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>1x Dummy Product</span>
          <span>100.00 SEK</span>
        </div>
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Total</span>
          <span>100.00 SEK</span>
        </div>
      </div>

      <div className="checkout-wrapper">
        {loading && <p>Loading checkout...</p>}
        {error && (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
            <strong>Error:</strong> {error}
            <p style={{fontSize: '0.8rem', marginTop: '5px'}}>
              Note: If this is a CORS error, you may need a browser extension or a local proxy to make server-side calls from the frontend.
            </p>
          </div>
        )}
        
        {/* The Container where Kustom injects the Iframe */}
        <div ref={checkoutContainerRef} id="kustom-checkout-container" />
      </div>
    </div>
  );
};

export default CheckoutPage;