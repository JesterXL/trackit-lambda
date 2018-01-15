"use strict";
const log = console.log;
const guid = require('./guid');

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