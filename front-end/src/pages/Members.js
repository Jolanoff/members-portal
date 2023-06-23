import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa'
import axios from 'axios';
import PaginationTool from './tools/PaginationTool';
import { Link } from 'react-router-dom';
import { useKeycloak } from '../KeycloakContext'

import { Tabs } from 'flowbite-react'
import FilterForm from './tools/FilterForm';
import { ThreeDots } from 'react-loader-spinner';

import { CSVLink } from 'react-csv';
import { Checkbox, Menu, Dropdown, Button } from 'antd';

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
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPerpage, setDataPerpage] = useState(8);


  // Fetch Data
  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
          'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : (keycloak.hasRealmRole('former_member') ? 'former_member' : 'user'),
          'Content-Type': 'application/json',
        }
      });

      setData(response.data);
      setFilteredMembers(response.data);
    } catch (err) {
      console.log(err);
    }
  };
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    setUserRole(keycloak.hasRealmRole('admin') ? 'admin' : (keycloak.hasRealmRole('former_member') ? 'former_member' : 'user'));
  }, []);
  let placeholderText;
  if (userRole === 'former_member') {
    placeholderText = "Search by Name or Email";
  } else {
    placeholderText = "Search by Name, Email or Phone number";
  }




  useEffect(() => {
    fetchData();
  }, []);
  const MemberViewItem = (item) => {
    return (

      <Link to={`/members/${item.id}`} className="text-center text-gray-500 dark:text-gray-400" key={item.id} >
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
            {item.first_name + " " + item.last_name}
          </h3>
          <p>{item.email}</p>
          <p>{item.phone_number}</p>
        </div>
      </Link>
    )
  }

  // pagination  
  // Filtered Set based on activeTab and search input
  const [selectedFilter, setSelectedFilter] = useState({ tags: [], department: [], subsystem: [] });
  const handleSelectFilter = (newSelectedFilter) => {
    setSelectedFilter(newSelectedFilter);
  };
  const indexLast = currentPage * dataPerpage;
  const indexFirst = indexLast - dataPerpage;
  // Current Data to be displayed based on pagination
  const currentData = filteredMembers.length > dataPerpage ? filteredMembers.slice(indexFirst, indexLast) : filteredMembers;
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const [userInput, setUserInput] = useState('');
  const [noData, setNoData] = useState(false);

  const updateFilteredMembers = (searchTerm = '') => {
    let result = [...data];
    const canSeePhoneNumber = !keycloak.hasRealmRole('former_member');
    // Filter based on search term
    if (searchTerm) {
      const inputValues = searchTerm.toLowerCase().split(' ');
      result = result.filter((member) => {
        const name = ((member.first_name || '') + ' ' + (member.last_name || '')).toLowerCase();
        const email = (member.email || '').toLowerCase();
        let phoneNumberString = (member.phone_number ? member.phone_number.replace(/\D/g, '') : '');

        return inputValues.every(input => {
          let isInputNumeric = /^\d+$/.test(input);
          let processedInput = isInputNumeric ? input.replace(/^0+/, '').replace(/\D/g, '') : input;
          return (
            name.includes(input) ||
            email.includes(input) ||
            (canSeePhoneNumber && isInputNumeric && phoneNumberString.includes(processedInput))
          );
        });
      });
    }
    // Filter based on activeTab
    if (activeTab !== 0) {
      result = result.filter(x => (activeTab === 1 && x.current) || (activeTab === 2 && !x.current));
    }

    // Apply filters
    result = result.filter(x => {
      const tagFilter = !selectedFilter.tags.length || selectedFilter.tags.some(tag => x.tags.includes(tag));
      const departmentFilter = !selectedFilter.department.length || selectedFilter.department.includes(x.department);
      const subsystemFilter = !selectedFilter.subsystem.length || selectedFilter.subsystem.some(subsystem => x.subsystems.includes(subsystem));

      return tagFilter && departmentFilter && subsystemFilter;
    });



    if (result.length === 0) {
      setNoData(true);
    } else {
      setNoData(false);
    }

    setFilteredMembers(result);
  };

  //search function
  const onSearchChange = (e) => {
    setUserInput(e.target.value);
    updateFilteredMembers(e.target.value);
  };

  useEffect(() => {
    updateFilteredMembers(userInput);
  }, [data, activeTab, selectedFilter]);



  const [selectedFields, setSelectedFields] = useState({
    first_name: true,
    last_name: true,
    email: true,
    phone_number: true,
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const handleFieldChange = (e) => {
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    setSelectedFields({ ...selectedFields, [e.target.name]: e.target.checked });
  };
  const menuItems = [
    {
      key: 'first_name',
      label: (
        <Checkbox
          name="first_name"
          checked={selectedFields.first_name}
          onChange={handleFieldChange}
        >
          First Name
        </Checkbox>
      ),
    },
    {
      key: 'last_name',
      label: (
        <Checkbox
          name="last_name"
          checked={selectedFields.last_name}
          onChange={handleFieldChange}
        >
          Last Name
        </Checkbox>
      ),
    },
    {
      key: 'email',
      label: (
        <Checkbox
          name="email"
          checked={selectedFields.email}
          onChange={handleFieldChange}
        >
          Email
        </Checkbox>
      ),
    },
    {
      key: 'phone_number',
      label: (
        userRole !== 'former_member' && (
          <Checkbox
            name="phone_number"
            checked={selectedFields.phone_number}
            onClick={handleFieldChange}
          >
            Phone Number
          </Checkbox>
        )
      ),
    },
    {
      key: 'csv_link',
      label: (
        <CSVLink
          data={filteredMembers.map(member => {
            const newMember = {};
            Object.keys(selectedFields).forEach(field => {
              if (selectedFields[field]) {
                newMember[field] = member[field];
              }
            });
            return newMember;
          })}
          headers={Object.keys(selectedFields).filter(key => selectedFields[key]).map(field => {
            return { label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '), key: field };
          })}
          filename={"my-filtered-data.csv"}
        >
          Export to CSV
        </CSVLink>
      )
    },
  ];


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
                <li className="w-100">

                  <div className="relative text-gray-600 focus-within:text-gray-400">

                    <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                      <button type="submit" className="p-1 focus:outline-none focus:shadow-outline">
                        <FaSearch />
                      </button>
                    </span>

                    <input
                      value={userInput}
                      onChange={(e) => {
                        setUserInput(e.target.value);
                        onSearchChange(e);
                      }}
                      type="text"
                      className="h-12 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-12 py-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder={placeholderText}
                      required=""
                    />

                  </div>

                </li>

              </ul>
              <div className='flex justify-between'>
                <div className='mb-5'>
                  <FilterForm handleSelectFilter={handleSelectFilter} />

                </div>
                <div>
                  <Dropdown menu={{ items: menuItems }} open={dropdownVisible} onOpenChange={setDropdownVisible} placement="bottomLeft" trigger={['click']}>
                    <Button className='mb-5'>Export</Button>
                  </Dropdown>
                </div>
              </div>

            </div>


            <div className="grid gap-8 lg:gap-16 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {noData
                ? <p className='m-10 font-semibold text-gray-600'>No search results.</p>
                : currentData.map(x => MemberViewItem(x))
              }
            </div>


            {!userInput && filteredMembers.length > dataPerpage &&
              <PaginationTool dataPerpage={dataPerpage} totalData={filteredMembers.length} paginate={paginate} currentPage={currentPage} />
            }
            {filteredMembers.length > 8 &&
              <select
                className="mt-3 flex bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={dataPerpage} onChange={e => setDataPerpage(Number(e.target.value))}>
                <option value="8">8 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            }
          </div>
        </section>
      )};

    </div>
  )
}

export default Members