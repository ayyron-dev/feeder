const fs = require('fs');
const feeder = require('../src/index');
//getFeed('http://files.elderscrollsonline.com/rss/en-us/eso-rss.xml', (data) => { fs.writeFile('./test/test-output.json', JSON.stringify(data)); });
//feeder.getFeed('http://redfrex.net/overfeed', (data) => { fs.writeFile('test/test-output.json', JSON.stringify(data)); });
//getFeed('https://google.com', (data) => { fs.writeFile('./test/test-output.json', JSON.stringify(data)); });
feeder.getFeed('http://feeds.reuters.com/news/artsculture?format=xml', (data) => { fs.writeFile('./test/test-output.json', JSON.stringify(data)); });


const feeder = require('../src/index');
feeder.getFeed('http://feeds.reuters.com/news/artsculture?format=xml', (data) => { console.log(data.title); });