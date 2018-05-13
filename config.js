const util = require("util");
const AWS = require("aws-sdk");

const s3 = new AWS.S3();

const getObjectFromS3 = async (Bucket, Key) => util.promisify(s3.getObject)({ Bucket, Key });

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
