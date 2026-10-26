import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './lib/cart.jsx';
import Menu from './pages/Menu.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Orders from './pages/admin/Orders.jsx';
import MenuManager from './pages/admin/MenuManager.jsx';
import Customers from './pages/admin/Customers.jsx';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        {/* admin dashboard is the main app */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Orders />} />
          <Route path="orders/:status" element={<Orders />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="customers" element={<Customers />} />
        </Route>
        {/* customer-facing demo */}
        <Route path="/demo" element={<Menu />} />
        <Route path="/demo/checkout" element={<Checkout />} />
        <Route path="/demo/confirmation/:orderId" element={<Confirmation />} />
      </Routes>
    </CartProvider>
  );
}
