// UserAutosuggest.js
import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import axios from 'axios';

const escapeRegexCharacters = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const UserAutosuggest = ({ keycloak, onUsersSelected, defaultSelectedUsers, currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [userSuggestions, setUserSuggestions] = useState([]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/suggest`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            });
            setUsers(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    const [selectedUsers, setSelectedUsers] = useState(
        Array.isArray(defaultSelectedUsers) ? defaultSelectedUsers : []
    );


    const addUser = (user) => {
        if (!selectedUsers.some((u) => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
            onUsersSelected([...selectedUsers, user]);
        }
        setUserInput('')
    };
    const removeUser = (event, userId) => {
        event.preventDefault();

        // Prevent the current user from being removed
        if (userId == currentUserId) {
            return;
        }

        const updatedUsers = selectedUsers.filter((user) => user.id !== userId);
        setSelectedUsers(updatedUsers);
        onUsersSelected(updatedUsers);
    };


    useEffect(() => {
        fetchUsers();
    }, []);

    const onUserInputChange = (event, { newValue }) => {
        setUserInput(newValue);
    };

    const getUserSuggestions = (value) => {
        const escapedValue = escapeRegexCharacters(value.trim());
        if (escapedValue === '') {
            return [];
        }

        const regex = new RegExp('\\b' + escapedValue, 'i');

        return users.filter(user => regex.test(`${user.first_name} ${user.last_name}`));
    };

    const onUserSuggestionsFetchRequested = ({ value }) => {
        setUserSuggestions(getUserSuggestions(value));
    };

    const onUserSuggestionsClearRequested = () => {
        setUserSuggestions([]);
    };

    return (
        <>
            <ul className="mb-2">
                {selectedUsers.map((user) => (
                    <li key={user.id} className="inline-block bg-blue-200 rounded-md px-3 py-1 mr-2 mb-2">
                        {user.first_name} {user.last_name}
                        <button
                            onClick={(event) => removeUser(event, user.id)}
                            className={`ml-2 text-xs ${currentUserId == user.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                        >
                            &times;
                        </button>
                    </li>
                ))}
            </ul>
            <Autosuggest
                suggestions={userSuggestions}
                onSuggestionsFetchRequested={onUserSuggestionsFetchRequested}
                onSuggestionsClearRequested={onUserSuggestionsClearRequested}
                getSuggestionValue={(suggestion) => {
                    addUser(suggestion);
                    setTimeout(() => setUserInput(''), 0);
                    return `${suggestion.first_name} ${suggestion.last_name}`;
                }}
                renderSuggestion={(suggestion) =>
                    <div className="py-2 px-4 flex items-center">
                        {suggestion.profile_pic ? (
                            <img
                                src={suggestion.profile_pic}
                                alt={`${suggestion.first_name} ${suggestion.last_name}`}
                                className="w-8 h-8 rounded-full mr-2"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-400 text-white text-xl mr-2">
                                {suggestion.first_name ? suggestion.first_name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div>{`${suggestion.first_name} ${suggestion.last_name}`}</div>
                    </div>
                }
                inputProps={{
                    className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                    placeholder: 'Type user name',
                    value: userInput,
                    onChange: onUserInputChange,
                }}
                theme={{
                    container: 'relative block w-full',
                    suggestionsContainer: 'absolute w-full mt-1 bg-white  rounded-md shadow-lg z-10',
                    suggestionsContainerOpen: 'block',
                    suggestionsList: 'm-0 p-0 list-none',
                    suggestion: 'cursor-pointer',
                    suggestionHighlighted: 'bg-gray-200',
                }}
            />
        </>
    );
};

export default UserAutosuggest;
