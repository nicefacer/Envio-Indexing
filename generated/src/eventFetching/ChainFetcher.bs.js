// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Logging = require("../Logging.bs.js");
var EventUtils = require("../EventUtils.bs.js");
var ChainWorker = require("./ChainWorker.bs.js");
var ChainEventQueue = require("./ChainEventQueue.bs.js");
var RawEventsWorker = require("./chainWorkers/RawEventsWorker.bs.js");
var Caml_js_exceptions = require("rescript/lib/js/caml_js_exceptions.js");

function make(chainConfig, maxQueueSize, shouldSyncFromRawEvents) {
  var logger = Logging.createChild({
        chainId: chainConfig.chainId
      });
  var chainWorkerRef = {
    contents: undefined
  };
  var match = chainConfig.syncSource;
  var chainConfigWorkerNoCallback;
  switch (match.TAG | 0) {
    case /* Rpc */0 :
        chainConfigWorkerNoCallback = {
          TAG: /* RpcSelectedWithCallback */0,
          _0: undefined
        };
        break;
    case /* Skar */1 :
        chainConfigWorkerNoCallback = {
          TAG: /* SkarSelectedWithCallback */1,
          _0: undefined
        };
        break;
    case /* EthArchive */2 :
        chainConfigWorkerNoCallback = {
          TAG: /* EthArchiveSelectedWithCallback */2,
          _0: undefined
        };
        break;
    
  }
  var fetchedEventQueue = ChainEventQueue.make(maxQueueSize);
  var chainWorkerWithCallback;
  if (shouldSyncFromRawEvents) {
    var finishedSyncCallback = async function (worker) {
      await RawEventsWorker.stopFetchingEvents(worker);
      Logging.childInfo(logger, "Finished reprocessed cached events, starting fetcher");
      var contractAddressMapping = worker.contractAddressMapping;
      var latestFetchedEventId = await worker.latestFetchedEventId;
      var match = EventUtils.unpackEventIndex(latestFetchedEventId);
      var startBlock = match.blockNumber + 1 | 0;
      chainWorkerRef.contents = ChainWorker.make(chainConfig, contractAddressMapping, chainConfigWorkerNoCallback);
      ChainWorker.startWorker(chainWorkerRef.contents)(startBlock, logger, fetchedEventQueue);
    };
    chainWorkerWithCallback = {
      TAG: /* RawEventsSelectedWithCallback */3,
      _0: finishedSyncCallback
    };
  } else {
    chainWorkerWithCallback = chainConfigWorkerNoCallback;
  }
  chainWorkerRef.contents = ChainWorker.make(chainConfig, undefined, chainWorkerWithCallback);
  return {
          logger: logger,
          fetchedEventQueue: fetchedEventQueue,
          chainConfig: chainConfig,
          chainWorker: chainWorkerRef
        };
}

async function startFetchingEvents(self) {
  try {
    ChainWorker.startFetchingEvents(self.chainWorker.contents)(self.logger, self.fetchedEventQueue);
    return {
            TAG: /* Ok */0,
            _0: undefined
          };
  }
  catch (raw_err){
    var err = Caml_js_exceptions.internalToOCamlException(raw_err);
    Logging.childError(self.logger, {
          err: err,
          msg: "error while running chainWorker on chain " + String(self.chainConfig.chainId) + ""
        });
    return {
            TAG: /* Error */1,
            _0: err
          };
  }
}

async function popAndAwaitQueueItem(self) {
  return await ChainEventQueue.popSingleAndAwaitItem(self.fetchedEventQueue);
}

function popQueueItem(self) {
  return ChainEventQueue.popSingle(self.fetchedEventQueue);
}

function addDynamicContractAndFetchMissingEvents(self, dynamicContracts, fromBlock, fromLogIndex) {
  return ChainWorker.addDynamicContractAndFetchMissingEvents(self.chainWorker.contents)(dynamicContracts, fromBlock, fromLogIndex, self.logger);
}

function peekFrontItemOfQueue(self) {
  var optFront = ChainEventQueue.peekFront(self.fetchedEventQueue);
  if (optFront !== undefined) {
    return {
            TAG: /* Item */1,
            _0: optFront
          };
  }
  var latestFetchedBlockTimestamp = ChainWorker.getLatestFetchedBlockTimestamp(self.chainWorker.contents);
  return {
          TAG: /* NoItem */0,
          _0: latestFetchedBlockTimestamp,
          _1: self.chainConfig.chainId
        };
}

function addNewRangeQueriedCallback(self) {
  return ChainWorker.addNewRangeQueriedCallback(self.chainWorker.contents);
}

exports.make = make;
exports.startFetchingEvents = startFetchingEvents;
exports.popAndAwaitQueueItem = popAndAwaitQueueItem;
exports.popQueueItem = popQueueItem;
exports.addDynamicContractAndFetchMissingEvents = addDynamicContractAndFetchMissingEvents;
exports.peekFrontItemOfQueue = peekFrontItemOfQueue;
exports.addNewRangeQueriedCallback = addNewRangeQueriedCallback;
/* Logging Not a pure module */
