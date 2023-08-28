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
const mockData = require('./mock')
const cloneDeep = require('lodash.clonedeep')
const eventsSdk = require('@adobe/aio-lib-events')
const { getProviderMetadataToProvidersExistingMap } = require('../../lib/events/EventsOfInterestHelper')

const mockEventsSdkInstance = {
  createRegistration: jest.fn(),
  updateRegistration: jest.fn()
}
jest.mock('@adobe/aio-lib-ims', () => ({
  getToken: jest.fn().mockResolvedValue('token')
}))

jest.mock('@adobe/aio-lib-ims', () => ({
  getToken: jest.fn().mockResolvedValue('token')
}))

jest.mock('../../lib/events/EventsOfInterestHelper', () => ({
  promptForEventsOfInterest: jest.fn().mockResolvedValue(mockData.data.selectedProvidersToEventMetadata),
  getProviderMetadataToProvidersExistingMap: jest.fn()
}))

jest.mock('../../lib/events/RuntimeActionForEventsHelper', () => ({
  promptForRuntimeAction: jest.fn().mockResolvedValue('test-action-name')
}))

const EventsGenerator = require('../../lib/EventsGenerator')
const Generator = require('yeoman-generator')
const generatorOptions = cloneDeep(global.basicGeneratorOptions)
jest.mock('yeoman-generator')
jest.mock('@adobe/aio-lib-events')
jest.mock('../../lib/utils.js')
const utils = require('../../lib/utils.js')

const aioEventsMappingEnvVariable = 'AIO_events_providermetadata_to_provider_mapping'

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

describe('prototype', () => {
  test('exports a yeoman generator', () => {
    expect(EventsGenerator.prototype).toBeInstanceOf(Generator)
  })
})

describe('implementation', () => {
  beforeEach(() => {
    EventsGenerator.prototype.templatePath = p => path.join('/fakeTplDir', p)
    EventsGenerator.prototype.destinationPath = (...args) => path.join('/fakeDestRoot', ...args)
    EventsGenerator.prototype.env = {
      error: (text) => { throw text }
    }
    Generator.prototype.options = generatorOptions
    EventsGenerator.prototype.addAction = jest.fn()
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
      eventsGenerator.projectConfig = mockData.data.projectConfig
      const eventsClient = await eventsGenerator.initEventsClient()
      expect(eventsClient).toBeTruthy()
    })
  })

  describe('prompt for event registration details', () => {
    let promptSpy
    let eventsGenerator
    beforeEach(async () => {
      promptSpy = jest.spyOn(EventsGenerator.prototype, 'prompt')
      eventsGenerator = new EventsGenerator()
      eventsGenerator.options = { 'skip-prompt': false }
      EventsGenerator.prototype.env = {
        error: (text) => { throw new Error(text) }
      }
      eventsGenerator.projectConfig = mockData.data.projectConfig
    })
    afterEach(() => {
      promptSpy.mockRestore()
    })
    test('prompt for event details', async () => {
      promptSpy.mockResolvedValue({
        regName: 'test-name',
        regDesc: 'test-description'
      })
      const regDetails = await eventsGenerator.promptForEventsDetails({ regName: 'defaultName', regDesc: 'defaultDesc' })
      // { regName, regDesc, selectedProvidersToEventMetadata, runtimeActionName }
      expect(regDetails.regName).toContain('test-name')
      expect(regDetails.regDesc).toContain('test-description')
      expect(regDetails.runtimeActionName).toContain('test-action-name')
    })

    test('skip prompt for event details to have no effect', async () => {
      eventsGenerator.options = { 'skip-prompt': true }
      promptSpy.mockResolvedValue({
        regName: 'test-name',
        regDesc: 'test-description'
      })
      const regDetails = await eventsGenerator.promptForEventsDetails({ regName: 'defaultName', regDesc: 'defaultDesc' })
      // { regName, regDesc, selectedProvidersToEventMetadata, runtimeActionName }
      expect(regDetails.regName).toContain('test-name')
      expect(regDetails.regDesc).toContain('test-description')
      expect(regDetails.runtimeActionName).toContain('test-action-name')
    })
  })

  describe('addEvents', () => {
    let eventsGenerator
    beforeEach(() => {
      eventsGenerator = new EventsGenerator()
      eventsGenerator.options = { 'skip-prompt': false }
      eventsGenerator.addAction = jest.fn()
    })

    test('with no options and manifest does not exist and no regDetails', () => {
      // mock files
      getProviderMetadataToProvidersExistingMap.mockImplementation(() => {})
      utils.readPackageJson.mockReturnValue({})
      utils.readYAMLConfig.mockReturnValue({})

      eventsGenerator.addEvents(
        undefined
      )
      // 1. test manifest creation with action information
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledTimes(0)
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledTimes(0)
    })

    test('with no options and manifest does not exist', () => {
      // mock files
      getProviderMetadataToProvidersExistingMap.mockImplementation(() => {})
      utils.readPackageJson.mockReturnValue({})
      utils.readYAMLConfig.mockReturnValue({})

      eventsGenerator.addEvents(
        mockData.data.eventDetailsInput
      )
      // 1. test manifest creation with action information
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        mockData.data.eventsManifestDetails)
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledWith(eventsGenerator, 'Provider metadata to provider id mapping',
        aioEventsMappingEnvVariable, 'provider-metadata-1:provider-id-1,provider-metadata-2:provider-id-2')
    })

    test('with events manifest already exists', () => {
      // mock files
      getProviderMetadataToProvidersExistingMap.mockReturnValueOnce({ 'provider-metadata-3': 'provider-3' })
      utils.readPackageJson.mockReturnValue({})
      utils.readYAMLConfig.mockReturnValue({
        events: {
          registrations: {
            'test-name-existing': mockData.data.existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents(mockData.data.eventDetailsInput, './templateFile.js')

      // 1. test manifest creation with action information, and preserving previous content
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        {
          registrations: {
            'test-name': mockData.data.testRegistration,
            'test-name-existing': mockData.data.existingTestRegistration
          }
        })
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledWith(eventsGenerator, 'Provider metadata to provider id mapping',
        aioEventsMappingEnvVariable, 'provider-metadata-3:provider-3,provider-metadata-1:provider-id-1,provider-metadata-2:provider-id-2')
      expect(eventsGenerator.addAction).toHaveBeenCalledWith('test-action-name', './templateFile.js', {})
    })

    test('with events manifest already exists and updating existing registration', () => {
      getProviderMetadataToProvidersExistingMap.mockReturnValueOnce({ 'provider-metadata-3': 'provider-id-3' })
      utils.readPackageJson.mockReturnValue({})
      utils.readYAMLConfig.mockReturnValue({
        events: {
          registrations: {
            'test-name-existing': mockData.data.existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents({
        regName: 'test-name-existing',
        regDesc: mockData.data.eventDetailsInput.regDesc,
        selectedProvidersToEventMetadata: mockData.data.eventDetailsInput.selectedProvidersToEventMetadata,
        runtimeActionName: mockData.data.eventDetailsInput.runtimeActionName
      }, './templateFile.js')

      // 1. test manifest creation with action information, and preserving previous content
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        {
          registrations: {
            'test-name-existing': mockData.data.testRegistration
          }
        })
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledWith(eventsGenerator, 'Provider metadata to provider id mapping',
        aioEventsMappingEnvVariable, 'provider-metadata-3:provider-id-3,provider-metadata-1:provider-id-1,provider-metadata-2:provider-id-2')
      expect(eventsGenerator.addAction).toHaveBeenCalledWith('test-action-name', './templateFile.js', {})
    })

    test('with events manifest already exists and with new registration but same events of interest and existing runtime action', () => {
      getProviderMetadataToProvidersExistingMap.mockReturnValueOnce({ 'provider-metadata-3': 'provider-id-3' })
      utils.readPackageJson.mockReturnValue({})
      utils.readYAMLConfig.mockReturnValue({
        runtimeManifest: {
          packages: {
            somepackage: {
              actions: {
                'test-action-name-existing': { function: 'fake.js' }
              }
            }
          }
        },
        events: {
          registrations: {
            'test-name-existing': mockData.data.existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents({
        regName: mockData.data.eventDetailsInput.regName,
        regDesc: 'test-description-existing',
        selectedProvidersToEventMetadata: {
          'provider-metadata-3': {
            provider: {
              id: 'provider-id-3',
              provider_metadata: 'provider-metadata-3',
              eventMetadata: [{
                name: 'event-metadata-4',
                value: 'event-metadata-4',
                description: 'event-metadata-desc-4'
              }, {
                name: 'event-metadata-5',
                value: 'event-metadata-5',
                description: 'event-metadata-desc-5'
              }]
            },
            eventmetadata: ['event-metadata-4', 'event-metadata-5']
          }
        },
        runtimeActionName: 'test-action-name-existing'
      }, './templateFile.js')

      // 1. test manifest creation with action information, and preserving previous content
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        {
          registrations: {
            'test-name': mockData.data.existingTestRegistration,
            'test-name-existing': mockData.data.existingTestRegistration
          }
        })
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledWith(eventsGenerator, 'Provider metadata to provider id mapping',
        aioEventsMappingEnvVariable, 'provider-metadata-3:provider-id-3')
      expect(eventsGenerator.addAction).toHaveBeenCalledTimes(0)
    })
  })
})
