FROM ubuntu:22.04

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# change work directory
RUN mkdir -p /app
WORKDIR /app

RUN apt-get update -y && apt-get upgrade -y \
    && apt-get install -y curl unzip less

# install awscli
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

# install node
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

#RUN npm install


# install serverless framework
RUN npm install -g serverless \
    && sls config credentials --provider aws --key $AWS_ACCESS_KEY_ID --secret $AWS_SECRET_ACCESS_KEY

# dynamodb-local
RUN apt-get install -y default-jre
#    && sls dynamodb install

# wscat
RUN npm install -g wscat

# npm install
COPY package*.json ./
RUN npm install
