const shortId = require("shortid");
const urlModel = require("../model/urlmodel");
const validUrl=require('valid-url')
const { GET_ASYNC, SET_ASYNC } = require("../utils/redis");
const axios = require("axios");
const { response } = require("express");


const createUrlShorten = async (req, res) => {
  try {
    let data = req.body;
    data.longUrl = data.longUrl.trim()

    // if input is empty
     if (!data.longUrl){
       return res.status(400).send({ status: false, message: "Please, Provide URL" });
     }

    // URL is valid and string
    if(!validUrl.isWebUri(data.longUrl)){
      return res.status(400).send({status:false,message:"Your URL is not a valid URL"})
      }

    // finding the data in the cache storage----------------------------------------------------------
    const caseUrl = await GET_ASYNC(longUrl);
    //console.log(caseUrl)
    if (caseUrl) {
      return res.status(200).json({status:true, data:JSON.parse(caseUrl)});
    }    


  //  if long url already exist in DB return the respective shorturl and urlcode for it
    const dbData = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });

    if (dbData) {
      //set the data into the cache memory----------------------------------------------------------
    await SET_ASYNC(longUrl, JSON.stringify(dbData), "EX", 24 * 60 * 60);
      return res.status(201).send({ status: true, data: dbData });
    
    
    }else{

    const response= await axios
    .get(data.longUrl)
    .then(async (response) => {
// if longurl is new, create short urlcode and shorturl for it short id convert into the lower case string-----------------------------------------------
          let shortCode = shortId.generate().toLowerCase();

          const code =await urlModel.findOne({ urlCode: shortCode });
          if (code) {
            shortCode = shortId.generate().toLowerCase();;
          }

          data.urlCode = shortCode;
        // Handle successful response
        data.shortUrl = `http://${req.headers.host}/${data.urlCode}`;
      
      await urlModel.create(data);
      const saveData = await urlModel.findOne({longUrl:data.longUrl}).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });
      //set the data into the cache memory----------------------------------------------------------  
      await SET_ASYNC(longUrl, JSON.stringify(saveData ), "EX", 24 * 60 * 60);
     
      res.status(201).send({ status: true, data: saveData });
    })
    .catch((error) => {
    // Handle error
     return res.status(400).json({ status: false, message:"url link in invalid"})
    });
  }
   }catch(error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async (req, res) => {
  try {

    const fetchFromRedis = await GET_ASYNC(`${req.params.urlCode}`);
    if (fetchFromRedis) {
      res.status(302).redirect(JSON.parse(fetchFromRedis));
    }
    else {
      const url = await urlModel.findOne({ urlCode: req.params.urlCode });
      if (url) {
        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url.longUrl),"EX",24 * 60 * 60)
        res.status(302).redirect(url.longUrl);
      }
      else {
        res.status(404).send({ status: false, message: "URL Not found " });
      }
    }
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};

module.exports = { createUrlShorten, getUrl };
