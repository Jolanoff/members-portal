import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { useKeycloak } from '../../KeycloakContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Search = () => {
    const { keycloak } = useKeycloak();

    const [value, setValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const fetchUserSuggestions = async (value) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/users/search`,
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    },
                    params: {
                        search: value,
                    },
                }
            );
            setSuggestions(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    const onSuggestionsFetchRequested = ({ value }) => {
        fetchUserSuggestions(value);
    };

    const onSuggestionsClearRequested = () => {
        setSuggestions([]);
    };
    const navigate = useNavigate();

    const onSuggestionSelected = (event, { suggestion }) => {
        navigate(`/members/${suggestion.id}`);
    };

    const getSuggestionValue = (suggestion) => {
        return `${suggestion.first_name} ${suggestion.last_name}`;
    };

    const renderSuggestion = (suggestion) => (
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
      );

    const onChange = (event, { newValue }) => {
        setValue(newValue);
    };

    const inputProps = {
        id: 'simple-search',
        type: 'text',
        className:
            'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
        placeholder: 'Search for member',
        value,
        onChange,
    };

    return (


        <form className="flex items-center">
            <label htmlFor="simple-search" className="sr-only">Search</label>
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
                </div>
                <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSuggestionsClearRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    onSuggestionSelected={onSuggestionSelected}
                    inputProps={inputProps}
                    theme={{
                        container: 'relative block w-full',
                        suggestionsContainer: 'absolute w-full mt-1 bg-white rounded-md shadow-lg z-10',
                        suggestionsContainerOpen: 'block overflow-y-auto max-h-48',
                        suggestionsList: 'm-0 p-0 list-none',
                        suggestion: 'cursor-pointer',
                        suggestionHighlighted: 'bg-gray-200',
                    }}

                />
            </div>
            <button disabled type="submit" className="p-2.5 ml-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span className="sr-only">Search</span>
            </button>
        </form>


    )
}

export default Search