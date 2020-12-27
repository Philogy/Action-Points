# Action-Points
Contracts for creating, reedeming and distributing fungible "action point" tokens.

### 1. Basic Structure
The main token contract is `/contracts/ActionPoints.sol`. Upon deploying it will
store the deployer as the owner. The deployed contract is a ERC-20
compliant token. The starting supply is `0`. In order to enable minting one must
deploy a mint approver.

Standard approvers can be found in the `/contracts/mint-approver-adapters`.

#### 1.1 Redeeming Action Point tokens
The Redeemer contract (`/contracts/Redeemer.sol`) enables holders of Action Point
tokens to redeem them for another token proportional to their share of the total
supply of the Action Point Token. The redemption is done by first approving the
redeemer contract to spend tokens via the `approve` ERC-20 function and then by
calling the `redeem` function on the Redeemer Contract, this burns tokens and
sends a portion of the available tokens stored in the contract.

#### 1.2 Minting Action Points
Approver contracts act as oracles to tell the Action Point contract when certain
addresses can mint. Action Point tokens can also be minted directly by the owner
via the `mintDirectly` method.

#### 1.2.1 SingleEOAdapter
This contract enables an owner to create signed message permitting others to
mint tokens. This is advantageous because the owner does not have to spend any gas
up front. To enable this contract one must simply deploy it and then transfer
ownership on the Action Point contract to the newly deployed contract.

To facilitate the creation of signed messages the SingleEOAdapter contract
(`/contracts/mint-approver-adapters/SingleEOAdapter.sol`) exposes the
`messageToSign` method. The owner can then simply use `eth_sign` method to then
sign the provided hash.

To mint tokens a user must simply supply the signed nonce, token amount and
signature to the `mintWithOwnerData` method of the ActionPoints contract.

#### 1.2.1 GnosisSafeAdapter
This contract enables the Action Point Token contract to verify whether a group
of owners of a Gnosis Safe multisig wallet have signed a specific message.
