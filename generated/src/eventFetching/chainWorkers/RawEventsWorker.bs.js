// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var SDSL = require("../../bindings/SDSL.bs.js");
var Curry = require("rescript/lib/js/curry.js");
var Utils = require("../../Utils.bs.js");
var Ethers = require("../../bindings/Ethers.bs.js");
var Js_dict = require("rescript/lib/js/js_dict.js");
var Logging = require("../../Logging.bs.js");
var JsSdsl = require("js-sdsl");
var RpcWorker = require("./RpcWorker.bs.js");
var Belt_Array = require("rescript/lib/js/belt_Array.js");
var Caml_array = require("rescript/lib/js/caml_array.js");
var Converters = require("../../Converters.bs.js");
var EventUtils = require("../../EventUtils.bs.js");
var Belt_Option = require("rescript/lib/js/belt_Option.js");
var Belt_Result = require("rescript/lib/js/belt_Result.js");
var Caml_option = require("rescript/lib/js/caml_option.js");
var DbFunctions = require("../../DbFunctions.bs.js");
var SourceWorker = require("./SourceWorker.bs.js");
var ChainEventQueue = require("../ChainEventQueue.bs.js");
var ContractAddressingMap = require("../../ContractAddressingMap.bs.js");

function make(param) {
  return {};
}

function add(self, registration) {
  self[Ethers.ethAddressToString(registration.address)] = registration;
}

function getRegistration(self, address, eventId) {
  return Belt_Option.map(Js_dict.get(self, Ethers.ethAddressToString(address)), (function (reg) {
                if (Ethers.$$BigInt.gte(reg.eventId, eventId)) {
                  return {
                          TAG: /* SameOrLater */0,
                          _0: reg
                        };
                } else {
                  return {
                          TAG: /* Earlier */1,
                          _0: reg
                        };
                }
              }));
}

function getUnusedContractRegistrations(self, currentRegistrations) {
  return Belt_Array.keepMap(Js_dict.values(self), (function (param) {
                var address = param.address;
                var match = ContractAddressingMap.getContractNameFromAddress(currentRegistrations, address);
                if (match !== undefined) {
                  return ;
                } else {
                  return Caml_option.some(address);
                }
              }));
}

var PreviousDynamicContractAddresses = {
  make: make,
  add: add,
  getRegistration: getRegistration,
  getUnusedContractRegistrations: getUnusedContractRegistrations
};

function stopFetchingEvents(_self) {
  return Promise.resolve(undefined);
}

function make$1(caughtUpToHeadHook, contractAddressMapping, chainConfig) {
  var logger = Logging.createChild({
        chainId: chainConfig.chainId,
        workerType: "Raw Events",
        loggerFor: "Used only in logging regestration of static contract addresses"
      });
  var contractAddressMapping$1;
  if (contractAddressMapping !== undefined) {
    contractAddressMapping$1 = contractAddressMapping;
  } else {
    var m = ContractAddressingMap.make(undefined);
    ContractAddressingMap.registerStaticAddresses(m, chainConfig, logger);
    contractAddressMapping$1 = m;
  }
  var match = chainConfig.syncSource;
  var sourceWorker;
  switch (match.TAG | 0) {
    case /* Rpc */0 :
        sourceWorker = {
          TAG: /* Rpc */0,
          _0: RpcWorker.make(undefined, contractAddressMapping$1, chainConfig)
        };
        break;
    case /* Skar */1 :
        sourceWorker = {
          TAG: /* Skar */1,
          _0: Curry._3(SourceWorker.SkarWorker.make, undefined, contractAddressMapping$1, chainConfig)
        };
        break;
    case /* EthArchive */2 :
        sourceWorker = {
          TAG: /* EthArchive */2,
          _0: Curry._3(SourceWorker.EthArchiveWorker.make, undefined, contractAddressMapping$1, chainConfig)
        };
        break;
    
  }
  ContractAddressingMap.registerStaticAddresses(contractAddressMapping$1, chainConfig, logger);
  return {
          latestFetchedBlockTimestamp: 0,
          latestFetchedEventId: Promise.resolve(BigInt(0)),
          chainId: chainConfig.chainId,
          newRangeQueriedCallBacks: new JsSdsl.Queue(),
          previousDynamicContractAddresses: {},
          contractAddressMapping: contractAddressMapping$1,
          caughtUpToHeadHook: caughtUpToHeadHook,
          sourceWorker: sourceWorker
        };
}

async function startWorker(self, startBlock, logger, fetchedEventQueue) {
  var eventIdRef = BigInt(0);
  var hasMoreRawEvents = true;
  while(hasMoreRawEvents) {
    var match = Utils.createPromiseWithHandles(undefined);
    var latestEventIdResolve = match.resolve;
    var lastFetchedEventId = await self.latestFetchedEventId;
    self.latestFetchedEventId = match.pendingPromise;
    var contractAddresses = ContractAddressingMap.getAllAddresses(self.contractAddressMapping);
    var page = await DbFunctions.RawEvents.getRawEventsPageGtOrEqEventId(DbFunctions.sql, self.chainId, eventIdRef, 50000, contractAddresses);
    var parsedEventsUnsafe = Belt_Result.getExn(Utils.mapArrayOfResults(Belt_Array.map(page, Converters.parseRawEvent)));
    for(var i = 0 ,i_finish = parsedEventsUnsafe.length; i < i_finish; ++i){
      var parsedEvent = Caml_array.get(parsedEventsUnsafe, i);
      var queueItem_timestamp = parsedEvent.timestamp;
      var queueItem_chainId = self.chainId;
      var queueItem_blockNumber = parsedEvent.blockNumber;
      var queueItem_logIndex = parsedEvent.logIndex;
      var queueItem_event = parsedEvent.event;
      var queueItem = {
        timestamp: queueItem_timestamp,
        chainId: queueItem_chainId,
        blockNumber: queueItem_blockNumber,
        logIndex: queueItem_logIndex,
        event: queueItem_event
      };
      await ChainEventQueue.awaitQueueSpaceAndPushItem(fetchedEventQueue, queueItem);
      SDSL.Queue.popForEach(self.newRangeQueriedCallBacks, (function (callback) {
              Curry._1(callback, undefined);
            }));
    }
    var lastItemInPage = Belt_Array.get(page, page.length - 1 | 0);
    if (lastItemInPage !== undefined) {
      var lastEventId = BigInt(lastItemInPage.event_id);
      Curry._1(latestEventIdResolve, lastEventId);
      eventIdRef = Ethers.$$BigInt.add(lastEventId, BigInt(1));
      self.latestFetchedBlockTimestamp = lastItemInPage.block_timestamp;
    } else {
      Curry._1(latestEventIdResolve, lastFetchedEventId);
      hasMoreRawEvents = false;
    }
  };
  SDSL.Queue.popForEach(self.newRangeQueriedCallBacks, (function (callback) {
          Curry._1(callback, undefined);
        }));
  Belt_Option.map(self.caughtUpToHeadHook, (function (hook) {
          return Curry._1(hook, self);
        }));
}

async function startFetchingEvents(self, logger, fetchedEventQueue) {
  Logging.childTrace(logger, {
        msg: "Starting resync from cached events."
      });
  var dynamicContracts = await DbFunctions.DynamicContractRegistry.readDynamicContractsOnChainIdAtOrBeforeBlock(DbFunctions.sql, self.chainId, 0);
  Belt_Array.forEach(dynamicContracts, (function (param) {
          add(self.previousDynamicContractAddresses, {
                address: param.contract_address,
                eventId: param.event_id
              });
        }));
  return await startWorker(self, 0, logger, fetchedEventQueue);
}

function addNewRangeQueriedCallback(self) {
  return ChainEventQueue.insertCallbackAwaitPromise(self.newRangeQueriedCallBacks);
}

function getLatestFetchedBlockTimestamp(self) {
  return self.latestFetchedBlockTimestamp;
}

function getContractAddressMapping(self) {
  return self.contractAddressMapping;
}

function compare(param) {
  return EventUtils.getEventComparator({
              timestamp: param.timestamp,
              chainId: param.chainId,
              blockNumber: param.blockNumber,
              logIndex: param.logIndex
            });
}

function mergeSortEventBatches(itemsA, itemsB) {
  return Utils.mergeSorted(compare, itemsA, itemsB);
}

function sortOrderedEventBatchArrays(batches) {
  return Belt_Array.reduce(batches, [], (function (accum, nextBatch) {
                return Utils.mergeSorted(compare, accum, nextBatch);
              }));
}

async function addDynamicContractAndFetchMissingEvents(self, dynamicContracts, fromBlock, fromLogIndex, logger) {
  var latestFetchedEventId = await self.latestFetchedEventId;
  var eventIdOfStartOfBlock = EventUtils.packEventIndex(fromBlock, 0);
  var unaddedDynamicContracts = Belt_Array.keep(dynamicContracts, (function (param) {
          return ContractAddressingMap.addAddressIfNotExists(self.contractAddressMapping, param.contract_type, param.contract_address);
        }));
  var match = Belt_Array.reduce(unaddedDynamicContracts, [
        [],
        [],
        []
      ], (function (param, contract) {
          var newDynamicContracts = param[2];
          var existingDynamicContractsWithMissingEvents = param[1];
          var existingDynamicContracts = param[0];
          var previousDynamicContractRegistered = getRegistration(self.previousDynamicContractAddresses, contract.contract_address, contract.event_id);
          if (previousDynamicContractRegistered !== undefined) {
            if (previousDynamicContractRegistered.TAG === /* SameOrLater */0) {
              return [
                      Belt_Array.concat(existingDynamicContracts, [contract.contract_address]),
                      existingDynamicContractsWithMissingEvents,
                      newDynamicContracts
                    ];
            } else {
              return [
                      Belt_Array.concat(existingDynamicContracts, [contract.contract_address]),
                      Belt_Array.concat(existingDynamicContractsWithMissingEvents, [contract]),
                      newDynamicContracts
                    ];
            }
          } else {
            return [
                    existingDynamicContracts,
                    existingDynamicContractsWithMissingEvents,
                    Belt_Array.concat(newDynamicContracts, [contract])
                  ];
          }
        }));
  var newDynamicContracts = match[2];
  var existingDynamicContracts = match[0];
  var getPageFromRawEvents = function (fromEventId) {
    return DbFunctions.RawEvents.getRawEventsPageWithinEventIdRangeInclusive(DbFunctions.sql, self.chainId, fromEventId, latestFetchedEventId, 50000, existingDynamicContracts);
  };
  var getExistingFromRawEvents = async function (queueItems, fromEventId, param) {
    var page = await getPageFromRawEvents(fromEventId);
    var currentQueueItems = Belt_Option.getWithDefault(queueItems, []);
    if (page.length === 0) {
      return currentQueueItems;
    }
    var newQueueItems = Belt_Array.map(page, (function (rawEvent) {
            var parsedEvent = Belt_Result.getExn(Converters.parseRawEvent(rawEvent));
            return {
                    timestamp: parsedEvent.timestamp,
                    chainId: self.chainId,
                    blockNumber: parsedEvent.blockNumber,
                    logIndex: parsedEvent.logIndex,
                    event: parsedEvent.event
                  };
          }));
    var lastItemInPage = Belt_Array.get(page, page.length - 1 | 0);
    var nextEventId = EventUtils.packEventIndex(lastItemInPage.block_number, lastItemInPage.log_index + 1 | 0);
    var queueItems$1 = Belt_Array.concat(currentQueueItems, newQueueItems);
    return await getExistingFromRawEvents(queueItems$1, nextEventId, undefined);
  };
  var existingDynamicContractsQueueItems = getExistingFromRawEvents(undefined, eventIdOfStartOfBlock, undefined);
  var missingDynamicContractQueueItems = Promise.all(Belt_Array.map(match[1], (function (dynamicContract) {
                var match = EventUtils.unpackEventIndex(dynamicContract.event_id);
                return Curry._5(SourceWorker.fetchArbitraryEvents(self.sourceWorker), [dynamicContract], fromBlock, fromLogIndex, match.blockNumber - 1 | 0, logger);
              }))).then(sortOrderedEventBatchArrays);
  var newDynamicContractsQueueItems = DbFunctions.RawEvents.getLatestProcessedBlockNumber(self.chainId).then(function (latestRawEventBlock) {
        if (latestRawEventBlock !== undefined) {
          return Curry._5(SourceWorker.fetchArbitraryEvents(self.sourceWorker), newDynamicContracts, fromBlock, fromLogIndex, latestRawEventBlock, logger);
        } else {
          return Promise.resolve([]);
        }
      });
  return await Promise.all([
                existingDynamicContractsQueueItems,
                missingDynamicContractQueueItems,
                newDynamicContractsQueueItems
              ]).then(sortOrderedEventBatchArrays);
}

var pageLimitSize = 50000;

exports.pageLimitSize = pageLimitSize;
exports.PreviousDynamicContractAddresses = PreviousDynamicContractAddresses;
exports.stopFetchingEvents = stopFetchingEvents;
exports.make = make$1;
exports.startWorker = startWorker;
exports.startFetchingEvents = startFetchingEvents;
exports.addNewRangeQueriedCallback = addNewRangeQueriedCallback;
exports.getLatestFetchedBlockTimestamp = getLatestFetchedBlockTimestamp;
exports.getContractAddressMapping = getContractAddressMapping;
exports.compare = compare;
exports.mergeSortEventBatches = mergeSortEventBatches;
exports.sortOrderedEventBatchArrays = sortOrderedEventBatchArrays;
exports.addDynamicContractAndFetchMissingEvents = addDynamicContractAndFetchMissingEvents;
/* SDSL Not a pure module */