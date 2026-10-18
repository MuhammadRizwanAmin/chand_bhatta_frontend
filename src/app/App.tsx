import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />

      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={true}
        visibleToasts={4}
        duration={4000}
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow:
              '0 10px 25px rgba(0, 0, 0, 0.08)',
          },
        }}
      />
    </>
  );
}