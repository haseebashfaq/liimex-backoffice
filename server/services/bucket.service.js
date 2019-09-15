'use strict';

const {ENV,
      LOG_ERROR, LOG_INFO} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

const gcloud = require('gcloud'),
      fs = require('fs'),
      path = require('path'),

      sendlog = require('./logger.service'),

      keyfile = appvars.firebase.root_path_to_service_account,
      serviceAccount = require(appvars.firebase.path_to_service_account);

/* Init GCloud */
const gcs = gcloud.storage({
  projectId: serviceAccount.project_id,
  keyFilename: keyfile
});

/**
 * Download from bucket
 * @param {string} root_path
 * @param {string} destination
 * @param {function} callback(err)
 */
function download_from_bucket(root_path, destination, callback){
  const bucket = gcs.bucket(appvars.firebase.storage_urls.storage_bucket);
  const options = {destination};

  bucket.file(root_path).download(options, (err) => {
      if (err) {
        sendlog(LOG_ERROR, 'downloader', err,appvars.logging.hostname);
        return callback(err);
      }
      callback();
    });
}

/**
 * Upload to Bucket
 * @param {string} input_file
 * @param destination
 * @param callback
 */
function upload_to_bucket(input_file, destination, callback){
  const options = {destination};
  const bucket = gcs.bucket(appvars.firebase.storage_urls.storage_bucket);

  bucket.upload(input_file, options, (err) => {
    if(!err) {
      fs.unlink(input_file, (e) => {
        if (e) sendlog(LOG_ERROR, 'uploader', 'failed to remove uploaded file from local',appvars.logging.hostname_chris);
        sendlog(LOG_INFO, 'uploader', 'file uploaded', appvars.logging.hostname);
      });
      callback();
    }
    else {
      console.error(err);
      sendlog(LOG_ERROR, 'uploader',err,appvars.logging.hostname);
    }
  });
}

function stream_to_bucket(readStream, contentType, destination, callback) {
  const bucket = gcs.bucket(appvars.firebase.storage_urls.storage_bucket);

  let remoteWriteStream = bucket.file(destination).createWriteStream({
    metadata : {
      contentType : contentType
    }
  });

  readStream.pipe(remoteWriteStream)
    .on('error', err => {
      return callback(err);
    })
    .on('finish', () => {
      return callback();
    });
}

/* Module Exports */
module.exports = {
  download_from_bucket,
  upload_to_bucket,
  stream_to_bucket
};
