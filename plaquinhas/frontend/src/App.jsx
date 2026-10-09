import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import ScrollProgress from './components/ScrollProgress';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import RequireAuth from './components/RequireAuth';
import { page } from './motion';
import Home from './pages/Home';
import PublicTag from './pages/PublicTag';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Tags from './pages/admin/Tags';
import TagForm from './pages/admin/TagForm';
import Password from './pages/admin/Password';

// As páginas saem e entram (Framer Motion): a antiga sobe e desaparece, a nova sobe no lugar.
// A chave é o caminho, então mudanças de querystring não repetem a animação. O scroll volta
// ao topo só depois que a página antiga saiu, para não pular no meio da animação.
function AnimatedPage({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div key={location.pathname} className="page-in" {...page}>
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
      <main>
        <AnimatedPage>
          {(location) => (
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              {/* A URL gravada na medalha. Curta de propósito: cabe num QR Code pequeno. */}
              <Route path="/tag/:code" element={<PublicTag />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
                <Route index element={<Dashboard />} />
                <Route path="plaquinhas" element={<Tags />} />
                <Route path="plaquinhas/:id" element={<TagForm />} />
                <Route path="nova" element={<TagForm />} />
                <Route path="senha" element={<Password />} />
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
