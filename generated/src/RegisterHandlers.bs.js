// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Logging = require("./Logging.bs.js");
var Caml_js_exceptions = require("rescript/lib/js/caml_js_exceptions.js");

function registerMyAwesomeContractHandlers(param) {
  try {
    ((require("../../src/EventHandlers.js")));
    return ;
  }
  catch (raw_err){
    var err = Caml_js_exceptions.internalToOCamlException(raw_err);
    Logging.error("EE500: There was an issue importing the handler file for MyAwesomeContract. Expected file at ../../src/EventHandlers.js");
    console.log(err);
    return ;
  }
}

function registerAllHandlers(param) {
  registerMyAwesomeContractHandlers(undefined);
}

exports.registerMyAwesomeContractHandlers = registerMyAwesomeContractHandlers;
exports.registerAllHandlers = registerAllHandlers;
/* Logging Not a pure module */
