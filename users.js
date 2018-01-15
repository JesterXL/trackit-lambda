"use strict";
const log = console.log;
const guid = require('./guid');
const curryN = require('lodash/fp/curryN');
const get = require('lodash/fp/get');
const map = require('lodash/fp/map');
const flow = require('lodash/fp/flow');
const find = require('lodash/fp/find');
const Maybe = require('folktale/maybe');
const Result = require('folktale/result');
const {Just, Nothing} = Maybe;

const createUser = curryN(3, (dynamodb, username, email) =>
{
    return new Promise((success, failure)=>
    {
        const date = new Date();
         const params = {
            Item: {
                id: {"S": guid()},
                username: {"S": username},
                email: {"S": email},
                creationDate: {"S": date.toString()}
            },
            ReturnConsumedCapacity: "TOTAL", 
            TableName: "trackit_users"
        };
        dynamodb.putItem(params, (err, data)=>
        {
            log("createUser err:", err);
            log("createUser data:", data);
            if(err)
            {
                return failure(err);
            }
            return success(data);
        });
    }); 
});

const getItems = get('Items');
const getID = get('id.S');
const getUsernameString = get('username.S');
const getEmailString = get('email.S');
const mapUser = map(item => ({
    id: getID(item),
    username: getUsernameString(item),
    email: getEmailString(item)
}));
const parseUsers = flow(getItems, mapUser);
const listUsers = dynamodb =>
{
    return new Promise((success, failure)=>
    {
        var params = {
            Limit: 25,
            Select: 'ALL_ATTRIBUTES',
            TableName: "trackit_users"
        };
        dynamodb.scan(params, (err, data)=>
        {
            if(err)
            {
                return failure(err);
            }
            return success(parseUsers(data));
        });
    }); 
};

const getUsername = get('username');
const findUserByUsername = curryN(2, (username, users) => find(user => getUsername(user) === username, users));
const findUserByUsernameMaybe = curryN(2, (username, users) =>
    findUserByUsername(username, users)
    ? Just(findUserByUsername(username, users))
    : Nothing());
const login = curryN(3, (dynamodb, username, password) =>
    listUsers(dynamodb)
    .then(findUserByUsernameMaybe(username))
    .then(maybe => maybe.matchWith({
        Just: ({value}) => Result.Ok(value),
        Nothing: () => Result.Error(new Error("Username not found."))
    })));

module.exports = {
    createUser,
    listUsers,
    login
};

// createUser(dynamodb, 'pixie', 'pixie@pixiepurls.com')
// .then(result => log("result:", result))
// .catch(error => log("error:", error));

// listUsers(dynamodb)
// .then(result => log("result:", result))
// .catch(error => log("error:", error));

// login(dynamodb, 'jesterxl', 'cow')
// .then(log)
// .catch(log);