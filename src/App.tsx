import { useEffect, useState } from 'react';
import { KustomCheckout } from './KustomCheckout';
import { SveaCheckout } from './svea-checkout/SveaCheckout';

export function App() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    console.log('has loaded')
  })

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '12px' }}>
        <button onClick={() => setActiveTab(0)}>Kustom Checkout</button>
        <button onClick={() => setActiveTab(1)}>Svea Checkout</button>
      </div>
      {activeTab === 0 ? <KustomCheckout /> : <SveaCheckout />}
    </div>
  )
}