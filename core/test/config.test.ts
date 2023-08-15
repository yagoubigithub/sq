import { Config, Profile, Settings, GDTServiceSettings } from '../src/core'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const CONFIG_CONTENT = {
  profiles: {
    1: {
      name: 'ISPC - client 1',
      settings: {
        deviceId: 'mydevice1',
        licenseKey: 'MYLICENSEKEY123',
        password: 'mysecretpassword',
        serverUrl: 'https://some.url/to/the/server.php'
      }
    } as Profile,
    2: {
      name: 'PainPool',
      settings: {
        deviceId: 'testdevluc',
        licenseKey: 'XCTL52R8P7Q7',
        password: '345d76rcftv8by98nu0mi9o0p',
        serverUrl: 'https://www.painpool.de/app/webservice/serve.php'
      },
      gdtServiceSettings: {
        inputFolderPath: '/home/luc/Documents/test-gdt',
        outputFolderPath: '/home/luc/Documents/test-gdt',
        nameTerm: 'TERM',
        nameApp: 'PAIN',
        gdtReturnCode: 'painpp'
      }
    } as Profile
  }
}

const CONFIG_FILE_NAME = 'config.json'

const TMP_DIR = os.tmpdir()

/**
 * Config tests
 */
describe('Managing configuration file', () => {
  beforeAll(() => {
    fs.writeFileSync(
      path.join(TMP_DIR, CONFIG_FILE_NAME),
      JSON.stringify(CONFIG_CONTENT, null, 2),
      { encoding: 'utf-8' }
    )
  })

  it('the loaded configuration is correct', async () => {
    const config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    const profiles: any = {}
    config.profiles.forEach(profile => (profiles[profile.id] = profile))
    expect(profiles).toMatchObject(CONFIG_CONTENT.profiles)
  })

  // it("the configuration can be loaded from /etc/sq-communicator/config.json", async () => {
  // 	const config = await Config.load('/etc/sq-communicator/config.json');
  // 	console.log(config);
  // 	expect(true).toBeTruthy();
  // });

  it('the configuration can be saved', async () => {
    let config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    let profile = config.getProfile(2)
    expect(profile).toBeDefined()
    profile!.gdtServiceSettings!.gdtReturnCode = 'painpp2'
    await config.save()
    config = await Config.load(config.filePath)
    profile = config.getProfile(2)
    expect(profile).toBeDefined()
    expect(profile!.gdtServiceSettings!.gdtReturnCode).toBe('painpp2')
  })

  it('GDT input and output paths are correct', async () => {
    const config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    const inputFilePath = Config.getGDTInputFilePath(config.getProfile(2)!)
    expect(inputFilePath).toBe(
      path.join('/home/luc/Documents/test-gdt', 'TERMPAIN.GDT')
    )
    const outputFilePath = Config.getGDTOutputFilePath(config.getProfile(2)!)
    expect(outputFilePath).toBe(
      path.join('/home/luc/Documents/test-gdt', 'PAINTERM.GDT')
    )
  })

  it('new profile can be added', async () => {
    let config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    const settings: Settings = {
      deviceId: 'mydevice3',
      licenseKey: 'MYLICENSEKEY123',
      password: 'mysecretpassword',
      serverUrl: 'https://some.url/to/the/server.php'
    }
    const gdtServiceSettings: GDTServiceSettings = {
      inputFolderPath: '/home/luc/Documents/test-gdt3',
      outputFolderPath: '/home/luc/Documents/test-gdt3',
      nameTerm: 'TERM',
      nameApp: 'PAIN',
      gdtReturnCode: 'painpp3'
    }
    config.addProfile('new profile', settings, gdtServiceSettings)
    await config.save()
    config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    const profile = config.getProfile(3)
    expect(profile).toBeDefined()
    expect(profile!.settings).toMatchObject(settings)
    expect(profile!.gdtServiceSettings).toMatchObject(gdtServiceSettings)
  })

  it('a profile can be deleted', async () => {
    let config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    let profile = config.getProfile(3)
    expect(profile).toBeDefined()
    config.deleteProfile(profile!)
    await config.save()
    config = await Config.load(path.join(TMP_DIR, CONFIG_FILE_NAME))
    profile = config.getProfile(3)
    expect(profile).toBeUndefined()
  })

  afterAll(() => {
    fs.unlinkSync(path.join(TMP_DIR, CONFIG_FILE_NAME))
  })
})
