import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/open-runde/latin-400.css';
import '@fontsource/open-runde/latin-500.css';
import '@fontsource/open-runde/latin-600.css';
import '@fontsource/open-runde/latin-700.css';
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/app.css';

// Google Material Web (M3) Web Components
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/divider/divider.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/switch/switch.js';
import '@material/web/checkbox/checkbox.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
