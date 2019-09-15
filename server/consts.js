"use strict";

const c = {

  /* Default Settings */
  DEFAULT_SERVER_PORT: 2500,
  ENV: process.env.ENVIRONMENT || "development",

  /* Tokens */
  DOCUMENT_GENERATOR_TOKEN_HEADER: 'x-dg-token',

  /* Email Types */
  EMAIL_TYPE_INDUSTRY_NOT_FOUND: "could_not_find_industry",
  EMAIL_TYPE_MANDATE_SIGNED: "mandate_signed",
  EMAIL_TYPE_NEW_OFFER_WO_REQUEST: "new_offer_without_request",
  EMAIL_TYPE_NEW_OFFER_W_REQUEST: "new_offer_with_request",
  EMAIL_TYPE_OFFER_ACCEPTED: "offer_accepted",
  EMAIL_TYPE_OFFER_REQUESTED: "offer_requested",
  EMAIL_TYPE_POLICY_DIGITIZED: "policy_digitized",
  EMAIL_TYPE_POLICY_CANCELED: "policy_cancelled",
  EMAIL_TYPE_WELCOME: "welcome",
  EMAIL_TYPE_VERIFICATION : "email_verification",
  EMAIL_TYPE_OFFER_REQUESTED_INTERNAL: "internal_offer_requested",
  EMAIL_TYPE_OFFER_ACCEPTED_INTERNAL: "internal_offer_accepted",

  /* Models */
  MODEL_BLANK_EMAIL_TEMPLATE : "../models/email/email_template.json",

  /* Email Substitutions */
  EMAIL_SUB_LINK_EMAIL_VERIFICATION : "%link_email_verification%",

  /* Links */
  BASE_LINK_API : process.env.TEST_BASE_LINK_API || "https://backoffice-production.herokuapp.com/api/",
  LOCATION_SUCCESS_EMAIL_VERIFICATION : process.env.location_after_email_verification || "https://lmx3.liimex.com",
  LOCATION_ERROR_EMAIL_VERIFICATION : process.env.location_after_email_verification_error || "https://lmx3.liimex.com",

  /* Firebase Events */
  EVENT_TYPE_ON_VALUE: "value",
  EVENT_TYPE_ON_CHILD_ADDED: "child_added",
  EVENT_TYPE_ON_CHILD_REMOVED: "child_removed",
  EVENT_TYPE_CHILD_CHANGED: "child_changed",
  EVENT_TYPE_ON_CHILD_MOVED: "child_moved",

  /* Language */
  LANGUAGE_DE: "de",
  LANGUAGE_EN: "en",

  /* Log Sources */
  LOG_SOURCE_PLATFORM: "platform",
  LOG_SOURCE_BACKOFFICE: "backoffice",
  LOG_SOURCE_UNKNOWN: "unkown_source",

  /* Log Types */
  LOG_ERROR: "error",
  LOG_WARNING: "warn",
  LOG_INFO:"info",
  LOG_VERBOSE: "verbose",
  LOG_DEBUG: "debug",
  LOG_SILLY: "silly",

  /* Log Namespaces */
  LOG_NAME_PRODUCT_SERVICE: 'product-service',

  /* Firebase Listeners */
  ON_VALUE: 0b1,
  ON_CHILD_ADDED: 0b10,
  ON_CHILD_REMOVED: 0b100,
  ON_CHILD_CHANGED: 0b1000,
  ON_CHILD_MOVED: 0b10000,

  /* Misc */
  OK: "ok",

  /* Policy Statuses */
  POLICY_PENDING: "pending",
  POLICY_ACTIVE: "active",
  POLICY_DELETED: "deleted",

  PREFIX_OFFERS: "o",

  /* Suffix Companies */
  SUFFIX_COMPANIES: "companies",
  SUFFIX_COMPARISONS: "comparisons",
  SUFFIX_DOCUMENTS: "documents",
  SUFFIX_POLICIES: "policies",

  /* Development */
  DEV_REPLACE_VERIFY: 'pickindustry',

  // /* Whitelistings */
  // If null then all is whitelisted
  IP_DOC_WHITELIST : process.env.WHITELISTED_DOC_URL,
  IP_INTERNAL_WHITELIST : process.env.IP_INTERNAL_WHITELIST

};

c.DEFAULT_LANGUAGE = c.LANGUAGE_DE;

module.exports = c;
