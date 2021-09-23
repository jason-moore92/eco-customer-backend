var fs = require('fs');

// module.exports = function (path, callback) {
//     fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
//         if (err) {
//             callback(err);
//             throw err;
//         }
//         else {
//             callback(null, html);
//         }
//     });
// }

module.exports = async (path) => {
    return new Promise(
        (resolve, reject) => {
            try {
                const data = fs.readFileSync(path, { encoding: 'utf-8' })
                resolve(data);
            } catch (err) {
                reject(err);
            }        
        }
    );
}
