import React, { useState, useEffect } from 'react';
import { useKeycloak } from '../KeycloakContext';


function Home() {
  const { userProfile: initialUserProfile } = useKeycloak();
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  useEffect(() => {
    setUserProfile(initialUserProfile);
  }, [initialUserProfile]);
  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 mt-48">
          <h1 className="text-7xl font-bold mb-6 text-blue-700 uppercase">
            Hi {userProfile.firstName}
          </h1>
          <p className="text-5xl text-gray-700 uppercase">
            Welcome to the Lunar Zebro Members Portal
          </p>
        </div>

      </div>
    </div>
  );
};



export default Home