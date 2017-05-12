welcome to my first node module!

# feeder 

feeder is a small, simple to use Atom and RSS parser. It uses the fast and lightweight [sax-js](https://github.com/isaacs/sax-js) Sax parser to parse an Atom or RSS feed into a single JavaScript Object type that mimics the structure (but not exactly) of the Atom Specification.

###### What this is intended to be:
* Simple to Implement
* Simple to Use
###### What this is NOT intended to be:
* A Robust feature Rich API
* One stop library for all Atom/RSS needs

#### Examples
To retreive a feed is very simple. Let's examine the following code.
```javascript
const feeder = require('../src/index');
feeder.getFeed('http://feeds.reuters.com/news/artsculture?format=xml', (feed) => { console.log(feed.title); });
```
would output
```javascript
"Reuters: Arts"
```
Pretty simple, right? While feeder aims to be simple, this limits it's use cases.
If you are looking for a parser that is more structured around the RSS Specification you might want to try [feedparser](https://github.com/danmactough/node-feedparser).
Or if you are looking for in depth parsing of the xml structure, you may want to look at [sax-js](https://github.com/isaacs/sax-js).

#### Documentation
Documentation can be found [Here](http://feeder.somersdev.com/).

#### License
MIT

#### Contributions
Pull and feature requests are welcome. Please use the linting rules in the eslint file.