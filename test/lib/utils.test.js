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

import * as utils from '../../lib/utils.js'
import eol from 'eol'

describe('atLeastOne', () => {
  test('returns true if input.length > 0', () => {
    expect(utils.atLeastOne([1])).toBe(true)
  })
  test('returns "please choose at least one option" if input.length === 0', () => {
    expect(utils.atLeastOne([])).toBe('please choose at least one option')
  })
})

describe('guessProjectName', () => {
  test('returns cwd if package.json does not exist', () => {
    const spy = vi.spyOn(process, 'cwd')
    spy.mockReturnValue('FAKECWD')
    expect(utils.guessProjectName({
      destinationPath: () => { },
      fs: {
        exists: () => false
      }
    })).toEqual('FAKECWD')
    spy.mockRestore()
  })

  test('returns cwd if package.json[name] is not defined', () => {
    const spy = vi.spyOn(process, 'cwd')
    spy.mockReturnValue('FAKECWD')
    expect(utils.guessProjectName({
      destinationPath: () => { },
      fs: {
        exists: () => true,
        readJSON: () => ({})
      }
    })).toEqual('FAKECWD')
    spy.mockRestore()
  })

  test('returns package.json[name] if package.json exists and has a name attribut', () => {
    expect(utils.guessProjectName({
      destinationPath: () => { },
      fs: {
        exists: () => true,
        readJSON: () => ({ name: 'FAKENAME' })
      }
    })).toEqual('FAKENAME')
  })
})

describe('addPkgScript', () => {
  test('adds scripts to package.json', () => {
    const mockRead = vi.fn(() => {
      return ({ name: 'bob', scripts: { scripta: 'a' } })
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: () => 'some-path',
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addPkgScript(generator, { scriptb: 'b' })

    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', expect.objectContaining({ name: 'bob', scripts: { scripta: 'a', scriptb: 'b' } }))
  })

  test('overwrites existing scripts package.json', () => {
    const mockRead = vi.fn(() => {
      return ({ name: 'bob', scripts: { scripta: 'a' } })
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: () => 'some-path',
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addPkgScript(generator, { scripta: 'b' })

    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', expect.objectContaining({ name: 'bob', scripts: { scripta: 'b' } }))
  })

  test('writes package.json if null', () => {
    const mockRead = vi.fn()
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: () => 'some-path',
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addPkgScript(generator, { scripta: 'b' })

    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', expect.objectContaining({ scripts: { scripta: 'b' } }))
  })
})

describe('readPackageJson', () => {
  test('if package.json is empty', () => {
    const mockRead = vi.fn(() => {
      return ''
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead
      }
    }
    expect(utils.readPackageJson(generator)).toEqual({})
    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
  })

  test('if package.json is { a: key, scripts: { b: c } }', () => {
    const mockRead = vi.fn(() => {
      return { a: 'key', scripts: { b: 'c' } }
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead
      }
    }
    expect(utils.readPackageJson(generator)).toEqual({ a: 'key', scripts: { b: 'c' } })
    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
  })
})

describe('writePackageJson', () => {
  test('if content is empty', () => {
    const mockWrite = vi.fn(() => {
      return ''
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        writeJSON: mockWrite
      }
    }
    utils.writePackageJson(generator, '')
    expect(mockWrite).toHaveBeenCalledWith('some-path', {})
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
  })

  test('if content is { a: key, scripts: { b: c } }', () => {
    const mockWrite = vi.fn(() => {
      return ''
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        writeJSON: mockWrite
      }
    }
    utils.writePackageJson(generator, { a: 'key', scripts: { b: 'c' } })
    expect(mockWrite).toHaveBeenCalledWith('some-path', { a: 'key', scripts: { b: 'c' } })
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
  })
})

describe('addDependencies', () => {
  test('adds dependencies to package.json with no existing dependencies', () => {
    const mockRead = vi.fn(() => {
      return undefined
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addDependencies(generator, { a: 'b', c: 'd' })

    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', { dependencies: { a: 'b', c: 'd' } })
  })
  test('adds devDependencies to package.json with no existing devDependencies', () => {
    const mockRead = vi.fn(() => {
      return undefined
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addDependencies(generator, { a: 'b', c: 'd' }, true)

    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', { devDependencies: { a: 'b', c: 'd' } })
  })
  test('adds and overwrites dependencies in package.json', () => {
    const mockRead = vi.fn(() => {
      return { dependencies: { a: 'fake', e: 'f' }, devDependencies: { g: 'h' } }
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addDependencies(generator, { a: 'b', c: 'd' })

    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', { dependencies: { a: 'b', c: 'd', e: 'f' }, devDependencies: { g: 'h' } })
  })

  test('adds and overwrites devDependencies in package.json', () => {
    const mockRead = vi.fn(() => {
      return { devDependencies: { a: 'fake', e: 'f' }, dependencies: { g: 'h' } }
    })
    const mockWrite = vi.fn()
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        readJSON: mockRead,
        writeJSON: mockWrite
      }
    }
    utils.addDependencies(generator, { a: 'b', c: 'd' }, true)

    expect(mockRead).toHaveBeenCalledWith('some-path')
    expect(mockRead).toHaveBeenCalledTimes(1)
    expect(generator.destinationPath).toHaveBeenCalledWith('package.json')
    expect(mockWrite).toHaveBeenCalledTimes(1)
    expect(mockWrite).toHaveBeenCalledWith('some-path', { devDependencies: { a: 'b', c: 'd', e: 'f' }, dependencies: { g: 'h' } })
  })

  test('appendStubVarsToDotenv existing label', () => {
    const mockRead = vi.fn(() => '# label')
    const mockExists = vi.fn(() => {
      return true
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        read: mockRead,
        append: vi.fn(),
        exists: mockExists
      }
    }

    utils.appendStubVarsToDotenv(generator, 'label', ['a', 'b', 'c'])
    expect(generator.fs.append).not.toHaveBeenCalled()
  })

  test('appendStubVarsToDotenv', () => {
    const mockRead = vi.fn(() => '')
    const mockExists = vi.fn(() => {
      return false
    })
    const generator = {
      destinationPath: vi.fn(() => 'some-path'),
      fs: {
        read: mockRead,
        append: vi.fn(),
        exists: mockExists
      }
    }

    utils.appendStubVarsToDotenv(generator, 'fake', ['a', 'b', 'c'])
    expect(generator.fs.append).toHaveBeenCalledWith('some-path', eol.auto(`## fake
#a=
#b=
#c=
`))
  })

  describe('writeMultiLayerKeyInObject', () => {
    let obj
    beforeEach(() => {
      obj = {
        test: 'somevalue',
        a: {
          b: {
            c: [{
              test1: 'fakevalue',
              test2: 'fakevalue'
            }]
          }
        }
      }
    })
    test('array value', () => {
      utils.writeMultiLayerKeyInObject(obj, 'a.b.c', [{ test: 'new value' }])
      expect(obj.a.b.c[1]).toEqual({ test: 'new value' })
    })
    test('object value', () => {
      utils.writeMultiLayerKeyInObject(obj, 'a.b.d', { test: 'new value' })
      expect(obj.a.b.d).toEqual({ test: 'new value' })
    })
    test('string value', () => {
      utils.writeMultiLayerKeyInObject(obj, 'a.d.a', 'new value')
      expect(obj.a.d.a).toEqual('new value')
    })
  })
})
test('writeKeyAppConfig', () => {
  const generator = {
    destinationPath: vi.fn(() => 'some-path'),
    fs: {
      exists: vi.fn().mockReturnValue(true),
      write: vi.fn(),
      read: vi.fn().mockReturnValue('{}')
    }
  }
  utils.writeKeyAppConfig(generator, 'key', 'value')
  expect(generator.destinationPath).toHaveBeenCalledWith('app.config.yaml')
})
test('readYAMLConfig, configPath doesnt exists', () => {
  const generator = {
    destinationPath: vi.fn(() => 'some-path'),
    fs: {
      exists: vi.fn().mockImplementationOnce(() => false),
      write: vi.fn(),
      read: vi.fn()
    }
  }
  expect(utils.readYAMLConfig(generator, 'some-path')).toStrictEqual({})
})

test('appendVarsToDotenv without previous content', () => {
  const mockRead = vi.fn(() => '')
  const mockExists = vi.fn(() => {
    return false
  })
  const generator = {
    destinationPath: vi.fn(() => 'some-path'),
    fs: {
      read: mockRead,
      append: vi.fn(),
      exists: mockExists,
      write: vi.fn()
    }
  }

  utils.appendVarsToDotenv(generator, 'fake', 'variable-a', 'value-a')
  expect(generator.fs.append).toHaveBeenCalledWith('some-path', eol.auto(`## fake
variable-a=value-a
`))
})

test('appendVarsToDotenv with previous content', () => {
  const mockRead = vi.fn(() => 'variable-a=value-a')
  const mockExists = vi.fn(() => {
    return true
  })
  const generator = {
    destinationPath: vi.fn(() => 'some-path'),
    fs: {
      read: mockRead,
      append: vi.fn(),
      exists: mockExists,
      write: vi.fn()
    }
  }

  utils.appendVarsToDotenv(generator, 'fake', 'variable-a', 'value-a,value-b')
  expect(generator.fs.write).toHaveBeenCalledTimes(1)
  expect(generator.fs.append).toHaveBeenCalledTimes(0)
  expect(generator.fs.write).toHaveBeenCalledWith('some-path', eol.auto(`variable-a=value-a,value-b
`))
})
