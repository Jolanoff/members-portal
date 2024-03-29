# members-portal
This is a Node.js and React portal designed for the Lunar Zebro project. The portal uses Keycloak for authentication and SQL for data storage.
The main purpose of this application is to facilitate member collaboration by providing an easy way for team members to find each other,
as well as a structured space for storing project data.

# Requirements
- Node.js
- Docker
- React
- SQL

# Installation
Follow these steps to get the application up and running on your local machine:

1. Clone the repository:
`git clone https://github.com/Jolanoff/members-portal.git`

2. Navigate into the frontend directory:
`cd members-portal/front-end`

3. install the necessary packages:
`npm install`

4. Navigate into the server directory:
`cd members-portal/server`

5. install the necessary packages:
`npm install`

6. Start the Docker containers for Keycloak and SQL:
`docker-compose up`

7. Install the database and run it via MySQL Workbench:


8. Create your first user in the database and in keycloak:
note: This is yet not created manually and need to be fixed

# Usage
Once the Docker containers are running and the Node.js server is started, you can navigate to http://localhost:3000 in your web browser to use the application. The portal allows members to find each other and record their project contributions.

