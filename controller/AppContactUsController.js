const express = require("express");
const router = express.Router();
const Contact = require("../model/AppContactUs");
var Handler = require('../Utiles/Handler');
var message = require('../localization/en.json')

//TODO:: remove userId from contact because not using, check with abhi
router.post("/add", async (req, res, next) => {
  const contact = new Contact();
  try {
    if (req.body.userId) {
      contact.userId = req.body.userId;
    } else {
      contact.userId = "";
    }

    if (req.body.name) {
      contact.name = req.body.name;
    } else {
      contact.name = "";
    }
    if (req.body.category) {
      contact.category = req.body.category;
    } else {
      contact.category = "";
    }

    if (req.body.priority) {
      contact.priority = req.body.priority;
    } else {
      contact.priority = "";
    }
    
    if (req.body.phone) {
      contact.phone = req.body.phone;
    } else {
      contact.phone = "";
    }

    if (req.body.email) {
      contact.email = req.body.email;
    } else {
      contact.email = "";
    }

    if (req.body.reason) {
      contact.reason = req.body.reason;
    } else {
      contact.reason = "";
    }
    
    const contactData = await Contact.create(contact);
    return res.status(200).send({ "success": true, "data": contactData});
  } catch (err) {
    console.error(err);
    next(err);
  }
});

const install = app => app.use("/api/v1/contact", router);

module.exports = {
  install
};
