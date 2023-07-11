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

async function selectEventMetadataForProvider (providerSelected, eventMetadataChoices, obj) {
  for (const eventMetadata of providerSelected.eventmetadata) {
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
  selectProviderForProviderMetadata,
  selectEventMetadataForProvider
}
