
const axios = require("../Utiles/axios_init");

const handler = async (args) => {
    let apiKey = process.env.FIREBASE_WEB_KEY;

    let response = await axios.post(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${apiKey}`, {
        dynamicLinkInfo: {
            domainUriPrefix: "https://trademantri.page.link",
            // link: "https://trademantri.in/store?id=60a7d1a85ced140026fa07b3",
            link: "https://trademantri.in",
            androidInfo: {
                androidPackageName: "com.tradilligence.TradeMantri",
                androidMinPackageVersionCode: "1",
                androidFallbackLink: "https://trademantri.in/ios.html"
            },
            iosInfo: {
                iosBundleId: 'com.apple.AppStore',
                iosIpadBundleId: 'com.apple.AppStore',
                iosFallbackLink: "https://trademantri.in/ios.html",
                iosIpadFallbackLink: "https://trademantri.in/ios.html"
            },
            navigationInfo: {
                enableForcedRedirect: true,
            },
            analyticsInfo: {
                googlePlayAnalytics: {
                    utmSource: "server",
                    utmMedium: "api",
                    utmCampaign: "test",
                    utmTerm: "test",
                },
            },
            socialMetaTagInfo: {
                socialTitle: "TradeMantri",
                socialDescription: "Small and Medium store platform",
                socialImageLink: "https://trapp-profile-bucket.s3.amazonaws.com/logo.png" //TODO:: move the bucket content to our aws and keep icon logo also.
            }
        },
        suffix: {
            option: "SHORT"
        }
    });

    if (response.status != 200) {
        console.log(response);
        return {
            "status": "Failed",
            "message": "Failed"
        }
    }

    return {
        "status": "Success",
        "message": "Console success",
        "data": response.data
    }
}

module.exports = handler;