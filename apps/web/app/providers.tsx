"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode, useEffect } from 'react';
import { AlertProvider, setGlobalAlertContext, useAlert } from '@repo/ui';

interface ProvidersProps {
  children: ReactNode;
}

function AlertContextInitializer() {
  const alertContext = useAlert();
  
  useEffect(() => {
    setGlobalAlertContext(alertContext);
  }, [alertContext]);
  
  return null;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          retry: (failureCount, error: any) => {
            if (error?.statusCode === 404) return false;
            return failureCount < 3;
          },
        },
        mutations: {
          retry: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <AlertContextInitializer />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </AlertProvider>
    </QueryClientProvider>
  );
}
