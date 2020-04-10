import View from './components/view'

/**
 * TODO: documentation
 */
export class Swoosh
{
	/**
	 * Vue plugin install script
	 */
	static install(Vue, options)
	{
		if (this.bInstalled)
			// Don't install twice
			return
		
		this.bInstalled = true;

		// Process options
		const bHasOptions = options !== undefined
		if (!bHasOptions) options = Object.create(null)

		Vue.component('swoosh-view', View)
	}
}

export default Swoosh