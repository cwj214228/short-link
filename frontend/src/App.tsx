import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LinkList from "./pages/LinkList";
import CreateLink from "./pages/CreateLink";
import LinkDetail from "./pages/LinkDetail";
import BatchManage from "./pages/BatchManage";
import "./styles/rain-night.css";

const queryClient = new QueryClient();

function RedirectHandler() {
  const { slug } = useParams();
  useEffect(() => {
    if (slug) {
      window.location.href = `http://localhost:8000/api/links/redirect/${slug}`;
    }
  }, [slug]);
  return (
    <div style={{ color: 'var(--rn-neon-cyan)', textAlign: 'center', padding: '100px', fontFamily: 'var(--rn-font-display)' }}>
      正在跳转...
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><MainLayout><LinkList /></MainLayout></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><MainLayout><CreateLink /></MainLayout></ProtectedRoute>} />
          <Route path="/links/:slug" element={<ProtectedRoute><MainLayout><LinkDetail /></MainLayout></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute><MainLayout><BatchManage /></MainLayout></ProtectedRoute>} />
          <Route path="/redirect/:slug" element={<RedirectHandler />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="rain-night-bg">
      <div className="scan-line">
        <header className="cyberpunk-header">
          <div className="header-container">
            <Link to="/" className="header-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <h2>短链接</h2>
            </Link>
            <nav className="header-nav">
              <Link to="/batch" className="header-link">批量管理</Link>
              <button onClick={handleLogout} className="logout-btn">退出</button>
            </nav>
          </div>
        </header>
      </div>
      <div className="page-container">
        {children}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default App;
