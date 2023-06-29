/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const path = require('path')
jest.mock('@adobe/aio-lib-events')
const cloneDeep = require('lodash.clonedeep')
const eventsSdk = require('@adobe/aio-lib-events')
const mockEventsSdkInstance = {
  createRegistration: jest.fn(),
  updateRegistration: jest.fn()
}
jest.mock('@adobe/aio-lib-ims', () => ({
  getToken: jest.fn().mockResolvedValue('token')
}))
const EventsGenerator = require('../../lib/EventsGenerator')
const Generator = require('yeoman-generator')
const generatorOptions = cloneDeep(global.basicGeneratorOptions)
jest.mock('yeoman-generator')
jest.mock('@adobe/aio-lib-events')
jest.mock('../../lib/utils.js')
const utils = require('../../lib/utils.js')

const projectConfig = {
  id: 'project-id',
  name: 'project-name',
  title: 'project-title',
  description: 'project-description',
  org: {
    id: 'org-id',
    name: 'org-name',
    ims_org_id: 'imsOrgId@AdobeOrg'
  }
}

describe('prototype', () => {
  test('exports a yeoman generator', () => {
    expect(EventsGenerator.prototype).toBeInstanceOf(Generator)
  })
})

beforeEach(() => {
  utils.readYAMLConfig.mockRestore()
  utils.readPackageJson.mockRestore()
  utils.writeYAMLConfig.mockRestore()
  utils.writePackageJson.mockRestore()
  utils.appendStubVarsToDotenv.mockRestore()
  utils.addDependencies.mockRestore()
  utils.writeKeyYAMLConfig.mockRestore()
  eventsSdk.init.mockResolvedValue(mockEventsSdkInstance)
})

describe('implementation', () => {
  beforeEach(() => {
    EventsGenerator.prototype.templatePath = p => path.join('/fakeTplDir', p)
    EventsGenerator.prototype.destinationPath = (...args) => path.join('/fakeDestRoot', ...args)
    EventsGenerator.prototype.env = {
      error: (text) => { throw text }
    }
    Generator.prototype.options = generatorOptions
  })
  describe('constructor', () => {
    test('accept options', () => {
      const spy = jest.spyOn(EventsGenerator.prototype, 'option')
      // eslint-disable-next-line no-new
      new EventsGenerator()
      expect(spy).toHaveBeenCalledWith('skip-prompt', { default: false })
      expect(spy).toHaveBeenCalledWith('action-folder', { type: String, description: expect.any(String) })
      expect(spy).toHaveBeenCalledWith('config-path', { type: String, description: expect.any(String) })
      expect(spy).toHaveBeenCalledWith('full-key-to-manifest', { type: String, description: expect.any(String), default: '' })
      expect(spy).toHaveBeenCalledWith('full-key-to-events-manifest', { type: String, description: expect.any(String), default: '' })

      spy.mockRestore()
    })

    test('no options', () => {
      Generator.prototype.options = {} // no options set, should error
      // eslint-disable-next-line no-new
      expect(() => new EventsGenerator()).toThrow()
    })
  })

  describe('events client initialisation', () => {
    let promptSpy
    let eventsGenerator
    beforeEach(() => {
      promptSpy = jest.spyOn(EventsGenerator.prototype, 'prompt')
      eventsGenerator = new EventsGenerator()
      eventsGenerator.options = { 'skip-prompt': false }
      EventsGenerator.prototype.env = {
        error: (text) => { throw new Error(text) }
      }
    })
    afterEach(() => {
      promptSpy.mockRestore()
    })
    test('init events client fail on invalid project config', async () => {
      await expect(eventsGenerator.initEventsClient()).rejects.toThrow('Incomplete .aio configuration, please import a valid Adobe Developer Console configuration via `aio app use` first.')
    })
    test('init event client successful', async () => {
      eventsGenerator.projectConfig = projectConfig
      const eventsClient = await eventsGenerator.initEventsClient()
      expect(eventsClient).toBeTruthy()
    })
  })
})
