import React, { useState, useEffect } from 'react'
import { FaHashtag, FaWindowClose } from "react-icons/fa";

import { useKeycloak } from '../../KeycloakContext'
import axios from 'axios';
import Modal from 'react-modal';


const TagControl = () => {
    const { keycloak } = useKeycloak();
    const [tags, setTags] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    //modals
    const [createTagModal, setCreateTagModal] = useState(false)
    const [editTagModal, setEditTagModal] = useState(false)
    const [deleteTagModal, setDeleteTagModal] = useState(false)



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



    const fetchTags = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/tags`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                }
            });
            setTags(response.data);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const tagViewItem = (item) => {
        return (
            <div key={item.tag_id} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-md m-1 border">
                <p className='font-medium'>{item.tag_name}</p>
                <div>
                    <button
                        className="mr-2 font-medium text-blue-500"
                        onClick={() => {
                            setEditTagModal(true);
                            setEditingTag(item);
                            setEditingTagName(item.tag_name);
                        }}
                    >
                        Edit
                    </button>
                    <button
                        className="text-red-500 font-medium"
                        onClick={() => {
                            setDeleteTagModal(true);
                            setEditingTag(item);
                        }}
                    >
                        Delete
                    </button>

                </div>
            </div>
        )
    }
    const filteredTags = tags.filter(tag =>
        tag.tag_name.toLowerCase().includes(searchTerm.toLowerCase())
    )


    // create a new tag function
    const [tagName, setTagName] = useState('');
    const createTag = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/tags`, { tagName }, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                }
            });
            setSuccessAlertMessage("Tag created successfully")
            showSuccessAlert();
            setCreateTagModal(false)
            setTagName(''); // Reset the input field
            fetchTags(); // Fetch the updated list of tags
        } catch (err) {
            setErrorAlertMessage(err.response?.data?.error);
            showErrorAlert()
        }
    };
    const [editingTag, setEditingTag] = useState(null);
    const [editingTagName, setEditingTagName] = useState("");

    const editTag = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/tags/${editingTag.tag_id}`,
                { tagName: editingTagName },
                {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    }
                }
            );
            setSuccessAlertMessage("Tag Updated successfully")
            showSuccessAlert();
            setEditTagModal(false)
            setEditingTag(null); // Reset the editing state
            fetchTags(); // Fetch the updated list of tags
        } catch (err) {
            setErrorAlertMessage(err.response?.data?.error);
            showErrorAlert()
        }
    };
    const deleteTag = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/tags/${editingTag.tag_id}`, {
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                }
            });
            setSuccessAlertMessage("Tag Deleted successfully")
            showSuccessAlert();
            setDeleteTagModal(false)
            setEditingTag(null); // Reset the editing state
            fetchTags(); // Fetch the updated list of tags
        } catch (err) {
            setErrorAlertMessage(err.response?.data?.error);
            showErrorAlert()
        }
    };

    return (
        <>
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Tag Control</h3>
                    <button onClick={() => setCreateTagModal(true)} className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800">
                        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                            Create new tag
                        </span>
                    </button>
                </div>
                <div className="relative mb-4">
                    <FaHashtag className='h-5 w-5 absolute top-3 left-3 text-gray-500' />
                    <input
                        className="pl-10 pr-4 py-2 border rounded-lg"
                        type="text"
                        placeholder="Search tags"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-auto h-60 max-h-60">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {filteredTags.map(x => tagViewItem(x))}
                    </div>
                </div>
                <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${successAlertVisable ? 'block' : 'hidden'}`}>
                    {successAlertMessage}
                </div>
                <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${errorAlertVisable ? 'block' : 'hidden'}`}>
                    {errorAlertMessage}
                </div>
            </div>

            {/* create new tag modal */}
            <Modal
                isOpen={createTagModal}
                onRequestClose={() => { setCreateTagModal(false) }}
                contentLabel="Create a new tag"
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
                                Create new tag
                            </h3>
                            <button type="button"
                                onClick={() => setCreateTagModal(false)}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                <FaWindowClose />
                            </button>
                        </div>

                        <div className="grid gap-4 mb-4 sm:grid-cols-1">
                            <label htmlFor="newTag" className='place-self-center font-bold font-mono'>Tag name</label>
                            <input
                                id='newTag'
                                className="pl-10 pr-4 py-2 border rounded-lg"
                                type="text"
                                placeholder="New tag"
                                value={tagName}
                                onChange={e => setTagName(e.target.value)}
                            />

                        </div>
                        <div className='flex'>
                            <button onClick={createTag} type="button" className="flex focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900">
                                Create
                            </button>
                            <button onClick={() => setCreateTagModal(false)} type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                Close
                            </button>

                        </div>
                    </div>
                </div>
            </Modal>
            {/* edit tag modal */}
            <Modal
                isOpen={editTagModal}
                onRequestClose={() => { setEditTagModal(false) }}
                contentLabel="Create a new tag"
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
                                Edit tag
                            </h3>
                            <button type="button"
                                onClick={() => setEditTagModal(false)}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                <FaWindowClose />
                            </button>
                        </div>

                        <div className="grid gap-4 mb-4 sm:grid-cols-1">
                            <label htmlFor="newTag" className='place-self-center font-bold font-mono'>
                                Tag name
                            </label>
                            <input
                                id='newTag'
                                className="pl-10 pr-4 py-2 border rounded-lg"
                                type="text"
                                placeholder="New tag"
                                value={editingTagName}
                                onChange={e => setEditingTagName(e.target.value)}
                            />
                        </div>
                        <div className='flex'>
                            <button onClick={editTag} type="button" className="flex focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900">
                                Edit
                            </button>
                            <button onClick={() => setEditTagModal(false)} type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                Close
                            </button>

                        </div>
                    </div>
                </div>
            </Modal>
            {/* delete tag modal */}
            <Modal
                isOpen={deleteTagModal}
                onRequestClose={() => { setDeleteTagModal(false) }}
                contentLabel="Delete tag"
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
                                Delete tag
                            </h3>
                            <button type="button"
                                onClick={() => setDeleteTagModal(false)}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                                <FaWindowClose />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p>Are you sure you want to delete the tag "{editingTag?.tag_name}"?</p>
                        </div>

                        <div className='flex'>
                            <button onClick={deleteTag} type="button" className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                                Delete
                            </button>
                            <button onClick={() => setDeleteTagModal(false)} type="button" className="flex focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </>

    )
}

export default TagControl