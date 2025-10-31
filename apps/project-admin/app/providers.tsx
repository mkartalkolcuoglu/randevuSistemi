"use client";

import { useEffect } from 'react';
import { AlertProvider, setGlobalAlertContext, useAlert } from '@repo/ui';

function AlertContextInitializer() {
  const alertContext = useAlert();
  
  useEffect(() => {
    setGlobalAlertContext(alertContext);
  }, [alertContext]);
  
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AlertProvider>
      <AlertContextInitializer />
      {children}
    </AlertProvider>
  );
}

