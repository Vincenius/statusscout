import "@mantine/core/styles.css";
import '@mantine/charts/styles.css';
import "./global.css";

import { useEffect } from "react";
import { Center, Loader, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { useRoutes } from 'react-router-dom';
import routes from '~react-pages';
import { Suspense } from 'react';

function Redirect404() {
  useEffect(() => {
    window.location.replace("/404.html");
  }, []);
  return null;
}


function AppRoutes() {
  const element = useRoutes([
    ...routes,
    {
      path: "*",
      element: <Redirect404 />
    }
  ]);
  return element;
}

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Suspense fallback={<Center h="100vh"><Loader /></Center>}>
        <AppRoutes />
      </Suspense>
    </MantineProvider>
  );
}
