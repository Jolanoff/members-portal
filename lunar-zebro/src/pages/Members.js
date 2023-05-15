import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaginationTool from './tools/PaginationTool';
import Search from './tools/Search';
import { Link } from 'react-router-dom';
import { useKeycloak } from '../KeycloakContext'

import { Tabs } from 'flowbite-react'

import { ThreeDots } from 'react-loader-spinner';


function Members() {

  // loading 
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Show the spinner for 0.3 second

    return () => clearTimeout(timer); // Clean up the timer when the component unmounts
  }, []);

  const { keycloak } = useKeycloak();

  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPerpage] = useState(8);


  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
          'Content-Type': 'application/json',
        }

      });
      setData(response.data);

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const MemberViewItem = (item) => {
    return (

      <Link to={`/members/${item.id}`} className="text-center text-gray-500 dark:text-gray-400 ">
        <div className="card" key={item.id}>
          {item.profile_pic ? (
            <img
              className="mx-auto mb-4 w-36 h-36 rounded-full"
              src={item.profile_pic}
              alt={item.first_name}
            />
          ) : (
            <div
              className="mx-auto mb-4 w-36 h-36 rounded-full flex items-center justify-center bg-blue-400 text-white text-6xl"
            >
              {item.first_name.charAt(0).toUpperCase()}
            </div>
          )}

          <h3 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <a href="#">{item.first_name + " " + item.last_name}</a>
          </h3>
          <p>{item.email}</p>
        </div>
      </Link>
    )
  }

  // pagination  
  const filteredSet = data.filter(x => activeTab === 0 || (activeTab === 1 && x.current) || (activeTab === 2 && !x.current));
  const indexLast = currentPage * dataPerpage;
  const indexFirst = indexLast - dataPerpage;
  const currentData = filteredSet.length > dataPerpage ? filteredSet.slice(indexFirst, indexLast) : filteredSet;
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <ThreeDots
            height="100"
            width="100"
            radius="12"
            color="#1850ab"
          />
        </div>
      ) : (
        <section className="bg-grey-200 dark:bg-gray-900">
          <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-6">
            <div className="mx-auto mb-8 max-w-screen-sm lg:mb-8">
              <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Members</h2>
            </div>
            <div className="text-sm mb-10 font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
              <ul className="flex flex-wrap -mb-px justify-between">
                <li className="mr-2">
                  <Tabs.Group
                    aria-label="Tabs with underline"
                    style="underline"
                    onActiveTabChange={tab => setActiveTab(tab)}
                  >
                    <Tabs.Item title="All"

                    />
                    <Tabs.Item
                      title="Current members"
                    />
                    <Tabs.Item
                      title="Former members"
                    />
                  </Tabs.Group>
                </li>
                <li className="mr-2">
                </li>
                <li className="mr-2">
                  <Search />

                </li>

              </ul>
            </div>
            <div className="grid gap-8 lg:gap-16 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {currentData.map(x => MemberViewItem(x))}
            </div>
            <PaginationTool dataPerpage={dataPerpage} totalData={filteredSet.length} paginate={paginate} currentPage={currentPage} />
          </div>
        </section>
      )};

    </div>
  )
}

export default Members