const util = require("util");
const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const getObjectFromS3 = async (Bucket, Key) => new Promise((resolve, reject) => s3.getObject({ Bucket, Key }, (err, result) => {
    if(err) {
        return reject(err);
    }

    return resolve(result);
}));

module.exports.update = async (event, context, callback) => {
    console.log(JSON.stringify(event, null, 4));

    const { eventName } = event.Records[0];
    const { Bucket } = event.Records[0].s3.bucket.name;
    const { Key } = event.Records[0].s3.object;

    try {
        const file = await getObjectFromS3(Bucket, Key);

        console.log(JSON.stringify(file, null, 4));
        
        callback();
    }
    catch(error) {
        console.log(error.message);
        callback(error);
    }
};
