const discover = require('../../lib/discover')
const path = require('path')

describe('discover', () => {
  const expected = {
    addAction: {
      assetCompute: {}
    },
    extension: {},
    resource: [{
      children: [{ name: 'image.png' }, { name: 'image1.png' }],
      name: 'images'
    },
    { name: 'someResource.json' }
    ]
  }

  test('it works', () => {
    const templatesPath = path.resolve('./test/__fixtures__/templates')
    expect(discover(templatesPath)).toEqual(expected)
  })
})
