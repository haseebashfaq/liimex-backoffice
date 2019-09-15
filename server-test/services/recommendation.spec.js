var http = require('http');
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();
const recommendation_data = require('./recommendation_data.json')
/*const meta = require('../../server/services/meta.service');*/

var server = require('../../server/server.js');
var jobs = require('../../server/jobs.js');
var recommendationServices = require('../../server/services/recommendation.service.js');

describe('recommendationServices -> ', function(){


	before(function(done){
		this.timeout(30000); // A very long environment setup.
		jobs.activate_jobs();
		setTimeout(done, 5500);
	});

	after(function(){
		server.close();
		console.log("closing server");
	});

	it("test in recommendationServices",function(){
		assert.isDefined(recommendationServices.listen_for_recommendations,"listen_for_recommendations is defined");
	});

	it("test in perform_recommendation",function(){
		assert.isDefined(recommendationServices.perform_recommendation,"perform_recommendation is defined");
	});

	it("test if perform_recommendation is function", function(){
		assert.isFunction(recommendationServices.perform_recommendation, "it's a fucntion");
	});

	it("test if perform_recommendation returns data for given input", function(){
		var request= recommendation_data.test1.request;
		var datakey = recommendation_data.test1.datakey;
		assert.isDefined(recommendationServices.perform_recommendation(request, datakey),"perform_recommendation returns data");

	});

	it("default recommendations", function(){
	var request= recommendation_data.default_recommendations.request;
	var datakey = recommendation_data.default_recommendations.datakey;
	var expectKeys = recommendation_data.default_recommendations.expectKeys;
	var returnvalue = recommendationServices.perform_recommendation(request, datakey)

	expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
	});

	it("test if perform_recommendation returns correct expected data for a given input",
	function(){
	var request= recommendation_data.test1.request;
	var datakey = recommendation_data.test1.datakey;
	var expectKeys = recommendation_data.test1.expectKeys;
	var returnvalue = recommendationServices.perform_recommendation(request, datakey)
	expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
	});
});

describe('recommendationServices -> testing recommendation Business interruption insurence ->', function(){
	before(function(done){
		this.timeout(30000); // A very long environment setup.
		jobs.activate_jobs();
    	setTimeout(done, 5500);

		/*node server/server.js*/
	});

	after(function(){
		server.close();
	});

	describe("testing for indutry code 68", function(){
		it("should recommend businessInterruption when it's already present in the activities", function(){
			var request= recommendation_data.business_interruption_is_present_68.request;
			var datakey = recommendation_data.business_interruption_is_present_68.datakey;
			var expectKeys = recommendation_data.business_interruption_is_present_68.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
		it("should not recommend businessInterruption when it's not present in the activities", function(){
			var request= recommendation_data.business_interruption_is_not_present_68.request;
			var datakey = recommendation_data.business_interruption_is_not_present_68.datakey;
			var expectKeys = recommendation_data.business_interruption_is_not_present_68.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});
	describe("testing for indutry code 69", function(){
		it("should recommend businessInterruption when it's already present in the activities", function(){
			var request= recommendation_data.business_interruption_is_present_69.request;
			var datakey = recommendation_data.business_interruption_is_present_69.datakey;
			var expectKeys = recommendation_data.business_interruption_is_present_69.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
			it("should not recommend businessInterruption when it's not present in the activities", function(){
			var request= recommendation_data.business_interruption_is_not_present_69.request;
			var datakey = recommendation_data.business_interruption_is_not_present_69.datakey;
			var expectKeys = recommendation_data.business_interruption_is_not_present_69.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});
	describe("testing for indutry code 70", function(){
		it("should recommend businessInterruption when it's already present in the activities", function(){
			var request= recommendation_data.business_interruption_is_present_70.request;
			var datakey = recommendation_data.business_interruption_is_present_70.datakey;
			var expectKeys = recommendation_data.business_interruption_is_present_70.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
			it("should not recommend businessInterruption when it's not present in the activities", function(){
			var request= recommendation_data.business_interruption_is_not_present_70.request;
			var datakey = recommendation_data.business_interruption_is_not_present_70.datakey;
			var expectKeys = recommendation_data.business_interruption_is_not_present_70.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});
});

describe('recommendationServices -> testing recommendation Financial loss insurance / Professional Indemnity insurence ->', function(){
	before(function(done){
		this.timeout(30000); // A very long environment setup.
		jobs.activate_jobs();
    	setTimeout(done, 5500);
	});

	after(function(){
		server.close();
	});

	describe("testing for indutry code 65", function(){
		it("should recommend FLI/PI insurece when it's already present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_present_65.request;
			var datakey = recommendation_data.FLI_PI_is_present_65.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_present_65.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
			it("should  recommend FLI/PI insurece when it's not present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_not_present_65.request;
			var datakey = recommendation_data.FLI_PI_is_not_present_65.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_not_present_65.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			console.log(Object.keys(returnvalue.recommended));
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});

	describe("testing for indutry code 66", function(){
		it("should recommend FLI/PI insurece when it's already present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_present_66.request;
			var datakey = recommendation_data.FLI_PI_is_present_66.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_present_66.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
			it("should  recommend FLI/PI insurece when it's not present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_not_present_66.request;
			var datakey = recommendation_data.FLI_PI_is_not_present_66.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_not_present_66.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			console.log(Object.keys(returnvalue.recommended));
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});

	describe("testing for indutry code 69", function(){
		it("should recommend FLI/PI insurece when it's already present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_present_69.request;
			var datakey = recommendation_data.FLI_PI_is_present_69.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_present_69.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
			it("should  recommend FLI/PI insurece when it's not present in the activities", function(){
			var request= recommendation_data.FLI_PI_is_not_present_69.request;
			var datakey = recommendation_data.FLI_PI_is_not_present_69.datakey;
			var expectKeys = recommendation_data.FLI_PI_is_not_present_69.expectKeys;
			var returnvalue = recommendationServices.perform_recommendation(request, datakey)
			console.log(Object.keys(returnvalue.recommended));
			expect(returnvalue.recommended).to.have.all.keys(expectKeys.recommended);
		});
	});
});
