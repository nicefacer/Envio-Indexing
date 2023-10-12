exception UndefinedEvent(string)

let eventStringToEvent = (eventName: string, contractName: string): Types.eventName => {
  switch (eventName, contractName) {
  | ("AwesomeEvent", "MyAwesomeContract") => MyAwesomeContractContract_AwesomeEventEvent
  | _ => UndefinedEvent(eventName)->raise
  }
}

module MyAwesomeContract = {
  let convertAwesomeEventLogDescription = (log: Ethers.logDescription<'a>): Ethers.logDescription<
    Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs,
  > => {
    //Convert from the ethersLog type with indexs as keys to named key value object
    let ethersLog: Ethers.logDescription<
      Types.MyAwesomeContractContract.AwesomeEventEvent.ethersEventArgs,
    > =
      log->Obj.magic
    let {args, name, signature, topic} = ethersLog

    {
      name,
      signature,
      topic,
      args: {
        identifier: args.identifier,
        awesomeAddress: args.awesomeAddress,
        awesomeValue: args.awesomeValue,
      },
    }
  }

  let convertAwesomeEventLog = (
    logDescription: Ethers.logDescription<
      Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs,
    >,
    ~log: Ethers.log,
    ~blockTimestamp: int,
  ) => {
    let params: Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs = {
      identifier: logDescription.args.identifier,
      awesomeAddress: logDescription.args.awesomeAddress,
      awesomeValue: logDescription.args.awesomeValue,
    }

    let awesomeEventLog: Types.eventLog<
      Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs,
    > = {
      params,
      blockNumber: log.blockNumber,
      blockTimestamp,
      blockHash: log.blockHash,
      srcAddress: log.address,
      transactionHash: log.transactionHash,
      transactionIndex: log.transactionIndex,
      logIndex: log.logIndex,
    }

    Types.MyAwesomeContractContract_AwesomeEvent(awesomeEventLog)
  }
}

type parseEventError =
  ParseError(Ethers.Interface.parseLogError) | UnregisteredContract(Ethers.ethAddress)

exception ParseEventErrorExn(parseEventError)

let parseEvent = (~log, ~blockTimestamp, ~contractInterfaceManager): Belt.Result.t<
  Types.event,
  _,
> => {
  let logDescriptionResult = contractInterfaceManager->ContractInterfaceManager.parseLog(~log)
  switch logDescriptionResult {
  | Error(e) =>
    switch e {
    | EthersParseError(parseError) => ParseError(parseError)
    | UndefinedInterface(contractAddress) => UnregisteredContract(contractAddress)
    }->Error

  | Ok(logDescription) =>
    switch contractInterfaceManager->ContractInterfaceManager.getContractNameFromAddress(
      ~contractAddress=log.address,
    ) {
    | None => Error(UnregisteredContract(log.address))
    | Some(contractName) =>
      let event = switch eventStringToEvent(logDescription.name, contractName) {
      | MyAwesomeContractContract_AwesomeEventEvent =>
        logDescription
        ->MyAwesomeContract.convertAwesomeEventLogDescription
        ->MyAwesomeContract.convertAwesomeEventLog(~log, ~blockTimestamp)
      }

      Ok(event)
    }
  }
}

let decodeRawEventWith = (
  rawEvent: Types.rawEventsEntity,
  ~decoder: Spice.decoder<'a>,
  ~variantAccessor: Types.eventLog<'a> => Types.event,
): Spice.result<Types.eventBatchQueueItem> => {
  switch rawEvent.params->Js.Json.parseExn {
  | exception exn =>
    let message =
      exn
      ->Js.Exn.asJsExn
      ->Belt.Option.flatMap(jsexn => jsexn->Js.Exn.message)
      ->Belt.Option.getWithDefault("No message on exn")

    Spice.error(`Failed at JSON.parse. Error: ${message}`, rawEvent.params->Obj.magic)
  | v => Ok(v)
  }
  ->Belt.Result.flatMap(json => {
    json->decoder
  })
  ->Belt.Result.map(params => {
    let event = {
      blockNumber: rawEvent.blockNumber,
      blockTimestamp: rawEvent.blockTimestamp,
      blockHash: rawEvent.blockHash,
      srcAddress: rawEvent.srcAddress,
      transactionHash: rawEvent.transactionHash,
      transactionIndex: rawEvent.transactionIndex,
      logIndex: rawEvent.logIndex,
      params,
    }->variantAccessor

    let queueItem: Types.eventBatchQueueItem = {
      timestamp: rawEvent.blockTimestamp,
      chainId: rawEvent.chainId,
      blockNumber: rawEvent.blockNumber,
      logIndex: rawEvent.logIndex,
      event,
    }

    queueItem
  })
}

let parseRawEvent = (rawEvent: Types.rawEventsEntity): Spice.result<Types.eventBatchQueueItem> => {
  rawEvent.eventType
  ->Types.eventName_decode
  ->Belt.Result.flatMap(eventName => {
    switch eventName {
    | MyAwesomeContractContract_AwesomeEventEvent =>
      rawEvent->decodeRawEventWith(
        ~decoder=Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs_decode,
        ~variantAccessor=Types.myAwesomeContractContract_AwesomeEvent,
      )
    }
  })
}
