'use strict';

const AWS = require('aws-sdk');
AWS.config.setPromisesDependency(require('bluebird'));
const ses = new AWS.SES();

const sesSendEmail = async (toAddress, subject, htmlBody, textBody, ccAddresses = []) => {
  console.log(`Sending email to ${toAddress}`);

  if(!process.env.REMINDER_FROM_EMAIL) {
    console.error('REMINDER_FROM_EMAIL is not set -- cannot send');
    return 'Missing from address';
  }

  // RFC 5322 display name, so clients show "NFL Pick Em" instead of falling back to the local
  // part of the address. Quoted to stay valid if the name ever picks up a comma or period.
  const source = process.env.REMINDER_FROM_NAME
    ? `"${process.env.REMINDER_FROM_NAME}" <${process.env.REMINDER_FROM_EMAIL}>`
    : process.env.REMINDER_FROM_EMAIL;

  try {
    const params = {
      Source: source,
      Destination: {
        ToAddresses: [toAddress],
        CcAddresses: ccAddresses,
      },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    };
    const result = await ses.sendEmail(params).promise();
    return result.MessageId;
  } catch (error) {
    // Swallow per-recipient failures so one bad address can't stop the rest of the run
    console.error(`Error sending email to ${toAddress}`, error);
    return 'Error sending email';
  }
};

module.exports = sesSendEmail;
