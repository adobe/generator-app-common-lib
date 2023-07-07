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
  promptForEventsOfInterest: jest.fn().mockResolvedValue(selectedProvidersToEventMetadata),
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

const selectedProvidersToEventMetadata = {
  'provider-metadata-1': {
    provider: {
      id: 'provider-id-1',
      label: 'provider-label-1',
      description: 'provider-desc-1',
      providerMetadata: 'provider-metadata-1',
      eventMetadata: [{
        name: 'event-metadata-1',
        value: 'event-metadata-1',
        description: 'event-metadata-desc-1'
      }, {
        name: 'event-metadata-2',
        value: 'event-metadata-2',
        description: 'event-metadata-desc-2'
      }]
    },
    eventMetadata: ['event-metadata-1', 'event-metadata-2']
  },
  'provider-metadata-2': {
    provider: {
      id: 'provider-id-2',
      label: 'provider-label-2',
      description: 'provider-desc-2',
      providerMetadata: 'provider-metadata-2',
      eventMetadata: [{
        name: 'event-metadata-3',
        value: 'event-metadata-3',
        description: 'event-metadata-desc-3'
      }]
    },
    eventMetadata: ['event-metadata-3']
  }
}

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

const testRegistration = {
  description: 'test-description',
  events_of_interest: [
    {
      event_codes: [
        'event-metadata-1',
        'event-metadata-2'
      ],
      provider_metadata: 'provider-metadata-1'
    },
    {
      event_codes: [
        'event-metadata-3'
      ],
      provider_metadata: 'provider-metadata-2'
    }
  ],
  runtime_action: 'test-action-name'
}

const existingTestRegistration = {
  description: 'test-description-existing',
  events_of_interest: [
    {
      event_codes: [
        'event-metadata-4',
        'event-metadata-5'
      ],
      provider_metadata: 'provider-metadata-3'
    }
  ],
  runtime_action: 'test-action-name-existing'
}

const eventsManifestDetails = {
  registrations: {
    'test-name': testRegistration
  }
}

const eventDetailsInput = {
  regName: 'test-name',
  regDesc: 'test-description',
  selectedProvidersToEventMetadata,
  runtimeActionName: 'test-action-name'
}

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
      eventsGenerator.projectConfig = projectConfig
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
      eventsGenerator.projectConfig = projectConfig
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

    test('skip prompt for event details', async () => {
      eventsGenerator.options = { 'skip-prompt': true }
      promptSpy.mockResolvedValue({
        regName: 'test-name',
        regDesc: 'test-description'
      })
      const regDetails = await eventsGenerator.promptForEventsDetails({ regName: 'defaultName', regDesc: 'defaultDesc' })
      // { regName, regDesc, selectedProvidersToEventMetadata, runtimeActionName }
      expect(regDetails).toBeUndefined()
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
        eventDetailsInput
      )
      // 1. test manifest creation with action information
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        eventsManifestDetails)
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
            'test-name-existing': existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents(eventDetailsInput, './templateFile.js')

      // 1. test manifest creation with action information, and preserving previous content
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        {
          registrations: {
            'test-name': testRegistration,
            'test-name-existing': existingTestRegistration
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
            'test-name-existing': existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents({
        regName: 'test-name-existing',
        regDesc: eventDetailsInput.regDesc,
        selectedProvidersToEventMetadata: eventDetailsInput.selectedProvidersToEventMetadata,
        runtimeActionName: eventDetailsInput.runtimeActionName
      }, './templateFile.js')

      // 1. test manifest creation with action information, and preserving previous content
      expect(utils.writeKeyYAMLConfig).toHaveBeenCalledWith(
        eventsGenerator,
        n('/fakeDestRoot/ext.config.yaml'),
        'events',
        // function path should be checked to be relative to config file
        {
          registrations: {
            'test-name-existing': testRegistration
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
            'test-name-existing': existingTestRegistration
          }
        }
      })

      eventsGenerator.addEvents({
        regName: eventDetailsInput.regName,
        regDesc: 'test-description-existing',
        selectedProvidersToEventMetadata: {
          'provider-metadata-3': {
            provider: {
              id: 'provider-id-3',
              providerMetadata: 'provider-metadata-3',
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
            eventMetadata: ['event-metadata-4', 'event-metadata-5']
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
            'test-name': existingTestRegistration,
            'test-name-existing': existingTestRegistration
          }
        })
      // 2. check if the env variable file is updated with right values
      expect(utils.appendVarsToDotenv).toHaveBeenCalledWith(eventsGenerator, 'Provider metadata to provider id mapping',
        aioEventsMappingEnvVariable, 'provider-metadata-3:provider-id-3')
      expect(eventsGenerator.addAction).toHaveBeenCalledTimes(0)
    })
  })
})
