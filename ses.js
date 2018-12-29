// Load the SDK for JavaScript
var AWS = require('aws-sdk');

function sendEmail(reserve) {
    // Create sendEmail params 
    const params = {
        Destination: { /* required */
          ToAddresses: [
              processs.env.DEST_EMAIL
          ]
        },
        Source: process.env.SOURCE_EMAIL, /* required */
        Message: { /* required */
          Body: { /* required */
            Text: {
              Charset: "UTF-8",
              Data: "O usuario " + reserve.userName + "reservou o produto " + reserve.productName + "na data " + reserve.date
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: 'Reserva usuario: ' + reserve.userName + 'para o produto' + reserve.productName
          }
        },
    };

    //Envia o e-mail usando o amazon
    var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();
    return sendPromise;
}

module.exports.sendEmail = sendEmail;