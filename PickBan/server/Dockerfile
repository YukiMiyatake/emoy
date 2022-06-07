FROM ubuntu:22.04

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

# change work directory
RUN mkdir -p /app
WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y curl unzip less

# install awscli
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

# install node
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# install serverless framework
RUN npm install -g serverless \
    && sls config credentials --provider aws --key $AWS_ACCESS_KEY_ID --secret $AWS_SECRET_ACCESS_KEY

#COPY package*.json ./

# dynamodb-local
RUN apt-get install -y default-jre \
    && npm install -g dynamodb-admin 

# wscat
RUN npm install -g wscat

COPY init.sh ./
RUN chmod 755 init.sh
ENTRYPOINT bash -c "./init.sh && bash"

# npm install
#COPY serverless.yml ./
#RUN echo "aa"
#RUN npm install -D serverless-dynamodb-local
#RUN sls plugin install -n serverless-dynamodb-local
#RUN sls dynamodb install
#RUN npm install
#COPY serverless.yml ./
#COPY . .
#COPY init.sh ./
#RUN chmod 755 init.sh
#RUN ./init.sh
#npm install -D serverless-dynamodb-local
