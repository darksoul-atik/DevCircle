import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import CommunityDetail from './pages/CommunityDetail';
import CreateCommunity from './pages/CreateCommunity';
import Favorites from './pages/Favorites';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a full screen loader
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<Layout />}>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/posts/new" 
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/posts/:id" 
          element={
            <ProtectedRoute>
              <PostDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/me" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/communities/new" 
          element={
            <ProtectedRoute>
              <CreateCommunity />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/communities/:slug" 
          element={
            <ProtectedRoute>
              <CommunityDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
