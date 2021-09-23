// Returns the ISO week of the date.
getWeek = function (date) {
    var dateTime = new Date(date.getTime());
    dateTime.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    dateTime.setDate(dateTime.getDate() + 3 - (dateTime.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(dateTime.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((dateTime.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Returns the four-digit year corresponding to the ISO week of the date.
getWeekYear = function (date) {
    var dateTime = new Date(date.getTime());
    dateTime.setDate(dateTime.getDate() + 3 - (dateTime.getDay() + 6) % 7);
    return dateTime.getFullYear();
}


module.exports = { getWeek, getWeekYear };



// // Returns the ISO week of the date.
// getWeek = function (dt) {
//     var tdt = new Date(dt.valueOf());
//     var dayn = (dt.getDay() + 6) % 7;
//     tdt.setDate(tdt.getDate() - dayn + 3);
//     var firstThursday = tdt.valueOf();
//     tdt.setMonth(0, 1);
//     if (tdt.getDay() !== 4) {
//         tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
//     }
//     return 1 + Math.ceil((firstThursday - tdt) / 604800000);
// }


// module.exports = { getWeek };

