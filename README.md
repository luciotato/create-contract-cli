
## CREATE-CONTRACT-CLI tool for NEAR Contracts

### What's this tool for?

This tool can create a cli for any NEAR smart contract by parsing the contract code

It works for any rust-coded contract

[![asciicast](https://asciinema.org/a/364018.svg)](https://asciinema.org/a/364018)

For example, let's create a cli for the staking-pool. 
I have a staking-pool deployed @luckystaker.stakehouse.betanet

Let's create a cli to manage that contract from my account

`> create-contract-cli --help`

`> create-contract-cli lucky core-contracts/staking-pool --contractName luckystaker.stakehouse.betanet --accountId luciotato.betanet`

```
Creating dir lucky-cli......................................: OK
Parsing core-contracts/staking-pool/src/lib.rs..............: OK
Producing lucky-cli/ContractAPI.js..........................: OK
Completing from create-contract-cli/model...................: OK
```

and.... **done!**

We just parsed `core-contracts/staking-pool/scr/lib.rs` and created a new cli called "lucky" with commands to control a staking-pool contract

The new cli is at ./lucky-cli and its nickname is "lucky"

To see what the new cli can do type `lucky --help | more`

### Will it work for my contract?

Yes! Just point it to your contract code!

`> create-contract-cli myprecious myrepo/mycontract --contractName mycontract.accountId.near --accountId my.accountId.near`

### Shut up and take my money! How do I install it?

```
> git clone https://github.com/luciotato/create-contract-cli
> cd create-contract-cli
> npm link
> cd ..
> create-contract-cli --help
```

### Prerequisites:

* near-cli
* nodejs v10+

To install prerequisites:

You can use npm to install near-cli

`> npm install -g near-cli`

and you can check your node version

```
> node -v
v12.x.y
```

If your version is <v10, you must install nodejs from [nodejs.org](nodejs.org) (windows/linux), 
or use [nvm](https://github.com/nvm-sh/nvm) (linux) to install node stable

`> nvm install stable`


### Generated cli-tool Usage:

#### JSON parameteres 

The cli parses the command line to create a JSON parameter for the contract. You must

* Put spaces around  { and }

`lucky get_accounts { from_index: 1i, limit: 10i }`

* commas are optional

`lucky get_accounts { from_index:1i limit: 10i }`

* numbers are by default in NEAR, so they'll be converted to yoctos before passing them to the contract. You can use "**i**" to indicate the number is an integer, "**y**" to indicate you're stating yoctos, and "**N**" (default) to indicate the amount is in NEAR. For contract params, numbers expressed in NEAR are converted to U128 Yoctos. That's the default parameter convention

For eaxmple:
`lucky get_accounts { from_index:1i limit: 10i }`  
executes: `near call luckystaker.near "{\"from_index\":1,\"limit\":10}"`

`lucky stake { amount:10 }`  | `lucky stake { amount:10N }` 
executes: `near call luckystaker.near "{\"amount\":\"1000000000000000000000000\"}"`

`lucky stake { amount:500000000000000y }`  
executes: `near call luckystaker.near "{\"amount\":\"500000000000000\"}"`

## Caveats

* Should work for any contract

Rust is specially hard to parse, if the tool can't parse your /lib.rs create an [issue](https://github.com/luciotato/create-contract-cli/issues) including the /lib.rs

* Should work on Windows

## Road Map

* --target ts => Create a .ts cli

 It will be nice if the tool can generate a .ts based cli to allow building from a type-checked base

* Parse AssemblyScript contracts
