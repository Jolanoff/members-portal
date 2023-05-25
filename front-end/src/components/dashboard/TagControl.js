import React from 'react'
import { FaHashtag } from "react-icons/fa";

const TagControl = () => {
    const tags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag2', 'Tag3', 'Tag4', 'Tag5', 'Tag2', 'Tag3', 'Tag4', 'Tag5']

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tag Control</h3>
                <button class="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800">
                    <span class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
                        Create new tag
                    </span>
                </button>
            </div>
            <div className="relative mb-4">
                <FaHashtag className='h-5 w-5 absolute top-3 left-3 text-gray-500' />
                <input className="pl-10 pr-4 py-2 border rounded-lg" type="text" placeholder="Search tags" />
            </div>
            <div className="overflow-auto max-h-60">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {tags.map((tag, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg shadow-md m-1 border">
                            <p className='font-medium'>{tag}</p>
                            <div>
                                <button className="mr-2 font-medium text-blue-500">Edit</button>
                                <button className="text-red-500 font-medium">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TagControl