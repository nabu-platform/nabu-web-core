<template id="n-accordion">
	<div class="n-accordion" v-store:toggle="toggle">
		<div class="n-accordion-item" v-for="item in items" :class="{ 'active' : activated(item)}" v-store="item">
			<slot name="toggle">
				<button v-on:click="toggle(item)" class="n-accordion-button">{{ item.title }}</button>
			</slot>
			<div class="n-accordion-content">
				<slot></slot>
			</div>
		</div>
	</div>
</template>