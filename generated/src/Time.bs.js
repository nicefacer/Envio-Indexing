// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';


function resolvePromiseAfterDelay(delayMilliseconds) {
  return new Promise((function (resolve, param) {
                setTimeout((function (param) {
                        resolve(undefined);
                      }), delayMilliseconds);
              }));
}

exports.resolvePromiseAfterDelay = resolvePromiseAfterDelay;
/* No side effect */