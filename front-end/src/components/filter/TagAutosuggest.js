import React, { useState, useEffect } from 'react';
import Autosuggest from 'react-autosuggest';
import axios from 'axios';

const escapeRegexCharacters = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const TagAutosuggest = ({ keycloak, onTagsSelected, currentTags }) => {
    currentTags = currentTags || [];
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);

    const fetchTags = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tags/suggest`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                },
            });
            setTags(response.data);
        } catch (err) {
            console.log(err);
        }
    };
    const addTag = (tag) => {
        const MAX_TAGS = 8;
      
        if(currentTags.length >= MAX_TAGS) {
          alert('You cannot add more than ' + MAX_TAGS + ' tags'); 
          return;
        }
      
        if (!currentTags.some((t) => t.tag_name === tag.tag_name)) {
          onTagsSelected([...currentTags, tag]);
        }
      
        setTagInput('');
      };
      
    const removeTag = (event, tagName) => {
        event.preventDefault();
        const updatedTags = currentTags.filter((tag) => tag.tag_name !== tagName);
        onTagsSelected(updatedTags);
      };

    useEffect(() => {
        fetchTags();
    }, []);

    const onTagInputChange = (event, { newValue }) => {
        setTagInput(newValue);
    };

    const getTagSuggestions = (value) => {
        const escapedValue = escapeRegexCharacters(value.trim());
        if (escapedValue === '') {
            return [];
        }

        const regex = new RegExp('\\b' + escapedValue, 'i');

        return tags.filter(tag => regex.test(tag.tag_name));
    };

    const onTagSuggestionsFetchRequested = ({ value }) => {
        setTagSuggestions(getTagSuggestions(value));
    };

    const onTagSuggestionsClearRequested = () => {
        setTagSuggestions([]);
    };

    const handleKeyPress = async (event) => {
        if (event.key === "Enter" && tagInput.trim() !== "") {
            event.preventDefault();
            const inputTag = tagInput.trim().toLowerCase();

            const existingTag = tags.find(
                (tag) => tag.tag_name.toLowerCase() === inputTag
            );

            const existingSelectedTag = currentTags.find(
                (tag) => tag.tag_name.toLowerCase() === inputTag
            );

            if (existingSelectedTag) {
                setTagInput("");
            } else if (existingTag) {
                addTag(existingTag);
            } else {
                const newTag = { id: Date.now(), tag_name: tagInput.trim() };
                addTag(newTag);
            }
        }
    };

    const onSuggestionSelected = (event, { suggestion }) => {
        event.preventDefault();
        addTag(suggestion);
        setTagInput("");
    };

    return (
        <>
            <ul className="mb-2">
                {currentTags.map((tag) => (
                    <li key={tag.id} className="inline-block bg-blue-200 rounded-md px-3 py-1 mr-2 mb-2">
                        {tag.tag_name}
                        <button
                            onClick={(event) => removeTag(event, tag.tag_name)}
                            className="ml-2 text-xs text-red-500 hover:text-red-700"
                        >
                            &times;
                        </button>
                    </li>
                ))}
            </ul>
            <Autosuggest
                suggestions={tagSuggestions}
                onSuggestionsFetchRequested={onTagSuggestionsFetchRequested}
                onSuggestionsClearRequested={onTagSuggestionsClearRequested}
                onSuggestionSelected={onSuggestionSelected}
                getSuggestionValue={(suggestion) => {
                    setTimeout(() => setTagInput(''), 0);
                    return `${suggestion.tag_name}`;
                }}
                renderSuggestion={(suggestion) => (
                    <div className="py-2 px-4">{`${suggestion.tag_name}`}</div>
                )}

                inputProps={{
                    className:
                        'w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400',
                    placeholder: 'Type tag name',
                    value: tagInput,
                    onChange: onTagInputChange,
                    onKeyPress: handleKeyPress,
                    maxLength: 20,
                }}
                theme={{
                    container: 'relative block w-full',
                    suggestionsContainer:
                        'absolute w-full mt-1 bg-white  rounded-md shadow-lg z-10',
                    suggestionsContainerOpen: 'block',
                    suggestionsList: 'm-0 p-0 list-none',
                    suggestion: 'cursor-pointer',
                    suggestionHighlighted: 'bg-gray-200',
                }}
            />

        </>
    );
};

export default TagAutosuggest;
