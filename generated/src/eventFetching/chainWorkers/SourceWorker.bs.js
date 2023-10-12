// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("rescript/lib/js/curry.js");
var HyperSync = require("../hypersync/HyperSync.bs.js");
var RpcWorker = require("./RpcWorker.bs.js");
var HyperSyncWorker = require("./HyperSyncWorker.bs.js");

var $$let = HyperSyncWorker.Make(HyperSync.SkarHyperSync);

var SkarWorker_make = $$let.make;

var SkarWorker_fetchArbitraryEvents = $$let.fetchArbitraryEvents;

var SkarWorker = {
  make: SkarWorker_make,
  fetchArbitraryEvents: SkarWorker_fetchArbitraryEvents
};

var $$let$1 = HyperSyncWorker.Make(HyperSync.EthArchiveHyperSync);

var EthArchiveWorker_make = $$let$1.make;

var EthArchiveWorker_fetchArbitraryEvents = $$let$1.fetchArbitraryEvents;

var EthArchiveWorker = {
  make: EthArchiveWorker_make,
  fetchArbitraryEvents: EthArchiveWorker_fetchArbitraryEvents
};

function fetchArbitraryEvents(worker) {
  switch (worker.TAG | 0) {
    case /* Rpc */0 :
        var partial_arg = worker._0;
        return function (param, param$1, param$2, param$3, param$4) {
          return RpcWorker.fetchArbitraryEvents(partial_arg, param, param$1, param$2, param$3, param$4);
        };
    case /* Skar */1 :
        return Curry._1($$let.fetchArbitraryEvents, worker._0);
    case /* EthArchive */2 :
        return Curry._1($$let$1.fetchArbitraryEvents, worker._0);
    
  }
}

exports.SkarWorker = SkarWorker;
exports.EthArchiveWorker = EthArchiveWorker;
exports.fetchArbitraryEvents = fetchArbitraryEvents;
/* let Not a pure module */
