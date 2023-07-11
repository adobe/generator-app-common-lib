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

const eventsSdk = require('@adobe/aio-lib-events')
const mockData = require('../mock')
const { getEntitledProviderMetadataForOrg, getProviderMetadata } = require('../../../lib/events/ProviderMetadataHelper')
const EventsGenerator = require('../../../lib/EventsGenerator')
jest.mock('@adobe/aio-lib-events')
jest.mock('yeoman-generator')
jest.mock('../../../lib/EventsGenerator')

const mockEventsSdkInstance = {
  getProviderMetadata: jest.fn().mockResolvedValue(mockData.data.embeddedProviderMetadata)
}

beforeEach(() => {
  eventsSdk.init.mockResolvedValue(mockEventsSdkInstance)
})

describe('test provider metadata selection helper', () => {
  let eventsGenerator
  let promptSpy
  let eventsClient
  beforeEach(async () => {
    promptSpy = jest.spyOn(EventsGenerator.prototype, 'prompt')
    eventsClient = await eventsSdk.init('orgid', 'api-key', 'token')
    eventsGenerator = new EventsGenerator()
  })

  afterEach(() => {
    promptSpy.mockRestore()
  })

  test('get all entitled provider metadata for org', async () => {
    const providerMetadataListResponse = await getEntitledProviderMetadataForOrg(eventsClient)
    expect(providerMetadataListResponse.length).toBe(3)
  })

  test('select provider metadata prompt', async () => {
    promptSpy.mockResolvedValue({
      providerMetadataIds: ['provider-metadata-1', 'provider-metadata-3']
    })
    const providerMetadataListSelected = await getProviderMetadata(eventsGenerator, mockData.data.providerMetadataList)
    expect(providerMetadataListSelected.length).toBe(2)
  })

  test('select provider metadata validator', async () => {
    promptSpy.mockResolvedValue('')
    await getProviderMetadata(eventsGenerator, mockData.data.providerMetadataList)
    expect(promptSpy.mock.calls[0][0].validate).toBeInstanceOf(Function)
    const validate = promptSpy.mock.calls[0][0].validate
    expect(validate('')).toBe('Choose at least one of the above, use space to choose the option')
    expect(validate('provider-metadata-1')).toBe(true)
  })
})
