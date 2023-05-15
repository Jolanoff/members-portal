import { createContext, useContext, useEffect, useState } from 'react';
import Keycloak from 'keycloak-js';

// Create a context for Keycloak
const KeycloakContext = createContext(null);

// Custom hook to easily access Keycloak context
export const useKeycloak = () => {
  return useContext(KeycloakContext);
};

// Keycloak middleware component to handle authentication
export const KeycloakMiddleware = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [processingAuthentication, setProcessingAuthentication] = useState(true)
  const [keycloakInstance, setInstance] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  

  // If Keycloak instance is not created, create it
  if (keycloakInstance === undefined) {
    const keycloakConfig = {
      url: process.env.REACT_APP_KEYCLOAK_URL,
      realm: process.env.REACT_APP_KEYCLOAK_REALM,
      clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
    };
    setInstance(new Keycloak(keycloakConfig));
  }

  const refreshToken = async () => {
    try {
      const refreshed = await keycloakInstance.updateToken(5);
      if (refreshed) {
        sessionStorage.setItem('keycloak-token', keycloakInstance.token);
        sessionStorage.setItem('keycloak-refresh-token', keycloakInstance.refreshToken);

        // Update the user profile after refreshing the token
        keycloakInstance.loadUserProfile().then((profile) => {
          setUserProfile(profile);
        }).catch((error) => {
          console.error('Error loading user profile:', error);
          setAuthenticated(false);
          setProcessingAuthentication(false);
        });
      } else {
        
      }
    } catch (error) {
      console.error('Failed to refresh token', error);
      setAuthenticated(false);
      setProcessingAuthentication(false);
    }
  };

  useEffect(() => {
    async function initKeycloak() {
      try {
        // Get stored token from sessionStorage
        const storedToken = sessionStorage.getItem("keycloak-token");

        // Set up init options based on the presence of a stored token
        const initOptions = storedToken
          ? {
            token: storedToken,
            refreshToken: sessionStorage.getItem("keycloak-refresh-token"),
          }
          : {
            onLoad: "login-required",
          };

        // Initialize Keycloak
        const auth = await keycloakInstance.init(initOptions);
        if (auth) {
          // If authenticated, store the token and refresh token in sessionStorage
          sessionStorage.setItem("keycloak-token", keycloakInstance.token);
          sessionStorage.setItem(
            "keycloak-refresh-token",
            keycloakInstance.refreshToken
          );

          // Load the user profile
          const profile = await keycloakInstance.loadUserProfile();
          setUserProfile(profile);
        } else {
          // If not authenticated, remove token and refresh token from sessionStorage
          sessionStorage.removeItem("keycloak-token");
          sessionStorage.removeItem("keycloak-refresh-token");
        }
        setKeycloak(keycloakInstance);
        setAuthenticated(auth);
        setProcessingAuthentication(false);
      } catch (error) {
        console.error("Keycloak Initialization Error:", error);
        setProcessingAuthentication(false);
      }
    }

    initKeycloak();
  }, []);
  //refresh the token so the session don't expire every minute
  useEffect(() => {
    if (authenticated) {
      const intervalId = setInterval(() => {
        refreshToken();
      }, 60000); // Refresh every minute

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [authenticated]);

  // Show nothing while processing authentication
  if (processingAuthentication) {
    return null;
  }

  // Show "not authenticated" message if not authenticated
  if (!authenticated) {
    window.location.reload();
  } else {
    // If authenticated, provide the Keycloak context to child components
    return (
      <KeycloakContext.Provider value={{ keycloak, authenticated, processingAuthentication, userProfile }}>
        {children}
      </KeycloakContext.Provider>
    );
  }
};
