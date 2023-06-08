import dotenv from 'dotenv'
dotenv.config()

import express from "express"
import mysql from "mysql2"
import cors from "cors"
import bodyParser from "body-parser";
import Keycloak from "keycloak-connect";
import KcAdminClient from '@keycloak/keycloak-admin-client';
const app = express()
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

console.log("Connectiong to DB")
console.log(`DB Host: ${process.env.DB_HOST}`);
console.log(`DB user: ${process.env.DB_USER}`);
console.log(`DB database: ${process.env.DB_NAME}`);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




const keycloakConfig = {
  clientId: process.env.CLIENT_ID,
  bearerOnly: process.env.BEARER_ONLY === 'true',
  serverUrl: process.env.SERVER_URL,
  realm: process.env.REALM,
  credentials: {
    secret: process.env.SECRET
  }
};

console.log("ConnectionConfig for Keycloak");
console.log(`server: ${keycloakConfig.serverUrl}`);
console.log(`client: ${keycloakConfig.clientId}`);
console.log(`bearer: ${keycloakConfig.bearerOnly}`);
console.log(`realm: ${keycloakConfig.realm}`);

const keycloak = new Keycloak({}, keycloakConfig);

app.use(keycloak.middleware());


app.listen(5000, () => {
  console.log("listening on port 5000")
})

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid token or missing authentication');
  } else {
    next(err);
  }
});

// ------------------------------ get logged in user id ------------------------------
app.get('/getUserId', keycloak.protect(), (req, res) => {
  const keycloakUserId = req.headers['x-user-id'];

  const q = "SELECT id , profile_pic FROM users WHERE keycloak_user_id = ?";

  db.query(q, [keycloakUserId], (err, data) => {
    if (err) return res.json(err);

    if (data.length > 0) {
      return res.send(data[0]);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  });
});


// ------------------------------ Define the GET route for a user with a specific ID ------------------------------
app.get('/user/:id', keycloak.protect(), (req, res) => {
  const userId = req.params.id;
  // Extract the requesting user's ID and role from the request headers
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  // Check if the user is found
  const handleQueryResult = (err, data) => {
    if (err) return res.json(err);
    if (data.length > 0) {
      return res.send(data);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  };

  // Extract the Keycloak user ID from the profile
  const selectKeycloakUserId = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(selectKeycloakUserId, (err, data) => {
    if (err) return res.json(err);
    if (data.length > 0) {
      const profileKeycloakUserId = data[0].keycloak_user_id;
      let q;

      // Check if the requesting user is the profile owner or an admin
      if (requestUserId === profileKeycloakUserId || requestUserRole === 'admin') {
        // Update the query to retrieve all user information
        q = "SELECT * FROM users WHERE id = " + userId;
      } else if (requestUserRole === 'former_member') {
        // Update the query to retrieve limited information
        q = "SELECT id, first_name, last_name, email, profile_pic  FROM users WHERE id = " + userId;
      } else {
        q = "SELECT id, first_name, last_name, email, phone_number, date_of_joining, profile_pic, department FROM users WHERE id = " + userId;
      }

      db.query(q, handleQueryResult);
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  });
});



//------------------------------ get user info for admin ------------------------------
app.get('/getUserForAdmin/:id', keycloak.protect('admin'), async (req, res) => {
  const userId = req.params.id;

  const q = "SELECT * FROM users WHERE id = " + userId;
  db.query(q, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      const userRoles = await kcAdminClient.users.listRealmRoleMappings({ id: keycloakUserId });
      const keycloakUser = await kcAdminClient.users.findOne({ id: keycloakUserId });

      const userData = {
        ...data[0],
        username: keycloakUser.username,
        roles: userRoles.map(role => role.name),
      };

      return res.send(userData);
    } catch (error) {
      console.error('Error getting user data from Keycloak:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send('Failed to get user data from Keycloak');
    }
  });
});

//------------------------------ Get data for the members page ------------------------------
app.get('/users', keycloak.protect(), (req, res) => {
  const requestUserRole = req.headers['x-user-role'];

  const q = `
    SELECT 
      users.id, 
      users.first_name, 
      users.last_name, 
      users.email, 
      ${requestUserRole !== 'former_member' ? 'users.phone_number,' : ''}
      users.profile_pic,
      users.current,
      GROUP_CONCAT(DISTINCT education.degree) as degrees,
      GROUP_CONCAT(DISTINCT projects.department) as departments,
      GROUP_CONCAT(DISTINCT projects.subsystem) as subsystems
    FROM users 
    LEFT JOIN education ON users.id = education.team_member_id
    LEFT JOIN team_member_projects ON users.id = team_member_projects.team_member_id
    LEFT JOIN projects ON team_member_projects.project_id = projects.id
    WHERE users.status = true
    GROUP BY users.id
  `;

  db.query(q, (err, data) => {
    if (err) return res.json(err);
    const members = data.map(item => ({
      ...item,
      degrees: item.degrees ? item.degrees.split(',') : [],
      departments: item.departments ? item.departments.split(',') : [],
      subsystems: item.subsystems ? item.subsystems.split(',') : []
    }));
    return res.send(members);
  });
});


//------------------------------ Get all the members for the autosuggest ------------------------------

app.get('/api/users/suggest', keycloak.protect(), (req, res) => {
  const q = "SELECT id, first_name, last_name, profile_pic FROM users"
  db.query(q, (err, data) => {
    if (err) return res.json(err)
    return res.send(data)
  })
})
app.get('/api/users/search', keycloak.protect(), (req, res) => {
  const searchTerm = req.query.search;
  const q = `
    SELECT id, first_name, last_name, email, profile_pic FROM users
    WHERE first_name LIKE ? OR last_name LIKE ?;
  `;
  const values = [`%${searchTerm}%`, `%${searchTerm}%`];

  db.query(q, values, (err, data) => {
    if (err) return res.json(err);
    return res.send(data);
  });
});
//------------------------------ Get all the tags for the autosuggest ------------------------------

app.get('/api/tags/suggest', keycloak.protect(), (req, res) => {
  const q = "SELECT * FROM tags"
  db.query(q, (err, data) => {
    if (err) return res.json(err)
    return res.send(data)
  })
})
//------------------------------ Get all data for the admin page ------------------------------

app.get('/admin', keycloak.protect('admin'), (req, res) => {
  const q = "SELECT * FROM users WHERE status = true"
  db.query(q, (err, data) => {
    if (err) return res.json(err)
    return res.send(data)
  })
})
//------------------------------ Get all data for the deleted/disabled accounts ------------------------------

app.get('/admin/disabled', keycloak.protect('admin'), (req, res) => {
  const q = "SELECT * FROM users WHERE status = 0"
  db.query(q, (err, data) => {
    if (err) return res.json(err)
    return res.send(data)
  })
})
//------------------------------ create new user ------------------------------
app.post('/createUser', keycloak.protect('admin'), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const kcAdminClient = new KcAdminClient({
      baseUrl: keycloakConfig.serverUrl,
      realmName: keycloakConfig.realm,

    });
    await kcAdminClient.auth({
      clientId: keycloakConfig.clientId,
      clientSecret: keycloakConfig.credentials.secret,
      grantType: 'client_credentials',
    });
    const newUser = {
      username,
      email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      emailVerified: true,
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: true,
        },
      ],
      attributes: {
        key: 'value',
      },
    };



    await kcAdminClient.users.create(newUser);


    const createdUser = await kcAdminClient.users.find({
      username: newUser.username,
    });

    const userId = createdUser[0].id;

    const q = "INSERT INTO users(`first_name`, `last_name`,`email`, `keycloak_user_id`) VALUES (?)";
    const values = [
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      userId,
    ];
    db.query(q, [values], (err, data) => {
      if (err) {
        console.error("Error adding user to the database:", err);
      } else {
        console.log("User added to the database");
      }
    });


    const clients = await kcAdminClient.clients.find();
    const client = clients.find(c => c.clientId === keycloakConfig.clientId);

    if (!client) {
      console.error('Client not found:', keycloakConfig.clientId);
      res.status(500).send('Failed to find client');
      return;
    }

    const clientId = client.id;

    const allClientRoles = await kcAdminClient.clients.listRoles({
      id: clientId,
    });
    const selectedClientRole = allClientRoles.find(r => r.name === role);

    if (!selectedClientRole) {
      console.error('Client role not found:', role);
      res.status(500).send('Failed to find client role');
      return;
    }

    await kcAdminClient.users.addClientRoleMappings({
      id: userId,
      clientUniqueId: clientId,
      roles: [selectedClientRole],
    });

    const allRealmRoles = await kcAdminClient.roles.find();
    const selectedRealmRole = allRealmRoles.find(r => r.name === role);

    if (!selectedRealmRole) {
      console.error('Realm role not found:', role);
      res.status(500).send('Failed to find realm role');
      return;
    }

    await kcAdminClient.users.addRealmRoleMappings({
      id: userId,
      roles: [selectedRealmRole],
    });

    res.send('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error.message);
    console.error('Error details:', error.response?.data);
    const keycloakError = error.response?.data?.errorMessage;

    if (error.response && error.response.status === 400 && keycloakError?.startsWith('Password policy not met')) {
      res.status(400).send(keycloakError);
    } else if (error.response && error.response.status === 409) {
      res.status(409).send(keycloakError || 'User already exists');
    } else {
      res.status(500).send(error.response.data.errorMessage);
    }
  }
});

//------------------------------ modify the user for admin ------------------------------
app.put('/updateUser/:id', keycloak.protect('admin'), async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, email, role } = req.body;


  const keycloakUserIdQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(keycloakUserIdQuery, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      // Update the user in Keycloak
      await kcAdminClient.users.update({ id: keycloakUserId }, {
        firstName: firstName,
        lastName: lastName,
        email: email,
      });

      // Get all realm roles
      const allRealmRoles = await kcAdminClient.roles.find();
      const realmAdminRole = allRealmRoles.find(r => r.name === 'admin');
      const realmUserRole = allRealmRoles.find(r => r.name === 'user');
      const realmFormerRole = allRealmRoles.find(r => r.name === 'former_member');


      // Get the client
      const clients = await kcAdminClient.clients.find();
      const client = clients.find(c => c.clientId === keycloakConfig.clientId);

      if (!client) {
        console.error('Client not found:', keycloakConfig.resource);
        res.status(500).send('Failed to find client');
        return;
      }



      // Get all client roles
      const allClientRoles = await kcAdminClient.clients.listRoles({ id: client.id });
      const clientAdminRole = allClientRoles.find(r => r.name === 'admin');
      const clientUserRole = allClientRoles.find(r => r.name === 'user');
      const clientFormerRole = allClientRoles.find(r => r.name === 'former_member');

      // Remove existing realm roles and assign the new role
      if (role === 'admin') {
        await kcAdminClient.users.delRealmRoleMappings({ id: keycloakUserId, roles: [realmUserRole, realmFormerRole] });
        await kcAdminClient.users.addRealmRoleMappings({ id: keycloakUserId, roles: [realmAdminRole] });
      } else if (role === 'user') {
        await kcAdminClient.users.delRealmRoleMappings({ id: keycloakUserId, roles: [realmAdminRole, realmFormerRole] });
        await kcAdminClient.users.addRealmRoleMappings({ id: keycloakUserId, roles: [realmUserRole] });
      } else if (role === 'former_member') {
        await kcAdminClient.users.delRealmRoleMappings({ id: keycloakUserId, roles: [realmAdminRole, realmUserRole] });
        await kcAdminClient.users.addRealmRoleMappings({ id: keycloakUserId, roles: [realmFormerRole] });
      }


      // Remove existing client roles and assign the new role
      if (role === 'admin') {
        await kcAdminClient.users.delClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientUserRole, clientFormerRole] });
        await kcAdminClient.users.addClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientAdminRole] });
      } else if (role === 'user') {
        await kcAdminClient.users.delClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientAdminRole, clientFormerRole] });
        await kcAdminClient.users.addClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientUserRole] });
      }
      else if (role === 'former_member') {
        await kcAdminClient.users.delClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientAdminRole, clientUserRole] });
        await kcAdminClient.users.addClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientFormerRole] });
      }

      // Update the user in the database
      const updateUserQuery = "UPDATE users SET first_name = ?, last_name = ?, email = ?, current = ? WHERE id = ?";
      const isCurrent = role === 'user' || role === 'admin';

      db.query(updateUserQuery, [firstName, lastName, email, isCurrent, userId], (err, result) => {
        if (err) return res.json(err);
        return res.json("User updated successfully");
      });


    } catch (error) {
      console.error('Error updating user:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send('Failed to update user');
    }
  });
});
// ------------------------------ change password for the user inside the dashboard ------------------------------
app.put('/changePassword/:id', keycloak.protect('admin'), async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  const keycloakUserIdQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(keycloakUserIdQuery, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;
    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      if (newPassword) {
        await kcAdminClient.users.resetPassword({
          id: keycloakUserId,
          credential: {
            type: 'password',
            value: newPassword,
            temporary: false,
          },
        });
      }

      res.json("Password changed successfully");
    } catch (error) {
      console.error('Error changing password:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send(error.response.data.error_description);
    }
  });
});

// ------------------------------ Leave the team ------------------------------

app.put('/leaveTeam', keycloak.protect(), async (req, res) => {
  const appUserId = req.headers['x-user-id'];
  const { current } = req.body;

  // Query the keycloakUserId from the database
  const keycloakUserQuery = "SELECT keycloak_user_id FROM users WHERE id = ?";
  db.query(keycloakUserQuery, [appUserId], async (err, data) => {
    if (err) return res.status(500).json(err);

    if (data.length > 0) {
      const keycloakUserId = data[0].keycloak_user_id;

      try {
        const kcAdminClient = new KcAdminClient({
          baseUrl: keycloakConfig.serverUrl,
          realmName: keycloakConfig.realm,
        });

        await kcAdminClient.auth({
          clientId: keycloakConfig.clientId,
          clientSecret: keycloakConfig.credentials.secret,
          grantType: 'client_credentials',
        });

        // Get the client
        const clients = await kcAdminClient.clients.find();
        const client = clients.find(c => c.clientId === keycloakConfig.clientId);

        if (!client) {
          console.error('Client not found:', keycloakConfig.resource);
          res.status(500).send('Failed to find client');
          return;
        }

        // Get all client roles
        const allClientRoles = await kcAdminClient.clients.listRoles({ id: client.id });
        const clientFormerMemberRole = allClientRoles.find(r => r.name === 'former_member');

        // Filter out the 'user' and 'admin' client roles
        const clientRolesToRemove = allClientRoles.filter(r => r.name === 'user' || r.name === 'admin');
        await kcAdminClient.users.addClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: [clientFormerMemberRole] });

        // Remove 'user' and 'admin' client roles
        await kcAdminClient.users.delClientRoleMappings({ id: keycloakUserId, clientUniqueId: client.id, roles: clientRolesToRemove });

        // Get all realm roles
        const allRealmRoles = await kcAdminClient.roles.find();
        const formerMemberRole = allRealmRoles.find(r => r.name === 'former_member');

        // Filter out the 'user' and 'admin' realm roles
        const realmRolesToRemove = allRealmRoles.filter(r => r.name === 'user' || r.name === 'admin');

        // Remove 'user' and 'admin' realm roles
        await kcAdminClient.users.delRealmRoleMappings({ id: keycloakUserId, roles: realmRolesToRemove });

        // Assign the realm role "Former_member"
        await kcAdminClient.users.addRealmRoleMappings({ id: keycloakUserId, roles: [formerMemberRole] });

        const updateQuery = "UPDATE users SET current = ? WHERE id = ?";
        db.query(updateQuery, [current, appUserId], (err, result) => {
          if (err) return res.status(500).json(err);

          res.json("User's current status and roles updated successfully");
        });
      } catch (error) {
        console.error('Error updating current status and roles:', error.message);
        res.status(500).send('Failed to update current status and roles');
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});




// ------------------------------ change settings-password for the user ------------------------------
app.put('/updateUserSettings/:id', keycloak.protect(), async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, email } = req.body;

  const keycloakUserIdQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(keycloakUserIdQuery, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    // Check if the authenticated user is updating their own profile
    if (req.kauth.grant.access_token.content.sub !== keycloakUserId) {
      return res.status(403).send('Forbidden: You can only edit your own profile.');
    }

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      await kcAdminClient.users.update({ id: keycloakUserId }, {
        firstName: firstName,
        lastName: lastName,
        email: email,
      });
      const updateUserQuery = "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?";
      db.query(updateUserQuery, [firstName, lastName, email, userId], (err, result) => {
        if (err) return res.json(err);
      });

      return res.json("User settings updated successfully");
    } catch (error) {
      console.error('Error updating user settings:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(409).send("This email adress is already used")
      res.status(500).send(error.response.data.error_description);
    }
  });

});
app.put('/user/changePassword/:id', keycloak.protect(), async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.params.id;

  // Extract keycloakUserId from the database
  const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(q, async (err, data) => {
    if (err) return res.status(500).json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    if (req.kauth.grant.access_token.content.sub !== keycloakUserId) {
      return res.status(403).send('Forbidden: You can only change your own password.');
    }

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      // Update the user's password
      await kcAdminClient.users.resetPassword({
        id: keycloakUserId,
        credential: {
          type: 'password',
          value: newPassword,
          temporary: false,
        },
      });

      return res.json("Password updated successfully");

    } catch (error) {
      console.error('Error changing password:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send(error.response.data.error_description);
    }
  });
});

// ------------------------------ endpoint to delete user ------------------------------
app.put('/disableUser/:id', keycloak.protect('admin'), async (req, res) => {
  const id = req.params.id;
  const requestUserId = req.headers['x-user-id'];
  const q = "SELECT keycloak_user_id FROM users WHERE id = " + id;

  db.query(q, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    // Check if the admin is trying to disable their own account
    if (requestUserId === keycloakUserId) {
      return res.status(403).json("You cannot disable your own account");
    }

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      // Disable the user in Keycloak
      await kcAdminClient.users.update({ id: keycloakUserId }, { enabled: false });

      // Set 'current' field to false in the database
      const disableUserQuery = "UPDATE users SET status = false WHERE id = ?";
      db.query(disableUserQuery, [id], (err, data) => {
        if (err) return res.json(err);
        return res.json("The user has been disabled successfully");
      });

    } catch (error) {
      console.error('Error disabling user in Keycloak:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send('Failed to disable user in Keycloak');
    }
  });
});


app.put('/enebleAccount/:id', keycloak.protect('admin'), async (req, res) => {
  const id = req.params.id;
  const requestUserId = req.headers['x-user-id'];
  const q = "SELECT keycloak_user_id FROM users WHERE id = " + id;

  db.query(q, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    // Check if the admin is trying to disable their own account
    if (requestUserId === keycloakUserId) {
      return res.status(403).json("You cannot eneble your own account");
    }

    try {
      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      // Disable the user in Keycloak
      await kcAdminClient.users.update({ id: keycloakUserId }, { enabled: true });

      // Set 'current' field to false in the database
      const disableUserQuery = "UPDATE users SET status = true WHERE id = ?";
      db.query(disableUserQuery, [id], (err, data) => {
        if (err) return res.json(err);
        return res.json("The user has been enebled successfully");
      });

    } catch (error) {
      console.error('Error disabling user in Keycloak:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send('Failed to disable user in Keycloak');
    }
  });
});

app.delete('/deleteUser/:id', keycloak.protect('admin'), async (req, res) => {
  const id = req.params.id;
  const requestUserId = req.headers['x-user-id'];
  const q = "SELECT keycloak_user_id, profile_pic FROM users WHERE id = " + id;

  db.query(q, async (err, data) => {
    if (err) return res.json(err);

    if (data.length === 0) {
      return res.status(404).json("User not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;
    const profilePicUrl = data[0].profile_pic;

    // Check if the admin is trying to delete their own account
    if (requestUserId === keycloakUserId) {
      return res.status(403).json("You cannot delete your own account");
    }

    // Delete user's profile picture from storage
    if (profilePicUrl) {
      const profilePicPath = path.join(__dirname, profilePicUrl.replace(/^http:\/\/[^/]+/, ''));
      fs.unlink(profilePicPath, (err) => {
        if (err) console.error(`Failed to delete profile picture: ${profilePicPath}`);
      });
    }

    try {
      // Delete user's projects
      const deleteEducationQuery = "DELETE FROM team_member_projects WHERE team_member_id = " + id;
      db.query(deleteEducationQuery, (err, data) => {
        if (err) return res.json(err);
      });

      // Delete user's education
      const deleteProjectsQuery = "DELETE FROM education WHERE team_member_id = " + id;
      db.query(deleteProjectsQuery, (err, data) => {
        if (err) return res.json(err);
      });

      const kcAdminClient = new KcAdminClient({
        baseUrl: keycloakConfig.serverUrl,
        realmName: keycloakConfig.realm,
      });

      await kcAdminClient.auth({
        clientId: keycloakConfig.clientId,
        clientSecret: keycloakConfig.credentials.secret,
        grantType: 'client_credentials',
      });

      await kcAdminClient.users.del({ id: keycloakUserId });

      const deleteUserQuery = "DELETE FROM users WHERE id = " + id;
      db.query(deleteUserQuery, (err, data) => {
        if (err) return res.json(err);
        return res.json("The user has been deleted successfully");
      });
    } catch (error) {
      console.error('Error deleting user from Keycloak:', error.message);
      console.error('Error details:', error.response?.data);
      res.status(500).send('Failed to delete user from Keycloak');
    }
  });
});



// ------------------------------ get all studies for a user ------------------------------


app.get('/user/:id/studies', keycloak.protect(), (req, res) => {
  const userId = req.params.id;

  const q = "SELECT * FROM education WHERE team_member_id = ?";

  db.query(q, [userId], (err, data) => {
    if (err) return res.json(err);

    if (data.length > 0) {
      return res.send(data);
    } else {
      return res.status(404).json({ message: 'This user does not have assigned studies' });
    }
  });
});

// ------------------------------ filter degrees and schools and field of study ------------------------------

app.get('/api/degrees_and_schools', keycloak.protect(), (req, res) => {
  const qDegrees = "SELECT DISTINCT degree FROM education";
  const qSchools = "SELECT DISTINCT school FROM education";
  const qFieldOfStudy = "SELECT DISTINCT field_of_study FROM education";

  db.query(qDegrees, (err, degrees) => {
    if (err) return res.json(err);

    db.query(qSchools, (err, schools) => {
      if (err) return res.json(err);

      db.query(qFieldOfStudy, (err, fieldOfStudy) => {
        if (err) return res.json(err);
        const degreeList = degrees.map((degreeRow) => degreeRow.degree);
        const schoolList = schools.map((schoolRow) => schoolRow.school);
        const fieldOfStudyList = fieldOfStudy.map((fieldRow) => fieldRow.field_of_study);

        return res.json({ degrees: degreeList, schools: schoolList, fieldOfStudy: fieldOfStudyList });
      });
    });
  });
});
// ------------------------------ filter department and subsystem ------------------------------

app.get('/api/projects_info', keycloak.protect(), (req, res) => {
  const qDepartments = "SELECT DISTINCT department FROM projects";
  const qSubsystems = "SELECT DISTINCT subsystem FROM projects";

  db.query(qDepartments, (err, departments) => {
    if (err) return res.json(err);

    db.query(qSubsystems, (err, subsystems) => {
      if (err) return res.json(err);

      const departmentList = departments.map((departmentRow) => departmentRow.department);
      const subsystemList = subsystems.map((subsystemRow) => subsystemRow.subsystem);

      return res.json({ departments: departmentList, subsystems: subsystemList });
    });
  });
});


// ------------------------------ create a new study ------------------------------

app.post('/user/:id/createStudy', keycloak.protect(), async (req, res) => {
  try {
    const userId = req.params.id;
    const requestUserId = req.headers['x-user-id'];
    const requestUserRole = req.headers['x-user-role'];

    const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(q, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;

      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }
      // Extract the fields from the request body
      const {
        school,
        degree,
        fieldOfStudy,
        studyStartDate,
        studyEndDate,
      } = req.body;

      // Validate the data
      if (!school || !degree || !fieldOfStudy || !studyStartDate || !studyEndDate) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Insert the new study into the database
      const q = `
      INSERT INTO education (team_member_id, school, degree, field_of_study, from_date, till_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
      const values = [
        userId,
        school,
        degree,
        fieldOfStudy,
        studyStartDate,
        studyEndDate,
      ];

      db.query(q, values, (err, result) => {
        if (err) throw err;

        return res.status(201).json({ message: 'New study added successfully', studyId: result.insertId });
      });
    });
  } catch (error) {
    console.error('Error creating study:', error);
    res.status(500).json({ message: 'An error occurred while creating the study.' });
  }
});

// ------------------------------ Modify study ------------------------------
app.put('/user/:id/study/:studyId', keycloak.protect(), (req, res) => {
  const userId = req.params.id;
  const studyId = req.params.studyId;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
  db.query(q, async (err, data) => {
    if (err) throw err;

    if (data.length === 0) {
      return res.status(404).json("Study not found");
    }

    const keycloakUserId = data[0].keycloak_user_id;

    if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    // Extract the fields from the request body
    const {
      school,
      degree,
      fieldOfStudy,
      studyStartDate,
      studyEndDate,
    } = req.body;

    // Validate the data
    if (!school || !degree || !fieldOfStudy || !studyStartDate || !studyEndDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Update the study in the database
    const updateQuery = `
      UPDATE education
      SET school = ?, degree = ?, field_of_study = ?, from_date = ?, till_date = ?
      WHERE id = ? AND team_member_id = ?
    `;
    const values = [
      school,
      degree,
      fieldOfStudy,
      studyStartDate,
      studyEndDate,
      studyId,
      userId,
    ];

    db.query(updateQuery, values, (err, result) => {
      if (err) return res.json(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Study not found or you do not have permission to edit it' });
      }

      return res.status(200).json({ message: 'Study updated successfully' });
    });
  });
});

// ------------------------------ Delete study ------------------------------

app.delete('/user/:id/deleteStudy/:studyId', keycloak.protect(), async (req, res) => {
  try {
    const userId = req.params.id;
    const studyId = req.params.studyId;
    const requestUserId = req.headers['x-user-id'];
    const requestUserRole = req.headers['x-user-role'];

    const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(q, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      // Delete the study from the database
      const deleteQuery = `
          DELETE FROM education
          WHERE id = ? AND team_member_id = ?
        `;
      const values = [studyId, userId];

      db.query(deleteQuery, values, (err, result) => {
        if (err) throw err;

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Study not found' });
        }

        return res.status(200).json({ message: 'Study deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error deleting study:', error);
    res.status(500).json({ message: 'An error occurred while deleting the study.' });
  }
});
// ------------------------------ Get the project assigened to the user ------------------------------

app.get('/user/:id/projects', keycloak.protect(), (req, res) => {
  const userId = req.params.id;

  const q = `
  SELECT p.id, p.title, p.department, p.subsystem, p.from_date, p.till_date, p.description,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)))
      FROM team_member_projects tmp
      JOIN users u ON tmp.team_member_id = u.id
      WHERE tmp.project_id = p.id
    ) AS team_members,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('tag_id', t.tag_id, 'tag_name', t.tag_name))
      FROM project_tags pt
      JOIN tags t ON pt.tag_id = t.tag_id
      WHERE pt.project_id = p.id
    ) AS tags,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.created_by
    ) AS created_by_name,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.last_updated_by
    ) AS last_updated_by_name
  FROM projects p
  WHERE p.id IN (
    SELECT tmp2.project_id
    FROM team_member_projects tmp2
    WHERE tmp2.team_member_id = ?
  )
`;


  db.query(q, [userId], (err, data) => {
    if (err) return res.json(err);

    if (data.length > 0) {
      return res.send(data);
    } else {
      return res.status(404).json({ message: 'This user does not have assigned projects' });
    }
  });
});
// ------------------------------ Get all the projects ------------------------------


app.get('/projects', keycloak.protect(), (req, res) => {


  const q = `
  SELECT p.id, p.title, p.department, p.subsystem, p.from_date, p.till_date, p.description,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)))
      FROM team_member_projects tmp
      JOIN users u ON tmp.team_member_id = u.id
      WHERE tmp.project_id = p.id
    ) AS team_members,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('tag_id', t.tag_id, 'tag_name', t.tag_name))
      FROM project_tags pt
      JOIN tags t ON pt.tag_id = t.tag_id
      WHERE pt.project_id = p.id
    ) AS tags,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.created_by
    ) AS created_by_name,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.last_updated_by
    ) AS last_updated_by_name
  FROM projects p`;

  db.query(q, (err, data) => {
    if (err) return res.json(err);

    if (data.length > 0) {
      return res.send(data);
    } else {
      return res.status(404).json({ message: 'There are no avalible projects' });
    }
  });
});
// ------------------------------ Get all the projects for the user ------------------------------

app.get('/projects/:id', keycloak.protect(), (req, res) => {

  const projectId = req.params.id;
  const q = `
  SELECT p.id, p.title, p.department, p.subsystem, p.from_date, p.till_date, p.description,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('user_id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name)))
      FROM team_member_projects tmp
      JOIN users u ON tmp.team_member_id = u.id
      WHERE tmp.project_id = p.id
    ) AS team_members,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT('tag_id', t.tag_id, 'tag_name', t.tag_name))
      FROM project_tags pt
      JOIN tags t ON pt.tag_id = t.tag_id
      WHERE pt.project_id = p.id
    ) AS tags,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.created_by
    ) AS created_by_name,
    (
      SELECT CONCAT(u.first_name, ' ', u.last_name)
      FROM users u
      WHERE u.keycloak_user_id = p.last_updated_by
    ) AS last_updated_by_name
  FROM projects p WHERE p.id = ?`;

  db.query(q, projectId, (err, data) => {
    if (err) return res.json(err);

    if (data.length > 0) {
      return res.send(data);
    } else {
      return res.status(404).json({ message: 'There are no avalible projects' });
    }
  });
});

// ------------------------------ create new project ------------------------------

app.post('/user/:id/createProject', keycloak.protect(), async (req, res) => {
  const userId = req.params.id;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];


  const {
    title,
    department,
    subsystem,
    projectStartDate,
    projectEndDate,
    description,
    assignedUsers,
    assignedTags = [],
  } = req.body;

  try {
    const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(q, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      // Insert the new project into the 'projects' table
      const createProjectQuery = `
  INSERT INTO projects (title, department, subsystem, from_date, till_date, description, created_by, last_updated_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
      const projectValues = [
        title,
        department,
        subsystem,
        projectStartDate,
        projectEndDate,
        description,
        requestUserId,
        requestUserId
      ];


      db.query(createProjectQuery, projectValues, async (err, result) => {
        if (err) throw err;

        const projectId = result.insertId;

        // Assign the project to the users by updating the 'team_member_projects' table
        const assignProjectQuery = `
          INSERT INTO team_member_projects (team_member_id, project_id)
          SELECT * FROM (SELECT ? AS team_member_id, ? AS project_id) AS tmp
          WHERE NOT EXISTS (
              SELECT team_member_id, project_id FROM team_member_projects
              WHERE team_member_id = ? AND project_id = ?
          ) LIMIT 1;
        `;

        // Assign users
        for (const user of assignedUsers) {
          const values = [user.id, projectId, user.id, projectId];
          try {
            await new Promise((resolve, reject) => {
              db.query(assignProjectQuery, values, (err, result) => {
                if (err) reject(err);
                resolve(result);
              });
            });
          } catch (error) {
            console.error(error);
          }
        }
        // Create and assign tags to the project
        const existingTags = assignedTags.filter(tag => tag.tag_id);
        const newTags = assignedTags.filter(tag => !tag.tag_id);

        for (const tag of existingTags) {
          // Assign the existing tag to the project
          const assignTagToProjectQuery = 'INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)';
          await new Promise((resolve, reject) => {
            db.query(assignTagToProjectQuery, [projectId, tag.tag_id], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        }

        for (const tag of newTags) {
          // Create the new tag
          const createTagQuery = 'INSERT INTO tags (tag_name) VALUES (?)';
          const newTag = await new Promise((resolve, reject) => {
            db.query(createTagQuery, [tag.tag_name], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve({ tag_id: result.insertId, tag_name: tag.tag_name });
              }
            });
          });

          // Assign the new tag to the project
          const assignTagToProjectQuery = 'INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)';
          await new Promise((resolve, reject) => {
            db.query(assignTagToProjectQuery, [projectId, newTag.tag_id], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        }

        res.status(201).json({ message: 'Project created successfully', projectId: projectId });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create the project' });
  }
});
// ------------------------------ edit project by id ------------------------------

app.put('/user/:id/editProject/:projectId', keycloak.protect(), async (req, res) => {
  const userId = req.params.id;
  const projectId = req.params.projectId;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];
  let {
    title,
    department,
    subsystem,
    projectStartDate,
    projectEndDate,
    description,
    assignedUsers,
    assignedTags = [],
  } = req.body;

  if (!Array.isArray(assignedTags)) {
    assignedTags = [];
  }

  try {
    const q = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(q, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      // Update the project information in the 'projects' table
      const updateProjectQuery = `
        UPDATE projects
        SET title = ?, department = ?, subsystem = ?, from_date = ?, till_date = ?, description = ?, last_updated_by = ?
        WHERE id = ?;
      `;
      const projectValues = [
        title,
        department,
        subsystem,
        projectStartDate,
        projectEndDate,
        description,
        requestUserId,
        projectId,
      ];

      db.query(updateProjectQuery, projectValues, async (err, result) => {
        if (err) throw err;

        // Remove existing assigned users
        const deleteAssignedUsersQuery = 'DELETE FROM team_member_projects WHERE project_id = ?';
        db.query(deleteAssignedUsersQuery, [projectId], (err, result) => {
          if (err) throw err;
        });

        // Assign users
        const assignProjectQuery = `
          INSERT INTO team_member_projects (team_member_id, project_id)
          SELECT * FROM (SELECT ? AS team_member_id, ? AS project_id) AS tmp
          WHERE NOT EXISTS (
              SELECT team_member_id, project_id FROM team_member_projects
              WHERE team_member_id = ? AND project_id = ?
          ) LIMIT 1;
        `;

        for (const user of assignedUsers) {
          const values = [user.id, projectId, user.id, projectId];
          try {
            await new Promise((resolve, reject) => {
              db.query(assignProjectQuery, values, (err, result) => {
                if (err) reject(err);
                resolve(result);
              });
            });
          } catch (error) {
            console.error(error);
          }
        }

        // Remove existing assigned tags
        const deleteAssignedTagsQuery = 'DELETE FROM project_tags WHERE project_id = ?';
        db.query(deleteAssignedTagsQuery, [projectId], (err, result) => {
          if (err) throw err;
        });

        // Create and assign tags to the project
        const existingTags = assignedTags.filter(tag => tag.tag_id);
        const newTags = assignedTags.filter(tag => !tag.tag_id);

        for (const tag of existingTags) {
          // Assign the existing tag to the project
          const assignTagToProjectQuery = 'INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)';
          await new Promise((resolve, reject) => {
            db.query(assignTagToProjectQuery, [projectId, tag.tag_id], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        }

        for (const tag of newTags) {
          // Create the new tag
          const createTagQuery = 'INSERT INTO tags (tag_name) VALUES (?)';
          const newTag = await new Promise((resolve, reject) => {
            db.query(createTagQuery, [tag.tag_name], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve({ tag_id: result.insertId, tag_name: tag.tag_name });
              }
            });
          });

          // Assign the new tag to the project
          const assignTagToProjectQuery = 'INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)';
          await new Promise((resolve, reject) => {
            db.query(assignTagToProjectQuery, [projectId, newTag.tag_id], (err, result) => {
              if (err) {
                console.error(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        }


        res.status(200).json({ message: 'Project updated successfully', projectId: projectId });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update the project' });
  }
});



app.delete('/user/:id/deleteProject/:projectId', keycloak.protect(), async (req, res) => {
  const userId = req.params.id;
  const projectId = req.params.projectId;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  try {
    const userQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(userQuery, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      // Delete connections in the team_member_projects table
      const deleteTeamMemberProjectsQuery = 'DELETE FROM team_member_projects WHERE project_id = ?';
      db.query(deleteTeamMemberProjectsQuery, [projectId], (err, result) => {
        if (err) throw err;
      });
      const deleteProjectTagsQuery = 'DELETE FROM project_tags WHERE project_id = ?';
      db.query(deleteProjectTagsQuery, [projectId], (err, result) => {
        if (err) throw err;
      });

      // Delete the project from the projects table
      const deleteProjectQuery = 'DELETE FROM projects WHERE id = ?';
      db.query(deleteProjectQuery, [projectId], (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete the project' });
  }
});
app.delete('/user/:id/leaveProject/:projectId', keycloak.protect(), async (req, res) => {
  const userId = req.params.id;
  const projectId = req.params.projectId;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  try {
    const userQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(userQuery, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      const leaveProjectQuery = 'DELETE FROM team_member_projects WHERE team_member_id = ? AND project_id = ?';
      db.query(leaveProjectQuery, [userId, projectId], (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'User not assigned to the project' });
        }
        res.status(200).json({ message: 'User has left the project successfully' });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to leave the project' });
  }
});

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile_pictures');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/user/:id/uploadProfilePicture', upload.single('profilePicture'), async (req, res) => {
  const userId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file was received' });
  }

  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  try {
    const userQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(userQuery, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      const profilePictureUrl = 'http://' + req.get('host') + '/uploads/profile_pictures/' + file.filename;

      // Get old profile picture URL from the database
      const getOldPicQuery = "SELECT profile_pic FROM users WHERE id = ?";
      db.query(getOldPicQuery, [userId], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to retrieve old profile picture' });
        }
        const oldProfilePicUrl = result[0]?.profile_pic;

        // Update new profile picture URL in the database
        const updateQuery = "UPDATE users SET profile_pic = ? WHERE id = ?";
        db.query(updateQuery, [profilePictureUrl, userId], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to upload profile picture' });
          }

          // Delete old profile picture if it exists
          if (oldProfilePicUrl) {
            const oldProfilePicPath = path.join(__dirname, oldProfilePicUrl.replace(/^http:\/\/[^/]+/, ''));
            fs.unlink(oldProfilePicPath, (err) => {
              if (err) console.error(`Failed to delete old profile picture: ${oldProfilePicPath}`);
            });
          }

          res.status(200).json({ message: 'Profile picture uploaded successfully', url: profilePictureUrl });
        });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred while processing the request.' });
  }
});

app.use('/uploads/profile_pictures', express.static(path.join(__dirname, 'uploads/profile_pictures')));

app.put('/user/:id/profile', keycloak.protect(), (req, res) => {
  const userId = req.params.id;
  const requestUserId = req.headers['x-user-id'];
  const requestUserRole = req.headers['x-user-role'];

  try {
    const userQuery = "SELECT keycloak_user_id FROM users WHERE id = " + userId;
    db.query(userQuery, async (err, data) => {
      if (err) throw err;

      if (data.length === 0) {
        return res.status(404).json("User not found");
      }

      const keycloakUserId = data[0].keycloak_user_id;
      if (requestUserRole !== 'admin' && requestUserId !== keycloakUserId) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }

      // Extract the fields from the request body
      const {
        department,
        phone,
        nationality,
        studentNum,
        cardNum,
        dateOfJoining,
        birthday,
      } = req.body;

      // Validate the data
      if (!department || !phone || !nationality || !studentNum || !cardNum || !dateOfJoining || !birthday) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Update the user profile in the database
      const q = `
        UPDATE users
        SET department = ?, phone_number = ?, nationality = ?, student_number = ?, card_number = ?, date_of_joining = ?, birthday = ?
        WHERE id = ?
      `;
      const values = [
        department,
        phone,
        nationality,
        studentNum,
        cardNum,
        dateOfJoining,
        birthday,
        userId,
      ];

      db.query(q, values, (err, result) => {
        if (err) return res.json(err);

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'User not found or you do not have permission to edit the profile' });
        }

        return res.status(200).json({ message: 'Profile updated successfully' });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
});

// ------------------------------ Get tags for admin dashboard ------------------------------

app.get('/tags', keycloak.protect('admin'), (req, res) => {
  let q;
  q = "SELECT * FROM tags";
  db.query(q, (err, data) => {
    if (err) return res.json(err);
    return res.send(data);
  });
});
// ------------------------------ create new tags for admin dashboard ------------------------------
app.post('/tags', keycloak.protect('admin'), (req, res) => {
  const { tagName } = req.body;

  if (!tagName) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  const checkQuery = "SELECT * FROM tags WHERE tag_name = ?";

  db.query(checkQuery, [tagName], (err, data) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (data.length > 0) {
      return res.status(400).json({ error: "Tag with this name already exists" });
    }

    const insertQuery = "INSERT INTO tags (tag_name) VALUES (?)";

    db.query(insertQuery, [tagName], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }

      return res.status(200).send({ message: 'Tag created successfully' });
    });
  });
});
// ------------------------------ edit tags  for admin dashboard ------------------------------

app.put('/tags/:id', keycloak.protect('admin'), (req, res) => {
  const { tagName } = req.body;
  const { id } = req.params;

  if (!tagName) {
    return res.status(400).json({ error: "Tag name is required" });
  }

  const checkTagExistsQuery = "SELECT * FROM tags WHERE tag_name = ? AND tag_id != ?";

  db.query(checkTagExistsQuery, [tagName, id], (err, data) => {
    if (err) return res.status(500).json(err);

    // If a tag with the new name exists and it's not the current tag, send an error message
    if (data.length > 0) {
      return res.status(400).json({ error: "Tag name already exists" });
    }

    // If no tag with the new name exists or it's the current tag, proceed with the update
    const updateTagQuery = "UPDATE tags SET tag_name = ? WHERE tag_id = ?";

    db.query(updateTagQuery, [tagName, id], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send({ message: 'Tag updated successfully' });
    });
  });
});
// ------------------------------ delete tags for admin dashboard ------------------------------

app.delete('/tags/:id', keycloak.protect('admin'), (req, res) => {
  const { id } = req.params;

  // Delete the tag from project_tags table first
  const deleteProjectTagsQ = "DELETE FROM project_tags WHERE tag_id = ?";

  db.query(deleteProjectTagsQ, [id], (err, data) => {
    if (err) return res.status(500).json(err);

    // If successful, delete from tags table
    const deleteTagsQ = "DELETE FROM tags WHERE tag_id = ?";

    db.query(deleteTagsQ, [id], (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).send({ message: 'Tag deleted successfully' });
    });
  });
});

0.

app.get('/filters', (req, res) => {
  const degreesQuery = "SELECT DISTINCT degree FROM education";
  const departmentsQuery = "SELECT DISTINCT department FROM projects";
  const subsystemsQuery = "SELECT DISTINCT subsystem FROM projects";

  db.query(degreesQuery, (degreesError, degreesData) => {
    if (degreesError) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    db.query(departmentsQuery, (departmentsError, departmentsData) => {
      if (departmentsError) {
        return res.status(500).json({ error: "Internal Server Error" });
      }

      db.query(subsystemsQuery, (subsystemsError, subsystemsData) => {
        if (subsystemsError) {
          return res.status(500).json({ error: "Internal Server Error" });
        }

        return res.status(200).json({
          degrees: degreesData.map(item => item.degree),
          departments: departmentsData.map(item => item.department),
          subsystems: subsystemsData.map(item => item.subsystem),
        });
      });
    });
  });
});
