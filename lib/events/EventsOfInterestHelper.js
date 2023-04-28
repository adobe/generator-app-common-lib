/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

async function promptForEventsOfInterest (eventsClient, obj) {
  // get a map of provider_metadata_id -> providers
  const providerMetadataToProvidersMap = await getProviderMetadataToProvidersMap(obj.projectConfig.org.id, eventsClient)
  const providerMetadataIds = await getProviderMetadata(obj, providerMetadataToProvidersMap)
  // get the existing map of provider_metadata_id -> provider_id from the .env file
  const selectedProvidersToEventMetadata = new Map()
  for (const providerMetadata of providerMetadataIds) {
    const providerSelected = await selectProviderForProviderMetadata(
      providerMetadataToProvidersMap, providerMetadata, obj)
    const eventMetadataChoices = []
    const eventMetadataSelected = await selectEventMetadataForProvider(
      providerSelected, eventMetadataChoices, obj)
    selectedProvidersToEventMetadata[providerSelected.providerMetadata] = {
      provider: providerSelected,
      eventMetadata: eventMetadataSelected
    }
  }
  return selectedProvidersToEventMetadata
}

/** @private */
async function getProviderMetadataToProvidersMap (consumerId, eventsClient) {
  const providersHalModel = await eventsClient.getAllProviders(consumerId, true)
  const providers = providersHalModel._embedded.providers

  const providerMetadataToProvidersMap = providers.reduce((providerMetadataToProvidersMap, provider) => {
    providerMetadataToProvidersMap[provider.provider_metadata] = providerMetadataToProvidersMap[provider.provider_metadata] || []
    providerMetadataToProvidersMap[provider.provider_metadata].push({
      id: provider.id,
      label: provider.label,
      description: provider.description,
      providerMetadata: provider.provider_metadata,
      eventMetadata: provider._embedded.eventmetadata
    })
    return providerMetadataToProvidersMap
  }, [])
  return providerMetadataToProvidersMap
}

function getProviderMetadataToProvidersExistingMap(providerMetadataToProviderMappingDotEnv) {
  if(providerMetadataToProviderMappingDotEnv) {
    const entries = providerMetadataToProviderMappingDotEnv.split(',');
    let providerMetadataToProviderIdMappingExistingMap = {};
    for (let i = 0; i < entries.length; i++) {
      let tokens = entries[i].split(':');
      providerMetadataToProviderIdMappingExistingMap[tokens[0].trim()] = tokens[1].trim();
    }
    console.log(providerMetadataToProviderIdMappingExistingMap)
    return providerMetadataToProviderIdMappingExistingMap
  }
  return {}
}

/** @private */
async function getProviderMetadata (obj, providerMetadataToProvidersMap) {
  const { providerMetadataIds } = await obj.prompt({
    type: 'checkbox',
    name: 'providerMetadataIds',
    message: 'Choose from below family of providers ( provider metadata )',
    choices: Object.keys(providerMetadataToProvidersMap),
    pageSize: 5,
    validate: (options) => {
      if (!options.length) {
        return 'Choose at least one of the above, use space to choose the option'
      }
      return true
    }
  })
  return providerMetadataIds
}

/** @private */
async function selectProviderForProviderMetadata (providerMetadataToProvidersMap,
    providerMetadata, obj) {
  const providerChoices = []
  const providersList = providerMetadataToProvidersMap[providerMetadata]
  if (providersList.length === 1) {
    providerChoices.push({
      name: providersList[0].label,
      description: providersList[0].description,
      checked: true,
      value: providersList[0]
    })
  } else {
    for (const provider of providersList) {
      providerChoices.push({
        name: provider.label,
        description: provider.description,
        value: provider
      })
    }
  }
  const { provider } = await obj.prompt({
    type: 'list',
    name: 'provider',
    message: `Choose from below provider for provider metadata: ${providerMetadata}`,
    choices: providerChoices,
    pageSize: 5
  })
  return provider
}

/** @private */
async function selectEventMetadataForProvider (providerSelected, eventMetadataChoices, obj) {
  for (const eventMetadata of providerSelected.eventMetadata) {
    eventMetadataChoices.push({
      name: eventMetadata.label,
      description: eventMetadata.description,
      value: eventMetadata.event_code
    })
  }
  const { eventMetadataSelection } = await obj.prompt({
    type: 'checkbox',
    name: 'eventMetadataSelection',
    message: `Choose event metadata for provider: ${providerSelected.label}`,
    choices: eventMetadataChoices,
    pageSize: 5,
    validate: (options) => {
      if (!options.length) {
        return 'Choose at least one of the above, use space to choose the option'
      }
      return true
    }
  })
  return eventMetadataSelection
}

module.exports = {
  promptForEventsOfInterest,
  getProviderMetadataToProvidersExistingMap
}
