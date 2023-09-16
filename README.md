![test status](https://github.com/emulation-as-a-service/demo-ui/actions/workflows/test.yml/badge.svg)

# Quick start
0) Create config.json from config.json.template

*$PROJECTDIR$/src/public/config.json*


1) Retrieve dependencies

```
npm install
```

2) Start server (for dev only)

```
npm start
```
3) Build distribution (production)

`npm run build`

Code will be in ***dist*** directory

## Important things to consider
1) You may want to change the port for web server (step 2)  in webpack.config.js   
2) You could change ***PRODUCTION_BASE_PATH*** in `webpack.config.js `             
3) If you want to add additional library, change package.json