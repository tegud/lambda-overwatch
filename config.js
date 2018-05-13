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
    const bucket = event.Records[0].s3.bucket.name;
    const { key } = event.Records[0].s3.object;

    console.log(`Config updated in file ${key} in bucket ${bucket}`);

    try {
        const file = await getObjectFromS3(bucket, key);

        console.log(file.Body.toString('utf-8'));
        
        callback();
    }
    catch(error) {
        console.log(error.message);
        callback(error);
    }
};
