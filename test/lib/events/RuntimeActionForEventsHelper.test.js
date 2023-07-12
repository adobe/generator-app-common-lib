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
const { promptForRuntimeAction } = require('../../../lib/events/RuntimeActionForEventsHelper')
const EventsGenerator = require('../../../lib/EventsGenerator')
jest.mock('yeoman-generator')
jest.mock('../../../lib/EventsGenerator')

describe('test runtime action selection helper', () => {
  let eventsGenerator
  let promptSpy
  beforeEach(() => {
    promptSpy = jest.spyOn(EventsGenerator.prototype, 'prompt')
    EventsGenerator.prototype.loadRuntimeManifest = jest.fn().mockReturnValue({
      runtimeManifest: mockData.data.runtimeManifestWithAvailableNonWebActions,
      runtimePackageName: 'somepackage'
    })
    EventsGenerator.prototype.promptForActionName = jest.fn().mockReturnValue('test-runtime-action-name')
    eventsGenerator = new EventsGenerator()
    eventsGenerator.options = { 'skip-prompt': false }
  })
  afterEach(() => {
    promptSpy.mockRestore()
  })
  test('select from existing non web action names', async () => {
    promptSpy.mockResolvedValue({
      actionSelection: true,
      existingAction: 'actionValidForEvents'
    })

    const runtimeActionName = await promptForRuntimeAction(eventsGenerator)
    expect(runtimeActionName).toContain('somepackage/actionValidForEvents')
    expect(promptSpy).toHaveBeenNthCalledWith(1,
      {
        default: false,
        message: 'Do you want to use an existing non-web action for this registration? ( If not, you will be able to create a new action for IO Events )',
        name: 'actionSelection',
        type: 'confirm',
        when: true
      })
    expect(promptSpy).toHaveBeenNthCalledWith(2,
      {
        type: 'list',
        name: 'existingAction',
        message: 'Choose from the following non-web actions to listen to events',
        choices: ['actionValidForEvents']
      })
  })

  test('select create new action name', async () => {
    promptSpy.mockResolvedValue({
      actionSelection: false
    })

    const runtimeActionName = await promptForRuntimeAction(eventsGenerator)
    expect(runtimeActionName).toContain('somepackage/test-runtime-action-name')
    expect(promptSpy).toHaveBeenNthCalledWith(1,
      {
        default: false,
        message: 'Do you want to use an existing non-web action for this registration? ( If not, you will be able to create a new action for IO Events )',
        name: 'actionSelection',
        type: 'confirm',
        when: true
      })
    expect(promptSpy).toHaveBeenCalledTimes(1)
  })

  test('skip selection of existing action when no non-web actions available', async () => {
    EventsGenerator.prototype.loadRuntimeManifest = jest.fn().mockReturnValue({
      runtimeManifest: mockData.data.runtimeManifestWithWebActions,
      runtimePackageName: 'somepackage'
    })
    promptSpy.mockResolvedValue({
      actionSelection: true
    })
    EventsGenerator.prototype.promptForActionName = jest.fn().mockReturnValue('test-runtime-action-name')
    eventsGenerator = new EventsGenerator()

    const runtimeActionName = await promptForRuntimeAction(eventsGenerator)
    expect(runtimeActionName).toContain('somepackage/test-runtime-action-name')
    expect(promptSpy).toHaveBeenCalledTimes(0)
  })
})
