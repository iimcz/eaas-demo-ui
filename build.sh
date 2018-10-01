#!/bin/sh

cd common/eaas-client-source
mvn package
cd ../../eaas-frontend-admin
npm install
npm run build
cd ../eaas-frontend-user 
npm install
npm run build
