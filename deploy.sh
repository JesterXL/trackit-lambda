zip -r deploy.zip package.json index.js guid.js users.js node_modules
aws lambda update-function-code \
--function-name trackit \
--zip-file fileb://deploy.zip