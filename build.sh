#!/bin/sh

cd eaas-frontend-admin
npm install
npm run build
cd ../eaas-frontend-user 
npm install
npm run build
