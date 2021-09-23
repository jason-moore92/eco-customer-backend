
//Note:: List of urls that expect the rawBody (Content-type: text/plain)
const urls = [
    "icici/callback"
];
const rawBody = (req, res, next) => {
    let urlPart = req.url.replace("/api/v1/", "")

    if(urls.indexOf(urlPart) >= 0){
        req.setEncoding('utf8');
        req.rawBody = '';
        req.on('data', function (chunk) {
            req.rawBody += chunk;
        });
        req.on('end', function () {
            next();
        });    
    }else{
        next();
    }

}

module.exports = rawBody;