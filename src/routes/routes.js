const express = require("express");
const { getUrl, createUrlShorten } = require("../controllers/controller.js");

const router = express.Router();

router.post("/url/shorten", createUrlShorten);

router.get("/:urlCode", getUrl);

//router.get('/authors/:authorId',fetchAuthorProfile)
module.exports = router;
