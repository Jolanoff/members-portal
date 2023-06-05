import React, { useEffect, useState } from 'react';
import axios from 'axios'
import { useKeycloak } from '../KeycloakContext';

const Projects = () => {
  const { keycloak } = useKeycloak();

  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects`,{
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          }
        });
        setProjects(response.data);
        
      } catch (error) {
        console.error(error);
      }
    };

    fetchProjects();
  }, []);
  return (
    <div>Project section will be avalible soon</div>
  )
}

export default Projects