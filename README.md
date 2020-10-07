## CRATE-CONTRACT-CLI tool for NEAR Contracts

### What's this tool for?

This tool can create a cli for any rust contract by parsing the contract code

It works for any contract

For example, let's create a cli for the staking-pool

I have a staking-pool deployed @luckystaker.stakehouse.betanet

let's create a cli to manage that contract from my account

`> create-contract-cli --help`

`create-contract-cli lucky core-contracts/staking-pool --contractName luckystaker.stakehouse.betanet --accountId luciotato.betanet`

and.... done!

`create-contract-cli` parsed `core-contracts/staking-pool/scr/lib.rs` and created a new cli called "lucky" for a staking-pool contract

the new cli is at ./lucky-cli and its nickname is "lucky"

To see what the new cli can do type `lucky --help | more`

### Will it work for my contract?

Yes! Just point it to your contract code!

### Shut up and take my money! How do I install it?

```
git clone https://github.com/luciotato/create-contract-cli
cd create-contract-cli
npm link
cd ..
create-contract-cli --help
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
