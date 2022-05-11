FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/include/


ARG BOOST_VERSION
ARG BOOST_VERSION_
ENV BOOST_VERSION=${BOOST_VERSION}
ENV BOOST_VERSION_=${BOOST_VERSION_}
ENV BOOST_ROOT=/usr/include/boost

RUN apt-get -qq update && apt-get install -q -y software-properties-common \
    && add-apt-repository ppa:ubuntu-toolchain-r/test -y \
#    && apt-get -qq update && apt-get install -qy g++ gcc git wget \
    && apt-get -qq update && apt-get install -qy clang git wget

RUN wget --max-redirect 3 https://boostorg.jfrog.io/artifactory/main/release/${BOOST_VERSION}/source/boost_${BOOST_VERSION_}.tar.gz \
    && mkdir -p /usr/include/boost && tar zxf boost_${BOOST_VERSION_}.tar.gz -C /usr/include/boost --strip-components=1 \
    && rm boost_${BOOST_VERSION_}.tar.gz

RUN cd ${BOOST_ROOT} \
    && ./bootstrap.sh \
    && ./b2 --without-python --prefix=/usr -j 4 link=shared runtime-link=shared install \
    && cd .. \
    && rm -rf boost_${BOOST_VERSION_} \
    && ldconfig

RUN echo ${BOOST_ROOT}
ENTRYPOINT /bin/bash