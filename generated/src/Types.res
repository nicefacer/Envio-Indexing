//*************
//***ENTITIES**
//*************

@spice @genType.as("Id")
type id = string

@spice @genType.import(("./bindings/OpaqueTypes", "Nullable"))
type nullable<'a> = option<'a>

//nested subrecord types

@@warning("-30")
@genType
type rec awesomeEntityLoaderConfig = bool

@@warning("+30")

type entityRead = AwesomeEntityRead(id)

type rawEventsEntity = {
  @as("chain_id") chainId: int,
  @as("event_id") eventId: string,
  @as("block_number") blockNumber: int,
  @as("log_index") logIndex: int,
  @as("transaction_index") transactionIndex: int,
  @as("transaction_hash") transactionHash: string,
  @as("src_address") srcAddress: Ethers.ethAddress,
  @as("block_hash") blockHash: string,
  @as("block_timestamp") blockTimestamp: int,
  @as("event_type") eventType: Js.Json.t,
  params: string,
}

type dynamicContractRegistryEntity = {
  @as("chain_id") chainId: int,
  @as("event_id") eventId: Ethers.BigInt.t,
  @as("contract_address") contractAddress: Ethers.ethAddress,
  @as("contract_type") contractType: string,
}

@spice @genType
type awesomeEntityEntity = {
  id: string,
  awesomeAddress: string,
  awesomeTotal: Ethers.BigInt.t,
}

type entity = AwesomeEntityEntity(awesomeEntityEntity)

type dbOp = Read | Set | Delete

type eventData = {
  @as("event_chain_id") chainId: int,
  @as("event_id") eventId: string,
}

type inMemoryStoreRow<'a> = {
  dbOp: dbOp,
  entity: 'a,
  eventData: eventData,
}

//*************
//**CONTRACTS**
//*************

@genType
type eventLog<'a> = {
  params: 'a,
  blockNumber: int,
  blockTimestamp: int,
  blockHash: string,
  srcAddress: Ethers.ethAddress,
  transactionHash: string,
  transactionIndex: int,
  logIndex: int,
}

module MyAwesomeContractContract = {
  module AwesomeEventEvent = {
    //Note: each parameter is using a binding of its index to help with binding in ethers
    //This handles both unamed params and also named params that clash with reserved keywords
    //eg. if an event param is called "values" it will clash since eventArgs will have a '.values()' iterator
    type ethersEventArgs = {
      @as("0") identifier: string,
      @as("1") awesomeAddress: Ethers.ethAddress,
      @as("2") awesomeValue: Ethers.BigInt.t,
    }

    @spice @genType
    type eventArgs = {
      identifier: string,
      awesomeAddress: Ethers.ethAddress,
      awesomeValue: Ethers.BigInt.t,
    }

    type awesomeEntityEntityHandlerContext = {
      get: id => option<awesomeEntityEntity>,
      set: awesomeEntityEntity => unit,
      delete: id => unit,
    }
    @genType
    type context = {
      log: Logs.userLogger,
      awesomeEntity: awesomeEntityEntityHandlerContext,
    }

    @genType
    type awesomeEntityEntityLoaderContext = {load: id => unit}

    @genType
    type contractRegistrations = {
      //TODO only add contracts we've registered for the event in the config
      addMyAwesomeContract: Ethers.ethAddress => unit,
    }
    @genType
    type loaderContext = {
      contractRegistration: contractRegistrations,
      awesomeEntity: awesomeEntityEntityLoaderContext,
    }
  }
}

@deriving(accessors)
type event =
  | MyAwesomeContractContract_AwesomeEvent(
      eventLog<MyAwesomeContractContract.AwesomeEventEvent.eventArgs>,
    )

type eventAndContext =
  | MyAwesomeContractContract_AwesomeEventWithContext(
      eventLog<MyAwesomeContractContract.AwesomeEventEvent.eventArgs>,
      unit => MyAwesomeContractContract.AwesomeEventEvent.context,
    )

type eventRouterEventAndContext = {
  chainId: int,
  event: eventAndContext,
}

@spice
type eventName =
  | @spice.as("MyAwesomeContractContract_AwesomeEventEvent")
  MyAwesomeContractContract_AwesomeEventEvent

let eventNameToString = (eventName: eventName) =>
  switch eventName {
  | MyAwesomeContractContract_AwesomeEventEvent => "AwesomeEvent"
  }

type chainId = int

type eventBatchQueueItem = {
  timestamp: int,
  chainId: int,
  blockNumber: int,
  logIndex: int,
  event: event,
}
