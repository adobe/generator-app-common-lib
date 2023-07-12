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

async function promptForRuntimeAction (obj) {
  const { runtimeManifest, runtimePackageName } = obj.loadRuntimeManifest(
    obj.configPath, obj.fullKeyToManifest, obj.defaultRuntimePackageName)
  const existingActions = getExistingActionNames(runtimeManifest, runtimePackageName)
  let runtimeActionName
  if (existingActions.length > 0) {
    const { actionSelection } = await obj.prompt(
      {
        type: 'confirm',
        name: 'actionSelection',
        message: 'Do you want to use an existing non-web action for this registration? ( If not, you will be able to create a new action for IO Events )',
        default: false,
        when: !obj.options['skip-prompt']
      })
    if (actionSelection) {
      const { existingAction } = await obj.prompt(
        {
          type: 'list',
          name: 'existingAction',
          message: 'Choose from the following non-web actions to listen to events',
          choices: existingActions
        }
      )
      runtimeActionName = existingAction
    }
  }
  if (!runtimeActionName) {
    runtimeActionName = await obj.promptForActionName(
      'A generic action that logs the events received from IO Events', 'generic')
  }
  return runtimePackageName + '/' + runtimeActionName
}

/** @private */
function getExistingActionNames (runtimeManifest, pkgName) {
  const actionNames = []
  const availableActions = runtimeManifest.packages[pkgName].actions
  for (const actionName in availableActions) {
    const actionDetails = availableActions[actionName]
    if (actionDetails.web === 'no' && actionDetails.annotations && actionDetails.annotations['require-adobe-auth'] === false) { actionNames.push(actionName) }
  }
  return actionNames
}

module.exports = {
  promptForRuntimeAction
}
