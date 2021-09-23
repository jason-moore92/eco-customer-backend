const axios = require('axios');
const moment = require('moment');


const exotelApi = async (type, phoneNumber, isStorePhone) => {
    var apiUrl = process.env.ExotelApiUrl;
    apiUrl = apiUrl.replace("exotelApiKey", process.env.exotelApiKey);
    apiUrl = apiUrl.replace("exotelApiToken", process.env.exotelApiToken);
    apiUrl = apiUrl.replace("exotelSubDomain", process.env.exotelSubDomain);
    apiUrl = apiUrl.replace("exotelAccountSID", process.env.exotelAccountSID);

    console.log("======== exotelApi start ===================");
    console.log(phoneNumber);
    console.log(type);

    var todaysDate = new Date()
    var currentYear = todaysDate.getFullYear();
    var currentMonth = todaysDate.getMonth();
    var currentDate = todaysDate.getUTCDate();

    var todayTimeStr = currentYear + "-" + (currentMonth + 1) + "-" + currentDate;

    var tH = process.env.TIMEZONE.split(":")[0];
    var tM = process.env.TIMEZONE.split(":")[1];
    var oH = process.env.OPENTIME.split(":")[0];
    var oM = process.env.OPENTIME.split(":")[1];
    var cH = process.env.CLOSETIME.split(":")[0];
    var cM = process.env.CLOSETIME.split(":")[1];

    /////////
    var openTime = moment(todayTimeStr, "YYYY-MM-DD hh:mm:ss").utc();
    openTime.add(oH, 'hours').add(oM, 'minutes');
    openTime.subtract(tH, 'hours').add(tM, 'minutes');
    ///////

    var currentTime = moment().utc();

    /////
    var closeTime = moment(todayTimeStr, "YYYY-MM-DD hh:mm:ss").utc();
    closeTime.add(cH, 'hours').add(cM, 'minutes');
    closeTime.subtract(tH, 'hours').add(tM, 'minutes');
    /////

    console.log(openTime);
    console.log(openTime.utc());
    console.log(currentTime);
    console.log(closeTime);
    console.log(!(currentTime.isAfter(openTime) && currentTime.isBefore(closeTime)));

    if (!(currentTime.isAfter(openTime) && currentTime.isBefore(closeTime)) && isStorePhone) {
        return;
    }

    if (process.env.NODE_ENV === "development") {
        phoneNumber = process.env.exotelTestPhoneNumber;
        console.log(phoneNumber);
    }

    var callerId = "";
    var appId = "";

    if (type === "order_placed") {
        callerId = process.env.exotelOrderPlacedCallerId;
        appId = process.env.exotelOrderPlacedAppId;
    } else if (type === "order_accepted") {
        callerId = process.env.exotelOrderAcceptedCallerId;
        appId = process.env.exotelOrderAcceptedAppId;
    } else if (type === "create_bargain_request") {
        callerId = process.env.exotelCreateBargainRequestCallId;
        appId = process.env.exotelCreateBargainRequestAppId;
    } else if (type === "create_reverse_auction") {
        callerId = process.env.exotelCreateBargainRequestCallId;
        appId = process.env.exotelCreateBargainRequestAppId;
    }

    apiUrl += `?From=${phoneNumber}`;
    apiUrl += `&CallerId=${callerId}`;
    apiUrl += `&Url=http://my.exotel.com/trademantri1/exoml/start_voice/${appId}`;

    console.log(apiUrl);

    return await axios.post(apiUrl)
    // .then(function (response) {
    //     console.log("==== response.status ====");
    //     console.log(response.status);
    // })
    // .catch(function (error) {
    //     // handle error
    //     console.log("==== exotelApi error ====");
    //     console.log(error.code);
    //     console.log(error.message);
    // })
    // .then(function () {
    //     // always executed
    // });

}

module.exports = exotelApi;