type functionRegister = Loader | Handler

let mapFunctionRegisterName = (functionRegister: functionRegister) => {
  switch functionRegister {
  | Loader => "Loader"
  | Handler => "Handler"
  }
}

// This set makes sure that the warning doesn't print for every event of a type, but rather only prints the first time.
let hasPrintedWarning = Set.make()

let getDefaultLoaderHandler: (
  ~functionRegister: functionRegister,
  ~eventName: string,
  ~event: 'a,
  ~context: 'b,
) => unit = (~functionRegister, ~eventName, ~event as _, ~context as _) => {
  let functionName = mapFunctionRegisterName(functionRegister)

  // Here we use this key to prevent flooding the users terminal with
  let repeatKey = `${eventName}-${functionName}`
  if !(hasPrintedWarning->Set.has(repeatKey)) {
    Logging.warn(
      // TODO: link to our docs.
      `Ignored ${eventName} event, as there is no ${functionName} registered. You need to implement a ${eventName}${functionName} method in your handler file. This will apply to all future ${eventName} events.`,
    )
    let _ = hasPrintedWarning->Set.add(repeatKey)
  }
}

module MyAwesomeContractContract = {
  module AwesomeEvent = {
    %%private(
      let awesomeEventLoader = ref(None)
      let awesomeEventHandler = ref(None)
    )

    @genType
    let loader = (
      userLoader: (
        ~event: Types.eventLog<Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs>,
        ~context: Types.MyAwesomeContractContract.AwesomeEventEvent.loaderContext,
      ) => unit,
    ) => {
      awesomeEventLoader := Some(userLoader)
    }

    @genType
    let handler = (
      userHandler: (
        ~event: Types.eventLog<Types.MyAwesomeContractContract.AwesomeEventEvent.eventArgs>,
        ~context: Types.MyAwesomeContractContract.AwesomeEventEvent.context,
      ) => unit,
    ) => {
      awesomeEventHandler := Some(userHandler)
    }

    let getLoader = () =>
      awesomeEventLoader.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="AwesomeEvent", ~functionRegister=Loader),
      )

    let getHandler = () =>
      awesomeEventHandler.contents->Belt.Option.getWithDefault(
        getDefaultLoaderHandler(~eventName="AwesomeEvent", ~functionRegister=Handler),
      )
  }
}
