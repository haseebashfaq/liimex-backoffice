"use strict";

/* Constants */
const {
    ENV,
    LOG_ERROR,
    LOG_WARNING,
    LOG_NAME_PRODUCT_SERVICE
} = require('../consts');

const {
    PROCESS_ID_NOT_FOUND,
    COUNT_NOT_UPDATE_PRODUCT_REQUEST
} = require('../errors')

/* Requirement */
const appvars = require('../config/appvars.json')[ENV];
const firebase = require('./firebase.service');
const sendlog = require('./logger.service.js');
const path = require('path');
const uuid4 = require('uuid/v4');

/* Product Data Map */
const product_data_map = {
    'food_truck' :  require('../pricing_engines/food_truck/v1/engine.js')
}

/* Get Price For Product */
function getProductEngine(product_uid) {
    return product_data_map[product_uid];
}

/* Execute On Save Function */
function executeOnSaveFunction(request_uid, on_save_function, callback, err_call){
    firebase.get_data_once(appvars.firebase.instant_product_request+request_uid, result => {
        const product_engine = product_data_map[result.instant_template];
        if(result && product_engine && product_engine[on_save_function]){
            product_engine[on_save_function](result, new_request_object => {
                firebase.update_data(appvars.firebase.instant_product_request+request_uid, new_request_object, callback, err_call);
            }, err_call);
        } else {
            return err_call();
        }
    }, err_call);
}


function updateUserData(instantProductRequestId,user_data,loginOrSignup,pageNumber,callback){
    let companyPhoneNumber=null;
    
    /*  put phonenumber in the company */
    if(user_data.phone){
        companyPhoneNumber= {"phone": user_data.phone};
    }
    const userEmail = user_data.email;
    if(userEmail){
        if(loginOrSignup ==='login'){
            getUidByEmail(userEmail,uid=>{
                updateUserId(instantProductRequestId,uid,()=>{
                    
                    /* user already exists in the auth table, get the userObj from Users table */
                    const userUrl = path.join(appvars.firebase.users,uid);
                    firebase.get_data_once(userUrl,user=>{
                        const userObj = {
                            "email":user.email,
                            "first_name":user.first_name,
                            "last_name":user.last_name,
                            "uid": uid
                        };
                        updateUserInCheckout(instantProductRequestId,userObj,()=>{
                            getCompanyFromUserId(uid,companyObj=>{
                                const company_data = {
                                    "name": companyObj.name,
                                    "type": companyObj.type,
                                    "phone": companyObj.phone
                                }
                                updateCompanyInCheckout(instantProductRequestId,company_data,()=>{
                                    getMainAddressFromUserId(uid,mainAddress=>{
                                        updateAddressInCheckout(instantProductRequestId,mainAddress,()=>callback(null),error=>callback({"error":error}));
                                    },error=>callback({"error":error}));
                                },error=>callback({"error":error}));
                            },error=>err_call(error));
                        },error=>{
                            callback({"error":error})
                        });
                    }
                );
            },error=>callback({"error":error}));
        },error=>callback({"error":error}));
    }
    else if(loginOrSignup ==='signup'){
        
        getUidByEmail(userEmail,()=>{
            
            /* user trying to signup using an existing email address, throw an error */
            callback({"error":"email address already exists"});
        },()=>{
            
            /* user does not exist in the Auth table, create a new one */
            createUserAndAuthRecord(user_data,user=>{
                updateUserId(instantProductRequestId,user.uid,()=>{
                    updateUserInCheckout(instantProductRequestId,user_data,()=>{
                        if(companyPhoneNumber){
                            updateCompanyInCheckout(instantProductRequestId,companyPhoneNumber,()=>callback(null),error=>callback({"error":error}));
                        }
                        else{
                            
                            /* success bcos entering company phone number is optional */
                            callback(null,"success");
                        }
                    },error=>callback({"error":error}));
                },error=>callback({"error":error}));
            },error=>callback({"error":error}));
        });
    }else{
        callback({"error":"login or signup flag not set"});
    }
}
}


/* Get uid By Email */
function getUidByEmail(email, callback, err) {
    firebase.fetch_auth_record_by_email(email,(error, uid)=>{
        if (error){
            return err(error);
        }
        callback(uid);
    });
}

/* Create User Auth Record  and user object in the db*/
function createUserAndAuthRecord(userObj, callback,err_call){
    const password = uuid4();
    const email = userObj.email;
    firebase.create_user_auth_record({email,password},firebase_user=>{
        const userUrl= path.join(appvars.firebase.users,firebase_user.uid);
        firebase.update_data(userUrl,userObj,()=>{
            callback(firebase_user);
        },error=>err_call(error));
    },err_call);
}

function updateUserInCheckout(instantProductRequestId,userObj,callback,err_call){
    let checkOutPageNumber = null;
    firebase.get_data_once(path.join(appvars.firebase.instant_product_request,instantProductRequestId),productRequestObj=>{
        if(productRequestObj.pages){
            for(let pageNumber in productRequestObj.pages){
                if(productRequestObj.pages[pageNumber].checkout){
                    checkOutPageNumber = pageNumber;
                    break;
                }
            }
            if(checkOutPageNumber){
                
                /* TODO: create consts for the path's names ; lik'checkout, company etc,.' */
                const updateUrl = path.join(appvars.firebase.instant_product_request,instantProductRequestId,"/pages/",checkOutPageNumber,"/checkout/user");
                firebase.update_data(updateUrl,userObj,data=>callback(data),error=>err_call(error));
            }
        }
    });
}

function updateCompanyInCheckout(instantProductRequestId,companyObj,callback,err_call){
    let checkOutPageNumber = null;
    firebase.get_data_once(path.join(appvars.firebase.instant_product_request,instantProductRequestId),productRequestObj=>{
        if(productRequestObj.pages){
            for(let pageNumber in productRequestObj.pages){
                if(productRequestObj.pages[pageNumber].checkout){
                    checkOutPageNumber = pageNumber;
                    break;
                }
            }
            if(checkOutPageNumber){
                
                /* TODO: create consts for the path's names ; lik'checkout, company etc,.' */
                const updateUrl = path.join(appvars.firebase.instant_product_request,instantProductRequestId,"/pages/",checkOutPageNumber,"/checkout/company");
                firebase.update_data(updateUrl,companyObj,data=>callback(data),error=>err_call(error));
            }
        }
    });
}

function updateAddressInCheckout(instantProductRequestId,addressObj,callback,err_call){
    let checkOutPageNumber = null;
    firebase.get_data_once(path.join(appvars.firebase.instant_product_request,instantProductRequestId),productRequestObj=>{
        if(productRequestObj.pages){
            for(let pageNumber in productRequestObj.pages){
                if(productRequestObj.pages[pageNumber].checkout){
                    checkOutPageNumber = pageNumber;
                    break;
                }
            }
            if(checkOutPageNumber){
                
                /* TODO: create consts for the path's names ; lik'checkout, company etc,.' */
                const updateUrl = path.join(appvars.firebase.instant_product_request,instantProductRequestId,"/pages/",checkOutPageNumber,"/checkout/address");
                firebase.update_data(updateUrl,addressObj,data=>callback(data),error=>err_call(error));
            }
        }
    });
}



function getCompanyFromUserId(userId,callback,err_call){
    const employmentUrl = appvars.firebase.employments+userId;
    firebase.get_data_once(employmentUrl,employmentObj=>{
        if(employmentObj && employmentObj.company){
            const companyUrl = appvars.firebase.companies + employmentObj.company;
            firebase.get_data_once(companyUrl,companyObj=>callback(companyObj),err_call)
        }
        else{
            err_call({"error":"employment Object not found"});
        }
    },err_call);
}

function getMainAddressFromUserId(userId,callback,err_call){
    const employmentUrl = appvars.firebase.employments+userId;
    firebase.get_data_once(employmentUrl,employmentObj=>{
        if(employmentObj && employmentObj.company){
            firebase.get_data_once_equal_to('addresses','company',employmentObj.company,addresses=>{
                for(let addressId in addresses){
                    if(addresses[addressId].main){
                        callback(addresses[addressId]);
                        break;
                    }
                }
            },error=>err_call(error));
        }
        else{
            err_call({"error":"employment Object not found"});
        }
    },err_call);


}

function updateCheckout(instantProductRequestId,checkout_data,pageNumber,callback){
    const updateUrl = appvars.firebase.instant_product_request+"/"+instantProductRequestId+"/pages/"+pageNumber+"/checkout";
    firebase.update_data(updateUrl,checkout_data,()=>{
        updateCurrentPageNumber(instantProductRequestId,pageNumber,()=>{
            
            /* check if the user's company already exists in the db */
            getUidByProductRequestId(instantProductRequestId,uid=>{
                getCompanyFromUserId(uid,()=>callback(null),()=>{
                    
                    /* there's no company available, for the user, create a new one */
                    createNewCompany(uid,checkout_data.company,()=>
                    callback(null),
                    error=>callback({"error":error}));
                });
            },error=>callback({"error":error}));
        },error=>callback({"error":error}));
    },error=>callback({"error":error}));
}

function getUidByProductRequestId(instantProductRequestId,callback,err_call){
    firebase.get_data_once(appvars.firebase.instant_product_request,productRequestObj=>{
        const uid = productRequestObj.uid;
        callback(uid);
    },err_call);
}

function createNewCompany (userId,companyObj,callback,err_call){
    const employmentUrl = appvars.firebase.employments+userId;
    firebase.push_data(appvars.firebase.companies,companyObj,companyId=>{
        firebase.update_data(employmentUrl,{"company":companyId},callback,err_call);
    },err_call);
}

function updateCurrentPageNumber(instantProductRequestId,page_number,callback,err_call){
    const updatePageNumPath = path.join(appvars.firebase.instant_product_request,instantProductRequestId);
    let currentPageNumber = page_number;
    currentPageNumber++;
    firebase.update_data(updatePageNumPath,{"current_page":currentPageNumber},()=>callback(null),error=>err_call({"error":error}));
}

function updateUserId(instantProductRequestId,uid,callback,err_call){
    const updateUserIdPath = path.join(appvars.firebase.instant_product_request,instantProductRequestId);
    firebase.update_data(updateUserIdPath,{"uid":uid},()=>callback(null),()=>err_call({"error":error}));
}

function processComplete(instantProductRequestId,process_status,callback){
    const processCompleteUrl = appvars.firebase.instant_product_request+"/"+instantProductRequestId;
    firebase.update_data(processCompleteUrl,{"process_status":process_status},processCompleted=>{
        callback(null, processCompleted);
    }, error=>callback({"error":error}));
}

/* instant products requests */
/* Module Exports */
module.exports = {
    updateUserData,
    getProductEngine,
    executeOnSaveFunction,
    updateCheckout,
    updateCurrentPageNumber,
    processComplete
}

