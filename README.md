# generator-enyo

> [Yeoman](http://yeoman.io) generator


## Getting Started

### What is Yeoman?

Yeoman is a highly configurable command line scaffolding tool for modern webapps. It makes big tasks simpler and prettier, such as creating and modifying webapp templates.

Yeoman can be found on [npm](https://npmjs.org) package repository.  Using additional packages, known as Yeoman generators, Yeoman can create virtually any kind of appliaction, such as Enyo, Backbone, or even Chrome extensions.

```
npm install -g yo
```

### Enyo bootplate generator

This Enyo generator is a quick simple way to make an Enyo bootplate project.

To install generator-enyo from npm, run:

```
npm install -g generator-enyo
```

From there, creating a new projects is as simple as

```
yo enyo MyApp
```
An enyo bootplate, of the current release, will be created into the directory MyApp. Options are included to specify a particular build version, change to a particular mode configuration (onyx, moonstone, sampler, etc.) and more! The full list of options can be see via `yo enyo -h`

### All the bells and whistles

Beyond initial application creation, included are a number of subgenerators for post-creation usage, each with their own `-h` help messages outlining full options available.

  - `yo enyo:lib` is focused around adding and removing libraries, including remote ones on git repositories and bower packages
  - `yo enyo:update` will update Enyo and first-party Enyo libraries to the current stable release (or a specific release)
  - `yo enyo:deploy` deploys the bootplate project
  - `yo enyo:webos` adds the webOS specific components (appinfo.json primarily)

### Cordova integration

Among the bootplate creation options is the `--cordova` flag, which creates a Cordova 3.x project with an Enyo bootplate within. Enyo bootplate is hooked up and setup to build on any supported platform via normal [Cordova CLI](http://cordova.apache.org/) operations. Two handy Cordova project hooks are also provided. Whenever the Cordova `prepare` or `build` actions are used, these hooks run.

 - **enyo-deploy-hook.js** - runs the minification deploy script in the bootplate, and updates the www directory symlink to point towards the deployed webapp directory. This allows the minified webapp to be used as the content copied over to each platform's local www directory.
 - **enyo-deploy-cleanup-hook.js** - restores the www symlink to the original bootplate root after the prepare or build operator is completed

These are completely hands-off hooks that automate the bootplate minification/deploy process inline with the standard cordova-cli operation flow.

To skip the deploy process, using the uncompressed files for each platform, include the `--no-deploy` flag. For example:

    cordova build --no-deploy

##### Manual hook usage

While generator-enyo usage to make an Enyo bootplate Cordova project is preferred, given it automates the process, you can manually copy the hooks from this repository into any Cordova project for the same bootplate deploying effect.

 - common/hooks/enyo-deploy-hook.js to hooks/before_prepare/enyo-deploy-hook.js
 - common/hooks/enyo-deploy-cleanup-hook.js to hooks/after_prepare/enyo-deploy-cleanup-hook.js

If a bootplate is in the www directory, the hooks will run the deploy script. If a bootplate is in the project root, in a dedicated directory (for example "bootplate/"), and the www directory is empty or deleted, the hooks will detect this and setup the full smart deploying symlink technique mentioned above.

## License

Apache 2.0
