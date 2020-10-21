
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

The cli parses command line arguments to create JSON parameters for the contract. You must:

* Put spaces around  { and }

        lucky withdraw { amount:10 }

* Numbers are by default in NEAR, so they'll be converted to U128 yoctos before passing them to the contract. This means `lucky withdraw { amount: 10 }` will be converted to `near call lucky.near withdraw {amount:"100000000000000000000"}`

* You can also use "**N**" to expressely indicate the amount is in NEAR

        lucky withdraw { amount:10N }

* In some uncommon cases, you can use "**y**" to indicate you're stating yoctos, and the number will just be enclosed in quotes (It's uncommon to use yoctos to express parameters)

        lucky witdraw { amount:6500000000000000000000y } 
        => call lucky.near withdraw {\"amount\":\"6500000000000000000000\"}

* Because the default denomination is NEAR, you can state numbers with a decimal point and they will be converted to U128 Yoctos, that means multiplied by 1e24 and enclosed in quotes, so `amount:0.065` becomes `"amount":"6500000000000000000000"`. This is the default parameter convention

        lucky witdraw { amount: 0.065 } 
        => call lucky.near withdraw {\"amount\":\"6500000000000000000000\"}

* And finally, you can use "**i**" to indicate the number is an integer and should be sent as it is, not converted or enclosed in quotes

        lucky get_accounts { from_index: 1i, limit: 10i } 
        => view lucky.near get_accounts {\"from_index\":1,\"limit\":10}

* Note: Commas are optional

        lucky get_accounts { from_index:1i limit:10i }
        => view lucky.near get_accounts {\"from_index\":1,\"limit\":10}



### More Conversion Examples:

--- 

`lucky stake { amount:10 }` or `lucky stake { amount:10N }`

both execute:
```
near call lucky.near stake "{\"amount\":\"1000000000000000000000000\"}"`
```
---

`lucky stake { amount:0.0005 }`<br>
or `lucky stake { amount:0.0005N }`<br>
or `lucky stake { amount:500000000000000000000y }`<br>

all of them execute:
```
near call luckystaker.near stake "{\"amount\":\"500000000000000000000\"}"`
```

---

`lucky get_accounts { from_index:1i limit: 10i }`

executes:
```
near view luckystaker.near get_accounts "{\"from_index\":1,\"limit\":10}"
```


## Caveats

* Should work for any contract

... but Rust is specially hard to parse, if the tool can't parse your `lib.rs`, please report the issue [here](https://github.com/luciotato/create-contract-cli/issues) including some failing `lib.rs` sample code

* Should work on Windows

## Road Map

* Parse AssemblyScript contracts
