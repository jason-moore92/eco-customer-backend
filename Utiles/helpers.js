const convertEmailUnique = (user) => {
    const id = user._id.toString();
    let emailParts = user.email.split("@")

    return [
        emailParts[0]+"+"+id, 
        emailParts[1]
    ].join("@");
}

module.exports = {
    convertEmailUnique
}