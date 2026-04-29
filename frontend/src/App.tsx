import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LinkList from "./pages/LinkList";
import CreateLink from "./pages/CreateLink";
import LinkDetail from "./pages/LinkDetail";
import BatchManage from "./pages/BatchManage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><LinkList /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateLink /></ProtectedRoute>} />
          <Route path="/links/:slug" element={<ProtectedRoute><LinkDetail /></ProtectedRoute>} />
          <Route path="/batch" element={<ProtectedRoute><BatchManage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default App;
