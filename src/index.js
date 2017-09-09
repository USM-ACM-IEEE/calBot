const https = require('https');
const util = require('util');
const fs = require('fs');
const path = require('path');

const DISCORD_WEBHOOK_JSON = '../discord-webhook.json';

/**
 * Will attempt to load the file given and parse as JSON.
 * @param  {string} fileName The file you would like to open and be given as a
 * json.
 * @return {Promise}          A Promise that will hold the json object that was
 * requestes by fileName or the error message if rejected
 */
async function getJSON(fileName) {
  return new Promise((resolve, reject) => {
    try {
      let fileLocation = path.resolve(__dirname, DISCORD_WEBHOOK_JSON);

      fs.readFile(fileLocation, (err, buffer) => {
        if (err) {
          throw err;
        }

        let json = JSON.parse(buffer);
        resolve(json);
      });
    } catch (err) {
      let errorMsg = 'ERROR: unable to get ' + fileName + ' exiting\n' + err;
      reject(errorMsg);
    }
  })
}

/**
 * Temporary function that makes the given post with the given username to the
 * given webhook
 * @param  {string} id       The webhook id
 * @param  {string} token    The token for the webhook
 * @param  {string} username The username to make the post with
 * @param  {string} message  The post to makePost
 * @return {Promise}          The promise will resolve empty on finish and
 * reject with error message
 */
async function makePost(id, token, username, message) {
  return new Promise((resolve, reject) => {
    var postData = {
      "username": username,
      "content": message,
    };

    var json = JSON.stringify(postData);

    const options = {
      hostname: 'discordapp.com',
      port: 443,
      path: `/api/webhooks/${id}/${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    try {
      const req = https.request(options, (res) => {
        if(res.statusCode > 300 || res.statusCode < 200) {
          throw "statusCode: " + res.statusCode;
        }
      });

      req.write(json);

      req.on('error', (e) => {
        throw e;
      });
      req.on('end', ()=>{
        resolve();
      });

      req.end();

    } catch (err) {
      reject(err)
    }
  })
}

/**
 * This is the entry point for this node script
 *
 */
async function main() {
  let json = await getJSON(DISCORD_WEBHOOK_JSON).catch((err) => {
    console.log(err)
  });

  makePost(json.id, json.token, "Gods of ACM", "Yo this is cool");
}

main()
