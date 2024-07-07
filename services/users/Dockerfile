FROM python:3.11-slim-buster

ENV PYTHONPATH=/home/code/ PYTHONHASHSEED=0

WORKDIR /usr/src/users

COPY app/ app/
COPY ./.env ./requirements.txt ./main.py ./

RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install --upgrade setuptools
RUN python3 -m pip install -r requirements.txt