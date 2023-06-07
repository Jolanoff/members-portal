import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useKeycloak } from '../KeycloakContext';
import { Link } from 'react-router-dom';
import Pagination from 'react-js-pagination';
import { FaArrowLeft, FaArrowRight, FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa'

const Projects = () => {
  const { keycloak } = useKeycloak();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          }
        });
        setProjects(response.data);
        setFilteredProjects(response.data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchProjects();
  }, [keycloak]);

  const onSearchChange = (e) => {
    const inputValues = e.target.value.toLowerCase().split(' ');

    const filtered = projects.filter((project) => {
      const title = project.title.toLowerCase();
      const department = project.department.toLowerCase();
      const subsystem = project.subsystem.toLowerCase();

      return inputValues.every(input => (
        title.includes(input) ||
        department.includes(input) ||
        subsystem.includes(input)
      ));
    });

    setFilteredProjects(filtered);
    setActivePage(1);
  };


  const handlePageChange = (pageNumber) => {
    setActivePage(pageNumber);
  };

  const indexLast = activePage * itemsPerPage;
  const indexFirst = indexLast - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexFirst, indexLast);

  const projectViewItem = (item) => {
    return (
      <Link to={`/projects/${item.id}`} className="m-4 p-8 bg-white rounded-xl shadow-md text-gray-800 dark:text-gray-400 overflow-hidden max-w-xl" key={item.id}>
        <h2 className="font-bold text-2xl mb-4 text-center uppercase">{item.title}</h2>
        <div className="flex justify-between mb-4">
          <p className="text-sm uppercase"><strong>Department:</strong><br /> {item.department}</p>
          <p className="text-sm uppercase"><strong>Subsystem:</strong><br /> {item.subsystem}</p>
        </div>


        <p className="text-sm uppercase"><strong>Created by:</strong><br /> {item.created_by_name}</p>
        <p className="text-sm mt-2 uppercase"><strong>Last updated by:</strong><br /> {item.last_updated_by_name}</p>
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
      <div className="relative w-full mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            onSearchChange(e);
          }}
          type="text"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          placeholder="Search projects by title, departement or subsystem"
          required=""
        />
      </div>
      <div className="grid gap-4 sm:gap-8 lg:gap-16 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {
          filteredProjects.length === 0 ? (
            <tr>
              <td>
                <p className='m-10 font-semibold text-gray-600'>No projects found.</p>
              </td>
            </tr>
          )
            : currentProjects.map(projectViewItem)

        }
      </div>
      {filteredProjects.length > itemsPerPage && (
        <Pagination
          activePage={activePage}
          itemsCountPerPage={itemsPerPage}
          totalItemsCount={filteredProjects.length}
          pageRangeDisplayed={5}
          onChange={handlePageChange}
          innerClass="flex justify-center mt-2"
          linkClass="mx-1 flex h-9 w-9 items-center justify-center rounded-full border border-blue-gray-100 bg-blue p-0 text-sm"
          itemClass="text-blue-gray-500 hover:bg-light-300"
          activeLinkClass="text-white bg-blue-500 hover:bg-blue-600"
          prevPageText={<FaArrowLeft className='text-gray-500' />}
          lastPageText={<FaAngleDoubleRight className='text-gray-500' />}
          firstPageText={<FaAngleDoubleLeft className='text-gray-500' />}
          nextPageText={<FaArrowRight className='text-gray-500' />}
        />
      )}
    </div>
  );

}

export default Projects