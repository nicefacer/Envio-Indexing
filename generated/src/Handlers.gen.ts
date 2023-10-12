/* TypeScript file generated from Handlers.res by genType. */
/* eslint-disable import/first */


// @ts-ignore: Implicit any on import
const Curry = require('rescript/lib/js/curry.js');

// @ts-ignore: Implicit any on import
const HandlersBS = require('./Handlers.bs');

import type {MyAwesomeContractContract_AwesomeEventEvent_context as Types_MyAwesomeContractContract_AwesomeEventEvent_context} from './Types.gen';

import type {MyAwesomeContractContract_AwesomeEventEvent_eventArgs as Types_MyAwesomeContractContract_AwesomeEventEvent_eventArgs} from './Types.gen';

import type {MyAwesomeContractContract_AwesomeEventEvent_loaderContext as Types_MyAwesomeContractContract_AwesomeEventEvent_loaderContext} from './Types.gen';

import type {eventLog as Types_eventLog} from './Types.gen';

export const MyAwesomeContractContract_AwesomeEvent_loader: (userLoader:((_1:{ readonly event: Types_eventLog<Types_MyAwesomeContractContract_AwesomeEventEvent_eventArgs>; readonly context: Types_MyAwesomeContractContract_AwesomeEventEvent_loaderContext }) => void)) => void = function (Arg1: any) {
  const result = HandlersBS.MyAwesomeContractContract.AwesomeEvent.loader(function (Argevent: any, Argcontext: any) {
      const result1 = Arg1({event:Argevent, context:Argcontext});
      return result1
    });
  return result
};

export const MyAwesomeContractContract_AwesomeEvent_handler: (userHandler:((_1:{ readonly event: Types_eventLog<Types_MyAwesomeContractContract_AwesomeEventEvent_eventArgs>; readonly context: Types_MyAwesomeContractContract_AwesomeEventEvent_context }) => void)) => void = function (Arg1: any) {
  const result = HandlersBS.MyAwesomeContractContract.AwesomeEvent.handler(function (Argevent: any, Argcontext: any) {
      const result1 = Arg1({event:Argevent, context:{log:{debug:Argcontext.log.debug, info:Argcontext.log.info, warn:Argcontext.log.warn, error:Argcontext.log.error, errorWithExn:function (Arg11: any, Arg2: any) {
          const result2 = Curry._2(Argcontext.log.errorWithExn, Arg11, Arg2);
          return result2
        }}, awesomeEntity:Argcontext.awesomeEntity}});
      return result1
    });
  return result
};
