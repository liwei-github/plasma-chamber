import { IPubsubClient, SubscribeHandler } from '../../src/client'

export class MockPubsubClient implements IPubsubClient {
  public publish(topic: string, message: string) {
    return true
  }
  public subscribe(topic: string, event: SubscribeHandler): void {
    return
  }
  public unsubscribe(topic: string, handler: SubscribeHandler): void {
    return
  }
}
