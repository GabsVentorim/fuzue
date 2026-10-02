import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import ScrollProgress from './components/ScrollProgress';
import { page } from './motion';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import BallThrow from './components/BallThrow';
import PageStickers from './components/PageStickers';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SizeGuidePage from './pages/SizeGuidePage';
import TapeMeasure from './pages/TapeMeasure';
import RequireAuth from './components/RequireAuth';
import AccountLayout from './pages/account/AccountLayout';
import Profile from './pages/account/Profile';
import Pets from './pages/account/Pets';
import MyOrders from './pages/account/Orders';
import Addresses from './pages/account/Addresses';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Stock from './pages/admin/Stock';
import Customers from './pages/admin/Customers';
import Coupons from './pages/admin/Coupons';
import Tickets from './pages/admin/Tickets';
import Banners from './pages/admin/Banners';

// Pages leave and arrive (Framer Motion): the old page fades up and out, then the new one rises in.
// Keyed by path, so query changes like ?categoria= don't replay it. The scroll goes back to the top
// once the old page has left, so it never jumps mid-animation.
function AnimatedPage({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div key={location.pathname} className="page-in" {...page}>
        <PageStickers />
        {children(location)}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <Header />
      <BallThrow />
      <main>
        <AnimatedPage>
        {(location) => (
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/loja" element={<Shop />} />
          <Route path="/produto/:slug" element={<Product />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id" element={<OrderSuccess />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/guia-de-tamanhos" element={<SizeGuidePage />} />
          <Route path="/fita-metrica" element={<TapeMeasure />} />
          <Route path="/minha-conta" element={<RequireAuth><AccountLayout /></RequireAuth>}>
            <Route index element={<Profile />} />
            <Route path="pets" element={<Pets />} />
            <Route path="pedidos" element={<MyOrders />} />
            <Route path="enderecos" element={<Addresses />} />
          </Route>
          <Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="produtos/novo" element={<ProductForm />} />
            <Route path="produtos/:id" element={<ProductForm />} />
            <Route path="estoque" element={<Stock />} />
            <Route path="cupons" element={<Coupons />} />
            <Route path="chamados" element={<Tickets />} />
            <Route path="carrossel" element={<Banners />} />
            <Route path="clientes" element={<Customers />} />
            <Route path="clientes/:id" element={<Customers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        )}
        </AnimatedPage>
      </main>
      <Footer />
      <Toast />
    </MotionConfig>
  );
}
