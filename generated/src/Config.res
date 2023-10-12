type contract = {
  name: string,
  abi: Ethers.abi,
  addresses: array<Ethers.ethAddress>,
  events: array<Types.eventName>,
}

type syncConfig = {
  initialBlockInterval: int,
  backoffMultiplicative: float,
  accelerationAdditive: int,
  intervalCeiling: int,
  backoffMillis: int,
  queryTimeoutMillis: int,
}

type serverUrl = string

type rpcConfig = {
  provider: Ethers.JsonRpcProvider.t,
  syncConfig: syncConfig,
}

type syncSource = Rpc(rpcConfig) | Skar(serverUrl) | EthArchive(serverUrl)

type chainConfig = {
  syncSource: syncSource,
  startBlock: int,
  chainId: int,
  contracts: array<contract>,
}

type chainConfigs = Js.Dict.t<chainConfig>

// Logging:
%%private(let envSafe = EnvSafe.make())

let getLogLevelConfig = (~name, ~default): Pino.logLevel =>
  envSafe->EnvSafe.get(
    ~name,
    ~struct=S.union([
      S.literalVariant(String("trace"), #trace),
      S.literalVariant(String("debug"), #debug),
      S.literalVariant(String("info"), #info),
      S.literalVariant(String("warn"), #warn),
      S.literalVariant(String("error"), #error),
      S.literalVariant(String("fatal"), #fatal),
      S.literalVariant(String("udebug"), #udebug),
      S.literalVariant(String("uinfo"), #uinfo),
      S.literalVariant(String("uwarn"), #uwarn),
      S.literalVariant(String("uerror"), #uerror),
      S.literalVariant(String(""), default),
      S.literalVariant(EmptyOption, default),
    ]),
    (),
  )

let logFilePath =
  envSafe->EnvSafe.get(~name="LOG_FILE", ~struct=S.string(), ~devFallback="logs/envio.log", ())
let userLogLevel = getLogLevelConfig(~name="LOG_LEVEL", ~default=#info)
let defaultFileLogLevel = getLogLevelConfig(~name="FILE_LOG_LEVEL", ~default=#trace)

type logStrategyType = EcsFile | EcsConsole | FileOnly | ConsoleRaw | ConsolePretty | Both
let logStrategy = envSafe->EnvSafe.get(
  ~name="LOG_STRATEGY",
  ~struct=S.union([
    S.literalVariant(String("ecs-file"), EcsFile),
    S.literalVariant(String("ecs-console"), EcsConsole),
    S.literalVariant(String("file-only"), FileOnly),
    S.literalVariant(String("console-raw"), ConsoleRaw),
    S.literalVariant(String("console-pretty"), ConsolePretty),
    S.literalVariant(String("both-prettyconsole"), Both),
    // Two default values are pretty print to the console only.
    S.literalVariant(String(""), ConsolePretty),
    S.literalVariant(EmptyOption, ConsolePretty),
  ]),
  (),
)

let db: Postgres.poolConfig = {
  host: envSafe->EnvSafe.get(~name="PG_HOST", ~struct=S.string(), ~devFallback="localhost", ()),
  port: envSafe->EnvSafe.get(~name="PG_PORT", ~struct=S.int()->S.Int.port(), ~devFallback=5432, ()),
  user: envSafe->EnvSafe.get(~name="PG_USER", ~struct=S.string(), ~devFallback="postgres", ()),
  password: envSafe->EnvSafe.get(
    ~name="PG_PASSWORD",
    ~struct=S.string(),
    ~devFallback="testing",
    (),
  ),
  database: envSafe->EnvSafe.get(
    ~name="PG_DATABASE",
    ~struct=S.string(),
    ~devFallback="envio-dev",
    (),
  ),
  ssl: envSafe->EnvSafe.get(
    ~name="SSL_MODE",
    ~struct=S.string(),
    //this is a dev fallback option for local deployments, shouldn't run in the prod env
    //the SSL modes should be provided as string otherwise as 'require' | 'allow' | 'prefer' | 'verify-full'
    ~devFallback=false->Obj.magic,
    (),
  ),
  // TODO: think how we want to pipe these logs to pino.
  onnotice: userLogLevel == #warn || userLogLevel == #error ? None : Some(() => ()),
}

let config: chainConfigs = [
  (
    "1337",
    {
      syncSource: Rpc({
        provider: Ethers.JsonRpcProvider.makeStatic(~rpcUrl="http://localhost:8545", ~chainId=1337),
        syncConfig: {
          initialBlockInterval: EnvUtils.getIntEnvVar(
            ~envSafe,
            "UNSTABLE__SYNC_CONFIG_INITIAL_BLOCK_INTERVAL",
            ~fallback=10000,
          ),
          // After an RPC error, how much to scale back the number of blocks requested at once
          backoffMultiplicative: EnvUtils.getFloatEnvVar(
            ~envSafe,
            "UNSTABLE__SYNC_CONFIG_BACKOFF_MULTIPLICATIVE",
            ~fallback=0.8,
          ),
          // Without RPC errors or timeouts, how much to increase the number of blocks requested by for the next batch
          accelerationAdditive: EnvUtils.getIntEnvVar(
            ~envSafe,
            "UNSTABLE__SYNC_CONFIG_ACCELERATION_ADDITIVE",
            ~fallback=2000,
          ),
          // Do not further increase the block interval past this limit
          intervalCeiling: EnvUtils.getIntEnvVar(
            ~envSafe,
            "UNSTABLE__SYNC_CONFIG_INTERVAL_CEILING",
            ~fallback=10000,
          ),
          // After an error, how long to wait before retrying
          backoffMillis: 5000,
          // How long to wait before cancelling an RPC request
          queryTimeoutMillis: 20000,
        },
      }),
      startBlock: 0,
      chainId: 1337,
      contracts: [
        {
          name: "MyAwesomeContract",
          abi: Abis.myAwesomeContractAbi->Ethers.makeAbi,
          addresses: [
            "0x0000000000000000000000000000000000000000"->Ethers.getAddressFromStringUnsafe,
          ],
          events: [MyAwesomeContractContract_AwesomeEventEvent],
        },
      ],
    },
  ),
]->Js.Dict.fromArray

let metricsPort =
  envSafe->EnvSafe.get(~name="METRICS_PORT", ~struct=S.int()->S.Int.port(), ~devFallback=9898, ())

// You need to close the envSafe after you're done with it so that it immediately tells you about your misconfigured environment on startup.
envSafe->EnvSafe.close()
