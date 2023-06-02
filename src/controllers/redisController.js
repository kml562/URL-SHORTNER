const redis = require('redis');
const { promisify } = require('util')
const urlModel = require("../model/urlModel");

const redisClient = redis.createClient(
    16319,
    "redis-16319.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true });

redisClient.auth("HD9lq20UOOqrDvVlWThlCIMJMovHQt0R", function (err) {
    if(err) throw err;
})
redisClient.on("connect", async function () {
    console.log("Connected to redis..")
})


//2. Prepare the functions for each command

// const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
// const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// const fetchAuthorProfile = async function (req, res) {

//     //3. Start using the redis commad
//       let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
//       if(cahcedProfileData) {
//         res.send(cahcedProfileData)
//       } else {
//         let profile = await urlModel.findById(req.params.authorId);
//         await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
//         res.send({ data: profile });
//       }
    
// };
// module.exports = fetchAuthorProfile;