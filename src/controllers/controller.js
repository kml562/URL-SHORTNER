const isUrl = require("is-url");
const shortId = require("shortid");
const redis = require('redis');
const urlModel = require("../model/urlModel");
const { promisify } = require("util");
const isValidUrl = (urlString) => {
  var urlPattern = new RegExp("(?:https?)://.");
  return urlPattern.test(urlString);
};




//1. Connect to the redis server
const redisClient = redis.createClient(
  16319,
  "redis-16319.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("HD9lq20UOOqrDvVlWThlCIMJMovHQt0R", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const createUrlShorten = async (req, res) => {
  try {
    let data = req.body;
    data.longUrl = data.longUrl.trim();

    const dbData = await urlModel
      .findOne({ longUrl: data.longUrl })
      .select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });

    if (dbData) {
      res.status(201).send({ status: true, data: dbData });
    }
    else {
      let shortCode = shortId.generate().toLocaleLowerCase();
      const code = await urlModel.findOne({ urlCode: shortCode });
      if (code) {
        shortCode = shortId.generate().toLocaleLowerCase();
      }
      data.urlCode = shortCode;

      if (!data.longUrl)
        return res
          .status(400)
          .send({ status: false, message: "Please, Provide URL" });
      if (!isValidUrl(data.longUrl))
        return res
          .status(400)
          .send({ status: false, message: "Please, Provide valid URL" });
      if (!isUrl(data.longUrl))
        return res
          .status(400)
          .send({ status: false, message: "Please, Provide valid URL" });

      data.shortUrl = `http://localhost:3000/${data.urlCode}`;

      await urlModel.create(data);
      const saveData = await urlModel
        .findOne(data)
        .select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });
      res.status(201).send({ status: true, data: saveData });
    }
  } catch (error) {
    console.log("controller", error);
    res.status(500).send({ status: false, message: error });
  }
};

const getUrl = async (req, res) => {
  try {
    const url = await urlModel.findOne({ code: req.params.urlCode });
    if (url) {
      res.status(302).redirect(url.longUrl);
    } else {
      res.status(404).send("Not found");
    }
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
}

const fetchAuthorProfile = async function (req, res) {

  //3. Start using the redis commad
    let cahcedProfileData = await GET_ASYNC(`${req.params.authorId}`)
    if(cahcedProfileData) {
      res.send(cahcedProfileData)
    } else {
      let profile = await urlModel.findById(req.params.authorId);
      await SET_ASYNC(`${req.params.authorId}`, JSON.stringify(profile))
      res.send({ data: profile });
    }
  
  };

module.exports = { createUrlShorten, getUrl };
