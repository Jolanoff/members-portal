import React, { useState, useEffect } from 'react';
import { useKeycloak } from '../KeycloakContext';
import axios from 'axios';

const Settings = () => {

    const { userProfile: initialUserProfile, keycloak } = useKeycloak();
    const [userProfile, setUserProfile] = useState(initialUserProfile);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const [firstName, setFirstName] = useState(userProfile.firstName || '');
    const [lastName, setLastName] = useState(userProfile.lastName || '');
    const [email, setEmail] = useState(userProfile.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [hasFormerMemberRole, setHasFormerMemberRole] = useState(false);

    const [errMsg, setErrorMsg] = useState('')
    const [showModal, setShowModal] = useState(false);

    const fetchdata = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getUserId`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'x-user-id': keycloak.subject,
                },
            });
            const userId = response.data.id;
            const userDataResponse = await axios.get(`${process.env.REACT_APP_API_URL}/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            });
            setUserProfile(userDataResponse.data);
            const roles = keycloak.realmAccess.roles;
            setHasFormerMemberRole(roles.includes('former_member'));


        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {

        setUserProfile(initialUserProfile);
        fetchdata()
    }, [initialUserProfile]);

    const updateSettings = async () => {
        try {
            const getid = await axios.get(`${process.env.REACT_APP_API_URL}/getUserId`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'x-user-id': keycloak.subject,
                },
            });
            const userId = getid.data.id;

            // Update password if newPassword and confirmNewPassword are filled
            if (newPassword && confirmNewPassword) {
                if (newPassword !== confirmNewPassword) {
                    setErrorMsg("New password and confirmation do not match");
                    return;
                }
                const passwordResponse = await axios.put(
                    `${process.env.REACT_APP_API_URL}/user/changePassword/${userId}`,
                    {
                        newPassword,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${keycloak.token}`,
                        },
                    }
                );
                console.log(passwordResponse);
                setErrorMsg("Password updated successfully");
            }
            // Update settings
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/updateUserSettings/${userId}`,
                {
                    firstName,
                    lastName,
                    email,
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                }
            );
            console.log(response);
            setErrorMsg("Settings updated successfully");

        } catch (err) {
            setErrorMsg(err.response.data);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateSettings();
    };
    const leaveTeam = async () => {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/getUserId`, {
            headers: {
                Authorization: `Bearer ${keycloak.token}`,
                'x-user-id': keycloak.subject,
            },
        });
        const userId = response.data.id;

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/leaveTeam`,
                {
                    current: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                        'x-user-id': userId,
                    },
                }
            );

            setShowModal(false);
            keycloak.logout({ redirectUri: 'http://localhost:3000/' });

        } catch (err) {
            console.error(err);
        }
    };

    return (

        <section className="bg-gray-100 min-h-screen">
            <div className="max-w-2xl px-4 py-8 mx-auto lg:py-16">
                <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h2>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-lg">
                    <div className="grid gap-4 mb-4 sm:grid-cols-2 sm:gap-6 sm:mb-5">
                        <div className="sm:col-span-2">
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                            <input disabled type="text" name="username" id="username" className="mb-6 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                value={userProfile.username}
                                required="" />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">First name</label>
                            <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)} placeholder="Type your first name" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last name</label>
                            <input type="text" name="lastName" id="lastName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)} placeholder="Type your last name" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email adress:</label>
                            <input type="text" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)} placeholder="Type your last name" required />
                        </div>

                        <div className="sm:col-span-2">

                            <button
                                type="button"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => setShowChangePasswordModal(true)}
                            >
                                Change Password
                            </button>
                            {showChangePasswordModal && (
                                <div className="bg-gray-300 p-8 rounded-md mt-5">

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
                                            New Password
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            id="new-password"
                                            type="password"
                                            placeholder="Enter new password"
                                            onChange={(e) => setNewPassword(e.target.value)}

                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                                            Confirm New Password
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            id="confirm-password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}

                                        />
                                    </div>

                                </div>

                            )}
                        </div>

                    </div>

                    <div className="flex items-center space-x-4 justify-between">
                        <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Save changes</button>
                        {errMsg && <p className="error-message">{errMsg}</p>}
                    </div>

                </form>

                <div className="mt-6">

                    {!hasFormerMemberRole && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-md"
                        >
                            Leave the team
                        </button>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-md drop-shadow-2xl">
                            <p className='mb-5'>Are you sure you want to leave the team?</p>
                            <li>Your roles will be deleted</li>
                            <li>You will have limited access to the website</li>
                            <li>You can only become a member again via an admin</li>
                            <li>You will be forced to logout and login again</li>

                            <div className="mt-4">
                                <button
                                    onClick={leaveTeam}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md mr-4"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-black px-4 py-2 rounded-md"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Settings