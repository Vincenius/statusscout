import "@mantine/core/styles.css";
import '@mantine/charts/styles.css';
import "./global.css";

import { Center, Loader, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import { useRoutes } from 'react-router-dom';
import routes from '~react-pages';
import { Suspense } from 'react';
import NotFound from './pages/404.jsx';

function AppRoutes() {
  const element = useRoutes([
    ...routes,
    {
      path: "*",
      element: <NotFound />
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
