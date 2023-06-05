import React, { useState, useEffect } from 'react';

import { Navbar, Dropdown, Avatar } from 'flowbite-react'
import { useKeycloak } from '../KeycloakContext';
import axios from 'axios';
import { useNavigate , useLocation} from 'react-router-dom';
const NavbarPage = () => {
    const { userProfile: initialUserProfile, keycloak, authenticated } = useKeycloak();
    const [userProfile, setUserProfile] = useState(initialUserProfile);
    const isAdmin = authenticated && keycloak.hasRealmRole('admin');
    const navigate = useNavigate();
    const location = useLocation();

    const redirectToProfile = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getUserId`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    'x-user-id': keycloak.subject,
                },
            });
            const userId = response.data.id;

            // Redirect the user to their profile
            navigate(`/members/${userId}`);
            window.location.reload();

        } catch (err) {
            console.log(err);
        }
    };
    useEffect(() => {
        setUserProfile(initialUserProfile);
    }, [initialUserProfile]);
    const navigateToHome = () => {
        navigate('/');
    };
    const navigateToMembers = () => {
        navigate('/members');
    };
    const navigateToProjects = () => {
        navigate('/projects');
    };
    const navigateToDashboard = () => {
        if (isAdmin) {
            navigate('/dashboard');

        }
    }
    const navigateToSettings = () => {
        navigate('/settings');
    };
    


    const handleLogout = () => {
        keycloak.logout({ redirectUri: 'http://localhost:3000/' });
    };
    const [profilePic, setProfilePic] = useState('')
    useEffect(() => {
        const fetchProfilePic = async () => {
          try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getUserId`, {
              headers: {
                Authorization: `Bearer ${keycloak.token}`,
                'x-user-id': keycloak.subject,
              },
            });
            setProfilePic(response.data.profile_pic);
          } catch (err) {
            console.log(err);
          }
        };
      
        fetchProfilePic();
      }, []);
      

    return (
        <Navbar expand="lg" fluid rounded>
            <Navbar.Brand href="https://zebro.space/">
                <img src="https://zebro.space/wp-content/uploads/2019/01/Untitled-1_Rocky-moon_pdf.png" className="mr-3 h-6 sm:h-9" alt="Lunar zebro Logo" />
                <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Lunar Zebro</span>
            </Navbar.Brand>
            <div className="flex md:order-2">
            <Navbar.Brand type="button" 
            href='https://github.com/Jolanoff/members-portal/issues'
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Give feedback</Navbar.Brand>

                <Dropdown
                    arrowIcon={false}
                    inline
                    label={
                        <Avatar
                            alt="User settings"
                            img={profilePic}
                            rounded
                        />
                    }
                >
                    <Dropdown.Header>
                        <span className="block text-sm">{userProfile.username}</span>
                        <span className="block truncate text-sm font-medium">{userProfile.email}</span>
                    </Dropdown.Header>
                    <Dropdown.Item onClick={() => redirectToProfile()}>Profile</Dropdown.Item>
                    {isAdmin && (

                        <Dropdown.Item onClick={navigateToDashboard}>Dashboard</Dropdown.Item>

                    )}

                    <Dropdown.Item onClick={navigateToSettings}>Settings</Dropdown.Item>


                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
                </Dropdown>
                <Navbar.Toggle />
            </div>
            <Navbar.Collapse>
                <label className='cursor-pointer'>
                    <Navbar.Link onClick={navigateToHome} active={location.pathname === '/'}>
                        Home
                    </Navbar.Link>
                </label>
                <label className='cursor-pointer'>
                    <Navbar.Link onClick={navigateToMembers} active={location.pathname === '/members'}>
                        Members
                    </Navbar.Link>
                </label>
                <label className='cursor-pointer'>
                    <Navbar.Link onClick={navigateToProjects} active={location.pathname === '/projects'}>
                        Projects
                    </Navbar.Link>
                </label>
                
                <div></div>

                <div></div>


            </Navbar.Collapse>
        </Navbar>
    )
}

export default NavbarPage