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

        console.log(file.Body);
    }
    catch(error) {
        console.log(error.message);
    }

    callback();
};

// {
//     "Records": [
//         {
//             "eventVersion": "2.0",
//             "eventSource": "aws:s3",
//             "awsRegion": "eu-west-1",
//             "eventTime": "2018-05-13T17:46:49.076Z",
//             "eventName": "ObjectCreated:Put",
//             "userIdentity": {
//                 "principalId": "A2OWZ9G7GS6CYE"
//             },
//             "requestParameters": {
//                 "sourceIPAddress": "94.195.35.249"
//             },
//             "responseElements": {
//                 "x-amz-request-id": "650E579B2F37BEA8",
//                 "x-amz-id-2": "d9iXxlfJbSFrJY7IK2vMFQiG/ndxsXYmDsXeBT4mjsHYbm8nbA4sDIrSqbLOYp5sK4afekfXS8I="
//             },
//             "s3": {
//                 "s3SchemaVersion": "1.0",
//                 "configurationId": "7a15d84e-4d21-4283-b37c-e5084e1e04d7",
//                 "bucket": {
//                     "name": "ow2018-config",
//                     "ownerIdentity": {
//                         "principalId": "A2OWZ9G7GS6CYE"
//                     },
//                     "arn": "arn:aws:s3:::ow2018-config"
//                 },
//                 "object": {
//                     "key": "tmp.yml",
//                     "size": 305,
//                     "eTag": "e45e1f10dab28caddc856784d44a801e",
//                     "sequencer": "005AF87A0907C8BD9F"
//                 }
//             }
//         }
//     ]
// }
