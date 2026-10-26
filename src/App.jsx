import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './lib/cart.jsx';
import Menu from './pages/Menu.jsx';
import Checkout from './pages/Checkout.jsx';
import Confirmation from './pages/Confirmation.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Orders from './pages/admin/Orders.jsx';
import MenuManager from './pages/admin/MenuManager.jsx';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation/:orderId" element={<Confirmation />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Orders />} />
          <Route path="orders/:status" element={<Orders />} />
          <Route path="menu" element={<MenuManager />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
