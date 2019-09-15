const pricing_data = require('./data.json');
const template = require('./template.json')

/* Update Price */
this['updatePrice'] = (process_object, callback, err_call) => {
  try{

    /**
     * Getting Necessary Data
     */
    const truck_value = process_object.pages[0].questions.new_value.answer.toString();
    const monthly_revenue = process_object.pages[0].questions.monthly_revenue.answer.toString();
    const pricing = pricing_data.foodtruck_comparisons.truck_values[truck_value];
    const additional_pricing = pricing_data.foodtruck_topups.monthly_revenue[monthly_revenue];
    
    /** 
     * Set Prices for Deductible of 500
     */
    process_object.pages[1].comparisons['500']['0'].premium_monthly = pricing.deductibles['500'].plans.basic;
    process_object.pages[1].comparisons['500']['1'].premium_monthly = pricing.deductibles['500'].plans.medium;
    process_object.pages[1].comparisons['500']['2'].premium_monthly = pricing.deductibles['500'].plans.premium;

    /**
     * Set Prices for Deductible of 2500
     */
    process_object.pages[1].comparisons['2500']['0'].premium_monthly = pricing.deductibles['2500'].plans.basic;
    process_object.pages[1].comparisons['2500']['1'].premium_monthly = pricing.deductibles['2500'].plans.medium;
    process_object.pages[1].comparisons['2500']['2'].premium_monthly = pricing.deductibles['2500'].plans.premium;

    /**
     * Updating Pricing of Topups 
     */
    process_object.pages[2].additionals['0'].premium_monthly = additional_pricing.comparison.basic;    
    process_object.pages[2].additionals['1'].premium_monthly = additional_pricing.comparison.medium;    
    process_object.pages[2].additionals['2'].premium_monthly = additional_pricing.comparison.premium;    

    return callback(process_object);
  } catch(error){
    return err_call(error);
  }
}

// Required
this.getTemplate = () =>{
  return template
}

/* Module Exports */
module.exports = this;
