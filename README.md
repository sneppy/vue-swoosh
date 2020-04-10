# Swoosh

![Swoooooosh](https://i.imgur.com/JOthKc2.gif)

Contributors
------------

- Sneppy @ [sneppy](https://github.com/sneppy)
- Me @ [sneppy](https://github.com/sneppy)
- Myself @ [sneppy](https://github.com/sneppy)

Basic usage
-----------

Install the plugin:

```bash
$ npm i @sneppy/vue-swoosh
```

In your entry point file, import the plugin and tell Vue to setup it up:

```javascript
import Vue from 'vue'
import Swoosh from '@sneppy/swoosh'

Vue.use(Swoosh)
```

The plugin registers the global component `swoosh-view` which can be used to create a carousel:

```vue
<template>
	<div id="app">
		<swoosh-view>
			<div class="section">
				<h2 class="section-name">Introduction</h2>
			</div>

			<div class="section">
				<h2 class="section-name">Details</h2>
			</div>

			<div class="section">
				<h2 class="section-name">Downloads</h2>
			</div>
		</swoosh-view>
	</div>
</template>
```

Right now the plugin is driven by HTML touch events, it will only work properly on devices that trigger the touch events (e.g. smartphones and tablets).

WIP