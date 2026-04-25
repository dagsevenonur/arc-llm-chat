import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'

import Home from './pages/home';
import Chat from './pages/chat';
import ChatDetail from './pages/chat-details';
import Settings from './pages/settings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  </StrictMode>,
)
