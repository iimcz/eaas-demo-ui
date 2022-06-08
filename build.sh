#!/bin/sh

npm ci --legacy-peer-deps

cd eaas-client
git submodule init
git submodule update
cd ..

cd landing-page
npm ci --legacy-peer-deps && \
npm run build && \
cd ../eaas-frontend-admin && \
npm ci --legacy-peer-deps && \
npm run build
