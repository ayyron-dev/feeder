const dns = require('dns');
const http = require('http');
const https = require('https');
const saxjs = require('sax');

 /** 
 * Feed Class, unified format that represents an Atom or RSS feed.
 * @class
 */
class Feed {
  constructor() {
    /** 
     * the title of the feed 
     * @type {string} 
     */
    this.title = null; // RSS: same
    /** 
     * the subtitle of the feed 
     * @type {string} 
     */
    this.subtitle = null;// RSS: description
    /** 
     * link A list of Link objects.
     * @type {Array}   
     */
    this.link = []; // RSS: missing?
    /** 
     * updated string representation of the date of the feed. The format should conform to Atom/RSS specification respectfully. 
     * @type {updated} 
     */
    this.updated = null; // RSS: pubDate
    /** 
     * The id for the feed 
     * @type {string} 
     */
    this.id = null; // RSS: missing
    /** 
     *  A list of Entry Objects contained in this feed. 
     * @type {Array} 
     */
    this.entrys = []; // RSS: items
    /** 
     * A list of Author Object Entrys for this feed. 
     * @type {Array} 
     */
    this.author = [];// RSS: managingEditor
    /** 
     * A list of String category tags for this feed. 
     * @type {Array} 
     */
    this.category = []; // RSS: same
    /** 
     * A list of String contributor names for this feed. 
     * @type {Array}
     */
    this.contributor = null; // RSS: missing?
    /** 
     * The name of the service used to generate this feed. 
     * @type {string}
     */
    this.generator = null; // RSS: same
    /** 
     * The url to the icon image 
     * @type {string} 
     */
    this.icon = null; // RSS: missing?
    /** 
     * 
    */
    this.logo = null; // RSS: image
    /** 
     * The copyrights to this feed. 
     * @type {string} 
     */
    this.rights = null; // RSS: missing?
  }
}

 /** 
 * Feed Class, unified format that represents an entry in an Atom or RSS feed.
 * @class
 */
class Entry {
  constructor() {
    /** 
     * The id for the feed entry 
     * @type {string} 
     */
    this.id = null; // RSS: guid
    /** 
     * the title of the feed entry 
     * @type {string} 
     */
    this.title = null; // RSS: same
    /** 
     *  A list of Link objects. 
     * @type {Array}  
     */
    this.link = []; // RSS: same
    /** 
     * string representation of the date the feed entry was updated. The format should conform to Atom/RSS specification respectfully. 
     * @type {updated} 
     */
    this.updated = null; // RSS: pubDate
    /** 
     * A list of Author Object Entrys for this feed entry. 
     * @type {Array} 
     */
    this.author = []; // RSS: same
    /** 
     * content of this feed entry, may be html that was contained in !CDATA tag. 
     * @type {string} 
     */
    this.content = null; // RSS: description
    /** 
     * A brief summary of the content of this entry. 
     * @type {string} 
     */
    this.summary = null; // RSS: missing?
    /** 
     * A list of String category tags for this feed entry. 
     * @type {Array}
     */
    this.category = []; // RSS: same
    /** 
     * A list of String contributor names for this feed entry. 
     * @type {Array} 
     */
    this.contributor = []; // RSS: missing?
    /** 
     * the date this article was published, not necessarily when the feed was updated. 
     * @type {string}
     */
    this.published = null; // RSS: missing?
    /** 
     * Copyrights to the feed entry 
     * @type {string}
     */
    this.rights = null; // RSS: missing?
    /** 
     * source of the entry 
     * @type {string}
     */
    this.source = null; // RSS: missing?
  }
}

/** This class represents a Link in an Feed. */
class Link {
  constructor() {
    /** 
     * describes the link type (Atom only) 
     * @type {string} 
     */
    this.rel = null;
    /** 
     * URL 
     * @type {string} 
     */
    this.href = null;
  }
}

/** Describes an author element in a feed */
class Author {
  constructor() {
    /** 
     * name of the author. 
     * @type {string}  
     */
    this.name = null;
    /** 
     * email address of the author 
     * @type {string} 
     */
    this.email = null;
    /** 
     * authors' URI 
     * @type {string} 
     */
    this.uri = null;
  }
}

/** Describes a source entry of a feed */
class Source {
  constructor() {
    /** 
     * id value 
     * @type {string} 
     */
    this.id = null;
    /** 
     * title of the source 
     * @type {string} 
     */
    this.title = null;
    /** 
     * date the source was udpated 
     * @type {string} 
     */
    this.updated = null;
  }
}

// extend array to behave more like a Stack
class StackArray extends Array {
  peek() { return this[this.length - 1]; }
}

/** 
 * Exception object to throw for all errors encountered during execution
 */
class FeederException {
   /**
   * @param {string} [message] Options for the client
   */
  constructor(message) {
    /** 
     * message describing the excepction. 
     * @type {string} 
     */
    this.message = message;
    /** 
     * name of this exception 
     * @type {string}
     */
    this.name = 'FeederException';
  }
}

const RSSFeedMap = {
  description: 'subtitle',
  pubDate: 'updated',
  lastBuildDate: 'updated',
  item: 'entry',
  managingEditor: 'author',
  image: 'logo'
};

const RSSEntryMap = {
  description: 'content',
  pubDate: 'updated',
  guid: 'id',
  item: 'entry'
};

const FeedType = {
  RSS2: 0,
  ATOM: 1
};


function getEntryFieldName(feedType, fieldName) {
  let map;
  switch (feedType) {
  case FeedType.RSS2:
    map = RSSEntryMap;
    break;
  default:
    return fieldName;
  }
  if (map[fieldName]) {
    return map[fieldName];
  } 
  return fieldName;
}

function getFeedFieldName(feedType, fieldName) {
  let map;
  switch (feedType) {
  case FeedType.RSS2:
    map = RSSFeedMap;
    break;
  default:
    return fieldName;
  }
  if (map[fieldName]) {
    return map[fieldName];
  } 
  return fieldName;
}

function getXmlString(url) {
  return new Promise((resolve, reject) => {
    const process = (response) => {
      // Continuously update stream with data
      let responseBody = '';
      response.on('data', (d) => {
        responseBody += d;
      });
      // callback with stream response.
      response.on('end', () => {
        resolve(responseBody);
      });
    };
    let request;
    if (url.startsWith('https')) {
      request = https.request(url, process); // create a new agent just for this one request
    } else if (url.startsWith('http')) {
      request = http.request(url, process);
    } else {
      reject(new FeederException('Url must specify protocol.'));
    }
    request.on('error', (err) => { reject(new FeederException(err.message)); });
    request.end();
  });
}

function parseFeed(parser, feedType) {
  const feed = new Feed();
  let attributes = {};
  let tagName = null;
  const objects = new StackArray();
  const names = new StackArray();
  objects.push(feed);
  
  parser.onclosetag = function onclosetag(tag) {
    if (names.peek() === tag) {
      objects.pop();
      names.pop();
    }
    // reset attributes for next tag.
    attributes = {};
  };

  parser.onopentag = function onopentag(tag) {
    let current;
    tagName = objects.peek() && Object.getPrototypeOf(objects.peek()) === Entry.prototype ? getEntryFieldName(feedType, tag.name) : getFeedFieldName(feedType, tag.name);
    if (tagName === 'author') {
      current = new Author();
      objects.peek().author.push(current);
    } else if (tagName === 'link') {
      current = new Link();
      // look for 'href' and 'rel' tags
      Object.keys(attributes).forEach((value, index) => {
        if (current[value] !== undefined) {
          current[value] = attributes[value];
        }
      });
      objects.peek().link.push(current);
    } else if (tagName === 'source') {
      current = new Source();
      objects.peek().source = current;
    } else if (tagName === 'entry') {
      current = new Entry();
      objects.peek().entrys.push(current);
    }
    if (current) {
      objects.push(current);
      names.push(tag.name);
    }
  };

  parser.onattribute = function onattribute(attr) {
    // attribute event fires first, map them for adding to object during opentag event
    attributes[attr.name] = attr.value;
  };

  parser.ontext = function ontext(text) {
    if (tagName === 'link' && feedType === FeedType.RSS2) {
      objects.peek().href = text;
    } else if (objects.peek()) {
      // if tag is a property of the class, write the data
      if (objects.peek()[tagName] === null) {
        objects.peek()[tagName] = text;
      }
    }
  };

  parser.oncdata = function oncdata(cdata) {
    // if tag is a property of the class, write the data
    if (objects.peek()) {
      if (objects.peek()[tagName] === null) {
        objects.peek()[tagName] = cdata;
      }
    }
  };

  return feed;
}

function xmlStringToJSON(xmlString) {
  const parser = saxjs.parser(true);
  let feed = null;
  let feedType;
  parser.onopentag = (tag) => {
    // See what kind of feed we're dealing with
    if (tag.name === 'feed') {
      feedType = FeedType.ATOM;
    } else if (tag.name === 'rss') {
      // TODO: try handling for different rss versions
      feedType = FeedType.RSS2;
    } else {
      throw new FeederException('Invalid Feed Type. Root Tag must be feed or rss.');
    }
    // 
    feed = parseFeed(parser, feedType);
  };
  
  parser.onerror = function onerror(e) {
    throw e;
  };
  
  parser.write(xmlString).end();
  return feed;
}

/**
 * Function to get an Atom/RSS feed.
 * @param {string} url - url to rss feed, this url must resolve to something that returns via http the xml itself.
 * @param {function} callback - the function to call back upon with the Feed object.
 */
function getFeed(url, callback) {
  getXmlString(url).then(xmlStringToJSON).then(callback).catch(callback);
}

module.exports = { 
  getFeed,
  Feed,
  FeederException
};
