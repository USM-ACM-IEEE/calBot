const https = require('https');
const util = require('util');
const fs = require('fs');
const path = require('path');
const calender = require('./calenderApi.js');
const moment = require('moment');

const DISCORD_WEBHOOK_JSON = '../discord-webhook.json';
const GOOGLE_CALENDER_TOKEN = '../client_secret.json';

const ACM_ICON_URL = 'https://pbs.twimg.com/profile_images/656872290492284928/6Vk-M4KK_400x400.jpg';
const ACM_CHAPTER_WEBSITE = 'http://orca.st.usm.edu/acm/';

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
 * @param  {[Object]} posts  Will post each element in the array as a seperate
 * embeded message
 * @return {Promise}          The promise will resolve empty on finish and
 * reject with error message
 */
async function makePost(id, token, username, posts) {
  return new Promise((resolve, reject) => {
    var postData = {
      "username": username,
      "embeds": posts
    };

    var json = JSON.stringify(postData);

    const options = {
      hostname: 'discordapp.com',
      port: 443,
      path: `/api/webhooks/${id}/${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const req = https.request(options, (res) => {
        if (res.statusCode > 300 || res.statusCode < 200) {
          throw "statusCode: " + res.statusCode;
        }
      });

      req.write(json);

      req.on('error', (e) => {
        throw e;
      });
      req.on('end', () => {
        resolve();
      });

      req.end();

    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Uses the google calender API to get the next 10 events on the primary calender
 * @return {[Object]}  Each entry contains the details of one event
 */
async function getUpcomingEvents() {
  return new Promise((resolve, reject) => {
    let pathToGoogleToken = path.resolve(__dirname, GOOGLE_CALENDER_TOKEN);
    fs.readFile(pathToGoogleToken, function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Google Calendar API.
      calender.authorize(JSON.parse(content), (auth) => {
        calender.listEvents(auth, (events) => {
          if (events === {}) {
            reject(events);
          }

          resolve(events);
        })
      });
    });
  })
}

/**
 * This is the entry point for this node script it will get the events within 10
 * days and filter them to only have the ones within 24 hours then make a post
 * onto the discord webhook provided with the details of the event
 */
async function main() {
  let getWebhookToken = getJSON(DISCORD_WEBHOOK_JSON);
  let comingEvents = await getUpcomingEvents()
    .catch((err) => {
      console.error("ERROR: in getting events\n" + err);
      process.exit(1);
    });

  let events = comingEvents.filter((event) => {
    let start = moment(event.start.dateTime);
    let now = moment();
    let hoursUntil = start.diff(now, 'hours');

    if(hoursUntil <= 24) {
      return event;
    }
  })


  let webhook = await getWebhookToken;
  let embededMessages = [];
  for(idx in events){
    let event = events[idx];
    let message = {};

    message['title'] = event.summary;
    message['description'] = event.description;
    message['url'] = event.htmlLink;
    message['author'] = {
      name: 'ACM Exec',
      url: ACM_CHAPTER_WEBSITE,
      icon_url: ACM_ICON_URL,
      proxy_icon_url: ACM_ICON_URL
    }
    message['fields'] = [{
      name: 'Location',
      value: event.location,
      inline: true
    },{
      name: 'Start Time',
      value: moment(event.start.dateTime).format("dddd, MMMM Do YYYY, h:mm:ss a"),
      inline: true
    },{
      name: 'End Time',
      value: moment(event.end.dateTime).format("dddd, MMMM Do YYYY, h:mm:ss a"),
      inline: true
    }]
    message['footer'] = {
      text:'If you have any questions please mention @exec in a post in #questions',
      icon_url: "",
      proxy_icon_url: ""
    }

    embededMessages.push(message);
  }

  makePost(webhook.id, webhook.token, "Events of the Day", embededMessages);
}

main()
