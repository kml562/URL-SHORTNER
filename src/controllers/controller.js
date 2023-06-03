const shortId = require("shortid");
const urlModel = require("../model/urlmodel");
const validUrl=require('valid-url')
const dotenv = require('dotenv').config() 



const createUrlShorten = async (req, res) => {
  try {
    let data = req.body;
    data.longUrl = data.longUrl.trim()

    // if input is empty
     if (!data.longUrl)
       return res.status(400).send({ status: false, message: "Please, Provide URL" });

    // URL is valid and string
    if(!validUrl.isWebUri(data.longUrl)){
      return res.status(400).send({status:false,message:"Your URL is not a valid URL"})
      }

  //  if long url already exist in DB return the respective shorturl and urlcode for it
    const dbData = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, longUrl: 1, shortUrl: 1, urlCode: 1 });

    if (dbData) {
      return res.status(201).send({ status: true, data: dbData });
    }

    // if longurl is new, create short urlcode and shorturl for it 
      let shortCode = shortId.generate()
     
      data.urlCode = shortCode;
//     create short url
      data.shortUrl = `http://localhost:${process.env.PORT}/${shortCode}`;

      const saveData =await urlModel.create(data);
      res.status(201).send({ status: true, data: saveData });
    
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async (req, res) => {
  try {
//     checking if data is present in our DB with that long url
    const url = await urlModel.findOne({ urlCode: req.params.urlCode });
    if (url) {
//       redirecting it to that page 
      res.status(302).redirect(url.longUrl);
    } else {
      res.status(404).send({status: false, message:"Not found"});
    }
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
}

module.exports = { createUrlShorten, getUrl };
