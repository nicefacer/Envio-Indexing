// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Hrtime = require("../bindings/Hrtime.bs.js");
var Js_dict = require("rescript/lib/js/js_dict.js");
var Logging = require("../Logging.bs.js");
var JsSdsl = require("js-sdsl");
var Caml_obj = require("rescript/lib/js/caml_obj.js");
var Belt_Array = require("rescript/lib/js/belt_Array.js");
var EventUtils = require("../EventUtils.bs.js");
var Belt_Result = require("rescript/lib/js/belt_Result.js");
var ChainFetcher = require("./ChainFetcher.bs.js");
var Caml_exceptions = require("rescript/lib/js/caml_exceptions.js");

function getComparitorFromItem(queueItem) {
  return EventUtils.getEventComparator({
              timestamp: queueItem.timestamp,
              chainId: queueItem.chainId,
              blockNumber: queueItem.blockNumber,
              logIndex: queueItem.logIndex
            });
}

function priorityQueueComparitor(a, b) {
  if (Caml_obj.lessthan(getComparitorFromItem(a), getComparitorFromItem(b))) {
    return -1;
  } else {
    return 1;
  }
}

function chainFetcherPeekComparitorEarliestEvent(a, b) {
  if (a.TAG === /* NoItem */0) {
    var chainId = a._1;
    var latestFetchedBlockTimestampA = a._0;
    if (b.TAG === /* NoItem */0) {
      return Caml_obj.lessthan([
                  latestFetchedBlockTimestampA,
                  chainId
                ], [
                  b._0,
                  b._1
                ]);
    }
    var itemB = b._0;
    return Caml_obj.lessthan([
                latestFetchedBlockTimestampA,
                chainId
              ], [
                itemB.timestamp,
                itemB.chainId
              ]);
  }
  var itemA = a._0;
  if (b.TAG === /* NoItem */0) {
    return Caml_obj.lessthan([
                itemA.timestamp,
                itemA.chainId
              ], [
                b._0,
                b._1
              ]);
  } else {
    return Caml_obj.lessthan(getComparitorFromItem(itemA), getComparitorFromItem(b._0));
  }
}

function determineNextEvent(chainFetchersPeeks) {
  var nextItem = Belt_Array.reduce(chainFetchersPeeks, undefined, (function (accum, valB) {
          if (accum !== undefined && chainFetcherPeekComparitorEarliestEvent(accum, valB)) {
            return accum;
          } else {
            return valB;
          }
        }));
  if (nextItem !== undefined) {
    return {
            TAG: /* Ok */0,
            _0: nextItem
          };
  } else {
    return {
            TAG: /* Error */1,
            _0: /* NoItemsInArray */0
          };
  }
}

function make(configs, maxQueueSize, shouldSyncFromRawEvents) {
  var chainFetchers = Js_dict.fromArray(Belt_Array.map(Js_dict.entries(configs), (function (param) {
              return [
                      param[0],
                      ChainFetcher.make(param[1], maxQueueSize, shouldSyncFromRawEvents)
                    ];
            })));
  return {
          chainFetchers: chainFetchers,
          arbitraryEventPriorityQueue: new JsSdsl.PriorityQueue([], priorityQueueComparitor)
        };
}

function startFetchers(self) {
  Belt_Array.forEach(Js_dict.values(self.chainFetchers), (function (fetcher) {
          ChainFetcher.startFetchingEvents(fetcher);
        }));
}

var UndefinedChain = /* @__PURE__ */Caml_exceptions.create("ChainManager.UndefinedChain");

function getChainFetcher(self, chainId) {
  var fetcher = Js_dict.get(self.chainFetchers, String(chainId));
  if (fetcher !== undefined) {
    return fetcher;
  }
  Logging.error("EE1000: Undefined chain " + String(chainId) + " in chain manager. Please verify that the chain ID defined in the config.yaml file is valid.");
  throw {
        RE_EXN_ID: UndefinedChain,
        _1: chainId,
        Error: new Error()
      };
}

function popBatchItem(self) {
  var peekChainFetcherFrontItems = Belt_Array.map(Js_dict.values(self.chainFetchers), ChainFetcher.peekFrontItemOfQueue);
  var nextItemFromBuffer = Belt_Result.getExn(determineNextEvent(peekChainFetcherFrontItems));
  var popNextItem = function (param) {
    if (nextItemFromBuffer.TAG === /* NoItem */0) {
      return ;
    } else {
      return ChainFetcher.popQueueItem(getChainFetcher(self, nextItemFromBuffer._0.chainId));
    }
  };
  var peekedArbTopItem = self.arbitraryEventPriorityQueue.top();
  if (peekedArbTopItem === undefined) {
    return popNextItem(undefined);
  }
  var arbItemIsEarlier = chainFetcherPeekComparitorEarliestEvent({
        TAG: /* Item */1,
        _0: peekedArbTopItem
      }, nextItemFromBuffer);
  if (arbItemIsEarlier) {
    return self.arbitraryEventPriorityQueue.pop();
  } else {
    return popNextItem(undefined);
  }
}

function getChainIdFromBufferPeekItem(peekItem) {
  if (peekItem.TAG === /* NoItem */0) {
    return peekItem._1;
  } else {
    return peekItem._0.chainId;
  }
}

function getBlockNumberFromBufferPeekItem(peekItem) {
  if (peekItem.TAG === /* NoItem */0) {
    return ;
  } else {
    return peekItem._0.blockNumber;
  }
}

function getAllBlockLogs(self, _bufferItem, _blockGroupedBatchItems) {
  while(true) {
    var blockGroupedBatchItems = _blockGroupedBatchItems;
    var bufferItem = _bufferItem;
    var popNextItemOnChainQueueAndRecurse = (function(bufferItem,blockGroupedBatchItems){
    return function popNextItemOnChainQueueAndRecurse(param) {
      if (bufferItem.TAG === /* NoItem */0) {
        if (blockGroupedBatchItems.length !== 0) {
          return blockGroupedBatchItems;
        } else {
          return ;
        }
      }
      var batchItem = bufferItem._0;
      var fetcher = getChainFetcher(self, batchItem.chainId);
      ChainFetcher.popQueueItem(fetcher);
      var nextBlockGroupedBatchItems = Belt_Array.concat(blockGroupedBatchItems, [batchItem]);
      var peakedNextItem = ChainFetcher.peekFrontItemOfQueue(fetcher);
      if (peakedNextItem.TAG === /* NoItem */0) {
        if (nextBlockGroupedBatchItems.length !== 0) {
          return nextBlockGroupedBatchItems;
        } else {
          return ;
        }
      } else if (peakedNextItem._0.blockNumber === batchItem.blockNumber) {
        return getAllBlockLogs(self, peakedNextItem, nextBlockGroupedBatchItems);
      } else {
        return nextBlockGroupedBatchItems;
      }
    }
    }(bufferItem,blockGroupedBatchItems));
    var peekedArbTopItem = self.arbitraryEventPriorityQueue.top();
    if (peekedArbTopItem === undefined) {
      return popNextItemOnChainQueueAndRecurse(undefined);
    }
    var arbEventIsInSameBlock = Caml_obj.equal([
          peekedArbTopItem.chainId,
          peekedArbTopItem.blockNumber
        ], [
          getChainIdFromBufferPeekItem(bufferItem),
          getBlockNumberFromBufferPeekItem(bufferItem)
        ]);
    var arbItemIsEarlier = chainFetcherPeekComparitorEarliestEvent({
          TAG: /* Item */1,
          _0: peekedArbTopItem
        }, bufferItem);
    if (arbEventIsInSameBlock && arbItemIsEarlier) {
      self.arbitraryEventPriorityQueue.pop();
      var nextBlockGroupedBatchItems = Belt_Array.concat(blockGroupedBatchItems, [peekedArbTopItem]);
      var fetcher = getChainFetcher(self, getChainIdFromBufferPeekItem(bufferItem));
      var peakedNextItem = ChainFetcher.peekFrontItemOfQueue(fetcher);
      _blockGroupedBatchItems = nextBlockGroupedBatchItems;
      _bufferItem = peakedNextItem;
      continue ;
    }
    if (arbEventIsInSameBlock) {
      return popNextItemOnChainQueueAndRecurse(undefined);
    }
    if (!arbItemIsEarlier) {
      return popNextItemOnChainQueueAndRecurse(undefined);
    }
    var addItemAndCheckNextItemForRecursion = (function(blockGroupedBatchItems){
    return function addItemAndCheckNextItemForRecursion(item) {
      self.arbitraryEventPriorityQueue.pop();
      var nextBlockGroupedBatchItems = Belt_Array.concat(blockGroupedBatchItems, [item]);
      var optPeekedArbItem = self.arbitraryEventPriorityQueue.top();
      if (optPeekedArbItem !== undefined && Caml_obj.equal([
              optPeekedArbItem.chainId,
              optPeekedArbItem.blockNumber
            ], [
              item.chainId,
              item.blockNumber
            ])) {
        return Belt_Array.concat(nextBlockGroupedBatchItems, addItemAndCheckNextItemForRecursion(optPeekedArbItem));
      } else {
        return nextBlockGroupedBatchItems;
      }
    }
    }(blockGroupedBatchItems));
    return addItemAndCheckNextItemForRecursion(peekedArbTopItem);
  };
}

function popBlockBatchItems(self) {
  var peekChainFetcherFrontItems = Belt_Array.map(Js_dict.values(self.chainFetchers), ChainFetcher.peekFrontItemOfQueue);
  var nextItemFromBuffer = Belt_Result.getExn(determineNextEvent(peekChainFetcherFrontItems));
  return getAllBlockLogs(self, nextItemFromBuffer, []);
}

async function popBlockBatchAndAwaitItems(self) {
  var peekChainFetcherFrontItems = Belt_Array.map(Js_dict.values(self.chainFetchers), ChainFetcher.peekFrontItemOfQueue);
  var nextItemFromBuffer = Belt_Result.getExn(determineNextEvent(peekChainFetcherFrontItems));
  if (nextItemFromBuffer.TAG !== /* NoItem */0) {
    return getAllBlockLogs(self, nextItemFromBuffer, []);
  }
  var peekedArbTopItem = self.arbitraryEventPriorityQueue.top();
  if (peekedArbTopItem !== undefined && peekedArbTopItem.timestamp <= nextItemFromBuffer._0) {
    return getAllBlockLogs(self, nextItemFromBuffer, []);
  }
  var fetcher = getChainFetcher(self, nextItemFromBuffer._1);
  await ChainFetcher.addNewRangeQueriedCallback(fetcher);
  return await popBlockBatchAndAwaitItems(self);
}

async function popAndAwaitBatchItem(self) {
  var peekChainFetcherFrontItems = Belt_Array.map(Js_dict.values(self.chainFetchers), ChainFetcher.peekFrontItemOfQueue);
  var nextItemFromBuffer = Belt_Result.getExn(determineNextEvent(peekChainFetcherFrontItems));
  var popNextItemAndAwait = async function (param) {
    if (nextItemFromBuffer.TAG === /* NoItem */0) {
      var fetcher = getChainFetcher(self, nextItemFromBuffer._1);
      await ChainFetcher.addNewRangeQueriedCallback(fetcher);
      return await popAndAwaitBatchItem(self);
    }
    var fetcher$1 = getChainFetcher(self, nextItemFromBuffer._0.chainId);
    return await ChainFetcher.popAndAwaitQueueItem(fetcher$1);
  };
  var peekedArbTopItem = self.arbitraryEventPriorityQueue.top();
  if (peekedArbTopItem === undefined) {
    return await popNextItemAndAwait(undefined);
  }
  var arbItemIsEarlier = chainFetcherPeekComparitorEarliestEvent({
        TAG: /* Item */1,
        _0: peekedArbTopItem
      }, nextItemFromBuffer);
  if (arbItemIsEarlier) {
    return self.arbitraryEventPriorityQueue.pop();
  } else {
    return await popNextItemAndAwait(undefined);
  }
}

async function createBatch(self, minBatchSize, maxBatchSize) {
  var refTime = Hrtime.makeTimer(undefined);
  var batch = [];
  while(batch.length < minBatchSize) {
    var item = await popAndAwaitBatchItem(self);
    batch.push(item);
  };
  var moreItemsToPop = true;
  while(moreItemsToPop && batch.length < maxBatchSize) {
    var optItem = popBatchItem(self);
    if (optItem !== undefined) {
      batch.push(optItem);
    } else {
      moreItemsToPop = false;
    }
  };
  var fetchedEventsBuffer = Js_dict.fromArray(Belt_Array.concat(Belt_Array.map(Js_dict.values(self.chainFetchers), (function (fetcher) {
                  return [
                          String(fetcher.chainConfig.chainId),
                          fetcher.fetchedEventQueue.queue.size()
                        ];
                })), [[
              "arbitrary",
              self.arbitraryEventPriorityQueue.length
            ]]));
  var timeElapsed = Hrtime.toMillis(Hrtime.timeSince(refTime));
  Logging.trace({
        message: "New batch created for processing",
        "batch size": batch.length,
        buffers: fetchedEventsBuffer,
        "time taken (ms)": timeElapsed
      });
  return batch;
}

function addItemToArbitraryEvents(self, item) {
  self.arbitraryEventPriorityQueue.push(item);
}

var ExposedForTesting_Hidden = {
  priorityQueueComparitor: priorityQueueComparitor,
  getComparitorFromItem: getComparitorFromItem
};

exports.make = make;
exports.startFetchers = startFetchers;
exports.getChainFetcher = getChainFetcher;
exports.createBatch = createBatch;
exports.addItemToArbitraryEvents = addItemToArbitraryEvents;
exports.popBlockBatchItems = popBlockBatchItems;
exports.popBlockBatchAndAwaitItems = popBlockBatchAndAwaitItems;
exports.ExposedForTesting_Hidden = ExposedForTesting_Hidden;
/* Logging Not a pure module */