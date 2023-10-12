/* TypeScript file generated from Types.res by genType. */
/* eslint-disable import/first */


import type {BigInt_t as Ethers_BigInt_t} from '../src/bindings/Ethers.gen';

import type {Nullable as $$nullable} from './bindings/OpaqueTypes';

import type {ethAddress as Ethers_ethAddress} from '../src/bindings/Ethers.gen';

import type {userLogger as Logs_userLogger} from './Logs.gen';

// tslint:disable-next-line:interface-over-type-literal
export type id = string;
export type Id = id;

// tslint:disable-next-line:interface-over-type-literal
export type nullable<a> = $$nullable<a>;

// tslint:disable-next-line:interface-over-type-literal
export type awesomeEntityLoaderConfig = boolean;

// tslint:disable-next-line:interface-over-type-literal
export type awesomeEntityEntity = {
  readonly id: string; 
  readonly awesomeAddress: string; 
  readonly awesomeTotal: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type eventLog<a> = {
  readonly params: a; 
  readonly blockNumber: number; 
  readonly blockTimestamp: number; 
  readonly blockHash: string; 
  readonly srcAddress: Ethers_ethAddress; 
  readonly transactionHash: string; 
  readonly transactionIndex: number; 
  readonly logIndex: number
};

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_eventArgs = {
  readonly identifier: string; 
  readonly awesomeAddress: Ethers_ethAddress; 
  readonly awesomeValue: Ethers_BigInt_t
};

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_awesomeEntityEntityHandlerContext = {
  readonly get: (_1:id) => (undefined | awesomeEntityEntity); 
  readonly set: (_1:awesomeEntityEntity) => void; 
  readonly delete: (_1:id) => void
};

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_context = { readonly log: Logs_userLogger; readonly awesomeEntity: MyAwesomeContractContract_AwesomeEventEvent_awesomeEntityEntityHandlerContext };

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_awesomeEntityEntityLoaderContext = { readonly load: (_1:id) => void };

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_contractRegistrations = { readonly addMyAwesomeContract: (_1:Ethers_ethAddress) => void };

// tslint:disable-next-line:interface-over-type-literal
export type MyAwesomeContractContract_AwesomeEventEvent_loaderContext = { readonly contractRegistration: MyAwesomeContractContract_AwesomeEventEvent_contractRegistrations; readonly awesomeEntity: MyAwesomeContractContract_AwesomeEventEvent_awesomeEntityEntityLoaderContext };
