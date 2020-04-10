<template>
	<div id="app">
		<swoosh-view class="view">
			<div class="card">
				<h2 class="section-name">Introduction</h2>
			</div>

			<div class="card">
				<h2 class="section-name">Details</h2>
			</div>

			<div class="card">
				<h2 class="section-name">Downloads</h2>
			</div>
		</swoosh-view>
	</div>
</template>

<style lang="stylus" scoped>
.view
	margin 1em
	box-sizing border-box

	.card
		padding 1em
		box-sizing border-box

		background ghostwhite

		.section-name
			color cornflowerblue

			font-family 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif

			&:before
				content '\00A7'

				margin-right 0.5em
</style>