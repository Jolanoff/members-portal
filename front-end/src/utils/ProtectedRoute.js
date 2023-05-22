import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useKeycloak } from '../KeycloakContext';

const PrivateRoute = () => {
  const { keycloak, authenticated } = useKeycloak();
  const navigate = useNavigate();

  const isAdmin = authenticated && keycloak.hasRealmRole('admin');

  if (!isAdmin) {
    navigate('/', { replace: true });
    return <div>You dont have acess to view this page</div>;
  }

  return <Outlet />;
};

export default PrivateRoute;
