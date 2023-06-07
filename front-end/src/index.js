import React from 'react';
import ReactDOM from 'react-dom/client';
import { KeycloakMiddleware } from './KeycloakContext';
import PrivateRoute from './utils/ProtectedRoute';
import App from './App';
import Members from "./pages/Members";
import Dashboard from "./pages/Dashboard";
import Profile from './pages/Profile';
import NavbarPage from './components/NavbarPage';
import Projects from './pages/Projects';
import ProjectSection from './pages/ProjectSection';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './css/index.css';
import Settings from './pages/Settings';


import Modal from 'react-modal';
Modal.setAppElement('#root');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <BrowserRouter>
    <KeycloakMiddleware>
      <NavbarPage />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/members" element={<Members />} />
        <Route path='/dashboard' element={< PrivateRoute />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path='/members/:id' element={< Profile />} />
        <Route path='/projects' element={< Projects />} />
        <Route path="/projects/:id" element={<ProjectSection />} />
        <Route path='/settings' element={< Settings />} />
      </Routes>
    </KeycloakMiddleware>
  </BrowserRouter>


);

