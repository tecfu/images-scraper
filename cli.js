#!/usr/bin/env node

"use strict";

const argv = require('yargs')
  .usage('Usage: $0 -s [string] -d [string] -e [string]')
  .demandOption(['s','d'])
  .argv;

//allow directory to be prefixed with './' for cwd
const dest = (argv.d.substr(0,2) === './') ? process.cwd() + '/' + argv.d.slice(2,argv.d.length) : argv.d;

const fs = require('fs');
const http = require('http');
const https = require('https');
const Scraper = require ('images-scraper');

let engine; 
switch(true){
  case(argv.e === 'bing'):
    engine = new Scraper.Bing();
    break;
  case(argv.e === 'yahoo'):
    engine = new Scraper.Yahoo();
    break;
  default:
    engine = new Scraper.Google();
}

const download = function(url, dest, cb) {
  let path = dest + url.split('/').pop();
  let file = fs.createWriteStream(path);
  let protocol = (url.substr(0,5) === 'https') ? https : http;
  let request = protocol.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

engine.list({
  keyword: argv.s,
  detail: true,
  nightmare: {
    show: true
  }
})
.then(function (res) {
  res.forEach(function(obj){
    if(['jpg','jpeg','png'].indexOf(obj.url.slice(obj.url.length-3,obj.url.length)) !== -1){
      download(obj.url,dest,function(){
        console.log('Downloaded...'+obj.url);
      });
    }
  });
}).catch(function(err) {
  console.log('err', err);
});
