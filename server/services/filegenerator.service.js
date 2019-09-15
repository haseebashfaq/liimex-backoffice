"use strict";

const {
    ENV,
    DEFAULT_LANGUAGE,
    DOCUMENT_GENERATOR_TOKEN_HEADER
} = require('../consts');
const appvars = require('../config/appvars.json')[ENV];

/* Requirements */
const _ = require('lodash'),
    moment = require('moment'),
    path = require('path'),
    request = require('request'),
    stream = require('stream'),
    uuid = require('uuid'),

    bucket_service = require('./bucket.service.js'),
    gen_service = require('./gen.service.js'),
    userorganizer = require('./userorganizer.service'),
    meta = require('./meta.service'),
    sendlog = require('./logger.service.js');

const MS_IN_SECOND = 1000;

moment.locale(DEFAULT_LANGUAGE);

function format_answer(question, answer) {
    // Reformatting Certain Answers
    answer = answer === true ? 'Ja' : answer;
    answer = answer === false ? 'Nein' : answer;
    if (answer && answer !== '') {
        answer = question.input_type === 'number' ? gen_service.getSepThousands(parseInt(answer)) : answer;
        answer = question.input_type === 'currency' ? '€ ' + gen_service.getSepThousands(parseInt(answer)) : answer;
        answer = question.input_type === 'date' ? moment(answer * MS_IN_SECOND).utcOffset('+02:00').format('LL') : answer
    }

    return answer;
}

function render_template(name, context, storage_path, callback) {
    const options = {
        method: 'POST',
        uri: process.env.generatorHost + '/v1/render/pdf',
        body: {
            name,
            context
        },
        headers: {
            [DOCUMENT_GENERATOR_TOKEN_HEADER]: process.env.DOCUMENT_GENERATOR_TOKEN
        },
        encoding: null,
        json: true
    };

    const filename = uuid() + '.pdf';
    const localReadStream = new stream.PassThrough();
    request(options).pipe(localReadStream);
    const remote_path = path.join(storage_path, filename);

    bucket_service.stream_to_bucket(localReadStream, 'application/pdf', remote_path, err => {
        console.log(remote_path);
        callback(err, filename);
    });
}

function generate_insurance_questions_report(offer, insurance_type, company_uid, question_dict, callback, err_call) {

    function prepare_question(question_type, question, key) {
        const parent_answer_obj = company.insurance_questionnaire[question.question];
        const sub_questionnaire = [];
        if (!parent_answer_obj || parent_answer_obj.answer === null) {
            return sub_questionnaire;
        }

        if (_.isEmpty(question_dict[question_type][key])) return sub_questionnaire;
        if (_.isEmpty(meta.insurance_questions)) return sub_questionnaire;

        const parent_question_obj = meta.insurance_questions[question_dict[question_type][key].question];

        if (!company.insurance_questionnaire[question_dict[question_type][key].question]) {
            return sub_questionnaire;
        }

        const parent_answer = format_answer(parent_question_obj, company.insurance_questionnaire[question_dict[question_type][key].question].answer);

        const parent_question = {
            question: parent_question_obj.question_text_de,
            answer: parent_answer
        };
        sub_questionnaire.push(parent_question);

        _.each(question.children, child => {
            const answer_obj = company.insurance_questionnaire[child];
            if (answer_obj) {
                const child_question_obj = meta.insurance_questions[child];
                const child_answer = format_answer(child_question_obj, answer_obj.answer);
                const child_question = {
                    question: child_question_obj.question_text_de,
                    answer: child_answer,
                    is_child: true
                };
                sub_questionnaire.push(child_question);
            }
        });

        return sub_questionnaire;
    }

    const company = meta.companies[company_uid],
        address = meta.main_addresses[company_uid],
        insurance = meta.insurance_types[insurance_type];

    if (_.isEmpty(company)) {
        return err_call({
            code: 404,
            error: `Company ${company_uid} doesn't exist`
        });
    }

  const context = {
    offer,
    company,
    address,
    insurance,
    industries: [],
    questionnaire: {
      general: [],
      specific: [],
      confirmatory: []
    },
    questionnaire_labels: {
      general: "Allgemeine Fragen",
      specific: "Produkt Fragen",
      confirmatory: "Confirmatory Fragen"
    }
  };

  _.each(company.industry_codes, code => {
    const code_arr = code.split('.');
    for (let i = 0; i < code_arr.length; i++) {
      const new_code = meta.industry_codes[meta.industry_key_from_code[code_arr.slice(0, i+1).join('.')]];
      context.industries.push({
        code: new_code.code,
        name: new_code.name_de
      });
    }
  });

  _.each(_.keys(context.questionnaire), question_type => {

      if (!question_dict[question_type]) {
          return;
      }

      _.each(question_dict[question_type], (question, key) => {
          const parent_answer_obj = company.insurance_questionnaire[question.question];
          if (!parent_answer_obj) return;

          if (parent_answer_obj.answer !== null) {

              // Property Checks
              if (!question_dict[question_type][key]) return;
              if (!question_dict[question_type][key].question) return;
              if (!question_dict[question_type][key].answer) return;

              const parent_question_obj = meta.insurance_questions[question_dict[question_type][key].question];
              const parent_answer = format_answer(parent_question_obj, company.insurance_questionnaire[question_dict[question_type][key].question].answer);

              const parent_question = {
                question: parent_question_obj.question_text_de,
                answer: parent_answer
              };
              context.questionnaire[question_type].push(parent_question);

              _.each(question.children, child => {
                const answer_obj = company.insurance_questionnaire[child];
                if (answer_obj) {
                  const child_question_obj = meta.insurance_questions[child];
                  const child_answer = format_answer(parent_answer_obj, answer_obj.answer);
                  const child_question = {
                    question: child_question_obj.question_text_de,
                    answer: child_answer,
                    is_child: true
                  };
                  context.questionnaire[question_type].push(child_question);
                }
              });
        }
    });

    _.each(question_dict[question_type], (question, key) => {
        context.questionnaire[question_type] = context.questionnaire[question_type].concat(prepare_question(question_type, question, key));
    });

    if (!_.isEmpty(offer.products)) {
        context.offer_has_products = true;
        context.products = {};
        context.questionnaire.products = {};

        _.each(offer.products, (product, product_key) => {
            context.products[product_key] = meta.products[product_key];
            context.questionnaire.products[product_key] = [];
            _.each(question_dict.products[product_key], (question, key) => {
                context.questionnaire.products[product_key] = context.questionnaire.products[product_key].concat(prepare_question(question_type, question, key));
            });
        });
    }
   });

    render_template('offer_report', context, path.join(appvars.firebase.storage_urls.documents, company_uid), (err, filename) => {
        if (err) return err_call(err);
        callback(filename);
    });
}

function generate_mandate(company_uid, context, callback) {
    context.company_uid = company_uid;
    generate_pdf({
        template: 'mandate',
        storage_path: path.join(appvars.firebase.storage_urls.mandates, context.company_uid),
        context
    }, callback);
}

function generate_sepa(company_uid, mandate_data, callback) {
    mandate_data.company_uid = company_uid;
    generate_pdf({
        template: 'sepa',
        storage_path: path.join(appvars.firebase.storage_urls.sepa_mandates, company_uid),
        context: mandate_data
    }, callback);
}

const meta_replacements = {
    address: {meta: 'main_addresses', replacement: 'address'},
    address_uid: {meta: 'main_addresses', replacement: 'address'},
    activity: {meta: 'activities', replacement: 'activity'},
    activity_uid: {meta: 'activities', replacement: 'activity'},
    carrier: {meta: 'carriers', replacement: 'carrier'},
    carrier_uid: {meta: 'carriers', replacement: 'carrier'},
    company: {meta: 'companies', replacement: 'company'},
    company_uid: {meta: 'companies', replacement: 'company'},
    insurance_type: {meta: 'insurance_types', replacement: 'insurance_type'},
    insurance_type_uid: {meta: 'insurance_types', replacement: 'insurance_type'},
    insurance_question: {meta: 'insurance_questions', replacement: 'insurance_question'},
    insurance_question_uid: {meta: 'insurance_questions', replacement: 'insurance_question'},
    industry_code: {meta: 'industry_codes', replacement: 'industry_code'},
    industry_code_uid: {meta: 'industry_codes', replacement: 'industry_code'},
    product: {meta: 'products', replacement: 'product'},
    product_uid: {meta: 'products', replacement: 'product'}
};

const expand = {
  company: {address: {parent_key: true}}
};

function generate_pdf(params, callback) {
    const {template, storage_path, context} = params;

    _.each(context, (uid, key) => {
        if (meta_replacements[key] && meta[meta_replacements[key].meta][uid]) {
            const replacement_object = meta[meta_replacements[key].meta][uid];
            const replacement_key = meta_replacements[key].replacement;
            context[replacement_key] = replacement_object;

            _.each(expand[replacement_key], (expand_path, expand_key) => {
                if (context[expand_key]) return;
                if (expand_path.first_key) {
                    const first_key = _.keys(_.get(replacement_object, expand_path.first_key))[0];
                    if (first_key) context[expand_key] = meta[meta_replacements[expand_key].meta][first_key];
                    return;
                }

                if (expand_path.parent_key) {
                    context[expand_key] = meta[meta_replacements[expand_key].meta][uid];
                }

                if (_.get(replacement_object, expand_path)) {
                   context[expand_key] = meta[meta_replacements[expand_key].meta][_.get(replacement_object, expand_path)];
                }
            });
        }
    });

    if (context.user && userorganizer.allusers[context.user]) context.user = userorganizer.allusers[context.user];
    if (context.user_uid && userorganizer.allusers[context.user_uid]) context.user = userorganizer.allusers[context.user_uid];

    render_template(template, context, storage_path, (err, filename) => {
        if (err) return callback(err);
        callback(null, {data: filename});
    });
}

module.exports = {
    generate_insurance_questions_report,
    generate_mandate,
    generate_pdf,
    generate_sepa
};
