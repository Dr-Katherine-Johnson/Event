# SSH into the instance
# ssh -i ~/aws/Administrator-key-pair-useast1.pem ec2-user@EC2_INSTANCE_URL

# update
# sudo yum update -y

# install docker
# sudo yum install -y docker

# start the docker service
# sudo service docker start

# add ec2-user to the docker user group
# sudo usermod -a -G docker ec2-user

# log out and back in


# docker swarm mode
# https://docs.docker.com/engine/swarm/swarm-tutorial/
# setting up ONE (1) host to have the docker manager node
# docker swarm init --advertise-addr <MANAGER-IP>

# adding a worker to the swarm (run this command on the OTHER boxes - hosts with nodes that will be workers)
# see .env file

# set up the routing mesh for the swarm


# move the docker-compose.yml and .env files to the manager node for the swarm
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./docker-compose.yml ec2-user@EC2_INSTANCE_URL:~

# scp -i ~/aws/Administrator-key-pair-useast1.pem ./.env ec2-user@EC2_INSTANCE_URL:~

# initiate the stack from the manager node
