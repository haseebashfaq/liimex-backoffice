"use strict";

const path = require('path'),
      uuid = require('uuid/v4');

const bucket = require('../services/bucket.service');

function downloadWithCustomName(filters, callback) {
    const tmp_filename = path.join('server','reports', uuid());

    const {from, as, type} = filters;

    bucket.download_from_bucket(from, tmp_filename, err => {

        if (err) return callback(err);

        const download_options = {
            file: tmp_filename,
            fileName: as,
            autoUnlink: true
        };

        if (type) {
            download_options.headers = {'content-type': type};
        } else {
            download_options.autoMime = true;
        }

        callback(null, {}, download_options);
    });
}

module.exports = {
    downloadWithCustomName
};