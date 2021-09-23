
const axios = require("./axios_init");

const sendViaTextLocal = async (number, message) => {
    let params = {
        apiKey: process.env.TEXT_LOCAL_API_KEY,
        sender: "TRDMTR",
        numbers: number,
        message: message
    }
    let queryStr = new URLSearchParams(params).toString();
    let url = `https://api.textlocal.in/send?${queryStr}`;
    let response = await axios.get(url);

    if(response.status != 200){
        console.log(response)
    }

    let responseData = response.data;

    if(responseData.code){
        console.log(responseData);
    }
    
    return responseData;
}


const send = async (number, message) => {
    return await sendViaTextLocal(number, message);
}

module.exports = {
    send
}