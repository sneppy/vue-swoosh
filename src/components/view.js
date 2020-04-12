import Card from './Card'

/**
 * Get correct axis
 */
const getAxis = (axis, def = {x: 1, y: 0}) => {
			
	switch (axis)
	{
		case 'x':
		case 'x+': return {x: +1, y: +0}
		case 'x-': return {x: -1, y: +0}
		case 'y':
		case 'y+': return {x: +0, y: +1}
		case 'y-': return {x: +0, y: -1}

		// Return object or default
		default: return axis || def
	}
}

/**
 * 
 */
export default {
	name: 'swoosh-view',

	props: {
		/// Swoosh options object
		options: {
			type: Object,
			required: false
		}
	},

	data() {

		return {
			/// Index of currently displayed card
			index: 0,

			/// Number of cards
			numCards: 0,

			/// Slider offset
			offset: 0,

			/// Content width
			contentSize: []
		}
	},

	computed: {		
		/**
		 * Return the target offset in pixels
		 */
		targetOffset() {
			
			return this.contentSize.slice(0, this.index).reduce((offset, {x: w, y: h}) => {

				return offset - (w * this.swipeAxis.x + h * this.swipeAxis.y)
			}, 0)
		},

		/**
		 * Return transform
		 */
		transform() {

			return {
				x: this.moveAxis.x * this.offset,
				y: this.moveAxis.y * this.offset
			}
		},

		/**
		 * 
		 */
		swipeAxis() {

			let axis = this.options && this.options.swipeAxis
			return getAxis(axis, {x: -1, y: 0})
		},

		/**
		 * 
		 */
		moveAxis() {

			let axis = this.options && this.options.moveAxis
			return getAxis(axis, this.swipeAxis)
		},

		/**
		 * Swipe sensitivity
		 */
		sensitivity() {

			let sensitivity = this.options && this.options.sensitivity
			return sensitivity ? 1 / sensitivity : 1
		}
	},

	methods: {
		/**
		 * Called when sweep action starts.
		 * Sets initial position and state.
		 */
		set(pos) {

			// Stop active animation
			if (this.snapAnim)
			{
				cancelAnimationFrame(this.snapAnim)
				this.snapAnim = null
			}

			// Register initial state
			this.currPos =
			this.prevPos =
			this.startPos = pos
			this.velocity = {x: 0, y: 0}
			this.speed = 0
			this.lockAxis = false
		},

		/**
		 * Called upon move event
		 */
		update(pos) {

			// Update position
			this.prevPos = this.currPos
			this.currPos = pos

			// Compute delta movement
			let dx = this.currPos.x - this.prevPos.x
			let dy = this.currPos.y - this.prevPos.y

			// Check lock on axis
			if (!this.lockAxis)
			{
				const size = Math.sqrt(dx * dx + dy * dy)
				const dot = (dx * this.swipeAxis.x + dy * this.swipeAxis.y) / size
				const threshold = 0.9

				this.lockAxis = dot > threshold || -dot > threshold
			}

			if (this.lockAxis)
			{
				// Update velocity
				let currTickTime = performance.now()
				let dt = (currTickTime - this.lastTickTime) / 1000.0 // Get in seconds
				this.lastTickTime = currTickTime

				this.velocity.x = dx / dt
				this.velocity.y = dy / dt
				this.speed = this.velocity.x * this.swipeAxis.x + this.velocity.y * this.swipeAxis.y

				// Update offset
				this.offset += dx * this.swipeAxis.x + dy * this.swipeAxis.y
			}
		},

		/**
		 * Terminates sweep, resets state, requests
		 * snap animation if necessary
		 */
		reset(pos) {

			// Compute final position
			let xf = this.offset

			if (this.speed > 0 || this.speed < 0)
			{
				// No need to simulate, just
				// a simple differential equation.
				// The deceleration is proportional
				// to the inverse of the velocity
				// magnitude:
				// a = -v
				// 
				// Which means that the variation
				// of the velocity is:
				// dv/dt = -v
				// 
				// We solve this differntial
				// equation and compute time
				// and position at whcih we come
				// to a complete stop, i.e.
				// |v| = 0
				// 
				// However, |v| = 0 => t = +inf,
				// Thus we define a final velocity
				// close to 0, e.g. j = 0.1

				const k = this.sensitivity
				const j = 0.1
				const kinv = 1 / k

				let v0 = Math.abs(this.speed)
				let x0 = this.offset
				let cx = x0 + kinv * this.speed
				let tf = kinv * Math.log(v0 / j)
				
				xf = -kinv * v0 * Math.exp(-k * tf) + cx
			}

			// Update current index
			this.maybeUpdateIndex(xf)

			// Reset state
			this.currPos
			this.prevPos
			this.startPos = null
			this.lockAxis = false

			// Play snap animation
			if (true) this.snapAnim = requestAnimationFrame(this.snap)
		},

		/**
		 * 
		 */
		maybeUpdateIndex(offset) {
			
			const {x: w, y: h} = this.contentSize[this.index]
			const margin = this.swipeAxis.x * w + this.swipeAxis.y * h
			const next = this.targetOffset - margin / 2
			const prev = this.targetOffset + margin / 2

			console.log(offset, next, prev)
			
				 if ((next > prev && offset > next) || (next < prev && offset < next)) this.index = Math.min(this.index + 1, this.numCards - 1)
			else if ((next > prev && offset < prev) || (next < prev && offset > prev)) this.index = Math.max(this.index - 1, 0)
		},

		/**
		 * 
		 */
		snap() {

			// TODO: Delta time between frames

			// Linear interpolate with current location
			const epsilon = 1
			const alpha = 0.3

			let dist = this.targetOffset - this.offset
			let done = dist > -epsilon && dist < epsilon // -eps < d < eps

			if (done)
			{
				// Finish animation
				this.offset = this.targetOffset
				this.snapAnim = null
			}
			else
			{
				// Move toward target
				this.offset += alpha * dist
				this.snapAnim = requestAnimationFrame(this.snap)
			}
		},

		/**
		 * 
		 */
		onTouchStart(ev) {
			
			let {changedTouches: [touch, ..._]} = ev
			let pos = {x: touch.screenX, y: touch.screenY}
			this.touchId = touch.identifier

			// Set inital position
			this.set(pos)
		},

		/**
		 * 
		 */
		onTouchMove(ev) {
			
			let {changedTouches: touches} = ev
			for (let touch of touches)
			{
				// Identify touch
				if (touch.identifier === this.touchId)
				{
					// Update state
					let pos = {x: touch.screenX, y: touch.screenY}
					this.update(pos)
				}
			}

			// Prevent scrolling
			if (this.lockAxis) ev.preventDefault()
		},
		
		/**
		 * 
		 */
		onTouchEnd(ev) {
			
			let {changedTouches: touches} = ev
			for (let touch of touches)
			{
				// Identify touch
				if (touch.identifier === this.touchId)
				{
					// Reset state
					let pos = {x: touch.screenX, y: touch.screenY}
					this.reset(pos)
				}
			}

			// Reset touch state
			this.touchId = null
		}
	},

	beforeCreate() {
		
		// Internal variables
		this.currPos = null
		this.prevPos = null
		this.lockAxis = true
		this.startPos = null
		this.velocity = {x: 0, y: 0}
		this.speed = 0
		this.snapAnim = null
		this.lastTickTime = performance.now()

		// Touch variables
		this.touchId = null
	},

	created() {

		// Get num slots
		this.numCards = this.$slots.default.length
	},

	mounted() {
		
		// Initialize elements
		this.cardElements = this.$slots.default.map((slot, i) => {

			// Set an id so that we can track
			// changes when the element is resized
			const el = slot.elm
			el.setAttribute('swoosh-id', i)

			return el
		})

		// Register observer
		this.sizeObserver = new ResizeObserver((entries) => {

			for (let {target} of entries)
			{
				const i = Number.parseInt(target.getAttribute('swoosh-id'))
				this.contentSize[i] = {x: target.offsetWidth, y: target.offsetHeight}
			}
		})
		this.cardElements.forEach((card) => this.sizeObserver.observe(card))
	},

	destroyed() {

		// Relase observer
		this.sizeObserver.disconnect()
	},

	/**
	 * Vue render function
	 */
	render(h) {
		
		// Get children
		let cards = this.$slots.default.map((child, i) => h(Card, {}, [child]))

		// Create slider
		let style = `transform: translate(${this.transform.x}px, ${this.transform.y}px);`
		let slider = h('div', {class: 'swoosh-slider', style}, cards)

		// Return element
		let on = {
			'touchstart': this.onTouchStart,
			'touchmove': this.onTouchMove,
			'touchend': this.onTouchEnd
		}
		return h('div', {class: 'swoosh-view', on}, [slider])
	}
}