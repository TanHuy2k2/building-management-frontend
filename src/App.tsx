import { RouterProvider } from 'react-router';
import { router } from './utils/routes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
