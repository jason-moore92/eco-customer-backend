const {decryptWithRsaPrivateKey} = require('../Utiles/crypto_helpers')

const handler = async (args) => {

  let encrypted = "XIUiTr9pfzcTmjb2/wZoagyJT8RXim29P7Y0UcwG18HjNdBUca2IwI5I/Zp3UcRE+nOVle3m0i/0XZnqXpTnrJMU7cTxnigPlEfMdNFFZT16KFIamDcXOnZ1+UBWnNBzOu2Xegknb9G35SkjheFquqBLJrYQNS5KPxGyfPP2PgYS5B9guEiwbZEWxjLP8MJWL7SO93SYWVi8BZpyd3rfea5h5DsoGA5AQwdf/E7emkCIhzXzQTwROVyfLE0OkW61VbfDoXcH1Ypdafx7Y0HvPbldNwXrmqB/p/NWxiJW0ssV3WljRaNk/lcZP7ufZlDS/Y6ax/WUDt+Ej32JtBjBVt1O+7mad7BNLxXhf/JZ9elPPkGnIWBSIlowjsPcyLYSQP8oG/l8xxEA7qE5RWdx7QpdhkkFSABuj+f1/fRsChuhw04aIvTyvB3bgWzcEF4RW4Md5W/evN55cqUEO3852HkXS0sz2thOlYBwdkcNShzbjSCCiERZmNP5QMY/pbhu7uIqOHkUTp+HU0JIdjklQah/B+dzRm8DD2uuQ1x3pRWQEn/1pZ6KkPw8BIhEOLecuM8KBHZWRNnI4Ndz4TrQ3Y+x33GCCn/FWCmheUTTiWXEQVnxEiWAi7N5qdgPYHiwAi3tFQX21rlCXA8DLcJrE4QANmc2Hq3JrLVLdii2Xs8=";
  
  let x = await decryptWithRsaPrivateKey(encrypted, "ICICI_PRIV_KEY", false);
  console.log(x);

  return {
    "status": "Success",
    "message": "Console success"
  }  
}

module.exports = handler;