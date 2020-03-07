# SSH into ec2
# ssh -i ~/aws/Administrator-key-pair-useast1.pem ec2-user@EC2_INSTANCE_URL

# make sure the instance is updated
# sudo yum update

# install docker
# sudo yum install docker -y

# start the docker service
# sudo service docker start

# add the ec2-user to the docker group so you can run docker commands without using sudo
# sudo usermod -a -G docker ec2-user

# install docker-compose
# sudo curl -L https://github.com/docker/compose/releases/download/1.21.0/docker-compose-`uname -s`-`uname -m` | sudo tee /usr/local/bin/docker-compose > /dev/null

# adjust permissions
# sudo chmod +x /usr/local/bin/docker-compose

# create a symbolic link
# ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# verify docker-compose version
# docker-compose -v

# logout (you'll need to logout anyway so the system reflects the user's updated status as a member of the docker group)

# from laptop

# copy files to ec2 instance
# docker-compose.yml
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./docker-compose.yml ec2-user@EC2_INSTANCE_URL:~

# .env
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./.env ec2-user@EC2_INSTANCE_URL:~

# log back in

# start the docker containers
# docker-compose up