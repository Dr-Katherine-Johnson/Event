FROM node:10.15.1

# installing the mysql client on this image
RUN apt-get update && apt-get install -y mysql-client && rm -rf /var/lib/apt

# installing the mysql server on the image
RUN apt-get update && apt-get install -y mysql-server

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# install dependencies
COPY package*.json ./
RUN npm cache clean --force && npm install

# copy app source to image _after_ npm install so that
# application code changes don’t bust the docker cache of
# npm install step
COPY . .

# set application PORT and expose docker PORT, 80 is what Elastic Beanstalk expects
EXPOSE 5000

CMD [ "npm", "start" ]