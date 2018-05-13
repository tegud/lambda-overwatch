const util = require("util");
const AWS = require("aws-sdk");
const yaml = require('js-yaml');

const s3 = new AWS.S3();

const getObjectFromS3 = async (Bucket, Key) => new Promise((resolve, reject) => s3.getObject({ Bucket, Key }, (err, result) => {
    if(err) {
        return reject(err);
    }

    return resolve(result);
}));

module.exports.update = async (event, context, callback) => {
    const { eventName } = event.Records[0];
    const bucket = event.Records[0].s3.bucket.name;
    const { key } = event.Records[0].s3.object;

    console.log(`Config updated in file ${key} in bucket ${bucket}`);

    try {
        const file = await getObjectFromS3(bucket, key);
        const fileData = file.Body.toString('utf-8');
        const parsedData = yaml.safeLoad(fileData);
        
        console.log(JSON.stringify(parsedData, null, 4));

        callback();
    }
    catch(error) {
        console.log(error.message);
        callback(error);
    }
};
