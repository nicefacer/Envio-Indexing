// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("rescript/lib/js/curry.js");
var Ethers = require("./bindings/Ethers.bs.js");
var Belt_Int = require("rescript/lib/js/belt_Int.js");
var Caml_obj = require("rescript/lib/js/caml_obj.js");

function getEventComparator(multiChainEventIndex) {
  return [
          multiChainEventIndex.timestamp,
          multiChainEventIndex.chainId,
          multiChainEventIndex.blockNumber,
          multiChainEventIndex.logIndex
        ];
}

function isEarlierEvent(event1, event2) {
  return Caml_obj.lessthan(getEventComparator(event1), getEventComparator(event2));
}

function packEventIndex(blockNumber, logIndex) {
  var blockNumber$1 = BigInt(blockNumber);
  var logIndex$1 = BigInt(logIndex);
  var blockNumber$2 = Curry._2(Ethers.$$BigInt.Bitwise.shift_left, blockNumber$1, BigInt(16));
  return Curry._2(Ethers.$$BigInt.Bitwise.logor, blockNumber$2, logIndex$1);
}

function packMultiChainEventIndex(timestamp, chainId, blockNumber, logIndex) {
  var timestamp$1 = BigInt(timestamp);
  var chainId$1 = BigInt(chainId);
  var blockNumber$1 = BigInt(blockNumber);
  var logIndex$1 = BigInt(logIndex);
  var timestamp$2 = Curry._2(Ethers.$$BigInt.Bitwise.shift_left, timestamp$1, BigInt(48));
  var chainId$2 = Curry._2(Ethers.$$BigInt.Bitwise.shift_left, chainId$1, BigInt(16));
  var blockNumber$2 = Curry._2(Ethers.$$BigInt.Bitwise.shift_left, blockNumber$1, BigInt(16));
  return Curry._2(Ethers.$$BigInt.Bitwise.logor, Curry._2(Ethers.$$BigInt.Bitwise.logor, Curry._2(Ethers.$$BigInt.Bitwise.logor, timestamp$2, chainId$2), blockNumber$2), logIndex$1);
}

function unpackEventIndex(packedEventIndex) {
  var blockNumber = Curry._2(Ethers.$$BigInt.Bitwise.shift_right, packedEventIndex, BigInt(16));
  var logIndexMask = BigInt(65535);
  var logIndex = Curry._2(Ethers.$$BigInt.Bitwise.logand, packedEventIndex, logIndexMask);
  return {
          blockNumber: Belt_Int.fromString(blockNumber.toString()),
          logIndex: Belt_Int.fromString(logIndex.toString())
        };
}

function packEventIndexFromRecord(eventIndex) {
  return packEventIndex(eventIndex.blockNumber, eventIndex.logIndex);
}

function getEventIdKeyString(chainId, eventId) {
  var chainIdStr = String(chainId);
  return chainIdStr + "_" + eventId;
}

function getContractAddressKeyString(chainId, contractAddress) {
  var chainIdStr = String(chainId);
  return chainIdStr + "_" + Ethers.ethAddressToString(contractAddress);
}

async function waitForNextBlock(provider) {
  return await new Promise((function (resolve, _reject) {
                Ethers.JsonRpcProvider.onBlock(provider, (function (blockNumber) {
                        Ethers.JsonRpcProvider.removeOnBlockEventListener(provider);
                        resolve(blockNumber);
                      }));
              }));
}

exports.getEventComparator = getEventComparator;
exports.isEarlierEvent = isEarlierEvent;
exports.packEventIndex = packEventIndex;
exports.packMultiChainEventIndex = packMultiChainEventIndex;
exports.unpackEventIndex = unpackEventIndex;
exports.packEventIndexFromRecord = packEventIndexFromRecord;
exports.getEventIdKeyString = getEventIdKeyString;
exports.getContractAddressKeyString = getContractAddressKeyString;
exports.waitForNextBlock = waitForNextBlock;
/* Ethers Not a pure module */