
    // ----------------------------------------------
    // generated by create-contract-cli from ./res/test/rust/div-pool/src/lib.rs
    // ---------------------------------------------

    const color = require("./util/color.js");
    const nearCli = require("./util/SpawnNearCli.js");
    const options = require("./CLIOptions.js");
    const cliConfig = require("./CLIConfig.js");

    // name of this script
    const nickname = cliConfig.nickname;

    // one function for each pub fn in the contract
    // get parameters by consuming from CommandLineParser
    class ContractAPI {

        // this.view helper function
        _view(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
            return nearCli.view(cliConfig.contractAccount, command, fnJSONParams, options)
        }
        // this.call helper function
        _call(command/*:string*/, fnJSONParams/*?:any*/) /*:string*/ {
            return nearCli.call(cliConfig.contractAccount, command, fnJSONParams, options)
        }
    
    
  new_HELP(){ return `
  * NOTE
    This contract implements several traits

    1. deposit-trait [NEP-xxx]: this contract implements: deposit, get_account_total_balance, get_account_available_balance, withdraw, withdraw_all
       A [NEP-xxx] contract creates an account on deposit and allows you to withdraw later under certain conditions. Deletes the account on withdraw_all

    2. staking-pool [NEP-xxx]: this contract must be perceived as a staking-pool for the lockup-contract, wallets, and users.
        This means implmenting: ping, deposit, deposit_and_stake, withdraw_all, withdraw, stake_all, stake, unstake_all, unstake
        and view methods: get_account_unstaked_balance, get_account_staked_balance, get_account_total_balance, is_account_unstaked_balance_available,
            get_total_staked_balance, get_owner_id, get_reward_fee_fraction, is_staking_paused, get_staking_key, get_account,
            get_number_of_accounts, get_accounts.

    3. diversified-staking: these are the extensions to the standard staking pool (buy/sell skash)

    4. multitoken (TODO) [NEP-xxx]: this contract implements: deposit(tok), get_token_balance(tok), withdraw_token(tok), tranfer_token(tok), transfer_token_to_contract(tok)
       A [NEP-xxx] manages multiple tokens

    *
   Requires 25 TGas (1 * BASE_GAS)
   Initializes DiversifiedPool contract.
   - 'owner_account_id' - the account ID of the owner.  Only this account can call owner's methods on this contract.
  #[init]
  
  usage:
  > div new { owner_account_id: AccountId, treasury_account_id: AccountId, operator_account_id: AccountId }
  `};
  
  new(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ owner_account_id: AccountId, treasury_account_id: AccountId, operator_account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("new",fnJSONParams)
    
  }
  
  ping_HELP(){ return `
  pub fn set_min_balance(&mut self)
  ------------------------------------
   deposit trait & staking-pool trait
  ------------------------------------
   staking-pool's ping redirects to diversified-pool's distribute, Does a bit of work
  
  usage:
  > div ping 
  `};
  
  ping(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--ping has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("ping")
    
  }
  
  deposit_HELP(){ return `
   Deposits the attached amount into the inner account of the predecessor.
  #[payable]
  
  usage:
  > div deposit 
  `};
  
  deposit(a /*:CommandLineArgs*/) /*:void*/{
    
    //function is #payable, --amount option is required
    a.requireOptionWithAmount(options.amount,'N'); //contract fn is payable, --amount expressed in N=NEARS is required
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--deposit has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("deposit")
    
  }
  
  withdraw_HELP(){ return `
   Withdraws from the available balance
  
  usage:
  > div withdraw { amount: U128String }
  `};
  
  withdraw(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("withdraw",fnJSONParams)
    
  }
  
  withdraw_all_HELP(){ return `
   Withdraws ALL from the "available" balance
  
  usage:
  > div withdraw_all 
  `};
  
  withdraw_all(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--withdraw_all has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("withdraw_all")
    
  }
  
  deposit_and_stake_HELP(){ return `
   Deposits the attached amount into the inner account of the predecessor and stakes it.
  #[payable]
  
  usage:
  > div deposit_and_stake 
  `};
  
  deposit_and_stake(a /*:CommandLineArgs*/) /*:void*/{
    
    //function is #payable, --amount option is required
    a.requireOptionWithAmount(options.amount,'N'); //contract fn is payable, --amount expressed in N=NEARS is required
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--deposit_and_stake has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("deposit_and_stake")
    
  }
  
  stake_all_HELP(){ return `
   Stakes all available unstaked balance from the inner account of the predecessor.
   staking-pool "unstaked" is equivalent to diversified-pool "available", but here
   we keep the staking-pool logic because we're implementing the staking-pool trait
  
  usage:
  > div stake_all 
  `};
  
  stake_all(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--stake_all has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("stake_all")
    
  }
  
  stake_HELP(){ return `
   Stakes the given amount from the inner account of the predecessor.
   The inner account should have enough unstaked balance.
  
  usage:
  > div stake { amount: U128String }
  `};
  
  stake(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("stake",fnJSONParams)
    
  }
  
  unstake_all_HELP(){ return `
   Unstakes all staked balance from the inner account of the predecessor.
   The new total unstaked balance will be available for withdrawal in four epochs.
  
  usage:
  > div unstake_all 
  `};
  
  unstake_all(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--unstake_all has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("unstake_all")
    
  }
  
  unstake_HELP(){ return `
   Unstakes the given amount from the inner account of the predecessor.
   The inner account should have enough staked balance.
   The new total unstaked balance will be available for withdrawal in four epochs.
  
  usage:
  > div unstake { amount: U128String }
  `};
  
  unstake(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("unstake",fnJSONParams)
    
  }
  
  get_account_unstaked_balance_HELP(){ return `
  *****************************
  * staking-pool View methods *
  *****************************
   Returns the unstaked balance of the given account.
  
  usage:
  > div get_account_unstaked_balance { account_id: AccountId }
  `};
  
  get_account_unstaked_balance(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account_unstaked_balance",fnJSONParams)
    
  }
  
  get_account_staked_balance_HELP(){ return `
   Returns the staked balance of the given account.
   NOTE: This is computed from the amount of "stake" shares the given account has and the
   current amount of total staked balance and total stake shares on the account.
  
  usage:
  > div get_account_staked_balance { account_id: AccountId }
  `};
  
  get_account_staked_balance(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account_staked_balance",fnJSONParams)
    
  }
  
  get_account_total_balance_HELP(){ return `
   Returns the total balance of the given account (including staked and unstaked balances).
  
  usage:
  > div get_account_total_balance { account_id: AccountId }
  `};
  
  get_account_total_balance(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account_total_balance",fnJSONParams)
    
  }
  
  get_account_available_balance_HELP(){ return `
   additional to staking-pool to satisfy generic deposit-NEP-standard
   returns the amount that can be withdrawn immediately
  
  usage:
  > div get_account_available_balance { account_id: AccountId }
  `};
  
  get_account_available_balance(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account_available_balance",fnJSONParams)
    
  }
  
  is_account_unstaked_balance_available_HELP(){ return `
   Returns 'true' if the given account can withdraw tokens in the current epoch.
  
  usage:
  > div is_account_unstaked_balance_available { account_id: AccountId }
  `};
  
  is_account_unstaked_balance_available(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("is_account_unstaked_balance_available",fnJSONParams)
    
  }
  
  get_owner_id_HELP(){ return `
   Returns account ID of the staking pool owner.
  
  usage:
  > div get_owner_id 
  `};
  
  get_owner_id(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_owner_id has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_owner_id")
    
  }
  
  get_reward_fee_fraction_HELP(){ return `
   Returns the current reward fee as a fraction.
  
  usage:
  > div get_reward_fee_fraction 
  `};
  
  get_reward_fee_fraction(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_reward_fee_fraction has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_reward_fee_fraction")
    
  }
  
  get_staking_key_HELP(){ return `
   Returns the staking public key
  
  usage:
  > div get_staking_key 
  `};
  
  get_staking_key(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_staking_key has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_staking_key")
    
  }
  
  is_staking_paused_HELP(){ return `
   Returns true if the staking is paused
  
  usage:
  > div is_staking_paused 
  `};
  
  is_staking_paused(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--is_staking_paused has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("is_staking_paused")
    
  }
  
  get_account_HELP(){ return `
   to implement the Staking-pool inteface, get_account returns the same as the staking-pool returns
   full account info can be obtained by calling: pub fn get_account_info(&self, account_id: AccountId) -> GetAccountInfoResult
   Returns human readable representation of the account for the given account ID.
  warning: self.get_account is public and gets HumanReadableAccount .- do not confuse with self.internal_get_account
  
  usage:
  > div get_account { account_id: AccountId }
  `};
  
  get_account(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account",fnJSONParams)
    
  }
  
  get_number_of_accounts_HELP(){ return `
   Returns the number of accounts that have positive balance on this staking pool.
  
  usage:
  > div get_number_of_accounts 
  `};
  
  get_number_of_accounts(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_number_of_accounts has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_number_of_accounts")
    
  }
  
  get_accounts_HELP(){ return `
   Returns the list of accounts
  warning: self.get_accounts is public and gets HumanReadableAccount .- do not confuse with self.internal_get_account
  
  usage:
  > div get_accounts { from_index: u64, limit: u64 }
  `};
  
  get_accounts(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ from_index: u64, limit: u64 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_accounts",fnJSONParams)
    
  }
  
  complete_unstaking_HELP(){ return `
  ----------------------------------
  ----------------------------------
   DIVERISIFYING-STAKING-POOL trait
  ----------------------------------
  ----------------------------------
   user method
   completes unstake action by moving from retreieved_from_the_pools to available
  
  usage:
  > div complete_unstaking 
  `};
  
  complete_unstaking(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--complete_unstaking has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("complete_unstaking")
    
  }
  
  buy_skash_stake_HELP(){ return `
   buy_skash_stake. Identical to stake, migth change in the future
  
  usage:
  > div buy_skash_stake { amount: U128String }
  `};
  
  buy_skash_stake(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("buy_skash_stake",fnJSONParams)
    
  }
  
  get_near_amount_sell_skash_HELP(){ return `
  ---------------------------
   NSLP Methods
  ---------------------------
   user method - NEAR/SKASH SWAP functions
   return how much NEAR you can get by selling x SKASH
  
  usage:
  > div get_near_amount_sell_skash { skash_to_sell: U128String }
  `};
  
  get_near_amount_sell_skash(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ skash_to_sell: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_near_amount_sell_skash",fnJSONParams)
    
  }
  
  nslp_get_discount_basis_points_HELP(){ return `
   NEAR/SKASH Liquidity Pool
   computes the discount_basis_points for NEAR/SKASH Swap based on NSLP Balance
   If you want to sell x SKASH
  
  usage:
  > div nslp_get_discount_basis_points { skash_to_sell: U128String }
  `};
  
  nslp_get_discount_basis_points(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ skash_to_sell: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("nslp_get_discount_basis_points",fnJSONParams)
    
  }
  
  sell_skash_HELP(){ return `
   user method
   Sells-skash at discount in the NLSP
   returns near received
  
  usage:
  > div sell_skash { skash_to_sell: U128String, min_expected_near: U128String }
  `};
  
  sell_skash(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ skash_to_sell: U128String, min_expected_near: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("sell_skash",fnJSONParams)
    
  }
  
  nslp_add_liquidity_HELP(){ return `
   add liquidity from deposited funds
  
  usage:
  > div nslp_add_liquidity { amount: U128String }
  `};
  
  nslp_add_liquidity(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("nslp_add_liquidity",fnJSONParams)
    
  }
  
  nslp_remove_liquidity_HELP(){ return `
   remove liquidity from deposited funds
  
  usage:
  > div nslp_remove_liquidity { amount: U128String }
  `};
  
  nslp_remove_liquidity(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ amount: U128String }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("nslp_remove_liquidity",fnJSONParams)
    
  }
  
  harvest_g_skash_from_staking_HELP(){ return `
  ------------------
   HARVEST G-SKASH
  ------------------
  g-skash for stakers are realized during stake(), unstake() or by calling harvest_g_skash_from_staking()
  realize pending g-skash rewards from staking
  
  usage:
  > div harvest_g_skash_from_staking 
  `};
  
  harvest_g_skash_from_staking(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--harvest_g_skash_from_staking has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("harvest_g_skash_from_staking")
    
  }
  
  harvest_g_skash_from_lp_HELP(){ return `
  g-skash for LP providers are realized during add_liquidit(), remove_liquidity() or by calling harvest_g_skash_from_lp()
  realize pending g-skash rewards from LP
  
  usage:
  > div harvest_g_skash_from_lp 
  `};
  
  harvest_g_skash_from_lp(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--harvest_g_skash_from_lp has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("harvest_g_skash_from_lp")
    
  }
  
  get_staking_pool_list_HELP(){ return `
  ---------------------------------
   staking-pools-list (SPL) management
  ---------------------------------
   get the current list of pools
  
  usage:
  > div get_staking_pool_list 
  `};
  
  get_staking_pool_list(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_staking_pool_list has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_staking_pool_list")
    
  }
  
  remove_staking_pool_HELP(){ return `
  remove staking pool from list *if it's empty*
  
  usage:
  > div remove_staking_pool { inx: u16 }
  `};
  
  remove_staking_pool(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ inx: u16 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("remove_staking_pool",fnJSONParams)
    
  }
  
  set_staking_pool_weight_HELP(){ return `
  update existing weight_basis_points
  
  usage:
  > div set_staking_pool_weight { inx: u16, weight_basis_points: u16 }
  `};
  
  set_staking_pool_weight(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ inx: u16, weight_basis_points: u16 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("set_staking_pool_weight",fnJSONParams)
    
  }
  
  set_staking_pool_HELP(){ return `
  add a new staking pool or update existing weight_basis_points
  
  usage:
  > div set_staking_pool { account_id: AccountId, weight_basis_points: u16 }
  `};
  
  set_staking_pool(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId, weight_basis_points: u16 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("set_staking_pool",fnJSONParams)
    
  }
  
  distribute_HELP(){ return `
  -----------------------------
   DISTRIBUTE
  -----------------------------
   operator method
   distribute. Do staking & unstaking in batches of at most 100Kn
   called externaly every 30 mins or less if: a) there's a large stake/unstake oper to perform or b) the epoch is about to finish and there are stakes to be made
   returns "true" if there's still more job to do
  
  usage:
  > div distribute 
  `};
  
  distribute(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--distribute has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("distribute")
    
  }
  
  on_staking_pool_stake_maybe_deposit_HELP(){ return `
  prev fn continues here
   Called after amount is staked from the sp's unstaked balance (all into  the staking pool contract).
   This method needs to update staking pool status.
  
  usage:
  > div on_staking_pool_stake_maybe_deposit { sp_inx: usize, amount: u128, included_deposit: bool }
  `};
  
  on_staking_pool_stake_maybe_deposit(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ sp_inx: usize, amount: u128, included_deposit: bool }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("on_staking_pool_stake_maybe_deposit",fnJSONParams)
    
  }
  
  on_staking_pool_unstake_HELP(){ return `
   Called after the given amount was unstaked at the staking pool contract.
   This method needs to update staking pool status.
  
  usage:
  > div on_staking_pool_unstake { sp_inx: usize, amount: u128 }
  `};
  
  on_staking_pool_unstake(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ sp_inx: usize, amount: u128 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("on_staking_pool_unstake",fnJSONParams)
    
  }
  
  get_operator_account_id_HELP(){ return `
  ------------------------------------------
   GETTERS (moved from getters.rs)
  ------------------------------------------
   Returns the account ID of the owner.
  
  usage:
  > div get_operator_account_id 
  `};
  
  get_operator_account_id(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_operator_account_id has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_operator_account_id")
    
  }
  
  get_known_deposited_balance_HELP(){ return `
   The amount of tokens that were deposited to the staking pool.
   NOTE: The actual balance can be larger than this known deposit balance due to staking
   rewards acquired on the staking pool.
   To refresh the amount the owner can call 'refresh_staking_pool_balance'.
  
  usage:
  > div get_known_deposited_balance 
  `};
  
  get_known_deposited_balance(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_known_deposited_balance has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_known_deposited_balance")
    
  }
  
  get_account_info_HELP(){ return `
   full account info
   Returns JSON representation of the account for the given account ID.
  
  usage:
  > div get_account_info { account_id: AccountId }
  `};
  
  get_account_info(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ account_id: AccountId }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_account_info",fnJSONParams)
    
  }
  
  get_contract_info_HELP(){ return `
   NEP-129 get information about this contract
   returns JSON string according to [NEP-129](https://github.com/nearprotocol/NEPs/pull/129)
  
  usage:
  > div get_contract_info 
  `};
  
  get_contract_info(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_contract_info has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_contract_info")
    
  }
  
  get_contract_state_HELP(){ return `
   get contract totals 
   Returns JSON representation of the contract state
  
  usage:
  > div get_contract_state 
  `};
  
  get_contract_state(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_contract_state has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_contract_state")
    
  }
  
  get_contract_params_HELP(){ return `
   Returns JSON representation of contract parameters
  
  usage:
  > div get_contract_params 
  `};
  
  get_contract_params(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //--get_contract_params has no arguments, if you add some, uncomment the following line and send the params in this.call/view
    //const fnJSONParams = a.consumeJSON("{ x:0, y:1, z:3 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_contract_params")
    
  }
  
  set_contract_params_HELP(){ return `
   Returns JSON representation of contract parameters
  
  usage:
  > div set_contract_params { params: ContractParamsJSON }
  `};
  
  set_contract_params(a /*:CommandLineArgs*/) /*:void*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ params: ContractParamsJSON }")
    
    a.noMoreArgs() // no more positional args should remain
    
    this._call("set_contract_params",fnJSONParams)
    
  }
  
  get_sp_info_HELP(){ return `
   get sp (staking-pool) info
   Returns JSON representation of sp recorded state
  
  usage:
  > div get_sp_info { sp_inx_i32: i32 }
  `};
  
  get_sp_info(a /*:CommandLineArgs*/) /*:string*/{
    
    //--these are some examples on how to consume arguments
    //const toAccount = a.consumeString("to Account")
    //const argumentJson = a.consumeJSON("{ account:userAccount, amount:xxN }")
    
    //get fn arguments as JSON
    const fnJSONParams = a.consumeJSON("{ sp_inx_i32: i32 }")
    
    a.noMoreArgs() // no more positional args should remain
    
    return this._view("get_sp_info",fnJSONParams)
    
  }
  
}
module.exports = ContractAPI;
