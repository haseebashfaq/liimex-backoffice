/**
 *  General Functions Service
 */

"use strict";

/* Get Thousands Separator */
function getSepThousands(number){
  if(number === undefined){ return }

  let decimal = number.toString().split('.')[1];
  decimal = decimal ? decimal : '00';
  decimal = decimal.charAt(1) ? decimal : decimal+'0';
  decimal = decimal.split("").reverse().join("");
  number = number.toString().split('.')[0];
  const string = number.toString().split("").reverse().join("");
  let new_string = "";
  for(let i=0; i<string.length; i++){
    new_string += (i+1)%3 === 0 && i<string.length-1 ? string[i]+'.' : string[i];
  }
  new_string = decimal + ',' + new_string;
  return new_string.split("").reverse().join("");
}

/* Capitalize */
function capitalize(string){
  if (typeof string !== 'string') return;

  return string.charAt(0).toUpperCase() + string.slice(1);
}

/* Convert Stamp To Date */
function convertStampToDate(stamp) {
  const rawDate = new Date(stamp);
  rawDate.setHours(rawDate.getHours()-1);
  if ( rawDate !== "Invalid Date" ) {
    return  rawDate.toDateString() + " " + rawDate.toTimeString();
  }
  return "undefined"
}

/* Parse To Year */
function parseToDate(date){
  date = parseInt(date)*1000;
  return new Date(date).toLocaleString("fr-FR", {timeZone: "Europe/Berlin"}).slice(0,8);
}

/* Exports */
module.exports = {
  getSepThousands,
  capitalize,
  convertStampToDate,
  parseToDate
};
