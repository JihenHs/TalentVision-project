import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authService } from './lib/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobPosts from './pages/JobPosts';
import CreateJobPost from './pages/CreateJobPost';
import JobPostDetail from './pages/JobPostDetail';
import JobPostApplications from './pages/JobPostApplications';
import JobPostBestMatches from './pages/JobPostBestMatches';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Alerts from './pages/Alerts';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              authService.isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              authService.isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigate to="/dashboard" replace />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ApplicationDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-posts"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobPosts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-posts/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateJobPost />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-posts/:id/best-matches"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobPostBestMatches />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-posts/:id/applications"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobPostApplications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-posts/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobPostDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
