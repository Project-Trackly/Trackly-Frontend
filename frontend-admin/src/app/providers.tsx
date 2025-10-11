"use client";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { AdminAuthProvider } from "@/lib/auth";

const chakraTheme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  },
  fonts: {
    heading: "inherit",
    body: "inherit"
  },
  styles: {
    global: {
      body: {
        bg: "transparent",
        color: "inherit"
      }
    }
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={chakraTheme} resetCSS={false}>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </ChakraProvider>
  );
}

