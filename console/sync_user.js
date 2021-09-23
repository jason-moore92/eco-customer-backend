const { isValidObjectId } = require("mongoose");
const AppUser = require("../model/AppUser");
const { syncUser } = require("../Utiles/community");

/**
 * Sync user details in community server (Discourse)
 */
const handler = async (args) => {

  let { identifier } = args;

  let isId = isValidObjectId(identifier);

  let user;

  if(isId){
    user = await AppUser.findById(identifier);
  }

  if(!user){
    user = await AppUser.findOne({
      $or: [
        { email:  identifier},
        { mobile: identifier}
      ]
    });
  }


  if(!user){
    return {
      "status": "Error",
      "message": "No user to sync."
    }
  }

  await syncUser(user);

  return {
    "status": "Success",
    "message": "Console success"
  }  
}

module.exports = handler;