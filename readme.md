<p align="center">
  <a><img src="https://blog.ethereum.org/img/2018/08/grants_eth_logo.png" title="Ethereum triangle" height="300"/></a>
</p>
<p align="center">
  <b>
    Essential Eth
  </b>
  <br>
  <i>Ultralight Ethereum utilities for JS and TS</i>
  <br>
</p>

---

<p align="center">
<img src="https://user-images.githubusercontent.com/3408480/133322814-f3d18424-4ba8-4a37-8cbc-c5e6828354a3.png" title="Ethereum triangle" width="900"/>
</p>

---

<br>

![](https://badgen.net/bundlephobia/minzip/essential-eth) ![](https://badgen.net/bundlephobia/tree-shaking/essential-eth)

![](https://img.shields.io/npm/v/essential-eth)
![](https://badgen.net/bundlephobia/min/essential-eth)
![](https://badgen.net/bundlephobia/dependency-count/essential-eth)

👨🏻‍💻 Breaking changes will exist between minor versions until `1.0.0` (Versions go `major.minor.patch`)

## Features

- ⚡️ A replacement for the utils in web3.js and ethers.js
- 🏎 [The TINIEST code size possible](https://bundlephobia.com/package/essential-eth)
- ʦ Fully typed with TypeScript (also works with JavaScript)
- 🌲 Tree-shaking and no side-effects
- 🧪 Tested heavily to match both web3 and ethers.js
- 🤓 Exports for either CommonJS and ESM usage
- 🙌 Supports multiple Node versions
  - ✅ Node 14
  - ✅ Node 12
  - ✅ Node 10
- 👩‍⚖️ MIT License

## Install

```sh
npm install --save essential-eth # TypeScript types load automatically

# or if you prefer yarn
yarn add essential-eth # TypeScript types load automatically
```

<br/>

## Utils (do not require connecting to an Eth node)

```typescript
import { etherToWei } from 'essential-eth';

// or in a non-import environment
const { etherToWei } = require('essential-eth');
```

#### `etherToWei`

```typescript
// convert ether to wei
etherToWei(etherQuantity: string | number | TinyBig | Big): TinyBig
```

#### `weiToEther`

```typescript
// convert wei to ether
weiToEther(weiQuantity: string | number | TinyBig | Big): TinyBig
```

#### `toChecksumAddress`

```typescript
// return proper mixed-case address
// does not support ICAP addresses
toChecksumAddress(address: string): string
```

#### `isAddress`

```typescript
// returns boolean as to whether input is a valid address
// does not support ENS nor ICAP
isAddress(address: string): boolean
```

<br/>

## RPC

```typescript
import { JsonRpcProvider } from 'essential-eth';
const essentialEth = new JsonRpcProvider(
  'RPC URL HERE' /* Try POKT or Infura */,
);
// OR for very quick testing (limited to 500 requests)
const essentialEth = new JsonRpcProvider();
```

#### `getBlock`

Returns a [Block](src/types/block.types.ts)

```typescript
// Same API as web3.eth.getBlock
getBlock(timeFrame: number | "latest" | "earliest" | "pending", returnTransactionObjects?: boolean): Promise<Block>
```

<br/>

## Contract

⚠️ Only read functions are currently supported. ⚠️

- This is highly experimental, do not use this in production yet.

```typescript
import { Contract, jsonRpcProvider, JSONABI } from 'essential-eth';
// UNI airdrop contract
const contractAddress = '0x090D4613473dEE047c3f2706764f49E0821D256e';
const provider = jsonRpcProvider(/* RPC URL optional */);

const abi: JSONABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'isClaimed',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const contract = new Contract(contractAddress, abi, provider);

(async () => {
  // prints boolean as to whether index 0 has claimed airdrop or not
  console.log(await contract.isClaimed(0));
})();
```

#### `contractFunctionName(args)`

Any function on a contract. Returns are the same as `ethers.js`, except that instead of BigNumber, `essential-eth` always returns a [`TinyBig`](https://essential-eth.vercel.app/classes/TinyBig.html)

<br/>
<br/>

- [📓 View full docs](https://essential-eth.vercel.app)
- [📓 View changelog (by looking at releases diff)](https://github.com/dawsbot/essential-eth/releases)
- [📓 View docs for an older version](https://essential-eth.vercel.app/versions)
