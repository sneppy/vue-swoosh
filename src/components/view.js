import Card from './Card'

/**
 * 
 */
const getTouchLocation = ({screenX, screenY}) => [screenX, screenY]

/**
 * 
 */
const dot = (a, b) =>  a.x * b.x + a.y * b.y

/**
 * 
 */
const getSize = (v) => Math.sqrt(dot(v, v))

/**
 * 
 */
const getNormal = (v) => {

	const size = getSize(v)
	return {x: v.x / size, y: v.y / size}
}

/**
 * 
 */
export default {
	name: 'swoosh-view',

	data() {

		return {
			/// Index of currently displayed card
			index: 0,

			/// Number of cards
			numCards: 0,

			/// Slider offset
			offset: 0,

			/// Slider transform string
			sliderTransform: '',

			/// Content width
			contentWidth: [],

			/// Scroll on card change flag
			scrollOnChange: false
		}
	},

	computed: {
		/**
		 * Return the target offset in pixels
		 */
		targetOffset() {
			
			return this.contentWidth.slice(0, this.index).reduce((offset, w) => offset - w, 0)
		}
	},

	methods: {
		/**
		 * 
		 */
		getTouch(touches) {

			let touch = null
			for (let i = 0; !touch; ++i)
			{
				const id = touches[i].identifier

				if (id === this.touchStartLoc.id)
				{
					const [x, y] = getTouchLocation(touches[i])
					touch = {x, y, id}
					break
				}
			}

			return touch
		},

		/**
		 * 
		 */
		toggleBodyScroll(lock = true) {

			// Lock or unlock window scrolling
			const body = document.getElementsByTagName('body')[0]
			body.style.overflow = lock ? 'hidden' : 'auto'
		},

		/**
		 * 
		 */
		onTouchStart({changedTouches: [touch]}) {

			// Stop any tick instance
			if (this.snapInstance)
			{
				cancelAnimationFrame(this.snapInstance)
				this.snapInstance = null
			}
			
			if (this.lockX || !this.touchStartLoc)
			{
				const [x, y] = getTouchLocation(touch)
				const id = touch.identifier

				// Reset lock
				this.lockX = true

				// Reset touch
				this.touchStartLoc =
				this.touchCurrLoc = {x, y, id}

				this.touchVelocity = {x: 0, y: 0}
			}
		},

		/**
		 * 
		 */
		onTouchMove({changedTouches: [...touches]}) {
			
			const touch = this.getTouch(touches)

			this.touchPrevLoc = this.touchCurrLoc
			this.touchCurrLoc = touch

			const touchDelta = {
				x: this.touchCurrLoc.x - this.touchPrevLoc.x,
				y: this.touchCurrLoc.y - this.touchPrevLoc.y
			}

			// Update velocity
			this.touchVelocity.x = touchDelta.x
			this.touchVelocity.y = touchDelta.y

			// Update lock
			if (this.lockX && Math.abs(dot(getNormal(this.touchVelocity), {x: 1, y: 0})) > 0.9)
			{
				this.lockX = false
				this.toggleBodyScroll(true)
			}

			// Update offset
			if (!this.lockX) this.offset += touchDelta.x
		},
		
		/**
		 * 
		 */
		onTouchEnd({changedTouches: [...touches]}) {

			// Reset start location and lock
			if (!this.lockX)
			{
				this.lockX = true
				this.toggleBodyScroll(false)
			}

			this.touchStartLoc = null

			// Compute threshold
			const threshold = this.targetOffset

			// Add half current card width
			const next = threshold - this.contentWidth[this.index] / 3
			const prev = threshold + this.contentWidth[this.index] / 3
			
			// Compute final position
			let xf = this.offset.x
			if (this.touchVelocity.x != 0)
			{
				const k = 0.5
				const j = 0.1

				const kinv = 1 / k
				const d = Math.sign(this.touchVelocity.x)
				const v0 = Math.abs(this.touchVelocity.x)
				const x0 = this.offset
				const cv = Math.log(v0)
				const cx = x0 + d * kinv * v0
				const tf = kinv * Math.log(v0 / j)
				
				xf = -kinv * Math.exp(-k * tf) * cv + cx
			}

			// Update index
			this.prevIndex = this.index
			
			if (xf < next)
				// Next card
				this.index = Math.min(this.index + 1, this.numCards - 1)
			else if (xf > prev)
				// Previous card
				this.index = Math.max(this.index - 1, 0)

			// Animate
			this.lastTickTime = performance.now()
			this.snapInstance = requestAnimationFrame(this.snap)
		},

		/**
		 * 
		 */
		snap(tickTime) {

			const dt = (tickTime - this.lastTickTime) * 0.001 // Millis to seconds
			this.lastTickTime = tickTime
			
			// When done, terminate animation
			let done = true

			// Linear interpolate with current location
			const epsilon = 1
			const alpha = 0.3
			this.offset += alpha * (this.targetOffset - this.offset)
			done = done && Math.abs(this.offset - this.targetOffset) < epsilon

			// Scroll to top
			const shouldScroll = this.prevIndex !== this.index && this.scrollOnChange
			if (shouldScroll)
			{
				console.log(this.prevIndex, this.index)
				window.scrollBy(0, 0.4 * alpha * -window.scrollY)
				done = done && window.scrollY < epsilon
			}

			if (done)
			{
				// Finish animation
				this.offset = this.targetOffset
				if (shouldScroll) window.scrollTo(0, 0)

				this.snapInstance = null
			}
			else this.snapInstance = requestAnimationFrame(this.snap)
		}
	},

	created() {
		
		this.prevIndex = this.index
		this.lockX = true
		this.touchStartLoc = null
		this.touchVelocity = {x: 0, y: 0}
		this.snapInstance = null
		this.lastTickTime = performance.now()

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

			for (let {target, contentRect} of entries)
			{
				const i = Number.parseInt(target.getAttribute('swoosh-id'))
				this.contentWidth[i] = target.offsetWidth
			}
		})
		this.cardElements.forEach((card) => this.sizeObserver.observe(card))
	},

	destroy() {

		// Relase observer
		this.sizeObserver.disconnect()
	},

	/**
	 * Vue render function
	 */
	render(h) {
		
		// Get children
		let width = 0
		let scale = new Array(this.$slots.default.length).fill(1)
		if (false)
		{
			scale = this.contentWidth.map((w) => {

				let x = (this.offset - width) / w
				width -= w

				console.log()

				return 0.9 + 0.1 * Math.exp(-x * x)
			})
		}
		let cards = this.$slots.default.map((child, i) => h(Card, {style: `transform: scale(${scale[i]});`}, [child]))

		// Create slider
		let style = `transform: translate(${this.offset}px, 0px);`
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