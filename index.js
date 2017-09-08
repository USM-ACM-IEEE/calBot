const https = require('https');
const util = require('util');


var postData = {
  "username": "Gods of ACM",
  "content": "Kyla is the most amazing girlfriend in the world!! @everyone",
}

console.log("Data being sent: ", postData);
var json = JSON.stringify(postData);

const options = {
  hostname: 'discordapp.com',
  port: 443,
  path: '/api/webhooks/355803885224591370/MLn6utYN4AY2vWKN9jynhQD7hp3CMA-OJ--VXvOp4uET2wOFXuLXNgBYKHdiF_hClJMc',
  method: 'POST',
  headers: {
       'Content-Type': 'application/json',
     }
};


const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});


req.write(json);

req.on('error', (e) => {
  console.error(e);
});
req.end();
