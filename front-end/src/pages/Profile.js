
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useKeycloak } from '../KeycloakContext';
import { Tabs, Dropdown } from 'flowbite-react';



import Modal from 'react-modal';
import Autosuggest from 'react-autosuggest';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


import { ThreeDots } from 'react-loader-spinner';

import UserAutosuggest from '../components/filter/UserAutosuggest';
import ProfileImageCropper from '../components/profile/ProfileImageCropper';
import { FaUserEdit, FaPlus, FaWindowClose, FaEllipsisH } from 'react-icons/fa'
import { MdExpandMore } from 'react-icons/md'

import TagAutosuggest from '../components/filter/TagAutosuggest';
const Profile = () => {
  const { keycloak } = useKeycloak();
  const [data, setData] = useState({});
  const [studies, setStudies] = useState([]);
  const [projects, setProjects] = useState([]);




  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const [studyStartDate, setStudyStartDate] = useState(new Date())
  const [studyEndDate, setStudyEndDate] = useState(new Date())

  const [studiesErrMsg, setstudiesErrMsg] = useState('')
  const [projectErrMsg, setProjectErrMsg] = useState('')


  // Modals for studies
  const [addStudiesModal, SetAddStudiesModal] = useState(false);
  const [editStuiesModal, SetEditStudiesModal] = useState(false);
  const [deleteStudyModal, setdeleteStudyModal] = useState(false);
  // Modals for projects
  const [addProjectModal, SetAddProjectModal] = useState(false);
  const [editProjectModal, SetEditProjectModal] = useState(false);
  const [deleteProjectModal, setdeleteProjectModal] = useState(false);
  const [leaveProjectModal, setLeaveProjectModal] = useState(false);
  // general information modal
  const [editModalOpen, setEditModalOpen] = useState(false);


  const id = useParams().id;
  const [currentStudyId, setCurrentStudyId] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);


  // loading 
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Show the spinner for 1 second

    return () => clearTimeout(timer); // Clean up the timer when the component unmounts
  }, []);
  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);
  // getting all the user data from the backend and checking the role of the user requesting the data
  const [defaultUsers, setDefaultUsers] = useState([]);
  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/` + id, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
          'x-user-id': keycloak.subject,
          'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : (keycloak.hasRealmRole('former_member') ? 'former_member' : 'user'),
        },
      });
      setData(response.data[0]);
      setIsCurrentUser(keycloak.subject === response.data[0].keycloak_user_id);
      setDefaultUsers([response.data[0]])
      setDepartment(response.data[0].department)
      setPhone(response.data[0].phone_number)
      setNationality(response.data[0].nationality)
      setStudentNum(response.data[0].student_number)
      setCardnum(response.data[0].card_number)
      setDateOfJoining(new Date(response.data[0].date_of_joining))
      setBirthday(new Date(response.data[0].birthday))
      fetchStudies();
      fetchProjects();
    }
    catch (err) {
      console.log(err);
    }
  };

  // getting all the studies from the backend
  const fetchStudies = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/${id}/studies`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      setStudies(response.data);
    } catch (err) {

    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/${id}/projects`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      setProjects(response.data)

    } catch (err) {
      console.log(err)
    }

  }
  useEffect(() => {
    if (studies.length > 0) {
      setstudiesErrMsg('');
    } else {
      if (isCurrentUser) {
        setstudiesErrMsg('Please fill in your current/previous studies');
      } else {
        setstudiesErrMsg('This member does not have any studies added.');
      }
    }
  }, [studies, isCurrentUser]);

  useEffect(() => {
    if (projects.length > 0) {
      setProjectErrMsg('');
    } else {
      if (isCurrentUser) {
        setProjectErrMsg('Please fill in your current/previous projects');
      } else {
        setProjectErrMsg('This member does not have any projects added.');
      }
    }
  }, [projects, isCurrentUser]);

  const projectViewItem = (item) => {
    return (

      <div className="border-b border-gray-200 pb-4 flex justify-between" key={item.id}>
        <div className="space-y-2">
          <Link to={`/projects/${item.id}`}>
            <h3 className="text-2xl font-semibold hover:text-blue-600">{item.title}</h3>
          </Link>
          <p className="text-gray-600 font-bold">Department: {item.department}</p>
          <p className="text-gray-600 font-bold">Subsystem: {item.subsystem}</p>


          <p className="text-gray-600">{formatDate(item.from_date)} - {formatDate(item.till_date)}</p>
          {item.team_members.map((member, index) => (
            <React.Fragment key={member.user_id || index}>
              <a
                href={`/members/${member.user_id}`}
                className="text-gray-600 hover:text-blue-600"
              >
                {member.name}
              </a>
              {index < item.team_members.length - 1 && ", "}
            </React.Fragment>
          ))}
          <div>
            {item.tags && item.tags.length > 0 && item.tags[0].tag_name !== null && (
              item.tags.map((tag, index) => (
                <React.Fragment key={tag.id || index}>
                  <div
                    className="mt-5 ml-2 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-200 text-red-700 rounded-full"
                  >
                    {tag.tag_name}
                  </div>
                </React.Fragment>
              ))
            )}
          </div>

        </div>
        <div className='mr-2'>
          {
            //dont forget to fix this dropdown on scroll
            (isCurrentUser || isAdmin()) && (
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex items-center space-x-2 text-gray-400">
                    <FaEllipsisH />
                  </div>

                }
              >
                <Dropdown.Item onClick={() => saveProject(item.id)}>
                  Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={() => {
                  setdeleteProjectModal(true)
                  setCurrentProjectId(item.id)
                }}>
                  Delete
                </Dropdown.Item>
                {item.team_members.length > 1 ? (
                  <Dropdown.Item onClick={() => {
                    setLeaveProjectModal(true)
                    setCurrentProjectId(item.id)
                  }}>
                    Leave
                  </Dropdown.Item>

                ) : null}


              </Dropdown>
            )}
        </div>
      </div>
    )
  }
  const projectData = projects;

  // looping through all the studies assigned to the user
  const StudyViewItem = (item) => {
    return (

      <div className="border-b border-gray-200 pb-4 flex justify-between" key={item.id}>
        <div>
          <h3 className="text-xl font-semibold">{item.school}</h3>
          <p className="text-gray-600">Field of study : {item.field_of_study}</p>
          <p className="text-gray-600">Degree : {item.degree}</p>
          <p className="text-gray-600">{formatDate(item.from_date)} - {formatDate(item.till_date)}</p>
        </div>
        <div className='mr-2'>
          {
            //dont forget to fix this dropdown on scroll
            (isCurrentUser || isAdmin()) && (
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex items-center space-x-2 text-gray-400">
                    <FaEllipsisH />
                  </div>

                }
              >

                <Dropdown.Item onClick={() => saveStudy(item.id)}>
                  Edit
                </Dropdown.Item>
                <Dropdown.Item onClick={() => {
                  setdeleteStudyModal(true)
                  setCurrentStudyId(item.id)
                }}>
                  Delete
                </Dropdown.Item>

              </Dropdown>
            )}
        </div>
      </div>
    )
  }
  const studiesData = studies;

  const saveStudy = async (id) => {
    setCurrentStudyId(id);
    // Find the study with the given id
    const selectedStudy = studies.find((study) => study.id === id);
    if (selectedStudy) {
      // Update the input state variables with the selected study data
      setSchoolInput(selectedStudy.school)
      setDegreeInput(selectedStudy.degree)
      setFieldOfStudyInput(selectedStudy.field_of_study)
      // Parse and set the study start date
      const parsedStartDate = new Date(selectedStudy.from_date);
      setStudyStartDate(parsedStartDate);
      const parsedEndDate = new Date(selectedStudy.till_date);
      setStudyEndDate(parsedEndDate);
    }
    SetEditStudiesModal(true)
  };


  // save the project data to show in the update modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const saveProject = async (id) => {
    setCurrentProjectId(id);
    // Find the Project with the given id
    const selectedProject = projects.find((project) => project.id === id);
    if (selectedProject) {
      console.log(selectedProject)
      setTitle(selectedProject.title)
      setDepartmentInput(selectedProject.department)
      setSubsystemInput(selectedProject.subsystem)
      const parsedStartDate = new Date(selectedProject.from_date);
      setProjectStartDate(parsedStartDate);
      const parsedEndDate = new Date(selectedProject.till_date);
      setProjectEndDate(parsedEndDate);
      setDescription(selectedProject.description)
      setAssignedProjectTags(selectedProject.tags);

      setAssignedUsers(
        selectedProject.team_members.map(member => {
          const nameParts = member.name.split(' ');
          return {
            id: member.user_id,
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ')
          };
        })
      );
    }
    setIsModalOpen(true);
    SetEditProjectModal(true)
  };



  //reset all project fields to empty
  const resetFormFields = () => {
    setTitle('');
    setDepartmentInput('');
    setSubsystemInput('');
    setProjectStartDate(null);
    setProjectEndDate(null);
    setDescription('');
    handleUsersSelected([]);
    handleTagsSelected([]);
  };


  const handleEditStudy = async () => {
    if (!schoolInput || !degreeInput || !fieldOfStudyInput || !studyStartDate || !studyEndDate) {
      setErrorAlertMessage('Please fill all the fields')
      showErrorAlert()
      return
    }
    try {
      const response = await axios.put(`/user/${id}/study/${currentStudyId}`, {
        school: schoolInput,
        degree: degreeInput,
        fieldOfStudy: fieldOfStudyInput,
        studyStartDate: formatDate(studyStartDate),
        studyEndDate: formatDate(studyEndDate),
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`,
          'x-user-id': keycloak.subject,
          'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
        }
      });
      if (response.status === 200) {
        fetchStudies()
        setSuccessAlertMessage('Study updated successfully')
        showSuccessAlert()
        SetEditStudiesModal(false)
        //clear the input
        setSchoolInput('');
        setDegreeInput('');
        setFieldOfStudyInput('');
        setStudyStartDate(new Date());
        setStudyEndDate(new Date());
      }
    } catch (error) {
      console.error('Error updating study:', error);

    }
  };

  const handleDeleteStudy = async (studyId) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/user/${id}/deleteStudy/${studyId}`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          }
        });

      if (response.status === 200) {
        setdeleteStudyModal(false);
        setSuccessAlertMessage('Study deleted successfully')
        showSuccessAlert()
        // Update the 'studies' state to remove the deleted study
        setStudies((prevStudies) => prevStudies.filter((study) => study.id !== studyId));
      }
    } catch (err) {
      console.log(err);
    }
  };


  // Check if the user is an admin
  const isAdmin = () => {
    return keycloak.hasRealmRole('admin');
  };
  // function to format the date 
  function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Fetch degrees, schools, department and subsystem for filtering
  const [degrees, setDegrees] = useState([]);
  const [schools, setSchools] = useState([]);
  const [fieldOfStudy, setFieldOfStudy] = useState([]);


  const fetchDegreesAndSchools = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/degrees_and_schools`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      setDegrees(response.data.degrees);
      setSchools(response.data.schools);
      setFieldOfStudy(response.data.fieldOfStudy);

    } catch (err) {
      console.log(err);
    }
  };
  const [degreeInput, setDegreeInput] = useState('');
  const [schoolInput, setSchoolInput] = useState('');
  const [fieldOfStudyInput, setFieldOfStudyInput] = useState('');

  const [degreeSuggestions, setDegreeSuggestions] = useState([]);
  const [schoolSuggestions, setSchoolSuggestions] = useState([]);
  const [fieldOfStudySuggestions, setFieldOfStudySuggestions] = useState([]);

  const onDegreeInputChange = (event, { newValue }) => {
    setDegreeInput(newValue);
  };
  const onSchoolInputChange = (event, { newValue }) => {
    setSchoolInput(newValue);
  };
  const onFieldOfStudyInputChange = (event, { newValue }) => {
    setFieldOfStudyInput(newValue);
  };

  const getSuggestions = (value, suggestions) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : suggestions.filter(suggestion =>
      suggestion.toLowerCase().slice(0, inputLength) === inputValue
    );
  };
  const onDegreeSuggestionsFetchRequested = ({ value }) => {
    setDegreeSuggestions(getSuggestions(value, degrees));
  };
  const onSchoolSuggestionsFetchRequested = ({ value }) => {
    setSchoolSuggestions(getSuggestions(value, schools));
  };
  const onFieldOfStudySuggestionsFetchRequested = ({ value }) => {
    setFieldOfStudySuggestions(getSuggestions(value, fieldOfStudy));
  };

  const onDegreeSuggestionsClearRequested = () => {
    setDegreeSuggestions([]);
  };

  const onSchoolSuggestionsClearRequested = () => {
    setSchoolSuggestions([]);
  };
  const onFieldOfStudySuggestionsClearRequested = () => {
    setFieldOfStudySuggestions([]);
  };

  const [departments, setDepartments] = useState([]);
  const [subsystems, setSubsystems] = useState([]);

  const [departmentInput, setDepartmentInput] = useState('');
  const [subsystemInput, setSubsystemInput] = useState('');

  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [subsystemSuggestions, setSubsystemSuggestions] = useState([]);
  const fetchProjectsInfo = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects_info`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });
      setDepartments(response.data.departments);
      setSubsystems(response.data.subsystems);
    } catch (err) {
      console.log(err);
    }
  };
  const onDepartmentInputChange = (event, { newValue }) => {
    setDepartmentInput(newValue);
  };
  const onSubsystemInputChange = (event, { newValue }) => {
    setSubsystemInput(newValue);
  };

  const onDepartmentSuggestionsFetchRequested = ({ value }) => {
    setDepartmentSuggestions(getSuggestions(value, departments));
  };
  const onSubsystemSuggestionsFetchRequested = ({ value }) => {
    setSubsystemSuggestions(getSuggestions(value, subsystems));
  };

  const onDepartmentSuggestionsClearRequested = () => {
    setDepartmentSuggestions([]);
  };

  const onSubsystemSuggestionsClearRequested = () => {
    setSubsystemSuggestions([]);
  };


  useEffect(() => {
    fetchData();
    fetchDegreesAndSchools();
    fetchProjectsInfo();
  }, []);



  // create new study 
  const handleAddStudy = async () => {
    if (!schoolInput || !degreeInput || !fieldOfStudyInput || !studyStartDate || !studyEndDate) {
      setErrorAlertMessage('Please fill all the fields')
      showErrorAlert()
      return
    }
    try {

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/${id}/createStudy`,
        {
          school: schoolInput,
          degree: degreeInput,
          fieldOfStudy: fieldOfStudyInput,
          studyStartDate: formatDate(studyStartDate),
          studyEndDate: formatDate(studyEndDate),
        },
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }
      );

      if (response.status === 201) {
        setSuccessAlertMessage('Study created successfully')
        showSuccessAlert()
        fetchStudies()
        SetAddStudiesModal(false);

        //clear the input 
        setSchoolInput('');
        setDegreeInput('');
        setFieldOfStudyInput('');
        setStudyStartDate(new Date());
        setStudyEndDate(new Date());
      }
    } catch (error) {
      console.log(error);
    }
  };


  // Handle selected users in the project modal
  const [assignedUsers, setAssignedUsers] = useState([])
  const [assignedTags, setAssignedTags] = useState([])
  const [title, setTitle] = useState('');
  const [projectStartDate, setProjectStartDate] = useState(new Date());
  const [projectEndDate, setProjectEndDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const handleUsersSelected = (selectedUsers) => {
    // Check if the default user is included in the selectedUsers array
    const hasDefaultUser = selectedUsers.some((user) => user.id === data.id);

    // If the default user is not in the array, add it to the assignedUsers state
    if (!hasDefaultUser) {
      setAssignedUsers([...selectedUsers, data]);
    } else {
      setAssignedUsers(selectedUsers);
    }
  };




  const handleCreateProject = async () => {

    const allAssignedUsers = [...assignedUsers, data];
    if (!title || !departmentInput || !subsystemInput || !projectStartDate || !projectEndDate) {
      setErrorAlertMessage('Please fill all the required fields')
      showErrorAlert()
      return
    }
    try {

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/${id}/createProject`,
        {
          title: title,
          department: departmentInput,
          subsystem: subsystemInput,
          projectStartDate: formatDate(projectStartDate),
          projectEndDate: formatDate(projectEndDate),
          description: description,
          assignedUsers: allAssignedUsers,
          assignedTags: assignedProjectTags,

        },
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }

      );
      if (response.status === 201) {
        setSuccessAlertMessage('Project created successfully')
        showSuccessAlert()
        fetchProjects()
        SetAddProjectModal(false);
        //clear the input 
        resetFormFields()
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditProject = async () => {
    const allAssignedUsers = [...assignedUsers, data];

    if (!title || !departmentInput || !subsystemInput || !projectStartDate || !projectEndDate) {
      setErrorAlertMessage('Please fill all the required fields')
      showErrorAlert()
      return
    }

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/user/${id}/editProject/${currentProjectId}`,
        {
          title: title,
          department: departmentInput,
          subsystem: subsystemInput,
          projectStartDate: formatDate(projectStartDate),
          projectEndDate: formatDate(projectEndDate),
          description: description,
          assignedUsers: allAssignedUsers,
          assignedTags: assignedProjectTags,
        },
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }
      );

      if (response.status === 200) {
        setSuccessAlertMessage('Project updated successfully')
        showSuccessAlert()
        fetchProjects();
        SetEditProjectModal(false);

        // Clear the input fields
        resetFormFields();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/user/${id}/deleteProject/${currentProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }
      );

      if (response.status === 200) {
        setSuccessAlertMessage('Project deleted successfully')
        showSuccessAlert()
        setdeleteProjectModal(false);
        // Update the 'project' state to remove the deleted project
        setProjects((prevProject) => prevProject.filter((projects) => projects.id !== currentProjectId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLeaveProject = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/user/${id}/leaveProject/${currentProjectId}`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }
      );

      if (response.status === 200) {
        setSuccessAlertMessage('You left this project!')
        showSuccessAlert()
        fetchProjects(); // Refresh the list of projects
        setLeaveProjectModal(false); // Close the delete project modal
        setProjects((prevProject) => prevProject.filter((projects) => projects.id !== currentProjectId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadCroppedImage = async (croppedDataURL) => {
    const blob = await (await fetch(croppedDataURL)).blob();

    const formData = new FormData();
    formData.append('profilePicture', blob);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/user/${id}/uploadProfilePicture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'x-user-id': keycloak.subject,
            'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
          },
        }
      );

      if (response.status === 200) {
        fetchData();
      }
    } catch (error) {
      console.log(error);
    }
  };
  //edit profile function
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState('')
  const [studentNum, setStudentNum] = useState('')
  const [cardNum, setCardnum] = useState('')
  const [dateOfJoining, setDateOfJoining] = useState(new Date())
  const [birthday, setBirthday] = useState(new Date())

  const handleEditProfile = async () => {
    if (isAdmin() || isCurrentUser) {
      try {
        const formattedDateOfJoining = formatDate(dateOfJoining);
        const formattedBirthday = formatDate(birthday);
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/user/${id}/profile`,
          {
            department,
            phone,
            nationality,
            studentNum,
            cardNum,
            dateOfJoining: formattedDateOfJoining,
            birthday: formattedBirthday,
            assignedTags: assignedUserTags,
          },
          {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
              'x-user-id': keycloak.subject,
              'x-user-role': keycloak.hasRealmRole('admin') ? 'admin' : 'user',
            },
          }
        );

        if (response.status === 200) {
          fetchData()
          setSuccessAlertMessage('Your profile has been updated!')
          setEditModalOpen(false)
          showSuccessAlert()
          //add unshow profile
        }
      } catch (error) {
        setErrorAlertMessage(error.response.data.message)
        showErrorAlert()
      }
    } else {
      console.log('error');
    }
  };
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

  const [showTagsModal, setShowTagsModal] = useState(false);

  const [assignedUserTags, setAssignedUserTags] = useState([]);
  const [assignedProjectTags, setAssignedProjectTags] = useState([]);
  // User tags
  useEffect(() => {
    let tagsArray = [];
    if (data && data.tags) {
      const tagsString = data.tags;
      tagsArray = tagsString.split(", ").map((tagName, index) => {
        return { id: index, tag_name: tagName };
      });
    }
    setAssignedUserTags(tagsArray);
  }, [data]);

  // Project tags
  useEffect(() => {
    if (isModalOpen) {
      const selectedProject = projects.find((project) => project.id === currentProjectId);
      if (selectedProject) {
        setAssignedProjectTags(selectedProject.tags);
      }
    }
  }, [isModalOpen, projects, currentProjectId]);
  const handleUserTags = (tagsArray) => {
    setAssignedUserTags(tagsArray);
  };

  const handleTagsSelected = (selectedTags) => {
    setAssignedProjectTags(selectedTags);
  };



  return (
    <div>
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
        <div className="grid lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-x-6 py-10 mt-10 mx-auto">
          {/* Profile picture */}


          <div className='flex flex-col items-center place-self-center'>
            <div className="w-36 h-36 rounded-full overflow-hidden">
              {data.profile_pic ? (
                <img
                  className="mx-auto mb-4 w-36 h-36 rounded-full"

                  src={data.profile_pic}
                  alt={data.first_name}
                />
              ) : (
                <div
                  className="mx-auto mb-4 w-36 h-36 rounded-full flex items-center justify-center bg-blue-400 text-white text-6xl"
                >
                  {data.first_name ? data.first_name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            {/* Name and tagline */}
            <h1 className="text-3xl font-bold mt-6">{data.first_name + " " + data.last_name}</h1>
            <p className='text-gray-600 uppercase'>{data.department}</p>

            {/* Contact information */}
            <div className="max-w-2xl mt-10 flex flex-col items-center">
              <div className='flex justify-between mb-5'>

                <h2 className="text-2xl text-gray-600 font-bold mb-4 mr-10">General Information</h2>
                {
                  (isCurrentUser || isAdmin()) && (
                    <button
                      onClick={() => setEditModalOpen(true)}

                      className="mb-3 hover:text-blue-600 duration-300">
                      <FaUserEdit className='w-5 ' />
                    </button>
                  )
                }
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">First Name:</p>
                  <p className="font-semibold">{data.first_name}</p>
                </div>

                <div>
                  <p className="text-gray-600">Last Name:</p>
                  <p className="font-semibold">{data.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email Address:</p>
                  <p className="font-semibold">{data.email}</p>
                </div>
                {!keycloak.hasRealmRole('former_member') || isCurrentUser ? (
                  <>
                    <div>
                      <p className="text-gray-600">Phone Number:</p>
                      <p className="font-semibold">{data.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">date of Joining the team:</p>
                      <p className="font-semibold">{formatDate(data.date_of_joining)}</p>
                    </div>
                  </>
                ) : null}
                {isAdmin() || isCurrentUser ? (
                  <>
                    <div>
                      <p className="text-gray-600">Student/Employee number:</p>
                      <p className="font-semibold">{data.student_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Card number:</p>
                      <p className="font-semibold">{data.card_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Nationality:</p>
                      <p className="font-semibold">{data.nationality}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Birthday:</p>
                      <p className="font-semibold">{formatDate(data.birthday)}</p>
                    </div>
                  </>
                ) : null}

                <div>
                  <p className="text-gray-600">
                    Tags:

                  </p>
                  {data?.tags && data.tags.split(', ').length > 3 &&
                    <button className='hover:text-blue-600 p-2' onClick={() => setShowTagsModal(true)}>
                      <MdExpandMore className=' h-5 w-5' />
                    </button>
                  }
                  <p>
                    {data?.tags && data.tags.split(', ').slice(0, 3).map((tag, index) => (
                      <span className="mr-1 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-200 text-red-700 rounded-full" key={index}>{tag}</span>
                    ))}
                  </p>

                </div>



              </div>
            </div>
          </div>



          <div className="mx-auto lg:w-128 md:w-148 mt-10 bg-white shadow-md rounded-lg p-6 min-h-0">
            <Tabs.Group
              aria-label="Pills"
              style="pills"
              className="w-full"
            >
              <Tabs.Item
                active={true}
                title="Studies"
              >
                <div className='flex justify-end'>
                  {
                    (isCurrentUser || isAdmin()) && (
                      <button
                        onClick={() => SetAddStudiesModal(true)}
                        className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                      >
                        <FaPlus />
                      </button>
                    )
                  }
                </div>
                <div className="mt-4 space-y-4 overflow-y-auto max-h-96">
                  {studiesData.map(x => StudyViewItem(x))}
                  {studiesErrMsg && <p className="error-message text-gray-400 italic font-semibold">{studiesErrMsg}</p>}
                </div>
              </Tabs.Item>

              <Tabs.Item
                active={true}
                title="Projects"
              >
                <div className='flex justify-end'>
                  {
                    (isCurrentUser || isAdmin()) && (
                      <button
                        onClick={() => SetAddProjectModal(true)}
                        className="text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                      >
                        <FaPlus />
                      </button>
                    )
                  }
                </div>
                <div className="mt-4 space-y-4 overflow-y-auto max-h-96">
                  {projectData.map(x => projectViewItem(x))}
                  {projectErrMsg && <p className="error-message text-gray-400 italic font-semibold">{projectErrMsg}</p>}


                </div>

              </Tabs.Item>

            </Tabs.Group>
          </div>
          <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${successAlertVisable ? 'block' : 'hidden'}`}>
            {successAlertMessage}
          </div>
          <div className={`fixed bottom-0 right-0 mb-12 mr-12 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-[100] ${errorAlertVisable ? 'block' : 'hidden'}`}>
            {errorAlertMessage}
          </div>

        </div>


      )}

      <Modal
        isOpen={showTagsModal}
        onRequestClose={() => setShowTagsModal(false)}
        contentLabel="Show tags"
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
                View all tags
              </h3>
              <button type="button"
                onClick={() => {
                  setShowTagsModal(false)

                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>


            <div>
              {data?.tags && data.tags.split(', ').map((tag, index) => (
                <span className="ml-1 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-red-200 text-red-700 rounded-full" key={index}>{tag}</span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTagsModal(false)}
              className=" mt-5 flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">

              Close
            </button>
          </div>

        </div>
      </Modal>


      {/* add new study modal */}
      <Modal
        isOpen={addStudiesModal}
        onRequestClose={() => SetAddStudiesModal(false)}
        contentLabel="Add new Study"
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
                Add new study
              </h3>
              <button type="button"
                onClick={() => {
                  SetAddStudiesModal(false)

                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>

            <form action="#">
              <div className="grid gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="school" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">School: </label>
                  <Autosuggest
                    suggestions={schoolSuggestions}
                    onSuggestionsFetchRequested={onSchoolSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSchoolSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your school name',
                      value: schoolInput,
                      onChange: onSchoolInputChange,
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
                </div>
                <div>
                  <label htmlFor="Degree" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Degree: </label>
                  <Autosuggest
                    suggestions={degreeSuggestions}
                    onSuggestionsFetchRequested={onDegreeSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onDegreeSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your degree',
                      value: degreeInput,
                      onChange: onDegreeInputChange,
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
                </div>
                <div>
                  <label htmlFor="Degree" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Field of study: </label>
                  <Autosuggest
                    suggestions={fieldOfStudySuggestions}
                    onSuggestionsFetchRequested={onFieldOfStudySuggestionsFetchRequested}
                    onSuggestionsClearRequested={onFieldOfStudySuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type what field of study',
                      value: fieldOfStudyInput,
                      onChange: onFieldOfStudyInputChange,
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
                </div>
                <div></div>
                <div>
                  <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start date: </label>
                  <DatePicker
                    id="startDate"
                    selected={studyStartDate}
                    onChange={(date) => setStudyStartDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End date(or expected to be done): </label>
                  <DatePicker
                    id="endDate"
                    selected={studyEndDate}
                    onChange={(date) => setStudyEndDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
              </div>
              <div className='flex'>
                <button
                  type="button"
                  onClick={handleAddStudy}
                  className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => SetAddStudiesModal(false)}
                  className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">

                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
      {/* edit study modal */}
      <Modal
        isOpen={editStuiesModal}
        onRequestClose={() => {
          SetEditStudiesModal(false)
          //clear the input
          setSchoolInput('');
          setDegreeInput('');
          setFieldOfStudyInput('');
          setStudyStartDate(new Date());
          setStudyEndDate(new Date());
        }}
        contentLabel="Modify this study"
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
                Modify this study
              </h3>
              <button type="button"
                onClick={() => {
                  SetEditStudiesModal(false)
                  //clear the input
                  setSchoolInput('');
                  setDegreeInput('');
                  setFieldOfStudyInput('');
                  setStudyStartDate(new Date());
                  setStudyEndDate(new Date());
                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>

            <form action="#">
              <div className="grid gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="school" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">School: </label>
                  <Autosuggest
                    suggestions={schoolSuggestions}
                    onSuggestionsFetchRequested={onSchoolSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSchoolSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your school name',
                      value: schoolInput,
                      onChange: onSchoolInputChange,
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
                </div>
                <div>
                  <label htmlFor="Degree" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Degree: </label>
                  <Autosuggest
                    suggestions={degreeSuggestions}
                    onSuggestionsFetchRequested={onDegreeSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onDegreeSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your degree',
                      value: degreeInput,
                      onChange: onDegreeInputChange,
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
                </div>
                <div>
                  <label htmlFor="Degree" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Field of study: </label>
                  <Autosuggest
                    suggestions={fieldOfStudySuggestions}
                    onSuggestionsFetchRequested={onFieldOfStudySuggestionsFetchRequested}
                    onSuggestionsClearRequested={onFieldOfStudySuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type what field of study',
                      value: fieldOfStudyInput,
                      onChange: onFieldOfStudyInputChange,
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
                </div>
                <div></div>
                <div>
                  <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start date: </label>
                  <DatePicker
                    id="startDate"
                    selected={studyStartDate}
                    onChange={(date) => setStudyStartDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End date(or expected to be done): </label>
                  <DatePicker
                    id="endDate"
                    selected={studyEndDate}
                    onChange={(date) => setStudyEndDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
              </div>
              <div className='flex'>
                <button
                  type="button"
                  onClick={handleEditStudy}
                  className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Modify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SetEditStudiesModal(false)
                    //clear the input
                    setSchoolInput('');
                    setDegreeInput('');
                    setFieldOfStudyInput('');
                    setStudyStartDate(new Date());
                    setStudyEndDate(new Date());
                  }}
                  className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
      {/* delete study modal */}
      {deleteStudyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md drop-shadow-2xl">
            <p className='mb-5'>Are you sure you want to delete this item?</p>

            <div className="mt-4">
              <button
                onClick={() => handleDeleteStudy(currentStudyId)}
                className="bg-red-500 text-white px-4 py-2 rounded-md mr-4"
              >
                Yes
              </button>
              <button
                onClick={() => setdeleteStudyModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add new project modal */}
      <Modal
        isOpen={addProjectModal}
        onRequestClose={() => SetAddProjectModal(false)}
        contentLabel="Add new project"
        className=" flex justify-center mt-48"
        shouldCloseOnOverlayClick={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(196,196,196,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          content: {
            position: 'relative',
            margin: 'auto',
          },
        }}
      >
        <div className="relative p-4 w-full max-w-2xl h-full md:h-auto overflow-auto max-h-screen">
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add new project
              </h3>
              <button type="button"
                onClick={() => {
                  SetAddProjectModal(false)
                  resetFormFields();
                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>

            <form action="#">
              <div className="grid gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title: </label>
                  <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required />
                </div>
                <div>
                </div>
                <div>

                  <label htmlFor="department" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department: </label>
                  <Autosuggest
                    suggestions={departmentSuggestions}
                    onSuggestionsFetchRequested={onDepartmentSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onDepartmentSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your department name',
                      value: departmentInput,
                      onChange: onDepartmentInputChange,
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
                </div>
                <div>
                  <label htmlFor="subsystem" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subsystem: </label>
                  <Autosuggest
                    suggestions={subsystemSuggestions}
                    onSuggestionsFetchRequested={onSubsystemSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSubsystemSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: '',
                      value: subsystemInput,
                      onChange: onSubsystemInputChange,
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
                </div>
                <div>
                  <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start date: </label>
                  <DatePicker
                    id="startDate"
                    selected={projectStartDate}
                    onChange={(date) => setProjectStartDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End date(or expected to be done): </label>
                  <DatePicker
                    id="endDate"
                    selected={projectEndDate}
                    onChange={(date) => setProjectEndDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="user" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contributors: </label>
                  <UserAutosuggest keycloak={keycloak} onUsersSelected={handleUsersSelected} defaultSelectedUsers={defaultUsers} currentUserId={id} />
                </div>
                <div>
                  <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tags: </label>
                  <TagAutosuggest keycloak={keycloak} onTagsSelected={handleTagsSelected} currentTags={assignedProjectTags} />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description: </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  id="description"
                  className=" mb-5 w-full h-32 p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 resize-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Type your project description"
                  required
                ></textarea>
              </div>
              <div className='flex'>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SetAddProjectModal(false)
                    resetFormFields();
                  }}
                  className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">

                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Edit project modal */}
      <Modal
        isOpen={editProjectModal}
        onRequestClose={() => SetEditProjectModal(false)}
        contentLabel="Modify this project"
        className=" flex justify-center mt-48"
        shouldCloseOnOverlayClick={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(196,196,196,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          content: {
            position: 'relative',
            margin: 'auto',
          },
        }}
      >
        <div className="relative p-4 w-full max-w-2xl h-full md:h-auto overflow-auto max-h-screen">
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Modify this project
              </h3>
              <button type="button"
                onClick={() => {
                  SetEditProjectModal(false)
                  resetFormFields();
                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>

            <form action="#">
              <div className="grid gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title: </label>
                  <input type="text" name="firstName" id="firstName" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required />
                </div>
                <div>
                </div>
                <div>

                  <label htmlFor="department" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Department: </label>
                  <Autosuggest
                    suggestions={departmentSuggestions}
                    onSuggestionsFetchRequested={onDepartmentSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onDepartmentSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      required: true,
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: 'Type your department name',
                      value: departmentInput,
                      onChange: onDepartmentInputChange,
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
                </div>
                <div>
                  <label htmlFor="subsystem" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subsystem: </label>
                  <Autosuggest
                    suggestions={subsystemSuggestions}
                    onSuggestionsFetchRequested={onSubsystemSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSubsystemSuggestionsClearRequested}
                    getSuggestionValue={(suggestion) => suggestion}
                    renderSuggestion={(suggestion) => <div className="py-2 px-4">{suggestion}</div>}
                    inputProps={{
                      required: true,
                      className: "w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400",
                      placeholder: '',
                      value: subsystemInput,
                      onChange: onSubsystemInputChange,
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
                </div>
                <div>
                  <label htmlFor="startDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Start date: </label>
                  <DatePicker
                    id="startDate"
                    selected={projectStartDate}
                    onChange={(date) => setProjectStartDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">End date(or expected to be done): </label>
                  <DatePicker
                    id="endDate"
                    selected={projectEndDate}
                    onChange={(date) => setProjectEndDate(date)}
                    className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                    calendarClassName="border border-gray-300 rounded-md shadow-lg"
                  />
                </div>
                <div>
                  <label htmlFor="user" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contributors: </label>
                  <UserAutosuggest keycloak={keycloak} onUsersSelected={handleUsersSelected} defaultSelectedUsers={assignedUsers} currentUserId={id} />
                </div>
                <div>
                  <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tags: </label>
                  <TagAutosuggest keycloak={keycloak} onTagsSelected={handleTagsSelected} currentTags={assignedProjectTags} />

                </div>
              </div>
              <div>
                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description: </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  id="description"
                  className=" mb-5 w-full h-32 p-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400 resize-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Type your project description"
                  required
                ></textarea>
              </div>
              <div className='flex'>
                <button
                  type="button"
                  onClick={handleEditProject}
                  className="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SetEditProjectModal(false)
                    resetFormFields();
                  }}
                  className="flex focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">

                  Close
                </button>
              </div>
            </form>
          </div>
        </div >
      </Modal >
      {/* delete project */}
      {deleteProjectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md drop-shadow-2xl">
            <p className='mb-5'>Are you sure you want to delete this item?</p>
            <li>You will not be able to restore this project once deleted</li>

            <div className="mt-4">
              <button
                onClick={() => handleDeleteProject(currentProjectId)}
                className="bg-red-500 text-white px-4 py-2 rounded-md mr-4"
              >
                Yes
              </button>
              <button
                onClick={() => setdeleteProjectModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {/* leave project */}
      {leaveProjectModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md drop-shadow-2xl">
            <p className='mb-5'>Are you sure you want to leave this project</p>
            <li>You will not be able to make changes anymore.</li>
            <li>You will not be able to see this project on your profile page.</li>

            <div className="mt-4">
              <button
                onClick={() => handleLeaveProject(currentProjectId)}
                className="bg-red-500 text-white px-4 py-2 rounded-md mr-4"
              >
                Yes
              </button>
              <button
                onClick={() => setLeaveProjectModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {/* edit general information */}
      <Modal
        isOpen={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        contentLabel="Modify this project"
        className=" flex justify-center mt-48"
        shouldCloseOnOverlayClick={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(196,196,196,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          },
          content: {
            position: 'relative',
            margin: 'auto',
            zIndex: 50,
          },
        }}
      >
        <div className="relative p-4 w-full max-w-2xl h-full md:h-auto overflow-auto max-h-screen">
          <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
            <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit general information
              </h3>
              <button type="button"
                onClick={() => {
                  setEditModalOpen(false)
                }}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="defaultModal">
                <FaWindowClose />
              </button>
            </div>


            <div className="grid gap-4 mb-4 grid-cols-2">
              <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                {data.profile_pic ? (
                  <img
                    className="mx-auto mb-4 w-36 h-36 rounded-full object-cover"
                    src={data.profile_pic}
                    alt={data.first_name}
                  />
                ) : (
                  <div className="mx-auto mb-4 w-36 h-36 rounded-full flex items-center justify-center bg-blue-400 text-white text-6xl">
                    {data.first_name ? data.first_name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <ProfileImageCropper onUpload={handleUploadCroppedImage} />
              </div>
              <div className="mt-4">
                <label htmlFor="nationality" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Department:
                </label>
                <input
                  type="text"
                  name="department"
                  id="department"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4">
                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Phone number:
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  onKeyPress={(e) => {
                    if (!/[0-9+]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}

                  maxLength="15"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

              </div>
              <div className="mt-4">
                <label htmlFor="nationality" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Nationality:
                </label>
                <input
                  type="text"
                  name="nationality"
                  id="nationality"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4">
                <label htmlFor="studentNum" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Student/Employee number:
                </label>
                <input
                  type="text"
                  name="studentNum"
                  id="studentNum"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}

                  maxLength="6"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={studentNum}
                  onChange={(e) => setStudentNum(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4">
                <label htmlFor="cardNum" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Card number:
                </label>
                <input
                  type="text"
                  name="cardNum"
                  id="cardNum"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}

                  maxLength="12"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  value={cardNum}
                  onChange={(e) => setCardnum(e.target.value)}
                  required
                />
              </div>
              <div className="mt-4">
                <label htmlFor="dateOfJoining" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Date of joining the team:
                </label>
                <DatePicker
                  id="dateOfJoining"
                  selected={dateOfJoining}
                  onChange={(date) => setDateOfJoining(date)}
                  className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                  calendarClassName="border border-gray-300 rounded-md shadow-lg"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="birthday" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Brithday:
                </label>
                <DatePicker
                  id="birthday"
                  selected={birthday}
                  onChange={(date) => setBirthday(date)}
                  className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                  calendarClassName="border border-gray-300 rounded-md shadow-lg"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="tags" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Tags:
                </label>
                <TagAutosuggest keycloak={keycloak} onTagsSelected={handleUserTags} currentTags={assignedUserTags} />
              </div>

              <button type="button"
                onClick={handleEditProfile}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
                Save changes
              </button>
              <button type="button"
                onClick={() => setEditModalOpen(false)}
                className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">
                Cancel
              </button>
            </div>
          </div>
        </div >
      </Modal >
    </div >

  )
}

export default Profile

