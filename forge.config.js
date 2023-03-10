module.exports = {
  packagerConfig: {
    // This forces forge to only package already builded files
    ignore: ['^\\/public$', '^\\/src$', '^\\/node_modules$', '^\\/[.].+'],
    icon: 'public/brand/logo256-text',
    name: 'AymurAI',
    protocols: [
      {
        name: 'AymurAI',
        schemes: ['aymurai.app'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        mimeType: ['x-scheme-handler/aymurai.app'],
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
