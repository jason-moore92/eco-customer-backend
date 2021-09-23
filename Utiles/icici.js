
const axios = require("./axios_init");
const moment = require('moment');
const { encryptWithRsaPublicKey, decryptWithRsaPrivateKey } = require("./crypto_helpers");
const ICICIException = require('./exceptions/icici_exception');

const apiResponseCodes = {
    "92": "Transaction Initiated",
    "0": " Transaction successful",
    "1 ": "User profile not found",
    "4 ": "Response parsing error",
    "9 ": "Transaction rejected",
    "10 ": "Insufficient data",
    "99 ": "Transaction cannot be processed",
    "5000 ": "Invalid Request",
    "5001 ": "Invalid MerchantID",
    "5002 ": "Duplicate MerchantTranId",
    "5003 ": "Merchant Transaction Id is mandatory",
    "5004 ": "Invalid Data",
    "5005 ": "Collect By date should be greater than or equal to Current date",
    "5006 ": "Merchant TranId is not available",
    "5007 ": "Virtual address not present",
    "5008 ": "PSP is not registered",
    "5009 ": "Service unavailable. Please try later.",
    "5011 ": "This transaction is already processed (Online duplicate transaction)",
    "5012 ": "Request has already been initiated for this transaction (Offline duplicatetransaction)",
    "5013 ": "Invalid VPA",
    "5014 ": "Insufficient Amount",
    "8000": "Invalid Encrypted Request",
    "8001 ": "JSON IS EMPTY",
    "8002 ": "INVALID_JSON",
    "8003 ": "INVALID_FIELD FORMAT OR LENGTH",
    "8004 ": "MISSING_REQUIRED_FIELD_DATA",
    "8005 ": "MISSING_REQUIRED_FIELD",
    "8006 ": "INVALID_FIELD_LENGTH",
    "8007 ": "Invalid JSON,OPEN CURLY BRACE MISSING",
    "8008 ": "Invalid JSON,END CURLY BRACE MISSING",
    "8009 ": "Internal Server Error",
    "8010": "Internal Service Failure",
    "8011 ": "INTERNAL_SERVICE_FAILURE",
    "default": "Transaction has failed",
};

const callICICI = async (path, requestData) => {

    let encryptedData = await encryptWithRsaPublicKey(JSON.stringify(requestData), "ICICI_PUB_KEY");

    const headers = {
        "Content-Type": "text/plain",
        // "Accept": "*/*",
        // "Accept-encoding": "*",
        // "Cache-control": "no-cache",
    };
    let response;
    try {
         response = await axios.post(`${process.env.ICICI_BASE}/${path}`, encryptedData, {
            headers: headers
        });
    }
    catch (err) {
        console.log(err)
        response = err.response;
        if(response){
            console.log(response.status, response.statusText, response.headers, response.config)
        }
        console.log(requestData)
        throw new ICICIException("ICICI:Invalid response", {
            status: response.status,
            body: response.body
        });
    }

    let responseData = response.data;
    let decryptedData = await decryptWithRsaPrivateKey(responseData, "ICICI_PRIV_KEY");
    decryptedData = JSON.parse(decryptedData);
    console.log({ responseData, decryptedData, requestData, encryptedData });

    if(decryptedData.status && decryptedData.status == "FAILURE"){
        throw new ICICIException("ICICI:Invalid response", decryptedData);
    }

    if (decryptedData.success == "false") {
        throw new ICICIException("ICICI:Invalid response", decryptedData);
    }

    return decryptedData;
}

/**
 * Response keys: response,merchantId, subMerchantId, terminalId, Success, Message, merchantTranId, BankRRN
 */
const collect = async (params) => {
    let { vpa, amount, subMerchantId, subMerchantName, mcc, note, billNumber = null, tranId = null } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "merchantId": process.env.ICICI_MID,
        "merchantName": process.env.ICICI_MER_NAME,
        "subMerchantId": subMerchantId || process.env.ICICI_MID,
        "subMerchantName": subMerchantName || process.env.ICICI_MER_NAME,
        "terminalId": mcc || "5411",
        "merchantTranId": tranId,
        "billNumber": billNumber || tranId,
        "payerVa": vpa || "testo12@icici",
        "amount": amount, //Must be string and double digit after .
        "note": note,
        "collectByDate": moment().add(process.env.ICICI_COLLECT_EXPIRE || 60, 'minutes').format("DD/MM/YYYY hh:mm A")
    };
    return await callICICI(`CollectPay2/${process.env.ICICI_MID}`, data);
}

/**
 * Response keys: response,merchantId, subMerchantId, terminalId, Success, Message,amount,  merchantTranId, OriginalBankRRN, Status
 * Status values: PENDING, SUCCESS, FAILURE
 */
const transactionStatus = async (params) => {
    let { tranId, subMerchantId, mcc } = params;
    let data = {
        "merchantId": process.env.ICICI_MID,
        "subMerchantId": subMerchantId || process.env.ICICI_MID,
        "terminalId": mcc || "5411",
        "merchantTranId": tranId,
    };
    return await callICICI(`TransactionStatus1/${process.env.ICICI_MID}`, data);
}

/**
 * Response keys: response,merchantId, subMerchantId, terminalId, Success, Message,amount,  merchantTranId, OriginalBankRRN, Status, TxnInitDate, TxnCompletionDate
 * Status values: PENDING, SUCCESS, FAILURE
 * Type values: C => collect pay, R => Refund, Q => QR tran, P => Push trans
 */
const transactionStatusNew = async (params) => {
    let { tranId, subMerchantId, mcc, type = "C", date, rrn, refId } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "merchantId": process.env.ICICI_MID,
        "subMerchantId": subMerchantId || process.env.ICICI_MID,
        "terminalId": mcc || "5411",
        "merchantTranId": tranId, // mandatory in case of C,R,Q 
        "transactionType": type,
        "transactionDate": date, // Required if using refId
        "BankRRN": rrn, // Can be used in P, but still not a mandatory
        "refId": refId // Can be used in P, but still not a mandatory
    };
    return await callICICI(`CallbackStatus2/${process.env.ICICI_MID}`, data);
}

/**
 * Response keys: merchantId, subMerchantId, terminalId,BankRRN,   merchantTranId, PayerName, PayerMobile ,PayerVA, PayerAmount,  TxnStatus, TxnInitDate, TxnCompletionDate
 * TxnStatus values: SUCCESS, REJECT (for all scenarios)
 */
const processCallback = async (data) => {
    //TODO:: any authenticity test
    let decryptedData = await decryptWithRsaPrivateKey(data, "ICICI_PRIV_KEY");
    console.log(decryptedData);
    return decryptedData;
}

/**
 * Response keys: response,merchantId, subMerchantId, terminalId, Success,  status, Message, merchantTranId, OriginalBankRRN
 * onlineRefund: Y -> instant refund, N -> settle T+1 day
 */
const refund = async (params) => {
    let { originalBankRRN, refundAmount, vpa, subMerchantId, mcc, originalmerchantTranId, tranId = null, note, onlineRefund = "Y" } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "merchantId": process.env.ICICI_MID,
        "subMerchantId": subMerchantId || process.env.ICICI_MID,
        "terminalId": mcc || "5411",
        "merchantTranId": tranId,
        "originalBankRRN": originalBankRRN,
        "refundAmount": refundAmount,
        "payeeVA": vpa,
        "originalmerchantTranId": originalmerchantTranId,
        "note": note,
        "onlineRefund": onlineRefund
    };
    return await callICICI(`Refund/${process.env.ICICI_MID}`, data);
}

/**
 * Response keys: response,merchantId,  terminalId, Success, Message, merchantTranId, refId
 */
const getQRReference = async (params) => {
    let { amount, mcc, tranId = null, billNumber = null } = params;
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let data = {
        "merchantId": process.env.ICICI_MID,
        "terminalId": mcc || "5411",
        "merchantTranId": tranId,
        "amount": amount,
        "billNumber": billNumber || tranId,
    };
    return await callICICI(`QR/${process.env.ICICI_MID}`, data);
}

const generateUPIIntent = async (params) => {
    let { merchantVPA, amount, merchantName, mcc, tranId = null } = params;
    let intent = "upi://pay?";
    if (!tranId) {
        tranId = `TM${moment().format('x')}`;
    }
    let QRReferenceData = await getQRReference({amount, mcc, tranId});
    console.log(QRReferenceData)
    let queryData = {
        pa: merchantVPA || process.env.ICICI_MER_VPA,
        pn: merchantName || process.env.ICICI_MER_NAME,
        tr: QRReferenceData.refId,
        am: amount,
        cu: "INR",
        mc: mcc || "5411"
    };

    let queryString = new URLSearchParams(queryData).toString();

    return {"intent": intent + queryString};
}


module.exports = { collect, transactionStatus, processCallback, refund, generateUPIIntent, transactionStatusNew }