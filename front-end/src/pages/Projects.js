import React, { useEffect, useState } from 'react';
import axios from 'axios'
import { useKeycloak } from '../KeycloakContext';
import { Link } from 'react-router-dom';

const Projects = () => {
  const { keycloak } = useKeycloak();

  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects`, {
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
  }, [keycloak]);

  const projectViewItem = (item) => {
    return (
      <Link to={`/projects/${item.id}`} className="m-4 p-8 bg-white rounded-xl shadow-md text-gray-800 dark:text-gray-400 overflow-hidden max-w-xl" key={item.id}>
        <h2 className="font-bold text-2xl mb-4 text-center uppercase">{item.title}</h2>
        <div className="flex justify-between mb-4">
          <p className="text-sm uppercase"><strong>Department:</strong><br /> {item.department}</p>
          <p className="text-sm uppercase"><strong>Subsystem:</strong><br /> {item.subsystem}</p>
        </div>


        <p className="text-sm uppercase"><strong>Created by:</strong> {item.created_by_name}</p>
        <p className="text-sm mt-2 uppercase"><strong>Last updated by:</strong> {item.last_updated_by_name}</p>
        <div className="mt-2 flex flex-wrap">
          {item.team_members && item.team_members.map((member, index) =>
            <div
              key={index}
              className="px-3 py-1 m-1 text-xs font-bold text-white bg-blue-500 rounded-full"
            >
              {member.name}
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className='py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8'>
      <div className="grid gap-4 sm:gap-8 lg:gap-16 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {projects.map(projectViewItem)}
      </div>
    </div>
  );




}

export default Projects