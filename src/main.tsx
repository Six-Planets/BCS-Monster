import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';

// Pause every CSS animation while the tab is hidden (see html[data-tab='hidden'] in index.css).
const syncTabState = () => {
  document.documentElement.setAttribute('data-tab', document.hidden ? 'hidden' : 'visible');
};
document.addEventListener('visibilitychange', syncTabState);
syncTabState();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);
