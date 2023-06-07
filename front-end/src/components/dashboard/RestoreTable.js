import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dropdown } from 'flowbite-react';
import Modal from 'react-modal';
import Pagination from 'react-js-pagination';

import { useKeycloak } from '../../KeycloakContext'
import { FaRedoAlt, FaWindowClose, FaEye, FaTrashRestore, FaTrashAlt, FaArrowLeft, FaArrowRight, FaAngleDoubleRight, FaAngleDoubleLeft } from 'react-icons/fa'

const RestoreTable = () => {


    const [data, setData] = useState([]);
    const { keycloak } = useKeycloak();
    const [selectedData, setSelectedData] = useState({ firstName: '', lastName: '', username: '', email: '', role: '', phone_number: '', student_number: '', card_number: '', date_of_joining: '', birthday: '', nationality: '' });
    const [errorMessage, setErrorMessage] = useState('');
    // View modal state
    const [viewModal, SetViewModal] = useState(false);



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


    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/disabled`, {
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
            <tr key={item.id} className="border-b dark:border-gray-700">
                <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.first_name + " " + item.last_name}</th>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.student_number}</td>
                <td className="px-4 py-3">{item.card_number}</td>
                <td className="px-4 py-3 flex items-center justify-end">
                    <Dropdown label="actions" className="inline-flex items-center p-0.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100" type="button">
                        <Dropdown.Item className='flex justify-between' onClick={() => viewMember(item.id)}>
                            View <FaEye className='w-4 h-4 ml-5 text-blue-400' />
                        </Dropdown.Item>
                        <Dropdown.Item className='flex justify-between' onClick={() => enebleAccount(item.id)}>
                            Re-activate <FaTrashRestore className='w-4 h-4 ml-5 text-blue-400' />
                        </Dropdown.Item>
                        <Dropdown.Item className='flex justify-between' onClick={() => handleDelete(item.id)}>
                            Delete <FaTrashAlt className='w-4 h-4 ml-5 text-blue-400' />
                        </Dropdown.Item>
                    </Dropdown>
                </td>
            </tr>
        )

    }
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

    const enebleAccount = async (id) => {
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/enebleAccount/` + id, {}, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'Content-Type': 'application/json',
                    'x-user-id': keycloak.subject,
                },
            });
            const responseData = await response.data;
            setSuccessAlertMessage(responseData);
            showSuccessAlert()
            fetchData();
        } catch (err) {
            setErrorAlertMessage(err.response?.data || 'An error occurred');
            showErrorAlert();
        }
    };


    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this account permanently?")) {
            try {
                const response = await axios.delete(`${process.env.REACT_APP_API_URL}/deleteUser/` + id, {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                        'Content-Type': 'application/json',
                        'x-user-id': keycloak.subject,
                    },
                });
                const responseData = await response.data;
                setSuccessAlertMessage(responseData);
                showSuccessAlert()
                fetchData();
            } catch (err) {
                setErrorAlertMessage(err.response?.data || 'An error occurred');
                showErrorAlert()
            }
        }
    };


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
        const inputValues = e.target.value.toLowerCase().split(' ');

        const filtered = data.filter((member) => {
            const firstName = member.first_name.toLowerCase();
            const lastName = member.last_name.toLowerCase();
            const email = member.email.toLowerCase();

            return inputValues.every(input => (
                firstName.includes(input) ||
                lastName.includes(input) ||
                email.includes(input)
            ));
        });

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

                </div>

                {/* Table content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3">Full name</th>
                                <th scope="col" className="px-4 py-3">Email</th>
                                <th scope="col" className="px-4 py-3">Student number</th>
                                <th scope="col" className="px-4 py-3">Card number</th>
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
                                            <p className='m-10 font-semibold text-gray-600'>No results.</p>
                                        </td>
                                    </tr>
                                )
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
                            </form>
                        </div>
                    </div>

                </Modal>

            </div>
        </div>
    )
}

export default RestoreTable