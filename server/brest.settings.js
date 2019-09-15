/* Requirements */
const {
  DEFAULT_SERVER_PORT,
  IP_DOC_WHITELIST,
  IP_INTERNAL_WHITELIST
} = require('./consts');
const path = require('path');
const helmet = require('helmet');
const docs_whitelist = require('./middleware').whitelister(IP_DOC_WHITELIST, '/docs/');
const internal_whitelist = require('./middleware').whitelister(IP_INTERNAL_WHITELIST, '/');
const sslRedirect = require('heroku-ssl-redirect');

/* Settings */
const settings = {
    application: "Platform Backoffice",
    apiPath: path.join(__dirname, 'api'),
    apiUrl: {
        prefix: 'api/',				// Prepend url with leading string.
        unversioned: true			// Don't include API version into the URL (default false)
    },
    baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || DEFAULT_SERVER_PORT}`,
    server: {
        port: process.env.PORT || DEFAULT_SERVER_PORT                  // Listed on port
    },
    static: {
        public: path.join(__dirname, '..', 'build')
    },
    log: 'tiny',
    checkpoint : {
        before_static_init: (brest, callback) => {
            brest.app.use(helmet());
            brest.app.use(docs_whitelist);
            brest.app.use(internal_whitelist);
            if (process.env.ENVIRONMENT === 'production') {
                brest.app.use(sslRedirect());
            }
            callback();
        },
        before_api_init: (brest, callback) => {
            const app = brest.app;
            const express = brest.express;
            const docsPath = path.join(__dirname, 'doc');
            app.use('/docs/', express.static(docsPath));
            callback();
        }
    }
};

module.exports = settings;
