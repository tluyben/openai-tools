#!/bin/bash

docker run -e GRANT_SUDO=yes --user root -p 10000:8888 jupyter/scipy-notebook:85f615d5cafa
