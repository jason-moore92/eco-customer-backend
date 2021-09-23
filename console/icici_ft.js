const {decryptResponse} = require('../Utiles/icici_ft')


const handler = async (args) => {


  let responses = [
    {
      requestId: '',
      service: 'UPI',
      encryptedKey: 'srfl2uBqSxV6qSBjpJ7u34Rz8hO0e4rT8GC+3l2r+YLyvkEBhOkXyiT89mZ3T7+LdUco3yckfTrHhM0YLnUOWZ2hF2Ih641rMkAPUP2DVB2u/wn98tLF93DecQQp4OZo5/eKu82aotMxChl2Rwko9DQHWG+k6iRc20OYUA/NcEWhFApdPPrQfT/5ahvC2D4fuqy3+KIA7rgPBLkF6na9dc/Sfx/yxQEyJIPIICpaD8QsgkkDhU/npX9JsEHMy9eRmH4R9EEet5KCQa6KX4ST5xK+ICuSooSDmCKuty4y2pR9CK0ZnkY8XGJ8SV7upjyezf5r6jLlbD25cH5o0jcasNL7TKxCupqZ4JFYTVjWE2cdVqxa7bTx2LNdwOaKrmg3673yHmQIjD/v9P815yR5YohS9CJXqchW3W+koA5H7a45ufVmUfoDc++A8EsqOB2jJLnDBeZ2L8qJ197U4vGhsYL6ZPIx+Nsteuv4JEfUyc/lw9lbtQRKpwZ2pRIxAG+jwc68oL0teSj9+r3kMrYPXsX8P20TubADyu7mVRDsFxJZ3Tp9tqmVrRihuf48eM1Bxppyfz3wogBVVcD5BAMDCY+B78Npo3u2FrrSDykDEEf6VWvEZmINXo1uL2bSVAEvvEhtwdGLXycuyLkuAg7BypVnViNDr8j9EnMobqwZFuQ=',
      oaepHashingAlgorithm: 'NONE',
      iv: '',
      encryptedData: 'yVTtJ9dUnbiv5M6tbwQnqdCTe/99k+nO5I2vjWJRR5+AtJmY4kJaDv89cKETVj4QABsKpehU4LnaZMHRV7AsgIiBIfvFVfvnyQCznq0wheVO5y1SmZR2pBRCwwJhCZeeiKbRjxOGc2uRMLrQV/eLufyuI3fp/l0hIV6DjCj7HMtxNZ/nlRI6GIL/VlCbjLR62X+gQFAK9+Qc0bpZkhH11Bxte1xL6kik6NHm5dWcG9Iuo/UnP36nZ/P6kpTujpoTL7la/turHdtjVJsqliCLG2ISYsbMTmbBNkr1AXFTHDk=',
      clientInfo: '',
      optionalParam: ''
    },
    {
      requestId: '',
      service: 'UPI',
      encryptedKey: 'fXbHxsXqTS5C4k5HdmvI9fCUFk+eB5IwuSkRg3ddoDpT2rWA+rFHy3jvCBW6dNX0erhyvpt4x+YNeAL8ywcwZA8UrXhNtdOoW4jvyH2GlUg2ZJQ9Aw3PPM2IOTTqe0tyDCmiJnFUE+sjg27+OSunecBsnxazCTEvjDaaYCrIZXF8AVtkzWvYCNaRevdSPC8LbMGaK9LYw2GhXqMaj7CIn3gZ4cnCqWfENpaVZ2MfvutPRpHs/dTorX6Xr9QGebkjFRU3f5SvtDayETRC8n5hYJZa7eRmGXwL5Snnj7RKp0Wqs0vjuWeJalpSAXG8CbQTFGGGrM1N6zcst3PNSxJIqoTPwiGag3jid+A4q73UCaucrYSOgPYF33BZP2bqOYtENN0bXJMzmfQtYp3FFc8JUBqiK43DncCz/Au6g2dZAyXFnoaSKVodx9ecg0ZH5PgTdCCLdjCz3fczD7qIXmEbgHFj7F7PY5jTg11CtAkn9/phxUGIjpHkTjjrPsTgia36kAsKvEoKRDy+XtAKRaUyq3WLJMmTLaMB4f82JzyYZxi0U9KQJITZmrcFxOWmR7pF9FgjKQWToHmvxyNFVdd1alxw4hdyLGmhK7uGZNd+j7iUT87R8u/8QTh2ZXJQY4Fq/K1HW5p540779jQgWNIobM4dJFCa3Gr8oHIkO1f7ntg=',
      oaepHashingAlgorithm: 'NONE',
      iv: '',
      encryptedData: 'KMTLJ9/pR28ja8ncDm6nFpfv5tGc1VTmnp5Nu6RY35uM/xoMTgNEAusWrN9cJlD8LhtF3zxvFyEHDX0p6cqHjB15Xr9B7HBjVEbtDgnz2zywrdH4dHSk3toT0mQO9a3goE3+nyZDq2RVfPT6ZTx/VAitwnjkqdyLxCZNjILofXMOK6WmDC2IZhQTv7dJsjNqeoiypAJPlc8ofx0gQ/zzEydHO4ctNPzeus3x9M+7PMqdWTvyIoR2q5Xv1dntLTQ0eetX3jEMo2HfcXdpEEhsthS/WPjN3LCCdX/UiapmCuQ=',
      clientInfo: '',
      optionalParam: ''
    },
    {
      requestId: '',
      service: 'UPI',
      encryptedKey: 'SEQchHIMW9/0+PIbMkARHZ1ULukBoX5fAVO2nil+jJ4tinrOgoqTW1ODjKVFm4xGC4Goyyv0qf8kyYifmn4LC6oPLOuuTk9aJhDCCWt+C5wvmaIAcsfjf5Ycc+xdygWB73JUOSTn9rYvNrhq12e8pDXIAB7jtEI5UCEYqaWiZfTm4o7GkikbNl5MWdigr/xUsnO0WGd6RhhBGroaMU5UMt3LArSQB2pQxyv4wk3XcUrNLxjzL336N5726B1qXpvb1zKfNH7v7eGURWXRxkvXjodZEiGkLxrs6ACFV7qO14YHJlQG5aG1bErFlGh0uAJ1umicn8RfCowQ2Sg6QY2MoU8Ri1t4vBHNSzX1dYl8NyKtfvdzNPeA8pIPsrLM04K+7t6odhMSwfFiEM82KGpF5zoAS/MKG+9BNKP22X0JeSty9+KxhcnLdCmsk70WuOB3qhkAGb/my+1BVdUwSbVmaLVOw8QjXEyDpfSkAJwfcwqNMv2TFIUDKbZgU+5Ev1Q0jv33hCGQeTKrT8kqqnQgcn2HM+61d0dVoDB/UAkx8MvFsLElvC1CjZtqzfJQPRTXWD8qxygUtoQpRKVUV02FifpPfuqbFSrhS1tovB9Cs4FCN9ypJeBf03vjbazL7MOTOmgRhXhhR+4n3gRithz1AMFHCOtclS34beXe0HgSe/4=',
      oaepHashingAlgorithm: 'NONE',
      iv: '',
      encryptedData: 'Wf5v2Hws+89NKYgZsZHsuEntrR2vc6NUXuhpY9pvUTugFyN8SmVlwsgJZuNNoeQZkq1bfhNOMA6HjsjkX4zbfQ==',
      clientInfo: '',
      optionalParam: ''
    }
  ]


  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    let x = await decryptResponse(response);
    console.log(x);      
  }
  

  return {
    "status": "Success",
    "message": "Console success"
  }  
}

module.exports = handler;