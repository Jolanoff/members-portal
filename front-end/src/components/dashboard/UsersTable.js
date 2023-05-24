import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dropdown } from 'flowbite-react';
import { FaBan, FaEdit, FaWindowClose, FaRedoAlt, FaArrowLeft, FaArrowRight, FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa'
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
import { useKeycloak } from '../../KeycloakContext'
import Pagination from 'react-js-pagination';

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
                <Link to={`/members/${item.id}`}>
                    <th scope="row" className="hover:text-blue-600 px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.first_name + " " + item.last_name}</th>
                </Link>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.student_number}</td>
                <td className="px-4 py-3">{item.card_number}</td>
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
        if(!newPassword || !confirmNewPassword){
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
            setErrorAlertMessage(err.response?.data || 'An error occurred');
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
            setErrorAlertMessage(err.response?.data || 'An error occurred');
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
                setSuccessAlertMessage(responseData);
                showSuccessAlert();
            }
            const responseData = await response.data;
            fetchData();
            SetCreateModal(false)

        } catch (err) {
            setErrorAlertMessage(err.response?.data || 'An error occurred');
            showErrorAlert()
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

    // Filtering and search logic
    const onSearchChange = (e) => {
        const inputValue = e.target.value.toLowerCase();
        const filtered = data.filter((member) =>
            member.first_name.toLowerCase().includes(inputValue) ||
            member.last_name.toLowerCase().includes(inputValue) ||
            member.email.toLowerCase().includes(inputValue)

        );
        setFilteredMembers(filtered);
    };

    const handlePageChange = (pageNumber) => {
        setActivePage(pageNumber);
    };

    const indexLast = activePage * itemsPerPage;
    const indexFirst = indexLast - itemsPerPage;
    const currentData = userInput ? filteredMembers.slice(indexFirst, indexLast) : data.slice(indexFirst, indexLast);

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
                                <th scope="col" className="px-4 py-3">Student/Employee number</th>
                                <th scope="col" className="px-4 py-3">Card number</th>
                                <th scope="col" className="px-4 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Members content */}
                            {filteredMembers.length === 0
                                ? <p className='m-10 font-semibold text-gray-600'>No search results.</p>
                                : currentData.map(MemberViewItem)
                            }
                        </tbody>
                    </table>
                </div>
                {/* table footer */}
                <nav className="flex flex-col md:flex-row justify-center items-center md:items-center space-y-3 md:space-y-0 p-4">
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
                </nav>
                <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${successAlertVisable ? 'block' : 'hidden'}`}>
                    {successAlertMessage}
                </div>
                <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${errorAlertVisable ? 'block' : 'hidden'}`}>
                    {errorAlertMessage}
                </div>
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

                            <form action="#">
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

                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>

    )
}

export default UsersTable