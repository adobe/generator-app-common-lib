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

const mockData = require('../mock')
const {
  selectEventMetadataForProvider, selectProviderForProviderMetadata,
  getAllEntitledProvidersForOrg
} = require('../../../lib/events/ProviderHelper')
const EventsGenerator = require('../../../lib/EventsGenerator')
const eventsSdk = require('@adobe/aio-lib-events')

jest.mock('yeoman-generator')
jest.mock('@adobe/aio-lib-events')
jest.mock('../../../lib/EventsGenerator')

jest.mock('../../../lib/events/ProviderMetadataHelper', () => ({
  getEntitledProviderMetadataForOrg: jest.fn().mockResolvedValue(mockData.data.providerMetadataList),
  getProviderMetadata: jest.fn().mockResolvedValue(['provider-metadata-1', 'provider-metadata-2'])
}))

const mockEventsSdkInstance = {
  getAllProviders: jest.fn().mockResolvedValue({
    _embedded: {
      providers: [{
        id: 'provider-id-1',
        label: 'provider-label-1',
        description: 'provider-description-1',
        provider_metadata: 'provider-metadata-1'
      },
      {
        id: 'provider-id-2',
        label: 'provider-label-2',
        description: 'provider-description-2',
        provider_metadata: 'provider-metadata-2'
      }
      ]
    }
  })
}

const getTestProvider = (index, numberOfEvents, providerMetadata) => {
  const eventMetadatas = []
  for (let number = 1; number <= numberOfEvents; number++) {
    eventMetadatas.push({
      description: 'event-metadata-' + number,
      label: 'event-metadata-label-' + number,
      event_code: 'event-code-' + number
    })
  }
  return {
    id: 'provider-id-' + index,
    label: 'provider-label-' + index,
    description: 'provider-description-' + index,
    provider_metadata: providerMetadata,
    eventmetadata: eventMetadatas
  }
}

const providerMetadataToProvidersMap = {
  'provider-metadata-1': [getTestProvider(1, 2, 'provider-metadata-1')],
  'provider-metadata-2': [
    getTestProvider(2, 2, 'provider-metadata-2'),
    getTestProvider(3, 1, 'provider-metadata-2')]
}

beforeEach(() => {
  eventsSdk.init.mockResolvedValue(mockEventsSdkInstance)
})
describe('test provider selection helper', () => {
  let eventsGenerator
  let promptSpy
  let eventsClient
  beforeEach(async () => {
    promptSpy = jest.spyOn(EventsGenerator.prototype, 'prompt')
    eventsClient = await eventsSdk.init('orgid', 'api-key', 'token')
    EventsGenerator.prototype.projectConfig = mockData.data.projectConfig
    eventsGenerator = new EventsGenerator()
  })
  afterEach(() => {
    promptSpy.mockRestore()
  })
  test('select provider for provider metadata for a single provider', async () => {
    promptSpy.mockResolvedValue({
      provider: getTestProvider(1, 2, 'provider-metadata-1')
    })
    const providerSelection = await selectProviderForProviderMetadata(providerMetadataToProvidersMap, 'provider-metadata-1', eventsGenerator)
    expect(providerSelection.label).toContain('provider-label-1')
    expect(eventsGenerator.prompt).toHaveBeenCalledWith({
      choices: [{ checked: true, name: 'provider-label-1', description: 'provider-description-1', value: getTestProvider(1, 2, 'provider-metadata-1') }],
      message: 'Choose from below provider for provider metadata: provider-metadata-1',
      name: 'provider',
      pageSize: 5,
      type: 'list'
    })
  })

  test('select provider for provider metadata with multiple providers', async () => {
    promptSpy.mockResolvedValue({
      provider: getTestProvider(3, 1, 'provider-metadata-2')
    })
    const providerSelection = await selectProviderForProviderMetadata(providerMetadataToProvidersMap, 'provider-metadata-2', eventsGenerator)
    expect(eventsGenerator.prompt).toHaveBeenCalledWith({
      choices: [{ name: 'provider-label-2', description: 'provider-description-2', value: getTestProvider(2, 2, 'provider-metadata-2') },
        { name: 'provider-label-3', description: 'provider-description-3', value: getTestProvider(3, 1, 'provider-metadata-2') }],
      message: 'Choose from below provider for provider metadata: provider-metadata-2',
      name: 'provider',
      pageSize: 5,
      type: 'list'
    })
    expect(providerSelection.label).toContain('provider-label-3')
  })

  test('select event metadata for provider', async () => {
    promptSpy.mockResolvedValue({
      eventMetadataSelection: 'event-code-2'
    })
    const eventMetadataSelection = await selectEventMetadataForProvider(getTestProvider(1, 2, 'provider-metadata-1'), [], eventsGenerator)
    expect(eventMetadataSelection).toContain('event-code-2')
  })

  test('get all entitled providers for org', async () => {
    const providerListResponse = await getAllEntitledProvidersForOrg(eventsClient, 'consumerId')
    expect(providerListResponse.length).toBe(2)
  })

  test('validates empty for event metadata selection', async () => {
    promptSpy.mockResolvedValue('')
    await selectEventMetadataForProvider(getTestProvider(1, 2, 'provider-metadata-1'), [], eventsGenerator)
    expect(promptSpy.mock.calls[0][0].validate).toBeInstanceOf(Function)
    const validate = promptSpy.mock.calls[0][0].validate
    expect(validate('')).toBe('Choose at least one of the above, use space to choose the option')
    expect(validate('event-code-1')).toBe(true)
  })
})
