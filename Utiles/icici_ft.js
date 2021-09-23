
const axios = require("./axios_init");
const moment = require('moment');
const { encryptWithRsaPublicKey, decryptWithRsaPrivateKey, encryptAES, generateCryptoRandom, decryptAES } = require("./crypto_helpers");
const ICICIException = require('./exceptions/icici_exception');

const encryptRequest = async (requestData) => {
    let sessionKey = await generateCryptoRandom(8);
    let iv = await generateCryptoRandom(8);

    let encryptedKey = await encryptWithRsaPublicKey(sessionKey, "ICICI_PUB_KEY");

    let encryptedData = await encryptAES(requestData, sessionKey, iv);

    return {
        "requestId": "",
        "service": "PaymentApi",
        "encryptedKey": encryptedKey,
        "oaepHashingAlgorithm": "NONE",
        "iv": Buffer.from(iv).toString('base64'),
        "encryptedData": encryptedData,
        "clientInfo": "",
        "optionalParam": "",
    };
}

const decryptResponse = async (responseData) => {
    let iv = responseData.iv;
    let sessionKey = await decryptWithRsaPrivateKey(responseData.encryptedKey, "ICICI_PRIV_KEY");
    let decryptedData = await decryptAES(responseData.encryptedData, sessionKey, iv);
    return decryptedData;
}

const callICICI = async (path, requestData, additionalHeaders = {}) => {
    let xPriority = additionalHeaders["x-priority"];

    let encryptedData = await encryptRequest(JSON.stringify(requestData));

    let apiKey = process.env.ICICI_FT_API_KEY;
    // if(xPriority && ( xPriority[3]=="1")){ //xPriority[2] == "1" ||
    //     apiKey = process.env.ICICI_FT_API_KEY1;
    // }

    if(!xPriority){
        apiKey = process.env.ICICI_FT_API_KEY1;
    }

    const headers = {
        "Content-Type": "application/json",
        "apikey": apiKey
    };
    let response;
    console.log({requestData, encryptedData});
    try {
        let url = path[0] == "/" ? `${process.env.ICICI_FT_BASE}/${path}` : `${process.env.ICICI_FT_BASE}/api/v1/${path}`
        response = await axios.post(url, encryptedData, {
            headers: { ...headers, ...additionalHeaders }
        });
    }
    catch (err) {
        console.log(err)
        response = err.response;
        if (response) {
            console.log(response.status, response.statusText, response.headers, response.config)
        }
        console.log(requestData)
        throw new ICICIException("ICICI:Invalid response", {
            status: response.status,
            body: response.body
        });
    }
    console.log(response)

    let responseData = response.data;
    let decryptedData = await decryptResponse(responseData);
    decryptedData = JSON.parse(decryptedData);
    console.log({ responseData, decryptedData });

    if (decryptedData.status && decryptedData.status == "FAILURE") {
        throw new ICICIException("ICICI:Invalid response", decryptedData);
    }

    if (decryptedData.success == "false") {
        throw new ICICIException("ICICI:Invalid response", decryptedData);
    }

    return decryptedData;
}

const initiationModes = {
    "00": "Default",
    "01": "QR Code",
    "02": "Secure QR Code",
    "03": "Bharat QR Code",
    "04": "Intent",
    "05": "Secure Intent",
    "06": "NFC",
    "07": "BLE(Bluetooth)",
    "08": "UHF(Ultra High Frequency)",
    "09": "Aadhaar",
    "10": "SDK",
    "11": "UPI-Mandate",
    "12": "FIR(Foreign Inward Remittance)",
    "13": "QR Mandate",
    "14": "BBPS"
};

const purposes = {
    "00": "Default",
    "01": "SEBI",
    "02": "AMC",
    "03": "Travel",
    "04": "Hospitality",
    "05": "Hospital",
    "06": "Telecom",
    "07": "Insurance",
    "08": "Education",
    "09": "Gifting",
    "10": "Other"
};

const transferTypes = {
    "UPI": "1000",
    "IMPS": "0100",
    "NEFT": "0010",
    "RTGS": "0001"
};

//Note:: divide transfer to 4 parts
/**
 * Response keys: 
 */
const transfer = async (params, transferType = "UPI") => {

    if (Object.keys(transferTypes).indexOf(transferType) >= 0) {
        transferType = transferTypes[transferType];
    }


    let {
        deviceId, mobile, cc, profileId, tranId = null, accountNumber, useDefaultAcc = true, accountType = "UNKNOWN", vpa, amount,
        payerVPA,
        preApproved = "A", defaultDebit = "N", defaultCredit = "N", txnType = "merchantToPersonPay", remarks, mcc,
        bcId, aggrID, aggrName, corpID, userID, urn, addressType = "ACCOUNTIFSC", refId, payeeAccount, payeeIFSC, payeeName,
        paymentRef, payerAccount,
        rcode, passCode,
        narration1, narration2,
    } = params;

    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }

    let data = {
        "amount": amount,
    }

    let isICICI = false;

    if(payeeIFSC && payeeIFSC.substr(0,4) == "ICIC"){
        isICICI = true;
    }

    if(transferType[0] == "1"){
        let upiData = {
            "device-id": deviceId || process.env.ICICI_FT_DID,
            "mobile": mobile || process.env.ICICI_FT_MOB,
            "channel-code": cc || process.env.ICICI_FT_CC,
            "profile-id": profileId || process.env.ICICI_FT_PID,
            "seq-no": tranId,
            // "account-number": accountNumber,
            "account-provider": "74",
            "use-default-acc": useDefaultAcc ? "D" : "N", // D => default account, N => use account number and ifsc provided
            // "account-type": accountType,
            "payee-va": vpa,
            "payer-va": payerVPA || process.env.ICICI_FT_VPA,
            "pre-approved": preApproved, // A=Pre-approved, M=MPIN required, P=for M2P
            "default-debit": defaultDebit, //D or N , linked to `use-default-acc`
            "default-credit": defaultCredit, //D or N , linked to `use-default-acc`
            // "currency": "INR",
            "txn-type": txnType, //‘merchantToPersonPay’, ‘payRequest’, ‘payMerchantRequest’, ‘paytoGlobal’
            "remarks": remarks,
            "mcc": mcc,
            "merchant-type": "ENTITY", //ENTITY
            // "corpID": corpID || process.env.ICICI_FT_CORPID,
            // "userID": userID || process.env.ICICI_FT_USERID,
            // "urn": urn,
            // "global-addresstype": addressType, //MOBILEMMID/ACCOUNTIFSC/AADHAR
            // "payee-account": payeeAccount,
            // "payee-ifsc": payeeIFSC,
            // "VPA": vpa, //Same as `payee-va`
            // "initiation-mode": "00",  // See initiationModes
            // "Purpose": "00", //see purposes
            // "ref-id": refId, //madatory for credit-card payment
            // "aggrID": aggrID || process.env.ICICI_FT_AGGRID,
        };
        data = {
            ...data,
            ...upiData
        }
    }

    if(transferType[1] == "1"){
        let impsData = {
            "localTxnDtTime": moment().format("YYYYMMDDHHmmss"), //format: YYYYMMDDHHmmss
            "beneAccNo": payeeAccount,
            "beneIFSC": payeeIFSC,
            "paymentRef": paymentRef, // NFS message, max 50 chars
            "senderName": process.env.ICICI_FT_AGGRNAME, //NFS Message, max 20
            "mobile": mobile || process.env.ICICI_FT_MOB,
            "retailerCode": rcode || process.env.ICICI_FT_RCODE,
            "passCode": passCode || process.env.ICICI_FT_PC,
            "bcID": bcId || process.env.ICICI_FT_BCID,
            // "crpId": corpID || process.env.ICICI_FT_CORPID,
            // "crpUsr": userID || process.env.ICICI_FT_USERID,
            // "aggrID": aggrID || process.env.ICICI_FT_AGGRID,
            "tranRefNo": tranId,
        };
        data = {
            ...data,
            ...impsData
        }
    }
    if(transferType[2] == "1"){
        let neftData = {
            "senderAcctNo": payerAccount || process.env.ICICI_FT_ACC,
            "beneAccNo": payeeAccount,
            "beneName": payeeName,
            "beneIFSC": payeeIFSC, //‘ICIC0000011’, ‘ICIC0001028’, ICIC0000103, ICIC0000104, ICIC0000106
            "narration1": narration1, // Originator of Remittance
            // "narration2": narration2, // Remittance information
            "crpId": corpID || process.env.ICICI_FT_CORPID,
            "crpUsr": userID || process.env.ICICI_FT_USERID,
            "urn": urn,
            "txnType": txnType || (isICICI? 'TPA': 'RGS'), //TPA for icici bank and "RGS" for non icici bank
            "WORKFLOW_REQD": "N",
            "aggrID": aggrID || process.env.ICICI_FT_AGGRID,
            "aggrName": aggrName || process.env.ICICI_FT_AGGRNAME,
            "tranRefNo": tranId,
        };
        data = {
            ...data,
            ...neftData
        }
    }

    if(transferType[3] == "1"){
        let rtgsData = {
            "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
            "CORPID": corpID || process.env.ICICI_FT_CORPID,
            "USERID": userID || process.env.ICICI_FT_USERID,
            "URN": urn,
            "AGGRNAME": aggrName || process.env.ICICI_FT_AGGRNAME,
            "UNIQUEID": tranId,
            "DEBITACC": payerAccount || process.env.ICICI_FT_ACC,
            "CREDITACC": payeeAccount,
            "IFSC": payeeIFSC,
            "AMOUNT": amount,
            "CURRENCY": "INR",
            "TXNTYPE": txnType || (isICICI? 'TPA': 'RGS'), //TPA for icici bank and "RGS" for non icici bank
            "PAYEENAME": payeeName,
            "REMARKS": remarks,
            "WORKFLOW_REQD": "N",
        };
        data = {
            ...data,
            ...rtgsData
        }
    }

    return await callICICI(`composite-payment`, data, { "x-priority": transferType});
}

/**
 * Response keys: 
 * Notes: 1. UPI status will be available upto 5 days. 
 */
const statusUPI = async (params) => {
    let { mobile, originalTranId, date, tranId = null, recon = "N", deviceId, profileId, cc } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "device-id": deviceId || process.env.ICICI_FT_DID,
        "Mobile": mobile || process.env.ICICI_FT_MOB,
        "channel-code": cc || process.env.ICICI_FT_CC,
        "profile-id": profileId || process.env.ICICI_FT_PID,
        "seq-no": tranId,
        "ori-seq-no": originalTranId,
        // "Date": moment(date).format("MM/DD/YYYY"), //MM/DD/YYYY
        // "Recon360": recon, //Y or N
    };
    return await callICICI(`composite-payment/status/imps`, data, { "x-priority": "1000" });
}

/**
 * Response keys: 
 */
const statusIMPS = async (params) => {
    let { passCode, bcId, rrn, cc, date, tranId = null, recon = "N" } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "transRefNo": tranId,
        "Passcode": passCode || process.env.ICICI_FT_PC,
        "bcID": bcId || process.env.ICICI_FT_BCID,
        // "RRN": rrn,
        // "Channel-code": cc || process.env.ICICI_FT_CC,
        // "Date": moment(date).format("MM/DD/YYYY"), //MM/DD/YYYY
        // "Recon360": recon, //Y or N
    };
    return await callICICI(`composite-payment/status/imps`, data, { "x-priority": "0100" });
}

/**
 * Response keys: 
 */
const statusNEFT = async (params) => {
    let { aggrID, corpID, userID, urn, tranId = null } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
        "CORPID": corpID || process.env.ICICI_FT_CORPID,
        "USERID": userID || process.env.ICICI_FT_USERID,
        "URN": urn,
        "UNIQUEID": tranId, //‘tranRefNo’
    };
    return await callICICI(`composite-payment/status/neft-rtgs`, data, { "x-priority": "0010" });
}

/**
 * Response keys: 
 */
const statusRTGS = async (params) => {
    let { aggrID, corpID, userID, urn, tranId = null } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
        "CORPID": corpID || process.env.ICICI_FT_CORPID,
        "USERID": userID || process.env.ICICI_FT_USERID,
        "URN": urn,
        "UNIQUEID": tranId, //‘tranRefNo’
    };
    return await callICICI(`composite-payment/status/neft-rtgs`, data, { "x-priority": "0001" });
}

/**
 * Response keys: 
 * To be used after 30 minutes of original transaction once the NEFT batch is processed
 */
const statusNEFTIncremental = async (params) => {
    let { aggrID, corpID, userID, urn, tranId = null } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
        "CORPID": corpID || process.env.ICICI_FT_CORPID,
        "USERID": userID || process.env.ICICI_FT_USERID,
        "URN": urn,
        "UTRNUMBER": tranId, //‘tranRefNo’
    };
    return await callICICI(`composite-status`, data, { "x-priority": "0010" });
}

/**
 * Response keys: 
 */
const registerBeneficiary = async (params) => {
    let { CrpId, CrpUsr, BnfName, BnfNickName, BnfAccNo, PayeeType, IFSC, AGGR_ID, URN } = params;
    let data = {
        "CrpId": CrpId,
        "CrpUsr": CrpUsr,
        "BnfName": BnfName,
        "BnfNickName": BnfNickName,
        "BnfAccNo": BnfAccNo,
        "PayeeType": PayeeType, //O for other bank and W for withinbank
        "IFSC": IFSC, // within bank ICIC0000011
        "AGGR_ID": AGGR_ID,
        "URN": URN,

    };
    return await callICICI(`/api/Corporate/CIB/v1/BeneAddition`, data);
}

/**
 * Response keys: 
 */
const registerBeneficiaryVPA = async (params) => {
    let { aggrID, corpID, userID, URN, VPA } = params;
    let data = {
        "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
        "CORPID": corpID || process.env.ICICI_FT_CORPID,
        "USERID": userID || process.env.ICICI_FT_USERID,
        "URN": URN,
        "VPA": VPA,
    };
    return await callICICI(`/api/Corporate/VPA/v1/BeneAddition`, data);
}

/**
 * Response keys: 
 */
const register = async (params) => {
    let { aggrName, aggrID, corpID, userID, URN, ALIASID } = params;
    let data = {
        "AGGRNAME": aggrName,
        "AGGRID": aggrID || process.env.ICICI_FT_AGGRID,
        "CORPID": corpID || process.env.ICICI_FT_CORPID,
        "USERID": userID || process.env.ICICI_FT_USERID,
        "URN": URN,
        // "ALIASID": ALIASID,
    };
    return await callICICI(`/api/Corporate/CIB/v1/Registration`, data);
}


module.exports = {
    transfer,
    statusUPI,
    statusIMPS,
    statusNEFT,
    statusRTGS,
    statusNEFTIncremental,
    registerBeneficiary,
    registerBeneficiaryVPA,
    register,
    decryptResponse
}