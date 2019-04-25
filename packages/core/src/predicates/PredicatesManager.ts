import { Address } from '../helpers/types'
import { StateUpdate } from '../StateUpdate'
import { OwnershipPredicate } from './OwnershipPredicate'
import { PaymentChannelPredicate } from './PaymentChannelPredicate'

export class PredicatesManager {
  public predicates: Map<Address, string>
  public name2address: Map<string, Address>

  constructor() {
    this.predicates = new Map<Address, string>()
    this.name2address = new Map<string, Address>()
  }

  public addPredicate(predicateAddress: Address, nativePredicate: string) {
    this.predicates.set(predicateAddress, nativePredicate)
    this.name2address.set(nativePredicate, predicateAddress)
  }

  public getNativePredicate(nativePredicate: string) {
    const address = this.name2address.get(nativePredicate)
    if (address) {
      return address
    } else {
      throw new Error('unknown predicate name')
    }
  }

  public verifyDeprecation(
    predicate: Address,
    hash: string,
    stateUpdate: StateUpdate,
    deprecationWitness: string,
    nextStateUpdate: StateUpdate
  ) {
    const native = this.predicates.get(predicate)
    if (native === 'OwnershipPredicate') {
      return OwnershipPredicate.verifyDeprecation(
        hash,
        stateUpdate,
        deprecationWitness,
        nextStateUpdate
      )
    } else if (native === 'PaymentChannelPredicate') {
      return PaymentChannelPredicate.verifyDeprecation(
        hash,
        stateUpdate,
        deprecationWitness,
        nextStateUpdate
      )
    }
    return false
  }

  public isOwnedBy(
    predicate: Address,
    owner: Address,
    stateUpdate: StateUpdate
  ) {
    const native = this.predicates.get(predicate)
    if (native === 'OwnershipPredicate') {
      return OwnershipPredicate.isOwnedBy(owner, stateUpdate)
    }
    return false
  }
}