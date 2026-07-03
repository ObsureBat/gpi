import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
import { Layout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { CollectionPage } from './pages/CollectionPage.jsx';
import { ProductPage } from './pages/ProductPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { NotFound } from './pages/NotFound.jsx';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/collections/:handle" element={<CollectionPage />} />
          <Route path="/products/:handle" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </CartProvider>
  );
}
