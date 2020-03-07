# SSH into ec2
# ssh -i ~/aws/Administrator-key-pair-useast1.pem ec2-user@EC2_INSTANCE_URL.compute-1.amazonaws.com

# copy files to ec2 instance
# docker-compose.yml
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./docker-compose.yml ec2-user@EC2_INSTANCE_URL:~

# .env
# scp -i ~/aws/Administrator-key-pair-useast1.pem ./.env ec2-user@EC2_INSTANCE_URL:~