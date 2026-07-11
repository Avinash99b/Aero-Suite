import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Standalone Docker deployments serve the frontend and backend from
// different origins, so the API base URL must be configurable at container
// runtime (see public/config.js). Same-origin path-routed deployments
// (Replit) leave this unset and all `/api/...` calls stay relative.
const runtimeApiBaseUrl = (window as any).__ENV__?.API_BASE_URL as string | undefined;
setBaseUrl(runtimeApiBaseUrl || null);

createRoot(document.getElementById('root')!).render(<App />);
