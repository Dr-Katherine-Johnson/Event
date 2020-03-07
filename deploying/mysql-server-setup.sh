# Instructions for setting up the one (1) EC2 instance that will hold the MySQL database, that all of the scaled servers will talk to

# SSH into ec2
# ssh -i ~/aws/Administrator-key-pair-useast1.pem ec2-user@EC2_INSTANCE_URL.compute-1.amazonaws.com

# INSTALLING MYSQL
# https://medium.com/@chamikakasun/installing-mysql-in-an-ec2-instance-55d6a3e19caf
# access the root user
# sudo su

# install MySQL
# yum install mysql-server

# auto start MySQL server on reboot
# chkconfig mysqld on

# start MySQL
# service mysqld start

# CONFIGURING MYSQL
# https://linuxize.com/post/mysql-remote-access/
# setup the MySQL ec2 instance to accept requests from any IP (instead of only on localhost, as default)
# need to adjust the MySQL configuration file
# In, CentOS (ec2 Linux is based on CentOS), that file is located at /etc/my.cnf

# open the file in vim, with sudo
# sudo vi /etc/my.cnf

# because this is MySQL 8 or greater, the bind-address directive is not present, so add it under [mysqld]
# set bind-address to 0.0.0.0 to listen on all IPV4 interfaces
# bind-address=0.0.0.0

# Restart the MySQL service for the changes to take effect
# I did this through the AWS console

# Grant access to a user from a remote machine
# https://dev.mysql.com/doc/refman/5.7/en/grant.html
# GRANT ALL ON events.* TO root@'%'

# move the schema file onto the db ec2 instance
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./database/mysql-schema.sql ec2-user@EC2_INSTANCE_URL:~

# run the schema file (in ec2)
# mysql -u root < mysql-schema.sql

# run the seed file (on the laptop)
# node ./database/seed.js && exit 0