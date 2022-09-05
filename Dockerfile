# Usage to build locally:
# docker build . && docker cp "$(docker create "$(docker build -q .)" /):/eaas-frontend-admin" .

FROM node:lts AS build

WORKDIR /build
COPY . .
RUN ./build.sh

FROM scratch
COPY --from=build /build/eaas-frontend-admin/dist/ eaas-frontend-admin
COPY --from=build /build/landing-page/dist/ landing-page
