# Use an official Node runtime as the parent image
FROM node:16

# Set the working directory in the container to /usr/src/app
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Run nodemon when the container launches
CMD [ "node", "index.js" ]
