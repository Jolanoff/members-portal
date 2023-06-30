import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dropdown } from 'flowbite-react';
import { FaRegQuestionCircle, FaBan, FaEdit, FaWindowClose, FaRedoAlt, FaArrowLeft, FaArrowRight, FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa'
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useKeycloak } from '../../KeycloakContext'
import Pagination from 'react-js-pagination';

import FilterForm from '../../pages/tools/FilterForm';
import { CSVLink } from 'react-csv';


import { Popover, Checkbox, Dropdown as AntdDropdown, Button } from 'antd';

const UsersTable = () => {
    //intialize keycloak
    const { keycloak } = useKeycloak();
    // Data returned from the database will be passed to data
    const [data, setData] = useState([]);
    // the selected members data will be passed to the selectedData state
    const [selectedData, setSelectedData] = useState({ firstName: '', lastName: '', username: '', email: '', role: '', phone_number: '', student_number: '', card_number: '', date_of_joining: '', birthday: '', nationality: '' });


    // State for the create user action
    const [createdUserData, SetCreatedUserData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', role: 'user' })

    //states for the password change action

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Modals
    const [viewModal, SetViewModal] = useState(false);
    const [updateModal, SetUpdateModal] = useState(false);
    const [createModal, SetCreateModal] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    //everything that the server returns printed in the error message
    const [errorMessage, setErrorMessage] = useState('');



    //handle success and error alerts
    const [successAlertVisable, setSuccessAlertVisable] = useState(false);
    const [successAlertMessage, setSuccessAlertMessage] = useState('');
    const showSuccessAlert = () => {
        setSuccessAlertVisable(true);
        setTimeout(() => {
            setSuccessAlertVisable(false);
        }, 2000);
    };
    const [errorAlertVisable, setErrorAlertVisable] = useState(false);
    const [errorAlertMessage, setErrorAlertMessage] = useState('')
    const showErrorAlert = () => {
        setErrorAlertVisable(true);
        setTimeout(() => {
            setErrorAlertVisable(false);
        }, 2000);
    };



    // getting the data from the database
    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                }
            });
            setData(response.data);
            setFilteredMembers(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);



    // The content that shows up in the table
    const MemberViewItem = (item) => {
        return (
            <tr key={item.id} className="border-b dark:border-gray-700">
                <th scope="row" className="hover:text-blue-600 px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    <Link to={`/members/${item.id}`}>
                        {item.first_name + " " + item.last_name}
                    </Link>
                </th>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.phone_number}</td>

                <td className="px-4 py-3">{item.student_number}</td>
                <td className="px-4 py-3">{item.card_number}</td>
                <td className="px-4 py-3">{item.nationality}</td>
                <td className="px-4 py-3">{formatDate(item.birthday)}</td>
                <td className="px-4 py-3 flex items-center justify-end">
                    <Dropdown label="actions" id="" data-dropdown-toggle="" className="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100" type="button">
                        <Dropdown.Item onClick={() => viewMember(item.id)}>
                            View
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => saveData(item.id)}>
                            Modify
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => updatePassword(item.id)}>
                            Change password
                        </Dropdown.Item>
                    </Dropdown>
                </td>
            </tr>
        )
    }
    const updatePassword = async (id) => {

        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getUserForAdmin/` + id, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.data.id) {
            console.log("Error getting the user id");
        } else {
            sessionStorage.setItem("id", id);

            setPasswordModal(true);
        }
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    const viewMember = async (id) => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getUserForAdmin/` + id, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.data.id) {
            console.log("Error getting the user id");
        } else {
            sessionStorage.setItem("id", id);
            setSelectedData({
                firstName: res.data.first_name,
                lastName: res.data.last_name,
                username: res.data.username,
                email: res.data.email,
                role: res.data.roles[0],
                phone_number: res.data.phone_number,
                student_number: res.data.student_number,
                card_number: res.data.card_number,
                nationality: res.data.nationality,
                birthday: formatDate(res.data.birthday),
                date_of_joining: formatDate(res.data.date_of_joining),

            });
            SetViewModal(true);
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmNewPassword) {
            setErrorAlertMessage("Please fill in all fields");
            showErrorAlert()
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setErrorAlertMessage("New password and confirmation do not match");
            showErrorAlert()
            return;
        }
        try {
            const userId = sessionStorage.getItem("id");
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/changePassword/${userId}`,
                {
                    newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                });
            setSuccessAlertMessage(response.data);
            showSuccessAlert()
        } catch (err) {
            setErrorAlertMessage(err.response.data);
            showErrorAlert()
        }
    }
    // Save the selected members id and data
    const saveData = async (id) => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/getUserForAdmin/` + id, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.data.id) {
            console.log("Error getting the user id");
        } else {
            sessionStorage.setItem("id", id);
            setSelectedData({
                firstName: res.data.first_name,
                lastName: res.data.last_name,
                username: res.data.username,
                email: res.data.email,
                role: res.data.roles[0],

            });
            SetUpdateModal(true);
        }
    };
    // Update Request
    const handleUpdate = async () => {
        const id = sessionStorage.getItem("id");
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/updateUser/` + id, selectedData, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                },
            });
            const responseData = await response.data;
            setSuccessAlertMessage(responseData);
            showSuccessAlert();
            SetUpdateModal(false)
            fetchData();
        } catch (err) {
            setErrorAlertMessage(err.response?.data);
            showErrorAlert();
        }
    };

    // disable user's account 
    const disableAccount = async () => {
        const id = sessionStorage.getItem("id");
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/disableUser/` + id, {}, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                    'x-user-id': keycloak.subject,
                },
            });
            const responseData = await response.data;
            setSuccessAlertMessage(responseData);
            showSuccessAlert();
            SetUpdateModal(false)
            fetchData();
        } catch (err) {
            setErrorAlertMessage(err.response?.data);
            showErrorAlert();
        }
    };

    // Create Request
    const createMember = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/createUser`, {
                firstName: createdUserData.firstName,
                lastName: createdUserData.lastName,
                username: createdUserData.username,
                email: createdUserData.email,
                password: createdUserData.password,
                role: createdUserData.role,
            }, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                SetCreatedUserData({
                    firstName: '',
                    lastName: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'user',
                });
                setSuccessAlertMessage(response.data);
                showSuccessAlert();
            }
            fetchData();
            SetCreateModal(false)

        } catch (error) {
            let errorMessages = '';
            if (error.response && error.response.data && Array.isArray(error.response.data.errors)) {
                errorMessages = error.response.data.errors.join('<br/>');
                console.log(errorMessages);
            } else {
                errorMessages = 'An unknown error occurred.';
            }
            setErrorAlertMessage(errorMessages);
            showErrorAlert();
        }
    };

    //handle input for the modify user action
    const handleInputChange = (event) => {
        setSelectedData({
            ...selectedData,
            [event.target.name]: event.target.value,
        });
    };

    //handle input for the create user action
    const handleInputChangeCreate = (event) => {
        SetCreatedUserData({
            ...createdUserData,
            [event.target.name]: event.target.value
        })
    }
    const refresh = async () => {
        fetchData()
        setSuccessAlertMessage('refreshed successfully')
        showSuccessAlert()
    }
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [activePage, setActivePage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [selectedFilter, setSelectedFilter] = useState({ tags: [], department: [], subsystem: [] });
    const handleSelectFilter = (newSelectedFilter) => {
        setSelectedFilter(newSelectedFilter);
    };

    // Filtering and search logic
    const onSearchChange = (e) => {
        const inputValues = e.target.value.toLowerCase().split(' ');
        setUserInput(e.target.value);

        let filtered = data.filter((member) => {
            const firstName = member.first_name.toLowerCase();
            const lastName = member.last_name.toLowerCase();
            const email = member.email.toLowerCase();

            return inputValues.every(input => (
                firstName.includes(input) ||
                lastName.includes(input) ||
                email.includes(input)
            ));
        });

        // Apply filters
        filtered = filtered.filter(member => {

            const tags = member.tags ? member.tags.split(",") : []; // convert string to array
            const department = member.department || "";
            const subsystems = member.subsystems ? member.subsystems.split(",") : []; // convert string to array

            const tagFilter = !selectedFilter.tags.length || selectedFilter.tags.some(tag => tags.includes(tag));
            const departmentFilter = !selectedFilter.department.length || selectedFilter.department.includes(department);
            const subsystemFilter = !selectedFilter.subsystem.length || selectedFilter.subsystem.some(subsystem => subsystems.includes(subsystem));

            const isMemberIncluded = tagFilter && departmentFilter && subsystemFilter;

            return isMemberIncluded;
        });

        setFilteredMembers(filtered);
    };



    useEffect(() => {
        onSearchChange({ target: { value: userInput } });
    }, [data, selectedFilter]);

    const handlePageChange = (pageNumber) => {
        setActivePage(pageNumber);
    };

    const [currentData, setCurrentData] = useState([]);

    useEffect(() => {
        const indexLast = activePage * itemsPerPage;
        const indexFirst = indexLast - itemsPerPage;
        setCurrentData(filteredMembers.slice(indexFirst, indexLast));
    }, [filteredMembers, activePage, itemsPerPage]);

    const passwordPolicy = (
        <ul>
            <li>* Your password must be atleast 8 characters long</li>
            <li>* Your password must contain atleast one uppercase character</li>
            <li>* Your password should be unique and not used before</li>
        </ul>
    );


    // export to csv file

    const [selectedFields, setSelectedFields] = useState({
        first_name: true,
        last_name: true,
        student_number: true,
        card_number: true,
        email: true,
        phone_number: true,
        birthday: true,
        nationality: true,
        date_of_joining: true,
    });
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const handleFieldChange = (e, formatter) => {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        setSelectedFields({ ...selectedFields, [e.target.name]: e.target.checked });
        const formattedDate = formatter(e.target.value);
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
            key: 'student_number',
            label: (
                <Checkbox
                    name="student_number"
                    checked={selectedFields.student_number}
                    onChange={handleFieldChange}
                >
                    Student/Employee number
                </Checkbox>
            ),
        },
        {
            key: 'card_number',
            label: (
                <Checkbox
                    name="card_number"
                    checked={selectedFields.card_number}
                    onChange={handleFieldChange}
                >
                    Card number
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

                <Checkbox
                    name="phone_number"
                    checked={selectedFields.phone_number}
                    onClick={handleFieldChange}
                >
                    Phone Number
                </Checkbox>

            ),
        },
        {
            key: 'birthday',
            label: (
                <Checkbox
                    name="birthday"
                    checked={selectedFields.birthday}
                    onChange={(e) => handleFieldChange(e, formatDate)}
                >
                    Birthday
                </Checkbox>
            ),
        },
        {
            key: 'nationality',
            label: (
                <Checkbox
                    name="nationality"
                    checked={selectedFields.nationality}
                    onChange={handleFieldChange}
                >
                    Nationality
                </Checkbox>
            ),
        },
        {
            key: 'date_of_joining',
            label: (
                <Checkbox
                    name="date_of_joining"
                    checked={selectedFields.date_of_joining}
                    onChange={(e) => handleFieldChange(e, formatDate)}
                >
                    Date of joining
                </Checkbox>
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
                                newMember[field] = (field === 'birthday' || field === 'date_of_joining') ? formatDate(member[field]) : member[field];
                            }
                        });
                        return newMember;
                    })}
                    headers={Object.keys(selectedFields).filter(key => selectedFields[key]).map(field => {
                        return { label: field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' '), key: field };
                    })}
                    filename={"my-filtered-data.csv"}
                    className='font-bold'
                >

                    Export to CSV
                </CSVLink>

            )
        },
    ];


    return (
        <div className="mx-auto max-w-screen-x2 px-4 lg:px-12">
            <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
                    {/* search */}
                    <div className="w-full md:w-1/2">
                        <form className="flex items-center">
                            <label htmlFor="simple-search" className="sr-only">Search</label>
                            <div className="relative w-full">
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
                                    type="text" id="simple-search" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Search for name or email" required="" />
                            </div>
                            <button type="button" onClick={() => refresh()} className=" h-full text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center ml-5">
                                <FaRedoAlt />
                            </button>

                        </form>
                        <div className='flex justify-between'>
                            <div className='mb-3 mt-3'>
                                <FilterForm handleSelectFilter={handleSelectFilter} />
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                        {/* add member */}
                        <button type="button" onClick={() => SetCreateModal(true)} className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
                            Create new
                        </button>


                    </div>
                </div>
                {/* Table content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3">Full name</th>

                                <th scope="col" className="px-4 py-3">Email</th>
                                <th scope="col" className="px-4 py-3">Phone number</th>

                                <th scope="col" className="px-4 py-3">Student/Employee number</th>
                                <th scope="col" className="px-4 py-3">Card number</th>
                                <th scope="col" className="px-4 py-3">Nationality</th>
                                <th scope="col" className="px-4 py-3">Birthday</th>
                                <th scope="col" className="px-4 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length === 0
                                ? (
                                    <tr>
                                        <td>
                                            <p className='m-10 font-semibold text-gray-600'>No search results.</p>
                                        </td>
                                    </tr>
                                )
                                : currentData.map(x => MemberViewItem(x))
                            }
                        </tbody>

                    </table>
                </div>
                {/* table footer */}
                <nav className="flex flex-col md:flex-row justify-between items-center md:items-center space-y-3 md:space-y-0 p-4">

                    {!userInput && filteredMembers.length > itemsPerPage && (
                        <Pagination
                            activePage={activePage}
                            itemsCountPerPage={itemsPerPage}
                            totalItemsCount={userInput || filteredMembers.length > 0 ? filteredMembers.length : data.length}
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


                    <AntdDropdown menu={{ items: menuItems }} open={dropdownVisible} onOpenChange={setDropdownVisible} placement="bottomLeft" trigger={['click']}>
                        <Button className='mb-5'>Export</Button>
                    </AntdDropdown>

                </nav>
                <div className={`fixed bottom-0  right-0 mb-12 mr-12 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${successAlertVisable ? 'block' : 'hidden'}`}>
                    {successAlertMessage}
                </div>
                <div
                    className={`fixed bottom-0 right-0 mb-12 mr-12 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${errorAlertVisable ? 'block' : 'hidden'}`}
                    dangerouslySetInnerHTML={{ __html: errorAlertMessage }}
                />

                {/* view modal */}
                <Modal
                    isOpen={viewModal}
                    onRequestClose={() => { SetViewModal(false) }}
                    contentLabel="Update Modal"
                    className=" flex justify-center mt-48"
                    shouldCloseOnOverlayClick={false}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(196,196,196,0.5)',

                        }
                    }}
                >
                    <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
                        <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {selectedData.firstName + " " + selectedData.lastName}
                                </h3>
                                <button type="button"
                                    onClick={() => {
                                        SetViewModal(false)
                                        setErrorMessage('');
                                    }}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                    <FaWindowClose />
                                </button>
                            </div>
                            <form action="#">
                                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name : {selectedData.firstName}</label>
                                        <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last name : {selectedData.lastName}</label>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Student number : {selectedData.student_number}</label>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Card number : {selectedData.card_number}</label>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email adress : {selectedData.email}</label>
                                    </div>
                                    <div>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone number : {selectedData.phone_number}</label>
                                        <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date of birth : {selectedData.birthday}</label>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">nationality : {selectedData.nationality}</label>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Date of joining the team : {selectedData.date_of_joining}</label>
                                    </div>
                                </div>
                                <div className='flex'>
                                    <button onClick={() => SetViewModal(false)} type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                        Close
                                    </button>
                                </div>
                                {errorMessage && <p className="error-message italic font-semibold">{errorMessage}</p>}

                            </form>
                        </div>

                    </div>
                </Modal>
                {/* Create modal */}
                <Modal
                    isOpen={createModal}
                    onRequestClose={() => { SetCreateModal(false) }}
                    contentLabel="Update Modal"
                    className=" flex justify-center mt-48"
                    shouldCloseOnOverlayClick={false}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(196,196,196,0.5)',

                        }
                    }}
                >
                    <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
                        <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Create new member
                                </h3>
                                <button type="button"
                                    onClick={() => {
                                        SetCreateModal(false)
                                        setErrorMessage('');
                                    }}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                    <FaWindowClose />
                                </button>
                            </div>
                            <form action="#">
                                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name:</label>
                                        <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            onChange={handleInputChangeCreate}
                                            value={createdUserData.firstName}
                                            required />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name:</label>
                                        <input type="text" name="lastName" id="lastName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            onChange={handleInputChangeCreate}
                                            value={createdUserData.lastName}
                                            required />
                                    </div>
                                    <div>
                                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username:</label>
                                        <input type="text" name="username" id="username" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            onChange={handleInputChangeCreate}
                                            value={createdUserData.username}
                                            required />
                                    </div>


                                    <div>
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email:</label>
                                        <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            onChange={handleInputChangeCreate}
                                            value={createdUserData.email}
                                            required />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password:</label>
                                        <input type="text" name="password" id="password" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            onChange={handleInputChangeCreate}
                                            value={createdUserData.password}
                                            required />
                                    </div>
                                    <div>

                                        <label htmlFor="roles" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role:</label>
                                        <select
                                            name='role'
                                            value={createdUserData.role}
                                            onChange={handleInputChangeCreate}

                                            id="roles" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>



                                        </select>

                                    </div>
                                </div>
                                <div className='flex'>

                                    <button type="button"
                                        onClick={createMember}
                                        className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">

                                        Create
                                    </button>
                                    <button onClick={() => SetCreateModal(false)} type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                        Cancel
                                    </button>
                                </div>
                                {errorMessage && <p className="error-message italic font-semibold">{errorMessage}</p>}
                            </form>
                        </div>

                    </div>

                </Modal>
                {/* Modify modal */}
                <Modal
                    isOpen={updateModal}
                    onRequestClose={() => SetUpdateModal(false)}
                    contentLabel="Update Modal"
                    className=" flex justify-center mt-48"
                    shouldCloseOnOverlayClick={false}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(196,196,196,0.5)',

                        }
                    }}
                >
                    <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
                        <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Modify member
                                </h3>
                                <button type="button"
                                    onClick={() => {
                                        SetUpdateModal(false)
                                        setErrorMessage('');
                                    }}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                    <FaWindowClose />
                                </button>
                            </div>

                            <form action="#">
                                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name:</label>
                                        <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            value={selectedData.firstName} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last Name:</label>
                                        <input type="text" name="lastName" id="lastName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            value={selectedData.lastName} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username:</label>
                                        <input disabled type="text" name="username" id="username" className="mb-6 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            value={selectedData.username} required />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email: </label>
                                        <input type="text" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                            value={selectedData.email} onChange={handleInputChange} required />
                                    </div>

                                    <div>

                                        <label htmlFor="roles" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role:</label>
                                        <select
                                            name='role'
                                            value={selectedData.role}
                                            onChange={handleInputChange}

                                            id="roles" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="former_member">Former member</option>
                                            2-11-1973
                                        </select>

                                    </div>



                                </div>
                                <div className='flex'>
                                    <button onClick={handleUpdate} type="button" className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                                        <FaEdit className='h-5 w-4 mr-2' />
                                        Update
                                    </button>
                                    <button onClick={disableAccount}
                                        type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                        <FaBan className='h-5 w-4 mr-2' />
                                        Disable account
                                    </button>
                                </div>
                                {errorMessage && <p className="error-message italic font-semibold">{errorMessage}</p>}

                            </form>
                        </div>
                    </div>
                </Modal>

                {/* change password modal */}
                <Modal
                    isOpen={passwordModal}
                    onRequestClose={() => setPasswordModal(false)}
                    contentLabel="Update Modal"
                    className="flex justify-center mt-48"
                    shouldCloseOnOverlayClick={false}
                    style={{
                        overlay: {
                            backgroundColor: 'rgba(196,196,196,0.5)',
                        }
                    }}
                >
                    <div className="relative p-4 w-full max-w-2xl h-full md:h-auto">
                        <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Change password
                                </h3>
                                <button type="button"
                                    onClick={() => {
                                        setPasswordModal(false)
                                        setErrorMessage('');
                                    }}
                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                    <FaWindowClose />
                                </button>
                            </div>
                            <div className='flex justify-end'>
                                <div className='self-end'>
                                    <Popover content={passwordPolicy} title="Password Policy" >
                                        <FaRegQuestionCircle className='mb-5 text-blue-800' />
                                    </Popover>
                                </div>
                            </div>

                            <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="newPass" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New password:</label>
                                    <input type="text" name="newPass" id="newPass" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                        onChange={(e) => setNewPassword(e.target.value)} required />
                                </div>
                                <div>
                                    <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm new password:</label>
                                    <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                        onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                                </div>



                            </div>
                            <div className='flex'>
                                <button onClick={handlePasswordChange} type="button" className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">

                                    Update password
                                </button>
                            </div>
                            {errorMessage && <p className="error-message italic font-semibold">{errorMessage}</p>}


                        </div>
                    </div>
                </Modal>
            </div>
        </div>

    )
}

export default UsersTable