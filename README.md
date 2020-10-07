
## CREATE-CONTRACT-CLI tool for NEAR Contracts

### What's this tool for?

This tool can create a cli for any rust contract by parsing the contract code

It works for any rust-coded contract

[![asciicast](https://asciinema.org/a/364018.svg)](https://asciinema.org/a/364018)

For example, let's create a cli for the staking-pool. 
I have a staking-pool deployed @luckystaker.stakehouse.betanet

Let's create a cli to manage that contract from my account

`> create-contract-cli --help`

`> create-contract-cli lucky core-contracts/staking-pool --contractName luckystaker.stakehouse.betanet --accountId luciotato.betanet`

and.... **done!**

`create-contract-cli` parsed `core-contracts/staking-pool/scr/lib.rs` and created a new cli called "lucky" with commands to control a staking-pool contract

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

* nodejs >= 12.17 (v14 preferred)
* near-cli

To install prerequisites:

check your node version

```
> node -v
v14.x.y
```

If your version is < v12.17, you must install nodejs from [nodejs.org](nodejs.org) (windows/linux), 
or use [nvm](https://github.com/nvm-sh/nvm) (linux) to install node stable

`> nvm install stable`

You can use npm to install near-cli

`> npm install -g near-cli`

### Generated cli-tool Usage:

#### JSON parameteres 

The cli parses the command line to create a JSON parameter for the contract. You must

* Put spaces around  { and }

`lucky get_accounts { from_index: 1i, limit: 10i }`

* commas are optional

`lucky get_accounts { from_index:1i limit: 10i }`

* numbers are by default in NEAR, so they'll be converted to yoctos before passing them to the contract. You can use "**i**" to indicate the number is an integer, "**y**" to indicate you're stating yoctos (default), and "**N**" to indicate the amount is in NEAR. For contract params, numbers expressed in NEAR are converted to U128 Yoctos. That's the default parameter convention

For eaxmple:
`lucky get_accounts { from_index:1i limit: 10i }`  
executes: `near call luckystaker.near "{\"from_index\":1,\"limit\":10}"`

`lucky stake { amount:10N }`  
executes: `near call luckystaker.near "{\"amount\":\"1000000000000000000000000\"}"`

## Caveats

* Should work for any contract

Rust is specially hard to parse, if the tool can't parse your /lib.rs create an [issue](https://github.com/luciotato/create-contract-cli/issues) including the /lib.rs

* Should work on Windows

## Road Map

* --target:ES2015 => Create a node v10 compatible cli

Today there's a requisite of node v13 because the generated code uses type:module & ES2020 imports. Next step will be to create a ES2015 CommonJS compatible cli to remove node version requisites

* --target ts => Create a .ts cli

The generated cli is easily expandible. I'll be nice if the tool can generate a .ts based cli to allow expansion form a solid base

* Parse AssemblyScript contracts
