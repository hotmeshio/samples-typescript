import { Durable } from '@hotmeshio/hotmesh';

type SignalPayload = Record<string, string>;

export async function waitExample(name: string): Promise<[SignalPayload, SignalPayload]> {
  console.log('I am waiting for the abc and xyz signal.');

  //wait for the collated signals
  const [abc, xyz] = await Durable.workflow.waitForSignal(['abc','xyz']);

  return [abc, xyz];
}
