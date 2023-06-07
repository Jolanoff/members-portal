import React, { useEffect, useState } from 'react';
import { useKeycloak } from '../KeycloakContext';
import axios from 'axios'
import { useParams, Link } from 'react-router-dom';
import { ThreeDots } from 'react-loader-spinner';
const ProjectSection = () => {
    // loading 
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000); // Show the spinner for 1 second

        return () => clearTimeout(timer); // Clean up the timer when the component unmounts
    }, []);
    const projectId = useParams().id;
    const { keycloak } = useKeycloak();
    const [project, setProject] = useState([]);
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/` + projectId, {
                    headers: {
                        Authorization: `Bearer ${keycloak.token}`,
                    }
                });
                setProject(response.data[0]);

            } catch (error) {
                console.error(error);
            }
        };
        fetchProjects();
    }, [keycloak]);

    return (

        <div className="flex items-center justify-center p-10">
            {isLoading ? (
                <div className="flex justify-center items-center min-h-screen">
                    <ThreeDots
                        height="100"
                        width="100"
                        radius="12"
                        color="#1850ab"
                    />
                </div>
            ) : (
                <div className="w-3/4 h-3/4 bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 bg-blue-500 text-white text-lg uppercase">
                        {project.title}
                    </div>

                    <div className="p-4 overflow-auto h-full">
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>Department:</strong> {project.department}
                        </p>
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>Subsystem:</strong> {project.subsystem}
                        </p>
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>Start Date:</strong> {new Date(project.from_date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>End Date:</strong> {new Date(project.till_date).toLocaleDateString()}
                        </p>
                        <div className="text-gray-600 text-sm mb-2">
                            <strong>Team Members: </strong>
                            {project.team_members && project.team_members.map((member, index) => (
                                <React.Fragment key={index}>
                                    <Link to={`/members/${member.user_id}`} className="hover:text-blue-600">
                                        {member.name}
                                    </Link>
                                    {index < project.team_members.length - 1 && ', '}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="gap-2 mb-2">
                            <strong className="text-gray-600 text-sm">Tags:</strong>
                            {project.tags && project.tags.map((tag, index) => (
                                <span key={index} className=" mt-5 ml-2 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-200 text-red-700 rounded-full">
                                    {tag.tag_name}
                                </span>
                            ))}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>Created By:</strong> {project.created_by_name}
                        </p>
                        <p className="text-gray-600 text-sm mb-2">
                            <strong>Last Updated By:</strong> {project.last_updated_by_name}
                        </p>
                        <p className="mt-4 text-gray-600 break-words">{project.description}</p>
                    </div>

                    <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                        <Link to={`/projects`}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Go Back
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );


}

export default ProjectSection