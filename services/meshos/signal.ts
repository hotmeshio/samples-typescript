import { MeshOSConfig } from './config';

export class MySignalClass extends MeshOSConfig {

  workflowFunctions = ['signal'];
  hookFunctions = ['hookAndSignalBack'];

  async signal(name: string): Promise<Record<string, any>> {
    const signalId = 'abc-signal';
    const receipt = await this.hookAndSignalBack(name, signalId);
    console.log('hook receipt =>', receipt);

    //pause until the signal is received
    const [signal] = await MySignalClass.MeshOS.waitForSignal([signalId]);
    return signal;
  }

  async hookAndSignalBack(name: string, signal: string): Promise<void> {
    //wait a bit to simulate a long running task
    await MySignalClass.MeshOS.sleep('5 seconds');
    //awaken the main function
    await MySignalClass.MeshOS.signal(signal, { name })
  }
}
  